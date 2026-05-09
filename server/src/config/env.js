const REQUIRED = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'MAIL_USER', 'MAIL_PASS', 'CLIENT_URL'];

function validateEnv() {
    const missing = REQUIRED.filter(k => !process.env[k]);
    if (missing.length) {
        console.error('Variables de entorno faltantes:', missing.join(', '));
        process.exit(1);
    }
}

export { validateEnv };
