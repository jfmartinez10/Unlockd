import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { query }  from '../config/db.js';
import { ok, fail } from '../utils/response.js';
import { generateAccessToken, generateRefreshToken } from '../utils/token.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/mailer.js';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, validate } from '../utils/validators.js';

const COOKIE_OPTS = {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   7 * 24 * 60 * 60 * 1000,
};

/* POST /api/auth/register */
export async function register(req, res) {
    const { nombre, apellidos, email, password } = validate(registerSchema, req.body);

    const existe = await query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existe.rows.length > 0) {
        return res.status(409).json(fail('Ya existe una cuenta con ese email'));
    }

    const hash = await bcrypt.hash(password, 12);
    const { rows } = await query(
        `INSERT INTO usuarios (nombre, apellidos, email, password_hash, verificado)
         VALUES ($1, $2, $3, $4, TRUE) RETURNING id`,
        [nombre.trim(), apellidos.trim(), email.toLowerCase(), hash]
    );

    const usuarioId = rows[0].id;
    const codigo    = Math.floor(100000 + Math.random() * 900000).toString();

    await query(
        `INSERT INTO tokens_verificacion (usuario_id, token, tipo, expira_en)
         VALUES ($1, $2, 'verificacion', NOW() + INTERVAL '24 hours')`,
        [usuarioId, codigo]
    );

    sendVerificationEmail(email, nombre.trim(), codigo).catch(err =>
        console.error('[auth] Error enviando email de verificación:', err.message)
    );

    return res.status(201).json(ok(null, 'Cuenta creada correctamente. Ya puedes iniciar sesión.'));
}

/* POST /api/auth/verificar */
export async function verifyEmail(req, res) {
    const { email, codigo } = req.body;
    if (!email || !codigo) return res.status(400).json(fail('Email y código requeridos'));

    const userRes = await query(
        'SELECT id FROM usuarios WHERE email = $1 AND verificado = FALSE',
        [email.toLowerCase()]
    );
    if (userRes.rows.length === 0) return res.status(400).json(fail('Código inválido'));

    const usuarioId = userRes.rows[0].id;

    const { rows } = await query(
        `SELECT id, expira_en, usado FROM tokens_verificacion
         WHERE token = $1 AND usuario_id = $2 AND tipo = 'verificacion'`,
        [codigo.trim(), usuarioId]
    );

    if (rows.length === 0)          return res.status(400).json(fail('Código inválido'));
    const row = rows[0];
    if (row.usado)                  return res.status(400).json(fail('El código ya fue usado'));
    if (new Date() > row.expira_en) return res.status(400).json(fail('El código ha caducado'));

    await query('UPDATE usuarios SET verificado = TRUE WHERE id = $1', [usuarioId]);
    await query('UPDATE tokens_verificacion SET usado = TRUE WHERE id = $1', [row.id]);

    return res.json(ok(null, 'Cuenta verificada correctamente'));
}

