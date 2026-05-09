import nodemailer from 'nodemailer';

let _transporter = null;

function getTransporter() {
    if (!_transporter) {
        _transporter = nodemailer.createTransport({
            host:   process.env.MAIL_HOST || 'smtp.gmail.com',
            port:   parseInt(process.env.MAIL_PORT || '587', 10),
            secure: false,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        });
    }
    return _transporter;
}

/* Cabecera común para todos los correos */
function htmlHeader(subtitulo = '') {
    return `
    <div style="background:#0a0a0a;padding:40px 48px 28px">
        <div style="text-align:center;letter-spacing:10px;font-size:20px;font-weight:700;color:#fff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;text-transform:uppercase">
            UNLOCKD
        </div>
        ${subtitulo ? `<div style="text-align:center;margin-top:10px;letter-spacing:3px;font-size:10px;color:#888;text-transform:uppercase;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">${subtitulo}</div>` : ''}
    </div>
    <div style="height:2px;background:linear-gradient(90deg,#0a0a0a,#555,#0a0a0a)"></div>`;
}

/* Pie de página común */
function htmlFooter() {
    return `
    <div style="padding:28px 48px;background:#f7f7f7;border-top:1px solid #e8e8e8;text-align:center">
        <p style="margin:0;font-size:11px;color:#aaa;letter-spacing:1.5px;text-transform:uppercase;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
            © ${new Date().getFullYear()} Unlockd — All rights reserved
        </p>
    </div>`;
}

