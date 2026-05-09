import { validateEmail, validatePasswordMatch, removeNumbers, validateForm } from '../utils/validation.js';
import { showNotification } from '../utils/toast.js';
import { saveSession } from '../utils/auth.js';
import { syncCartOnLogin } from '../utils/cartService.js';
import { syncFavoritosOnLogin } from '../utils/favoritosService.js';
import { API_URL } from '../config/api.js';

document.addEventListener('DOMContentLoaded', () => {

    const inputsTexto = document.querySelectorAll('input[name="nombre"], input[name="apellidos"]');
    const loginForm    = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const recuperarForm = document.getElementById('recuperarForm');

    const rutaOjoAbierto = '/public/assets/images/ui/ojo-abierto.svg';
    const rutaOjoCerrado = '/public/assets/images/ui/ojo-cerrado.svg';

    /* Bloquear números en campos de texto */
    inputsTexto.forEach(input => {
        input.addEventListener('input', (e) => {
            e.target.value = removeNumbers(e.target.value);
        });
    });

    /* Mostrar/ocultar contraseña */
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

    setupPasswordToggle('togglePassword', 'password');
    setupPasswordToggle('toggleConfirmPassword', 'confirmPassword');

    /* Deshabilita el botón de submit y pone texto de carga */
    function setLoading(form, loading, textoOriginal) {
        const btn = form.querySelector('button[type="submit"]');
        if (!btn) return;
        btn.disabled    = loading;
        btn.textContent = loading ? 'CARGANDO...' : textoOriginal;
    }

    /* Formulario de login */
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const isValid = validateForm(loginForm, {
                email: {
                    required: true, email: true,
                    requiredMessage: 'El correo es obligatorio',
                    emailMessage:    'Introduce un correo válido',
                },
                password: {
                    required: true, minLength: 8,
                    requiredMessage:  'La contraseña es obligatoria',
                    minLengthMessage: 'Mínimo 8 caracteres',
                },
            });

            if (!isValid) return;

            setLoading(loginForm, true, 'ACCEDER');

            try {
                const res  = await fetch(`${API_URL}/auth/login`, {
                    method:      'POST',
                    credentials: 'include',
                    headers:     { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email:    loginForm.querySelector('[name="email"]').value.trim(),
                        password: document.getElementById('password').value,
                    }),
                });

                const json = await res.json();

                if (!json.success) {
                    showNotification(json.message || 'Error al iniciar sesión', 'error');
                    return;
                }

                saveSession(json.data.accessToken, json.data.user);
                await Promise.all([syncCartOnLogin(), syncFavoritosOnLogin()]);
                showNotification('Sesión iniciada correctamente', 'success');
                setTimeout(() => { window.location.href = '/src/pages/index.html'; }, 800);

            } catch (err) {
                showNotification('Error de conexión. ¿El servidor está activo?', 'error');
            } finally {
                setLoading(loginForm, false, 'ACCEDER');
            }
        });
    }

    /* Formulario de registro */
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const password        = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (!validatePasswordMatch(password, confirmPassword)) {
                showNotification('Las contraseñas no coinciden', 'error');
                return;
            }

            const isValid = validateForm(registerForm, {
                nombre: {
                    required: true, minLength: 2,
                    requiredMessage:  'El nombre es obligatorio',
                    minLengthMessage: 'Mínimo 2 caracteres',
                },
                apellidos: {
                    required: true, minLength: 2,
                    requiredMessage:  'Los apellidos son obligatorios',
                    minLengthMessage: 'Mínimo 2 caracteres',
                },
                email: {
                    required: true, email: true,
                    requiredMessage: 'El correo es obligatorio',
                    emailMessage:    'Introduce un correo válido',
                },
                password: {
                    required: true, minLength: 8,
                    requiredMessage:  'La contraseña es obligatoria',
                    minLengthMessage: 'Mínimo 8 caracteres',
                },
            });

            if (!isValid) return;

            setLoading(registerForm, true, 'CREAR CUENTA');

            try {
                const res  = await fetch(`${API_URL}/auth/register`, {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nombre:    registerForm.querySelector('[name="nombre"]').value.trim(),
                        apellidos: registerForm.querySelector('[name="apellidos"]').value.trim(),
                        email:     registerForm.querySelector('[name="email"]').value.trim(),
                        password,
                    }),
                });

                const json = await res.json();

                if (!json.success) {
                    showNotification(json.message || 'Error al registrarse', 'error');
                    return;
                }

                showNotification('Cuenta creada. Revisa tu correo para verificarla.', 'success');
                registerForm.reset();
                setTimeout(() => { window.location.href = 'login.html'; }, 2500);

            } catch (err) {
                showNotification('Error de conexión. ¿El servidor está activo?', 'error');
            } finally {
                setLoading(registerForm, false, 'CREAR CUENTA');
            }
        });
    }

    /* Formulario de recuperación de contraseña */
    if (recuperarForm) {
        recuperarForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('recuperarEmail').value.trim();
            if (!validateEmail(email)) {
                showNotification('Introduce un email válido', 'error');
                return;
            }

            setLoading(recuperarForm, true, 'ENVIAR ENLACE');

            try {
                const res  = await fetch(`${API_URL}/auth/forgot-password`, {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ email }),
                });

                const json = await res.json();
                showNotification(json.message || 'Enlace enviado. Revisa tu correo.', 'success');
                recuperarForm.reset();

            } catch (err) {
                showNotification('Error de conexión. ¿El servidor está activo?', 'error');
            } finally {
                setLoading(recuperarForm, false, 'ENVIAR ENLACE');
            }
        });
    }
});
