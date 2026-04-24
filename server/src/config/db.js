'use strict';

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
    console.error('❌ Error en el pool de PG:', err.message);
});

/* Helper para ejecutar queries: query('SELECT...', [params]) */
async function query(text, params) {
    const res = await pool.query(text, params);
    return res;
}

module.exports = { pool, query };
