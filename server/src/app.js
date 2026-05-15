import express      from 'express';
import helmet       from 'helmet';
import cookieParser from 'cookie-parser';
import { join }     from 'path';
import corsMiddle   from './middleware/cors.js';
import errorHandler from './middleware/errorHandler.js';
import productRoutes  from './routes/products.js';
import authRoutes     from './routes/auth.js';
import contactRoutes  from './routes/contact.js';
import orderRoutes    from './routes/orders.js';
import cartRoutes       from './routes/cart.js';
import favRoutes        from './routes/favorites.js';
import newsletterRoutes from './routes/newsletter.js';
import addressRoutes    from './routes/addresses.js';
import adminRoutes      from './routes/admin.js';
import couponRoutes     from './routes/coupons.js';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(corsMiddle);
app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));

/* Servir imágenes subidas por el admin */
app.use('/uploads', express.static(join(import.meta.dirname, '../../uploads')));

app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/products',  productRoutes);
app.use('/api/auth',      authRoutes);
app.use('/api/contact',   contactRoutes);
app.use('/api/orders',    orderRoutes);
app.use('/api/cart',      cartRoutes);
app.use('/api/favorites',  favRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/addresses',  addressRoutes);
app.use('/api/admin',      adminRoutes);
app.use('/api/coupons',   couponRoutes);

app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

app.use(errorHandler);

export default app;
