import { validateEnv } from './src/config/env.js';
import app from './src/app.js';
import { pool } from './src/config/db.js';

validateEnv();

const PORT = process.env.PORT || 3000;

async function start() {
    try {
        const client = await pool.connect();
        const { rows } = await client.query('SELECT NOW() AS now');
        client.release();
        console.log('PostgreSQL conectado —', rows[0].now);
    } catch (err) {
        console.error('No se pudo conectar a PostgreSQL:', err.message);
        process.exit(1);
    }

    app.listen(PORT, () => {
        console.log('Servidor corriendo en http://localhost:' + PORT);
    });
}

start();
