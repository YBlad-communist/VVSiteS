const { body, validationResult } = require('express-validator');

const contactValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Имя обязательно')
    .isLength({ min: 2, max: 100 }).withMessage('Имя должно быть от 2 до 100 символов'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email обязателен')
    .isEmail().withMessage('Некорректный email'),
  body('message')
    .trim()
    .notEmpty().withMessage('Сообщение обязательно')
    .isLength({ min: 10, max: 5000 }).withMessage('Сообщение должно быть от 10 до 5000 символов'),
];

const serviceValidation = [
  body('title').trim().notEmpty().withMessage('Название обязательно'),
  body('description').trim().notEmpty().withMessage('Описание обязательно'),
  body('price').trim().notEmpty().withMessage('Цена обязательна'),
];

const portfolioValidation = [
  body('title').trim().notEmpty().withMessage('Название обязательно'),
];

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    return res.status(400).json({ error: firstError.msg });
  }
  next();
}

module.exports = { contactValidation, serviceValidation, portfolioValidation, handleValidation };
