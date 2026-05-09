import { API_URL } from '../config/api.js';
import { isLoggedIn, authFetch } from './auth.js';
import {
    getCart as getLocalCart,
    saveCart,
    clearCart as clearLocalCart,
} from './storage.js';

/* Normaliza un item de BD al formato interno del carrito */
function normalizarItemBD(item) {
    return {
        id:           item.id,
        producto_id:  item.producto_id,
        nombre:       item.nombre,
        precio:       item.precio,
        priceNumeric: item.priceNumeric,
        size:         item.talla,
        quantity:     item.cantidad,
        imagen:       item.imagen,
    };
}

/* Devuelve el carrito actual — BD si hay sesión, localStorage si no */
export async function getCart() {
    if (!isLoggedIn()) return getLocalCart();

    try {
        const res  = await authFetch(`${API_URL}/cart`);
        const json = await res.json();
        if (json.success) return json.data.map(normalizarItemBD);
    } catch {
        /* fallback a local si falla la red */
    }
    return getLocalCart();
}

/* Añade o incrementa un item */
export async function addToCart(product) {
    if (!isLoggedIn()) {
        const { addToCart: localAdd } = await import('./storage.js');
        localAdd(product);
        return;
    }

    const talla = product.size ?? 'unica';

    try {
        await authFetch(`${API_URL}/cart`, {
            method: 'POST',
            body: JSON.stringify({
                producto_id: product.id,
                talla,
                cantidad:    product.quantity ?? 1,
            }),
        });
    } catch (err) {
        console.error('[cart] Error añadiendo item:', err.message);
    }
}

/* Actualiza la cantidad de un item (requiere id de BD) */
export async function updateQuantity(itemId, cantidad) {
    if (!isLoggedIn()) {
        /* En local usamos el índice; no aplica aquí */
        return;
    }

    try {
        await authFetch(`${API_URL}/cart/${itemId}`, {
            method: 'PATCH',
            body: JSON.stringify({ cantidad }),
        });
    } catch (err) {
        console.error('[cart] Error actualizando cantidad:', err.message);
    }
}

/* Elimina un item concreto */
export async function removeFromCart(itemId) {
    if (!isLoggedIn()) {
        const cart = getLocalCart();
        const idx  = cart.findIndex((_, i) => i === itemId);
        if (idx > -1) cart.splice(idx, 1);
        saveCart(cart);
        return;
    }

    try {
        await authFetch(`${API_URL}/cart/${itemId}`, { method: 'DELETE' });
    } catch (err) {
        console.error('[cart] Error eliminando item:', err.message);
    }
}

/* Vacía el carrito completo */
export async function clearCart() {
    if (!isLoggedIn()) {
        clearLocalCart();
        return;
    }

    try {
        await authFetch(`${API_URL}/cart`, { method: 'DELETE' });
    } catch (err) {
        console.error('[cart] Error vaciando carrito:', err.message);
    }
}

/*
    Sincronización en login:
    - Lee el carrito de localStorage
    - Sube cada item a la BD (el upsert suma cantidades si ya existe)
    - Limpia localStorage
*/
export async function syncCartOnLogin() {
    const localItems = getLocalCart();
    if (localItems.length === 0) return;

    const promesas = localItems.map(item =>
        authFetch(`${API_URL}/cart`, {
            method: 'POST',
            body: JSON.stringify({
                producto_id: item.id,
                talla:       item.size ?? 'unica',
                cantidad:    item.quantity ?? 1,
            }),
        }).catch(() => { /* ignorar items que fallen */ })
    );

    await Promise.allSettled(promesas);
    clearLocalCart();
}
