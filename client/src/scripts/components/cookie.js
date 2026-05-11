/* Banner de consentimiento de cookies */

const KEY = 'unlockd_cookies';

export const getConsent = () => localStorage.getItem(KEY);

function saveConsent(value) {
    localStorage.setItem(KEY, value);
    _hide();
}

function _hide() {
    const banner  = document.getElementById('cookie-banner');
    const overlay = document.getElementById('cookie-overlay');
    [banner, overlay].forEach(el => {
        if (!el) return;
        el.classList.remove('cookie-visible');
        el.addEventListener('transitionend', () => el.remove(), { once: true });
    });
}

function _show() {
    /* Overlay semitransparente */
    const overlay = document.createElement('div');
    overlay.id = 'cookie-overlay';
    document.body.appendChild(overlay);

    /* Panel principal */
    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-modal', 'true');
    banner.setAttribute('aria-label', 'Aviso de cookies');
    banner.innerHTML = `
        <div class="cookie-inner">

            <div class="cookie-icono" aria-hidden="true">🍪</div>

            <div class="cookie-texto">
                <p class="cookie-titulo">Tu privacidad importa</p>
                <p class="cookie-desc">
                    Utilizamos cookies propias esenciales para el funcionamiento de la web
                    (sesión de usuario, carrito de compra). No usamos cookies de seguimiento
                    ni compartimos datos con terceros.
                    <a href="/src/pages/legal/politica-privacidad.html" target="_blank">
                        Más información →
                    </a>
                </p>
            </div>

            <div class="cookie-acciones">
                <button class="cookie-btn cookie-btn--aceptar" id="ckAceptar">
                    Aceptar todo
                </button>
                <button class="cookie-btn cookie-btn--rechazar" id="ckRechazar">
                    Solo esenciales
                </button>
            </div>

        </div>
    `;
    document.body.appendChild(banner);

    /* Animar entrada tras reflow */
    requestAnimationFrame(() => requestAnimationFrame(() => {
        overlay.classList.add('cookie-visible');
        banner.classList.add('cookie-visible');
    }));

    banner.querySelector('#ckAceptar').addEventListener('click',  () => saveConsent('accepted'));
    banner.querySelector('#ckRechazar').addEventListener('click', () => saveConsent('rejected'));
}

/* Auto-init al cargar la página */
function init() {
    if (getConsent() === null) setTimeout(_show, 900);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
