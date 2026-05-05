import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Users, FolderKanban, TrendingUp, AlertTriangle } from 'lucide-react';
import { dashboard } from '../api';
import Avatar from '../components/Avatar';
import UtilizationBar from '../components/UtilizationBar';

const PIE_COLORS = { active: '#10b981', planning: '#f59e0b', completed: '#6366f1', 'on-hold': '#ef4444' };

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: '20px 22px',
      boxShadow: 'var(--shadow)', display: 'flex', gap: 16, alignItems: 'flex-start',
    }}>
      <div style={{
        width: 46, height: 46, borderRadius: 10, background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#1e293b', lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboard.get().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, color: '#64748b' }}>Loading dashboard…</div>;
  if (!data) return null;

  const { stats, utilization, recent_allocations, projects_by_status, department_utilization } = data;

  const pieData = projects_by_status.map(p => ({ name: p.status, value: p.count }));
  const barData = department_utilization.map(d => ({
    name: d.department, consultants: d.consultant_count, allocation: Math.round(d.avg_allocation),
  }));

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b' }}>Dashboard</h1>
        <p style={{ color: '#64748b', marginTop: 2 }}>Overview of consultant utilization and project allocations</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard icon={Users} label="Total Consultants" value={stats.total_consultants} sub={`${stats.unallocated_consultants} unallocated`} color="#6366f1" />
        <StatCard icon={FolderKanban} label="Active Projects" value={stats.active_projects} sub={`${stats.total_projects} total`} color="#10b981" />
        <StatCard icon={TrendingUp} label="Avg Utilization" value={`${stats.avg_utilization}%`} sub="across all consultants" color="#3b82f6" />
        <StatCard icon={AlertTriangle} label="Over-allocated" value={stats.overallocated_consultants} sub="consultants need attention" color="#f59e0b" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Utilization table */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 22, boxShadow: 'var(--shadow)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Current Utilization</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {utilization.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar name={c.name} color={c.avatar_color} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{c.role}</div>
                  <UtilizationBar allocated={c.allocated} capacity={c.capacity} height={5} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Project status pie */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 22, boxShadow: 'var(--shadow)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Projects by Status</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name} (${value})`} labelLine={false}>
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={PIE_COLORS[entry.name] || '#94a3b8'} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Department bar chart */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 22, boxShadow: 'var(--shadow)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Department Allocation</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData} barSize={16}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="allocation" fill="#6366f1" radius={[4, 4, 0, 0]} name="Avg %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent allocations */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 22, boxShadow: 'var(--shadow)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Recent Allocations</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recent_allocations.length === 0 && <p style={{ color: '#64748b', fontSize: 13 }}>No allocations yet.</p>}
            {recent_allocations.map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar name={a.consultant_name} color={a.avatar_color} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{a.consultant_name}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{a.project_name} · {a.client}</div>
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 700, color: '#6366f1',
                  background: '#e0e7ff', padding: '2px 8px', borderRadius: 20,
                }}>{a.allocation_percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
