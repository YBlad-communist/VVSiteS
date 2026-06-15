import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, send_from_directory, jsonify

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR.parent / 'frontend'

load_dotenv(BASE_DIR / '.env')


def create_app():
    app = Flask(__name__, static_folder=None)

    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret')
    app.config['ADMIN_PASSWORD'] = os.getenv('ADMIN_PASSWORD', 'admin123')
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

    from routes.api import api as api_blueprint
    app.register_blueprint(api_blueprint)

    from models.db import init_db
    try:
        init_db()
    except Exception as e:
        print(f'DB init error: {e}')

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Внутренняя ошибка сервера'}), 500

    @app.route('/favicon.ico')
    def favicon():
        return '', 204

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


try:
    app = create_app()
except Exception as e:
    import sys
    print(f'FATAL ERROR creating app: {e}', file=sys.stderr)
    raise

if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=int(os.getenv('PORT', '3000')),
        debug=os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
    )
