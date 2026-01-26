import { useState } from 'react';

function Input({ type = 'text', placeholder, value, onChange, isPassword = false }) {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        type={inputType}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="auth-input"
        style={{
          paddingRight: isPassword ? '60px' : '14px'
        }}
      />
      {isPassword && (
        <span
          onClick={() => setShowPassword(!showPassword)}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            cursor: 'pointer',
            color: 'white',
            fontWeight: '600',
            fontSize: '12px',
            userSelect: 'none',
            padding: '2px 4px',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '4px'
          }}
        >
          {showPassword ? 'Ukryj' : 'Pokaż'}
        </span>
      )}
    </div>
  );
}

export default Input;