import { showNotification } from '../utils/toast.js';
import { validatePasswordMatch } from '../utils/validation.js';
import { API_URL } from '../config/api.js';

document.addEventListener('DOMContentLoaded', () => {

    const token = new URLSearchParams(window.location.search).get('token');
    const form  = document.getElementById('resetForm');

    if (!token) {
        showNotification('Enlace de restablecimiento inválido', 'error');
        setTimeout(() => { window.location.href = 'recuperar.html'; }, 2000);
        return;
    }

    const rutaOjoAbierto = '/public/assets/images/ui/ojo-abierto.svg';
    const rutaOjoCerrado = '/public/assets/images/ui/ojo-cerrado.svg';

    function setupPasswordToggle(buttonId, inputId) {
        const btn   = document.getElementById(buttonId);
        const input = document.getElementById(inputId);
        if (!btn || !input) return;

        const img = document.createElement('img');
        img.src   = rutaOjoAbierto;
        img.alt   = 'Mostrar contraseña';
        img.style.width = '20px';
        btn.appendChild(img);

        btn.addEventListener('click', () => {
            const visible = input.type === 'text';
            input.type = visible ? 'password' : 'text';
            img.src    = visible ? rutaOjoAbierto : rutaOjoCerrado;
        });
    }

    setupPasswordToggle('toggleNewPassword', 'newPassword');
    setupPasswordToggle('toggleConfirmNewPassword', 'confirmNewPassword');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const password        = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;

        if (password.length < 8) {
            showNotification('La contraseña debe tener al menos 8 caracteres', 'error');
            return;
        }

        if (!validatePasswordMatch(password, confirmPassword)) {
            showNotification('Las contraseñas no coinciden', 'error');
            return;
        }

        const btn = form.querySelector('button[type="submit"]');
        btn.disabled    = true;
        btn.textContent = 'GUARDANDO...';

        try {
            const res  = await fetch(`${API_URL}/auth/reset-password`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ token, password }),
            });

            const json = await res.json();

            if (!json.success) {
                showNotification(json.message || 'Error al restablecer la contraseña', 'error');
                return;
            }

            showNotification('Contraseña actualizada. Ahora puedes iniciar sesión.', 'success');
            setTimeout(() => { window.location.href = 'login.html'; }, 1800);

        } catch (err) {
            showNotification('Error de conexión. ¿El servidor está activo?', 'error');
        } finally {
            btn.disabled    = false;
            btn.textContent = 'GUARDAR CONTRASEÑA';
        }
    });
});
