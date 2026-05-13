import { isLoggedIn, authFetch } from '../utils/auth.js';
import { API_URL }               from '../config/api.js';

const fmt = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

const ESTADO_LABEL = {
    pendiente:  'Pendiente',
    confirmado: 'Confirmado',
    enviado:    'Enviado',
    entregado:  'Entregado',
    cancelado:  'Cancelado',
};

document.addEventListener('DOMContentLoaded', async () => {

    if (!isLoggedIn()) {
        window.location.href = '/src/pages/auth/login.html';
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const id     = params.get('id');

    if (!id) {
        window.location.href = '/src/pages/cuenta/cuenta.html';
        return;
    }

    try {
        const res  = await authFetch(`${API_URL}/orders/mine/${id}`);
        const json = await res.json();

        if (!json.success) {
            window.location.href = '/src/pages/cuenta/cuenta.html';
            return;
        }

        _renderPedido(json.data);

    } catch (err) {
        console.error('[pedido]', err.message);
        window.location.href = '/src/pages/cuenta/cuenta.html';
    }
});

function _renderPedido(p) {
    /* Ref + estado */
    const refEl    = document.getElementById('pedidoRef');
    const estadoEl = document.getElementById('pedidoEstado');
    const fechaEl  = document.getElementById('pedidoFecha');

    if (refEl)    refEl.textContent    = `#${p.id.slice(0, 8).toUpperCase()}`;
    if (estadoEl) {
        estadoEl.textContent = ESTADO_LABEL[p.estado] ?? p.estado;
        estadoEl.classList.add(`pedido-badge--${p.estado}`);
    }
    if (fechaEl) {
        const fecha = new Date(p.creado_en).toLocaleDateString('es-ES', {
            day: '2-digit', month: 'long', year: 'numeric',
        });
        fechaEl.textContent = `Realizado el ${fecha}`;
    }

    /* Items */
    const itemsEl = document.getElementById('pedidoItems');
    const items   = p.items ?? [];
    if (itemsEl) {
        if (items.length === 0) {
            itemsEl.innerHTML = '<p>Sin productos</p>';
        } else {
            itemsEl.innerHTML = items.map(item => `
                <div class="pedido-item">
                    <div class="pedido-item-info">
                        <span class="pedido-item-nombre">${item.nombre_producto}</span>
                        <span class="pedido-item-talla">Talla: ${item.talla} · Qty: ${item.cantidad}</span>
                    </div>
                    <span class="pedido-item-precio">${fmt.format(Number(item.precio_unitario) * item.cantidad)}</span>
                </div>`).join('');
        }
    }

    /* Dirección */
    const dirEl = document.getElementById('pedidoDireccion');
    if (dirEl) {
        let dir = {};
        try { dir = typeof p.direccion === 'string' ? JSON.parse(p.direccion) : p.direccion; } catch {}
        dirEl.innerHTML = `
            <p>${p.nombre} ${p.apellidos}</p>
            <p>${dir.calle ?? ''}</p>
            <p>${dir.cp ?? ''} ${dir.ciudad ?? ''}</p>
            <p>${dir.pais ?? ''}</p>
            ${dir.telefono ? `<p>${dir.telefono}</p>` : ''}`;
    }

    /* Totales */
    const totalesEl = document.getElementById('pedidoTotales');
    if (totalesEl) {
        const envio = Number(p.envio ?? 0);
        totalesEl.innerHTML = `
            <div class="pedido-total-fila">
                <span>Subtotal</span>
                <span>${fmt.format(Number(p.total) - envio)}</span>
            </div>
            <div class="pedido-total-fila">
                <span>Envío</span>
                <span>${envio === 0 ? 'Gratis' : fmt.format(envio)}</span>
            </div>
            <div class="pedido-total-fila pedido-total-fila--final">
                <span>Total</span>
                <span>${fmt.format(Number(p.total))}</span>
            </div>`;
    }
}
