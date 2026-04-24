'use strict';

const express     = require('express');
const helmet      = require('helmet');
const corsMiddle  = require('./middleware/cors');
const errorHandler = require('./middleware/errorHandler');

/* Rutas */
const productRoutes = require('./routes/products');
const authRoutes    = require('./routes/auth');
const orderRoutes   = require('./routes/orders');
const cartRoutes    = require('./routes/cart');
const favRoutes     = require('./routes/favorites');

const app = express();

/* ── Seguridad ───────────────────────────────────────────── */
app.use(helmet());
app.use(corsMiddle);

/* ── Body parsers ────────────────────────────────────────── */
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

/* ── Health check ────────────────────────────────────────── */
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/* ── Rutas de la API ─────────────────────────────────────── */
app.use('/api/products',  productRoutes);
app.use('/api/auth',      authRoutes);
app.use('/api/orders',    orderRoutes);
app.use('/api/cart',      cartRoutes);
app.use('/api/favorites', favRoutes);

/* ── 404 ─────────────────────────────────────────────────── */
app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

/* ── Error handler global ────────────────────────────────── */
app.use(errorHandler);

module.exports = app;
