const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const xss = require('xss');
const contactController = require('../controllers/contactController');
const serviceController = require('../controllers/serviceController');
const portfolioController = require('../controllers/portfolioController');
const authMiddleware = require('../middleware/auth');
const adminHash = require('../middleware/adminHash');
const { contactValidation, serviceValidation, portfolioValidation, handleValidation } = require('../middleware/validate');

function sanitizeInput(req, res, next) {
  if (req.body) {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key].trim());
      }
    }
  }
  next();
}

router.get('/captcha', (req, res) => contactController.getCaptcha(req, res));

router.post('/contact', sanitizeInput, contactValidation, handleValidation, (req, res) => contactController.submit(req, res));

router.get('/services', (req, res) => serviceController.getAll(req, res));
router.get('/portfolio', (req, res) => portfolioController.getAll(req, res));

router.post('/admin/login', (req, res) => {
  const { login, password } = req.body;

  if (login !== process.env.ADMIN_LOGIN) {
    return res.status(401).json({ error: 'Неверные учётные данные' });
  }

  const isValid = bcrypt.compareSync(password, adminHash);
  if (!isValid) {
    return res.status(401).json({ error: 'Неверные учётные данные' });
  }

  const token = jwt.sign({ login }, process.env.JWT_SECRET, { expiresIn: '24h' });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.json({ success: true, token });
});

router.get('/admin/contacts', authMiddleware, (req, res) => contactController.getContacts(req, res));

router.post('/admin/services', authMiddleware, sanitizeInput, serviceValidation, handleValidation, (req, res) => serviceController.create(req, res));
router.put('/admin/services/:id', authMiddleware, sanitizeInput, serviceValidation, handleValidation, (req, res) => serviceController.update(req, res));
router.delete('/admin/services/:id', authMiddleware, (req, res) => serviceController.delete(req, res));

router.post('/admin/portfolio', authMiddleware, sanitizeInput, portfolioValidation, handleValidation, (req, res) => portfolioController.create(req, res));
router.put('/admin/portfolio/:id', authMiddleware, sanitizeInput, portfolioValidation, handleValidation, (req, res) => portfolioController.update(req, res));
router.delete('/admin/portfolio/:id', authMiddleware, (req, res) => portfolioController.delete(req, res));

module.exports = router;
