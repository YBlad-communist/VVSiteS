const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'app.db');

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'code'
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS portfolio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    image TEXT NOT NULL DEFAULT '',
    link TEXT NOT NULL DEFAULT ''
  )
`);

const stmtServices = db.prepare('SELECT COUNT(*) as count FROM services');
const { count: servicesCount } = stmtServices.get();

if (servicesCount === 0) {
  const insert = db.prepare('INSERT INTO services (title, description, price, icon) VALUES (?, ?, ?, ?)');
  insert.run('Разработка сайтов', 'Создание современных адаптивных сайтов любой сложности: от лендингов до интернет-магазинов.', 'от 50 000 ₽', 'code');
  insert.run('Веб-дизайн', 'Разработка уникального дизайна с учётом вашего бренда и современных трендов UX/UI.', 'от 30 000 ₽', 'palette');
  insert.run('SEO-продвижение', 'Комплексное продвижение вашего сайта в поисковых системах для роста продаж.', 'от 15 000 ₽', 'trending-up');
  insert.run('Поддержка и доработка', 'Техническая поддержка сайта, добавление функционала, оптимизация скорости.', 'от 10 000 ₽', 'settings');
}

const stmtPortfolio = db.prepare('SELECT COUNT(*) as count FROM portfolio');
const { count: portfolioCount } = stmtPortfolio.get();

if (portfolioCount === 0) {
  const insert = db.prepare('INSERT INTO portfolio (title, description, image, link) VALUES (?, ?, ?, ?)');
  insert.run('Интернет-магазин "Маркет"', 'Полноценный интернет-магазин с корзиной и оплатой.', '/api/placeholder/600/400?text=Market', 'https://example.com');
  insert.run('Сайт-визитка "СтройМастер"', 'Лендинг с формой заявки и галереей работ.', '/api/placeholder/600/400?text=StroyMaster', 'https://example.com');
  insert.run('Корпоративный портал "БизнесПро"', 'Многостраничный сайт с личным кабинетом.', '/api/placeholder/600/400?text=BiznesPro', 'https://example.com');
  insert.run('Лендинг "ТурПутешествия"', 'Красочный лендинг с анимациями и интеграцией карт.', '/api/placeholder/600/400?text=TurPuteshestviya', 'https://example.com');
}

module.exports = db;
