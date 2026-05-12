import { getCart, clearCart }   from '../utils/cartService.js';
import { isLoggedIn, authFetch } from '../utils/auth.js';
import { showNotification }      from '../utils/toast.js';
import { API_URL }               from '../config/api.js';

const ENVIO_GRATIS_MIN = 50;
const ENVIO_COSTE      = 4.99;
const fmt = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

let cartItems  = [];
let subtotal   = 0;
let envioCoste = 0;

document.addEventListener('DOMContentLoaded', async () => {
    cartItems = await getCart();
    subtotal   = cartItems.reduce((s, i) => s + (i.priceNumeric ?? 0) * i.quantity, 0);
    envioCoste = subtotal >= ENVIO_GRATIS_MIN ? 0 : ENVIO_COSTE;

    _renderResumen();
    _initPasoEnvio();
    _prefillUser();
});

/* ──────────────────────────────────────────────────────────
   Resumen lateral
────────────────────────────────────────────────────────── */
function _renderResumen() {
    const itemsEl    = document.getElementById('checkoutItems');
    const subtotalEl = document.getElementById('checkoutSubtotal');
    const envioEl    = document.getElementById('checkoutEnvio');
    const totalEl    = document.getElementById('checkoutTotal');

    if (!itemsEl) return;

    if (cartItems.length === 0) {
        itemsEl.innerHTML = `<p class="co-carrito-vacio">Tu carrito está vacío</p>`;
        [subtotalEl, envioEl, totalEl].forEach(el => { if (el) el.textContent = '—'; });
        return;
    }

    itemsEl.innerHTML = cartItems.map(item => {
        const img    = item.imagen ?? '/public/assets/images/logo.png';
        const precio = fmt.format((item.priceNumeric ?? 0) * item.quantity);
        const talla  = item.size ? `<span class="co-item-talla">Talla: ${item.size}</span>` : '';
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

    const total = subtotal + envioCoste;
    if (subtotalEl) subtotalEl.textContent = fmt.format(subtotal);
    if (envioEl)    envioEl.textContent    = envioCoste === 0 ? 'Gratis' : fmt.format(envioCoste);
    if (totalEl)    totalEl.textContent    = fmt.format(total);

    /* Mostrar nota si existe */
    const notaTexto = sessionStorage.getItem('unlockd_cart_note');
    const notaCont  = document.getElementById('checkoutNota');
    const notaTxtEl = document.getElementById('checkoutNotaTexto');
    if (notaTexto && notaTexto.trim() && notaCont && notaTxtEl) {
        notaTxtEl.textContent = notaTexto.trim();
        notaCont.classList.remove('co-paso-oculto');
    } else if (notaCont) {
        notaCont.classList.add('co-paso-oculto');
    }
}

/* ──────────────────────────────────────────────────────────
   Paso 1 — Datos de envío
────────────────────────────────────────────────────────── */
function _prefillUser() {
    /* Si el usuario está logado, pre-rellena email del sessionStorage */
    if (!isLoggedIn()) return;
    try {
        const user = JSON.parse(sessionStorage.getItem('unlockd_user') || '{}');
        const emailInput = document.getElementById('coEmail');
        if (emailInput && user.email) emailInput.value = user.email;
        if (document.getElementById('coNombre') && user.nombre)
            document.getElementById('coNombre').value = user.nombre;
        if (document.getElementById('coApellidos') && user.apellidos)
            document.getElementById('coApellidos').value = user.apellidos;
    } catch { /* no crítico */ }
}

function _initPasoEnvio() {
    const form = document.getElementById('checkoutForm');
    if (!form) return;

    form.querySelectorAll('.co-input').forEach(input =>
        input.addEventListener('input', () => input.classList.remove('co-input-error'))
    );

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!_validarEnvio(form)) return;
        _mostrarPasoPago();
    });
}

function _validarEnvio(form) {
    let valido = true;
    form.querySelectorAll('[required]').forEach(campo => {
        campo.classList.remove('co-input-error');
        if (!campo.value.trim()) {
            campo.classList.add('co-input-error');
            valido = false;
        }
    });
    const emailInput = form.querySelector('[type="email"]');
    if (emailInput?.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value)) {
        emailInput.classList.add('co-input-error');
        valido = false;
    }
    if (!valido) {
        showNotification('Completa todos los campos requeridos', 'error');
        form.querySelector('.co-input-error')?.focus();
    }
    return valido;
}

