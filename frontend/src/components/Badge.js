import React from 'react';

const variants = {
  active:    { bg: '#dcfce7', color: '#16a34a' },
  planning:  { bg: '#fef9c3', color: '#ca8a04' },
  completed: { bg: '#f1f5f9', color: '#475569' },
  'on-hold': { bg: '#fee2e2', color: '#dc2626' },
  available: { bg: '#dcfce7', color: '#16a34a' },
  busy:      { bg: '#fef3c7', color: '#d97706' },
  unavailable:{ bg: '#fee2e2', color: '#dc2626' },
  critical:  { bg: '#fee2e2', color: '#dc2626' },
  high:      { bg: '#ffedd5', color: '#ea580c' },
  medium:    { bg: '#fef9c3', color: '#ca8a04' },
  low:       { bg: '#f0fdf4', color: '#16a34a' },
};

export default function Badge({ label, variant }) {
  const style = variants[variant] || variants[label?.toLowerCase()] || { bg: '#f1f5f9', color: '#475569' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 20,
      fontSize: 11, fontWeight: 600, letterSpacing: .3,
      background: style.bg, color: style.color,
      textTransform: 'capitalize',
    }}>
      {label}
    </span>
  );
}
