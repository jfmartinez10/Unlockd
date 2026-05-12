import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host:   'smtp.gmail.com',
    port:   587,
    secure: false,
    auth: {
        user: 'noreply.unlockd@gmail.com',
        pass: 'knwl xado lrfs foxj',
    },
    connectionTimeout: 8000,
    greetingTimeout:   8000,
    socketTimeout:     10000,
});

console.log('Verificando conexión SMTP...');

transporter.verify((error, success) => {
    if (error) {
        console.error('ERROR SMTP:', error.message);
        console.error('Código:', error.code);
    } else {
        console.log('Conexión OK. Enviando correo de prueba...');
        transporter.sendMail({
            from:    '"Unlockd" <noreply.unlockd@gmail.com>',
            to:      'jfmartinez383@gmail.com',
            subject: 'Test Unlockd',
            text:    'Si recibes esto, el correo funciona.',
        }, (err, info) => {
            if (err) console.error('ERROR enviando:', err.message);
            else console.log('Correo enviado:', info.messageId);
        });
    }
});
