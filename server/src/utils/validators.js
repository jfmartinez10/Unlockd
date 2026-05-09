import { z } from 'zod';

const registerSchema = z.object({
    nombre:    z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(60),
    apellidos: z.string().min(2, 'Los apellidos deben tener al menos 2 caracteres').max(100),
    email:     z.string().email('Email inválido').max(255),
    password:  z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(128),
});

const loginSchema = z.object({
    email:    z.string().email('Email inválido'),
    password: z.string().min(1, 'La contraseña es obligatoria'),
});

const forgotPasswordSchema = z.object({
    email: z.string().email('Email inválido'),
});

const resetPasswordSchema = z.object({
    token:    z.string().min(1, 'Token requerido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(128),
});

/* Valida con un schema Zod y devuelve { data } o lanza un objeto de errores */
function validate(schema, body) {
    const result = schema.safeParse(body);
    if (!result.success) {
        const errors = result.error.issues.map(i => ({ field: i.path[0], message: i.message }));
        const err    = new Error('Validación fallida');
        err.status   = 422;
        err.errors   = errors;
        throw err;
    }
    return result.data;
}

export { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, validate };
