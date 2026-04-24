import { abrirCarrito } from './components/carrito.js';
import './components/buscador.js';
export { showNotification } from './utils/toast.js';

/* Configuración */
const CONFIG = {
  apiUrl: '', // Para futuro backend
  assetsPath: '/public/assets',
  productDataPath: '/src/data/products.json'
};

/* Inicialización */

document.addEventListener('DOMContentLoaded', () => {
  initializeHeader();
  forceReloadHeaderImages();
});

/* Header */
function initializeHeader() {
  /* Página activa */
  highlightActivePage();
  
  /* Carrito */
  const cartIcon = document.querySelector('.nav-right .icon:last-child');
  if (cartIcon) {
    cartIcon.addEventListener('click', abrirCarrito);
  }
}

/* Resaltar página activa */
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

/* Recarga imágenes header */
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

/* Navegación */
export function navigateTo(page, params = {}) {
  let url = page;
  
  /* Parámetros URL */
  if (Object.keys(params).length > 0) {
    const queryString = new URLSearchParams(params).toString();
    url += `?${queryString}`;
  }
  
  console.log('Navegando a:', url);
  window.location.href = url;
}

/* Obtener parámetros */
export function getUrlParams() {
  const params = {};
  const urlParams = new URLSearchParams(window.location.search);
  
  for (const [key, value] of urlParams) {
    params[key] = value;
  }
  
  return params;
}

/* Scroll suave */
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

/* Scroll arriba */
export function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

/* Bloquear scroll */
export function disableBodyScroll() {
  document.body.style.overflow = 'hidden';
}

/* Habilitar scroll */
export function enableBodyScroll() {
  document.body.style.overflow = 'auto';
}

/* Botón cargando */
export function setButtonLoading(button, loadingText = 'CARGANDO...') {
  button.dataset.originalText = button.textContent;
  button.textContent = loadingText;
  button.disabled = true;
  button.classList.add('loading');
}

/* Botón listo */
export function setButtonReady(button) {
  if (button.dataset.originalText) {
    button.textContent = button.dataset.originalText;
  }
  button.disabled = false;
  button.classList.remove('loading');
}


/* Formatear precio */
export function formatPrice(price, currency = 'EUR') {
  const formatter = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency,
  });
  
  return formatter.format(price);
}

/* Formatear fecha */
export function formatDate(date) {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

/* Debounce */
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