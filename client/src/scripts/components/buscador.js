/* Buscador global */

/* Estilo crítico inline */
const _criticalStyle = document.createElement('style');
_criticalStyle.textContent = '.buscador-barra:not(.activo){transform:translateY(-110%);opacity:0;visibility:hidden}' +
                              '.buscador-overlay:not(.activo){opacity:0;visibility:hidden}';
document.head.prepend(_criticalStyle);

/* Auto-inject CSS */
const _cssLink = document.createElement('link');
_cssLink.rel = 'stylesheet';
_cssLink.href = '/src/styles/components/buscador.css';
document.head.appendChild(_cssLink);

const SVG_LUPA = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 33 33" fill="none" stroke-width="2" stroke-linecap="round">
    <circle cx="14" cy="14" r="8.5"/>
    <line x1="20.5" y1="20.5" x2="27" y2="27"/>
</svg>`;

const SVG_CERRAR = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
</svg>`;

let _abierto = false;

document.addEventListener('DOMContentLoaded', () => {
    /* Inyectar HTML */
    document.body.insertAdjacentHTML('afterbegin', `
        <div class="buscador-overlay" id="buscadorOverlay"></div>
        <div class="buscador-barra" id="buscadorBarra" role="search">
            <div class="buscador-interior">
                <div class="buscador-icono-lupa" aria-hidden="true">${SVG_LUPA}</div>
                <input
                    class="buscador-input"
                    id="buscadorInput"
                    type="search"
                    placeholder="Buscar productos..."
                    autocomplete="off"
                    spellcheck="false"
                    aria-label="Buscar productos"
                >
                <span class="buscador-count oculto" id="buscadorCount"></span>
                <button class="buscador-cerrar" id="buscadorCerrar" aria-label="Cerrar buscador">
                    ${SVG_CERRAR}
                </button>
            </div>
        </div>
    `);

    _initEventos();

    /* Soporte para query en URL (solo en páginas que no sean tienda;
       tienda.js ya aplica el filtro directamente desde la URL) */
    const urlQ = new URLSearchParams(window.location.search).get('q');
    if (urlQ && !window.location.pathname.includes('/tienda/')) {
        setTimeout(() => abrirBuscador(urlQ), 120);
    }
});

/* Escuchar actualizaciones de resultados */
document.addEventListener('buscador:resultados', (e) => {
    const count = document.getElementById('buscadorCount');
    if (!count) return;

    const n = e.detail?.total ?? null;
    if (_abierto && n !== null) {
        count.textContent = `${n} producto${n !== 1 ? 's' : ''}`;
        count.classList.remove('oculto');
    } else {
        count.classList.add('oculto');
    }
});

function _initEventos() {
    /* Lupa desktop (nav-right) */
    const lupaSpan = document.querySelector('.nav-right .icon:first-child');
    if (lupaSpan) {
        lupaSpan.style.cursor = 'pointer';
        lupaSpan.addEventListener('click', (e) => {
            e.stopPropagation();
            _abierto ? cerrarBuscador() : abrirBuscador();
        });
    }

    /* Lupa mobile (nav-mobile-left) */
    const lupaMobile = document.getElementById('btnBuscadorMobile');
    if (lupaMobile) {
        lupaMobile.style.cursor = 'pointer';
        lupaMobile.addEventListener('click', (e) => {
            e.stopPropagation();
            _abierto ? cerrarBuscador() : abrirBuscador();
        });
    }

    document.getElementById('buscadorCerrar')
        .addEventListener('click', cerrarBuscador);

    document.getElementById('buscadorOverlay')
        .addEventListener('click', cerrarBuscador);

    const input = document.getElementById('buscadorInput');

    input.addEventListener('input', () => {
        document.dispatchEvent(new CustomEvent('buscador:query', {
            detail: { query: input.value }
        }));
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cerrarBuscador();
            return;
        }
        if (e.key === 'Enter') {
            const q = input.value.trim();
            if (!q) return;
            if (window.location.pathname.includes('/tienda/')) {
                /* Ya en tienda: cerrar la barra y dejar los resultados visibles */
                cerrarBuscador(false);
            } else {
                /* En otra página: navegar a tienda con la query */
                window.location.href = `/src/pages/tienda/tienda.html?q=${encodeURIComponent(q)}`;
            }
        }
    });
}

/* API pública */
export function abrirBuscador(query = '') {
    const barra   = document.getElementById('buscadorBarra');
    const overlay = document.getElementById('buscadorOverlay');
    const input   = document.getElementById('buscadorInput');
    if (!barra) return;

    if (query) {
        input.value = query;
        document.dispatchEvent(new CustomEvent('buscador:query', { detail: { query } }));
    }

    barra.classList.add('activo');
    overlay.classList.add('activo');
    _abierto = true;

    setTimeout(() => input.focus(), 40);
}

export function cerrarBuscador(limpiar = true) {
    const barra   = document.getElementById('buscadorBarra');
    const overlay = document.getElementById('buscadorOverlay');
    const input   = document.getElementById('buscadorInput');
    if (!barra) return;

    barra.classList.remove('activo');
    overlay.classList.remove('activo');
    _abierto = false;

    if (limpiar) {
        input.value = '';
        /* Limpiar resultados filtrados */
        document.dispatchEvent(new CustomEvent('buscador:query', { detail: { query: '' } }));
        /* Ocultar contador */
        const count = document.getElementById('buscadorCount');
        if (count) count.classList.add('oculto');
    }
}
