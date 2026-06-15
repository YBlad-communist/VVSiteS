import os
from pathlib import Path

import bcrypt
from dotenv import load_dotenv
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR.parent / 'frontend'


def create_app():
    app = Flask(__name__, static_folder=None)

    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret')
    app.config['JWT_SECRET'] = os.getenv('JWT_SECRET', 'jwt-secret')
    app.config['ADMIN_LOGIN'] = os.getenv('ADMIN_LOGIN', 'admin')
    app.config['ADMIN_PASSWORD'] = os.getenv('ADMIN_PASSWORD', 'admin123')
    app.config['ADMIN_HASH'] = bcrypt.hashpw(
        app.config['ADMIN_PASSWORD'].encode(), bcrypt.gensalt()
    ).decode()
    app.config['SMTP_HOST'] = os.getenv('SMTP_HOST', 'smtp.ethereal.email')
    app.config['SMTP_PORT'] = int(os.getenv('SMTP_PORT', '587'))
    app.config['SMTP_SECURE'] = os.getenv('SMTP_SECURE', 'false').lower() == 'true'
    app.config['SMTP_USER'] = os.getenv('SMTP_USER', '')
    app.config['SMTP_PASS'] = os.getenv('SMTP_PASS', '')
    app.config['ADMIN_EMAIL'] = os.getenv('ADMIN_EMAIL', 'admin@example.com')
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'Strict'

    CORS(app, supports_credentials=True)

    Limiter(
        get_remote_address,
        app=app,
        default_limits=["100 per 15 minutes"],
        storage_uri="memory://",
    )

    from routes.api import api as api_blueprint
    app.register_blueprint(api_blueprint)

    from models.db import init_db
    init_db()

    @app.route('/admin')
    @app.route('/admin/')
    def admin_index():
        return send_from_directory(str(BASE_DIR / 'admin'), 'index.html')

    @app.route('/admin/<path:subpath>')
    def admin_fallback(subpath):
        admin_dir = str(BASE_DIR / 'admin')
        file_path = Path(admin_dir) / subpath
        if file_path.exists() and file_path.is_file():
            return send_from_directory(admin_dir, subpath)
        return send_from_directory(admin_dir, 'index.html')

    @app.route('/')
    def frontend_index():
        return send_from_directory(str(FRONTEND_DIR), 'index.html')

    @app.route('/<path:subpath>')
    def frontend_static(subpath):
        file_path = FRONTEND_DIR / subpath
        if file_path.exists() and file_path.is_file():
            return send_from_directory(str(FRONTEND_DIR), subpath)
        return send_from_directory(str(FRONTEND_DIR), 'index.html')

    return app


app = create_app()

if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=int(os.getenv('PORT', '3000')),
        debug=os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
    )
