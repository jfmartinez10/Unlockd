import { API_URL } from '../config/api.js';
import { showNotification } from '../utils/toast.js';

document.addEventListener('DOMContentLoaded', () => {

    const form   = document.getElementById('verificarForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email  = document.getElementById('verificarEmail').value.trim();
        const codigo = document.getElementById('verificarCodigo').value.trim();

        if (!email || codigo.length !== 6) {
            showNotification('Introduce tu correo y el código de 6 dígitos', 'error');
            return;
        }

        const btn = form.querySelector('button[type="submit"]');
        btn.disabled    = true;
        btn.textContent = 'VERIFICANDO...';

        try {
            const res  = await fetch(`${API_URL}/auth/verificar`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ email, codigo }),
            });

            const json = await res.json();

            if (!json.success) {
                showNotification(json.message || 'Código inválido', 'error');
                return;
            }

            showNotification('Cuenta verificada correctamente', 'success');
            setTimeout(() => { window.location.href = 'login.html'; }, 1500);

        } catch (err) {
            showNotification('Error de conexión. ¿El servidor está activo?', 'error');
        } finally {
            btn.disabled    = false;
            btn.textContent = 'VERIFICAR CUENTA';
        }
    });
});
