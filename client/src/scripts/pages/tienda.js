import { addToCart } from '../utils/cartService.js';
import { initFavoritos, esFavorito, toggleFavorito } from '../utils/favoritosService.js';
import { API_URL } from '../config/api.js';
import { abrirQuickAdd } from '../components/quickAdd.js';

const SVG_CESTA = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 33 33" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="5" y="13" width="23" height="15" rx="3"/>
    <path d="M12 13C12 9.4 14 7 16.5 7C19 7 21 9.4 21 13"/>
</svg>`;

const SVG_CORAZON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
</svg>`;

/* ── Estado aplicado (lo que hay en pantalla) ─────────────── */
let productos      = [];
let estadoColores       = [];   // [] = todos
let estadoTallas        = [];   // [] = todas
let estadoDisponibilidad = [];  // [] = todas
let estadoOrden    = 'defecto';
let estadoBusqueda = '';
let estadoVista    = 'grid';
let paginaActual   = 1;
const ITEMS_POR_PAGINA = 9;

/* ── Estado pendiente (lo que está seleccionado en el panel pero no aplicado) */
let pendColores       = [];
let pendTallas        = [];
let pendDisponibilidad = [];
let pendOrden         = 'defecto';

document.addEventListener('DOMContentLoaded', async () => {

    const grid          = document.getElementById('tiendaGrid');
    const dotsContainer = document.getElementById('paginaDots');
    const paginacion    = document.getElementById('tiendaPaginacion');
    const contador      = document.getElementById('tiendaContador');

    /* ── Skeleton mientras carga ── */
    function mostrarSkeleton() {
        grid.innerHTML = Array.from({ length: 6 }, () => `
            <div class="tienda-skeleton">
                <div class="tienda-skeleton-img sk-anim"></div>
                <div class="tienda-skeleton-info">
                    <div class="tienda-skeleton-nombre sk-anim"></div>
                    <div class="tienda-skeleton-precio sk-anim"></div>
                </div>
            </div>`).join('');
    }

    /* ── Cargar productos desde la API ── */
    async function cargarProductos() {
        mostrarSkeleton();
        try {
            const res  = await fetch(`${API_URL}/products`);
            const json = await res.json();
            if (!json.success) throw new Error(json.message);
            productos = json.data;
        } catch (err) {
            console.error('Error al cargar productos:', err.message);
            grid.innerHTML = '<p class="tienda-sin-resultados">Error al cargar productos. Asegúrate de que el servidor está activo.</p>';
        }
    }

    function getProductosFiltradosOrdenados() {
        let result = [...productos];

        /* Colores (multi-select) */
        if (estadoColores.length > 0) {
            result = result.filter(p => estadoColores.includes(p.color));
        }

        /* Tallas (multi-select) */
        if (estadoTallas.length > 0) {
            result = result.filter(p =>
                Array.isArray(p.tallas) && estadoTallas.some(t => p.tallas.includes(t))
            );
        }

        /* Disponibilidad */
        if (estadoDisponibilidad.length > 0) {
            const querExistencia = estadoDisponibilidad.includes('existencia');
            const querAgotado    = estadoDisponibilidad.includes('agotado');
            if (querExistencia && !querAgotado) {
                result = result.filter(p => (p.stock ?? 1) > 0);
            } else if (querAgotado && !querExistencia) {
                result = result.filter(p => (p.stock ?? 1) <= 0);
            }
            /* Si ambos marcados, no filtra */
        }

        /* Búsqueda textual */
        const q = estadoBusqueda.trim().toLowerCase();
        if (q) {
            result = result.filter(p => p.name.toLowerCase().includes(q));
        }

        /* Orden */
        switch (estadoOrden) {
            case 'menor-mayor': result.sort((a, b) => a.priceNumeric - b.priceNumeric); break;
            case 'mayor-menor': result.sort((a, b) => b.priceNumeric - a.priceNumeric); break;
            case 'az':          result.sort((a, b) => a.name.localeCompare(b.name, 'es')); break;
            case 'za':          result.sort((a, b) => b.name.localeCompare(a.name, 'es')); break;
            case 'reciente':
                result.sort((a, b) => new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0));
                break;
        }

        return result;
    }

    function crearCardHTML(p) {
        const fav = esFavorito(p.id);
        return `
        <article class="tienda-card" data-id="${p.id}" data-color="${p.color}">
            <div class="tienda-card-imagen-wrap">
                <img class="tienda-card-img img-principal" src="${p.images[0]}" alt="${p.name}">
                <img class="tienda-card-img img-hover"     src="${p.images[1]}" alt="${p.name}" loading="lazy">
                <button class="btn-favorito${fav ? ' activo' : ''}" aria-label="Guardar en favoritos" data-id="${p.id}" data-activo="${fav}">
                    ${SVG_CORAZON}
                </button>
            </div>
            <div class="tienda-card-info">
                <div class="tienda-card-texto">
                    <span class="tienda-nombre">${p.name}</span>
                    <span class="tienda-precio">${p.price}</span>
                </div>
                <button class="btn-cesta-mini" aria-label="Añadir al carrito">${SVG_CESTA}</button>
            </div>
        </article>`;
    }

    function crearListaHTML(p) {
        const fav = esFavorito(p.id);
        return `
        <article class="tienda-card tienda-card--lista" data-id="${p.id}" data-color="${p.color}">
            <div class="tienda-card-imagen-wrap">
                <img class="tienda-card-img img-principal" src="${p.images[0]}" alt="${p.name}">
                <img class="tienda-card-img img-hover"     src="${p.images[1]}" alt="${p.name}" loading="lazy">
            </div>
            <div class="tienda-card-info tienda-card-info--lista">
                <div class="tienda-card-texto">
                    <span class="tienda-nombre">${p.name}</span>
                    <span class="tienda-precio">${p.price}</span>
                </div>
                <div class="tienda-lista-acciones">
                    <button class="btn-cesta-mini" aria-label="Añadir al carrito">${SVG_CESTA}</button>
                    <button class="btn-favorito btn-favorito--lista${fav ? ' activo' : ''}" aria-label="Guardar en favoritos" data-id="${p.id}" data-activo="${fav}">
                        ${SVG_CORAZON}
                    </button>
                </div>
            </div>
        </article>`;
    }

    async function renderGrid() {
        await initFavoritos();
        const filtrados    = getProductosFiltradosOrdenados();
        const total        = filtrados.length;
        const totalPaginas = Math.max(1, Math.ceil(total / ITEMS_POR_PAGINA));

        if (paginaActual > totalPaginas) paginaActual = 1;

        if (contador) contador.textContent = `${total} producto${total !== 1 ? 's' : ''}`;
        document.dispatchEvent(new CustomEvent('buscador:resultados', { detail: { total } }));

        const inicio   = (paginaActual - 1) * ITEMS_POR_PAGINA;
        const enPagina = filtrados.slice(inicio, inicio + ITEMS_POR_PAGINA);

        grid.classList.toggle('tienda-grid--lista', estadoVista === 'lista');

        if (enPagina.length === 0) {
            grid.innerHTML = '<p class="tienda-sin-resultados">Sin resultados</p>';
        } else {
            const renderFn = estadoVista === 'lista' ? crearListaHTML : crearCardHTML;
            grid.innerHTML = enPagina.map(renderFn).join('');
            attachCardEvents();
        }

        renderPaginacion(totalPaginas);
        actualizarBadge();
    }

    function attachCardEvents() {
        grid.querySelectorAll('.tienda-card-imagen-wrap').forEach(wrap => {
            wrap.addEventListener('click', (e) => {
                if (e.target.closest('.btn-favorito')) return;
                const id = wrap.closest('.tienda-card').dataset.id;
                window.location.href = `/src/pages/producto/producto.html?id=${id}`;
            });
        });

        grid.querySelectorAll('.btn-favorito').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id     = btn.dataset.id;
                const activo = await toggleFavorito(id);
                btn.dataset.activo = String(activo);
                btn.classList.toggle('activo', activo);
            });
        });

        grid.querySelectorAll('.btn-cesta-mini').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.closest('.tienda-card').dataset.id;
                const p  = productos.find(x => x.id === id);
                if (p) abrirQuickAdd(p);
            });
        });
    }

    function renderPaginacion(totalPaginas) {
        dotsContainer.innerHTML = '';
        if (paginacion) paginacion.classList.toggle('oculta', totalPaginas <= 1);

        for (let i = 1; i <= totalPaginas; i++) {
            const dot = document.createElement('button');
            dot.className = `pagina-dot${i === paginaActual ? ' activo' : ''}`;
            dot.setAttribute('aria-label', `Ir a página ${i}`);
            dot.addEventListener('click', () => { paginaActual = i; renderGrid(); });
            dotsContainer.appendChild(dot);
        }
    }

    /* ── Badge del botón Filtros ── */
    function actualizarBadge() {
        const badge = document.getElementById('filtrosBadge');
        if (!badge) return;
        const hayFiltros =
            estadoColores.length > 0 ||
            estadoTallas.length > 0 ||
            estadoDisponibilidad.length > 0 ||
            estadoOrden !== 'defecto';
        badge.style.display = hayFiltros ? 'block' : 'none';
    }

    /* ── Buscador global ── */
    document.addEventListener('buscador:query', (e) => {
        estadoBusqueda = e.detail?.query ?? '';
        paginaActual = 1;
        renderGrid();
    });

    /* Query de URL */
    const urlQ = new URLSearchParams(window.location.search).get('q');
    if (urlQ) estadoBusqueda = urlQ;

    /* ── Toggle de vista ── */
    const btnVistaGrid  = document.getElementById('btnVistaGrid');
    const btnVistaLista = document.getElementById('btnVistaLista');

    if (btnVistaGrid && btnVistaLista) {
        [btnVistaGrid, btnVistaLista].forEach(btn => {
            btn.addEventListener('click', () => {
                estadoVista = btn.dataset.vista;
                btnVistaGrid.classList.toggle('activo', estadoVista === 'grid');
                btnVistaLista.classList.toggle('activo', estadoVista === 'lista');
                paginaActual = 1;
                renderGrid();
            });
        });
    }

    /* ════════════════════════════════════════════════════════
       PANEL DE FILTROS
    ════════════════════════════════════════════════════════ */
    const btnAbrir   = document.getElementById('btnAbrirFiltros');
    const overlay    = document.getElementById('filtrosOverlay');
    const panel      = document.getElementById('filtrosPanel');
    const btnCerrar  = document.getElementById('filtrosCerrar');
    const btnBorrar  = document.getElementById('filtrosBorrar');
    const btnAplicar = document.getElementById('filtrosAplicar');

    function abrirPanel() {
        /* Sincronizar controles con estado pendiente */
        sincronizarPanel();
        panel.classList.add('activo');
        overlay.classList.add('activo');
        panel.setAttribute('aria-hidden', 'false');
        overlay.setAttribute('aria-hidden', 'false');
        btnAbrir.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    }

    function cerrarPanel() {
        panel.classList.remove('activo');
        overlay.classList.remove('activo');
        panel.setAttribute('aria-hidden', 'true');
        overlay.setAttribute('aria-hidden', 'true');
        btnAbrir.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }

    /* Carga en el panel el estado aplicado actual */
    function sincronizarPanel() {
        /* Disponibilidad */
        panel.querySelectorAll('.filtros-disp-check').forEach(cb => {
            cb.checked = estadoDisponibilidad.includes(cb.value);
        });
        /* Colores */
        panel.querySelectorAll('.filtros-color-check').forEach(cb => {
            cb.checked = estadoColores.includes(cb.value);
        });
        /* Orden */
        const radioActivo = panel.querySelector(`input[name="filtrosOrden"][value="${estadoOrden}"]`);
        if (radioActivo) radioActivo.checked = true;
        /* Tallas */
        panel.querySelectorAll('.filtros-talla-check').forEach(cb => {
            cb.checked = estadoTallas.includes(cb.value);
        });
    }

    /* Lee el estado actual del panel (sin aplicar) */
    function leerPanel() {
        pendDisponibilidad = [...panel.querySelectorAll('.filtros-disp-check:checked')].map(cb => cb.value);
        pendColores = [...panel.querySelectorAll('.filtros-color-check:checked')].map(cb => cb.value);
        pendTallas  = [...panel.querySelectorAll('.filtros-talla-check:checked')].map(cb => cb.value);
        const radioSel = panel.querySelector('input[name="filtrosOrden"]:checked');
        pendOrden = radioSel ? radioSel.value : 'defecto';
    }

    function aplicarFiltros() {
        leerPanel();
        estadoDisponibilidad = pendDisponibilidad;
        estadoColores  = pendColores;
        estadoTallas   = pendTallas;
        estadoOrden    = pendOrden;
        paginaActual   = 1;
        cerrarPanel();
        renderGrid();
    }

    function borrarTodo() {
        /* Limpiar controles del panel */
        panel.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        const radioDefecto = panel.querySelector('input[name="filtrosOrden"][value="defecto"]');
        if (radioDefecto) radioDefecto.checked = true;
        /* Limpiar estado pendiente */
        pendColores = [];
        pendTallas  = [];
        pendDisponibilidad = [];
        pendOrden = 'defecto';
    }

    btnAbrir?.addEventListener('click', abrirPanel);
    btnCerrar?.addEventListener('click', cerrarPanel);
    overlay?.addEventListener('click', cerrarPanel);
    btnAplicar?.addEventListener('click', aplicarFiltros);
    btnBorrar?.addEventListener('click', borrarTodo);

    /* ESC cierra el panel */
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && panel.classList.contains('activo')) cerrarPanel();
    });

    /* ── Arranque ── */
    await cargarProductos();
    renderGrid();
});
