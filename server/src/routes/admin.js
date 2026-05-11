import { Router }       from 'express';
import multer           from 'multer';
import { join }         from 'path';
import { mkdirSync }    from 'fs';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import {
    listarTodos, obtenerProducto, crearProducto, actualizarProducto,
    eliminarProducto, toggleActivo, toggleDestacado, subirImagen,
} from '../controllers/adminController.js';
import { listarTodosPedidos, actualizarEstadoPedido } from '../controllers/ordersController.js';

/* Directorio de uploads: server/uploads/ */
const UPLOAD_DIR = join(import.meta.dirname, '../../../uploads');
mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename:    (_req,  file, cb) => {
        const ext  = file.originalname.split('.').pop().toLowerCase();
        const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        cb(null, name);
    },
});

const upload = multer({
    storage,
    limits:     { fileSize: 5 * 1024 * 1024 }, /* 5 MB */
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Solo se permiten imágenes'));
    },
});

const router = Router();

/* Todas las rutas admin requieren autenticación + rol admin */
router.use(requireAuth, requireAdmin);

router.get('/products',                         listarTodos);
router.get('/products/:id',                     obtenerProducto);
router.post('/products',                        crearProducto);
router.put('/products/:id',                     actualizarProducto);
router.delete('/products/:id',                  eliminarProducto);
router.patch('/products/:id/toggle-activo',     toggleActivo);
router.patch('/products/:id/toggle-destacado',  toggleDestacado);
router.post('/upload', upload.single('imagen'), subirImagen);

/* ── Pedidos ─────────────────────────────────────────────── */
router.get('/orders',                        listarTodosPedidos);
router.patch('/orders/:id/estado',           actualizarEstadoPedido);

export default router;
