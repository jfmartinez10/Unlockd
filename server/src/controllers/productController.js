'use strict';

const { query } = require('../config/db');
const { ok, fail } = require('../utils/response');

/**
 * GET /api/products
 * Devuelve todos los productos activos.
 * Query params: ?category=camisetas&featured=true
 */
async function getAllProducts(req, res, next) {
    try {
        const { category, featured } = req.query;
        const conditions = ['activo = TRUE'];
        const values     = [];
        let   idx        = 1;

        if (category) {
            conditions.push(`categoria = $${idx++}`);
            values.push(category);
        }
        if (featured === 'true') {
            conditions.push(`destacado = $${idx++}`);
            values.push(true);
        }

        const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
        const sql   = `
            SELECT
                id, nombre, precio_numerico, precio_str,
                moneda, color, imagenes, tallas, stock,
                detalles, descripcion, categoria, tags, destacado
            FROM productos
            ${where}
            ORDER BY creado_en DESC
        `;

        const { rows } = await query(sql, values);

        /* Transformar al formato que espera el frontend */
        const products = rows.map(dbToFrontend);
        res.json(ok(products, `${products.length} productos`));
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/products/:id
 * Devuelve un producto por su slug/id.
 */
async function getProductById(req, res, next) {
    try {
        const { id } = req.params;
        const { rows } = await query(
            `SELECT
                id, nombre, precio_numerico, precio_str,
                moneda, color, imagenes, tallas, stock,
                detalles, descripcion, categoria, tags, destacado
             FROM productos
             WHERE id = $1 AND activo = TRUE`,
            [id]
        );

        if (!rows.length) {
            return res.status(404).json(fail('Producto no encontrado'));
        }

        res.json(ok(dbToFrontend(rows[0])));
    } catch (err) {
        next(err);
    }
}

/* ── Mapeador BD → Frontend ─────────────────────────────── */
function dbToFrontend(row) {
    return {
        id:           row.id,
        name:         row.nombre,
        price:        row.precio_str,
        priceNumeric: parseFloat(row.precio_numerico),
        currency:     row.moneda,
        color:        row.color,
        images:       row.imagenes,
        sizes:        row.tallas,
        stock:        row.stock,
        details: {
            composition: row.detalles?.composicion || '',
            fit:         row.detalles?.corte       || '',
            care:        row.detalles?.cuidado      || '',
            origin:      row.detalles?.origen       || '',
        },
        description: row.descripcion,
        category:    row.categoria,
        tags:        row.tags,
        featured:    row.destacado,
    };
}

module.exports = { getAllProducts, getProductById };
