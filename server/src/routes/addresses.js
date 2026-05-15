import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
    listarDirecciones,
    crearDireccion,
    actualizarDireccion,
    eliminarDireccion,
    marcarPredeterminada,
} from '../controllers/addressController.js';

const router = Router();

router.use(requireAuth);

router.get('/',                      listarDirecciones);
router.post('/',                     crearDireccion);
router.patch('/:id',                 actualizarDireccion);
router.delete('/:id',                eliminarDireccion);
router.patch('/:id/predeterminada',  marcarPredeterminada);

export default router;
