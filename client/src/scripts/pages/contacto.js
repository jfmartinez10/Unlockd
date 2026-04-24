import { validateForm, removeNumbers } from '../utils/validation.js';
import { showNotification } from '../main.js';

document.addEventListener('DOMContentLoaded', () => {
    const contactoForm = document.getElementById('contactForm');
    const inputNombre = document.querySelector('input[name="nombre"]');

    /* Bloquear números en el campo Nombre */
    if (inputNombre) {
        inputNombre.addEventListener('input', (e) => {
            e.target.value = removeNumbers(e.target.value);
        });
    }

    /* Validación del formulario */
    if (contactoForm) {
        contactoForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const isValid = validateForm(contactoForm, {
                nombre: {
                    required: true,
                    minLength: 3,
                    requiredMessage: 'El nombre es obligatorio',
                    minLengthMessage: 'El nombre debe tener al menos 3 caracteres'
                },
                email: {
                    required: true,
                    email: true,
                    requiredMessage: 'El correo es obligatorio',
                    emailMessage: 'Por favor, introduce un correo válido'
                },
                asunto: {
                    required: true,
                    minLength: 5,
                    requiredMessage: 'El asunto es obligatorio',
                    minLengthMessage: 'El asunto debe tener al menos 5 caracteres'
                },
                mensaje: {
                    required: true,
                    minLength: 10,
                    requiredMessage: 'El mensaje es obligatorio',
                    minLengthMessage: 'El mensaje debe tener al menos 10 caracteres'
                }
            });

            if (isValid) {
                console.log('Formulario válido');
                showNotification('Mensaje enviado correctamente', 'success');

                /* Resetear formulario */
                contactoForm.reset();

                /* Aquí iría la lógica para enviar el email */
            }
        });
    }
});