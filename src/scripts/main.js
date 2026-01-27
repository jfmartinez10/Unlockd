import { getCartItemCount } from './utils/storage.js';

/* Configuración global */
const CONFIG = {
  apiUrl: '', // Para futuro backend
  assetsPath: '/public/assets',
  productDataPath: '/src/data/products.json'
};

/* Inicialización global */

document.addEventListener('DOMContentLoaded', () => {
  initializeHeader();
  forceReloadHeaderImages();
});

/* Inicializa funcionalidad del header */
function initializeHeader() {
  /* Resaltar página activa en navegación */
  highlightActivePage();
  
  /* Click en carrito */
  const cartIcon = document.querySelector('.nav-right .icon:last-child');
  if (cartIcon) {
    cartIcon.addEventListener('click', () => {
      console.log('Abrir carrito');
      // TODO: Implementar modal de carrito
    });
  }

  /* Click en búsqueda */
  const searchIcon = document.querySelector('.nav-right .icon:first-child');
  if (searchIcon) {
    searchIcon.addEventListener('click', () => {
      console.log('Abrir búsqueda');
      // TODO: Implementar modal de búsqueda
    });
  }
}

/* Resalta la página activa en el menú de navegación */
function highlightActivePage() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-left a');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (currentPath.includes(href) && href !== '#') {
      link.style.opacity = '1';
      link.style.fontWeight = 'bold';
    }
  });
}

/* Fuerza la recarga de imágenes del header (fix para móviles) */
function forceReloadHeaderImages() {
  const headerImages = document.querySelectorAll('.main-header img');
  headerImages.forEach(img => {
    if (!img.complete) {
      const src = img.src;
      img.src = '';
      img.src = src;
    }
  });
}

/* Navega a una página con parámetros opcionales */
export function navigateTo(page, params = {}) {
  let url = page;
  
  /* Agregar parámetros a la URL si existen */
  if (Object.keys(params).length > 0) {
    const queryString = new URLSearchParams(params).toString();
    url += `?${queryString}`;
  }
  
  console.log('Navegando a:', url);
  window.location.href = url;
}

/* Obtiene parámetros de la URL */
export function getUrlParams() {
  const params = {};
  const urlParams = new URLSearchParams(window.location.search);
  
  for (const [key, value] of urlParams) {
    params[key] = value;
  }
  
  return params;
}

/* Scroll suave a un elemento */
export function scrollToElement(selector, offset = 0) {
  const element = document.querySelector(selector);
  if (!element) return;
  
  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;
  
  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });
}

/* Scroll al inicio de la página */
export function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

/* Previene el scroll del body */
export function disableBodyScroll() {
  document.body.style.overflow = 'hidden';
}

/* Permite el scroll del body */
export function enableBodyScroll() {
  document.body.style.overflow = 'auto';
}

/* Muestra estado de carga en un botón */
export function setButtonLoading(button, loadingText = 'CARGANDO...') {
  button.dataset.originalText = button.textContent;
  button.textContent = loadingText;
  button.disabled = true;
  button.classList.add('loading');
}

/* Restaura el estado normal de un botón */
export function setButtonReady(button) {
  if (button.dataset.originalText) {
    button.textContent = button.dataset.originalText;
  }
  button.disabled = false;
  button.classList.remove('loading');
}

/* Muestra una notificación temporal */
export function showNotification(message, type = 'info', duration = 3000) {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  /* Estilos inline */
  Object.assign(notification.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    background: type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#333',
    color: '#fff',
    padding: '15px 20px',
    borderRadius: '4px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    zIndex: '10000',
    animation: 'slideIn 0.3s ease',
    maxWidth: '300px'
  });
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, duration);
}

/* Formatea un precio */
export function formatPrice(price, currency = 'EUR') {
  const formatter = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency,
  });
  
  return formatter.format(price);
}

/* Formatea una fecha */
export function formatDate(date) {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

/* Debounce function */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}