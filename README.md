# Сайт-визитка для веб-студии

Полноценный сайт-визитка с адаптивным дизайном, анимациями, формой обратной связи, админ-панелью и бэкендом на Node.js + Express + SQLite.

## Быстрый запуск

### 1. Установка зависимостей

```bash
cd backend
npm install
```

### 2. Настройка

Скопируйте `.env.example` в `.env` и отредактируйте:

```bash
cp .env.example .env
```

### 3. Запуск

```bash
npm start
```

Сайт будет доступен по адресу: http://localhost:3000

### 4. Админ-панель

Адрес: http://localhost:3000/admin

Логин по умолчанию: `admin`
Пароль по умолчанию: `admin123`

## Запуск через Docker

```bash
docker compose up --build
```

## Структура проекта

```
project/
├── frontend/            # Фронтенд (HTML, CSS, JS)
│   ├── index.html
│   ├── css/style.css
│   └── js/main.js
├── backend/             # Бэкенд (Node.js + Express)
│   ├── server.js        # Точка входа
│   ├── routes/api.js    # Маршруты API
│   ├── controllers/     # Контроллеры
│   ├── models/db.js     # База данных SQLite
│   ├── middleware/      # Middleware (auth, validate)
│   ├── admin/           # Админ-панель (SPA)
│   ├── .env.example
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## API Эндпоинты

| Метод | Путь | Описание |
|-------|------|----------|
| GET | /api/captcha | Получить капчу |
| POST | /api/contact | Отправить заявку |
| GET | /api/services | Список услуг |
| GET | /api/portfolio | Список работ |
| POST | /api/admin/login | Вход в админку |
| GET | /api/admin/contacts | Заявки (admin) |
| POST | /api/admin/services | Создать услугу (admin) |
| PUT | /api/admin/services/:id | Обновить услугу (admin) |
| DELETE | /api/admin/services/:id | Удалить услугу (admin) |
| POST | /api/admin/portfolio | Создать работу (admin) |
| PUT | /api/admin/portfolio/:id | Обновить работу (admin) |
| DELETE | /api/admin/portfolio/:id | Удалить работу (admin) |

## Настройка почты

Для тестирования используйте https://ethereal.email — получите учётные данные и укажите их в `.env`.

Для реальной отправки укажите SMTP вашего почтового сервиса (Gmail, Яндекс и т.д.).
