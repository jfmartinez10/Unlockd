import { getCart, clearCart }   from '../utils/cartService.js';
import { isLoggedIn, authFetch } from '../utils/auth.js';
import { showNotification }      from '../utils/toast.js';
import { API_URL }               from '../config/api.js';

/* ── Constantes ──────────────────────────────────────────── */
const ENVIO_GRATIS_MIN = 50;
const ENVIO_COSTE      = 4.99;
const fmt = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

/* ── Estado global ───────────────────────────────────────── */
let cartItems      = [];
let subtotal       = 0;
let envioSelecto   = ENVIO_COSTE;
let descuento      = 0;
let codigoCuponOk  = '';   /* código validado para enviarlo al crear el pedido */

/* ══════════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {

    cartItems = await getCart();

    /* Guardia: sin carrito → tienda */
    if (cartItems.length === 0) {
        window.location.href = '/src/pages/tienda/tienda.html';
        return;
    }

    subtotal = cartItems.reduce((s, i) => s + (i.priceNumeric ?? 0) * i.quantity, 0);

    _renderResumenDerecho();
    _prefillUsuario();
    _cargarDireccionesGuardadas();
    _initEnvio();
    _initDescuento();
    _initInputFilters();
    _initAutocomplete();
    _initNota();
    _initFinalizar();
    _initToggleMovil();
    _sincronizarMovil();
});

/* ══════════════════════════════════════════════════════════
   RESUMEN DERECHO
═══════════════════════════════════════════════════════════ */
function _renderResumenDerecho() {
    const itemsEl = document.getElementById('coItems');
    if (itemsEl) {
        itemsEl.innerHTML = cartItems.map(item => {
            const img    = item.imagen ?? '/public/assets/images/logo.png';
            const precio = fmt.format((item.priceNumeric ?? 0) * item.quantity);
            const talla  = item.size ?? '';
            return `
            <div class="co-item">
                <div class="co-item-img-wrap">
                    <img class="co-item-img" src="${img}" alt="${item.nombre}" loading="lazy">
                    <span class="co-item-badge">${item.quantity}</span>
                </div>
                <div class="co-item-datos">
                    <span class="co-item-nombre">${item.nombre}</span>
                    ${talla ? `<span class="co-item-talla">${talla}</span>` : ''}
                </div>
                <span class="co-item-precio">${precio}</span>
            </div>`;
        }).join('');
    }

    _actualizarTotales();
}

function _actualizarTotales() {
    const envio = subtotal - descuento >= ENVIO_GRATIS_MIN ? 0 : envioSelecto;
    const total = subtotal - descuento + envio;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    set('coSubtotal', fmt.format(subtotal));

    const envioEl = document.getElementById('coEnvio');
    if (envioEl) {
        envioEl.className = '';
        envioEl.textContent = envio === 0 ? 'Gratis' : fmt.format(envio);
    }

    const totalEl = document.getElementById('coTotal');
    if (totalEl) {
        totalEl.innerHTML = `<span style="font-size:12px;font-weight:400;margin-right:6px;color:#888">EUR</span>${fmt.format(total)}`;
    }

    const filaDesc = document.getElementById('filaDescuento');
    const descVal  = document.getElementById('coDescuentoValor');
    if (filaDesc) filaDesc.style.display = descuento > 0 ? 'flex' : 'none';
    if (descVal)  descVal.textContent = `−${fmt.format(descuento)}`;

    /* Actualizar total en toggle móvil */
    const toggleTotal = document.getElementById('toggleTotal');
    if (toggleTotal) toggleTotal.textContent = fmt.format(total);
}

