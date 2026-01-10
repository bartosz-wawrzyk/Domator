import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getLoanStatus, getLoanPayments } from '../api/loans';
import '../assets/styles/credit.css';

function PaymentModal({ payments, loanName, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="loan-name">{loanName}</div>
          <button className="modal-close-btn" onClick={onClose}>
            Zamknij
          </button>
        </div>

        {payments.length === 0 ? (
          <p>Brak wpłat</p>
        ) : (
          <div className="payment-list">
            {payments.map((p, i) => (
              <div key={i} className="payment-row">
                <span className="payment-date">{p.paid_at}</span>
                <span className="payment-amount">
                  <span className="amount-value">{p.amount}</span>{' '}
                  <span className="amount-currency">zł</span>
                </span>
                <span className="payment-type">
                  {p.type === 'installment' ? 'Rata' : 'Nadpłata'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LoanList({ refreshTrigger }) {
  const { user } = useContext(AuthContext);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentLoanName, setCurrentLoanName] = useState('');

  async function fetchLoans() {
    if (!user?.user_id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await getLoanStatus(user.user_id);
      
      if (!response.ok) {
        throw new Error(response.data?.detail || 'Błąd pobierania kredytów');
      }
      
      setLoans(response.data || []);
    } catch (err) {
      if (err.message.includes('No loans')) {
        setLoans([]);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLoans();
  }, [user?.user_id, refreshTrigger]);

  if (!user) return <p>Ładowanie danych użytkownika...</p>;
  if (loading) return <p>Ładowanie kredytów...</p>;
  if (error) return <p className="credit-error">{error}</p>;
  if (!loans.length) return <p>Brak kredytów.</p>;

  return (
    <>
      <div className="loan-grid-wrapper">
        <div className="loan-cell loan-cell-header">Nazwa</div>
        <div className="loan-cell loan-cell-header">Całkowita kwota</div>
        <div className="loan-cell loan-cell-header">Liczba rat</div>
        <div className="loan-cell loan-cell-header">Kwota raty</div>
        <div className="loan-cell loan-cell-header">Zapłacono</div>
        <div className="loan-cell loan-cell-header">Pozostało</div>
        <div className="loan-cell loan-cell-header">Liczba zapłaconych rat</div>
        <div className="loan-cell loan-cell-header">Przedpłaty</div>
        <div className="loan-cell loan-cell-header">Szczegóły</div>

        {loans.map((loan) => (
          <div className="loan-row" key={loan.loan_id}>
            <div className="loan-cell">{loan.name}</div>
            <div className="loan-cell">{loan.total_amount}</div>
            <div className="loan-cell">{loan.installments_count}</div>
            <div className="loan-cell">{loan.installment_amount}</div>
            <div className="loan-cell">{loan.total_paid}</div>
            <div className="loan-cell">{loan.remaining}</div>
            <div className="loan-cell">{loan.total_installments_paid}</div>
            <div className="loan-cell">{loan.total_prepayments}</div>
            <div className="loan-cell">
              <button
                className="details-btn"
                onClick={async () => {
                  const response = await getLoanPayments(loan.loan_id);
                  setSelectedPayments(response?.data || []);
                  setCurrentLoanName(loan.name);
                  setShowModal(true);
                }}
              >
                Szczegóły
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <PaymentModal
          payments={selectedPayments}
          loanName={currentLoanName}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

export default LoanList;