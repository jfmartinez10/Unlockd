document.addEventListener('DOMContentLoaded', () => {
    const authForm = document.querySelector('.auth-form');
    const inputsTexto = document.querySelectorAll('input[placeholder="Nombre"], input[placeholder="Apellidos"]');
    const inputEmail = document.querySelector('input[type="email"]');
    
    // Rutas a tus imágenes locales
    const rutaOjoAbierto = "./img/ojo-abierto.svg";
    const rutaOjoCerrado = "./img/ojo-cerrado.svg";

    // 1. Bloquear números en Nombre y Apellidos
    inputsTexto.forEach(input => {
        input.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[0-9]/g, '');
        });
    });

    // 2. Validación de Formulario
    authForm.addEventListener('submit', (e) => {
        const emailValue = inputEmail.value;
        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const pass1 = document.getElementById('password');
        const pass2 = document.getElementById('confirmPassword');

        if (!regexEmail.test(emailValue)) {
            e.preventDefault();
            alert('Por favor, introduce un correo electrónico válido.');
            return;
        }

        // Validación de coincidencia de contraseñas (solo en registro)
        if (pass1 && pass2) {
            if (pass1.value !== pass2.value) {
                e.preventDefault();
                alert('Las contraseñas no coinciden.');
                return;
            }
        }
    });

    // 3. Configuración de los botones de mostrar contraseña
    function setupPasswordToggle(buttonId, inputId) {
        const btn = document.getElementById(buttonId);
        const input = document.getElementById(inputId);

        if (btn && input) {
            // Creamos el elemento imagen y lo metemos en el botón
            const imgIcono = document.createElement('img');
            imgIcono.src = rutaOjoAbierto;
            imgIcono.alt = "Mostrar contraseña";
            imgIcono.style.width = "20px"; // Ajusta el tamaño aquí
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
});