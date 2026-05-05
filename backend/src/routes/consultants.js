const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb, all, get, run } = require('../db/database');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    await getDb();
    const consultants = all(`
      SELECT c.*,
        COALESCE((
          SELECT SUM(a.allocation_percentage)
          FROM allocations a
          WHERE a.consultant_id = c.id
            AND a.start_date <= date('now') AND a.end_date >= date('now')
        ), 0) as allocated_percentage
      FROM consultants c
      ORDER BY c.name
    `);
    res.json(consultants.map(c => ({
      ...c,
      skills: JSON.parse(c.skills),
      available_percentage: Math.max(0, c.capacity - (c.allocated_percentage || 0)),
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    await getDb();
    const consultant = get('SELECT * FROM consultants WHERE id = ?', [req.params.id]);
    if (!consultant) return res.status(404).json({ error: 'Consultant not found' });

    const allocations = all(`
      SELECT a.*, p.name as project_name, p.client, p.status as project_status, p.priority
      FROM allocations a
      JOIN projects p ON a.project_id = p.id
      WHERE a.consultant_id = ?
      ORDER BY a.start_date DESC
    `, [req.params.id]);

    res.json({ ...consultant, skills: JSON.parse(consultant.skills), allocations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    await getDb();
    const { name, email, role, department, skills = [], capacity = 100, start_date, status = 'available', avatar_color = '#6366f1' } = req.body;

    if (!name || !email || !role || !department || !start_date) {
      return res.status(400).json({ error: 'name, email, role, department, start_date are required' });
    }

    const id = uuidv4();
    run('INSERT INTO consultants (id,name,email,role,department,skills,capacity,start_date,status,avatar_color) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [id, name, email, role, department, JSON.stringify(skills), capacity, start_date, status, avatar_color]);

    const consultant = get('SELECT * FROM consultants WHERE id = ?', [id]);
    res.status(201).json({ ...consultant, skills: JSON.parse(consultant.skills) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    await getDb();
    const existing = get('SELECT * FROM consultants WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Consultant not found' });

    const { name, email, role, department, skills, capacity, start_date, status, avatar_color } = req.body;

    run(`UPDATE consultants SET
      name = ?, email = ?, role = ?, department = ?,
      skills = ?, capacity = ?, start_date = ?, status = ?, avatar_color = ?
      WHERE id = ?`,
      [
        name ?? existing.name, email ?? existing.email, role ?? existing.role,
        department ?? existing.department, skills ? JSON.stringify(skills) : existing.skills,
        capacity ?? existing.capacity, start_date ?? existing.start_date,
        status ?? existing.status, avatar_color ?? existing.avatar_color,
        req.params.id,
      ]);

    const consultant = get('SELECT * FROM consultants WHERE id = ?', [req.params.id]);
    res.json({ ...consultant, skills: JSON.parse(consultant.skills) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await getDb();
    const existing = get('SELECT * FROM consultants WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Consultant not found' });

    run('DELETE FROM allocations WHERE consultant_id = ?', [req.params.id]);
    run('DELETE FROM consultants WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
