'use strict';

const jwt  = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

/**
 * Genera un JWT de acceso (15 min por defecto).
 * Payload: { sub: userId, email, rol }
 */
function generateAccessToken(user) {
    return jwt.sign(
        { sub: user.id, email: user.email, rol: user.rol },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
    );
}

/**
 * Genera un token de refresco opaco (UUID v4).
 * Se almacena en BD — no es un JWT.
 */
function generateRefreshToken() {
    return uuidv4();
}

/**
 * Verifica un access token y devuelve el payload o lanza error.
 */
function verifyAccessToken(token) {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

module.exports = { generateAccessToken, generateRefreshToken, verifyAccessToken };
