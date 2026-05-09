/* Guarda datos en localStorage */
export function setItem(key, value) {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
}
/* Obtiene datos de localStorage */
export function getItem(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
}

/* Elimina un item de localStorage */
export function removeItem(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing from localStorage:', error);
    return false;
  }
}

/* Limpia todo el localStorage */
export function clear() {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return false;
  }
}

/* Verifica si una clave existe en localStorage */
export function hasItem(key) {
  return localStorage.getItem(key) !== null;
}

/* Obtiene todas las claves de localStorage */
export function getAllKeys() {
  return Object.keys(localStorage);
}

/* Obtiene el tamaño usado de localStorage en bytes */
export function getStorageSize() {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length;
    }
  }
  return total;
}

/* Guarda datos en sessionStorage */
export function setSessionItem(key, value) {
  try {
    const serialized = JSON.stringify(value);
    sessionStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error('Error saving to sessionStorage:', error);
    return false;
  }
}

/* Obtiene datos de sessionStorage */
export function getSessionItem(key, defaultValue = null) {
  try {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from sessionStorage:', error);
    return defaultValue;
  }
}

/* Elimina un item de sessionStorage */
export function removeSessionItem(key) {
  try {
    sessionStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing from sessionStorage:', error);
    return false;
  }
}
const CART_KEY = 'unlockd_cart';

/* Obtiene el carrito actual */
export function getCart() {
  return getItem(CART_KEY, []);
}

/* Guarda el carrito */
export function saveCart(cart) {
  return setItem(CART_KEY, cart);
}

/* Añade un producto al carrito */
export function addToCart(product) {
  const cart = getCart();
  const normSize = (s) => (s === undefined || s === null || s === '') ? null : s;
  const existingIndex = cart.findIndex(
    item => item.id === product.id && normSize(item.size) === normSize(product.size)
  );

  if (existingIndex > -1) {
    cart[existingIndex].quantity += product.quantity;
  } else {
    cart.push(product);
  }

  return saveCart(cart);
}

/* Elimina un producto del carrito */
export function removeFromCart(productId, size) {
  let cart = getCart();
  cart = cart.filter(item => !(item.id === productId && item.size === size));
  return saveCart(cart);
}

/* Limpia el carrito */
export function clearCart() {
  return saveCart([]);
}

/* Obtiene el total del carrito */
export function getCartTotal() {
  const cart = getCart();
  return cart.reduce((total, item) => {
    const price = parseFloat(item.priceNumeric) || 0;
    return total + (price * item.quantity);
  }, 0);
}

/* Obtiene la cantidad total de items en el carrito */
export function getCartItemCount() {
  const cart = getCart();
  return cart.reduce((total, item) => total + item.quantity, 0);
}