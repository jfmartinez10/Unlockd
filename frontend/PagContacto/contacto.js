document.addEventListener('DOMContentLoaded', () => {
    const contactoForm = document.querySelector('.contacto-form');
    const inputNombre = document.querySelector('input[placeholder="Nombre completo"]');
    const inputEmail = document.querySelector('input[type="email"]');

    // 1. Bloquear números en el campo Nombre completo
    if (inputNombre) {
        inputNombre.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[0-9]/g, '');
        });
    }

    // 2. Validación del Formulario de Contacto
    if (contactoForm) {
        contactoForm.addEventListener('submit', (e) => {
            const emailValue = inputEmail.value;
            const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!regexEmail.test(emailValue)) {
                e.preventDefault();
                alert('Por favor, introduce un correo electrónico válido.');
                return;
            }
        });
    }
});