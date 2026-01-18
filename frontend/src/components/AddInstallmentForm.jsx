import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getLoanStatus, addPayment } from '../api/loans';
import '../assets/styles/credit.css';

function AddInstallmentForm({ onSuccess }) {
  const { user } = useContext(AuthContext);
  const [loans, setLoans] = useState([]);
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentType, setPaymentType] = useState('installment');
  const [paidAt, setPaidAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  async function fetchLoans() {
    setLoading(true);
    setError(null);
    try {
      const response = await getLoanStatus(user.user_id);
      
      if (!response.ok) {
        throw new Error(response.data?.detail || 'Błąd pobierania kredytów');
      }
      
      setLoans(response.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLoans();
  }, [user.user_id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedLoanId) return setError('Wybierz kredyt');
    if (!paidAt) return setError('Wybierz datę płatności');

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) return setError('Nieprawidłowa kwota');

    try {
      await addPayment({
        loan_id: selectedLoanId,
        amount: parsedAmount,
        type: paymentType,
        paid_at: paidAt,
      });

      setSuccess('Płatność dodana pomyślnie!');
      setAmount('');
      setSelectedLoanId('');
      setPaymentType('installment');
      setPaidAt('');
      
      setTimeout(() => {
        setSuccess(null);
        onSuccess?.();
      }, 3000);
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p>Ładowanie kredytów...</p>;
  if (!loans.length) return <p>Brak kredytów. Najpierw dodaj kredyt.</p>;

  return (
    <form onSubmit={handleSubmit} className="credit-form">
      <div className="credit-form-fields">
        <select value={selectedLoanId} onChange={e => setSelectedLoanId(e.target.value)} required>
          <option value="">-- wybierz kredyt --</option>
          {loans.map(loan => (
            <option key={loan.loan_id} value={loan.loan_id}>
              {loan.name} (pozostało: {loan.remaining})
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Kwota płatności"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          required
        />

        <input
          type="date"
          value={paidAt}
          onChange={e => setPaidAt(e.target.value)}
          required
        />

        <select value={paymentType} onChange={e => setPaymentType(e.target.value)} required>
          <option value="installment">Rata</option>
          <option value="prepayment">Nadpłata</option>
        </select>
      </div>

      {error && <p className="credit-message credit-error">{error}</p>}
      {success && <p className="credit-message credit-success">{success}</p>}

      <button type="submit">Dodaj płatność</button>
    </form>
  );
}

export default AddInstallmentForm;
