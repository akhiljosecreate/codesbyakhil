const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb, all, get, run } = require('../db/database');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    await getDb();
    const projects = all(`
      SELECT p.*,
        COUNT(DISTINCT a.consultant_id) as consultant_count,
        COALESCE(SUM(a.allocation_percentage), 0) as total_allocation
      FROM projects p
      LEFT JOIN allocations a ON p.id = a.project_id
      GROUP BY p.id
      ORDER BY p.start_date DESC
    `);
    res.json(projects.map(p => ({ ...p, required_skills: JSON.parse(p.required_skills) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    await getDb();
    const project = get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const allocations = all(`
      SELECT a.*, c.name as consultant_name, c.role as consultant_role, c.avatar_color, c.department
      FROM allocations a
      JOIN consultants c ON a.consultant_id = c.id
      WHERE a.project_id = ?
      ORDER BY a.start_date
    `, [req.params.id]);

    res.json({ ...project, required_skills: JSON.parse(project.required_skills), allocations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    await getDb();
    const { name, client, description = '', start_date, end_date, status = 'planning', required_skills = [], priority = 'medium' } = req.body;

    if (!name || !client || !start_date || !end_date) {
      return res.status(400).json({ error: 'name, client, start_date, end_date are required' });
    }

    const id = uuidv4();
    run('INSERT INTO projects (id,name,client,description,start_date,end_date,status,required_skills,priority) VALUES (?,?,?,?,?,?,?,?,?)',
      [id, name, client, description, start_date, end_date, status, JSON.stringify(required_skills), priority]);

    const project = get('SELECT * FROM projects WHERE id = ?', [id]);
    res.status(201).json({ ...project, required_skills: JSON.parse(project.required_skills) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    await getDb();
    const existing = get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Project not found' });

    const { name, client, description, start_date, end_date, status, required_skills, priority } = req.body;

    run(`UPDATE projects SET
      name=?, client=?, description=?, start_date=?, end_date=?, status=?, required_skills=?, priority=?
      WHERE id=?`,
      [
        name ?? existing.name, client ?? existing.client,
        description ?? existing.description, start_date ?? existing.start_date,
        end_date ?? existing.end_date, status ?? existing.status,
        required_skills ? JSON.stringify(required_skills) : existing.required_skills,
        priority ?? existing.priority, req.params.id,
      ]);

    const project = get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    res.json({ ...project, required_skills: JSON.parse(project.required_skills) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await getDb();
    const existing = get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Project not found' });

    run('DELETE FROM allocations WHERE project_id = ?', [req.params.id]);
    run('DELETE FROM projects WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
