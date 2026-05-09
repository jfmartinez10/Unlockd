import { query } from '../config/db.js';
import { ok, fail } from '../utils/response.js';
import { z } from 'zod';

const direccionSchema = z.object({
    nombre:        z.string().min(1, 'Nombre requerido'),
    apellidos:     z.string().min(1, 'Apellidos requeridos'),
    pais:          z.string().min(1, 'País requerido'),
    ciudad:        z.string().min(1, 'Ciudad requerida'),
    provincia:     z.string().min(1, 'Provincia requerida'),
    direccion:     z.string().min(1, 'Dirección requerida'),
    cod_postal:    z.string().min(1, 'Código postal requerido'),
    direccion2:    z.string().optional().default(''),
    predeterminada: z.boolean().optional().default(false),
});

/* GET /api/addresses — listar direcciones del usuario */
export async function listarDirecciones(req, res, next) {
    try {
        const result = await query(
            `SELECT id, nombre, apellidos, pais, ciudad, provincia,
                    direccion, cod_postal, direccion2, predeterminada, creado_en
             FROM direcciones_envio
             WHERE usuario_id = $1
             ORDER BY predeterminada DESC, creado_en DESC`,
            [req.user.id]
        );
        res.json(ok(result.rows));
    } catch (err) {
        next(err);
    }
}

/* POST /api/addresses — crear dirección */
export async function crearDireccion(req, res, next) {
    try {
        const parsed = direccionSchema.safeParse(req.body);
        if (!parsed.success) {
            const errores = parsed.error.errors.map(e => e.message);
            return res.status(422).json(fail(errores[0]));
        }

        const d = parsed.data;

        /* Si es predeterminada, quitar predeterminada del resto */
        if (d.predeterminada) {
            await query(
                'UPDATE direcciones_envio SET predeterminada = FALSE WHERE usuario_id = $1',
                [req.user.id]
            );
        }

        const result = await query(
            `INSERT INTO direcciones_envio
                (usuario_id, nombre, apellidos, pais, ciudad, provincia,
                 direccion, cod_postal, direccion2, predeterminada)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
             RETURNING id, nombre, apellidos, pais, ciudad, provincia,
                       direccion, cod_postal, direccion2, predeterminada`,
            [req.user.id, d.nombre, d.apellidos, d.pais, d.ciudad,
             d.provincia, d.direccion, d.cod_postal, d.direccion2, d.predeterminada]
        );

        res.status(201).json(ok(result.rows[0], 'Dirección guardada'));
    } catch (err) {
        next(err);
    }
}

/* DELETE /api/addresses/:id — eliminar dirección */
export async function eliminarDireccion(req, res, next) {
    try {
        const result = await query(
            'DELETE FROM direcciones_envio WHERE id = $1 AND usuario_id = $2 RETURNING id',
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json(fail('Dirección no encontrada'));
        }

        res.json(ok(null, 'Dirección eliminada'));
    } catch (err) {
        next(err);
    }
}

/* PATCH /api/addresses/:id/predeterminada — marcar como predeterminada */
export async function marcarPredeterminada(req, res, next) {
    try {
        await query(
            'UPDATE direcciones_envio SET predeterminada = FALSE WHERE usuario_id = $1',
            [req.user.id]
        );

        const result = await query(
            `UPDATE direcciones_envio SET predeterminada = TRUE
             WHERE id = $1 AND usuario_id = $2
             RETURNING id`,
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json(fail('Dirección no encontrada'));
        }

        res.json(ok(null, 'Dirección predeterminada actualizada'));
    } catch (err) {
        next(err);
    }
}
