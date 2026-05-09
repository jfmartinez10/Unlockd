import { addToCart } from '../utils/cartService.js';
import { API_URL }   from '../config/api.js';

const SVG_CESTA_MINI = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 33 33" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="5" y="13" width="23" height="15" rx="3"/>
    <path d="M12 13C12 9.4 14 7 16.5 7C19 7 21 9.4 21 13"/>
</svg>`;

/* Mapa de productos cargados desde la API para el carrito */
let productosMap = {};

document.addEventListener('DOMContentLoaded', async () => {

    /* Cargar productos y construir mapa id -> producto */
    try {
        const res  = await fetch(`${API_URL}/products`);
        const json = await res.json();
        if (json.success) {
            json.data.forEach(p => { productosMap[p.id] = p; });
        }
    } catch (err) {
        console.error('Error al cargar productos para el home:', err.message);
    }

    /* Carrusel infinito */
    const duplicarElementosCarrusel = (pista) => {
        if (!pista) return;
        Array.from(pista.children).forEach(el => pista.appendChild(el.cloneNode(true)));
    };

    const pistaSuperior = document.getElementById('pista-superior');
    const pistaInferior = document.getElementById('pista-inferior');

    if (pistaSuperior) duplicarElementosCarrusel(pistaSuperior);
    if (pistaInferior) duplicarElementosCarrusel(pistaInferior);

    /* Navegación a producto */
    const navegarAProducto = (id) => {
        window.location.href = `producto/producto.html?id=${id}`;
    };

    /* Botones de carrito en el slider */
    function setupAddToCartButtons() {
        const sliderEl = document.getElementById('productosSlider');
        if (!sliderEl) return;

        sliderEl.querySelectorAll('.producto-item').forEach(item => {
            const info = item.querySelector('.producto-info');
            if (!info || info.querySelector('.btn-cesta-mini')) return;

            const id   = item.dataset.id;
            const prod = productosMap[id];
            if (!prod) return;

            const btn = document.createElement('button');
            btn.className = 'btn-cesta-mini';
            btn.setAttribute('aria-label', 'Añadir al carrito');
            btn.innerHTML = SVG_CESTA_MINI;

            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await addToCart({
                    id,
                    nombre:       prod.name,
                    precio:       prod.price,
                    priceNumeric: prod.priceNumeric,
                    size:         null,
                    quantity:     1,
                    imagen:       prod.images[0]
                });
                document.dispatchEvent(new CustomEvent('cart:updated'));
                import('../components/carrito.js').then(({ abrirCarrito }) => abrirCarrito());
                btn.classList.add('clicked');
                setTimeout(() => btn.classList.remove('clicked'), 350);
            });

            info.appendChild(btn);
        });
    }

    /* Click en carrusel */
    document.querySelectorAll('.carrusel-elemento').forEach(el => {
        el.addEventListener('click', () => {
            const id = el.getAttribute('data-id');
            if (id) navegarAProducto(id);
        });
    });

    setupAddToCartButtons();

    /* Slider de productos */
    const slider               = document.getElementById('productosSlider');
    const btnAnterior          = document.getElementById('btnAnterior');
    const btnSiguiente         = document.getElementById('btnSiguiente');
    const indicadoresContainer = document.getElementById('productosIndicadores');

    if (!slider || !btnAnterior || !btnSiguiente || !indicadoresContainer) return;

    const items = slider.querySelectorAll('.producto-item');
    if (!items.length) return;

    items.forEach(item => {
        item.addEventListener('click', () => {
            const id = item.getAttribute('data-id');
            if (id) navegarAProducto(id);
        });
    });

    function getProductosPorVista() {
        if (window.innerWidth <= 768)  return 1;
        if (window.innerWidth <= 1024) return 2;
        return 3;
    }

    let productosPorVista = getProductosPorVista();
    let posicionActual    = 0;
    let maxPosicion       = Math.max(0, items.length - productosPorVista);

    function crearIndicadores() {
        indicadoresContainer.innerHTML = '';
        const total = Math.ceil(items.length / productosPorVista);
        for (let i = 0; i < total; i++) {
            const dot = document.createElement('div');
            dot.classList.add('indicador-dot');
            if (i === Math.floor(posicionActual / productosPorVista)) dot.classList.add('activo');
            dot.addEventListener('click', () => irAPosicion(i * productosPorVista));
            indicadoresContainer.appendChild(dot);
        }
    }

    function actualizarIndicadores() {
        const dots  = indicadoresContainer.querySelectorAll('.indicador-dot');
        const activo = Math.floor(posicionActual / productosPorVista);
        dots.forEach((dot, i) => dot.classList.toggle('activo', i === activo));
    }

    function irAPosicion(nueva) {
        posicionActual = Math.max(0, Math.min(nueva, maxPosicion));
        slider.style.transform = `translateX(${-(posicionActual / productosPorVista) * 100}%)`;
        actualizarIndicadores();
    }

    btnAnterior.addEventListener('click', () => {
        irAPosicion(posicionActual > 0 ? posicionActual - productosPorVista : maxPosicion);
    });

    btnSiguiente.addEventListener('click', () => {
        irAPosicion(posicionActual < maxPosicion ? posicionActual + productosPorVista : 0);
    });

    crearIndicadores();
    irAPosicion(0);

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const nueva = getProductosPorVista();
            if (nueva !== productosPorVista) {
                productosPorVista = nueva;
                maxPosicion = Math.max(0, items.length - productosPorVista);
                crearIndicadores();
                irAPosicion(0);
            }
        }, 250);
    });
});
