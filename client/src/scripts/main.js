import { abrirCarrito } from './components/carrito.js';
import './components/buscador.js';
import './components/cookie.js';
export { showNotification } from './utils/toast.js';

/* ═══════════════════════════════════════════════════════════
   DRAWER HTML
═══════════════════════════════════════════════════════════ */
const DRAWER_HTML = `
<div class="nav-drawer-overlay" id="navDrawerOverlay"></div>
<nav class="nav-drawer" id="navDrawer" aria-label="Navegación principal" aria-hidden="true">
    <div class="nav-drawer-header">
        <button class="nav-drawer-cerrar" id="btnCerrarDrawer" aria-label="Cerrar menú">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            Cerrar
        </button>
    </div>
    <div class="nav-drawer-body">
        <a href="/src/pages/index.html"           class="nav-drawer-link">Inicio</a>
        <a href="/src/pages/tienda/tienda.html"   class="nav-drawer-link">Tienda</a>
        <a href="/src/pages/contacto/contacto.html" class="nav-drawer-link">Contacto</a>
        <div class="nav-drawer-divider"></div>
        <a href="#" class="nav-drawer-link" id="navDrawerCuenta">Cuenta</a>
    </div>
    <div class="nav-drawer-footer">
        <a href="/src/pages/legal/politica-privacidad.html" class="nav-drawer-footer-link">Política de privacidad</a>
        <a href="/src/pages/legal/terminos-servicio.html"   class="nav-drawer-footer-link">Términos de servicio</a>
    </div>
</nav>`;

/* ═══════════════════════════════════════════════════════════
   INICIALIZACIÓN
═══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    _inyectarDrawer();
    _initDrawer();
    _initCarrito();
    _actualizarEnlacePerfil();
    _highlightActivePage();
    _forceReloadHeaderImages();
});

/* ── Inyectar drawer en el DOM ── */
function _inyectarDrawer() {
    document.body.insertAdjacentHTML('afterbegin', DRAWER_HTML);
}

/* ── Lógica del drawer ── */
function _initDrawer() {
    const btnAbrir  = document.getElementById('btnHamburguesa');
    const btnCerrar = document.getElementById('btnCerrarDrawer');
    const overlay   = document.getElementById('navDrawerOverlay');
    const drawer    = document.getElementById('navDrawer');

    if (!btnAbrir || !drawer) return;

    function abrirDrawer() {
        drawer.classList.add('activo');
        overlay.classList.add('activo');
        drawer.setAttribute('aria-hidden', 'false');
        btnAbrir.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    }

    function cerrarDrawer() {
        drawer.classList.remove('activo');
        overlay.classList.remove('activo');
        drawer.setAttribute('aria-hidden', 'true');
        btnAbrir.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }

    /* Toggle: abre si cerrado, cierra si abierto */
    btnAbrir.addEventListener('click', () => {
        drawer.classList.contains('activo') ? cerrarDrawer() : abrirDrawer();
    });
    btnCerrar?.addEventListener('click', cerrarDrawer);
    overlay.addEventListener('click', cerrarDrawer);

    /* ESC cierra el drawer */
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && drawer.classList.contains('activo')) cerrarDrawer();
    });

    /* Resaltar enlace activo en el drawer */
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    drawer.querySelectorAll('.nav-drawer-link').forEach(link => {
        const linkPage = (link.getAttribute('href') ?? '').split('/').pop();
        const match = linkPage && (
            linkPage === currentPage ||
            (linkPage === 'index.html' && (currentPage === '' || currentPage === 'index.html'))
        );
        if (match) link.classList.add('nav-active');
    });
}

/* ── Carrito ── */
function _initCarrito() {
    const cartIcon = document.querySelector('.nav-right .icon:last-child');
    if (cartIcon) {
        cartIcon.addEventListener('click', abrirCarrito);
    }
}

/* ── Redirige el icono de perfil según sesión ── */
function _actualizarEnlacePerfil() {
    /* Header */
    const perfilLink = document.querySelector('.nav-right .icon:nth-child(2) a');
    if (perfilLink) {
        const token = sessionStorage.getItem('unlockd_access_token');
        perfilLink.href = token
            ? '/src/pages/cuenta/cuenta.html'
            : '/src/pages/auth/login.html';
    }

    /* Drawer: "Cuenta" apunta a cuenta si hay sesión, login si no */
    const drawerCuenta = document.getElementById('navDrawerCuenta');
    if (drawerCuenta) {
        const token = sessionStorage.getItem('unlockd_access_token');
        drawerCuenta.href = token
            ? '/src/pages/cuenta/cuenta.html'
            : '/src/pages/auth/login.html';
        drawerCuenta.textContent = token ? 'Cuenta' : 'Iniciar sesión';
    }
}

/* ── Resaltar página activa (drawer + otros usos) ── */
function _highlightActivePage() {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop() || 'index.html';

    /* Se aplica también a nav-left si existe (compatibilidad hacia atrás) */
    document.querySelectorAll('.nav-left a').forEach(link => {
        const linkPage = (link.getAttribute('href') ?? '').split('/').pop();
        const match = linkPage && (
            linkPage === currentPage ||
            (linkPage === 'index.html' && (currentPage === '' || currentPage === 'index.html'))
        );
        link.classList.toggle('nav-active', match);
    });
}

/* ── Recarga imágenes header (evita FOUC) ── */
function _forceReloadHeaderImages() {
    document.querySelectorAll('.main-header img').forEach(img => {
        if (!img.complete) {
            const src = img.src;
            img.src = '';
            img.src = src;
        }
    });
}

/* ═══════════════════════════════════════════════════════════
   UTILIDADES EXPORTADAS
═══════════════════════════════════════════════════════════ */
export function navigateTo(page, params = {}) {
    let url = page;
    if (Object.keys(params).length > 0) {
        url += `?${new URLSearchParams(params)}`;
    }
    window.location.href = url;
}

export function getUrlParams() {
    const params = {};
    for (const [k, v] of new URLSearchParams(window.location.search)) {
        params[k] = v;
    }
    return params;
}

export function scrollToElement(selector, offset = 0) {
    const el = document.querySelector(selector);
    if (!el) return;
    window.scrollTo({
        top: el.getBoundingClientRect().top + window.pageYOffset - offset,
        behavior: 'smooth'
    });
}

export function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function disableBodyScroll() {
    document.body.style.overflow = 'hidden';
}

export function enableBodyScroll() {
    document.body.style.overflow = 'auto';
}

export function setButtonLoading(button, loadingText = 'CARGANDO...') {
    button.dataset.originalText = button.textContent;
    button.textContent = loadingText;
    button.disabled = true;
    button.classList.add('loading');
}

export function setButtonReady(button) {
    if (button.dataset.originalText) {
        button.textContent = button.dataset.originalText;
    }
    button.disabled = false;
    button.classList.remove('loading');
}

export function formatPrice(price, currency = 'EUR') {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(price);
}

export function formatDate(date) {
    return new Intl.DateTimeFormat('es-ES', {
        year: 'numeric', month: 'long', day: 'numeric'
    }).format(date);
}

export function debounce(func, wait = 300) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
