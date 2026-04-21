import { addToCart } from '../utils/storage.js';

document.addEventListener('DOMContentLoaded', () => {

    /* Catálogo */
    const PRODUCTOS_DB = [
        {
            id: 'white-tshirt',
            nombre: 'WHITE TSHIRT',
            precio: '29,99€',
            priceNumeric: 29.99,
            color: 'blanco',
            img:      '/public/assets/images/products/camiseta-blanca-delante.png',
            imgHover: '/public/assets/images/products/camiseta-blanca-detras.png',
        },
        {
            id: 'black-tshirt',
            nombre: 'BLACK TSHIRT',
            precio: '29,99€',
            priceNumeric: 29.99,
            color: 'negro',
            img:      '/public/assets/images/products/camiseta-negra-delante.png',
            imgHover: '/public/assets/images/products/camiseta-negra-detras.png',
        },
    ];

    /* Estado */
    let estadoFiltro   = 'todos';
    let estadoOrden    = 'defecto';
    let estadoBusqueda = '';
    const ITEMS_POR_PAGINA = 8;
    let paginaActual = 1;

    /* DOM */
    const grid           = document.getElementById('tiendaGrid');
    const dotsContainer  = document.getElementById('paginaDots');
    const paginacion     = document.getElementById('tiendaPaginacion');
    const contador       = document.getElementById('tiendaContador');
    const btnSort        = document.getElementById('btnSort');
    const dropdownSort   = document.getElementById('dropdownSort');
    const btnFilter      = document.getElementById('btnFilter');
    const dropdownFilter = document.getElementById('dropdownFilter');

    /* Icono cesta */
    const SVG_CESTA = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 33 33" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="5" y="13" width="23" height="15" rx="3"/>
        <path d="M12 13C12 9.4 14 7 16.5 7C19 7 21 9.4 21 13"/>
    </svg>`;

    /* Filtrado y orden */
    function getProductosFiltradosOrdenados() {
        let result = [...PRODUCTOS_DB];

        /* Filtro por color */
        if (estadoFiltro !== 'todos') {
            result = result.filter(p => p.color === estadoFiltro);
        }

        /* Búsqueda por nombre */
        const query = estadoBusqueda.trim().toLowerCase();
        if (query) {
            result = result.filter(p => p.nombre.toLowerCase().includes(query));
        }

        /* Ordenado */
        if (estadoOrden === 'mayor-menor') {
            result.sort((a, b) => b.priceNumeric - a.priceNumeric);
        } else if (estadoOrden === 'menor-mayor') {
            result.sort((a, b) => a.priceNumeric - b.priceNumeric);
        }

        return result;
    }

    /* HTML tarjeta */
    function crearCardHTML(p) {
        return `
        <article class="tienda-card" data-id="${p.id}" data-color="${p.color}">
            <div class="tienda-card-imagen-wrap">
                <img class="tienda-card-img img-principal"
                     src="${p.img}"
                     alt="${p.nombre}">
                <img class="tienda-card-img img-hover"
                     src="${p.imgHover}"
                     alt="${p.nombre}"
                     loading="lazy">
                <button class="btn-favorito" aria-label="Guardar en favoritos" data-activo="false">
                    <img src="/public/assets/images/logo.png" alt="" aria-hidden="true">
                </button>
            </div>
            <div class="tienda-card-info">
                <div class="tienda-card-texto">
                    <span class="tienda-nombre">${p.nombre}</span>
                    <span class="tienda-precio">${p.precio}</span>
                </div>
                <button class="btn-cesta-mini" aria-label="Añadir al carrito">
                    ${SVG_CESTA}
                </button>
            </div>
        </article>`;
    }

    /* Render grid */
    function renderGrid() {
        const productos    = getProductosFiltradosOrdenados();
        const total        = productos.length;
        const totalPaginas = Math.max(1, Math.ceil(total / ITEMS_POR_PAGINA));

        if (paginaActual > totalPaginas) paginaActual = 1;

        /* Actualizar contador y notificar al buscador global */
        if (contador) {
            contador.textContent = `${total} producto${total !== 1 ? 's' : ''}`;
        }
        document.dispatchEvent(new CustomEvent('buscador:resultados', { detail: { total } }));

        const inicio   = (paginaActual - 1) * ITEMS_POR_PAGINA;
        const enPagina = productos.slice(inicio, inicio + ITEMS_POR_PAGINA);

        if (enPagina.length === 0) {
            grid.innerHTML = '<p class="tienda-sin-resultados">Sin resultados</p>';
        } else {
            grid.innerHTML = enPagina.map(crearCardHTML).join('');
            attachCardEvents();
        }

        renderPaginacion(totalPaginas);
    }

    /* Eventos tarjetas */
    function attachCardEvents() {
        /* Detalle producto */
        grid.querySelectorAll('.tienda-card-imagen-wrap').forEach(wrap => {
            wrap.addEventListener('click', (e) => {
                if (e.target.closest('.btn-favorito')) return;
                const id = wrap.closest('.tienda-card').dataset.id;
                window.location.href = `/src/pages/producto/producto.html?id=${id}`;
            });
        });

        /* Favorito: toggle visual */
        grid.querySelectorAll('.btn-favorito').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const activo = btn.dataset.activo === 'true';
                btn.dataset.activo = String(!activo);
                btn.classList.toggle('activo', !activo);
            });
        });

        /* Cesta: añadir al carrito */
        grid.querySelectorAll('.btn-cesta-mini').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.closest('.tienda-card').dataset.id;
                const p  = PRODUCTOS_DB.find(x => x.id === id);
                if (p) {
                    addToCart({
                        id:           p.id,
                        nombre:       p.nombre,
                        precio:       p.precio,
                        priceNumeric: p.priceNumeric,
                        size:         null,
                        quantity:     1,
                        imagen:       p.img
                    });
                    document.dispatchEvent(new CustomEvent('cart:updated'));
                    import('../components/carrito.js').then(({ abrirCarrito }) => abrirCarrito());
                }
                btn.classList.add('clicked');
                setTimeout(() => btn.classList.remove('clicked'), 350);
            });
        });
    }

    /* Paginación */
    function renderPaginacion(totalPaginas) {
        dotsContainer.innerHTML = '';

        /* Ocultar barra si no hay multipágina */
        if (paginacion) {
            paginacion.classList.toggle('oculta', totalPaginas <= 1);
        }

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
    if (urlQ) {
        estadoBusqueda = urlQ;
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

    /* Cerrar dropdowns al clicar fuera */
    document.addEventListener('click', () => {
        dropdownSort.classList.remove('activo');
        dropdownFilter.classList.remove('activo');
        btnSort.setAttribute('aria-expanded', 'false');
        btnFilter.setAttribute('aria-expanded', 'false');
    });

    /* Render inicial */
    renderGrid();
});
