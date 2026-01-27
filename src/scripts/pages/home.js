document.addEventListener('DOMContentLoaded', () => {
    
    /* Duplicar elementos del carrusel para efecto infinito */
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

    /* Navegación a productos */
    const navegarAProducto = (idProducto) => {
        /* Construir URL relativa correcta */
        const url = `producto/producto.html?id=${idProducto}`;
        window.location.href = url;
        console.log('Navegando a:', url);
    };

    /* Click en elementos del carrusel */
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

    /* Funcionalidad del slider de productos */
    const slider = document.getElementById('productosSlider');
    const btnAnterior = document.getElementById('btnAnterior');
    const btnSiguiente = document.getElementById('btnSiguiente');
    const indicadoresContainer = document.getElementById('productosIndicadores');
    
    if (!slider || !btnAnterior || !btnSiguiente || !indicadoresContainer) return;

    const productos = slider.querySelectorAll('.producto-item');
    const totalProductos = productos.length;
    
    if (totalProductos === 0) return;
    
    /* Click en productos del slider */
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