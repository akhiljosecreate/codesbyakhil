const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../../data/allocation.db');

let db = null;
let SQL = null;

async function getDb() {
  if (db) return db;

  SQL = await initSqlJs();
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  initSchema();
  await seedIfEmpty();
  return db;
}

function persist() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function run(sql, params = []) {
  db.run(sql, params);
  persist();
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function get(sql, params = []) {
  const rows = all(sql, params);
  return rows[0] || null;
}

function initSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS consultants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL,
      department TEXT NOT NULL,
      skills TEXT NOT NULL DEFAULT '[]',
      capacity INTEGER NOT NULL DEFAULT 100,
      start_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'available',
      avatar_color TEXT NOT NULL DEFAULT '#6366f1',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      client TEXT NOT NULL,
      description TEXT,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'planning',
      required_skills TEXT NOT NULL DEFAULT '[]',
      priority TEXT NOT NULL DEFAULT 'medium',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS allocations (
      id TEXT PRIMARY KEY,
      consultant_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      allocation_percentage INTEGER NOT NULL DEFAULT 100,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      role TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(consultant_id) REFERENCES consultants(id) ON DELETE CASCADE,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);
}

async function seedIfEmpty() {
  const count = get('SELECT COUNT(*) as n FROM consultants');
  if (count && count.n > 0) return;

  const colors = ['#6366f1','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#10b981','#3b82f6','#ef4444'];
  const consultants = [
    { id:'c1', name:'Alex Johnson', email:'alex@example.com', role:'Senior Developer', department:'Engineering', skills:JSON.stringify(['React','Node.js','AWS']), capacity:100, start_date:'2024-01-15', status:'available', avatar_color:colors[0] },
    { id:'c2', name:'Sara Chen', email:'sara@example.com', role:'UX Designer', department:'Design', skills:JSON.stringify(['Figma','User Research','Prototyping']), capacity:100, start_date:'2024-02-01', status:'available', avatar_color:colors[1] },
    { id:'c3', name:'Marcus Williams', email:'marcus@example.com', role:'Data Analyst', department:'Analytics', skills:JSON.stringify(['Python','SQL','Tableau','ML']), capacity:100, start_date:'2024-01-20', status:'available', avatar_color:colors[2] },
    { id:'c4', name:'Priya Patel', email:'priya@example.com', role:'Project Manager', department:'PMO', skills:JSON.stringify(['Agile','Scrum','Stakeholder Management']), capacity:100, start_date:'2024-03-01', status:'available', avatar_color:colors[3] },
    { id:'c5', name:'Tom Bradley', email:'tom@example.com', role:'Cloud Architect', department:'Engineering', skills:JSON.stringify(['AWS','Azure','Terraform','DevOps']), capacity:100, start_date:'2024-01-10', status:'available', avatar_color:colors[4] },
  ];

  const projects = [
    { id:'p1', name:'E-Commerce Redesign', client:'RetailCo', description:'Full redesign of customer-facing e-commerce platform', start_date:'2026-05-01', end_date:'2026-08-31', status:'active', required_skills:JSON.stringify(['React','UX Design','Node.js']), priority:'high' },
    { id:'p2', name:'Data Warehouse Migration', client:'FinanceCorp', description:'Migrate legacy data warehouse to cloud-based solution', start_date:'2026-04-15', end_date:'2026-07-31', status:'active', required_skills:JSON.stringify(['Python','SQL','AWS','Tableau']), priority:'critical' },
    { id:'p3', name:'Mobile App Launch', client:'StartupXYZ', description:'New mobile application for healthcare booking', start_date:'2026-06-01', end_date:'2026-10-31', status:'planning', required_skills:JSON.stringify(['React','Figma','Agile']), priority:'medium' },
  ];

  for (const c of consultants) {
    db.run('INSERT INTO consultants (id,name,email,role,department,skills,capacity,start_date,status,avatar_color) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [c.id,c.name,c.email,c.role,c.department,c.skills,c.capacity,c.start_date,c.status,c.avatar_color]);
  }

  for (const p of projects) {
    db.run('INSERT INTO projects (id,name,client,description,start_date,end_date,status,required_skills,priority) VALUES (?,?,?,?,?,?,?,?,?)',
      [p.id,p.name,p.client,p.description,p.start_date,p.end_date,p.status,p.required_skills,p.priority]);
  }

  db.run('INSERT INTO allocations (id,consultant_id,project_id,allocation_percentage,start_date,end_date,role,notes) VALUES (?,?,?,?,?,?,?,?)',
    ['a1','c1','p1',80,'2026-05-01','2026-08-31','Lead Developer','Primary frontend lead']);
  db.run('INSERT INTO allocations (id,consultant_id,project_id,allocation_percentage,start_date,end_date,role,notes) VALUES (?,?,?,?,?,?,?,?)',
    ['a2','c3','p2',100,'2026-04-15','2026-07-31','Data Engineer',null]);
  db.run('INSERT INTO allocations (id,consultant_id,project_id,allocation_percentage,start_date,end_date,role,notes) VALUES (?,?,?,?,?,?,?,?)',
    ['a3','c4','p1',50,'2026-05-01','2026-08-31','Project Coordinator',null]);

  persist();
}

module.exports = { getDb, run, all, get, persist };