/* POST /api/auth/login */
export async function login(req, res) {
    const { email, password } = validate(loginSchema, req.body);

    const { rows } = await query(
        'SELECT id, nombre, apellidos, email, password_hash, rol, verificado FROM usuarios WHERE email = $1',
        [email.toLowerCase()]
    );

    if (rows.length === 0) {
        return res.status(401).json(fail('Credenciales incorrectas'));
    }

    const usuario = rows[0];
    const coincide = await bcrypt.compare(password, usuario.password_hash);
    if (!coincide) {
        return res.status(401).json(fail('Credenciales incorrectas'));
    }


    const accessToken  = generateAccessToken(usuario);
    const refreshToken = generateRefreshToken();

    await query(
        `INSERT INTO refresh_tokens (usuario_id, token, expira_en)
         VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
        [usuario.id, refreshToken]
    );

    res.cookie('refreshToken', refreshToken, COOKIE_OPTS);

    return res.json(ok({
        accessToken,
        user: {
            id:       usuario.id,
            nombre:   usuario.nombre,
            apellidos: usuario.apellidos,
            email:    usuario.email,
            rol:      usuario.rol,
        },
    }, 'Sesión iniciada'));
}

/* POST /api/auth/refresh */
export async function refresh(req, res) {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json(fail('No hay sesión activa'));

    const { rows } = await query(
        `SELECT rt.id, rt.usuario_id, rt.expira_en, rt.revocado,
                u.nombre, u.apellidos, u.email, u.rol
         FROM refresh_tokens rt
         JOIN usuarios u ON u.id = rt.usuario_id
         WHERE rt.token = $1`,
        [token]
    );

    if (rows.length === 0)          return res.status(401).json(fail('Token de refresco inválido'));
    const row = rows[0];
    if (row.revocado)               return res.status(401).json(fail('Sesión revocada'));
    if (new Date() > row.expira_en) return res.status(401).json(fail('Sesión expirada'));

    const accessToken = generateAccessToken({
        id:    row.usuario_id,
        email: row.email,
        rol:   row.rol,
    });

    return res.json(ok({ accessToken }, 'Token renovado'));
}

/* POST /api/auth/logout */
export async function logout(req, res) {
    const token = req.cookies?.refreshToken;

    if (token) {
        await query('UPDATE refresh_tokens SET revocado = TRUE WHERE token = $1', [token]);
    }

    res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'lax' });
    return res.json(ok(null, 'Sesión cerrada'));
}

/* POST /api/auth/forgot-password */
export async function forgotPassword(req, res) {
    const { email } = validate(forgotPasswordSchema, req.body);

    const { rows } = await query('SELECT id FROM usuarios WHERE email = $1', [email.toLowerCase()]);

    /* Siempre responder OK para no revelar si el email existe */
    if (rows.length > 0) {
        const usuarioId   = rows[0].id;
        const tokenReset  = uuidv4();

        await query(
            `INSERT INTO tokens_verificacion (usuario_id, token, tipo, expira_en)
             VALUES ($1, $2, 'reset', NOW() + INTERVAL '1 hour')`,
            [usuarioId, tokenReset]
        );

        sendPasswordResetEmail(email, tokenReset).catch(err =>
            console.error('[auth] Error enviando email de reset:', err.message)
        );
    }

    return res.json(ok(null, 'Si el email existe, recibirás un enlace en breve.'));
}

/* POST /api/auth/reset-password */
export async function resetPassword(req, res) {
    const { token, password } = validate(resetPasswordSchema, req.body);

    const { rows } = await query(
        `SELECT tv.id, tv.usuario_id, tv.expira_en, tv.usado
         FROM tokens_verificacion tv
         WHERE tv.token = $1 AND tv.tipo = 'reset'`,
        [token]
    );

    if (rows.length === 0)          return res.status(400).json(fail('Token inválido'));
    const row = rows[0];
    if (row.usado)                  return res.status(400).json(fail('El token ya fue usado'));
    if (new Date() > row.expira_en) return res.status(400).json(fail('El token ha caducado'));

    const hash = await bcrypt.hash(password, 12);
    await query('UPDATE usuarios SET password_hash = $1 WHERE id = $2', [hash, row.usuario_id]);
    await query('UPDATE tokens_verificacion SET usado = TRUE WHERE id = $1', [row.id]);
    await query('UPDATE refresh_tokens SET revocado = TRUE WHERE usuario_id = $1', [row.usuario_id]);

    return res.json(ok(null, 'Contraseña actualizada correctamente'));
}

/* PATCH /api/auth/me  — actualizar nombre y apellidos */
export async function updateProfile(req, res) {
    const schema = z.object({
        nombre:    z.string().min(2).max(80),
        apellidos: z.string().min(2).max(120),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json(fail(parsed.error.errors[0].message));
    }

    const { nombre, apellidos } = parsed.data;
    const { rows } = await query(
        'UPDATE usuarios SET nombre = $1, apellidos = $2 WHERE id = $3 RETURNING id, nombre, apellidos, email, rol',
        [nombre.trim(), apellidos.trim(), req.user.id]
    );

    if (rows.length === 0) return res.status(404).json(fail('Usuario no encontrado'));
    return res.json(ok(rows[0], 'Perfil actualizado correctamente'));
}

/* PATCH /api/auth/password  — cambiar contraseña */
export async function changePassword(req, res) {
    const schema = z.object({
        actual: z.string().min(1),
        nueva:  z.string().min(8).max(128),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json(fail(parsed.error.errors[0].message));
    }

    const { actual, nueva } = parsed.data;

    const { rows } = await query(
        'SELECT password_hash FROM usuarios WHERE id = $1',
        [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json(fail('Usuario no encontrado'));

    const coincide = await bcrypt.compare(actual, rows[0].password_hash);
    if (!coincide) return res.status(400).json(fail('La contraseña actual es incorrecta'));

    const hash = await bcrypt.hash(nueva, 12);
    await query('UPDATE usuarios SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);
    await query('UPDATE refresh_tokens SET revocado = TRUE WHERE usuario_id = $1', [req.user.id]);

    return res.json(ok(null, 'Contraseña actualizada. Vuelve a iniciar sesión.'));
}

/* GET /api/auth/me  — requiere requireAuth */
export async function me(req, res) {
    const { rows } = await query(
        'SELECT id, nombre, apellidos, email, rol, verificado, creado_en FROM usuarios WHERE id = $1',
        [req.user.id]
    );

    if (rows.length === 0) return res.status(404).json(fail('Usuario no encontrado'));

    return res.json(ok(rows[0]));
}