/* ══════════════════════════════════════════════════════════
   MÉTODOS DE ENVÍO
═══════════════════════════════════════════════════════════ */
function _initEnvio() {
    const contenedor = document.getElementById('metodosEnvio');
    if (!contenedor) return;

    const gratis = subtotal - descuento >= ENVIO_GRATIS_MIN;
    envioSelecto  = gratis ? 0 : ENVIO_COSTE;

    if (gratis) {
        contenedor.innerHTML = `
            <label class="co-metodo">
                <input type="radio" name="metodoEnvio" value="gratis" checked>
                <div class="co-metodo-info">
                    <span class="co-metodo-nombre">Envío gratuito</span>
                    <span class="co-metodo-desc">Pedidos superiores a ${fmt.format(ENVIO_GRATIS_MIN)} · 3-5 días hábiles</span>
                </div>
                <span class="co-metodo-precio">Gratis</span>
            </label>`;
    } else {
        contenedor.innerHTML = `
            <label class="co-metodo">
                <input type="radio" name="metodoEnvio" value="estandar" checked>
                <div class="co-metodo-info">
                    <span class="co-metodo-nombre">Envío estándar</span>
                    <span class="co-metodo-desc">3-5 días hábiles</span>
                </div>
                <span class="co-metodo-precio">${fmt.format(ENVIO_COSTE)}</span>
            </label>`;
    }

    contenedor.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', () => {
            envioSelecto = radio.value === 'gratis' ? 0 : ENVIO_COSTE;
            _actualizarTotales();
        });
    });
}

/* ══════════════════════════════════════════════════════════
   DESCUENTO
═══════════════════════════════════════════════════════════ */
function _initDescuento() {
    const btn = document.getElementById('btnAplicarDescuento');
    const inp = document.getElementById('coDescuento');
    const msg = document.getElementById('descuentoMsg');
    if (!btn || !inp) return;

    btn.addEventListener('click', async () => {
        const codigo = inp.value.trim().toUpperCase();
        if (!codigo) return;

        btn.disabled = true;
        btn.textContent = '...';

        try {
            const res  = await fetch(`${API_URL}/coupons/validate`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ codigo }),
            });
            const json = await res.json();

            if (json.success) {
                const pct = json.data.porcentaje / 100;   /* 10 → 0.10 */
                descuento     = +(subtotal * pct).toFixed(2);
                codigoCuponOk = json.data.codigo;
                if (msg) {
                    msg.textContent  = `Código aplicado: −${json.data.porcentaje}%`;
                    msg.className    = 'co-descuento-msg ok';
                }
                inp.disabled = true;
                btn.disabled = true;
                btn.textContent = 'Aplicado';
                _initEnvio();
            } else {
                descuento     = 0;
                codigoCuponOk = '';
                if (msg) {
                    msg.textContent = json.message || 'Código no válido';
                    msg.className   = 'co-descuento-msg error';
                }
                btn.disabled    = false;
                btn.textContent = 'Aplicar';
            }
        } catch {
            if (msg) { msg.textContent = 'Error de conexión'; msg.className = 'co-descuento-msg error'; }
            btn.disabled    = false;
            btn.textContent = 'Aplicar';
        }

        _actualizarTotales();
    });

    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') btn.click(); });
}

/* ══════════════════════════════════════════════════════════
   FILTROS DE INPUT
═══════════════════════════════════════════════════════════ */
function _initInputFilters() {
    /* Solo números */
    ['coTelefono', 'coCP', 'pagoTarjeta', 'pagoCVV'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('input', () => {
            el.value = el.value.replace(/\D/g, '');
        });
        el.addEventListener('keydown', (e) => {
            const allow = ['Backspace','Delete','Tab','Escape','Enter','ArrowLeft','ArrowRight','Home','End'];
            if (allow.includes(e.key)) return;
            if (!/^\d$/.test(e.key)) e.preventDefault();
        });
    });

    /* Formato tarjeta: grupos de 4 */
    const cardInput = document.getElementById('pagoTarjeta');
    if (cardInput) {
        cardInput.addEventListener('input', () => {
            const digits = cardInput.value.replace(/\D/g, '').slice(0, 16);
            cardInput.value = digits.replace(/(.{4})(?=.)/g, '$1 ');
        });
    }

    /* Solo letras en nombre de tarjeta (no dígitos) */
    const cardName = document.getElementById('pagoNombre');
    if (cardName) {
        cardName.addEventListener('input', () => {
            cardName.value = cardName.value.replace(/[0-9]/g, '');
        });
        cardName.addEventListener('keydown', (e) => {
            if (/^\d$/.test(e.key)) e.preventDefault();
        });
    }

    /* Fecha de vencimiento: máscara automática MM/AA */
    const expInput = document.getElementById('pagoExp');
    if (expInput) {
        expInput.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\D/g, '').slice(0, 4);
            if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
            e.target.value = v;
        });
        expInput.addEventListener('keydown', (e) => {
            /* Permitir borrar la barra automáticamente al pulsar Backspace */
            if (e.key === 'Backspace' && expInput.value.endsWith('/')) {
                e.preventDefault();
                expInput.value = expInput.value.slice(0, -1);
            }
        });
    }
}

