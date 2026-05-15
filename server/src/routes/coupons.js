import { Router } from 'express';
import { validarCupon } from '../controllers/couponsController.js';

const router = Router();

router.post('/validate', validarCupon);

export default router;
