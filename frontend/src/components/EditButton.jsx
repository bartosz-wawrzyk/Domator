function EditButton({ onClick, className = '' }) {
  return (
    <button
      className={`edit-btn ${className}`}
      onClick={onClick}
      title="Edytuj"
    >
      Edytuj
    </button>
  );
}

export default EditButton;