/* ══════════════════════════════════════════════════════════
   AUTOCOMPLETE DE DIRECCIÓN — Nominatim (OpenStreetMap)
═══════════════════════════════════════════════════════════ */
function _initAutocomplete() {
    const input  = document.getElementById('coDireccion');
    const lista  = document.getElementById('autocompleteLista');
    if (!input || !lista) return;

    let debounceTimer = null;
    let ultimaQuery   = '';

    input.addEventListener('input', () => {
        const q = input.value.trim();
        clearTimeout(debounceTimer);

        if (q.length < 4) {
            _cerrarLista(lista);
            return;
        }

        if (q === ultimaQuery) return;
        ultimaQuery = q;

        debounceTimer = setTimeout(() => _buscarDirecciones(q, lista, input), 400);
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') _cerrarLista(lista);
    });

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !lista.contains(e.target)) {
            _cerrarLista(lista);
        }
    });
}

async function _buscarDirecciones(query, lista, input) {
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=es,ar,mx,co,pe,cl&q=${encodeURIComponent(query)}`;
        const res  = await fetch(url, {
            headers: { 'Accept-Language': 'es', 'User-Agent': 'UnlockdApp/1.0' }
        });
        if (!res.ok) return;
        const data = await res.json();

        if (!data.length) {
            _cerrarLista(lista);
            return;
        }

        lista.innerHTML = data.map((item, idx) => `
            <div class="co-autocomplete-item" data-idx="${idx}">${item.display_name}</div>
        `).join('');

        lista.querySelectorAll('.co-autocomplete-item').forEach((el, idx) => {
            el.addEventListener('click', () => {
                _seleccionarDireccion(data[idx], input, lista);
            });
        });

        lista.classList.add('visible');

    } catch {
        /* Error de red silencioso — el usuario puede escribir manualmente */
    }
}

function _seleccionarDireccion(item, input, lista) {
    const addr = item.address ?? {};

    /* Calle */
    const road   = addr.road ?? addr.pedestrian ?? addr.footway ?? '';
    const number = addr.house_number ?? '';
    input.value  = road + (number ? ` ${number}` : '');

    /* Ciudad */
    const ciudadEl = document.getElementById('coCiudad');
    if (ciudadEl) {
        ciudadEl.value = addr.city ?? addr.town ?? addr.village ?? addr.county ?? '';
    }

    /* Código postal */
    const cpEl = document.getElementById('coCP');
    if (cpEl && addr.postcode) {
        cpEl.value = addr.postcode.replace(/\D/g, '').slice(0, 10);
    }

    /* País */
    const paisEl = document.getElementById('coPais');
    if (paisEl && addr.country) {
        const opt = Array.from(paisEl.options).find(o =>
            o.value.toLowerCase() === (addr.country ?? '').toLowerCase()
        );
        if (opt) paisEl.value = opt.value;
    }

    _cerrarLista(lista);
}

function _cerrarLista(lista) {
    lista.classList.remove('visible');
    lista.innerHTML = '';
}

/* ══════════════════════════════════════════════════════════
   DIRECCIONES GUARDADAS
═══════════════════════════════════════════════════════════ */
async function _cargarDireccionesGuardadas() {
    if (!isLoggedIn()) return;

    const bloque = document.getElementById('bloqueGuardadas');
    const lista  = document.getElementById('listaDireccionesGuardadas');
    if (!bloque || !lista) return;

    try {
        const res  = await authFetch(`${API_URL}/addresses`);
        const json = await res.json();
        if (!json.success || !json.data.length) return;

        bloque.style.display = 'block';
        lista.innerHTML = json.data.map(d => `
            <button class="co-dir-guardada" data-id="${d.id}" type="button">
                <span class="co-dir-guardada-nombre">${d.nombre} ${d.apellidos}${d.predeterminada ? ' <span class="co-dir-badge">Predeterminada</span>' : ''}</span>
                <span class="co-dir-guardada-linea">${d.direccion}${d.direccion2 ? `, ${d.direccion2}` : ''}</span>
                <span class="co-dir-guardada-linea">${d.cod_postal} ${d.ciudad} · ${d.pais}</span>
            </button>`).join('');

        lista.querySelectorAll('.co-dir-guardada').forEach(btn => {
            btn.addEventListener('click', () => {
                const d = json.data.find(x => String(x.id) === btn.dataset.id);
                if (!d) return;
                _rellenarDesdeDireccion(d);
                /* Marcar seleccionada */
                lista.querySelectorAll('.co-dir-guardada').forEach(b => b.classList.remove('seleccionada'));
                btn.classList.add('seleccionada');
            });
        });

        /* Auto-seleccionar la predeterminada */
        const pred = json.data.find(d => d.predeterminada);
        if (pred) {
            _rellenarDesdeDireccion(pred);
            lista.querySelector(`[data-id="${pred.id}"]`)?.classList.add('seleccionada');
        }
    } catch { /* no crítico */ }
}

function _rellenarDesdeDireccion(d) {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val ?? ''; };
    set('coNombre',    d.nombre);
    set('coApellidos', d.apellidos);
    set('coDireccion', d.direccion);
    set('coDireccion2', d.direccion2 ?? '');
    set('coCiudad',    d.ciudad);
    set('coCP',        d.cod_postal);

    const paisEl = document.getElementById('coPais');
    if (paisEl) {
        const opt = Array.from(paisEl.options).find(o => o.value === d.pais);
        if (opt) paisEl.value = d.pais;
    }
}

/* ══════════════════════════════════════════════════════════
   PRE-RELLENAR DATOS DE SESIÓN
═══════════════════════════════════════════════════════════ */
function _prefillUsuario() {
    if (!isLoggedIn()) return;
    try {
        const u = JSON.parse(sessionStorage.getItem('unlockd_user') || '{}');

        const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
        set('coEmail',     u.email);
        set('coNombre',    u.nombre);
        set('coApellidos', u.apellidos);

        /* Ocultar "Iniciar sesión" si ya está autenticado */
        const linkLogin = document.getElementById('coLinkLogin');
        if (linkLogin) linkLogin.style.display = 'none';
    } catch { /* no crítico */ }
}

/* ══════════════════════════════════════════════════════════
   TOGGLE RESUMEN MÓVIL
═══════════════════════════════════════════════════════════ */
function _initToggleMovil() {
    const btn     = document.getElementById('btnToggleResumen');
    const resumen = document.getElementById('movilResumen');
    const texto   = document.getElementById('toggleTexto');
    if (!btn || !resumen) return;

    btn.addEventListener('click', () => {
        const abierto = resumen.classList.toggle('abierto');
        if (texto) texto.textContent = abierto ? 'Ocultar resumen del pedido' : 'Mostrar resumen del pedido';
    });
}

/* Inyecta una copia del resumen en el panel móvil */
function _sincronizarMovil() {
    const movilResumen = document.getElementById('movilResumen');
    if (!movilResumen) return;

    /* Clonar el contenido del panel derecho */
    const rightInner = document.querySelector('.co-right-inner');
    if (rightInner) {
        movilResumen.innerHTML = rightInner.innerHTML;
    }
}

/* ══════════════════════════════════════════════════════════
   NOTA DEL PEDIDO
═══════════════════════════════════════════════════════════ */
function _initNota() {
    const textarea = document.getElementById('coNota');
    if (!textarea) return;

    /* Pre-cargar la nota escrita en el carrito */
    const notaGuardada = sessionStorage.getItem('unlockd_cart_note') ?? '';
    if (notaGuardada) {
        textarea.value = notaGuardada;
        /* Mostrarla también en el panel derecho */
        const resumen  = document.getElementById('notaResumen');
        const notaText = document.getElementById('notaTexto');
        if (resumen && notaText) {
            notaText.textContent = notaGuardada;
            resumen.style.display = 'block';
        }
    }

    textarea.addEventListener('input', () => {
        const nota     = textarea.value.trim();
        const resumen  = document.getElementById('notaResumen');
        const notaText = document.getElementById('notaTexto');
        if (!resumen || !notaText) return;

        if (nota) {
            notaText.textContent = nota;
            resumen.style.display = 'block';
        } else {
            resumen.style.display = 'none';
        }
    });
}

/* ══════════════════════════════════════════════════════════
   VALIDACIÓN Y ENVÍO
═══════════════════════════════════════════════════════════ */
function _initFinalizar() {
    const btn = document.getElementById('btnFinalizarPedido');
    if (btn) btn.addEventListener('click', _confirmarPedido);
}

function _validar() {
    const campos = ['coEmail', 'coNombre', 'coApellidos', 'coPais', 'coDireccion', 'coCiudad', 'coCP'];
    let ok = true;

    campos.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.remove('error');
        if (!el.value.trim()) { el.classList.add('error'); ok = false; }
    });

    const email = document.getElementById('coEmail');
    if (email?.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        email.classList.add('error'); ok = false;
    }

    /* Tarjeta */
    const tarjeta = document.getElementById('pagoTarjeta')?.value.replace(/\s/g, '') ?? '';
    const exp     = document.getElementById('pagoExp')?.value ?? '';
    const cvv     = document.getElementById('pagoCVV')?.value ?? '';
    const nombre  = document.getElementById('pagoNombre')?.value.trim() ?? '';

    const markCard = (id, valido) => {
        document.getElementById(id)?.classList.toggle('error', !valido);
        if (!valido) ok = false;
    };

    markCard('pagoNombre',  nombre.length >= 3);
    markCard('pagoTarjeta', /^\d{16}$/.test(tarjeta));
    markCard('pagoExp',     /^\d{2}\/\d{2}$/.test(exp));   /* formato MM/AA */
    markCard('pagoCVV',     /^\d{3}$/.test(cvv));

    if (!ok) {
        showNotification('Completa todos los campos requeridos', 'error');
        /* Hacer scroll al primer campo con error */
        const primerError = document.querySelector('.co-input.error');
        if (primerError) primerError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return ok;
}

async function _confirmarPedido() {
    if (!_validar()) return;

    const btn = document.getElementById('btnFinalizarPedido');
    if (btn) { btn.disabled = true; btn.textContent = 'Procesando...'; }

    const body = {
        nombre:    document.getElementById('coNombre')?.value.trim()    ?? '',
        apellidos: document.getElementById('coApellidos')?.value.trim() ?? '',
        email:     document.getElementById('coEmail')?.value.trim()     ?? '',
        direccion: {
            calle:    document.getElementById('coDireccion')?.value.trim()  ?? '',
            ciudad:   document.getElementById('coCiudad')?.value.trim()     ?? '',
            cp:       document.getElementById('coCP')?.value.trim()         ?? '',
            pais:     document.getElementById('coPais')?.value              ?? '',
            telefono: document.getElementById('coTelefono')?.value.trim()   ?? '',
        },
        items: cartItems.map(i => ({
            productoId: i.producto_id ?? i.id,
            talla:      i.size ?? 'unica',
            cantidad:   i.quantity,
        })),
        nota:         document.getElementById('coNota')?.value.trim() || undefined,
        codigoCupon:  codigoCuponOk || undefined,
    };

    try {
        const fetchFn = isLoggedIn()
            ? authFetch
            : (url, opts) => fetch(url, { ...opts, credentials: 'include' });

        const res  = await fetchFn(`${API_URL}/orders`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(body),
        });
        const json = await res.json();

        if (!json.success) {
            showNotification(json.message || 'Error al procesar el pedido', 'error');
            return;
        }

        await clearCart();
        document.dispatchEvent(new CustomEvent('cart:updated'));
        sessionStorage.setItem('unlockd_pedido', JSON.stringify(json.data.pedido));
        window.location.href = `/src/pages/checkout/confirmacion.html?id=${json.data.pedido.id}`;

    } catch (err) {
        console.error('[checkout]', err.message);
        showNotification('Error de conexión. ¿El servidor está activo?', 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Finalizar pedido'; }
    }
}
