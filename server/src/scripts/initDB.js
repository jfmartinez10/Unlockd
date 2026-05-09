import { readFileSync } from 'fs';
import { join } from 'path';
import { pool } from '../config/db.js';

const schemaPath = join(import.meta.dirname, 'schema.sql');

async function initDB() {
    const sql    = readFileSync(schemaPath, 'utf8');
    const client = await pool.connect();
    try {
        console.log('Conectando a la base de datos...');
        await client.query(sql);
        console.log('Base de datos inicializada correctamente.');
    } catch (err) {
        console.error('Error al inicializar la base de datos:', err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

initDB();