/* Envuelve todo el correo */
function htmlWrapper(content) {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#e8e8e8">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#e8e8e8;padding:40px 0">
            <tr><td align="center">
                <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;box-shadow:0 4px 24px rgba(0,0,0,0.10)">
                    <tr><td>${content}</td></tr>
                </table>
            </td></tr>
        </table>
    </body>
    </html>`;
}

/* Botón CTA negro */
function htmlButton(url, texto) {
    return `
    <div style="text-align:center;margin:32px 0">
        <a href="${url}"
           style="display:inline-block;background:#0a0a0a;color:#fff;text-decoration:none;
                  font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;
                  padding:16px 48px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
            ${texto}
        </a>
    </div>`;
}

/* Correo único — Bienvenida + Código de verificación (sin links externos) */
export async function sendVerificationEmail(to, nombre, codigo) {
    await getTransporter().sendMail({
        from:    process.env.MAIL_FROM,
        to,
        subject: 'Bienvenido a Unlockd',
        text: `Bienvenido a Unlockd, ${nombre}.\n\nTu código de verificación es: ${codigo}\n\nVe a la sección de verificación de Unlockd e introdúcelo. Caduca en 24 horas.\n\nUnlockd Studio`,
        html: htmlWrapper(`
            ${htmlHeader('New Member')}
            <div style="padding:48px 48px 32px;text-align:center">
                <p style="margin:0 0 6px;font-size:11px;letter-spacing:3px;color:#aaa;text-transform:uppercase;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
                    Bienvenido
                </p>
                <h1 style="margin:0 0 20px;font-size:26px;font-weight:300;color:#0a0a0a;letter-spacing:2px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;text-transform:uppercase">
                    ${nombre}
                </h1>
                <div style="width:40px;height:1px;background:#0a0a0a;margin:0 auto 24px"></div>
                <p style="margin:0;font-size:14px;color:#444;line-height:1.8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
                    Tu cuenta ha sido creada con éxito.<br>Eres parte de algo exclusivo.
                </p>
            </div>
            <div style="height:1px;background:#f0f0f0;margin:0 48px"></div>
            <div style="padding:32px 48px 40px;text-align:center">
                <p style="margin:0 0 20px;font-size:13px;color:#888;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
                    Tu código de verificación es:
                </p>
                <div style="display:inline-block;background:#0a0a0a;color:#fff;font-size:32px;font-weight:700;letter-spacing:10px;padding:18px 36px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
                    ${codigo}
                </div>
                <p style="margin:24px 0 0;font-size:13px;color:#555;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
                    Ve a la sección de verificación de Unlockd e introduce el código.
                </p>
                <p style="margin:8px 0 0;font-size:11px;color:#bbb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
                    Caduca en 24 horas. Si no creaste esta cuenta, ignora este correo.
                </p>
            </div>
            ${htmlFooter()}
        `),
    });
}

/* Correo — Restablecimiento de contraseña */
export async function sendPasswordResetEmail(to, token) {
    const url = `${process.env.CLIENT_URL}/src/pages/auth/reset.html?token=${token}`;
    await getTransporter().sendMail({
        from:    process.env.MAIL_FROM,
        to,
        subject: 'Restablece tu contraseña — Unlockd',
        text: `Hola,\n\nHemos recibido una solicitud para restablecer la contraseña de tu cuenta en Unlockd.\n\nHaz clic en el siguiente enlace para crear una nueva contraseña:\n\n${url}\n\nEl enlace caduca en 1 hora. Si no lo solicitaste, ignora este correo.\n\nUnlockd Studio`,
        html: htmlWrapper(`
            ${htmlHeader('Seguridad de cuenta')}
            <div style="padding:48px 48px 40px;text-align:center">
                <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;color:#aaa;text-transform:uppercase;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
                    Solicitud de cambio
                </p>
                <h2 style="margin:0 0 24px;font-size:22px;font-weight:300;color:#0a0a0a;letter-spacing:2px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;text-transform:uppercase">
                    Nueva contraseña
                </h2>
                <div style="width:40px;height:1px;background:#0a0a0a;margin:0 auto 28px"></div>
                <p style="margin:0;font-size:13px;color:#888;line-height:1.7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
                    Hemos recibido una solicitud para restablecer<br>
                    la contraseña de tu cuenta.
                </p>
                ${htmlButton(url, 'Restablecer contraseña')}
                <p style="margin:0;font-size:11px;color:#bbb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
                    El enlace caduca en 1 hora.<br>
                    Si no lo solicitaste, ignora este correo.
                </p>
            </div>
            ${htmlFooter()}
        `),
    });
}

/* Correo — Formulario de contacto */
export async function sendContactEmail({ nombre, email, asunto, mensaje }) {
    await getTransporter().sendMail({
        from:    process.env.MAIL_FROM,
        to:      process.env.MAIL_USER,
        replyTo: email,
        subject: `[Contacto] ${asunto}`,
        html: htmlWrapper(`
            ${htmlHeader('Mensaje de contacto')}
            <div style="padding:40px 48px">
                <table style="width:100%;border-collapse:collapse;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px">
                    <tr>
                        <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;color:#aaa;width:80px;letter-spacing:1px;text-transform:uppercase;font-size:11px">Nombre</td>
                        <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;color:#111;font-weight:600">${nombre}</td>
                    </tr>
                    <tr>
                        <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;color:#aaa;letter-spacing:1px;text-transform:uppercase;font-size:11px">Email</td>
                        <td style="padding:12px 0;border-bottom:1px solid #f0f0f0">
                            <a href="mailto:${email}" style="color:#0a0a0a;font-weight:600;text-decoration:none">${email}</a>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;color:#aaa;letter-spacing:1px;text-transform:uppercase;font-size:11px">Asunto</td>
                        <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;color:#111;font-weight:600">${asunto}</td>
                    </tr>
                </table>
                <div style="margin-top:28px;padding:24px;background:#f9f9f9;border-left:2px solid #0a0a0a">
                    <p style="margin:0;font-size:14px;color:#333;line-height:1.8;white-space:pre-line;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">${mensaje}</p>
                </div>
                <p style="margin-top:24px;font-size:11px;color:#bbb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
                    Responde directamente a este correo para contestar a ${nombre}.
                </p>
            </div>
            ${htmlFooter()}
        `),
    });
}

/* Correo — Bienvenida newsletter */
export async function sendNewsletterWelcomeEmail(to, codigo) {
    const expira = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

    await getTransporter().sendMail({
        from:    process.env.MAIL_FROM,
        to,
        subject: 'Bienvenido a Unlockd',
        html: htmlWrapper(`
            ${htmlHeader('Newsletter')}
            <div style="padding:48px 48px 40px;text-align:center">
                <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;color:#aaa;text-transform:uppercase;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
                    Ya eres parte de la familia
                </p>
                <h2 style="margin:0 0 20px;font-size:22px;font-weight:300;color:#0a0a0a;letter-spacing:2px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;text-transform:uppercase">
                    Gracias por suscribirte
                </h2>
                <div style="width:40px;height:1px;background:#0a0a0a;margin:0 auto 28px"></div>
                <p style="margin:0 0 28px;font-size:14px;color:#555;line-height:1.8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
                    Serás el primero en conocer nuestros nuevos drops,<br>
                    colecciones exclusivas y ofertas especiales.
                </p>
                <p style="margin:0 0 12px;font-size:11px;letter-spacing:2px;color:#aaa;text-transform:uppercase;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
                    Tu código de 10% descuento
                </p>
                <div style="display:inline-block;background:#0a0a0a;padding:16px 40px;margin-bottom:16px">
                    <span style="color:#fff;font-size:18px;letter-spacing:5px;text-transform:uppercase;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-weight:700">
                        ${codigo}
                    </span>
                </div>
                <p style="margin:0;font-size:11px;color:#bbb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
                    Válido hasta el <strong>${expira}</strong>. Un solo uso.
                </p>
            </div>
            ${htmlFooter()}
        `),
    });
}

/* Correo — Confirmación de pedido */
export async function sendOrderConfirmationEmail(to, order) {
    await getTransporter().sendMail({
        from:    process.env.MAIL_FROM,
        to,
        subject: `Pedido #${order.id.slice(0, 8).toUpperCase()} confirmado — Unlockd`,
        html: htmlWrapper(`
            ${htmlHeader('Confirmación de pedido')}
            <div style="padding:48px 48px 40px;text-align:center">
                <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;color:#aaa;text-transform:uppercase;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
                    Gracias por tu compra
                </p>
                <h2 style="margin:0 0 24px;font-size:22px;font-weight:300;color:#0a0a0a;letter-spacing:2px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;text-transform:uppercase">
                    Pedido confirmado
                </h2>
                <div style="width:40px;height:1px;background:#0a0a0a;margin:0 auto 28px"></div>
                <p style="margin:0 0 6px;font-size:13px;color:#888;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
                    Número de pedido
                </p>
                <p style="margin:0 0 20px;font-size:18px;font-weight:700;color:#0a0a0a;letter-spacing:3px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
                    #${order.id.slice(0, 8).toUpperCase()}
                </p>
                <p style="margin:0;font-size:20px;font-weight:600;color:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
                    ${order.total}€
                </p>
            </div>
            ${htmlFooter()}
        `),
    });
}
