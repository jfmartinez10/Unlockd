import { getCart as getLocalCart, saveCart, getCartTotal as getLocalTotal } from '../utils/storage.js';
import { getCart, addToCart, updateQuantity, removeFromCart, clearCart } from '../utils/cartService.js';
import { isLoggedIn } from '../utils/auth.js';

/* Estilo crítico inline */
const _criticalStyle = document.createElement('style');
_criticalStyle.textContent = '.carrito-panel:not(.activo){transform:translateX(100%)}' +
                              '.carrito-overlay:not(.activo){opacity:0;visibility:hidden}';
document.head.prepend(_criticalStyle);

/* Auto-inject CSS */
const _cssLink = document.createElement('link');
_cssLink.rel = 'stylesheet';
_cssLink.href = '/src/styles/components/carrito.css';
document.head.appendChild(_cssLink);

/* Iconos */
const SVG_CESTA = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 33 33" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="5" y="13" width="23" height="15" rx="3"/>
    <path d="M12 13C12 9.4 14 7 16.5 7C19 7 21 9.4 21 13"/>
</svg>`;

const SVG_CERRAR = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
</svg>`;

/* Nota persistida */
let _notaTexto = '';

/* Cache del carrito actual (evita múltiples fetches) */
let _cartCache = null;

/* Init en DOMContentLoaded */
document.addEventListener('DOMContentLoaded', () => {
    document.body.insertAdjacentHTML('beforeend', `
        <div class="carrito-overlay" id="carritoOverlay"></div>
        <aside class="carrito-panel" id="carritoPanel" aria-label="Carrito de compras" aria-hidden="true">
            <div class="carrito-header">
                <div class="carrito-titulo">
                    ${SVG_CESTA}
                    <span>Carrito</span>
                </div>
                <button class="carrito-cerrar" id="carritoCerrar" aria-label="Cerrar carrito">
                    ${SVG_CERRAR}
                </button>
            </div>
            <div class="carrito-cuerpo" id="carritoCuerpo"></div>
            <div class="carrito-footer" id="carritoFooter"></div>
        </aside>
    `);

    _initEventos();
    _renderCarrito();
});

/* Init de eventos globales */
function _initEventos() {
    document.getElementById('carritoOverlay').addEventListener('click', cerrarCarrito);
    document.getElementById('carritoCerrar').addEventListener('click', cerrarCarrito);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') cerrarCarrito();
    });

    document.addEventListener('cart:updated', () => {
        _cartCache = null;
        _renderCarrito();
    });

    window.addEventListener('pageshow', (e) => {
        if (e.persisted) cerrarCarrito();
    });

    /* Badge de la cesta */
    const cestaSpan = document.querySelector('.nav-right .icon:last-child');
    if (cestaSpan) {
        const badge = document.createElement('span');
        badge.id = 'carritoBadge';
        badge.className = 'carrito-badge';
        badge.style.display = 'none';
        cestaSpan.appendChild(badge);
    }
}

/* API pública */
export function abrirCarrito() {
    const panel   = document.getElementById('carritoPanel');
    const overlay = document.getElementById('carritoOverlay');
    if (!panel) return;

    _cartCache = null;
    _renderCarrito();
    panel.classList.add('activo');
    panel.setAttribute('aria-hidden', 'false');
    overlay.classList.add('activo');
    document.body.style.overflow = 'hidden';
}

export function cerrarCarrito() {
    const panel   = document.getElementById('carritoPanel');
    const overlay = document.getElementById('carritoOverlay');
    if (!panel) return;

    panel.classList.remove('activo');
    panel.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('activo');
    document.body.style.overflow = '';
}

