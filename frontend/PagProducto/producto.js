document.addEventListener('DOMContentLoaded', () => {
    
    /* Fuerza a recargar las imágenes del header para evitar que desaparezcan */
    const headerImages = document.querySelectorAll('.main-header img');
    headerImages.forEach(img => {
        if (!img.complete) {
            const src = img.src;
            img.src = '';
            img.src = src;
        }
    });

    /* Obtiene ID del producto desde la URL */
    const urlParams = new URLSearchParams(window.location.search);
    const idProducto = urlParams.get('id');
    
    console.log('ID del producto:', idProducto);

    /* Base de datos temporal (Frontend) */
    const productosDB = {
        'white-tshirt': {
            nombre: 'WHITE TSHIRT',
            precio: '29,99€',
            imagenes: [
                './img/camiseta-blanca-delante.png',
                './img/camiseta-blanca-detras.png',
                './img/modelo-delante.png',
                './img/modelo-detras.png'
            ],
            tallas: ['S', 'M', 'L', 'XL'],
            detalles: {
                composicion: 'Algodón 100%',
                corte: 'Cropped fit',
                cuidado: 'Lavar a máquina 30°C',
                origen: 'Hecho en España'
            }
        },
        'black-tshirt': {
            nombre: 'BLACK TSHIRT',
            precio: '29,99€',
            imagenes: [
                './img/camiseta-negra-delante.png',
                './img/camiseta-negra-detras.png',
                './img/modelo-delante.png',
                './img/modelo-detras.png'
            ],
            tallas: ['S', 'M', 'L', 'XL'],
            detalles: {
                composicion: 'Algodón 100%',
                corte: 'Relaxed fit',
                cuidado: 'Lavar a máquina 30°C',
                origen: 'Hecho en España'
            }
        }
    };

    /* Cargar datos del producto */
    function cargarProducto(id) {
        const producto = productosDB[id];
        
        if (!producto) {
            console.error('Producto no encontrado:', id);
            alert('Producto no encontrado');
            window.location.href = '../PagInicio/index.html';
            return;
        }

        // Actualizar título y precio
        document.querySelector('.producto-titulo').textContent = producto.nombre;
        document.querySelector('.producto-precio-detalle').textContent = producto.precio;

        // Actualizar imagen principal
        const imagenPrincipal = document.getElementById('imagenPrincipal');
        imagenPrincipal.src = producto.imagenes[0];

        // Actualizar miniaturas
        const miniaturas = document.querySelectorAll('.miniatura');
        miniaturas.forEach((miniatura, index) => {
            if (producto.imagenes[index]) {
                miniatura.setAttribute('data-imagen', producto.imagenes[index]);
                miniatura.querySelector('img').src = producto.imagenes[index];
            }
        });

        // Actualizar detalles
        const detallesTextos = document.querySelectorAll('.detalle-texto span');
        detallesTextos[0].textContent = producto.detalles.composicion;
        detallesTextos[1].textContent = producto.detalles.corte;
        detallesTextos[2].textContent = producto.detalles.cuidado;
        detallesTextos[3].textContent = producto.detalles.origen;

        console.log('Producto cargado:', producto.nombre);
    }

    // Cargar el producto si hay un ID en la URL
    if (idProducto) {
        cargarProducto(idProducto);
    } else {
        console.warn('No se proporcionó ID de producto en la URL');
    }

    /* Funcionalidad de miniaturas */
    const imagenPrincipal = document.getElementById('imagenPrincipal');
    const miniaturas = document.querySelectorAll('.miniatura');
    
    miniaturas.forEach(miniatura => {
        miniatura.addEventListener('click', () => {
            miniaturas.forEach(m => m.classList.remove('activa'));
            miniatura.classList.add('activa');
            
            const nuevaImagen = miniatura.getAttribute('data-imagen');
            imagenPrincipal.src = nuevaImagen;
        });
    });

    /* Selector de tallas */
    const tallasBtns = document.querySelectorAll('.talla-btn');
    let tallaSeleccionada = null;
    
    tallasBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const talla = btn.getAttribute('data-talla');
            
            if (tallaSeleccionada === talla) {
                btn.classList.remove('seleccionada');
                tallaSeleccionada = null;
                console.log('Talla deseleccionada');
            } else {
                tallasBtns.forEach(b => b.classList.remove('seleccionada'));
                btn.classList.add('seleccionada');
                tallaSeleccionada = talla;
                console.log('Talla seleccionada:', tallaSeleccionada);
            }
        });
    });

    /* Control de cantidad */
    const btnRestar = document.getElementById('btnRestar');
    const btnSumar = document.getElementById('btnSumar');
    const cantidadInput = document.getElementById('cantidadInput');
    let cantidad = 1;

    btnRestar.addEventListener('click', () => {
        if (cantidad > 1) {
            cantidad--;
            cantidadInput.value = cantidad;
        }
    });

    btnSumar.addEventListener('click', () => {
        if (cantidad < 99) {
            cantidad++;
            cantidadInput.value = cantidad;
        }
    });

    /* Botón añadir a la cesta */
    const btnAñadirCesta = document.querySelector('.btn-añadir-cesta');
    
    btnAñadirCesta.addEventListener('click', () => {
        if (!tallaSeleccionada) {
            alert('Por favor, selecciona una talla');
            return;
        }
        
        const productoParaCesta = {
            id: idProducto,
            nombre: document.querySelector('.producto-titulo').textContent,
            precio: document.querySelector('.producto-precio-detalle').textContent,
            talla: tallaSeleccionada,
            cantidad: cantidad,
            imagen: imagenPrincipal.src
        };
        
        console.log('Añadido a la cesta:', productoParaCesta);
        alert(`✅ Producto añadido a la cesta\nTalla: ${tallaSeleccionada}\nCantidad: ${cantidad}`);
    });

    /* Funcionalidad de desplegables */
    const desplegableHeaders = document.querySelectorAll('.desplegable-header');
    
    desplegableHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const contenido = header.nextElementSibling;
            const estaAbierto = contenido.classList.contains('abierto');
            
            document.querySelectorAll('.desplegable-contenido').forEach(c => {
                c.classList.remove('abierto');
            });
            
            document.querySelectorAll('.desplegable-header').forEach(h => {
                h.classList.remove('activo');
            });
            
            if (!estaAbierto) {
                contenido.classList.add('abierto');
                header.classList.add('activo');
            }
        });
    });

    /* Botón de suscripción */
    const btnSuscribirse = document.querySelector('.btn-suscribirse');
    
    btnSuscribirse.addEventListener('click', () => {
        console.log('Navegando a página de suscripción');
        alert('Redirigiendo a la página de suscripción...');
    });
});