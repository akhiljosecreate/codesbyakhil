import React, { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Eye } from 'lucide-react';
import { consultants as api } from '../api';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import UtilizationBar from '../components/UtilizationBar';
import Modal from '../components/Modal';
import { FormField, Input, Select, SkillsInput } from '../components/FormField';

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#10b981','#3b82f6','#ef4444'];

function emptyForm() {
  return { name:'', email:'', role:'', department:'', skills:[], capacity:100, start_date:'', status:'available', avatar_color: COLORS[0] };
}

function ConsultantForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || emptyForm());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.role || !form.department || !form.start_date) {
      setError('Please fill all required fields.');
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save consultant.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div style={{ background:'#fee2e2', color:'#dc2626', padding:'8px 12px', borderRadius:7, marginBottom:14, fontSize:13 }}>{error}</div>}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
        <FormField label="Full Name" required>
          <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Jane Smith" />
        </FormField>
        <FormField label="Email" required>
          <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@example.com" />
        </FormField>
        <FormField label="Role" required>
          <Input value={form.role} onChange={e => set('role', e.target.value)} placeholder="Senior Developer" />
        </FormField>
        <FormField label="Department" required>
          <Input value={form.department} onChange={e => set('department', e.target.value)} placeholder="Engineering" />
        </FormField>
        <FormField label="Start Date" required>
          <Input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
        </FormField>
        <FormField label="Capacity (%)">
          <Input type="number" min="10" max="100" value={form.capacity} onChange={e => set('capacity', +e.target.value)} />
        </FormField>
        <FormField label="Status">
          <Select value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="available">Available</option>
            <option value="busy">Busy</option>
            <option value="unavailable">Unavailable</option>
          </Select>
        </FormField>
        <FormField label="Avatar Color">
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:2 }}>
            {COLORS.map(c => (
              <div key={c} onClick={() => set('avatar_color', c)} style={{
                width:24, height:24, borderRadius:'50%', background:c, cursor:'pointer',
                border: form.avatar_color===c ? '2px solid #1e293b' : '2px solid transparent',
              }} />
            ))}
          </div>
        </FormField>
      </div>
      <FormField label="Skills">
        <SkillsInput value={form.skills} onChange={v => set('skills', v)} />
      </FormField>
      <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:8 }}>
        <button type="button" onClick={onClose} style={{
          padding:'8px 18px', border:'1px solid #e2e8f0', borderRadius:7,
          background:'#fff', color:'#475569', fontWeight:600, fontSize:13,
        }}>Cancel</button>
        <button type="submit" disabled={saving} style={{
          padding:'8px 18px', border:'none', borderRadius:7,
          background:'#6366f1', color:'#fff', fontWeight:600, fontSize:13,
        }}>{saving ? 'Saving…' : 'Save Consultant'}</button>
      </div>
    </form>
  );
}

