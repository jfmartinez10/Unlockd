import { Router }  from 'express';
import jwt          from 'jsonwebtoken';
import { requireAuth } from '../middleware/auth.js';
import {
    crearPedido,
    listarMisPedidos,
    obtenerMiPedido,
} from '../controllers/ordersController.js';

const router = Router();

/* Middleware opcional: adjunta req.user si hay token válido, pero no bloquea sin él */
function optionalAuth(req, _res, next) {
    const header = req.headers['authorization'] || '';
    if (header.startsWith('Bearer ')) {
        try {
            const payload = jwt.verify(header.slice(7), process.env.JWT_ACCESS_SECRET);
            req.user = { id: payload.sub, email: payload.email, rol: payload.rol };
        } catch { /* token inválido — continuar como guest */ }
    }
    next();
}

/* POST /api/orders — guest checkout o usuario autenticado */
router.post('/', optionalAuth, crearPedido);

/* GET /api/orders/mine — requiere sesión */
router.get('/mine',     requireAuth, listarMisPedidos);
router.get('/mine/:id', requireAuth, obtenerMiPedido);

export default router;
