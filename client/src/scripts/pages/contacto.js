import { validateForm, removeNumbers } from '../utils/validation.js';
import { showNotification } from '../main.js';
import { API_URL } from '../config/api.js';

document.addEventListener('DOMContentLoaded', () => {

    const contactoForm = document.getElementById('contactForm');
    const inputNombre  = document.querySelector('input[name="nombre"]');

    /* Bloquear números en el campo Nombre */
    if (inputNombre) {
        inputNombre.addEventListener('input', (e) => {
            e.target.value = removeNumbers(e.target.value);
        });
    }

    if (contactoForm) {
        contactoForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const isValid = validateForm(contactoForm, {
                nombre: {
                    required: true, minLength: 3,
                    requiredMessage:  'El nombre es obligatorio',
                    minLengthMessage: 'El nombre debe tener al menos 3 caracteres',
                },
                email: {
                    required: true, email: true,
                    requiredMessage: 'El correo es obligatorio',
                    emailMessage:    'Por favor, introduce un correo válido',
                },
                asunto: {
                    required: true, minLength: 5,
                    requiredMessage:  'El asunto es obligatorio',
                    minLengthMessage: 'El asunto debe tener al menos 5 caracteres',
                },
                mensaje: {
                    required: true, minLength: 10,
                    requiredMessage:  'El mensaje es obligatorio',
                    minLengthMessage: 'El mensaje debe tener al menos 10 caracteres',
                },
            });

            if (!isValid) return;

            const btn = contactoForm.querySelector('button[type="submit"]');
            const textoOriginal = btn.textContent;
            btn.disabled    = true;
            btn.textContent = 'ENVIANDO...';

            try {
                const res  = await fetch(`${API_URL}/contact`, {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nombre:  contactoForm.querySelector('[name="nombre"]').value.trim(),
                        email:   contactoForm.querySelector('[name="email"]').value.trim(),
                        asunto:  contactoForm.querySelector('[name="asunto"]').value.trim(),
                        mensaje: contactoForm.querySelector('[name="mensaje"]').value.trim(),
                    }),
                });

                const json = await res.json();

                if (!json.success) {
                    showNotification(json.message || 'Error al enviar el mensaje', 'error');
                    return;
                }

                showNotification('Mensaje enviado correctamente', 'success');
                contactoForm.reset();

            } catch (err) {
                showNotification('Error de conexión. ¿El servidor está activo?', 'error');
            } finally {
                btn.disabled    = false;
                btn.textContent = textoOriginal;
            }
        });
    }
});
