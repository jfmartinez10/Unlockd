import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
    getCart,
    upsertItem,
    updateItem,
    deleteItem,
    clearCart,
} from '../controllers/cartController.js';

const router = Router();

router.use(requireAuth);

router.get('/',      getCart);
router.post('/',     upsertItem);
router.patch('/:id', updateItem);
router.delete('/',   clearCart);
router.delete('/:id', deleteItem);

export default router;
