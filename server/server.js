'use strict';

require('dotenv').config();
const { validateEnv } = require('./src/config/env');
validateEnv();

const app    = require('./src/app');
const { pool } = require('./src/config/db');
const PORT   = process.env.PORT || 3000;

async function start() {
    /* Verificar conexión a la base de datos antes de arrancar */
    try {
        const client = await pool.connect();
        const { rows } = await client.query('SELECT NOW() AS now');
        client.release();
        console.log(`✅ PostgreSQL conectado — ${rows[0].now}`);
    } catch (err) {
        console.error('❌ No se pudo conectar a PostgreSQL:', err.message);
        process.exit(1);
    }

    app.listen(PORT, () => {
        console.log(`🚀 Servidor Unlockd corriendo en http://localhost:${PORT}`);
        console.log(`   Entorno: ${process.env.NODE_ENV}`);
    });
}

start();
