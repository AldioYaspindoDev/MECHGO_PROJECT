// File: src/utils/emailSender.js
import nodemailer from 'nodemailer';
import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from 'url';

// Konfigurasi __dirname untuk ES Modules (karena Anda pakai "type": "module")
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Setup Transporter (Ganti dengan email Anda di .env)
const transporter = nodemailer.createTransport({
    service: 'gmail', // atau host SMTP lain
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS
    }
});

// 2. Fungsi Kirim Email
export const sendVerificationEmail = async (email, name, url) => {
    try {
        // Render file EJS
        // Pastikan path ke file .ejs benar! Naik satu folder (..) lalu masuk views
        const templatePath = path.join(__dirname, '../views/emailRegister.ejs');
        
        const html = await ejs.renderFile(templatePath, {
            name: name,
            url: url
        });

        // Kirim
        await transporter.sendMail({
            from: '"MechGo App" <no-reply@mechgo.com>',
            to: email,
            subject: 'Verifikasi Akun MechGo Anda',
            html: html
        });

        console.log(`Email verifikasi terkirim ke: ${email}`);
    } catch (error) {
        console.error("Gagal mengirim email:", error);
        throw new Error("Gagal mengirim email verifikasi");
    }
};