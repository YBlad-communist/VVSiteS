import re
import random
import time
import smtplib
import ssl
from email.message import EmailMessage
from collections import defaultdict

import bleach
import bcrypt
import jwt
from flask import (Blueprint, jsonify, request,
                   session, current_app, make_response)

from models.db import query, execute
from middleware.auth import login_required

_contact_limits = defaultdict(list)
CONTACT_LIMIT = 5
CONTACT_WINDOW = 3600


def contact_rate_limit(f):
    def wrapper(*args, **kwargs):
        ip = request.remote_addr or 'unknown'
        now = time.time()
        _contact_limits[ip] = [t for t in _contact_limits[ip] if now - t < CONTACT_WINDOW]
        if len(_contact_limits[ip]) >= CONTACT_LIMIT:
            return jsonify({'error': 'Слишком много заявок. Попробуйте через час.'}), 429
        _contact_limits[ip].append(now)
        return f(*args, **kwargs)
    wrapper.__name__ = f.__name__
    return wrapper

api = Blueprint('api', __name__, url_prefix='/api')


def sanitize(data):
    if isinstance(data, dict):
        return {k: sanitize(v) for k, v in data.items()}
    if isinstance(data, str):
        return bleach.clean(data.strip())
    return data


def validate_contact(data):
    errors = []
    if not data.get('name') or len(data['name']) < 2:
        errors.append('Имя должно быть от 2 до 100 символов')
    if not data.get('email'):
        errors.append('Email обязателен')
    elif not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', data['email']):
        errors.append('Некорректный email')
    if not data.get('message') or len(data['message']) < 10:
        errors.append('Сообщение должно быть от 10 до 5000 символов')
    return errors


def validate_service(data):
    errors = []
    if not data.get('title'):
        errors.append('Название обязательно')
    if not data.get('description'):
        errors.append('Описание обязательно')
    if not data.get('price'):
        errors.append('Цена обязательна')
    return errors


def validate_portfolio(data):
    errors = []
    if not data.get('title'):
        errors.append('Название обязательно')
    return errors


@api.route('/captcha')
def get_captcha():
    a = random.randint(1, 10)
    b = random.randint(1, 10)
    session['captcha_a'] = a
    session['captcha_b'] = b
    return jsonify({'a': a, 'b': b})


@api.route('/contact', methods=['POST'])
@contact_rate_limit
def submit_contact():
    data = sanitize(request.get_json(silent=True) or {})

    errors = validate_contact(data)
    if errors:
        return jsonify({'error': errors[0]}), 400

    a = session.pop('captcha_a', None)
    b = session.pop('captcha_b', None)
    if a is None or b is None:
        return jsonify({'error': 'Сессия истекла. Обновите капчу.'}), 400
    captcha_answer = data.get('captcha')
    if captcha_answer is None or int(captcha_answer) != (a + b):
        return jsonify({'error': 'Неверный ответ на капчу'}), 400

    name = data['name']
    email = data['email']
    message = data['message']

    execute(
        'INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)',
        (name, email, message)
    )

    try:
        smtp_host = current_app.config['SMTP_HOST']
        smtp_port = current_app.config['SMTP_PORT']
        smtp_user = current_app.config['SMTP_USER']
        smtp_pass = current_app.config['SMTP_PASS']
        admin_email = current_app.config['ADMIN_EMAIL']

        msg = EmailMessage()
        msg['Subject'] = 'Новая заявка с сайта'
        msg['From'] = smtp_user
        msg['To'] = admin_email
        msg.set_content(
            f'Новая заявка с сайта\n\n'
            f'Имя: {name}\n'
            f'Email: {email}\n'
            f'Сообщение:\n{message}'
        )
        msg.add_alternative(
            f'<h2>Новая заявка с сайта</h2>'
            f'<p><strong>Имя:</strong> {name}</p>'
            f'<p><strong>Email:</strong> {email}</p>'
            f'<p><strong>Сообщение:</strong></p><p>{message}</p>',
            subtype='html'
        )

        context = ssl.create_default_context()
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            if current_app.config.get('SMTP_SECURE'):
                server.starttls(context=context)
            else:
                server.starttls(context=context)
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
    except Exception as e:
        print(f'Не удалось отправить email, заявка сохранена в БД: {e}')

    return jsonify({'success': True})


