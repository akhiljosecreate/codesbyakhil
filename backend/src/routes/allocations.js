const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb, all, get, run } = require('../db/database');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    await getDb();
    const { project_id, consultant_id } = req.query;

    let query = `
      SELECT a.*,
        c.name as consultant_name, c.role as consultant_role, c.avatar_color, c.department,
        p.name as project_name, p.client, p.status as project_status, p.priority
      FROM allocations a
      JOIN consultants c ON a.consultant_id = c.id
      JOIN projects p ON a.project_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (project_id) { query += ' AND a.project_id = ?'; params.push(project_id); }
    if (consultant_id) { query += ' AND a.consultant_id = ?'; params.push(consultant_id); }
    query += ' ORDER BY a.start_date DESC';

    res.json(all(query, params));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    await getDb();
    const { consultant_id, project_id, allocation_percentage, start_date, end_date, role, notes = null } = req.body;

    if (!consultant_id || !project_id || !allocation_percentage || !start_date || !end_date || !role) {
      return res.status(400).json({ error: 'consultant_id, project_id, allocation_percentage, start_date, end_date, role are required' });
    }

    const consultant = get('SELECT * FROM consultants WHERE id = ?', [consultant_id]);
    if (!consultant) return res.status(404).json({ error: 'Consultant not found' });

    const project = get('SELECT * FROM projects WHERE id = ?', [project_id]);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const overlap = get(`
      SELECT COALESCE(SUM(allocation_percentage), 0) as total
      FROM allocations
      WHERE consultant_id = ? AND start_date <= ? AND end_date >= ?
    `, [consultant_id, end_date, start_date]);

    const currentTotal = overlap ? overlap.total : 0;
    if (currentTotal + allocation_percentage > consultant.capacity) {
      return res.status(409).json({
        error: `Over-capacity: consultant is at ${currentTotal}% during this period. Adding ${allocation_percentage}% exceeds ${consultant.capacity}% capacity.`,
        current_allocation: currentTotal,
        capacity: consultant.capacity,
      });
    }

    const id = uuidv4();
    run('INSERT INTO allocations (id,consultant_id,project_id,allocation_percentage,start_date,end_date,role,notes) VALUES (?,?,?,?,?,?,?,?)',
      [id, consultant_id, project_id, allocation_percentage, start_date, end_date, role, notes]);

    const allocation = all(`
      SELECT a.*,
        c.name as consultant_name, c.role as consultant_role, c.avatar_color,
        p.name as project_name, p.client
      FROM allocations a
      JOIN consultants c ON a.consultant_id = c.id
      JOIN projects p ON a.project_id = p.id
      WHERE a.id = ?
    `, [id])[0];

    res.status(201).json(allocation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    await getDb();
    const existing = get('SELECT * FROM allocations WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Allocation not found' });

    const { allocation_percentage, start_date, end_date, role, notes } = req.body;
    const newPct = allocation_percentage ?? existing.allocation_percentage;
    const newStart = start_date ?? existing.start_date;
    const newEnd = end_date ?? existing.end_date;

    const consultant = get('SELECT * FROM consultants WHERE id = ?', [existing.consultant_id]);
    const overlap = get(`
      SELECT COALESCE(SUM(allocation_percentage), 0) as total
      FROM allocations
      WHERE consultant_id = ? AND id != ? AND start_date <= ? AND end_date >= ?
    `, [existing.consultant_id, req.params.id, newEnd, newStart]);

    const otherTotal = overlap ? overlap.total : 0;
    if (otherTotal + newPct > consultant.capacity) {
      return res.status(409).json({ error: `Over-capacity: would reach ${otherTotal + newPct}% of ${consultant.capacity}% capacity.` });
    }

    run(`UPDATE allocations SET
      allocation_percentage=?, start_date=?, end_date=?, role=?, notes=?
      WHERE id=?`,
      [newPct, newStart, newEnd, role ?? existing.role, notes ?? existing.notes, req.params.id]);

    const updated = all(`
      SELECT a.*,
        c.name as consultant_name, c.role as consultant_role, c.avatar_color,
        p.name as project_name, p.client
      FROM allocations a
      JOIN consultants c ON a.consultant_id = c.id
      JOIN projects p ON a.project_id = p.id
      WHERE a.id = ?
    `, [req.params.id])[0];

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await getDb();
    const existing = get('SELECT * FROM allocations WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Allocation not found' });

    run('DELETE FROM allocations WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
