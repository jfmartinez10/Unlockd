import { isLoggedIn, isAdmin, authFetch, logoutUser, getUser } from '../utils/auth.js';
import { API_URL } from '../config/api.js';

/* ── Guard ─────────────────────────────────────────────── */
if (!isLoggedIn() || !isAdmin()) {
    window.location.href = '/src/pages/auth/login.html';
}

/* ── Estado ─────────────────────────────────────────────── */
let productos     = [];
let busqueda      = '';
let modoEdicion   = false;   /* false = crear, true = editar */
let idEditando    = null;
let imagenesActuales = ['', '', '', '']; /* 4 slots de URLs */

const TALLAS_DEFAULT = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

/* ── DOMContentLoaded ───────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {

    /* Usuario en topbar */
    const user = getUser();
    const elUsuario = document.getElementById('adminUsuario');
    if (elUsuario && user) elUsuario.textContent = user.email;

    /* Eventos globales */
    document.getElementById('adminLogout').addEventListener('click', async () => {
        await logoutUser();
        window.location.href = '/src/pages/auth/login.html';
    });

    document.getElementById('btnNuevoProducto').addEventListener('click', () => abrirModal(null));

    document.getElementById('adminBuscar').addEventListener('input', (e) => {
        busqueda = e.target.value.toLowerCase().trim();
        renderTabla();
    });

    document.getElementById('adminOverlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) cerrarModal();
    });
    document.getElementById('adminModalCerrar').addEventListener('click', cerrarModal);
    document.getElementById('adminBtnCancelar').addEventListener('click', cerrarModal);

    document.getElementById('adminForm').addEventListener('submit', handleSubmit);

    /* Escape cierra modal */
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') cerrarModal();
    });

    /* Renderizar los slots de tallas y de imágenes (se hace una vez al cargar) */
    renderTallasGrid();
    renderImagenesGrid();

    await cargarProductos();
});

/* ── Carga de productos ─────────────────────────────────── */
async function cargarProductos() {
    try {
        const res  = await authFetch(`${API_URL}/admin/products`);
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        productos = json.data;
        renderStats();
        renderTabla();
    } catch (err) {
        console.error('[admin] Error cargando productos:', err.message);
        document.getElementById('adminTablaBody').innerHTML =
            `<tr><td colspan="7" class="admin-tabla-vacio">Error al cargar. ¿Está el servidor activo?</td></tr>`;
    }
}

/* ── Stats ──────────────────────────────────────────────── */
function renderStats() {
    document.getElementById('statTotal').textContent     = productos.length;
    document.getElementById('statActivos').textContent   = productos.filter(p => p.activo).length;
    document.getElementById('statDestacados').textContent = productos.filter(p => p.destacado).length;
}

