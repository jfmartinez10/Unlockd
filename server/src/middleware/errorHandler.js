export default function errorHandler(err, _req, res, _next) {
    const status  = err.status || err.statusCode || 500;
    const message = err.message || 'Error interno del servidor';

    if (process.env.NODE_ENV !== 'production') console.error('[ERROR]', err);

    const body = { success: false, message };
    if (err.errors) body.errors = err.errors;

    res.status(status).json(body);
}
