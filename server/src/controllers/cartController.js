import { query } from '../config/db.js';
import { ok, fail } from '../utils/response.js';
import { z } from 'zod';

const itemSchema = z.object({
    producto_id: z.string().min(1),
    talla:       z.string().min(1),
    cantidad:    z.number().int().min(1).max(99),
});

/* GET /api/cart — cargar carrito del usuario con datos del producto */
export async function getCart(req, res, next) {
    try {
        const result = await query(
            `SELECT
                ci.id,
                ci.producto_id,
                ci.talla,
                ci.cantidad,
                p.nombre,
                p.precio_numerico,
                p.precio_str,
                p.imagenes
             FROM carrito_items ci
             JOIN productos p ON p.id = ci.producto_id
             WHERE ci.usuario_id = $1
             ORDER BY ci.creado_en ASC`,
            [req.user.id]
        );

        const items = result.rows.map(row => ({
            id:           row.id,
            producto_id:  row.producto_id,
            talla:        row.talla,
            cantidad:     row.cantidad,
            nombre:       row.nombre,
            priceNumeric: parseFloat(row.precio_numerico),
            precio:       row.precio_str,
            imagen:       (row.imagenes ?? [])[0] ?? null,
        }));

        res.json(ok(items));
    } catch (err) {
        next(err);
    }
}

/* POST /api/cart — añadir o actualizar item (upsert) */
export async function upsertItem(req, res, next) {
    try {
        const parsed = itemSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(422).json(fail('Datos del item inválidos'));
        }

        const { producto_id, talla, cantidad } = parsed.data;

        /* Verificar que el producto existe */
        const prod = await query(
            'SELECT id FROM productos WHERE id = $1 AND activo = TRUE',
            [producto_id]
        );
        if (prod.rows.length === 0) {
            return res.status(404).json(fail('Producto no encontrado'));
        }

        const result = await query(
            `INSERT INTO carrito_items (usuario_id, producto_id, talla, cantidad)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (usuario_id, producto_id, talla)
             DO UPDATE SET cantidad = carrito_items.cantidad + EXCLUDED.cantidad
             RETURNING id, producto_id, talla, cantidad`,
            [req.user.id, producto_id, talla, cantidad]
        );

        res.status(201).json(ok(result.rows[0], 'Item añadido al carrito'));
    } catch (err) {
        next(err);
    }
}

/* PATCH /api/cart/:id — actualizar cantidad de un item concreto */
export async function updateItem(req, res, next) {
    try {
        const cantidad = parseInt(req.body.cantidad, 10);
        if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 99) {
            return res.status(422).json(fail('Cantidad inválida'));
        }

        const result = await query(
            `UPDATE carrito_items
             SET cantidad = $1
             WHERE id = $2 AND usuario_id = $3
             RETURNING id, cantidad`,
            [cantidad, req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json(fail('Item no encontrado'));
        }

        res.json(ok(result.rows[0]));
    } catch (err) {
        next(err);
    }
}

/* DELETE /api/cart/:id — eliminar item concreto */
export async function deleteItem(req, res, next) {
    try {
        const result = await query(
            'DELETE FROM carrito_items WHERE id = $1 AND usuario_id = $2 RETURNING id',
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json(fail('Item no encontrado'));
        }

        res.json(ok(null, 'Item eliminado'));
    } catch (err) {
        next(err);
    }
}

/* DELETE /api/cart — vaciar carrito completo */
export async function clearCart(req, res, next) {
    try {
        await query(
            'DELETE FROM carrito_items WHERE usuario_id = $1',
            [req.user.id]
        );
        res.json(ok(null, 'Carrito vaciado'));
    } catch (err) {
        next(err);
    }
}
