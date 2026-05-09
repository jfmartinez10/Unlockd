import { Router } from 'express';
import { suscribirse } from '../controllers/newsletterController.js';

const router = Router();

router.post('/', suscribirse);

export default router;
