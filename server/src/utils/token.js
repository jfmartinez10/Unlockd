'use strict';

const jwt              = require('jsonwebtoken');
const { v4: uuidv4 }  = require('uuid');

function generateAccessToken(user) {
    return jwt.sign(
        { sub: user.id, email: user.email, rol: user.rol },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
    );
}

/* Token de refresco opaco — se guarda en BD, no es un JWT */
function generateRefreshToken() {
    return uuidv4();
}

function verifyAccessToken(token) {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

module.exports = { generateAccessToken, generateRefreshToken, verifyAccessToken };