/* Render principal — asíncrono porque puede ir a la API */
async function _renderCarrito() {
    const cuerpo = document.getElementById('carritoCuerpo');
    const footer = document.getElementById('carritoFooter');
    if (!cuerpo || !footer) return;

    /* Mostrar spinner ligero mientras carga */
    if (!_cartCache) {
        cuerpo.innerHTML = '<div class="carrito-cargando"></div>';
    }

    const cart          = _cartCache ?? await getCart();
    _cartCache          = cart;
    const totalUnidades = cart.reduce((sum, item) => sum + (item.quantity ?? item.cantidad ?? 0), 0);

    /* Actualizar badge */
    const badge = document.getElementById('carritoBadge');
    if (badge) {
        if (totalUnidades > 0) {
            badge.textContent = totalUnidades > 99 ? '99+' : String(totalUnidades);
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    if (cart.length === 0) {
        _renderVacio(cuerpo);
        footer.innerHTML = '';
        return;
    }

    _renderItems(cuerpo, cart);
    _renderFooter(footer, cart, totalUnidades);
}

/* Estado vacío */
function _renderVacio(cuerpo) {
    cuerpo.innerHTML = `
        <div class="carrito-vacio">
            <div class="carrito-vacio-icono">${SVG_CESTA}</div>
            <p>0 productos añadidos</p>
            <a class="carrito-vacio-link" href="/src/pages/tienda/tienda.html">
                Volver a la tienda
            </a>
        </div>`;
}

/* Lista de productos */
function _renderItems(cuerpo, cart) {
    const html = cart.map((item, i) => {
        const size     = item.size ?? item.talla ?? null;
        const img      = item.imagen ?? '/public/assets/images/logo.png';
        const tallaHTML = size && size !== 'unica'
            ? `<span class="carrito-item-talla">${size}</span>`
            : '';

        return `
        <div class="carrito-item" data-index="${i}" data-id="${item.id}">
            <div class="carrito-item-imagen">
                <img src="${img}" alt="${item.nombre}" loading="lazy">
            </div>
            <div class="carrito-item-datos">
                <span class="carrito-item-nombre">${item.nombre}</span>
                <span class="carrito-item-precio">${item.precio}</span>
                ${tallaHTML}
            </div>
            <div class="carrito-item-acciones">
                <div class="carrito-item-cantidad">
                    <button class="btn-restar" aria-label="Reducir">−</button>
                    <span>${item.quantity ?? item.cantidad}</span>
                    <button class="btn-sumar" aria-label="Aumentar">+</button>
                </div>
                <button class="carrito-item-eliminar">Eliminar</button>
            </div>
        </div>`;
    }).join('');

    cuerpo.innerHTML = `<div class="carrito-items">${html}</div>`;

    cuerpo.querySelectorAll('.carrito-item').forEach((el, i) => {
        el.querySelector('.btn-restar').addEventListener('click', () => _cambiarCantidad(i, -1));
        el.querySelector('.btn-sumar').addEventListener('click', () => _cambiarCantidad(i, +1));
        el.querySelector('.carrito-item-eliminar').addEventListener('click', () => _eliminarItem(i));
    });
}

/* Footer: nota + resumen + checkout */
function _renderFooter(footer, cart, totalUnidades) {
    const fmt   = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
    const total = cart.reduce((sum, item) => {
        const precio = item.priceNumeric ?? parseFloat(item.precio_numerico) ?? 0;
        const qty    = item.quantity ?? item.cantidad ?? 1;
        return sum + precio * qty;
    }, 0);
    const unStr = `${totalUnidades} unidad${totalUnidades !== 1 ? 'es' : ''}`;

    footer.innerHTML = `
        <button class="carrito-nota-toggle" id="carritoNotaToggle">
            <span class="carrito-nota-sep">/</span>
            Añadir nota al pedido
            <span class="carrito-nota-sep">/</span>
        </button>
        <div class="carrito-nota-area" id="carritoNotaArea">
            <div>
                <textarea
                    class="carrito-nota-textarea"
                    id="carritoNotaTexto"
                    placeholder="Escribe una nota para tu pedido..."
                >${_notaTexto}</textarea>
            </div>
        </div>
        <div class="carrito-resumen">
            <span class="carrito-resumen-texto">Productos ${unStr}</span>
            <span class="carrito-resumen-total">Subtotal ${fmt.format(total)}</span>
        </div>
        <button class="carrito-checkout" id="carritoCheckout">Finalizar pedido</button>`;

    footer.querySelector('#carritoNotaToggle').addEventListener('click', () => {
        footer.querySelector('#carritoNotaArea').classList.toggle('abierta');
        footer.querySelector('#carritoNotaTexto').focus();
    });

    footer.querySelector('#carritoNotaTexto').addEventListener('input', (e) => {
        _notaTexto = e.target.value;
    });

    footer.querySelector('#carritoCheckout').addEventListener('click', () => {
        window.location.href = '/src/pages/checkout/checkout.html';
    });
}

/* Mutaciones del carrito */
async function _cambiarCantidad(index, delta) {
    const cart = _cartCache ?? await getCart();
    const item = cart[index];
    if (!item) return;

    const nuevaCantidad = Math.max(1, (item.quantity ?? item.cantidad ?? 1) + delta);

    if (isLoggedIn()) {
        await updateQuantity(item.id, nuevaCantidad);
        _cartCache = null;
    } else {
        cart[index].quantity = nuevaCantidad;
        saveCart(cart);
        _cartCache = cart;
    }

    _renderCarrito();
}

async function _eliminarItem(index) {
    const cart = _cartCache ?? await getCart();
    const item = cart[index];
    if (!item) return;

    if (isLoggedIn()) {
        await removeFromCart(item.id);
        _cartCache = null;
    } else {
        cart.splice(index, 1);
        saveCart(cart);
        _cartCache = cart;
    }

    _renderCarrito();
}

/* Exportar addToCart para que tienda.js/producto.js lo usen */
export { addToCart };
