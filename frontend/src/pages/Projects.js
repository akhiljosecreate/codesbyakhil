import React, { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Eye, Calendar } from 'lucide-react';
import { projects as api } from '../api';
import Badge from '../components/Badge';
import Avatar from '../components/Avatar';
import Modal from '../components/Modal';
import { FormField, Input, Select, Textarea, SkillsInput } from '../components/FormField';

function emptyForm() {
  return { name:'', client:'', description:'', start_date:'', end_date:'', status:'planning', required_skills:[], priority:'medium' };
}

function ProjectForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || emptyForm());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.client || !form.start_date || !form.end_date) {
      setError('Please fill all required fields.');
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save project.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div style={{ background:'#fee2e2', color:'#dc2626', padding:'8px 12px', borderRadius:7, marginBottom:14, fontSize:13 }}>{error}</div>}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
        <FormField label="Project Name" required>
          <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="E-Commerce Redesign" />
        </FormField>
        <FormField label="Client" required>
          <Input value={form.client} onChange={e => set('client', e.target.value)} placeholder="RetailCo" />
        </FormField>
        <FormField label="Start Date" required>
          <Input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
        </FormField>
        <FormField label="End Date" required>
          <Input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
        </FormField>
        <FormField label="Status">
          <Select value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="on-hold">On Hold</option>
            <option value="completed">Completed</option>
          </Select>
        </FormField>
        <FormField label="Priority">
          <Select value={form.priority} onChange={e => set('priority', e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </Select>
        </FormField>
      </div>
      <FormField label="Description">
        <Textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief project description…" />
      </FormField>
      <FormField label="Required Skills">
        <SkillsInput value={form.required_skills} onChange={v => set('required_skills', v)} />
      </FormField>
      <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:8 }}>
        <button type="button" onClick={onClose} style={{ padding:'8px 18px', border:'1px solid #e2e8f0', borderRadius:7, background:'#fff', color:'#475569', fontWeight:600, fontSize:13 }}>Cancel</button>
        <button type="submit" disabled={saving} style={{ padding:'8px 18px', border:'none', borderRadius:7, background:'#6366f1', color:'#fff', fontWeight:600, fontSize:13 }}>{saving?'Saving…':'Save Project'}</button>
      </div>
    </form>
  );
}