@api.route('/services')
def get_services():
    return jsonify(query('SELECT * FROM services'))


@api.route('/portfolio')
def get_portfolio():
    return jsonify(query('SELECT * FROM portfolio'))


@api.route('/admin/login', methods=['POST'])
def admin_login():
    data = sanitize(request.get_json(silent=True) or {})
    login = data.get('login', '')
    password = data.get('password', '')

    if login != current_app.config['ADMIN_LOGIN']:
        return jsonify({'error': 'Неверные учётные данные'}), 401

    admin_hash = current_app.config['ADMIN_HASH']
    if not bcrypt.checkpw(password.encode(), admin_hash.encode()):
        return jsonify({'error': 'Неверные учётные данные'}), 401

    token = jwt.encode(
        {'login': login},
        current_app.config['JWT_SECRET'],
        algorithm='HS256'
    )

    resp = make_response(jsonify({'success': True, 'token': token}))
    resp.set_cookie(
        'token', token,
        httponly=True,
        secure=current_app.config.get('ENV') == 'production',
        samesite='Strict',
        max_age=86400
    )
    return resp


@api.route('/admin/contacts')
@login_required
def admin_contacts():
    return jsonify(query(
        'SELECT * FROM contacts ORDER BY created_at DESC'
    ))


@api.route('/admin/services', methods=['POST'])
@login_required
def create_service():
    data = sanitize(request.get_json(silent=True) or {})
    errors = validate_service(data)
    if errors:
        return jsonify({'error': errors[0]}), 400

    lid = execute(
        'INSERT INTO services (title, description, price, icon) VALUES (?, ?, ?, ?)',
        (data['title'], data['description'], data['price'], data.get('icon', 'code'))
    )
    return jsonify({'success': True, 'id': lid})


@api.route('/admin/services/<int:sid>', methods=['PUT'])
@login_required
def update_service(sid):
    data = sanitize(request.get_json(silent=True) or {})
    errors = validate_service(data)
    if errors:
        return jsonify({'error': errors[0]}), 400

    execute(
        'UPDATE services SET title=?, description=?, price=?, icon=? WHERE id=?',
        (data['title'], data['description'], data['price'], data.get('icon', 'code'), sid)
    )
    return jsonify({'success': True})


@api.route('/admin/services/<int:sid>', methods=['DELETE'])
@login_required
def delete_service(sid):
    execute('DELETE FROM services WHERE id=?', (sid,))
    return jsonify({'success': True})


@api.route('/admin/portfolio', methods=['POST'])
@login_required
def create_portfolio():
    data = sanitize(request.get_json(silent=True) or {})
    errors = validate_portfolio(data)
    if errors:
        return jsonify({'error': errors[0]}), 400

    lid = execute(
        'INSERT INTO portfolio (title, description, image, link) VALUES (?, ?, ?, ?)',
        (data['title'], data.get('description', ''), data.get('image', ''), data.get('link', ''))
    )
    return jsonify({'success': True, 'id': lid})


@api.route('/admin/portfolio/<int:pid>', methods=['PUT'])
@login_required
def update_portfolio(pid):
    data = sanitize(request.get_json(silent=True) or {})
    errors = validate_portfolio(data)
    if errors:
        return jsonify({'error': errors[0]}), 400

    execute(
        'UPDATE portfolio SET title=?, description=?, image=?, link=? WHERE id=?',
        (data['title'], data.get('description', ''), data.get('image', ''), data.get('link', ''), pid)
    )
    return jsonify({'success': True})


@api.route('/admin/portfolio/<int:pid>', methods=['DELETE'])
@login_required
def delete_portfolio(pid):
    execute('DELETE FROM portfolio WHERE id=?', (pid,))
    return jsonify({'success': True})
