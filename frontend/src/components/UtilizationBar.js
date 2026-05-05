import React from 'react';

export default function UtilizationBar({ allocated, capacity = 100, showLabel = true, height = 6 }) {
  const pct = Math.min((allocated / capacity) * 100, 100);
  const over = allocated > capacity;
  const color = over ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#10b981';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        flex: 1, height, background: '#e2e8f0', borderRadius: height,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: color, borderRadius: height,
          transition: 'width .3s',
        }} />
      </div>
      {showLabel && (
        <span style={{ fontSize: 12, fontWeight: 600, color, minWidth: 36, textAlign: 'right' }}>
          {allocated}%
        </span>
      )}
    </div>
  );
}
