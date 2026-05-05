import React from 'react';

function initials(name = '') {
  return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
}

export default function Avatar({ name, color = '#6366f1', size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.33, fontWeight: 700, flexShrink: 0,
    }}>
      {initials(name)}
    </div>
  );
}
