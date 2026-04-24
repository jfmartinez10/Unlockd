export default function errorHandler(err, _req, res, _next) {
    const status  = err.status || err.statusCode || 500;
    const message = err.message || 'Error interno del servidor';

    if (process.env.NODE_ENV !== 'production') console.error('[ERROR]', err);

    res.status(status).json({ success: false, message });
}
