/**
 * quickAdd.js — Popup de vista rápida para añadir productos al carrito
 * Uso: import { abrirQuickAdd } from '../components/quickAdd.js';
 *      abrirQuickAdd(producto);   // producto debe tener: id, name, price, priceNumeric, images[], tallas[]
 */

import { addToCart } from '../utils/cartService.js';

const TALLAS_DEFAULT = ['S', 'M', 'L', 'XL'];

let _overlay = null;

/* ── Crear HTML del modal ───────────────────────────────── */
function _crearOverlay() {
    const el = document.createElement('div');
    el.className = 'qa-overlay';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');

    el.innerHTML = `
        <div class="qa-modal">
            <button class="qa-cerrar" aria-label="Cerrar">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" width="16" height="16">
                    <line x1="2" y1="2" x2="14" y2="14"/>
                    <line x1="14" y1="2" x2="2" y2="14"/>
                </svg>
            </button>
            <div class="qa-imagen">
                <img id="qaImg" src="" alt="" draggable="false">
            </div>
            <div class="qa-info">
                <p class="qa-nombre" id="qaNombre"></p>
                <p class="qa-precio" id="qaPrecio"></p>
                <div class="qa-sep"></div>
                <p class="qa-talla-label">Talla:</p>
                <div class="qa-tallas" id="qaTallas"></div>
                <div class="qa-sep"></div>
                <div class="qa-cantidad">
                    <button class="cantidad-btn" id="qaMenos" aria-label="Menos"><span>−</span></button>
                    <span class="qa-cantidad-num" id="qaCantidad">1</span>
                    <button class="cantidad-btn" id="qaMas" aria-label="Más"><span>+</span></button>
                </div>
                <button class="qa-btn-add" id="qaBtnAdd">Añadir a la cesta</button>
                <a class="qa-link-detalles" id="qaLinkDetalles" href="#">Ver detalles</a>
            </div>
        </div>`;

    /* Cerrar al clicar fuera */
    el.addEventListener('click', (e) => {
        if (e.target === el) cerrarQuickAdd();
    });
    el.querySelector('.qa-cerrar').addEventListener('click', cerrarQuickAdd);

    document.addEventListener('keydown', _onEsc);
    document.body.appendChild(el);
    return el;
}

function _onEsc(e) {
    if (e.key === 'Escape') cerrarQuickAdd();
}

/* ── Cerrar ─────────────────────────────────────────────── */
export function cerrarQuickAdd() {
    if (!_overlay) return;
    _overlay.classList.remove('visible');
    document.removeEventListener('keydown', _onEsc);
    setTimeout(() => {
        _overlay?.remove();
        _overlay = null;
        document.body.style.overflow = '';
    }, 280);
}

/* ── Abrir ──────────────────────────────────────────────── */
export function abrirQuickAdd(producto) {
    cerrarQuickAdd();
    _overlay = _crearOverlay();

    /* Datos básicos */
    const img = _overlay.querySelector('#qaImg');
    img.src   = producto.images[0];
    img.alt   = producto.name;
    _overlay.querySelector('#qaNombre').textContent = producto.name;
    _overlay.querySelector('#qaPrecio').textContent = producto.price;

    /* Link a detalles — ruta relativa al raíz */
    _overlay.querySelector('#qaLinkDetalles').href =
        `/src/pages/producto/producto.html?id=${producto.id}`;

    /* Tallas */
    const tallas   = (producto.tallas ?? []).length > 0 ? producto.tallas : TALLAS_DEFAULT;
    const tallasEl = _overlay.querySelector('#qaTallas');
    let tallaActiva = null;

    tallasEl.innerHTML = tallas.map(t =>
        `<button class="talla-btn" data-talla="${t}"><span>${t}</span></button>`
    ).join('');

    tallasEl.querySelectorAll('.talla-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            tallasEl.querySelectorAll('.talla-btn').forEach(b => b.classList.remove('seleccionada'));
            btn.classList.add('seleccionada');
            tallaActiva = btn.dataset.talla;
            /* Quitar aviso de error si lo había */
            tallasEl.classList.remove('qa-tallas--error');
        });
    });

    /* Cantidad */
    let cantidad = 1;
    const cantEl = _overlay.querySelector('#qaCantidad');

    _overlay.querySelector('#qaMenos').addEventListener('click', () => {
        if (cantidad > 1) cantEl.textContent = --cantidad;
    });
    _overlay.querySelector('#qaMas').addEventListener('click', () => {
        cantEl.textContent = ++cantidad;
    });

    /* Añadir al carrito */
    _overlay.querySelector('#qaBtnAdd').addEventListener('click', async () => {
        if (!tallaActiva) {
            tallasEl.classList.add('qa-tallas--error');
            setTimeout(() => tallasEl.classList.remove('qa-tallas--error'), 900);
            return;
        }

        const btnAdd = _overlay.querySelector('#qaBtnAdd');
        btnAdd.disabled    = true;
        btnAdd.textContent = 'Añadiendo...';

        await addToCart({
            id:           producto.id,
            nombre:       producto.name,
            precio:       producto.price,
            priceNumeric: producto.priceNumeric,
            size:         tallaActiva,
            quantity:     cantidad,
            imagen:       producto.images[0],
        });

        document.dispatchEvent(new CustomEvent('cart:updated'));
        cerrarQuickAdd();
        import('./carrito.js').then(({ abrirCarrito }) => abrirCarrito());
    });

    /* Mostrar con animación */
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => requestAnimationFrame(() => _overlay.classList.add('visible')));
}
