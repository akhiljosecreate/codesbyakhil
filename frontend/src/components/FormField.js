import React from 'react';

const inputStyle = {
  width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0',
  borderRadius: 7, fontSize: 14, outline: 'none', background: '#fff',
  transition: 'border-color .15s',
};

export function FormField({ label, error, required, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
          {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
        </label>
      )}
      {children}
      {error && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>{error}</p>}
    </div>
  );
}

export function Input({ style, ...props }) {
  return <input style={{ ...inputStyle, ...style }} {...props} />;
}

export function Select({ style, children, ...props }) {
  return (
    <select style={{ ...inputStyle, ...style }} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ style, ...props }) {
  return <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 80, ...style }} {...props} />;
}

export function SkillsInput({ value = [], onChange }) {
  const [input, setInput] = React.useState('');

  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput('');
  };

  const remove = (skill) => onChange(value.filter(s => s !== skill));

  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type a skill and press Enter"
          style={{ ...inputStyle, flex: 1 }}
        />
        <button type="button" onClick={add} style={{
          padding: '8px 14px', background: '#6366f1', color: '#fff',
          border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600,
        }}>Add</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {value.map(skill => (
          <span key={skill} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 8px', background: '#e0e7ff', color: '#4338ca',
            borderRadius: 20, fontSize: 12, fontWeight: 500,
          }}>
            {skill}
            <button type="button" onClick={() => remove(skill)} style={{
              border: 'none', background: 'transparent', color: '#6366f1',
              padding: 0, cursor: 'pointer', lineHeight: 1, fontSize: 14,
            }}>×</button>
          </span>
        ))}
      </div>
    </div>
  );
}
