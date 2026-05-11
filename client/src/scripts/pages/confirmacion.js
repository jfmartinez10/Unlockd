import { isLoggedIn, authFetch } from '../utils/auth.js';
import { API_URL }               from '../config/api.js';

const fmt = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const id     = params.get('id');

    if (!id) {
        window.location.href = '/src/pages/index.html';
        return;
    }

    /* Mostrar referencia inmediatamente */
    const refEl = document.getElementById('confRef');
    if (refEl) refEl.textContent = `#${id.slice(0, 8).toUpperCase()}`;

    /* Intentar cargar detalles del pedido */
    let pedido = null;

    if (isLoggedIn()) {
        try {
            const res  = await authFetch(`${API_URL}/orders/mine/${id}`);
            const json = await res.json();
            if (json.success) pedido = json.data;
        } catch { /* fallback a sessionStorage */ }
    }

    /* Fallback: datos guardados en sessionStorage justo tras crear el pedido */
    if (!pedido) {
        try {
            pedido = JSON.parse(sessionStorage.getItem('unlockd_pedido') || 'null');
        } catch { /* nada */ }
    }

    if (pedido) _renderPedido(pedido);

    /* Limpiar sessionStorage */
    sessionStorage.removeItem('unlockd_pedido');
});

function _renderPedido(pedido) {
    const emailEl   = document.getElementById('confEmail');
    const resumenEl = document.getElementById('confResumen');
    const totalesEl = document.getElementById('confTotales');

    if (emailEl && pedido.email) {
        emailEl.textContent = `Confirmación enviada a ${pedido.email}`;
    }

    const items = pedido.items ?? [];
    if (resumenEl && items.length > 0) {
        resumenEl.innerHTML = `
            <div class="conf-tabla-header">
                <span>Producto</span>
                <span>Uds</span>
                <span>Precio</span>
            </div>
            ${items.map(item => `
            <div class="conf-tabla-fila">
                <span class="conf-item-nombre">${item.nombre_producto}</span>
                <span class="conf-item-talla">${item.talla} × ${item.cantidad}</span>
                <span class="conf-item-precio">${fmt.format(Number(item.precio_unitario) * item.cantidad)}</span>
            </div>`).join('')}
        `;
    }

    if (totalesEl) {
        const envio = Number(pedido.envio ?? 0);
        totalesEl.innerHTML = `
            <div class="conf-total-fila">
                <span>Envío</span>
                <span>${envio === 0 ? 'Gratis' : fmt.format(envio)}</span>
            </div>
            <div class="conf-total-fila conf-total-final">
                <span>Total</span>
                <span>${fmt.format(Number(pedido.total))}</span>
            </div>
        `;
    }
}
