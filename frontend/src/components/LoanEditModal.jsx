import { useState } from 'react';
import { updateLoan } from '../api/loans';

function LoanEditModal({ loan, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: loan.name,
    total_amount: loan.total_amount,
    installments_count: loan.installments_count,
    due_day: loan.due_day,
    installment_amount: loan.installment_amount,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'name' ? value : Number(value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await updateLoan(loan.loan_id, formData);
      
      if (!response.ok) {
        throw new Error(response.data?.detail || 'Błąd aktualizacji kredytu');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="loan-name">Edytuj kredyt: {loan.name}</div>
          <button className="modal-close-btn" onClick={onClose}>
            Zamknij
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-group">
            <label>Nazwa</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Całkowita kwota</label>
            <input
              type="number"
              name="total_amount"
              value={formData.total_amount}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label>Liczba rat</label>
            <input
              type="number"
              name="installments_count"
              value={formData.installments_count}
              onChange={handleChange}
              required
              min="1"
            />
          </div>

          <div className="form-group">
            <label>Dzień płatności</label>
            <input
              type="number"
              name="due_day"
              value={formData.due_day}
              onChange={handleChange}
              required
              min="1"
              max="31"
            />
          </div>

          <div className="form-group">
            <label>Kwota raty</label>
            <input
              type="number"
              name="installment_amount"
              value={formData.installment_amount}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
            />
          </div>

          {error && <p className="credit-error">{error}</p>}

          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Zapisywanie...' : 'Zapisz'}
            </button>
            <button type="button" onClick={onClose}>
              Anuluj
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoanEditModal;