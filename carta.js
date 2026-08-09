/* =========================================================
   Bar Cervecería — carta online
   - Bilingüe ES / EN. Solo el texto es bilingüe; precio,
     alérgenos e id no dependen del idioma.
   - Jerarquía: secciones > grupos > ítems, plegable.
   - El JSON solo guarda NOMBRES de alérgenos; aquí se
     traducen a icono y etiqueta.
   ========================================================= */

const RUTA_JSON = 'carta.json';
const CLAVE_IDIOMA = 'barCerveceria.idioma';

/* ---------- Estadísticas de uso (opcional) ----------
   Cambia esta URL por la de tu Worker cuando lo despliegues.
   Si se deja vacía, la carta funciona igual pero no envía nada. */
const ENDPOINT_EVENTOS = ''; // p.ej. 'https://estadisticas-bar-cerveceria.TU-USUARIO.workers.dev/evento'

function registrarEvento(tipo, valor) {
  if (!ENDPOINT_EVENTOS) return;
  try {
    const cuerpo = JSON.stringify({ tipo, valor });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT_EVENTOS, new Blob([cuerpo], { type: 'application/json' }));
    } else {
      fetch(ENDPOINT_EVENTOS, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: cuerpo, keepalive: true })
        .catch(() => {});
    }
  } catch {
    // Un fallo al registrar estadísticas nunca debe afectar a la carta.
  }
}

/* ---------- Textos fijos de la interfaz (no salen del JSON) ---------- */
const UI = {
  es: {
    cargando: 'Cargando la carta…',
    errorCargar: 'No se ha podido cargar la carta',
    alergenosTitulo: 'Alérgenos',
    alergenosAyuda: 'Marca los que quieras evitar y te avisamos en cada plato. Consulta siempre al personal ante una alergia grave.',
    limpiar: 'Quitar todos los avisos',
    sinAlergenos: 'Sin alérgenos declarados',
    contiene: 'Contiene',
    actualizadoPre: 'Precios actualizados el',
    ivaNota: 'IVA incluido. Los precios pueden variar sin previo aviso.',
    unidades: (n) => `${n} ${n === 1 ? 'plato' : 'platos'}`
  },
  en: {
    cargando: 'Loading the menu…',
    errorCargar: 'The menu could not be loaded',
    alergenosTitulo: 'Allergens',
    alergenosAyuda: 'Tap the ones you want to avoid and we will flag them on each dish. Always ask our staff about serious allergies.',
    limpiar: 'Clear all warnings',
    sinAlergenos: 'No declared allergens',
    contiene: 'Contains',
    actualizadoPre: 'Prices updated on',
    ivaNota: 'VAT included. Prices may change without notice.',
    unidades: (n) => `${n} ${n === 1 ? 'item' : 'items'}`
  }
};

/* ---------- Catálogo de alérgenos (14 de declaración obligatoria) ---------- */
const ALERGENOS = {
  'gluten':       { es: 'Cereales con gluten', en: 'Cereals with gluten',
    icono: '<path d="M12 21V6"/><path d="M12 12c-2.4 0-4-1.6-4-4 2.4 0 4 1.6 4 4Z"/><path d="M12 12c2.4 0 4-1.6 4-4-2.4 0-4 1.6-4 4Z"/><path d="M12 17c-2.4 0-4-1.6-4-4 2.4 0 4 1.6 4 4Z"/><path d="M12 17c2.4 0 4-1.6 4-4-2.4 0-4 1.6-4 4Z"/>' },
  'crustaceos':   { es: 'Crustáceos', en: 'Crustaceans',
    icono: '<path d="M17 6c-5 0-9 3.4-9 7.5 0 2.6 1.8 4.5 4.2 4.5 2 0 3.3-1.3 3.3-2.9 0-1.4-1-2.4-2.3-2.4"/><path d="M17 6c1.7 0 2.9.9 3.5 2.2"/><path d="M8 13.6 4.2 16M8.7 16.2 5.2 18.8"/>' },
  'huevos':       { es: 'Huevos', en: 'Eggs',
    icono: '<path d="M12 3.5c3.3 0 6 4.2 6 8.2 0 4-2.7 7.3-6 7.3s-6-3.3-6-7.3c0-4 2.7-8.2 6-8.2Z"/><circle cx="12" cy="12.4" r="2.6"/>' },
  'pescado':      { es: 'Pescado', en: 'Fish',
    icono: '<path d="M4.5 12c2.8-3.8 6-5.6 9.3-5.6 2.6 0 4.6 1 6.2 2.6-1 1.2-1 4.8 0 6-1.6 1.6-3.6 2.6-6.2 2.6-3.3 0-6.5-1.8-9.3-5.6Z"/><path d="M4.5 12 8 9.4M4.5 12 8 14.6"/><circle cx="16.8" cy="10.6" r=".9" fill="currentColor" stroke="none"/>' },
  'cacahuetes':   { es: 'Cacahuetes', en: 'Peanuts',
    icono: '<path d="M12 4.4c2.3 0 4 1.7 4 3.8 0 1.5-.9 2.3-.9 3.8s.9 2.3.9 3.8c0 2.1-1.7 3.8-4 3.8s-4-1.7-4-3.8c0-1.5.9-2.3.9-3.8S8 9.7 8 8.2c0-2.1 1.7-3.8 4-3.8Z"/>' },
  'soja':         { es: 'Soja', en: 'Soya',
    icono: '<path d="M6 17.5c-1.6-1.6-1.6-4.2 0-5.8l6-6c1.6-1.6 4.2-1.6 5.8 0 1.6 1.6 1.6 4.2 0 5.8l-6 6c-1.6 1.6-4.2 1.6-5.8 0Z"/><circle cx="9.4" cy="14.6" r="1.5"/><circle cx="14.6" cy="9.4" r="1.5"/>' },
  'lacteos':      { es: 'Lácteos', en: 'Milk',
    icono: '<path d="M8 9.5h8V20H8z"/><path d="M8 9.5 9.9 4h4.2L16 9.5"/><path d="M8 13.4h8"/>' },
  'frutos-secos': { es: 'Frutos de cáscara', en: 'Tree nuts',
    icono: '<path d="M12 3.8c3.5 0 6.5 3.6 6.5 8 0 4.6-3 8.4-6.5 8.4S5.5 16.4 5.5 11.8c0-4.4 3-8 6.5-8Z"/><path d="M12 20.2V6.6"/><path d="M12 12.6c1.5-1.6 3.1-2.5 4.7-2.7M12 12.6c-1.5-1.6-3.1-2.5-4.7-2.7"/>' },
  'apio':         { es: 'Apio', en: 'Celery',
    icono: '<path d="M8.3 21c-.7-4.5-.6-9 .5-13.4M12 21c0-5 .1-10 .6-13.9M15.7 21c.7-4.5.6-9-.5-13.4"/>' },
  'mostaza':      { es: 'Mostaza', en: 'Mustard',
    icono: '<path d="M9 21h6a1.5 1.5 0 0 0 1.5-1.5V11a4.5 4.5 0 0 0-3-4.2V4.5h-3v2.3A4.5 4.5 0 0 0 7.5 11v8.5A1.5 1.5 0 0 0 9 21Z"/><path d="M7.5 13.4h9"/>' },
  'sesamo':       { es: 'Sésamo', en: 'Sesame',
    icono: '<ellipse cx="8.5" cy="9" rx="2" ry="3.1" transform="rotate(-25 8.5 9)"/><ellipse cx="15.6" cy="10.6" rx="2" ry="3.1" transform="rotate(22 15.6 10.6)"/><ellipse cx="11.6" cy="16.4" rx="2" ry="3.1" transform="rotate(-8 11.6 16.4)"/>' },
  'sulfitos':     { es: 'Sulfitos', en: 'Sulphites',
    icono: '<path d="M7.5 3.5h9l-.8 6a3.7 3.7 0 0 1-7.4 0Z"/><path d="M12 15.3V20"/><path d="M8.6 20h6.8"/>' },
  'altramuces':   { es: 'Altramuces', en: 'Lupin',
    icono: '<circle cx="9" cy="8.8" r="3.2"/><circle cx="15.4" cy="11.6" r="3.2"/><circle cx="10.4" cy="16.2" r="3.2"/>' },
  'moluscos':     { es: 'Moluscos', en: 'Molluscs',
    icono: '<path d="M12 20c-4.4 0-8-3.4-8-7.6C4 8 7.6 4 12 4s8 4 8 8.4c0 4.2-3.6 7.6-8 7.6Z"/><path d="M12 20V4M12 20 7.1 6.7M12 20l4.9-13.3"/>' }
};

const ICONO_DESCONOCIDO = '<circle cx="12" cy="12" r="8.5"/><path d="M9.8 9.4a2.3 2.3 0 1 1 2.9 2.2c-.5.2-.7.6-.7 1.1v.6"/><circle cx="12" cy="16.4" r=".9" fill="currentColor" stroke="none"/>';

/* ---------- Estado ---------- */
const app = {
  datos: null,
  idioma: 'es',
  idiomas: ['es'],   // se rellena al cargar el JSON
  evitar: new Set(),
  seccionesAbiertas: new Set(),
  gruposAbiertos: new Set()
};

/* Idiomas disponibles: los que declare el JSON en negocio.idiomas,
   o, si no los declara, se deducen de la forma de los textos. */
function detectarIdiomas(datos) {
  const declarados = datos?.negocio?.idiomas;
  if (Array.isArray(declarados) && declarados.length) {
    return declarados.map((x) => String(x).toLowerCase());
  }
  const claves = new Set();
  const mirar = (v) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.keys(v).forEach((k) => claves.add(k));
    }
  };
  mirar(datos?.negocio?.lema);
  (datos?.secciones ?? []).forEach((s) => {
    mirar(s.nombre);
    (s.grupos ?? []).forEach((g) => {
      mirar(g.nombre);
      (g.items ?? []).forEach((it) => { mirar(it.nombre); mirar(it.descripcion); });
    });
  });
  const lista = [...claves];
  lista.sort((a, b) => (a === 'es' ? -1 : b === 'es' ? 1 : a.localeCompare(b)));
  return lista.length ? lista : ['es'];
}

const $ = (s) => document.querySelector(s);

/* ---------- Utilidades ---------- */

// Devuelve el texto en el idioma activo, con respaldo al español,
// y tolera que el campo sea un texto plano en vez de un objeto {es,en}.
function t(campo) {
  if (campo == null) return '';
  if (typeof campo === 'string') return campo;
  return campo[app.idioma] || campo.es || campo.en || '';
}

function ui() { return UI[app.idioma] || UI.es; }

function euros(precio) {
  const loc = app.idioma === 'en' ? 'en-IE' : 'es-ES';
  return new Intl.NumberFormat(loc, { style: 'currency', currency: 'EUR' }).format(Number(precio) || 0);
}

function escapar(x) {
  return String(x ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function normalizar(nombre) {
  return String(nombre ?? '').trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s_]+/g, '-');
}

function datosAlergeno(nombre) {
  const clave = normalizar(nombre);
  const ficha = ALERGENOS[clave];
  return {
    clave,
    etiqueta: ficha ? (ficha[app.idioma] || ficha.es) : nombre,
    icono: ficha ? ficha.icono : ICONO_DESCONOCIDO
  };
}

function svg(contenido) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
    aria-hidden="true">${contenido}</svg>`;
}

/* ---------- Carga ---------- */

async function cargar() {
  const estado = $('#estado');
  try {
    const r = await fetch(RUTA_JSON, { cache: 'no-store' });
    if (!r.ok) throw new Error(`${r.status}`);
    app.datos = await r.json();
    // Compatibilidad: si el JSON viene sin secciones pero con grupos sueltos,
    // los envolvemos en una sección para no romper el pintado.
    if (!app.datos.secciones && app.datos.grupos) {
      app.datos.secciones = [{ id: 's-general', nombre: { es: '', en: '' }, grupos: app.datos.grupos }];
    }
    app.idiomas = detectarIdiomas(app.datos);
    if (!app.idiomas.includes(app.idioma)) app.idioma = app.idiomas[0];
    pintarTodo();
    registrarEvento('vista', 'carta');
    registrarEvento('idioma', app.idioma); // incluye el idioma detectado al entrar
  } catch (e) {
    estado.className = 'estado estado--error';
    estado.textContent = `${ui().errorCargar} (${e.message}).`;
  }
}

/* ---------- Pintado ---------- */

function pintarTodo() {
  pintarTextosFijos();
  pintarNegocio();
  pintarSecciones();
  pintarLeyenda();
  document.documentElement.lang = app.idioma;

  // Selector de idioma: solo si hay más de un idioma disponible.
  const selector = document.querySelector('.idioma');
  if (selector) {
    selector.hidden = app.idiomas.length < 2;
    selector.querySelectorAll('.idioma__btn').forEach((b) => {
      b.hidden = !app.idiomas.includes(b.dataset.idioma);
      b.setAttribute('aria-pressed', b.dataset.idioma === app.idioma);
    });
  }
}

function pintarTextosFijos() {
  const dic = ui();
  document.querySelectorAll('[data-t]').forEach((el) => {
    const clave = el.dataset.t;
    if (clave === 'nombre' || clave === 'lema') return; // salen del JSON
    if (typeof dic[clave] === 'string') el.textContent = dic[clave];
  });
}

function pintarNegocio() {
  const n = app.datos.negocio ?? {};
  $('[data-t="nombre"]').textContent = n.nombre ?? 'Bar Cervecería';
  $('[data-t="lema"]').textContent = t(n.lema);
  document.title = n.nombre ?? 'Carta';

  if (n.actualizado) {
    const loc = app.idioma === 'en' ? 'en-GB' : 'es-ES';
    $('[data-campo="actualizado"]').textContent =
      new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'long', year: 'numeric' })
        .format(new Date(n.actualizado));
  }
}

function pintarSecciones() {
  const html = app.datos.secciones.map((sec) => {
    const abierta = app.seccionesAbiertas.has(sec.id);
    return `
      <section class="seccion">
        <button class="seccion__cabecera" aria-expanded="${abierta}"
                data-seccion="${escapar(sec.id)}">
          <span>${escapar(t(sec.nombre))}</span>
          <span class="seccion__signo" aria-hidden="true"></span>
        </button>
        <div class="seccion__cuerpo" ${abierta ? '' : 'hidden'}>
          ${(sec.grupos ?? []).map(pintarGrupo).join('')}
        </div>
      </section>`;
  }).join('');

  $('#carta').innerHTML = html;
}

function pintarGrupo(grupo) {
  const abierto = app.gruposAbiertos.has(grupo.id);
  const n = (grupo.items ?? []).length;
  return `
    <div class="grupo">
      <button class="grupo__cabecera" aria-expanded="${abierto}"
              data-grupo="${escapar(grupo.id)}">
        <span>${escapar(t(grupo.nombre))}</span>
        <span class="grupo__conteo">${ui().unidades(n)}</span>
      </button>
      <div class="grupo__cuerpo" ${abierto ? '' : 'hidden'}>
        ${(grupo.items ?? []).map(pintarItem).join('')}
      </div>
    </div>`;
}

function pintarItem(item) {
  const alergenos = Array.isArray(item.alergenos) ? item.alergenos : [];
  const fichas = alergenos.map(datosAlergeno);
  const enConflicto = fichas.filter((f) => app.evitar.has(f.clave));

  const listaFichas = fichas.length
    ? `<ul class="item__alergenos">
        ${fichas.map((f) => `
          <li class="ficha ${app.evitar.has(f.clave) ? 'ficha--evitar' : ''}"
              role="img" aria-label="${ui().contiene} ${escapar(f.etiqueta.toLowerCase())}"
              title="${escapar(f.etiqueta)}">${svg(f.icono)}</li>`).join('')}
      </ul>`
    : `<span class="item__sin-alergenos">${ui().sinAlergenos}</span>`;

  const aviso = enConflicto.length
    ? `<p class="item__aviso">${ui().contiene} ${
        enConflicto.map((f) => escapar(f.etiqueta.toLowerCase())).join(', ')
      }</p>`
    : '';

  return `
    <article class="item ${enConflicto.length ? 'item--evitar' : ''}">
      <div class="item__linea">
        <h3 class="item__nombre">${escapar(t(item.nombre))}</h3>
        <span class="item__guia"></span>
        <span class="item__precio">${euros(item.precio)}</span>
      </div>
      ${t(item.descripcion) ? `<p class="item__descripcion">${escapar(t(item.descripcion))}</p>` : ''}
      ${listaFichas}
      ${aviso}
    </article>`;
}

function pintarLeyenda() {
  const presentes = new Set();
  app.datos.secciones.forEach((s) =>
    (s.grupos ?? []).forEach((g) =>
      (g.items ?? []).forEach((i) =>
        (i.alergenos ?? []).forEach((a) => presentes.add(normalizar(a))))));

  const orden = Object.keys(ALERGENOS).filter((c) => presentes.has(c));
  [...presentes].forEach((c) => { if (!orden.includes(c)) orden.push(c); });

  $('#leyenda').innerHTML = orden.map((clave) => {
    const f = datosAlergeno(clave);
    return `
      <li>
        <button class="alergenos__boton" type="button"
                data-alergeno="${escapar(clave)}"
                aria-pressed="${app.evitar.has(clave)}">
          ${svg(f.icono)}<span>${escapar(f.etiqueta)}</span>
        </button>
      </li>`;
  }).join('');
}

/* ---------- Interacción ---------- */

document.addEventListener('click', (ev) => {
  const t0 = ev.target;

  // Cambiar idioma
  const btnIdioma = t0.closest('[data-idioma]');
  if (btnIdioma) {
    app.idioma = btnIdioma.dataset.idioma;
    try { localStorage.setItem(CLAVE_IDIOMA, app.idioma); } catch {}
    pintarTodo();
    registrarEvento('idioma', app.idioma);
    return;
  }

  // Plegar / desplegar sección
  const cabSeccion = t0.closest('[data-seccion]');
  if (cabSeccion) {
    const id = cabSeccion.dataset.seccion;
    if (app.seccionesAbiertas.has(id)) {
      app.seccionesAbiertas.delete(id);
    } else {
      app.seccionesAbiertas.add(id);
      registrarEvento('seccion', id);
    }
    pintarSecciones();
    return;
  }

  // Plegar / desplegar grupo
  const cabGrupo = t0.closest('[data-grupo]');
  if (cabGrupo) {
    const id = cabGrupo.dataset.grupo;
    if (app.gruposAbiertos.has(id)) {
      app.gruposAbiertos.delete(id);
    } else {
      app.gruposAbiertos.add(id);
      registrarEvento('grupo', id);
    }
    pintarSecciones();
    return;
  }

  // Marcar / desmarcar alérgeno a evitar
  const btnAlergeno = t0.closest('[data-alergeno]');
  if (btnAlergeno) {
    const clave = btnAlergeno.dataset.alergeno;
    if (app.evitar.has(clave)) {
      app.evitar.delete(clave);
    } else {
      app.evitar.add(clave);
      registrarEvento('alergeno', clave);
    }
    pintarSecciones();
    pintarLeyenda();
    $('#limpiarFiltros').hidden = app.evitar.size === 0;
    return;
  }

  if (t0.id === 'limpiarFiltros') {
    app.evitar.clear();
    pintarSecciones();
    pintarLeyenda();
    $('#limpiarFiltros').hidden = true;
  }
});

/* ---------- Arranque: idioma guardado o el del navegador ---------- */
(function idiomaInicial() {
  let guardado = null;
  try { guardado = localStorage.getItem(CLAVE_IDIOMA); } catch {}
  if (guardado === 'es' || guardado === 'en') {
    app.idioma = guardado;
  } else if ((navigator.language || '').toLowerCase().startsWith('en')) {
    app.idioma = 'en';
  }
})();

cargar();
