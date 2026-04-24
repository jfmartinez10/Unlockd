'use strict';

const rateLimit = require('express-rate-limit');

/**
 * Limitador general — 100 peticiones por IP cada 15 minutos.
 * Se aplica a toda la API.
 */
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Demasiadas peticiones. Intenta de nuevo en 15 minutos.' },
});

/**
 * Limitador estricto para login — 10 intentos por IP cada 15 minutos.
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Demasiados intentos de inicio de sesión. Espera 15 minutos.' },
});

module.exports = { generalLimiter, authLimiter };
