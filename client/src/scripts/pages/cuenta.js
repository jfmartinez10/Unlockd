import { isLoggedIn, isAdmin, logoutUser, authFetch } from '../utils/auth.js';
import { API_URL } from '../config/api.js';

const fmt = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

const ESTADO_LABEL = {
    pendiente:  'Pendiente',
    confirmado: 'Confirmado',
    enviado:    'Enviado',
    entregado:  'Entregado',
    cancelado:  'Cancelado',
};

document.addEventListener('DOMContentLoaded', async () => {

    /* Redirigir si no hay sesión */
    if (!isLoggedIn()) {
        window.location.href = '/src/pages/auth/login.html';
        return;
    }

    /* Si es admin, mostrar acceso al panel */
    if (isAdmin()) {
        const seccion = document.querySelector('.cuenta-seccion');
        if (seccion) {
            const banner     = document.createElement('a');
            banner.href      = '/src/pages/admin/admin.html';
            banner.className = 'cuenta-admin-banner';
            banner.textContent = '→ Panel de administración';
            seccion.insertBefore(banner, seccion.querySelector('.cuenta-grid'));
        }
    }

    /* Cerrar sesión */
    const btnCerrar = document.getElementById('btnCerrarSesion');
    if (btnCerrar) {
        btnCerrar.addEventListener('click', async () => {
            await logoutUser();
            window.location.href = '/src/pages/auth/login.html';
        });
    }

    /* Cargar pedidos reales */
    await _cargarPedidos();
});

async function _cargarPedidos() {
    const contenedor = document.getElementById('pedidosContenido');
    if (!contenedor) return;

    try {
        const res  = await authFetch(`${API_URL}/orders/mine`);
        const json = await res.json();

        if (!json.success || json.data.length === 0) {
            contenedor.innerHTML = `
                <p class="cuenta-pedidos-vacio">Aún no hay pedidos</p>
                <p class="cuenta-pedidos-subtexto">¿Listo para desbloquear tu nuevo estilo?</p>`;
            return;
        }

        contenedor.innerHTML = json.data.map(p => {
            const ref   = `#${p.id.slice(0, 8).toUpperCase()}`;
            const fecha = new Date(p.creado_en).toLocaleDateString('es-ES', {
                day: '2-digit', month: 'short', year: 'numeric',
            });
            const estado = ESTADO_LABEL[p.estado] ?? p.estado;
            const total  = fmt.format(Number(p.total));
            return `
            <div class="cuenta-pedido-item">
                <div class="cuenta-pedido-ref">${ref}</div>
                <div class="cuenta-pedido-info">${fecha} · ${total} · ${estado}</div>
            </div>`;
        }).join('');

    } catch (err) {
        console.error('[cuenta] pedidos:', err.message);
        contenedor.innerHTML = `<p class="cuenta-pedidos-vacio">Error al cargar los pedidos</p>`;
    }
}
