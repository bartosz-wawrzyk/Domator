import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getLoanStatus, getLoanPayments, deleteLoan, deletePayment } from '../api/loans';
import EditButton from '../components/EditButton';
import DeleteButton from '../components/DeleteButton';
import LoanEditModal from '../components/LoanEditModal';
import PaymentEditModal from '../components/PaymentEditModal';
import '../assets/styles/credit.css';

function PaymentModal({ payments, loanName, onClose, onPaymentUpdate }) {
  const [editingPayment, setEditingPayment] = useState(null);

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tę płatność?')) {
      return;
    }

    try {
      await deletePayment(paymentId);
      onPaymentUpdate();
    } catch (err) {
      alert(err.response?.data?.detail || 'Błąd usuwania płatności');
    }
  };

  return (
    <>
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
              {payments.map((p) => (
                <div key={p.id} className="payment-row-extended">
                  <div className="payment-info">
                    <span className="payment-date">{p.paid_at}</span>
                    <span className="payment-amount">
                      <span className="amount-value">{p.amount}</span>{' '}
                      <span className="amount-currency">zł</span>
                    </span>
                    <span className="payment-type">
                      {p.type === 'installment' ? 'Rata' : 'Nadpłata'}
                    </span>
                  </div>
                  <div className="payment-actions">
                    <EditButton onClick={() => setEditingPayment(p)} />
                    <DeleteButton onClick={() => handleDeletePayment(p.id)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {editingPayment && (
        <PaymentEditModal
          payment={editingPayment}
          onClose={() => setEditingPayment(null)}
          onSuccess={() => {
            setEditingPayment(null);
            onPaymentUpdate();
          }}
        />
      )}
    </>
  );
}

function LoanList({ refreshTrigger }) {
  const { user } = useContext(AuthContext);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentLoanId, setCurrentLoanId] = useState(null);
  const [currentLoanName, setCurrentLoanName] = useState('');
  const [editingLoan, setEditingLoan] = useState(null);

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

  async function fetchPaymentsForLoan(loanId) {
    const response = await getLoanPayments(loanId);
    setSelectedPayments(response?.data || []);
  }

  const handleShowPayments = async (loan) => {
    await fetchPaymentsForLoan(loan.loan_id);
    setCurrentLoanId(loan.loan_id);
    setCurrentLoanName(loan.name);
    setShowPaymentModal(true);
  };

  const handleDeleteLoan = async (loanId) => {
    if (!window.confirm('Czy na pewno chcesz usunąć ten kredyt?')) {
      return;
    }

    try {
      const response = await deleteLoan(loanId);
      
      if (!response.ok) {
        if (response.status === 400 || response.status === 403) {
          throw new Error('Nie można usunąć kredytu, który ma płatności');
        }
        throw new Error(response.data?.detail || 'Błąd usuwania kredytu');
      }

      fetchLoans();
    } catch (err) {
      alert(`Błąd: ${err.message}`);
    }
  };

  const handlePaymentUpdate = async () => {
    if (currentLoanId) {
      await fetchPaymentsForLoan(currentLoanId);
    }
    fetchLoans();
  };

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
        <div className="loan-cell loan-cell-header">Nadpłaty</div>
        <div className="loan-cell loan-cell-header">Akcje</div>

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
            <div className="loan-cell loan-cell-actions">
              <button
                className="details-btn"
                onClick={() => handleShowPayments(loan)}
              >
                Szczegóły
              </button>
              <EditButton onClick={() => setEditingLoan(loan)} />
              <DeleteButton onClick={() => handleDeleteLoan(loan.loan_id)} />
            </div>
          </div>
        ))}
      </div>

      {showPaymentModal && (
        <PaymentModal
          payments={selectedPayments}
          loanName={currentLoanName}
          onClose={() => setShowPaymentModal(false)}
          onPaymentUpdate={handlePaymentUpdate}
        />
      )}

      {editingLoan && (
        <LoanEditModal
          loan={editingLoan}
          onClose={() => setEditingLoan(null)}
          onSuccess={() => {
            setEditingLoan(null);
            fetchLoans();
          }}
        />
      )}
    </>
  );
}

export default LoanList;