import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, FolderKanban, ArrowLeftRight, Menu, X, ChevronRight,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/consultants', icon: Users, label: 'Consultants' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/allocations', icon: ArrowLeftRight, label: 'Allocations' },
];

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 60 : 220,
        background: '#1e1b4b',
        color: '#c7d2fe',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width .2s',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '20px 16px 18px',
          borderBottom: '1px solid rgba(255,255,255,.08)',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: '#6366f1',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            fontWeight: 700, color: '#fff', fontSize: 14,
          }}>R</div>
          {!collapsed && (
            <div>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: 13, lineHeight: 1.2 }}>ResourcIQ</div>
              <div style={{ fontSize: 10, opacity: .6 }}>Consultant Allocation</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px' }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 10px', borderRadius: 7, marginBottom: 2,
              color: isActive ? '#fff' : '#a5b4fc',
              background: isActive ? 'rgba(99,102,241,.35)' : 'transparent',
              fontWeight: isActive ? 600 : 400,
              fontSize: 13,
              transition: 'all .15s',
            })}>
              <Icon size={18} style={{ flexShrink: 0 }} />
              {!collapsed && <span>{label}</span>}
              {!collapsed && <ChevronRight size={12} style={{ marginLeft: 'auto', opacity: .4 }} />}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button onClick={() => setCollapsed(c => !c)} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 8, margin: 12, padding: '8px 10px', borderRadius: 7,
          border: '1px solid rgba(255,255,255,.12)', background: 'transparent',
          color: '#a5b4fc', fontSize: 12, cursor: 'pointer',
        }}>
          {collapsed ? <Menu size={16} /> : <><X size={16} /><span>Collapse</span></>}
        </button>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}
