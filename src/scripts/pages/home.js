import { addToCart } from '../utils/storage.js';

/* Datos para el slider */
const PRODUCTOS_HOME = {
    'white-tshirt': {
        id: 'white-tshirt', nombre: 'WHITE TSHIRT', precio: '29,99€', priceNumeric: 29.99,
        imagen: '/public/assets/images/products/camiseta-blanca-delante.png'
    },
    'black-tshirt': {
        id: 'black-tshirt', nombre: 'BLACK TSHIRT', precio: '29,99€', priceNumeric: 29.99,
        imagen: '/public/assets/images/products/camiseta-negra-delante.png'
    }
};

const SVG_CESTA_MINI = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 33 33" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="5" y="13" width="23" height="15" rx="3"/>
    <path d="M12 13C12 9.4 14 7 16.5 7C19 7 21 9.4 21 13"/>
</svg>`;

document.addEventListener('DOMContentLoaded', () => {
    
    /* Carrusel infinito */
    const duplicarElementosCarrusel = (pista) => {
        if (!pista) return;
        const elementos = Array.from(pista.children);
        elementos.forEach(elemento => {
            const clon = elemento.cloneNode(true);
            pista.appendChild(clon);
        });
    };

    const pistaSuperior = document.getElementById('pista-superior');
    const pistaInferior = document.getElementById('pista-inferior');
    
    if (pistaSuperior) duplicarElementosCarrusel(pistaSuperior);
    if (pistaInferior) duplicarElementosCarrusel(pistaInferior);

    /* Navegación */
    const navegarAProducto = (idProducto) => {
        /* Construir URL relativa correcta */
        const url = `producto/producto.html?id=${idProducto}`;
        window.location.href = url;
        console.log('Navegando a:', url);
    };

    /* Botones de carrito */
    function setupAddToCartButtons() {
        const sliderEl = document.getElementById('productosSlider');
        if (!sliderEl) return;

        sliderEl.querySelectorAll('.producto-item').forEach(item => {
            const info = item.querySelector('.producto-info');
            if (!info || info.querySelector('.btn-cesta-mini')) return;

            const id   = item.dataset.id;
            const prod = PRODUCTOS_HOME[id];
            if (!prod) return;

            const btn = document.createElement('button');
            btn.className = 'btn-cesta-mini';
            btn.setAttribute('aria-label', 'Añadir al carrito');
            btn.innerHTML = SVG_CESTA_MINI;

            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                addToCart({ ...prod, size: null, quantity: 1 });
                document.dispatchEvent(new CustomEvent('cart:updated'));
                import('../components/carrito.js').then(({ abrirCarrito }) => abrirCarrito());
                btn.classList.add('clicked');
                setTimeout(() => btn.classList.remove('clicked'), 350);
            });

            info.appendChild(btn);
        });
    }

    /* Click en carrusel */
    const setupCarruselClicks = () => {
        const carruselElementos = document.querySelectorAll('.carrusel-elemento');
        carruselElementos.forEach(elemento => {
            elemento.addEventListener('click', () => {
                const idProducto = elemento.getAttribute('data-id');
                if (idProducto) {
                    navegarAProducto(idProducto);
                }
            });
        });
    };

    /* Ejecutar después de duplicar los elementos */
    setupCarruselClicks();

    /* Botones de carrito slider */
    setupAddToCartButtons();

    /* Lógica del slider */
    const slider = document.getElementById('productosSlider');
    const btnAnterior = document.getElementById('btnAnterior');
    const btnSiguiente = document.getElementById('btnSiguiente');
    const indicadoresContainer = document.getElementById('productosIndicadores');
    
    if (!slider || !btnAnterior || !btnSiguiente || !indicadoresContainer) return;

    const productos = slider.querySelectorAll('.producto-item');
    const totalProductos = productos.length;
    
    if (totalProductos === 0) return;
    
    /* Click en slider */
    productos.forEach(producto => {
        producto.addEventListener('click', () => {
            const idProducto = producto.getAttribute('data-id');
            if (idProducto) {
                navegarAProducto(idProducto);
            }
        });
    });
    
    function getProductosPorVista() {
        const width = window.innerWidth;
        if (width <= 768) return 1;
        if (width <= 1024) return 2;
        return 3;
    }

    let productosPorVista = getProductosPorVista();
    let posicionActual = 0;
    let maxPosicion = Math.max(0, totalProductos - productosPorVista);

    function crearIndicadores() {
        indicadoresContainer.innerHTML = '';
        const numIndicadores = Math.ceil(totalProductos / productosPorVista);
        
        for (let i = 0; i < numIndicadores; i++) {
            const dot = document.createElement('div');
            dot.classList.add('indicador-dot');
            if (i === Math.floor(posicionActual / productosPorVista)) {
                dot.classList.add('activo');
            }
            dot.addEventListener('click', () => irAPosicion(i * productosPorVista));
            indicadoresContainer.appendChild(dot);
        }
    }

    function actualizarIndicadores() {
        const dots = indicadoresContainer.querySelectorAll('.indicador-dot');
        const indicadorActivo = Math.floor(posicionActual / productosPorVista);
        dots.forEach((dot, index) => {
            dot.classList.toggle('activo', index === indicadorActivo);
        });
    }

    function irAPosicion(nuevaPosicion) {
        posicionActual = Math.max(0, Math.min(nuevaPosicion, maxPosicion));
        const porcentaje = -(posicionActual / productosPorVista) * 100;
        slider.style.transform = `translateX(${porcentaje}%)`;
        actualizarIndicadores();
    }

    btnAnterior.addEventListener('click', () => {
        if (posicionActual > 0) {
            irAPosicion(posicionActual - productosPorVista);
        } else {
            irAPosicion(maxPosicion);
        }
    });

    btnSiguiente.addEventListener('click', () => {
        if (posicionActual < maxPosicion) {
            irAPosicion(posicionActual + productosPorVista);
        } else {
            irAPosicion(0);
        }
    });

    crearIndicadores();
    irAPosicion(0);

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const nuevosProductosPorVista = getProductosPorVista();
            if (nuevosProductosPorVista !== productosPorVista) {
                productosPorVista = nuevosProductosPorVista;
                maxPosicion = Math.max(0, totalProductos - productosPorVista);
                crearIndicadores();
                irAPosicion(0);
            }
        }, 250);
    });
});