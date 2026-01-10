import { useState, useEffect } from 'react';
import AddLoanForm from '../components/AddLoanForm';
import AddInstallmentForm from '../components/AddInstallmentForm';
import LoanList from '../components/LoanList';
import '../assets/styles/credit.css';

function CreditsDashboard() {
  const [showAddLoan, setShowAddLoan] = useState(false);
  const [showAddInstallment, setShowAddInstallment] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    document.title = 'Domator – Kredyty';
  }, []);

  function handleSuccess(type) {
    setRefreshTrigger(prev => prev + 1);
    if (type === 'loan') setShowAddLoan(false);
    if (type === 'installment') setShowAddInstallment(false);
    setMessage({ text: 'Dane zostały poprawnie zapisane.', type: 'success' });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  }

  function handleError(msg) {
    setMessage({ text: msg, type: 'error' });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  }

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <div className="credits-actions">
        <button onClick={() => setShowAddLoan(v => !v)} className="credit-toggle-btn">
          {showAddLoan ? 'Ukryj dodawanie kredytu' : 'Dodaj kredyt'}
        </button>
        {showAddLoan && <AddLoanForm onSuccess={() => handleSuccess('loan')} onError={handleError} />}

        <button onClick={() => setShowAddInstallment(v => !v)} className="credit-toggle-btn">
          {showAddInstallment ? 'Ukryj dodawanie raty' : 'Dodaj płatność'}
        </button>
        {showAddInstallment && <AddInstallmentForm onSuccess={() => handleSuccess('installment')} onError={handleError} />}
      </div>

      {message.text && (
        <div className={message.type === 'success' ? 'credit-success credit-message' : 'credit-error credit-message'}>
          {message.text}
        </div>
      )}

      <LoanList refreshTrigger={refreshTrigger} />
    </div>
  );
}

export default CreditsDashboard;
