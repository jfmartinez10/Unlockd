'use strict';

const jwt        = require('jsonwebtoken');
const { fail }   = require('../utils/response');

function requireAuth(req, res, next) {
    const header = req.headers['authorization'] || '';
    const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) return res.status(401).json(fail('Token requerido'));

    try {
        const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        req.user = { id: payload.sub, email: payload.email, rol: payload.rol };
        next();
    } catch (err) {
        const msg = err.name === 'TokenExpiredError' ? 'Token expirado' : 'Token inválido';
        return res.status(401).json(fail(msg));
    }
}

function requireAdmin(req, res, next) {
    if (req.user?.rol !== 'admin') return res.status(403).json(fail('Acceso denegado'));
    next();
}

module.exports = { requireAuth, requireAdmin };
