const nodemailer = require('nodemailer');
const db = require('../models/db');

class ContactController {
  async submit(req, res) {
    try {
      const { name, email, message } = req.body;

      const stmt = db.prepare('INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)');
      stmt.run(name, email, message);

      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT, 10),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: process.env.ADMIN_EMAIL,
          subject: 'Новая заявка с сайта',
          html: `
            <h2>Новая заявка с сайта</h2>
            <p><strong>Имя:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Сообщение:</strong></p>
            <p>${message}</p>
          `,
        });
      } catch (mailErr) {
        console.warn('Не удалось отправить email, заявка сохранена в БД:', mailErr.message);
      }

      res.json({ success: true });
    } catch (err) {
      console.error('Contact submit error:', err);
      res.status(500).json({ error: 'Ошибка сервера. Попробуйте позже.' });
    }
  }

  async getContacts(req, res) {
    try {
      const contacts = db.prepare('SELECT * FROM contacts ORDER BY created_at DESC').all();
      res.json(contacts);
    } catch (err) {
      console.error('Get contacts error:', err);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
}

module.exports = new ContactController();
