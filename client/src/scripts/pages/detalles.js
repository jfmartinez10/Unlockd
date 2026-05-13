import { isLoggedIn, authFetch } from '../utils/auth.js';
import { showNotification } from '../utils/toast.js';
import { API_URL } from '../config/api.js';

document.addEventListener('DOMContentLoaded', async () => {

    if (!isLoggedIn()) {
        window.location.href = '/src/pages/auth/login.html';
        return;
    }

    /* Cargar datos del usuario */
    let usuarioActual = null;
    try {
        const res  = await authFetch(`${API_URL}/auth/me`);
        const json = await res.json();
        if (json.success) {
            usuarioActual = json.data;
            document.getElementById('detallesNombre').textContent =
                `${json.data.nombre} ${json.data.apellidos}`;
            document.getElementById('detallesEmail').textContent = json.data.email;
            /* Pre-rellenar formulario de perfil */
            const inp = document.getElementById('perfilNombre');
            const inpA = document.getElementById('perfilApellidos');
            if (inp)  inp.value  = json.data.nombre    ?? '';
            if (inpA) inpA.value = json.data.apellidos ?? '';
        }
    } catch {
        /* Si falla no bloqueamos la página */
    }

    /* Formulario editar perfil */
    const perfilForm = document.getElementById('perfilForm');
    if (perfilForm) {
        perfilForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btnGuardarPerfil');
            const orig = btn.textContent;
            btn.disabled = true; btn.textContent = 'Guardando...';

            try {
                const res  = await authFetch(`${API_URL}/auth/me`, {
                    method: 'PATCH',
                    body: JSON.stringify({
                        nombre:    document.getElementById('perfilNombre').value.trim(),
                        apellidos: document.getElementById('perfilApellidos').value.trim(),
                    }),
                });
                const json = await res.json();
                if (json.success) {
                    showNotification('Perfil actualizado correctamente', 'success');
                    document.getElementById('detallesNombre').textContent =
                        `${json.data.nombre} ${json.data.apellidos}`;
                    /* Actualizar sessionStorage */
                    try {
                        const u = JSON.parse(sessionStorage.getItem('unlockd_user') || '{}');
                        u.nombre    = json.data.nombre;
                        u.apellidos = json.data.apellidos;
                        sessionStorage.setItem('unlockd_user', JSON.stringify(u));
                    } catch {}
                } else {
                    showNotification(json.message || 'Error al guardar', 'error');
                }
            } catch {
                showNotification('Error de conexión', 'error');
            } finally {
                btn.disabled = false; btn.textContent = orig;
            }
        });
    }

    /* Formulario cambiar contraseña */
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nueva    = document.getElementById('passNueva').value;
            const confirmar = document.getElementById('passConfirm').value;
            if (nueva !== confirmar) {
                showNotification('Las contraseñas no coinciden', 'error');
                return;
            }
            if (nueva.length < 8 || !/[A-Z]/.test(nueva) || !/[0-9]/.test(nueva)) {
                showNotification('La contraseña necesita mínimo 8 caracteres, 1 mayúscula y 1 número', 'error');
                return;
            }

            const btn = document.getElementById('btnGuardarPassword');
            const orig = btn.textContent;
            btn.disabled = true; btn.textContent = 'Guardando...';

            try {
                const res  = await authFetch(`${API_URL}/auth/password`, {
                    method: 'PATCH',
                    body: JSON.stringify({
                        actual: document.getElementById('passActual').value,
                        nueva,
                    }),
                });
                const json = await res.json();
                if (json.success) {
                    showNotification(json.message, 'success');
                    passwordForm.reset();
                    /* Redirigir al login porque los refresh tokens se revocaron */
                    setTimeout(() => {
                        sessionStorage.clear();
                        window.location.href = '/src/pages/auth/login.html';
                    }, 2000);
                } else {
                    showNotification(json.message || 'Error al cambiar contraseña', 'error');
                }
            } catch {
                showNotification('Error de conexión', 'error');
            } finally {
                btn.disabled = false; btn.textContent = orig;
            }
        });
    }

    /* Cargar direcciones guardadas */
    await cargarDirecciones();

    /* Modal */
    const overlay     = document.getElementById('modalOverlay');
    const btnAbrir    = document.getElementById('btnAnadirDireccion');
    const btnCerrar   = document.getElementById('modalCerrar');
    const btnCancelar = document.getElementById('modalCancelar');
    const form        = document.getElementById('direccionForm');

    function abrirModal() {
        form.reset();
        overlay.classList.add('activo');
        document.body.style.overflow = 'hidden';
    }

    function cerrarModal() {
        overlay.classList.remove('activo');
        document.body.style.overflow = '';
    }

    btnAbrir.addEventListener('click', abrirModal);
    btnCerrar.addEventListener('click', cerrarModal);
    btnCancelar.addEventListener('click', cerrarModal);

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) cerrarModal();
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn = form.querySelector('[type="submit"]');
        const textoOriginal = btn.textContent;
        btn.textContent = 'Guardando...';
        btn.disabled = true;

        try {
            const res = await authFetch(`${API_URL}/addresses`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre:         document.getElementById('dirNombre').value.trim(),
                    apellidos:      document.getElementById('dirApellidos').value.trim(),
                    pais:           document.getElementById('dirPais').value.trim(),
                    ciudad:         document.getElementById('dirCiudad').value.trim(),
                    provincia:      document.getElementById('dirProvincia').value.trim(),
                    direccion:      document.getElementById('dirDireccion').value.trim(),
                    cod_postal:     document.getElementById('dirCodPostal').value.trim(),
                    direccion2:     document.getElementById('dirDireccion2').value.trim(),
                    predeterminada: document.getElementById('dirPredeterminada').checked,
                }),
            });

            const json = await res.json();

            if (json.success) {
                showNotification('Dirección guardada correctamente', 'success');
                cerrarModal();
                await cargarDirecciones();
            } else {
                showNotification(json.message || 'Error al guardar', 'error');
            }
        } catch {
            showNotification('Error de conexión', 'error');
        } finally {
            btn.textContent = textoOriginal;
            btn.disabled = false;
        }
    });
});