function DetailModal({ project }) {
  if (!project) return null;
  const duration = project.start_date && project.end_date
    ? Math.ceil((new Date(project.end_date) - new Date(project.start_date)) / (1000*60*60*24*7)) + ' weeks'
    : '';

  return (
    <div>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <h3 style={{ fontSize:18, fontWeight:700 }}>{project.name}</h3>
          <p style={{ color:'#64748b' }}>{project.client}</p>
          {project.description && <p style={{ marginTop:8, fontSize:13, color:'#475569' }}>{project.description}</p>}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end' }}>
          <Badge label={project.status} variant={project.status} />
          <Badge label={project.priority} variant={project.priority} />
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
        {[
          ['Start Date', project.start_date],
          ['End Date', project.end_date],
          ['Duration', duration],
          ['Consultants', project.consultant_count||0],
        ].map(([l,v]) => (
          <div key={l} style={{ background:'#f8fafc', padding:'10px 14px', borderRadius:8 }}>
            <div style={{ fontSize:11, color:'#64748b', fontWeight:600 }}>{l}</div>
            <div style={{ fontWeight:700, color:'#1e293b', marginTop:2 }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:12, fontWeight:600, color:'#374151', marginBottom:6 }}>Required Skills</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
          {(project.required_skills||[]).map(s => (
            <span key={s} style={{ padding:'2px 10px', background:'#e0e7ff', color:'#4338ca', borderRadius:20, fontSize:12, fontWeight:500 }}>{s}</span>
          ))}
        </div>
      </div>

      {project.allocations?.length > 0 && (
        <div>
          <div style={{ fontSize:12, fontWeight:600, color:'#374151', marginBottom:8 }}>Allocated Consultants</div>
          {project.allocations.map(a => (
            <div key={a.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid #f1f5f9' }}>
              <Avatar name={a.consultant_name} color={a.avatar_color} size={32} />
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:13 }}>{a.consultant_name}</div>
                <div style={{ fontSize:11, color:'#64748b' }}>{a.consultant_role} · {a.role}</div>
              </div>
              <span style={{ fontWeight:700, color:'#6366f1', fontSize:13 }}>{a.allocation_percentage}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Projects() {
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  const load = () => api.list().then(setList).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const filtered = list.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.client.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete project "${name}"? This will remove all allocations.`)) return;
    await api.delete(id);
    load();
  };

  const handleDetail = async (p) => {
    const detail = await api.get(p.id);
    setSelected({ ...p, ...detail });
    setModal('detail');
  };

  const priorityIcon = { critical:'🔴', high:'🟠', medium:'🟡', low:'🟢' };

  return (
    <div style={{ padding:32 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800 }}>Projects</h1>
          <p style={{ color:'#64748b', marginTop:2 }}>{list.length} projects total</p>
        </div>
        <button onClick={() => { setSelected(null); setModal('add'); }} style={{
          display:'flex', alignItems:'center', gap:6, padding:'9px 18px',
          background:'#6366f1', color:'#fff', border:'none', borderRadius:8, fontWeight:600, fontSize:13,
        }}>
          <Plus size={16} /> New Project
        </button>
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:20 }}>
        <div style={{ position:'relative', flex:1, maxWidth:380 }}>
          <Search size={16} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects or clients…"
            style={{ width:'100%', padding:'9px 10px 9px 34px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:13, outline:'none' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding:'9px 12px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:13, outline:'none', background:'#fff' }}>
          <option value="all">All Status</option>
          <option value="planning">Planning</option>
          <option value="active">Active</option>
          <option value="on-hold">On Hold</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {loading ? <p style={{ color:'#64748b' }}>Loading…</p> : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px,1fr))', gap:16 }}>
          {filtered.map(p => (
            <div key={p.id} style={{ background:'#fff', borderRadius:12, boxShadow:'var(--shadow)', padding:20, display:'flex', flexDirection:'column' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                <div>
                  <div style={{ fontSize:15, fontWeight:700 }}>{priorityIcon[p.priority]} {p.name}</div>
                  <div style={{ fontSize:12, color:'#64748b' }}>{p.client}</div>
                </div>
                <Badge label={p.status} variant={p.status} />
              </div>

              {p.description && <p style={{ fontSize:12, color:'#64748b', marginBottom:10, lineHeight:1.5 }}>{p.description}</p>}

              <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#64748b', marginBottom:10 }}>
                <Calendar size={13} />
                {p.start_date} → {p.end_date}
              </div>

              {p.required_skills?.length > 0 && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:12 }}>
                  {p.required_skills.slice(0,4).map(s => (
                    <span key={s} style={{ padding:'1px 7px', background:'#f1f5f9', color:'#475569', borderRadius:20, fontSize:11 }}>{s}</span>
                  ))}
                  {p.required_skills.length > 4 && <span style={{ fontSize:11, color:'#94a3b8' }}>+{p.required_skills.length-4}</span>}
                </div>
              )}

              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'auto', paddingTop:10, borderTop:'1px solid #f1f5f9' }}>
                <span style={{ fontSize:12, color:'#64748b' }}>{p.consultant_count||0} consultant{p.consultant_count!==1?'s':''}</span>
                <div style={{ display:'flex', gap:4 }}>
                  <button onClick={() => handleDetail(p)} style={{ border:'none', background:'#f1f5f9', borderRadius:6, padding:'5px 7px', color:'#475569', cursor:'pointer' }}><Eye size={14} /></button>
                  <button onClick={() => { setSelected(p); setModal('edit'); }} style={{ border:'none', background:'#f1f5f9', borderRadius:6, padding:'5px 7px', color:'#6366f1', cursor:'pointer' }}><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(p.id, p.name)} style={{ border:'none', background:'#fee2e2', borderRadius:6, padding:'5px 7px', color:'#ef4444', cursor:'pointer' }}><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn:'1/-1', textAlign:'center', padding:60, color:'#94a3b8' }}>No projects found.</div>
          )}
        </div>
      )}

      <Modal open={modal==='add'} onClose={() => setModal(null)} title="New Project" width={600}>
        <ProjectForm onSave={d => api.create(d)} onClose={() => { setModal(null); load(); }} />
      </Modal>
      <Modal open={modal==='edit'} onClose={() => setModal(null)} title="Edit Project" width={600}>
        {selected && <ProjectForm initial={{ ...selected, required_skills: selected.required_skills||[] }} onSave={d => api.update(selected.id, d)} onClose={() => { setModal(null); load(); }} />}
      </Modal>
      <Modal open={modal==='detail'} onClose={() => setModal(null)} title="Project Detail" width={560}>
        <DetailModal project={selected} />
      </Modal>
    </div>
  );
}
