import React, { useState } from 'react';

export const PasswordInput = ({ value, onChange, placeholder, id }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input 
        type={showPassword ? 'text' : 'password'}
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{ width: '100%', padding: '12px 14px', paddingRight: '45px', border: '2px solid #e0e0e0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
        onFocus={(e) => e.target.style.borderColor = '#1e3c72'}
        onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
        required 
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        style={{
          position: 'absolute',
          right: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 18,
          padding: 0,
          margin: 0,
          color: '#888'
        }}
      >
        {showPassword ? '🙈' : '👁️'}
      </button>
    </div>
  );
};