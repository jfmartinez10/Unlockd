import { API_URL } from '../config/api.js';
import { isLoggedIn, authFetch } from './auth.js';
import { getItem, setItem } from './storage.js';

const FAV_KEY = 'unlockd_favoritos';

/* Caché en memoria — Set de producto_ids */
let _favIds = null;

/* Carga favoritos desde API o localStorage e inicializa la caché.
   Es idempotente: si ya está inicializada, no hace nada. */
export async function initFavoritos() {
    if (_favIds !== null) return;

    if (!isLoggedIn()) {
        _favIds = new Set(getItem(FAV_KEY, []));
        return;
    }

    try {
        const res  = await authFetch(`${API_URL}/favorites`);
        const json = await res.json();
        if (json.success) {
            _favIds = new Set(json.data);
            return;
        }
    } catch { /* fallback a local si falla la red */ }

    _favIds = new Set(getItem(FAV_KEY, []));
}

/* Fuerza recarga en la próxima llamada a initFavoritos (útil tras login/logout) */
export function resetFavoritosCache() {
    _favIds = null;
}

/* Comprobación síncrona — requiere haber llamado initFavoritos() primero */
export function esFavorito(productoId) {
    return _favIds?.has(productoId) ?? false;
}

/* Toggle — actualiza caché y persiste en API o localStorage */
export async function toggleFavorito(productoId) {
    if (_favIds === null) await initFavoritos();

    if (!isLoggedIn()) {
        const activo = !_favIds.has(productoId);
        if (activo) _favIds.add(productoId);
        else        _favIds.delete(productoId);
        setItem(FAV_KEY, [..._favIds]);
        return activo;
    }

    try {
        const res  = await authFetch(`${API_URL}/favorites/${productoId}`, { method: 'POST' });
        const json = await res.json();
        if (json.success) {
            if (json.data.activo) _favIds.add(productoId);
            else                  _favIds.delete(productoId);
            return json.data.activo;
        }
    } catch (err) {
        console.error('[favs] Error toggle:', err.message);
    }

    return _favIds.has(productoId);
}

/*
    Sincronización en login:
    - Lee favoritos de localStorage
    - Los que no existan aún en BD → POST (el toggle los añade)
    - Limpia localStorage
*/
export async function syncFavoritosOnLogin() {
    const localFavs = getItem(FAV_KEY, []);

    if (localFavs.length > 0) {
        try {
            const res    = await authFetch(`${API_URL}/favorites`);
            const json   = await res.json();
            const dbFavs = new Set(json.success ? json.data : []);
            const toAdd  = localFavs.filter(id => !dbFavs.has(id));

            await Promise.allSettled(
                toAdd.map(id =>
                    authFetch(`${API_URL}/favorites/${id}`, { method: 'POST' }).catch(() => {})
                )
            );
        } catch { /* ignorar fallos de red */ }

        setItem(FAV_KEY, []);
    }

    _favIds = null; /* forzar recarga desde BD en próxima llamada */
}
