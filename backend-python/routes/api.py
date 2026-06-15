import re
import time
from collections import defaultdict

from flask import (Blueprint, jsonify, request,
                   session, current_app, make_response)

from models.db import query, execute

api = Blueprint('api', __name__, url_prefix='/api')

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


def sanitize(val):
    if isinstance(val, str):
        return val.strip()
    return val


@api.route('/contact', methods=['POST'])
@contact_rate_limit
def submit_contact():
    data = request.get_json(silent=True) or {}
    name = sanitize(data.get('name', ''))
    phone = sanitize(data.get('phone', ''))
    telegram = sanitize(data.get('telegram', ''))
    message = sanitize(data.get('message', ''))

    if not name or len(name) < 2:
        return jsonify({'error': 'Имя должно быть от 2 символов'}), 400
    if len(message) < 5:
        return jsonify({'error': 'Сообщение должно быть от 5 символов'}), 400

    execute(
        'INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)',
        (name, phone or telegram or '-', message)
    )

    return jsonify({'success': True})


@api.route('/services')
def get_services():
    return jsonify(query('SELECT * FROM services'))


@api.route('/portfolio')
def get_portfolio():
    return jsonify(query('SELECT * FROM portfolio'))


def check_admin():
    password = request.form.get('password') or (
        request.get_json(silent=True) or {}
    ).get('password', '')
    return password == current_app.config.get('ADMIN_PASSWORD', 'admin123')


@api.route('/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json(silent=True) or {}
    password = data.get('password', '')

    if password == current_app.config.get('ADMIN_PASSWORD', 'admin123'):
        session['admin'] = True
        return jsonify({'success': True})

    return jsonify({'error': 'Неверный пароль'}), 401


@api.route('/admin/logout', methods=['POST'])
def admin_logout():
    session.pop('admin', None)
    return jsonify({'success': True})


def admin_required(f):
    def wrapper(*args, **kwargs):
        if not session.get('admin'):
            return jsonify({'error': 'Неавторизован'}), 401
        return f(*args, **kwargs)
    wrapper.__name__ = f.__name__
    return wrapper


@api.route('/admin/contacts')
@admin_required
def admin_contacts():
    return jsonify(query('SELECT * FROM contacts ORDER BY created_at DESC'))


@api.route('/admin/portfolio', methods=['GET', 'POST'])
@admin_required
def admin_portfolio():
    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        title = (data.get('title') or '').strip()
        description = (data.get('description') or '').strip()
        image = (data.get('image') or '').strip()
        link = (data.get('link') or '').strip()

        if not title:
            return jsonify({'error': 'Название обязательно'}), 400

        lid = execute(
            'INSERT INTO portfolio (title, description, image, link) VALUES (?, ?, ?, ?)',
            (title, description, image, link)
        )
        return jsonify({'success': True, 'id': lid})

    return jsonify(query('SELECT * FROM portfolio ORDER BY id DESC'))


@api.route('/admin/portfolio/<int:pid>', methods=['PUT', 'DELETE'])
@admin_required
def admin_portfolio_item(pid):
    if request.method == 'DELETE':
        execute('DELETE FROM portfolio WHERE id=?', (pid,))
        return jsonify({'success': True})

    data = request.get_json(silent=True) or {}
    title = (data.get('title') or '').strip()
    description = (data.get('description') or '').strip()
    image = (data.get('image') or '').strip()
    link = (data.get('link') or '').strip()

    if not title:
        return jsonify({'error': 'Название обязательно'}), 400

    execute(
        'UPDATE portfolio SET title=?, description=?, image=?, link=? WHERE id=?',
        (title, description, image, link, pid)
    )
    return jsonify({'success': True})
