import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

export function generateAccessToken(user) {
    return jwt.sign(
        { sub: user.id, email: user.email, rol: user.rol },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
    );
}

/* Token de refresco opaco — se guarda en BD, no es un JWT */
export function generateRefreshToken() {
    return uuidv4();
}

export function verifyAccessToken(token) {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}
