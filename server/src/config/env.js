'use strict';

const REQUIRED = [
    'DATABASE_URL',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
];

function validateEnv() {
    const missing = REQUIRED.filter(k => !process.env[k]);
    if (missing.length) {
        console.error('❌ Variables de entorno faltantes:', missing.join(', '));
        console.error('   Copia .env.example a .env y rellena los valores.');
        process.exit(1);
    }
}

module.exports = { validateEnv };
