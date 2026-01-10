function Button({ children, onClick, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        padding: '10px 16px',
        cursor: 'pointer',
        fontSize: '16px'
      }}
    >
      {children}
    </button>
  );
}

export default Button;