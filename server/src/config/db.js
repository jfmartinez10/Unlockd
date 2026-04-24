'use strict';

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    /* Supabase Direct requiere SSL en producción */
    ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
    /* Pool config */
    max:             10,   // máximo de conexiones simultáneas
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
});

/* Log de errores inesperados en el pool */
pool.on('error', (err) => {
    console.error('❌ Error inesperado en el pool de PG:', err.message);
});

/**
 * Helper: ejecuta una query con parámetros y devuelve las filas.
 * Uso: const rows = await query('SELECT * FROM productos WHERE id = $1', [id]);
 */
async function query(text, params) {
    const start = Date.now();
    const res   = await pool.query(text, params);
    const dur   = Date.now() - start;
    if (process.env.NODE_ENV !== 'production') {
        console.log(`[DB] ${dur}ms — ${text.slice(0, 80)}`);
    }
    return res;
}

module.exports = { pool, query };
