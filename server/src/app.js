import express      from 'express';
import helmet       from 'helmet';
import corsMiddle   from './middleware/cors.js';
import errorHandler from './middleware/errorHandler.js';
import productRoutes from './routes/products.js';
import authRoutes    from './routes/auth.js';
import orderRoutes   from './routes/orders.js';
import cartRoutes    from './routes/cart.js';
import favRoutes     from './routes/favorites.js';

const app = express();

app.use(helmet());
app.use(corsMiddle);
app.use(express.json({ limit: '10kb' }));

app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/products',  productRoutes);
app.use('/api/auth',      authRoutes);
app.use('/api/orders',    orderRoutes);
app.use('/api/cart',      cartRoutes);
app.use('/api/favorites', favRoutes);

app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

app.use(errorHandler);

export default app;
