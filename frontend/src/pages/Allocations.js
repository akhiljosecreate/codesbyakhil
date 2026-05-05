import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Search, AlertCircle } from 'lucide-react';
import { allocations as api, consultants as consultantsApi, projects as projectsApi } from '../api';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import UtilizationBar from '../components/UtilizationBar';
import Modal from '../components/Modal';
import { FormField, Input, Select, Textarea } from '../components/FormField';

function AllocationForm({ consultants, projects, onSave, onClose }) {
  const [form, setForm] = useState({
    consultant_id:'', project_id:'', allocation_percentage:50,
    start_date:'', end_date:'', role:'', notes:'',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const selectedConsultant = consultants.find(c => c.id === form.consultant_id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.consultant_id || !form.project_id || !form.start_date || !form.end_date || !form.role) {
      setError('All fields except notes are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({ ...form, allocation_percentage: +form.allocation_percentage });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create allocation.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{ display:'flex', gap:8, alignItems:'flex-start', background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'10px 12px', borderRadius:7, marginBottom:14, fontSize:13 }}>
          <AlertCircle size={16} style={{ flexShrink:0, marginTop:1 }} />
          <span>{error}</span>
        </div>
      )}

      <FormField label="Consultant" required>
        <Select value={form.consultant_id} onChange={e => set('consultant_id', e.target.value)}>
          <option value="">Select consultant…</option>
          {consultants.map(c => (
            <option key={c.id} value={c.id}>{c.name} — {c.role} ({c.available_percentage||0}% available)</option>
          ))}
        </Select>
      </FormField>

      {selectedConsultant && (
        <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:7, padding:'8px 12px', marginBottom:12, fontSize:13 }}>
          <div style={{ fontWeight:600, color:'#15803d', marginBottom:4 }}>Capacity</div>
          <UtilizationBar allocated={selectedConsultant.allocated_percentage||0} capacity={selectedConsultant.capacity} />
          <div style={{ fontSize:11, color:'#64748b', marginTop:4 }}>
            {selectedConsultant.available_percentage}% available · Skills: {(selectedConsultant.skills||[]).join(', ')}
          </div>
        </div>
      )}

      <FormField label="Project" required>
        <Select value={form.project_id} onChange={e => set('project_id', e.target.value)}>
          <option value="">Select project…</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name} — {p.client} ({p.status})</option>
          ))}
        </Select>
      </FormField>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
        <FormField label="Start Date" required>
          <Input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
        </FormField>
        <FormField label="End Date" required>
          <Input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
        </FormField>
        <FormField label="Allocation %" required>
          <Input type="number" min="5" max="100" step="5" value={form.allocation_percentage} onChange={e => set('allocation_percentage', e.target.value)} />
        </FormField>
        <FormField label="Role on Project" required>
          <Input value={form.role} onChange={e => set('role', e.target.value)} placeholder="Lead Developer" />
        </FormField>
      </div>
      <FormField label="Notes">
        <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional notes…" />
      </FormField>

      <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:8 }}>
        <button type="button" onClick={onClose} style={{ padding:'8px 18px', border:'1px solid #e2e8f0', borderRadius:7, background:'#fff', color:'#475569', fontWeight:600, fontSize:13 }}>Cancel</button>
        <button type="submit" disabled={saving} style={{ padding:'8px 18px', border:'none', borderRadius:7, background:'#6366f1', color:'#fff', fontWeight:600, fontSize:13 }}>{saving?'Allocating…':'Allocate'}</button>
      </div>
    </form>
  );
}

