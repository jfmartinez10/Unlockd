import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
    listarDirecciones,
    crearDireccion,
    eliminarDireccion,
    marcarPredeterminada,
} from '../controllers/addressController.js';

const router = Router();

router.use(requireAuth);

router.get('/',                      listarDirecciones);
router.post('/',                     crearDireccion);
router.delete('/:id',                eliminarDireccion);
router.patch('/:id/predeterminada',  marcarPredeterminada);

export default router;
