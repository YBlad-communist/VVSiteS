import sqlite3
import os
from pathlib import Path

DB_DIR = Path(__file__).resolve().parent.parent / 'data'
DB_PATH = DB_DIR / 'app.db'


def get_db():
    DB_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            price TEXT NOT NULL,
            icon TEXT NOT NULL DEFAULT 'code'
        );

        CREATE TABLE IF NOT EXISTS portfolio (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            image TEXT NOT NULL DEFAULT '',
            link TEXT NOT NULL DEFAULT ''
        );
    """)
    conn.commit()

    count = conn.execute("SELECT COUNT(*) as c FROM services").fetchone()['c']
    if count == 0 or conn.execute("SELECT title FROM services LIMIT 1").fetchone()['title'] == 'Разработка сайтов':
        conn.executescript("DELETE FROM services;" + """
            INSERT INTO services (title, description, price, icon) VALUES
                ('Landing Page', 'Одностраничный сайт для сбора заявок, продажи одного товара или услуги. Быстрый запуск.', 'от 10 000 ₽', 'landing'),
                ('Сайт-визитка', 'Компактный сайт до 5 страниц: информация о компании, услугах, контактах.', 'от 20 000 ₽', 'globe'),
                ('Корпоративный сайт', 'Многостраничный сайт с портфолио, блогом, каталогом услуг и контактами.', 'от 40 000 ₽', 'building'),
                ('Интернет-магазин', 'Каталог товаров, корзина, приём платежей, интеграция с доставкой и личный кабинет.', 'от 70 000 ₽', 'cart'),
                ('Каталог / Портал', 'Удобная фильтрация, карточки, поиск, регистрация, личные кабинеты и чаты.', 'от 50 000 ₽', 'layout');
        """)
        conn.commit()

    conn.close()


def query(sql, params=None):
    conn = get_db()
    if params:
        rows = conn.execute(sql, params).fetchall()
    else:
        rows = conn.execute(sql).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def execute(sql, params=None):
    conn = get_db()
    cur = conn.cursor()
    if params:
        cur.execute(sql, params)
    else:
        cur.execute(sql)
    conn.commit()
    last_id = cur.lastrowid
    conn.close()
    return last_id
