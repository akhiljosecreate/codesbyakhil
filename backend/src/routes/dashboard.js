const express = require('express');
const { getDb, all, get } = require('../db/database');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    await getDb();

    const totalConsultants = get('SELECT COUNT(*) as n FROM consultants').n;
    const totalProjects = get('SELECT COUNT(*) as n FROM projects').n;
    const activeProjects = get("SELECT COUNT(*) as n FROM projects WHERE status = 'active'").n;

    const utilizationData = all(`
      SELECT c.id, c.name, c.capacity, c.avatar_color, c.role, c.department,
        COALESCE((
          SELECT SUM(a.allocation_percentage)
          FROM allocations a
          WHERE a.consultant_id = c.id
            AND a.start_date <= date('now') AND a.end_date >= date('now')
        ), 0) as allocated
      FROM consultants c
    `);

    const avgUtilization = utilizationData.length
      ? Math.round(utilizationData.reduce((s, c) => s + Math.min((c.allocated / c.capacity) * 100, 100), 0) / utilizationData.length)
      : 0;

    const unallocated = utilizationData.filter(c => c.allocated === 0).length;
    const overallocated = utilizationData.filter(c => c.allocated > c.capacity).length;

    const recentAllocations = all(`
      SELECT a.*, c.name as consultant_name, c.avatar_color, p.name as project_name, p.client
      FROM allocations a
      JOIN consultants c ON a.consultant_id = c.id
      JOIN projects p ON a.project_id = p.id
      ORDER BY a.created_at DESC
      LIMIT 5
    `);

    const projectsByStatus = all(`SELECT status, COUNT(*) as count FROM projects GROUP BY status`);

    const departmentUtilization = all(`
      SELECT c.department,
        COUNT(DISTINCT c.id) as consultant_count,
        ROUND(AVG(COALESCE((
          SELECT SUM(a2.allocation_percentage)
          FROM allocations a2
          WHERE a2.consultant_id = c.id
            AND a2.start_date <= date('now') AND a2.end_date >= date('now')
        ), 0)), 1) as avg_allocation
      FROM consultants c
      GROUP BY c.department
      ORDER BY c.department
    `);

    res.json({
      stats: {
        total_consultants: totalConsultants,
        total_projects: totalProjects,
        active_projects: activeProjects,
        avg_utilization: avgUtilization,
        unallocated_consultants: unallocated,
        overallocated_consultants: overallocated,
      },
      utilization: utilizationData,
      recent_allocations: recentAllocations,
      projects_by_status: projectsByStatus,
      department_utilization: departmentUtilization,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
