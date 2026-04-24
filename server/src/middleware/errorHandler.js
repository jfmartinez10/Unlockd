'use strict';

/**
 * Middleware de error global de Express.
 * Captura cualquier error propagado con next(err).
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
    const status  = err.status || err.statusCode || 500;
    const message = err.message || 'Error interno del servidor';

    /* No exponer stack en producción */
    if (process.env.NODE_ENV !== 'production') {
        console.error('[ERROR]', err);
    }

    res.status(status).json({
        success: false,
        message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
}

module.exports = errorHandler;