export default function Allocations() {
  const [list, setList] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);

  const load = async () => {
    const [a, c, p] = await Promise.all([api.list(), consultantsApi.list(), projectsApi.list()]);
    setList(a); setConsultants(c); setProjects(p);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = list.filter(a =>
    a.consultant_name.toLowerCase().includes(search.toLowerCase()) ||
    a.project_name.toLowerCase().includes(search.toLowerCase()) ||
    a.client?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id, cName, pName) => {
    if (!window.confirm(`Remove ${cName} from "${pName}"?`)) return;
    await api.delete(id);
    load();
  };

  return (
    <div style={{ padding:32 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800 }}>Allocations</h1>
          <p style={{ color:'#64748b', marginTop:2 }}>{list.length} active allocations</p>
        </div>
        <button onClick={() => setModal(true)} style={{
          display:'flex', alignItems:'center', gap:6, padding:'9px 18px',
          background:'#6366f1', color:'#fff', border:'none', borderRadius:8, fontWeight:600, fontSize:13,
        }}>
          <Plus size={16} /> New Allocation
        </button>
      </div>

      {/* Consultant capacity overview */}
      <div style={{ background:'#fff', borderRadius:12, padding:20, boxShadow:'var(--shadow)', marginBottom:24 }}>
        <h2 style={{ fontSize:14, fontWeight:700, marginBottom:14, color:'#374151' }}>Consultant Capacity Overview</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))', gap:12 }}>
          {consultants.map(c => (
            <div key={c.id} style={{ background:'#f8fafc', borderRadius:9, padding:'10px 14px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                <Avatar name={c.name} color={c.avatar_color} size={28} />
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'#1e293b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</div>
                  <div style={{ fontSize:10, color:'#64748b' }}>{c.department}</div>
                </div>
              </div>
              <UtilizationBar allocated={c.allocated_percentage||0} capacity={c.capacity} height={5} />
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div style={{ position:'relative', marginBottom:16, maxWidth:380 }}>
        <Search size={16} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search allocations…"
          style={{ width:'100%', padding:'9px 10px 9px 34px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:13, outline:'none' }} />
      </div>

      {loading ? <p style={{ color:'#64748b' }}>Loading…</p> : (
        <div style={{ background:'#fff', borderRadius:12, boxShadow:'var(--shadow)', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#f8fafc', borderBottom:'1px solid #e2e8f0' }}>
                {['Consultant','Project','Role','Allocation','Period','Priority',''].map(h => (
                  <th key={h} style={{ padding:'11px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'#64748b', letterSpacing:.5, textTransform:'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id} style={{ borderBottom:'1px solid #f1f5f9' }} onMouseEnter={e => e.currentTarget.style.background='#fafafa'} onMouseLeave={e => e.currentTarget.style.background=''}>
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <Avatar name={a.consultant_name} color={a.avatar_color} size={32} />
                      <div>
                        <div style={{ fontWeight:600, fontSize:13 }}>{a.consultant_name}</div>
                        <div style={{ fontSize:11, color:'#64748b' }}>{a.consultant_role}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ fontWeight:600, fontSize:13 }}>{a.project_name}</div>
                    <div style={{ fontSize:11, color:'#64748b' }}>{a.client}</div>
                  </td>
                  <td style={{ padding:'12px 16px', color:'#475569', fontSize:13 }}>{a.role}</td>
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                      <div style={{
                        width:40, height:40, borderRadius:'50%', background:`conic-gradient(#6366f1 ${a.allocation_percentage*3.6}deg, #e2e8f0 0deg)`,
                        display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#4f46e5',
                        position:'relative',
                      }}>
                        <div style={{ width:28, height:28, borderRadius:'50%', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800, color:'#4f46e5' }}>
                          {a.allocation_percentage}%
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:'12px 16px', fontSize:12, color:'#64748b' }}>
                    <div>{a.start_date}</div>
                    <div>→ {a.end_date}</div>
                  </td>
                  <td style={{ padding:'12px 16px' }}><Badge label={a.priority} variant={a.priority} /></td>
                  <td style={{ padding:'12px 16px' }}>
                    <button onClick={() => handleDelete(a.id, a.consultant_name, a.project_name)}
                      style={{ border:'none', background:'#fee2e2', borderRadius:6, padding:'5px 7px', color:'#ef4444', cursor:'pointer' }}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign:'center', padding:50, color:'#94a3b8' }}>No allocations yet. Click "New Allocation" to assign a consultant.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="New Allocation" width={560}>
        <AllocationForm
          consultants={consultants}
          projects={projects}
          onSave={d => api.create(d)}
          onClose={() => { setModal(false); load(); }}
        />
      </Modal>
    </div>
  );
}
