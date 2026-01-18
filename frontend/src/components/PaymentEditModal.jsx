import { useState } from 'react';
import { updatePayment } from '../api/loans';

function PaymentEditModal({ payment, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    amount: payment.amount,
    type: payment.type,
    paid_at: payment.paid_at,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await updatePayment(payment.payment_id, formData);
      
      if (!response.ok) {
        throw new Error(response.data?.detail || 'Błąd aktualizacji płatności');
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
      <div className="modal-content modal-content-small" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="loan-name">Edytuj płatność</div>
          <button className="modal-close-btn" onClick={onClose}>
            Zamknij
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-group">
            <label>Kwota</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label>Typ</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value="installment">Rata</option>
              <option value="prepayment">Nadpłata</option>
            </select>
          </div>

          <div className="form-group">
            <label>Data płatności</label>
            <input
              type="date"
              name="paid_at"
              value={formData.paid_at}
              onChange={handleChange}
              required
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

export default PaymentEditModal;