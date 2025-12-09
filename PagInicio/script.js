/* Funcionalidad de carruseles originales */
document.addEventListener('DOMContentLoaded', () => {
    
    /* Duplicar elementos del carrusel para efecto infinito */
    const duplicarElementosCarrusel = (pista) => {
        const elementos = Array.from(pista.children);
        elementos.forEach(elemento => {
            const clon = elemento.cloneNode(true);
            pista.appendChild(clon);
        });
    };

    const pistaSuperior = document.getElementById('pista-superior');
    const pistaInferior = document.getElementById('pista-inferior');
    
    if (pistaSuperior) {
        duplicarElementosCarrusel(pistaSuperior);
    }
    
    if (pistaInferior) {
        duplicarElementosCarrusel(pistaInferior);
    }

    const carruselElementos = document.querySelectorAll('.carrusel-elemento');
    
    carruselElementos.forEach(elemento => {
        elemento.addEventListener('click', () => {
            const url = elemento.getAttribute('data-url');
            
            if (url) {
                window.location.href = url;
                const textoProducto = elemento.querySelector('span').textContent;
                console.log('Navegando a:', url, '- Producto:', textoProducto);
            }
        });
    });

    /* Funcionalidad del slider de productos horizontal */
    const slider = document.getElementById('productosSlider');
    const btnAnterior = document.getElementById('btnAnterior');
    const btnSiguiente = document.getElementById('btnSiguiente');
    const indicadoresContainer = document.getElementById('productosIndicadores');
    
    if (!slider || !btnAnterior || !btnSiguiente || !indicadoresContainer) {
        console.warn('Elementos del slider de productos no encontrados');
        return;
    }

    const productos = slider.querySelectorAll('.producto-item');
    const totalProductos = productos.length;
    
    /* Calcular cuántos productos se muestran por vista según el ancho de pantalla */
    function getProductosPorVista() {
        const width = window.innerWidth;
        if (width <= 768) return 1;
        if (width <= 1024) return 2;
        return 3;
    }

    let productosPorVista = getProductosPorVista();
    let posicionActual = 0;
    let maxPosicion = Math.max(0, totalProductos - productosPorVista);

    /* Crear indicadores */
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

    /* Actualizar indicadores */
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

    /* Volver al punto de inicio del slider */
    btnAnterior.addEventListener('click', () => {
        if (posicionActual > 0) {
            irAPosicion(posicionActual - productosPorVista);
        } else {
            irAPosicion(maxPosicion);
        }
    });

    /* Navegación al siguiente slider */
    btnSiguiente.addEventListener('click', () => {
        if (posicionActual < maxPosicion) {
            irAPosicion(posicionActual + productosPorVista);
        } else {
            irAPosicion(0);
        }
    });

    /* Click en productos para navegar */
    productos.forEach(producto => {
        producto.addEventListener('click', () => {
            const url = producto.getAttribute('data-url');
            if (url) {
                window.location.href = url;
                console.log('Navegando a producto:', url);
            }
        });
    });

    /* Inicializar slider */
    crearIndicadores();
    irAPosicion(0);
});