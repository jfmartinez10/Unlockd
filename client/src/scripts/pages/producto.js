import { getUrlParams }     from '../main.js';
import { addToCart }        from '../utils/cartService.js';
import { showNotification } from '../utils/toast.js';
import { API_URL }          from '../config/api.js';

document.addEventListener('DOMContentLoaded', async () => {

    const idProducto = getUrlParams().id;

    if (!idProducto) {
        showNotification('Producto no encontrado', 'error');
        setTimeout(() => window.location.href = '/src/pages/tienda/tienda.html', 2000);
        return;
    }

    /* Cargar producto desde la API */
    let producto = null;

    try {
        const res  = await fetch(`${API_URL}/products/${idProducto}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        producto = json.data;
    } catch (err) {
        console.error('Error al cargar producto:', err.message);
        showNotification('Producto no encontrado', 'error');
        setTimeout(() => window.location.href = '/src/pages/tienda/tienda.html', 2000);
        return;
    }

    /* Rellenar datos en el DOM */
    document.querySelector('.producto-titulo').textContent          = producto.name;
    document.querySelector('.producto-precio-detalle').textContent  = producto.price;

    const imagenPrincipal = document.getElementById('imagenPrincipal');
    imagenPrincipal.src = producto.images[0];

    const miniaturas = document.querySelectorAll('.miniatura');
    miniaturas.forEach((miniatura, index) => {
        if (producto.images[index]) {
            miniatura.setAttribute('data-imagen', producto.images[index]);
            miniatura.querySelector('img').src = producto.images[index];
        }
    });

    document.getElementById('detalleComposicion').textContent = producto.details.composition;
    document.getElementById('detalleCorte').textContent       = producto.details.fit;
    document.getElementById('detalleCuidado').textContent     = producto.details.care;
    document.getElementById('detalleOrigen').textContent      = producto.details.origin;

    /* Miniaturas */
    miniaturas.forEach(miniatura => {
        miniatura.addEventListener('click', () => {
            miniaturas.forEach(m => m.classList.remove('activa'));
            miniatura.classList.add('activa');
            imagenPrincipal.src = miniatura.getAttribute('data-imagen');
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
            } else {
                tallasBtns.forEach(b => b.classList.remove('seleccionada'));
                btn.classList.add('seleccionada');
                tallaSeleccionada = talla;
            }
        });
    });

    /* Control de cantidad */
    const btnRestar    = document.getElementById('btnRestar');
    const btnSumar     = document.getElementById('btnSumar');
    const cantidadInput = document.getElementById('cantidadInput');
    let cantidad = 1;

    if (btnRestar && btnSumar && cantidadInput) {
        btnRestar.addEventListener('click', () => {
            if (cantidad > 1) { cantidad--; cantidadInput.value = cantidad; }
        });
        btnSumar.addEventListener('click', () => {
            if (cantidad < 99) { cantidad++; cantidadInput.value = cantidad; }
        });
    }

    /* Añadir a la cesta */
    const btnAñadirCesta = document.querySelector('.producto-info-panel .btn-block');

    if (btnAñadirCesta) {
        btnAñadirCesta.addEventListener('click', async () => {
            if (!tallaSeleccionada) {
                showNotification('Por favor, selecciona una talla', 'error');
                return;
            }

            await addToCart({
                id:           producto.id,
                nombre:       producto.name,
                precio:       producto.price,
                priceNumeric: producto.priceNumeric,
                size:         tallaSeleccionada,
                quantity:     cantidad,
                imagen:       producto.images[0]
            });

            document.dispatchEvent(new CustomEvent('cart:updated'));
            import('../components/carrito.js').then(({ abrirCarrito }) => abrirCarrito());
        });
    }

    /* Desplegables */
    document.querySelectorAll('.desplegable-header').forEach(header => {
        header.addEventListener('click', () => {
            const contenido  = header.nextElementSibling;
            const estaAbierto = contenido.classList.contains('abierto');

            document.querySelectorAll('.desplegable-contenido').forEach(c => c.classList.remove('abierto'));
            document.querySelectorAll('.desplegable-header').forEach(h => h.classList.remove('activo'));

            if (!estaAbierto) {
                contenido.classList.add('abierto');
                header.classList.add('activo');
            }
        });
    });

    /* Botón suscripción */
    const btnSuscribirse = document.querySelector('.suscripcion-seccion .btn');
    if (btnSuscribirse) {
        btnSuscribirse.addEventListener('click', () => {
            import('../components/popup.js').then(({ abrirPopup }) => abrirPopup());
        });
    }
});
