const db = require('../models/db');

class ServiceController {
  getAll(req, res) {
    try {
      const services = db.prepare('SELECT * FROM services').all();
      res.json(services);
    } catch (err) {
      console.error('Get services error:', err);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }

  create(req, res) {
    try {
      const { title, description, price, icon } = req.body;
      const stmt = db.prepare('INSERT INTO services (title, description, price, icon) VALUES (?, ?, ?, ?)');
      const result = stmt.run(title, description, price, icon || 'code');
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (err) {
      console.error('Create service error:', err);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }

  update(req, res) {
    try {
      const { id } = req.params;
      const { title, description, price, icon } = req.body;
      const stmt = db.prepare('UPDATE services SET title = ?, description = ?, price = ?, icon = ? WHERE id = ?');
      stmt.run(title, description, price, icon || 'code', id);
      res.json({ success: true });
    } catch (err) {
      console.error('Update service error:', err);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }

  delete(req, res) {
    try {
      const { id } = req.params;
      db.prepare('DELETE FROM services WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (err) {
      console.error('Delete service error:', err);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
}

module.exports = new ServiceController();
