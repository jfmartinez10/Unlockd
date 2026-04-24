'use strict';

const cors = require('cors');

const ALLOWED_ORIGINS = [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
    /* Añade aquí tu dominio de producción cuando lo tengas */
    /* 'https://unlockd.com', */
];

const corsOptions = {
    origin(origin, callback) {
        /* Permitir peticiones sin origin (Postman, mobile, SSR) en dev */
        if (!origin && process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        if (ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS: origen no permitido — ${origin}`));
        }
    },
    credentials: true,           /* Necesario para cookies HttpOnly */
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86_400,              /* Pre-flight cache 24h */
};

module.exports = cors(corsOptions);
