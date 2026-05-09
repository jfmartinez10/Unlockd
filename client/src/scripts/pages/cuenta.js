import { isLoggedIn, getUser, logoutUser } from '../utils/auth.js';

document.addEventListener('DOMContentLoaded', () => {

    /* Redirigir si no hay sesión */
    if (!isLoggedIn()) {
        window.location.href = '/src/pages/auth/login.html';
        return;
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
