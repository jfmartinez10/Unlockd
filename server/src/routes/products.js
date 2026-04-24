import { Router } from 'express';
import { generalLimiter } from '../middleware/rateLimit.js';
import { getAllProducts, getProductById } from '../controllers/productController.js';

const router = Router();

router.use(generalLimiter);
router.get('/',    getAllProducts);
router.get('/:id', getProductById);

export default router;
