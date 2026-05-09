import { addToCart } from '../utils/cartService.js';
import { initFavoritos, esFavorito, toggleFavorito } from '../utils/favoritosService.js';
import { API_URL } from '../config/api.js';

const SVG_CESTA = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 33 33" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="5" y="13" width="23" height="15" rx="3"/>
    <path d="M12 13C12 9.4 14 7 16.5 7C19 7 21 9.4 21 13"/>
</svg>`;

/* Estado */
let productos      = [];
let estadoFiltro   = 'todos';
let estadoOrden    = 'defecto';
let estadoBusqueda = '';
let estadoVista    = 'grid';
let paginaActual   = 1;
const ITEMS_POR_PAGINA = 9;

document.addEventListener('DOMContentLoaded', async () => {

    const grid           = document.getElementById('tiendaGrid');
    const dotsContainer  = document.getElementById('paginaDots');
    const paginacion     = document.getElementById('tiendaPaginacion');
    const contador       = document.getElementById('tiendaContador');
    const btnSort        = document.getElementById('btnSort');
    const dropdownSort   = document.getElementById('dropdownSort');
    const btnFilter      = document.getElementById('btnFilter');
    const dropdownFilter = document.getElementById('dropdownFilter');

    /* Cargar productos desde la API */
    async function cargarProductos() {
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

        if (estadoFiltro !== 'todos') {
            result = result.filter(p => p.color === estadoFiltro);
        }

        const q = estadoBusqueda.trim().toLowerCase();
        if (q) {
            result = result.filter(p => p.name.toLowerCase().includes(q));
        }

        if (estadoOrden === 'mayor-menor') result.sort((a, b) => b.priceNumeric - a.priceNumeric);
        if (estadoOrden === 'menor-mayor') result.sort((a, b) => a.priceNumeric - b.priceNumeric);

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
                    <img src="/public/assets/images/logo.png" alt="" aria-hidden="true">
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
                        <img src="/public/assets/images/logo.png" alt="" aria-hidden="true">
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
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = btn.closest('.tienda-card').dataset.id;
                const p  = productos.find(x => x.id === id);
                if (p) {
                    await addToCart({
                        id,
                        nombre:       p.name,
                        precio:       p.price,
                        priceNumeric: p.priceNumeric,
                        size:         null,
                        quantity:     1,
                        imagen:       p.images[0]
                    });
                    document.dispatchEvent(new CustomEvent('cart:updated'));
                    import('../components/carrito.js').then(({ abrirCarrito }) => abrirCarrito());
                }
                btn.classList.add('clicked');
                setTimeout(() => btn.classList.remove('clicked'), 350);
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

    /* Buscador global */
    document.addEventListener('buscador:query', (e) => {
        estadoBusqueda = e.detail?.query ?? '';
        paginaActual = 1;
        renderGrid();
    });

    /* Query de URL */
    const urlQ = new URLSearchParams(window.location.search).get('q');
    if (urlQ) estadoBusqueda = urlQ;

    /* Toggle vista */
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

    /* Dropdown Ordenar */
    btnSort.addEventListener('click', (e) => {
        e.stopPropagation();
        const abierto = dropdownSort.classList.toggle('activo');
        btnSort.setAttribute('aria-expanded', String(abierto));
        dropdownFilter.classList.remove('activo');
        btnFilter.setAttribute('aria-expanded', 'false');
    });

    dropdownSort.querySelectorAll('.tienda-dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
            estadoOrden = item.dataset.orden;
            dropdownSort.querySelectorAll('.tienda-dropdown-item').forEach(i => i.classList.remove('activo'));
            item.classList.add('activo');
            dropdownSort.classList.remove('activo');
            btnSort.setAttribute('aria-expanded', 'false');
            paginaActual = 1;
            renderGrid();
        });
    });

    /* Dropdown Filtrar */
    btnFilter.addEventListener('click', (e) => {
        e.stopPropagation();
        const abierto = dropdownFilter.classList.toggle('activo');
        btnFilter.setAttribute('aria-expanded', String(abierto));
        dropdownSort.classList.remove('activo');
        btnSort.setAttribute('aria-expanded', 'false');
    });

    dropdownFilter.querySelectorAll('.tienda-dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
            estadoFiltro = item.dataset.color;
            dropdownFilter.querySelectorAll('.tienda-dropdown-item').forEach(i => i.classList.remove('activo'));
            item.classList.add('activo');
            dropdownFilter.classList.remove('activo');
            btnFilter.setAttribute('aria-expanded', 'false');
            paginaActual = 1;
            renderGrid();
        });
    });

    document.addEventListener('click', () => {
        dropdownSort.classList.remove('activo');
        dropdownFilter.classList.remove('activo');
        btnSort.setAttribute('aria-expanded', 'false');
        btnFilter.setAttribute('aria-expanded', 'false');
    });

    /* Arranque */
    await cargarProductos();
    renderGrid();
});
