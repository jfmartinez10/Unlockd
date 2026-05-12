import { randomBytes } from 'crypto';
import { query } from '../config/db.js';
import { sendNewsletterWelcomeEmail } from '../utils/mailer.js';
import { ok, fail } from '../utils/response.js';
import { z } from 'zod';

const suscribirSchema = z.object({
    email: z.string().email('Email inválido'),
});

function generarCodigo() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = randomBytes(8);
    const codigo = Array.from(bytes)
        .map(b => chars[b % chars.length])
        .join('');
    return `UNLCKD-${codigo}`;
}

export async function suscribirse(req, res, next) {
    try {
        const parsed = suscribirSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(422).json(fail('Email inválido'));
        }

        const { email } = parsed.data;

        const existe = await query(
            'SELECT id, usado, codigo_expira_en FROM suscriptores WHERE email = $1',
            [email]
        );

        if (existe.rows.length > 0) {
            /* 409 para que el cliente distinga entre éxito y duplicado */
            return res.status(409).json(fail('Este email ya está suscrito'));
        }

        const codigo = generarCodigo();

        await query(
            `INSERT INTO suscriptores (email, codigo_descuento, codigo_expira_en)
             VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
            [email, codigo]
        );

        try {
            await sendNewsletterWelcomeEmail(email, codigo);
            console.log('[newsletter] Email enviado a:', email);
        } catch (err) {
            console.error('[newsletter] ERROR enviando email:', err.message, err.code, err.response);
        }

        res.status(201).json(ok(null, 'Suscripción completada'));
    } catch (err) {
        next(err);
    }
}
