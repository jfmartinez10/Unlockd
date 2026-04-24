import { getCart, getCartTotal } from '../utils/storage.js';
import { showNotification } from '../utils/toast.js';

const ENVIO_GRATIS_MIN = 50;
const ENVIO_COSTE     = 4.99;

const fmt = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

document.addEventListener('DOMContentLoaded', () => {
    _renderResumen();
    _initForm();
});

/* ——— Resumen ——— */
function _renderResumen() {
    const itemsEl    = document.getElementById('checkoutItems');
    const subtotalEl = document.getElementById('checkoutSubtotal');
    const envioEl   = document.getElementById('checkoutEnvio');
    const totalEl   = document.getElementById('checkoutTotal');

    const cart    = getCart();
    const subtotal = getCartTotal();

    if (!itemsEl) return;

    if (cart.length === 0) {
        itemsEl.innerHTML = `<p class="co-carrito-vacio">Tu carrito está vacío</p>`;
        if (subtotalEl) subtotalEl.textContent = fmt.format(0);
        if (envioEl)   envioEl.textContent = '—';
        if (totalEl)   totalEl.textContent = fmt.format(0);
        return;
    }

    itemsEl.innerHTML = cart.map(item => {
        const img    = item.imagen ?? '/public/assets/images/logo.png';
        const talla  = item.size  ? `<span class="co-item-talla">Talla: ${item.size}</span>` : '';
        const precio = typeof item.priceNumeric === 'number'
            ? fmt.format(item.priceNumeric * item.quantity)
            : item.precio;

        return `
        <div class="co-item">
            <div class="co-item-imagen">
                <img src="${img}" alt="${item.nombre}" loading="lazy">
                <span class="co-item-badge">${item.quantity}</span>
            </div>
            <div class="co-item-info">
                <span class="co-item-nombre">${item.nombre}</span>
                ${talla}
            </div>
            <span class="co-item-precio">${precio}</span>
        </div>`;
    }).join('');

    const envio = subtotal >= ENVIO_GRATIS_MIN ? 0 : ENVIO_COSTE;
    const total = subtotal + envio;

    if (subtotalEl) subtotalEl.textContent = fmt.format(subtotal);
    if (envioEl)   envioEl.textContent   = envio === 0 ? 'Gratis' : fmt.format(envio);
    if (totalEl)   totalEl.textContent   = fmt.format(total);
}

/* ——— Formulario ——— */
function _initForm() {
    const form   = document.getElementById('checkoutForm');
    const submit = document.getElementById('checkoutSubmit');
    if (!form || !submit) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        /* Validación de campos requeridos */
        const requeridos = form.querySelectorAll('[required]');
        let valido = true;

        requeridos.forEach(campo => {
            campo.classList.remove('co-input-error');
            if (!campo.value.trim()) {
                campo.classList.add('co-input-error');
                valido = false;
            }
        });

        /* Validación email */
        const emailInput = form.querySelector('[type="email"]');
        if (emailInput && emailInput.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value)) {
            emailInput.classList.add('co-input-error');
            valido = false;
        }

        if (!valido) {
            showNotification('Completa todos los campos requeridos', 'error');
            form.querySelector('.co-input-error')?.focus();
            return;
        }

        /* Simular envío */
        const textoOriginal = submit.querySelector('span').textContent;
        submit.querySelector('span').textContent = 'Procesando...';
        submit.disabled = true;

        setTimeout(() => {
            showNotification('Pasarela de pago — próximamente disponible', 'info', 4000);
            submit.querySelector('span').textContent = textoOriginal;
            submit.disabled = false;
        }, 1000);
    });

    /* Limpiar error al escribir */
    form.querySelectorAll('.co-input').forEach(input => {
        input.addEventListener('input', () => input.classList.remove('co-input-error'));
    });
}
