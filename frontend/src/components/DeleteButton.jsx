function DeleteButton({ onClick, className = '' }) {
  return (
    <button
      className={`delete-btn ${className}`}
      onClick={onClick}
      title="Usuń"
    >
      Usuń
    </button>
  );
}

export default DeleteButton;