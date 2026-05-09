import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { listarFavoritos, toggleFavorito } from '../controllers/favoritosController.js';

const router = Router();

router.use(requireAuth);

router.get('/',                listarFavoritos);
router.post('/:productoId',    toggleFavorito);

export default router;
