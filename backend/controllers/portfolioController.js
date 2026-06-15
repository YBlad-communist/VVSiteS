const db = require('../models/db');

class PortfolioController {
  getAll(req, res) {
    try {
      const items = db.prepare('SELECT * FROM portfolio').all();
      res.json(items);
    } catch (err) {
      console.error('Get portfolio error:', err);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }

  create(req, res) {
    try {
      const { title, description, image, link } = req.body;
      const stmt = db.prepare('INSERT INTO portfolio (title, description, image, link) VALUES (?, ?, ?, ?)');
      const result = stmt.run(title, description || '', image || '', link || '');
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (err) {
      console.error('Create portfolio error:', err);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }

  update(req, res) {
    try {
      const { id } = req.params;
      const { title, description, image, link } = req.body;
      const stmt = db.prepare('UPDATE portfolio SET title = ?, description = ?, image = ?, link = ? WHERE id = ?');
      stmt.run(title, description || '', image || '', link || '', id);
      res.json({ success: true });
    } catch (err) {
      console.error('Update portfolio error:', err);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }

  delete(req, res) {
    try {
      const { id } = req.params;
      db.prepare('DELETE FROM portfolio WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (err) {
      console.error('Delete portfolio error:', err);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
}

module.exports = new PortfolioController();
