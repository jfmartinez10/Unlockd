import { Router } from 'express';
import { z } from 'zod';
import { generalLimiter } from '../middleware/rateLimit.js';
import { sendContactEmail } from '../utils/mailer.js';
import { ok, fail } from '../utils/response.js';

const router = Router();

const contactSchema = z.object({
    nombre:  z.string().min(3).max(100),
    email:   z.string().email(),
    asunto:  z.string().min(5).max(200),
    mensaje: z.string().min(10).max(2000),
});

router.post('/', generalLimiter, async (req, res) => {
    const result = contactSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(422).json(fail('Datos del formulario inválidos'));
    }

    await sendContactEmail(result.data);
    return res.json(ok(null, 'Mensaje enviado correctamente'));
});

export default router;