function DetailModal({ consultant, onClose }) {
  if (!consultant) return null;
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
        <Avatar name={consultant.name} color={consultant.avatar_color} size={52} />
        <div>
          <h3 style={{ fontSize:18, fontWeight:700 }}>{consultant.name}</h3>
          <p style={{ color:'#64748b' }}>{consultant.role} · {consultant.department}</p>
          <p style={{ color:'#64748b', fontSize:12 }}>{consultant.email}</p>
        </div>
        <Badge label={consultant.status} variant={consultant.status} />
      </div>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:12, fontWeight:600, color:'#374151', marginBottom:6 }}>Skills</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
          {(consultant.skills||[]).map(s => (
            <span key={s} style={{ padding:'2px 10px', background:'#e0e7ff', color:'#4338ca', borderRadius:20, fontSize:12, fontWeight:500 }}>{s}</span>
          ))}
        </div>
      </div>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:12, fontWeight:600, color:'#374151', marginBottom:6 }}>Current Allocation</div>
        <UtilizationBar allocated={consultant.allocated_percentage||0} capacity={consultant.capacity} />
      </div>
      {consultant.allocations?.length > 0 && (
        <div>
          <div style={{ fontSize:12, fontWeight:600, color:'#374151', marginBottom:8 }}>Project Allocations</div>
          {consultant.allocations.map(a => (
            <div key={a.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid #f1f5f9' }}>
              <div>
                <div style={{ fontWeight:600, fontSize:13 }}>{a.project_name}</div>
                <div style={{ fontSize:11, color:'#64748b' }}>{a.client} · {a.role}</div>
                <div style={{ fontSize:11, color:'#94a3b8' }}>{a.start_date} → {a.end_date}</div>
              </div>
              <span style={{ fontWeight:700, color:'#6366f1', fontSize:13 }}>{a.allocation_percentage}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Consultants() {
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | 'edit' | 'detail'
  const [selected, setSelected] = useState(null);

  const load = () => api.list().then(setList).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const filtered = list.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.role.toLowerCase().includes(search.toLowerCase()) ||
    c.department.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ${name}? This will remove all their allocations.`)) return;
    await api.delete(id);
    load();
  };

  const handleDetail = async (c) => {
    const detail = await api.get(c.id);
    setSelected({ ...c, ...detail });
    setModal('detail');
  };

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800 }}>Consultants</h1>
          <p style={{ color:'#64748b', marginTop:2 }}>{list.length} consultants onboarded</p>
        </div>
        <button onClick={() => { setSelected(null); setModal('add'); }} style={{
          display:'flex', alignItems:'center', gap:6,
          padding:'9px 18px', background:'#6366f1', color:'#fff',
          border:'none', borderRadius:8, fontWeight:600, fontSize:13,
        }}>
          <Plus size={16} /> Add Consultant
        </button>
      </div>

      {/* Search */}
      <div style={{ position:'relative', marginBottom:20, maxWidth:380 }}>
        <Search size={16} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, role, department…"
          style={{ width:'100%', padding:'9px 10px 9px 34px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:13, outline:'none' }} />
      </div>

      {loading ? <p style={{ color:'#64748b' }}>Loading…</p> : (
        <div style={{ background:'#fff', borderRadius:12, boxShadow:'var(--shadow)', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#f8fafc', borderBottom:'1px solid #e2e8f0' }}>
                {['Consultant','Department','Skills','Utilization','Status',''].map(h => (
                  <th key={h} style={{ padding:'11px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'#64748b', letterSpacing:.5, textTransform:'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} style={{ borderBottom:'1px solid #f1f5f9' }} onMouseEnter={e => e.currentTarget.style.background='#fafafa'} onMouseLeave={e => e.currentTarget.style.background=''}>
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <Avatar name={c.name} color={c.avatar_color} size={36} />
                      <div>
                        <div style={{ fontWeight:600, fontSize:14 }}>{c.name}</div>
                        <div style={{ fontSize:12, color:'#64748b' }}>{c.role}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:'12px 16px', color:'#475569', fontSize:13 }}>{c.department}</td>
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                      {(c.skills||[]).slice(0,3).map(s => (
                        <span key={s} style={{ padding:'1px 7px', background:'#f1f5f9', color:'#475569', borderRadius:20, fontSize:11 }}>{s}</span>
                      ))}
                      {c.skills?.length > 3 && <span style={{ fontSize:11, color:'#94a3b8' }}>+{c.skills.length-3}</span>}
                    </div>
                  </td>
                  <td style={{ padding:'12px 16px', minWidth:140 }}>
                    <UtilizationBar allocated={c.allocated_percentage||0} capacity={c.capacity} />
                  </td>
                  <td style={{ padding:'12px 16px' }}><Badge label={c.status} variant={c.status} /></td>
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ display:'flex', gap:4 }}>
                      <button onClick={() => handleDetail(c)} title="View" style={{ border:'none', background:'#f1f5f9', borderRadius:6, padding:'5px 7px', color:'#475569', cursor:'pointer' }}><Eye size={14} /></button>
                      <button onClick={() => { setSelected(c); setModal('edit'); }} title="Edit" style={{ border:'none', background:'#f1f5f9', borderRadius:6, padding:'5px 7px', color:'#6366f1', cursor:'pointer' }}><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(c.id, c.name)} title="Delete" style={{ border:'none', background:'#fee2e2', borderRadius:6, padding:'5px 7px', color:'#ef4444', cursor:'pointer' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign:'center', padding:40, color:'#94a3b8' }}>No consultants found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal==='add'} onClose={() => setModal(null)} title="Add Consultant" width={600}>
        <ConsultantForm onSave={d => api.create({ ...d })} onClose={() => { setModal(null); load(); }} />
      </Modal>

      <Modal open={modal==='edit'} onClose={() => setModal(null)} title="Edit Consultant" width={600}>
        {selected && (
          <ConsultantForm
            initial={{ ...selected, skills: selected.skills || [] }}
            onSave={d => api.update(selected.id, d)}
            onClose={() => { setModal(null); load(); }}
          />
        )}
      </Modal>

      <Modal open={modal==='detail'} onClose={() => setModal(null)} title="Consultant Detail" width={520}>
        <DetailModal consultant={selected} onClose={() => setModal(null)} />
      </Modal>
    </div>
  );
}
