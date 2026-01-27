/* Valida formato de email */
export function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/* Valida contraseña (mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número) */
export function validatePassword(password) {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return regex.test(password);
}

/* Valida que dos contraseñas coincidan */
export function validatePasswordMatch(password1, password2) {
  return password1 === password2 && password1.length > 0;
}

/* Valida nombre (solo letras y espacios)  */
export function validateName(name) {
  const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  return regex.test(name) && name.trim().length > 0;
}

/* Sanitiza input eliminando números */
export function removeNumbers(text) {
  return text.replace(/[0-9]/g, '');
}

/* Sanitiza HTML para prevenir XSS */
export function sanitizeHTML(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    "/": '&#x2F;',
  };
  const reg = /[&<>"'/]/ig;
  return text.replace(reg, (match) => (map[match]));
}

/* Valida longitud de string */
export function validateLength(text, minLength = 0, maxLength = Infinity) {
  const length = text.trim().length;
  return length >= minLength && length <= maxLength;
}

/* Valida número de teléfono español */
export function validateSpanishPhone(phone) {
  const regex = /^(\+34|0034|34)?[6789]\d{8}$/;
  return regex.test(phone.replace(/\s/g, ''));
}

/* Muestra mensaje de error en formulario */
export function showError(inputElement, message) {
  inputElement.classList.add('error');

  /* Eliminar mensaje de error previo si existe */
  const existingError = inputElement.parentElement.querySelector('.form-error');
  if (existingError) {
    existingError.remove();
  }

  /* Crear nuevo mensaje de error */
  const errorElement = document.createElement('div');
  errorElement.className = 'form-error';
  errorElement.textContent = message;
  inputElement.parentElement.appendChild(errorElement);
}

/* Limpia mensaje de error en formulario */
export function clearError(inputElement) {
  inputElement.classList.remove('error');
  const errorElement = inputElement.parentElement.querySelector('.form-error');
  if (errorElement) {
    errorElement.remove();
  }
}

/* Valida formulario completo */
export function validateForm(formElement, rules) {
  let isValid = true;

  Object.keys(rules).forEach(fieldName => {
    const input = formElement.querySelector(`[name="${fieldName}"]`);
    if (!input) return;

    clearError(input);

    const rule = rules[fieldName];
    const value = input.value.trim();

    /* Validar required */
    if (rule.required && value === '') {
      showError(input, rule.requiredMessage || 'Este campo es obligatorio');
      isValid = false;
      return;
    }

    /* Validar email */
    if (rule.email && !validateEmail(value)) {
      showError(input, rule.emailMessage || 'Email inválido');
      isValid = false;
      return;
    }

    /* Validar longitud */
    if (rule.minLength && !validateLength(value, rule.minLength)) {
      showError(input, rule.minLengthMessage || `Mínimo ${rule.minLength} caracteres`);
      isValid = false;
      return;
    }

    /* Validar custom */
    if (rule.custom && !rule.custom(value)) {
      showError(input, rule.customMessage || 'Valor inválido');
      isValid = false;
      return;
    }
  });

  return isValid;
}