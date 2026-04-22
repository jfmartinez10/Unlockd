import { validateEmail, validatePasswordMatch, removeNumbers, validateForm } from '../utils/validation.js';
import { showNotification } from '../utils/toast.js';

document.addEventListener('DOMContentLoaded', () => {
    const inputsTexto = document.querySelectorAll('input[name="nombre"], input[name="apellidos"]');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    /* Rutas a las imágenes */
    const rutaOjoAbierto = "/public/assets/images/ui/ojo-abierto.svg";
    const rutaOjoCerrado = "/public/assets/images/ui/ojo-cerrado.svg";

    /* Bloquear números en campos de texto */
    inputsTexto.forEach(input => {
        input.addEventListener('input', (e) => {
            e.target.value = removeNumbers(e.target.value);
        });
    });

    /* Configurar botón de mostrar/ocultar contraseña */
    function setupPasswordToggle(buttonId, inputId) {
        const btn = document.getElementById(buttonId);
        const input = document.getElementById(inputId);

        if (btn && input) {
            const imgIcono = document.createElement('img');
            imgIcono.src = rutaOjoAbierto;
            imgIcono.alt = "Mostrar contraseña";
            imgIcono.style.width = "20px";
            btn.appendChild(imgIcono);

            btn.addEventListener('click', () => {
                if (input.type === 'password') {
                    input.type = 'text';
                    imgIcono.src = rutaOjoCerrado;
                } else {
                    input.type = 'password';
                    imgIcono.src = rutaOjoAbierto;
                }
            });
        }
    }

    setupPasswordToggle('togglePassword', 'password');
    setupPasswordToggle('toggleConfirmPassword', 'confirmPassword');

    /* Validación de formulario de login */
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const isValid = validateForm(loginForm, {
                email: {
                    required: true,
                    email: true,
                    requiredMessage: 'El correo es obligatorio',
                    emailMessage: 'Por favor, introduce un correo válido'
                },
                password: {
                    required: true,
                    minLength: 6,
                    requiredMessage: 'La contraseña es obligatoria',
                    minLengthMessage: 'La contraseña debe tener al menos 6 caracteres'
                }
            });

            if (isValid) {
                console.log('Login válido');
                showNotification('Inicio de sesión exitoso', 'success');
                /* Aquí iría la lógica de autenticación */
            }
        });
    }

    /* Recuperación de contraseña */
    const recuperarForm = document.getElementById('recuperarForm');
    if (recuperarForm) {
        recuperarForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('recuperarEmail').value.trim();
            if (!validateEmail(email)) {
                showNotification('Introduce un email válido', 'error');
                return;
            }
            const btn = recuperarForm.querySelector('button[type="submit"]');
            const textoOriginal = btn.textContent;
            btn.textContent = 'ENVIANDO...';
            btn.disabled = true;
            setTimeout(() => {
                showNotification('Enlace enviado. Revisa tu correo.', 'success');
                btn.textContent = textoOriginal;
                btn.disabled = false;
                recuperarForm.reset();
            }, 1200);
        });
    }

    /* Validación de formulario de registro */
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            /* Validar que las contraseñas coincidan */
            if (!validatePasswordMatch(password, confirmPassword)) {
                showNotification('Las contraseñas no coinciden', 'error');
                return;
            }

            const isValid = validateForm(registerForm, {
                nombre: {
                    required: true,
                    minLength: 2,
                    requiredMessage: 'El nombre es obligatorio',
                    minLengthMessage: 'El nombre debe tener al menos 2 caracteres'
                },
                apellidos: {
                    required: true,
                    minLength: 2,
                    requiredMessage: 'Los apellidos son obligatorios',
                    minLengthMessage: 'Los apellidos deben tener al menos 2 caracteres'
                },
                email: {
                    required: true,
                    email: true,
                    requiredMessage: 'El correo es obligatorio',
                    emailMessage: 'Por favor, introduce un correo válido'
                },
                password: {
                    required: true,
                    minLength: 6,
                    requiredMessage: 'La contraseña es obligatoria',
                    minLengthMessage: 'La contraseña debe tener al menos 6 caracteres'
                }
            });

            if (isValid) {
                console.log('Registro válido');
                showNotification('Cuenta creada exitosamente', 'success');
                /* Aquí iría la lógica de registro */
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            }
        });
    }
});