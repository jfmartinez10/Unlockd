import { query } from '../config/db.js';
import { ok, fail } from '../utils/response.js';

/* GET /api/favorites — IDs de favoritos del usuario */
export async function listarFavoritos(req, res, next) {
    try {
        const result = await query(
            'SELECT producto_id FROM favoritos WHERE usuario_id = $1 ORDER BY creado_en DESC',
            [req.user.id]
        );
        res.json(ok(result.rows.map(r => r.producto_id)));
    } catch (err) {
        next(err);
    }
}

/* POST /api/favorites/:productoId — toggle (añade si no existe, elimina si existe) */
export async function toggleFavorito(req, res, next) {
    try {
        const { productoId } = req.params;

        const existing = await query(
            'SELECT id FROM favoritos WHERE usuario_id = $1 AND producto_id = $2',
            [req.user.id, productoId]
        );

        if (existing.rows.length > 0) {
            await query(
                'DELETE FROM favoritos WHERE usuario_id = $1 AND producto_id = $2',
                [req.user.id, productoId]
            );
            return res.json(ok({ activo: false }));
        }

        /* Verificar que el producto existe */
        const prod = await query(
            'SELECT id FROM productos WHERE id = $1 AND activo = TRUE',
            [productoId]
        );
        if (prod.rows.length === 0) {
            return res.status(404).json(fail('Producto no encontrado'));
        }

        await query(
            'INSERT INTO favoritos (usuario_id, producto_id) VALUES ($1, $2)',
            [req.user.id, productoId]
        );
        res.status(201).json(ok({ activo: true }));
    } catch (err) {
        next(err);
    }
}
