import { z } from 'zod';
import { pool } from '../config/db.js';
import { ok, fail } from '../utils/response.js';
import { sendOrderConfirmationEmail } from '../utils/mailer.js';

const ENVIO_GRATIS_MIN = 50;
const ENVIO_COSTE      = 4.99;

/* ── Schemas ─────────────────────────────────────────────── */
const direccionSchema = z.object({
    calle:     z.string().min(3),
    ciudad:    z.string().min(2),
    cp:        z.string().min(4),
    pais:      z.string().min(2),
    provincia: z.string().optional().default(''),
    telefono:  z.string().optional().default(''),
});

const itemSchema = z.object({
    productoId: z.string().min(1),
    talla:      z.string().min(1),
    cantidad:   z.number({ coerce: true }).int().min(1).max(20),
});

const crearPedidoSchema = z.object({
    nombre:    z.string().min(1),
    apellidos: z.string().min(1),
    email:     z.string().email(),
    direccion: direccionSchema,
    items:     z.array(itemSchema).min(1).max(50),
    nota:      z.string().max(500).nullish(),
});

/* ── POST /api/orders ────────────────────────────────────── */
export async function crearPedido(req, res) {
    const parsed = crearPedidoSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json(fail(parsed.error.errors[0].message));
    }

    const { nombre, apellidos, email, direccion, items, nota } = parsed.data;

    /* Verificar productos y obtener precios reales desde BD (nunca confiar en el cliente) */
    const productoIds = [...new Set(items.map(i => i.productoId))];
    const { rows: productos } = await pool.query(
        `SELECT id, nombre, precio_numerico
         FROM productos
         WHERE id = ANY($1) AND activo = TRUE`,
        [productoIds]
    );

    if (productos.length !== productoIds.length) {
        return res.status(400).json(fail('Uno o más productos no están disponibles'));
    }

    const precioMap = Object.fromEntries(
        productos.map(p => [p.id, { nombre: p.nombre, precio: Number(p.precio_numerico) }])
    );

    /* Calcular totales con precios de BD */
    const subtotal = items.reduce((sum, item) =>
        sum + precioMap[item.productoId].precio * item.cantidad, 0);
    const envio  = subtotal >= ENVIO_GRATIS_MIN ? 0 : ENVIO_COSTE;
    const total  = Number((subtotal + envio).toFixed(2));

    /* Transacción: insertar pedido + líneas + limpiar carrito */
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { rows: [pedido] } = await client.query(
            `INSERT INTO pedidos
                (usuario_id, email, nombre, apellidos, direccion, total, envio, nota)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
             RETURNING *`,
            [req.user?.id ?? null, email, nombre, apellidos,
             JSON.stringify(direccion), total, envio, nota ?? null]
        );

        await Promise.all(items.map(item =>
            client.query(
                `INSERT INTO pedido_items
                    (pedido_id, producto_id, nombre_producto, talla, cantidad, precio_unitario)
                 VALUES ($1,$2,$3,$4,$5,$6)`,
                [pedido.id, item.productoId,
                 precioMap[item.productoId].nombre,
                 item.talla, item.cantidad,
                 precioMap[item.productoId].precio]
            )
        ));

        /* Vaciar carrito BD si hay usuario autenticado */
        if (req.user?.id) {
            await client.query(
                'DELETE FROM carrito_items WHERE usuario_id = $1',
                [req.user.id]
            );
        }

        await client.query('COMMIT');

        /* Recuperar líneas para la respuesta */
        const { rows: pedidoItems } = await pool.query(
            'SELECT * FROM pedido_items WHERE pedido_id = $1 ORDER BY id',
            [pedido.id]
        );

        /* Email de confirmación — fire-and-forget */
        sendOrderConfirmationEmail(email, { ...pedido, items: pedidoItems })
            .catch(err => console.error('[mail] confirmación pedido:', err.message));

        return res.status(201).json(ok({ pedido, items: pedidoItems }));

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[orders] crearPedido:', err.message);
        return res.status(500).json(fail('Error al procesar el pedido'));
    } finally {
        client.release();
    }
}

/* ── GET /api/orders/mine ────────────────────────────────── */
export async function listarMisPedidos(req, res) {
    const { rows } = await pool.query(
        `SELECT p.*,
                COALESCE(json_agg(pi ORDER BY pi.id) FILTER (WHERE pi.id IS NOT NULL), '[]') AS items
         FROM pedidos p
         LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
         WHERE p.usuario_id = $1
         GROUP BY p.id
         ORDER BY p.creado_en DESC`,
        [req.user.id]
    );
    return res.json(ok(rows));
}

/* ── GET /api/orders/mine/:id ────────────────────────────── */
export async function obtenerMiPedido(req, res) {
    const { rows } = await pool.query(
        `SELECT p.*,
                COALESCE(json_agg(pi ORDER BY pi.id) FILTER (WHERE pi.id IS NOT NULL), '[]') AS items
         FROM pedidos p
         LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
         WHERE p.id = $1 AND p.usuario_id = $2
         GROUP BY p.id`,
        [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json(fail('Pedido no encontrado'));
    return res.json(ok(rows[0]));
}

/* ── GET /api/admin/orders ───────────────────────────────── */
export async function listarTodosPedidos(_req, res) {
    const { rows } = await pool.query(
        `SELECT p.*,
                u.nombre || ' ' || u.apellidos AS usuario_nombre,
                u.email AS usuario_email,
                COALESCE(json_agg(pi ORDER BY pi.id) FILTER (WHERE pi.id IS NOT NULL), '[]') AS items
         FROM pedidos p
         LEFT JOIN usuarios u ON u.id = p.usuario_id
         LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
         GROUP BY p.id, u.nombre, u.apellidos, u.email
         ORDER BY p.creado_en DESC`
    );
    return res.json(ok(rows));
}

/* ── PATCH /api/admin/orders/:id/estado ─────────────────── */
const ESTADOS_VALIDOS = ['pendiente', 'confirmado', 'enviado', 'entregado', 'cancelado'];

export async function actualizarEstadoPedido(req, res) {
    const { estado } = req.body;
    if (!ESTADOS_VALIDOS.includes(estado)) {
        return res.status(400).json(fail('Estado inválido'));
    }
    const { rows } = await pool.query(
        `UPDATE pedidos SET estado = $1 WHERE id = $2 RETURNING id, estado`,
        [estado, req.params.id]
    );
    if (!rows[0]) return res.status(404).json(fail('Pedido no encontrado'));
    return res.json(ok(rows[0]));
}