/* ── Tabla ──────────────────────────────────────────────── */
function renderTabla() {
    const filtrados = busqueda
        ? productos.filter(p =>
            p.nombre.toLowerCase().includes(busqueda) ||
            p.id.toLowerCase().includes(busqueda) ||
            (p.color ?? '').toLowerCase().includes(busqueda)
          )
        : productos;

    const tbody = document.getElementById('adminTablaBody');

    if (!filtrados.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="admin-tabla-vacio">Sin resultados</td></tr>`;
        return;
    }

    tbody.innerHTML = filtrados.map(p => {
        const img    = (p.imagenes ?? [])[0] ?? '';
        const precio = p.precio_str ?? '—';
        return `
        <tr data-id="${p.id}">
            <td class="col-img">
                ${img
                    ? `<img class="admin-thumb" src="${img}" alt="${p.nombre}" loading="lazy">`
                    : `<div class="admin-thumb" style="background:#f5f5f5;display:flex;align-items:center;justify-content:center;font-size:20px;color:#ccc">✕</div>`
                }
            </td>
            <td class="col-info">
                <span class="admin-prod-id">${p.id}</span>
                <span class="admin-prod-nombre">${p.nombre}</span>
            </td>
            <td class="col-precio">${precio}</td>
            <td class="col-color">${p.color ?? '—'}</td>
            <td class="col-toggle" style="text-align:center">
                <button class="admin-toggle ${p.activo ? 'activo' : ''}"
                        data-accion="activo" data-id="${p.id}"
                        title="${p.activo ? 'Desactivar' : 'Activar'}">
                    ${p.activo ? '●' : '○'}
                </button>
            </td>
            <td class="col-toggle" style="text-align:center">
                <button class="admin-toggle ${p.destacado ? 'activo' : ''}"
                        data-accion="destacado" data-id="${p.id}"
                        title="${p.destacado ? 'Quitar destacado' : 'Destacar'}">
                    ${p.destacado ? '★' : '☆'}
                </button>
            </td>
            <td class="col-acciones">
                <div class="admin-td-acciones">
                    <button class="admin-btn-editar"  data-id="${p.id}">Editar</button>
                    <button class="admin-btn-eliminar" data-id="${p.id}">Borrar</button>
                </div>
            </td>
        </tr>`;
    }).join('');

    /* Eventos de la tabla */
    tbody.querySelectorAll('[data-accion]').forEach(btn =>
        btn.addEventListener('click', () => toggleCampo(btn.dataset.id, btn.dataset.accion))
    );
    tbody.querySelectorAll('.admin-btn-editar').forEach(btn =>
        btn.addEventListener('click', () => {
            const p = productos.find(x => x.id === btn.dataset.id);
            if (p) abrirModal(p);
        })
    );
    tbody.querySelectorAll('.admin-btn-eliminar').forEach(btn =>
        btn.addEventListener('click', () => confirmarEliminar(btn.dataset.id))
    );
}

/* ── Toggle activo / destacado ──────────────────────────── */
async function toggleCampo(id, campo) {
    try {
        const res  = await authFetch(`${API_URL}/admin/products/${id}/toggle-${campo}`, { method: 'PATCH' });
        const json = await res.json();
        if (!json.success) return;
        const p = productos.find(x => x.id === id);
        if (p) p[campo] = json.data[campo];
        renderStats();
        renderTabla();
    } catch (err) {
        console.error('[admin] toggleCampo error:', err.message);
    }
}

/* ── Eliminar ────────────────────────────────────────────── */
async function confirmarEliminar(id) {
    const p = productos.find(x => x.id === id);
    if (!confirm(`¿Eliminar "${p?.nombre ?? id}"?\n\nEsta acción no se puede deshacer y eliminará también los favoritos y elementos del carrito asociados.`)) return;

    try {
        const res = await authFetch(`${API_URL}/admin/products/${id}`, { method: 'DELETE' });
        if (res.ok) {
            productos = productos.filter(x => x.id !== id);
            renderStats();
            renderTabla();
        }
    } catch (err) {
        console.error('[admin] Error eliminando:', err.message);
    }
}

/* ── Modal — abrir ──────────────────────────────────────── */
function abrirModal(producto) {
    modoEdicion = Boolean(producto);
    idEditando  = producto?.id ?? null;
    imagenesActuales = ['', '', '', ''];

    document.getElementById('adminModalTitulo').textContent =
        modoEdicion ? `Editar — ${producto.nombre}` : 'Nuevo producto';

    const form = document.getElementById('adminForm');
    form.reset();
    setError('');

    /* ID */
    const fId = document.getElementById('fId');
    fId.value    = producto?.id ?? '';
    fId.disabled = modoEdicion;

    /* Campos básicos */
    document.getElementById('fNombre').value      = producto?.nombre      ?? '';
    document.getElementById('fPrecio').value      = producto?.precio_numerico ?? '';
    document.getElementById('fColor').value       = producto?.color        ?? '';
    document.getElementById('fCategoria').value   = producto?.categoria    ?? '';
    document.getElementById('fDescripcion').value = producto?.descripcion  ?? '';

    /* Detalles */
    const d = producto?.detalles ?? {};
    document.getElementById('fComposicion').value = d.composicion ?? '';
    document.getElementById('fCorte').value       = d.corte       ?? '';
    document.getElementById('fCuidado').value     = d.cuidado     ?? '';
    document.getElementById('fOrigen').value      = d.origen      ?? '';

    /* Tags */
    document.getElementById('fTags').value =
        Array.isArray(producto?.tags) ? producto.tags.join(', ') : '';

    /* Checkboxes */
    document.getElementById('fActivo').checked    = producto?.activo    ?? true;
    document.getElementById('fDestacado').checked = producto?.destacado ?? false;

    /* Tallas */
    const tallasProducto = producto?.tallas ?? [];
    const stockProducto  = producto?.stock  ?? {};
    renderTallasGrid(tallasProducto, stockProducto);

    /* Imágenes */
    const imgs = producto?.imagenes ?? [];
    imagenesActuales = [
        imgs[0] ?? '', imgs[1] ?? '', imgs[2] ?? '', imgs[3] ?? ''
    ];
    renderImagenesGrid();

    /* Abrir overlay */
    document.getElementById('adminOverlay').classList.add('activo');
    document.body.style.overflow = 'hidden';
    document.getElementById('fId').focus();
}

/* ── Modal — cerrar ─────────────────────────────────────── */
function cerrarModal() {
    document.getElementById('adminOverlay').classList.remove('activo');
    document.body.style.overflow = '';
    modoEdicion  = false;
    idEditando   = null;
    imagenesActuales = ['', '', '', ''];
}

/* ── Tallas grid ─────────────────────────────────────────── */
function renderTallasGrid(tallasActivas = [], stockActual = {}) {
    const container = document.getElementById('adminTallasGrid');
    container.innerHTML = TALLAS_DEFAULT.map(t => {
        const checked = tallasActivas.includes(t);
        const stock   = stockActual[t] ?? 0;
        return `
        <div class="admin-talla-item">
            <label class="admin-talla-check">
                <input type="checkbox" class="talla-check" data-talla="${t}" ${checked ? 'checked' : ''}>
                <span>${t}</span>
            </label>
            <input type="number" class="admin-talla-stock" data-talla="${t}"
                   min="0" value="${stock}" ${checked ? '' : 'disabled'}
                   placeholder="Stock">
        </div>`;
    }).join('');

    /* Sincronizar checkbox ↔ stock input */
    container.querySelectorAll('.talla-check').forEach(chk => {
        chk.addEventListener('change', () => {
            const stockInput = container.querySelector(`.admin-talla-stock[data-talla="${chk.dataset.talla}"]`);
            stockInput.disabled = !chk.checked;
            if (!chk.checked) stockInput.value = 0;
        });
    });
}

/* ── Imágenes grid ──────────────────────────────────────── */
function renderImagenesGrid() {
    const container = document.getElementById('adminImagenesGrid');
    container.innerHTML = imagenesActuales.map((url, i) => {
        const label = i === 0 ? 'Principal' : `Imagen ${i + 1}`;
        return `
        <div class="admin-img-slot" data-idx="${i}">
            <div class="admin-img-preview" data-idx="${i}" title="Clic para subir imagen">
                <img src="${url}" alt="" class="${url ? 'cargada' : ''}" data-idx="${i}">
                <span class="admin-img-placeholder">${url ? '' : '＋'}</span>
            </div>
            <span class="admin-img-slot-label">${label}</span>
            <input type="text" class="admin-img-url admin-input" data-idx="${i}"
                   placeholder="URL de la imagen" value="${url}">
            <div class="admin-img-acciones">
                <button type="button" class="admin-img-btn subir" data-idx="${i}">Subir</button>
                <button type="button" class="admin-img-btn quitar" data-idx="${i}">Quitar</button>
            </div>
            <input type="file" class="admin-img-file" data-idx="${i}"
                   accept="image/*" style="display:none">
        </div>`;
    }).join('');

    /* Eventos de imagen */
    container.querySelectorAll('.admin-img-preview').forEach(el => {
        el.addEventListener('click', () => triggerUpload(parseInt(el.dataset.idx)));
    });

    container.querySelectorAll('.admin-img-btn.subir').forEach(btn => {
        btn.addEventListener('click', () => triggerUpload(parseInt(btn.dataset.idx)));
    });

    container.querySelectorAll('.admin-img-btn.quitar').forEach(btn => {
        btn.addEventListener('click', () => quitarImagen(parseInt(btn.dataset.idx)));
    });

    container.querySelectorAll('.admin-img-url').forEach(input => {
        input.addEventListener('change', (e) => {
            const idx = parseInt(input.dataset.idx);
            imagenesActuales[idx] = e.target.value.trim();
            actualizarPreview(idx);
        });
    });

    container.querySelectorAll('.admin-img-file').forEach(input => {
        input.addEventListener('change', (e) => handleFileUpload(e, parseInt(input.dataset.idx)));
    });
}

function triggerUpload(idx) {
    document.querySelector(`.admin-img-file[data-idx="${idx}"]`)?.click();
}

function quitarImagen(idx) {
    imagenesActuales[idx] = '';
    renderImagenesGrid();
}

function actualizarPreview(idx) {
    const container = document.getElementById('adminImagenesGrid');
    const img       = container.querySelector(`img[data-idx="${idx}"]`);
    const placeholder = img?.parentElement?.querySelector('.admin-img-placeholder');
    const url         = imagenesActuales[idx];

    if (!img) return;

    if (url) {
        img.src = url;
        img.classList.add('cargada');
        if (placeholder) placeholder.textContent = '';
    } else {
        img.src = '';
        img.classList.remove('cargada');
        if (placeholder) placeholder.textContent = '＋';
    }
}

/* ── Subir imagen al servidor ─────────────────────────────── */
async function handleFileUpload(event, idx) {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('imagen', file);

    /* Mostrar preview local inmediato */
    const localUrl = URL.createObjectURL(file);
    imagenesActuales[idx] = localUrl;
    actualizarPreview(idx);

    try {
        const res  = await authFetch(`${API_URL}/admin/upload`, {
            method: 'POST',
            body:   formData,
        });
        const json = await res.json();

        if (json.success) {
            URL.revokeObjectURL(localUrl);
            imagenesActuales[idx] = json.data.url;
            /* Actualizar también el input de URL */
            const urlInput = document.querySelector(`.admin-img-url[data-idx="${idx}"]`);
            if (urlInput) urlInput.value = json.data.url;
            actualizarPreview(idx);
        } else {
            /* Revertir si falla */
            imagenesActuales[idx] = '';
            actualizarPreview(idx);
            console.error('[admin] Upload fallido:', json.message);
        }
    } catch (err) {
        imagenesActuales[idx] = '';
        actualizarPreview(idx);
        console.error('[admin] Error upload:', err.message);
    }

    /* Limpiar el input para permitir volver a seleccionar el mismo archivo */
    event.target.value = '';
}

/* ── Submit del formulario ─────────────────────────────────── */
async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const btnGuardar = document.getElementById('adminBtnGuardar');
    btnGuardar.disabled = true;
    btnGuardar.textContent = 'Guardando...';

    try {
        const payload = buildPayload();
        const url     = modoEdicion
            ? `${API_URL}/admin/products/${idEditando}`
            : `${API_URL}/admin/products`;
        const method  = modoEdicion ? 'PUT' : 'POST';

        const res  = await authFetch(url, {
            method,
            body: JSON.stringify(payload),
        });
        const json = await res.json();

        if (!json.success) {
            setError(json.message || 'Error al guardar el producto');
            return;
        }

        /* Actualizar lista local */
        if (modoEdicion) {
            const idx = productos.findIndex(p => p.id === idEditando);
            if (idx > -1) {
                /* Mezclar los datos devueltos con los que ya teníamos */
                productos[idx] = {
                    ...productos[idx],
                    ...payload,
                    precio_str: json.data.precio_str,
                    imagenes:   payload.imagenes,
                };
            }
        } else {
            productos.unshift({
                ...payload,
                precio_str: json.data.precio_str,
                imagenes:   payload.imagenes,
            });
        }

        cerrarModal();
        renderStats();
        renderTabla();

    } catch (err) {
        setError('Error de conexión. ¿Está el servidor activo?');
        console.error('[admin] Submit error:', err.message);
    } finally {
        btnGuardar.disabled = false;
        btnGuardar.textContent = 'Guardar producto';
    }
}

/* ── Construir payload desde el formulario ─────────────────── */
function buildPayload() {
    /* Tallas y stock */
    const tallas = [];
    const stock  = {};
    document.querySelectorAll('.talla-check:checked').forEach(chk => {
        const t = chk.dataset.talla;
        tallas.push(t);
        const stockInput = document.querySelector(`.admin-talla-stock[data-talla="${t}"]`);
        stock[t] = parseInt(stockInput?.value ?? '0', 10) || 0;
    });

    /* Tags: separar por comas y limpiar */
    const tagsRaw = document.getElementById('fTags').value.trim();
    const tags    = tagsRaw
        ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean)
        : [];

    /* Imágenes: filtrar slots vacíos */
    const imagenes = imagenesActuales.filter(Boolean);

    const precio_numerico = parseFloat(document.getElementById('fPrecio').value) || 0;

    return {
        id:              document.getElementById('fId').value.trim(),
        nombre:          document.getElementById('fNombre').value.trim(),
        precio_numerico,
        color:           document.getElementById('fColor').value.trim() || null,
        categoria:       document.getElementById('fCategoria').value.trim(),
        descripcion:     document.getElementById('fDescripcion').value.trim() || null,
        detalles: {
            composicion: document.getElementById('fComposicion').value.trim(),
            corte:       document.getElementById('fCorte').value.trim(),
            cuidado:     document.getElementById('fCuidado').value.trim(),
            origen:      document.getElementById('fOrigen').value.trim(),
        },
        tallas,
        stock,
        imagenes,
        tags,
        activo:    document.getElementById('fActivo').checked,
        destacado: document.getElementById('fDestacado').checked,
    };
}

/* ── Utilidad: mostrar error en el formulario ──────────────── */
function setError(msg) {
    document.getElementById('adminFormError').textContent = msg;
}
