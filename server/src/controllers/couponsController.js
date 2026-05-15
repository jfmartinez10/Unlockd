import { z }    from 'zod';
import { pool } from '../config/db.js';
import { ok, fail } from '../utils/response.js';

const validateSchema = z.object({
    codigo: z.string().min(1).max(80),
});

/* POST /api/coupons/validate
   Body: { codigo: "UNLCKD-XXXXXXXX" }
   Response: { porcentaje: 10, codigo: "UNLCKD-XXXXXXXX" }
*/
export async function validarCupon(req, res) {
    const parsed = validateSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json(fail('Código inválido'));
    }

    const { codigo } = parsed.data;

    const { rows } = await pool.query(
        `SELECT id, codigo_descuento, usado, codigo_expira_en
         FROM suscriptores
         WHERE UPPER(codigo_descuento) = UPPER($1)
           AND activo = TRUE`,
        [codigo]
    );

    if (!rows[0]) {
        return res.status(404).json(fail('Código no encontrado'));
    }

    const sub = rows[0];

    if (sub.usado) {
        return res.status(400).json(fail('Este código ya ha sido utilizado'));
    }

    if (sub.codigo_expira_en && new Date(sub.codigo_expira_en) < new Date()) {
        return res.status(400).json(fail('Este código ha expirado'));
    }

    return res.json(ok({
        codigo:     sub.codigo_descuento,
        porcentaje: 10,
    }));
}
