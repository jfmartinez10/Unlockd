import { query } from '../config/db.js';
import { ok, fail } from '../utils/response.js';
import { z } from 'zod';

const productoSchema = z.object({
    id:              z.string().min(1).regex(/^[a-z0-9-]+$/, 'El ID solo puede contener minúsculas, números y guiones'),
    nombre:          z.string().min(1, 'El nombre es obligatorio'),
    precio_numerico: z.number({ coerce: true }).positive('El precio debe ser positivo'),
    color:           z.string().optional().nullable(),
    imagenes:        z.array(z.string()).default([]),
    tallas:          z.array(z.string()).default([]),
    stock:           z.record(z.string(), z.coerce.number().int().min(0)).default({}),
    detalles:        z.object({
        composicion: z.string().default(''),
        corte:       z.string().default(''),
        cuidado:     z.string().default(''),
        origen:      z.string().default(''),
    }).default({}),
    descripcion: z.string().optional().nullable(),
    categoria:   z.string().min(1, 'La categoría es obligatoria'),
    tags:        z.array(z.string()).default([]),
    destacado:   z.boolean().default(false),
    activo:      z.boolean().default(true),
});

const productoUpdateSchema = productoSchema.omit({ id: true });

/* GET /api/admin/products */
export async function listarTodos(_req, res, next) {
    try {
        const { rows } = await query(
            `SELECT id, nombre, precio_numerico, precio_str, color,
                    imagenes, tallas, stock, detalles, descripcion,
                    categoria, tags, destacado, activo, creado_en
             FROM productos ORDER BY creado_en DESC`
        );
        res.json(ok(rows));
    } catch (err) {
        next(err);
    }
}

/* GET /api/admin/products/:id */
export async function obtenerProducto(req, res, next) {
    try {
        const { rows } = await query(
            `SELECT id, nombre, precio_numerico, precio_str, color,
                    imagenes, tallas, stock, detalles, descripcion,
                    categoria, tags, destacado, activo
             FROM productos WHERE id = $1`,
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json(fail('Producto no encontrado'));
        res.json(ok(rows[0]));
    } catch (err) {
        next(err);
    }
}

/* POST /api/admin/products */
export async function crearProducto(req, res, next) {
    try {
        const parsed = productoSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(422).json(fail(parsed.error.issues[0].message));
        }

        const d          = parsed.data;
        const precio_str = formatPrecio(d.precio_numerico);

        const { rows } = await query(
            `INSERT INTO productos
                (id, nombre, precio_numerico, precio_str, color,
                 imagenes, tallas, stock, detalles, descripcion,
                 categoria, tags, destacado, activo)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
             RETURNING id, nombre, precio_str, activo, destacado, imagenes`,
            [
                d.id, d.nombre, d.precio_numerico, precio_str, d.color ?? null,
                JSON.stringify(d.imagenes), JSON.stringify(d.tallas),
                JSON.stringify(d.stock),    JSON.stringify(d.detalles),
                d.descripcion ?? null,      d.categoria,
                JSON.stringify(d.tags),     d.destacado, d.activo,
            ]
        );

        res.status(201).json(ok(rows[0], 'Producto creado'));
    } catch (err) {
        if (err.code === '23505') return res.status(409).json(fail('Ya existe un producto con ese ID'));
        next(err);
    }
}

/* PUT /api/admin/products/:id */
export async function actualizarProducto(req, res, next) {
    try {
        const parsed = productoUpdateSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(422).json(fail(parsed.error.issues[0].message));
        }

        const d          = parsed.data;
        const precio_str = formatPrecio(d.precio_numerico);

        const { rows } = await query(
            `UPDATE productos SET
                nombre = $1, precio_numerico = $2, precio_str = $3, color = $4,
                imagenes = $5, tallas = $6, stock = $7, detalles = $8,
                descripcion = $9, categoria = $10, tags = $11,
                destacado = $12, activo = $13
             WHERE id = $14
             RETURNING id, nombre, precio_str, activo, destacado, imagenes`,
            [
                d.nombre, d.precio_numerico, precio_str, d.color ?? null,
                JSON.stringify(d.imagenes), JSON.stringify(d.tallas),
                JSON.stringify(d.stock),    JSON.stringify(d.detalles),
                d.descripcion ?? null,      d.categoria,
                JSON.stringify(d.tags),     d.destacado, d.activo,
                req.params.id,
            ]
        );

        if (!rows.length) return res.status(404).json(fail('Producto no encontrado'));
        res.json(ok(rows[0], 'Producto actualizado'));
    } catch (err) {
        next(err);
    }
}

/* DELETE /api/admin/products/:id */
export async function eliminarProducto(req, res, next) {
    try {
        const { rows } = await query(
            'DELETE FROM productos WHERE id = $1 RETURNING id',
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json(fail('Producto no encontrado'));
        res.json(ok(null, 'Producto eliminado'));
    } catch (err) {
        next(err);
    }
}

/* PATCH /api/admin/products/:id/toggle-activo */
export async function toggleActivo(req, res, next) {
    try {
        const { rows } = await query(
            'UPDATE productos SET activo = NOT activo WHERE id = $1 RETURNING id, activo',
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json(fail('Producto no encontrado'));
        res.json(ok(rows[0]));
    } catch (err) {
        next(err);
    }
}

/* PATCH /api/admin/products/:id/toggle-destacado */
export async function toggleDestacado(req, res, next) {
    try {
        const { rows } = await query(
            'UPDATE productos SET destacado = NOT destacado WHERE id = $1 RETURNING id, destacado',
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json(fail('Producto no encontrado'));
        res.json(ok(rows[0]));
    } catch (err) {
        next(err);
    }
}

/* POST /api/admin/upload — gestiona la imagen subida por multer */
export function subirImagen(req, res) {
    if (!req.file) return res.status(400).json(fail('No se recibió ninguna imagen'));
    const base = process.env.SERVER_URL ?? 'http://localhost:3000';
    res.json(ok({ url: `${base}/uploads/${req.file.filename}` }));
}

/* Utilidad: formatea precio numérico a string "29,99€" */
function formatPrecio(n) {
    return `${Number(n).toFixed(2).replace('.', ',')}€`;
}
