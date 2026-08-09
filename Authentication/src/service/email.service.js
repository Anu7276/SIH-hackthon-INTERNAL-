import nodemailer from 'nodemailer';
import config from '../config/config.js';

let transporter = null;

if (config.GOOGLE_USER && config.GOOGLE_APP_PASSWORD && config.GOOGLE_USER !== 'admin@example.com') {
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: config.GOOGLE_USER,
            pass: config.GOOGLE_APP_PASSWORD
        }
    });

    transporter.verify((error, success) => {
        if (error) {
            console.error('Error connecting to email server:', error.message);
        } else {
            console.log('Email server is ready to send messages');
        }
    });
} else {
    console.log('📧 Email transport using console fallback for development.');
}

export const sendEmail = async (to, subject, text, html) => {
    console.log(`\n========================================`);
    console.log(`📧 [EMAIL NOTIFICATION to ${to}]`);
    console.log(`Subject: ${subject}`);
    console.log(`Message: ${text}`);
    console.log(`========================================\n`);

    if (transporter) {
        try {
            const info = await transporter.sendMail({
                from: `"SIH Auth" <${config.GOOGLE_USER}>`,
                to,
                subject,
                text,
                html,
            });
            console.log('Message sent: %s', info.messageId);
        } catch (error) {
            console.error('Error sending email via SMTP:', error.message);
        }
    }
};