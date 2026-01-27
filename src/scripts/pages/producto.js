import { getUrlParams } from '../main.js';
import { addToCart } from '../utils/storage.js';
import { showNotification } from '../main.js';

document.addEventListener('DOMContentLoaded', () => {
    
    /* Obtener ID del producto desde URL */
    const params = getUrlParams();
    const idProducto = params.id;
    
    console.log('ID del producto:', idProducto);

    /* Base de datos temporal (debería venir de products.json) */
    const productosDB = {
        'white-tshirt': {
            id: 'white-tshirt',
            nombre: 'WHITE TSHIRT',
            precio: '29,99€',
            priceNumeric: 29.99,
            imagenes: [
                '/public/assets/images/products/camiseta-blanca-delante.png',
                '/public/assets/images/products/camiseta-blanca-detras.png',
                '/public/assets/images/products/modelo-delante.png',
                '/public/assets/images/products/modelo-detras.png'
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
            id: 'black-tshirt',
            nombre: 'BLACK TSHIRT',
            precio: '29,99€',
            priceNumeric: 29.99,
            imagenes: [
                '/public/assets/images/products/camiseta-negra-delante.png',
                '/public/assets/images/products/camiseta-negra-detras.png',
                '/public/assets/images/products/modelo-delante.png',
                '/public/assets/images/products/modelo-detras.png'
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
            showNotification('Producto no encontrado', 'error');
            setTimeout(() => window.location.href = '../index.html', 2000);
            return;
        }

        /* Actualizar título y precio */
        document.querySelector('.producto-titulo').textContent = producto.nombre;
        document.querySelector('.producto-precio-detalle').textContent = producto.precio;

        /* Actualizar imagen principal */
        const imagenPrincipal = document.getElementById('imagenPrincipal');
        imagenPrincipal.src = producto.imagenes[0];

        /* Actualizar miniaturas */
        const miniaturas = document.querySelectorAll('.miniatura');
        miniaturas.forEach((miniatura, index) => {
            if (producto.imagenes[index]) {
                miniatura.setAttribute('data-imagen', producto.imagenes[index]);
                miniatura.querySelector('img').src = producto.imagenes[index];
            }
        });

        /* Actualizar detalles */
        document.getElementById('detalleComposicion').textContent = producto.detalles.composicion;
        document.getElementById('detalleCorte').textContent = producto.detalles.corte;
        document.getElementById('detalleCuidado').textContent = producto.detalles.cuidado;
        document.getElementById('detalleOrigen').textContent = producto.detalles.origen;

        console.log('Producto cargado:', producto.nombre);
    }

    if (idProducto) {
        cargarProducto(idProducto);
    } else {
        console.warn('No se proporcionó ID de producto');
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
            
            console.log('Talla clickeada:', talla);
            
            if (tallaSeleccionada === talla) {
                /* Si ya estaba seleccionada, deseleccionar */
                btn.classList.remove('seleccionada');
                tallaSeleccionada = null;
                console.log('Talla deseleccionada');
            } else {
                /* Deseleccionar todas */
                tallasBtns.forEach(b => b.classList.remove('seleccionada'));
                /* Seleccionar la nueva */
                btn.classList.add('seleccionada');
                tallaSeleccionada = talla;
                console.log('Talla seleccionada:', talla);
            }
        });
    });

    /* Control de cantidad */
    const btnRestar = document.getElementById('btnRestar');
    const btnSumar = document.getElementById('btnSumar');
    const cantidadInput = document.getElementById('cantidadInput');
    let cantidad = 1;

    if (btnRestar && btnSumar && cantidadInput) {
        btnRestar.addEventListener('click', () => {
            if (cantidad > 1) {
                cantidad--;
                cantidadInput.value = cantidad;
                console.log('Cantidad:', cantidad);
            }
        });

        btnSumar.addEventListener('click', () => {
            if (cantidad < 99) {
                cantidad++;
                cantidadInput.value = cantidad;
                console.log('Cantidad:', cantidad);
            }
        });
    }

    /* Botón añadir a la cesta */
    const btnAñadirCesta = document.querySelector('.producto-info-panel .btn-block');
    
    if (btnAñadirCesta) {
        btnAñadirCesta.addEventListener('click', () => {
            if (!tallaSeleccionada) {
                showNotification('Por favor, selecciona una talla', 'error');
                return;
            }
            
            const producto = productosDB[idProducto];
            const productoParaCesta = {
                id: idProducto,
                nombre: producto.nombre,
                precio: producto.precio,
                priceNumeric: producto.priceNumeric,
                talla: tallaSeleccionada,
                quantity: cantidad,
                imagen: producto.imagenes[0]
            };
            
            addToCart(productoParaCesta);
            showNotification(`Producto añadido (Talla: ${tallaSeleccionada}, Cant: ${cantidad})`, 'success');
            console.log('Producto añadido al carrito:', productoParaCesta);
        });
    }

    /* Funcionalidad de desplegables */
    const desplegableHeaders = document.querySelectorAll('.desplegable-header');
    
    desplegableHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const contenido = header.nextElementSibling;
            const estaAbierto = contenido.classList.contains('abierto');
            
            /* Cerrar todos */
            document.querySelectorAll('.desplegable-contenido').forEach(c => {
                c.classList.remove('abierto');
            });
            document.querySelectorAll('.desplegable-header').forEach(h => {
                h.classList.remove('activo');
            });
            
            /* Abrir el clickeado si estaba cerrado */
            if (!estaAbierto) {
                contenido.classList.add('abierto');
                header.classList.add('activo');
            }
        });
    });

    /* Botón de suscripción */
    const btnSuscribirse = document.querySelector('.suscripcion-seccion .btn');
    
    if (btnSuscribirse) {
        btnSuscribirse.addEventListener('click', () => {
            showNotification('Función de suscripción próximamente', 'info');
        });
    }
});