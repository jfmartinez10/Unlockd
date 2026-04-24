'use strict';

/**
 * Respuesta estándar de éxito.
 * { success: true, data: ..., message: ... }
 */
function ok(data, message = 'OK') {
    return { success: true, message, data };
}

/**
 * Respuesta estándar de error.
 * { success: false, message: ... }
 */
function fail(message = 'Error', errors = null) {
    const body = { success: false, message };
    if (errors) body.errors = errors;
    return body;
}

module.exports = { ok, fail };
