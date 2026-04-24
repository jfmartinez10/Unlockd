'use strict';

const nodemailer = require('nodemailer');

let _transporter = null;

function getTransporter() {
    if (!_transporter) {
        _transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.MAIL_PORT || '587', 10),
            secure: false,          /* STARTTLS */
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        });
    }
    return _transporter;
}

/**
 * Envía un email de verificación de cuenta.
 */
async function sendVerificationEmail(to, token) {
    const url = `${process.env.CLIENT_URL}/src/pages/auth/verificar.html?token=${token}`;
    await getTransporter().sendMail({
        from: process.env.MAIL_FROM || '"Unlockd" <no-reply@unlockd.com>',
        to,
        subject: 'Confirma tu cuenta en Unlockd',
        html: `
            <div style="font-family:sans-serif;max-width:480px;margin:auto">
                <h2 style="letter-spacing:4px;text-transform:uppercase">UNLOCKD</h2>
                <p>Haz clic en el siguiente botón para verificar tu cuenta:</p>
                <a href="${url}"
                   style="display:inline-block;padding:12px 28px;background:#000;color:#fff;
                          text-decoration:none;text-transform:uppercase;letter-spacing:2px;font-size:13px">
                    Verificar cuenta
                </a>
                <p style="color:#888;font-size:12px;margin-top:24px">
                    El enlace caduca en 24 horas. Si no creaste una cuenta, ignora este email.
                </p>
            </div>
        `,
    });
}

/**
 * Envía un email de confirmación de pedido.
 */
async function sendOrderConfirmationEmail(to, order) {
    await getTransporter().sendMail({
        from: process.env.MAIL_FROM || '"Unlockd" <no-reply@unlockd.com>',
        to,
        subject: `Pedido #${order.id.slice(0, 8).toUpperCase()} confirmado — Unlockd`,
        html: `
            <div style="font-family:sans-serif;max-width:480px;margin:auto">
                <h2 style="letter-spacing:4px;text-transform:uppercase">UNLOCKD</h2>
                <p>Tu pedido ha sido confirmado. Gracias por tu compra.</p>
                <p><strong>Nº de pedido:</strong> ${order.id.slice(0, 8).toUpperCase()}</p>
                <p><strong>Total:</strong> ${order.total}€</p>
            </div>
        `,
    });
}

module.exports = { sendVerificationEmail, sendOrderConfirmationEmail };
