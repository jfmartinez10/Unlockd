import { Router } from 'express';

const router = Router();

/* TODO: implementar en la siguiente fase */
router.all('*', (_req, res) => {
    res.status(501).json({ success: false, message: 'Próximamente' });
});

export default router;