/* Carga y renderiza la lista de direcciones guardadas */
async function cargarDirecciones() {
    const contenedor = document.getElementById('listaDirecciones');
    if (!contenedor) return;

    try {
        const res  = await authFetch(`${API_URL}/addresses`);
        const json = await res.json();

        if (!json.success || json.data.length === 0) {
            contenedor.innerHTML = '<p class="detalles-sin-direcciones">No hay direcciones guardadas.</p>';
            return;
        }

        contenedor.innerHTML = json.data.map(d => `
            <div class="detalles-direccion" data-id="${d.id}">
                <div class="detalles-direccion-info">
                    <span class="detalles-direccion-nombre">
                        ${d.nombre} ${d.apellidos}
                        ${d.predeterminada ? '<span class="detalles-badge">Predeterminada</span>' : ''}
                    </span>
                    <span class="detalles-direccion-linea">${d.direccion}${d.direccion2 ? `, ${d.direccion2}` : ''}</span>
                    <span class="detalles-direccion-linea">${d.cod_postal} ${d.ciudad}, ${d.provincia}</span>
                    <span class="detalles-direccion-linea">${d.pais}</span>
                </div>
                <div class="detalles-direccion-acciones">
                    ${!d.predeterminada
                        ? `<button class="detalles-dir-btn btn-pred" data-id="${d.id}">Predeterminada</button>`
                        : ''}
                    <button class="detalles-dir-btn btn-eliminar" data-id="${d.id}">Eliminar</button>
                </div>
            </div>
        `).join('');

        contenedor.querySelectorAll('.btn-eliminar').forEach(btn => {
            btn.addEventListener('click', () => eliminarDireccion(btn.dataset.id));
        });

        contenedor.querySelectorAll('.btn-pred').forEach(btn => {
            btn.addEventListener('click', () => marcarPredeterminada(btn.dataset.id));
        });

    } catch {
        contenedor.innerHTML = '<p class="detalles-sin-direcciones">Error al cargar direcciones.</p>';
    }
}

async function eliminarDireccion(id) {
    if (!confirm('¿Eliminar esta dirección?')) return;
    try {
        const res  = await authFetch(`${API_URL}/addresses/${id}`, { method: 'DELETE' });
        const json = await res.json();
        if (json.success) {
            showNotification('Dirección eliminada', 'success');
            await cargarDirecciones();
        } else {
            showNotification(json.message || 'Error al eliminar', 'error');
        }
    } catch {
        showNotification('Error de conexión', 'error');
    }
}

async function marcarPredeterminada(id) {
    try {
        const res  = await authFetch(`${API_URL}/addresses/${id}/predeterminada`, { method: 'PATCH' });
        const json = await res.json();
        if (json.success) {
            await cargarDirecciones();
        } else {
            showNotification(json.message || 'Error', 'error');
        }
    } catch {
        showNotification('Error de conexión', 'error');
    }
}