/* ──────────────────────────────────────────────────────────
   Paso 2 — Pago (simulado)
────────────────────────────────────────────────────────── */
function _mostrarPasoPago() {
    const paso1 = document.getElementById('pasoDatosEnvio');
    const paso2 = document.getElementById('pasoPago');
    const pasosNav = document.querySelector('.co-pasos');

    if (paso1) paso1.classList.add('co-paso-oculto');
    if (paso2) paso2.classList.remove('co-paso-oculto');

    /* Actualizar barra de progreso */
    if (pasosNav) {
        pasosNav.querySelectorAll('.co-paso').forEach((el, i) => {
            el.classList.toggle('co-paso--hecho',   i < 2);
            el.classList.toggle('co-paso--activo',  i === 2);
        });
    }

    document.getElementById('pagoBtn')?.addEventListener('click', _confirmarPedido);
    document.getElementById('pagoVolver')?.addEventListener('click', () => {
        paso2.classList.add('co-paso-oculto');
        paso1.classList.remove('co-paso-oculto');
        if (pasosNav) {
            pasosNav.querySelectorAll('.co-paso').forEach((el, i) => {
                el.classList.toggle('co-paso--hecho',  i < 1);
                el.classList.toggle('co-paso--activo', i === 1);
            });
        }
    });

    /* Máscara + preview tarjeta */
    const cardInput    = document.getElementById('pagoTarjeta');
    const nombreInput  = document.getElementById('pagoNombre');
    const expInput     = document.getElementById('pagoExp');
    const previewNum   = document.getElementById('cardPreviewNum');
    const previewNom   = document.getElementById('cardPreviewNombre');
    const previewExp   = document.getElementById('cardPreviewExp');

    if (cardInput) {
        cardInput.addEventListener('input', (e) => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 16);
            e.target.value = v.replace(/(.{4})/g, '$1 ').trim();
            if (previewNum) {
                const padded = v.padEnd(16, '•');
                previewNum.textContent = padded.replace(/(.{4})/g, '$1 ').trim();
            }
        });
    }
    if (nombreInput && previewNom) {
        nombreInput.addEventListener('input', (e) => {
            previewNom.textContent = e.target.value.toUpperCase() || 'TITULAR';
        });
    }
    if (expInput) {
        expInput.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\D/g, '').slice(0, 4);
            if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
            e.target.value = v;
            if (previewExp) previewExp.textContent = v || 'MM/AA';
        });
    }
}

function _validarPago() {
    const tarjeta = document.getElementById('pagoTarjeta')?.value.replace(/\s/g, '') ?? '';
    const exp     = document.getElementById('pagoExp')?.value ?? '';
    const cvv     = document.getElementById('pagoCVV')?.value ?? '';
    const nombre  = document.getElementById('pagoNombre')?.value.trim() ?? '';

    let valido = true;
    const mark = (id, ok) => {
        document.getElementById(id)?.classList.toggle('co-input-error', !ok);
        if (!ok) valido = false;
    };
    mark('pagoNombre',  nombre.length >= 3);
    mark('pagoTarjeta', /^\d{16}$/.test(tarjeta));
    mark('pagoExp',     /^\d{2}\/\d{2}$/.test(exp));
    mark('pagoCVV',     /^\d{3,4}$/.test(cvv));

    if (!valido) showNotification('Revisa los datos de la tarjeta', 'error');
    return valido;
}

async function _confirmarPedido() {
    if (cartItems.length === 0) {
        showNotification('Tu carrito está vacío', 'error');
        return;
    }
    if (!_validarPago()) return;

    const btn = document.getElementById('pagoBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Procesando...'; }

    const form = document.getElementById('checkoutForm');
    const body = {
        nombre:    form.coNombre.value.trim(),
        apellidos: form.coApellidos.value.trim(),
        email:     form.coEmail.value.trim(),
        direccion: {
            calle:    form.coDireccion.value.trim(),
            ciudad:   form.coCiudad.value.trim(),
            cp:       form.coCP.value.trim(),
            pais:     form.coPais.value,
            telefono: form.coTelefono?.value.trim() ?? '',
        },
        items: cartItems.map(i => ({
            productoId: i.producto_id ?? i.id,
            talla:      i.size ?? 'unica',
            cantidad:   i.quantity,
        })),
        nota: sessionStorage.getItem('unlockd_cart_note') || undefined
    };

    try {
        const fetchFn = isLoggedIn() ? authFetch : (url, opts) => fetch(url, { ...opts, credentials: 'include' });
        const res  = await fetchFn(`${API_URL}/orders`, {
            method:  'POST',
            body:    JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' },
        });
        const json = await res.json();

        if (!json.success) {
            showNotification(json.message || 'Error al procesar el pedido', 'error');
            return;
        }

        /* Vaciar carrito local */
        await clearCart();
        document.dispatchEvent(new CustomEvent('cart:updated'));

        /* Guardar resumen en sessionStorage para la confirmación */
        sessionStorage.setItem('unlockd_pedido', JSON.stringify(json.data.pedido));

        window.location.href = `/src/pages/checkout/confirmacion.html?id=${json.data.pedido.id}`;

    } catch (err) {
        console.error('[checkout]', err.message);
        showNotification('Error de conexión. ¿El servidor está activo?', 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Confirmar pedido'; }
    }
}
