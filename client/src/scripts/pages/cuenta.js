import { isLoggedIn, isAdmin, logoutUser, authFetch } from '../utils/auth.js';
import { API_URL } from '../config/api.js';
import { initFavoritos, toggleFavorito } from '../utils/favoritosService.js';

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

    /* Cargar pedidos y favoritos en paralelo */
    await Promise.all([_cargarPedidos(), _cargarFavoritos()]);
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
            <a class="cuenta-pedido-item" href="/src/pages/cuenta/pedido.html?id=${p.id}">
                <div class="cuenta-pedido-ref">${ref}</div>
                <div class="cuenta-pedido-info">${fecha} · ${total} · <span class="cuenta-pedido-estado cuenta-estado--${p.estado}">${estado}</span></div>
                <span class="cuenta-pedido-arrow">&#8594;</span>
            </a>`;
        }).join('');

    } catch (err) {
        console.error('[cuenta] pedidos:', err.message);
        contenedor.innerHTML = `<p class="cuenta-pedidos-vacio">Error al cargar los pedidos</p>`;
    }
}

async function _cargarFavoritos() {
    const contenedor = document.getElementById('favoritosContenido');
    if (!contenedor) return;

    try {
        /* 1. Obtener IDs de favoritos */
        const resFavs = await authFetch(`${API_URL}/favorites`);
        const jsonFavs = await resFavs.json();
        if (!jsonFavs.success || jsonFavs.data.length === 0) {
            contenedor.innerHTML = `
                <p class="cuenta-pedidos-vacio cuenta-fav-vacio">Aún no tienes favoritos guardados</p>`;
            return;
        }

        /* 2. Obtener todos los productos y filtrar los favoritos */
        const resProd = await fetch(`${API_URL}/products`);
        const jsonProd = await resProd.json();
        const favIds   = new Set(jsonFavs.data);
        const favProds = (jsonProd.data ?? []).filter(p => favIds.has(p.id));

        await initFavoritos();

        if (favProds.length === 0) {
            contenedor.innerHTML = `<p class="cuenta-pedidos-vacio cuenta-fav-vacio">Aún no tienes favoritos guardados</p>`;
            return;
        }

        contenedor.innerHTML = favProds.map(p => `
            <div class="cuenta-fav-item" data-id="${p.id}">
                <a href="/src/pages/producto/producto.html?id=${p.id}" class="cuenta-fav-link">
                    <img src="${p.images[0]}" alt="${p.name}" class="cuenta-fav-img">
                    <div class="cuenta-fav-info">
                        <span class="cuenta-fav-nombre">${p.name}</span>
                        <span class="cuenta-fav-precio">${p.price}</span>
                    </div>
                </a>
                <button class="cuenta-fav-eliminar" aria-label="Eliminar favorito" data-id="${p.id}">✕</button>
            </div>`).join('');

        /* Botones eliminar */
        contenedor.querySelectorAll('.cuenta-fav-eliminar').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                await toggleFavorito(id);
                btn.closest('.cuenta-fav-item').remove();
                if (!contenedor.querySelector('.cuenta-fav-item')) {
                    contenedor.innerHTML = `<p class="cuenta-pedidos-vacio cuenta-fav-vacio">Aún no tienes favoritos guardados</p>`;
                }
            });
        });

    } catch (err) {
        console.error('[cuenta] favoritos:', err.message);
        contenedor.innerHTML = `<p class="cuenta-pedidos-vacio">Error al cargar favoritos</p>`;
    }
}
