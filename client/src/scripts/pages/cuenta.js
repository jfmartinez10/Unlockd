import { isLoggedIn, isAdmin, getUser, logoutUser } from '../utils/auth.js';

document.addEventListener('DOMContentLoaded', () => {

    /* Redirigir si no hay sesión */
    if (!isLoggedIn()) {
        window.location.href = '/src/pages/auth/login.html';
        return;
    }

    /* Si es admin, mostrar acceso al panel */
    if (isAdmin()) {
        const seccion = document.querySelector('.cuenta-seccion');
        if (seccion) {
            const bannerAdmin = document.createElement('a');
            bannerAdmin.href = '/src/pages/admin/admin.html';
            bannerAdmin.className = 'cuenta-admin-banner';
            bannerAdmin.textContent = '→ Panel de administración';
            seccion.insertBefore(bannerAdmin, seccion.querySelector('.cuenta-grid'));
        }
    }

    /* Cerrar sesión */
    const btnCerrar = document.getElementById('btnCerrarSesion');
    if (btnCerrar) {
        btnCerrar.addEventListener('click', async () => {
            await logoutUser();
            window.location.href = '/src/pages/auth/login.html';
        });
    }
});
