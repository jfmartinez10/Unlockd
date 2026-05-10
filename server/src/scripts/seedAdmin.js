/**
 * Crea la cuenta de administrador si no existe.
 * Ejecución: npm run seed-admin
 *
 * Credenciales por defecto:
 *   Email:      admin@unlockd.com
 *   Contraseña: Admin1234!
 *
 * Cámbialas en las constantes de abajo antes de ejecutar.
 */

import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';

const ADMIN_NOMBRE    = 'Admin';
const ADMIN_APELLIDOS = 'Unlockd';
const ADMIN_EMAIL     = 'admin@unlockd.com';
const ADMIN_PASSWORD  = 'Admin1234!';

async function seedAdmin() {
    const client = await pool.connect();
    try {
        /* Comprobar si ya existe */
        const existe = await client.query(
            'SELECT id, rol FROM usuarios WHERE email = $1',
            [ADMIN_EMAIL]
        );

        if (existe.rows.length > 0) {
            const u = existe.rows[0];
            if (u.rol === 'admin') {
                console.log(`✓ Ya existe una cuenta admin con email "${ADMIN_EMAIL}".`);
            } else {
                /* Existe pero no es admin → actualizar rol */
                await client.query(
                    'UPDATE usuarios SET rol = $1, verificado = TRUE WHERE id = $2',
                    ['admin', u.id]
                );
                console.log(`✓ Cuenta existente actualizada a rol admin.`);
            }
            return;
        }

        /* Crear cuenta nueva */
        const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
        await client.query(
            `INSERT INTO usuarios (nombre, apellidos, email, password_hash, rol, verificado)
             VALUES ($1, $2, $3, $4, 'admin', TRUE)`,
            [ADMIN_NOMBRE, ADMIN_APELLIDOS, ADMIN_EMAIL, hash]
        );

        console.log('');
        console.log('✅ Cuenta admin creada correctamente.');
        console.log('');
        console.log(`   Email:      ${ADMIN_EMAIL}`);
        console.log(`   Contraseña: ${ADMIN_PASSWORD}`);
        console.log('');
        console.log('   Para iniciar sesión como usuario normal,');
        console.log('   usa cualquier otra cuenta registrada.');
        console.log('');

    } catch (err) {
        console.error('❌ Error creando admin:', err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

seedAdmin();
