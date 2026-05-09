import { API_URL } from '../config/api.js';

const STORAGE_KEY_TOKEN = 'unlockd_access_token';
const STORAGE_KEY_USER  = 'unlockd_user';

/* Guarda el accessToken y los datos del usuario en sessionStorage */
function saveSession(accessToken, user) {
    sessionStorage.setItem(STORAGE_KEY_TOKEN, accessToken);
    sessionStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
}

/* Elimina la sesión local */
function clearSession() {
    sessionStorage.removeItem(STORAGE_KEY_TOKEN);
    sessionStorage.removeItem(STORAGE_KEY_USER);
}

/* Devuelve el accessToken guardado o null */
function getAccessToken() {
    return sessionStorage.getItem(STORAGE_KEY_TOKEN);
}

/* Devuelve el objeto usuario o null */
function getUser() {
    try {
        return JSON.parse(sessionStorage.getItem(STORAGE_KEY_USER));
    } catch {
        return null;
    }
}

/* true si hay sesión activa */
function isLoggedIn() {
    return Boolean(getAccessToken());
}

/* true si el usuario logado tiene rol admin */
function isAdmin() {
    return getUser()?.rol === 'admin';
}

/*
    fetch con Authorization automático.
    Si recibe 401 intenta renovar el token via /refresh (cookie HttpOnly).
    Si la renovación falla, cierra la sesión local.
*/
async function authFetch(url, options = {}) {
    const isFormData = options.body instanceof FormData;

    const doRequest = (token) => fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
            /* No establecer Content-Type si es FormData — el navegador lo hace con el boundary */
            ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
            ...(options.headers || {}),
            'Authorization': `Bearer ${token}`,
        },
    });

    let token = getAccessToken();
    let res   = await doRequest(token);

    if (res.status === 401) {
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
            method:      'POST',
            credentials: 'include',
        });

        if (refreshRes.ok) {
            const json = await refreshRes.json();
            token = json.data.accessToken;
            sessionStorage.setItem(STORAGE_KEY_TOKEN, token);
            res = await doRequest(token);
        } else {
            clearSession();
            window.location.href = '/src/pages/auth/login.html';
            return null;
        }
    }

    return res;
}

/* Cierra sesión: revoca el refresh token en el servidor y limpia la sesión local */
async function logoutUser() {
    try {
        await fetch(`${API_URL}/auth/logout`, {
            method:      'POST',
            credentials: 'include',
        });
    } catch { /* si falla la red, continuamos */ }
    clearSession();
}

export { saveSession, clearSession, getAccessToken, getUser, isLoggedIn, isAdmin, authFetch, logoutUser };
