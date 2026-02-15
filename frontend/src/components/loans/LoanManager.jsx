import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import * as loansApi from '../../api/loans';

function LoanManager() {
  const { user } = useContext(AuthContext);

  const [loans, setLoans] = useState([]);
  const [selectedLoanForPayments, setSelectedLoanForPayments] = useState(null);
  const [payments, setPayments] = useState([]);

  const [loanFormData, setLoanFormData] = useState({
    name: '',
    total_amount: 0,
    installments_count: 0,
    due_day: 1,
    installment_amount: 0,
  });

  const [paymentFormData, setPaymentFormData] = useState({
    amount: 0,
    type: 'installment',
    paid_at: new Date().toISOString().split('T')[0],
  });

  const [editingLoanId, setEditingLoanId] = useState(null);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadLoans = async () => {
    if (!user?.user_id) {
      setError('Brak danych użytkownika');
      return;
    }

    setLoading(true);
    try {
      const response = await loansApi.getLoanStatus(user.user_id);
      
      let data;
      if (Array.isArray(response)) {
        data = response;
      } else if (response?.data && Array.isArray(response.data)) {
        data = response.data;
      } else if (response?.ok && Array.isArray(response.data)) {
        data = response.data;
      } else {
        console.error('Unexpected response format:', response);
        data = [];
      }
      
      setLoans(data);
      setError(null);
    } catch (err) {
      console.error('Błąd ładowania kredytów:', err);
      if (err.message.includes('No loans') || err.message.includes('404')) {
        setLoans([]);
        setError(null);
      } else {
        setError(err.message || 'Nie udało się załadować kredytów');
      }
      setLoans([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async (loanId) => {
    setLoading(true);
    try {
      const response = await loansApi.getLoanPayments(loanId);
      
      let data;
      if (Array.isArray(response)) {
        data = response;
      } else if (response?.data && Array.isArray(response.data)) {
        data = response.data;
      } else if (response?.ok && Array.isArray(response.data)) {
        data = response.data;
      } else {
        data = [];
      }
      
      setPayments(data);
    } catch (err) {
      console.error('Błąd ładowania płatności:', err);
      setError('Nie udało się załadować historii wpłat');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLoans();
  }, [user?.user_id]);

  const resetLoanForm = () => {
    setLoanFormData({
      name: '',
      total_amount: 0,
      installments_count: 0,
      due_day: 1,
      installment_amount: 0,
    });
    setEditingLoanId(null);
  };

  const resetPaymentForm = () => {
    setPaymentFormData({
      amount: 0,
      type: 'installment',
      paid_at: new Date().toISOString().split('T')[0],
    });
    setEditingPaymentId(null);
  };

  const handleLoanSubmit = async (e) => {
    e.preventDefault();

    if (!loanFormData.name.trim()) {
      setError('Nazwa kredytu jest wymagana');
      return;
    }
    if (loanFormData.total_amount <= 0) {
      setError('Kwota kredytu musi być większa od 0');
      return;
    }
    if (loanFormData.installments_count <= 0) {
      setError('Liczba rat musi być większa od 0');
      return;
    }
    if (loanFormData.due_day < 1 || loanFormData.due_day > 31) {
      setError('Dzień spłaty musi być w zakresie 1-31');
      return;
    }
    if (loanFormData.installment_amount <= 0) {
      setError('Kwota raty musi być większa od 0');
      return;
    }

    try {
      if (editingLoanId) {
        await loansApi.updateLoan(editingLoanId, loanFormData);
      } else {
        await loansApi.createLoan(loanFormData);
      }
      resetLoanForm();
      await loadLoans();
      setError(null);
    } catch (err) {
      console.error('Błąd zapisu kredytu:', err);
      setError(err.message || 'Nie udało się zapisać kredytu');
    }
  };

  const startEditLoan = (loan) => {
    setEditingLoanId(loan.loan_id || loan.id);
    setLoanFormData({
      name: loan.name,
      total_amount: loan.total_amount,
      installments_count: loan.installments_count,
      due_day: loan.due_day,
      installment_amount: loan.installment_amount,
    });
  };

  const handleDeleteLoan = async (loanId) => {
    if (!window.confirm('Czy na pewno chcesz usunąć ten kredyt? Nie będzie można go przywrócić.')) {
      return;
    }

    try {
      await loansApi.deleteLoan(loanId);
      await loadLoans();
      setError(null);
    } catch (err) {
      console.error('Błąd usuwania kredytu:', err);
      setError(err.message || 'Nie można usunąć kredytu, który ma płatności');
    }
  };

  const openPaymentsView = async (loan) => {
    setSelectedLoanForPayments(loan);
    await loadPayments(loan.loan_id || loan.id);
  };

  const closePaymentsView = () => {
    setSelectedLoanForPayments(null);
    setPayments([]);
    resetPaymentForm();
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    if (paymentFormData.amount <= 0) {
      setError('Kwota płatności musi być większa od 0');
      return;
    }

    try {
      if (editingPaymentId) {
        await loansApi.updatePayment(editingPaymentId, paymentFormData);
      } else {
        await loansApi.addPayment({
          loan_id: selectedLoanForPayments.loan_id || selectedLoanForPayments.id,
          ...paymentFormData,
        });
      }
      
      await loadPayments(selectedLoanForPayments.loan_id || selectedLoanForPayments.id);
      await loadLoans();
      resetPaymentForm();
      setError(null);
    } catch (err) {
      console.error('Błąd zapisu płatności:', err);
      setError(err.message || 'Nie udało się zapisać płatności');
    }
  };

  const startEditPayment = (payment) => {
    setEditingPaymentId(payment.id);
    setPaymentFormData({
      amount: payment.amount,
      type: payment.type,
      paid_at: payment.paid_at,
    });
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Usunąć tę płatność?')) return;

    try {
      await loansApi.deletePayment(paymentId);
      await loadPayments(selectedLoanForPayments.loan_id || selectedLoanForPayments.id);
      await loadLoans();
      setError(null);
    } catch (err) {
      console.error('Błąd usuwania płatności:', err);
      setError('Nie udało się usunąć płatności');
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(amount);
  };

  return (
    <div className="tab-pane">
      <h3>💰 Kredyty i pożyczki</h3>

      {error && <div className="credit-message credit-error">{error}</div>}

      {selectedLoanForPayments ? (
        <div className="payment-view">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '20px' 
          }}>
            <h4>
              Historia płatności: <strong>{selectedLoanForPayments.name}</strong>
            </h4>
            <button 
              className="loan-cancel-btn" 
              onClick={closePaymentsView}
            >
              Powrót do listy kredytów
            </button>
          </div>

          <div className="loan-summary-box">
            <div className="summary-item">
              <span>Kwota kredytu:</span>
              <strong>{formatAmount(selectedLoanForPayments.total_amount)}</strong>
            </div>
            <div className="summary-item">
              <span>Spłacono:</span>
              <strong className="text-success">{formatAmount(selectedLoanForPayments.total_paid || 0)}</strong>
            </div>
            <div className="summary-item">
              <span>Pozostało:</span>
              <strong className="text-warning">{formatAmount(selectedLoanForPayments.remaining || selectedLoanForPayments.total_amount)}</strong>
            </div>
          </div>

          <form className="planer-form" onSubmit={handlePaymentSubmit}>
            <p>Dodaj ratę lub nadpłatę:</p>
            <div className="planer-form-row">
              <input
                type="number"
                step="0.01"
                placeholder="Kwota"
                value={paymentFormData.amount || ''}
                onChange={(e) => setPaymentFormData(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))}
                required
              />
              <select
                value={paymentFormData.type}
                onChange={(e) => setPaymentFormData(p => ({ ...p, type: e.target.value }))}
              >
                <option value="installment">Rata</option>
                <option value="prepayment">Nadpłata</option>
              </select>
              <input
                type="date"
                value={paymentFormData.paid_at}
                onChange={(e) => setPaymentFormData(p => ({ ...p, paid_at: e.target.value }))}
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button className="planer-btn-submit" type="submit">
                {editingPaymentId ? 'Zapisz zmiany' : 'Dodaj płatność'}
              </button>
              {editingPaymentId && (
                <button 
                  type="button" 
                  className="loan-cancel-btn" 
                  onClick={resetPaymentForm}
                >
                  Anuluj
                </button>
              )}
            </div>
          </form>

          <div style={{ marginTop: '20px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1.5fr 1.5fr 1.5fr',
              gap: '15px',
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderBottom: '2px solid rgba(37, 117, 252, 0.5)',
              fontWeight: 'bold',
              color: 'white',
              borderRadius: '8px 8px 0 0'
            }}>
              <div>Data</div>
              <div>Kwota</div>
              <div>Typ</div>
              <div>Akcje</div>
            </div>

            {payments.map((payment, idx) => (
              <div 
                key={payment.id} 
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1.5fr 1.5fr 1.5fr',
                  gap: '15px',
                  padding: '12px 16px',
                  background: idx % 2 === 0 ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.35)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  alignItems: 'center',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(42, 42, 42, 0.6)'}
                onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.35)'}
              >
                <div style={{ fontWeight: '600' }}>{payment.paid_at}</div>

                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#42e695' }}>
                  {formatAmount(payment.amount)}
                </div>

                <div>
                  <span style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    background: payment.type === 'installment' ? 'rgba(37, 117, 252, 0.2)' : 'rgba(66, 230, 149, 0.2)',
                    color: payment.type === 'installment' ? '#2575fc' : '#42e695',
                    border: payment.type === 'installment' ? '1px solid rgba(37, 117, 252, 0.3)' : '1px solid rgba(66, 230, 149, 0.3)'
                  }}>
                    {payment.type === 'installment' ? '📅 Rata' : '⬆️ Nadpłata'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="action-btn-inline secondary"
                    onClick={() => startEditPayment(payment)}
                  >
                    ✏️ Edytuj
                  </button>
                  <button 
                    className="action-btn-inline danger"
                    onClick={() => handleDeletePayment(payment.id)}
                  >
                    🗑️ Usuń
                  </button>
                </div>
              </div>
            ))}

            {payments.length === 0 && (
              <p style={{ textAlign: 'center', padding: '40px', opacity: 0.5, color: 'white' }}>
                Brak płatności dla tego kredytu
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '30px' }}>
            <p>Dodaj nowy kredyt lub edytuj istniejący:</p>
            <form className="planer-form" onSubmit={handleLoanSubmit}>
              <input
                placeholder="Nazwa kredytu (np. Kredyt hipoteczny PKO)"
                value={loanFormData.name}
                onChange={(e) => setLoanFormData(p => ({ ...p, name: e.target.value }))}
                required
              />
              <div className="planer-form-row">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Kwota całkowita"
                  value={loanFormData.total_amount || ''}
                  onChange={(e) => setLoanFormData(p => ({ ...p, total_amount: parseFloat(e.target.value) || 0 }))}
                  required
                />
                <input
                  type="number"
                  placeholder="Liczba rat"
                  value={loanFormData.installments_count || ''}
                  onChange={(e) => setLoanFormData(p => ({ ...p, installments_count: parseInt(e.target.value) || 0 }))}
                  required
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', opacity: 0.8 }}>Dzień spłaty (1-31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="Dzień spłaty"
                    value={loanFormData.due_day || ''}
                    onChange={(e) => setLoanFormData(p => ({ ...p, due_day: parseInt(e.target.value) || 1 }))}
                    required
                  />
                </div>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Kwota raty"
                  value={loanFormData.installment_amount || ''}
                  onChange={(e) => setLoanFormData(p => ({ ...p, installment_amount: parseFloat(e.target.value) || 0 }))}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="planer-btn-submit" type="submit">
                  {editingLoanId ? 'Zaktualizuj kredyt' : 'Dodaj kredyt'}
                </button>
                {editingLoanId && (
                  <button type="button" className="loan-cancel-btn" onClick={resetLoanForm}>
                    Anuluj
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="loan-list">
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 3fr 1.5fr',
              gap: '20px',
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderBottom: '2px solid rgba(37, 117, 252, 0.5)',
              fontWeight: 'bold',
              color: 'white'
            }}>
              <div>Kredyt</div>
              <div>Podsumowanie</div>
              <div>Akcje</div>
            </div>

            {loans.map((loan, idx) => {
              const loanId = loan.loan_id || loan.id;
              const remaining = loan.remaining || (loan.total_amount - (loan.total_paid || 0));
              const progress = ((loan.total_paid || 0) / loan.total_amount) * 100;

              return (
                <div 
                  key={loanId} 
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 3fr 1.5fr',
                    gap: '20px',
                    padding: '20px 16px',
                    background: idx % 2 === 0 ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.35)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    color: 'white',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(42, 42, 42, 0.6)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.35)'}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: '700' }}>
                      {loan.name}
                    </div>
                    <div style={{ fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ opacity: 0.8 }}>Kwota raty:</span>
                      <span style={{ fontWeight: '600' }}>{formatAmount(loan.installment_amount)}</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ opacity: 0.8 }}>Dzień spłaty:</span>
                      <span style={{ fontWeight: '600' }}>{loan.due_day}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ opacity: 0.8 }}>Kredyt:</span>
                      <span style={{ fontWeight: '600' }}>{formatAmount(loan.total_amount)}</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ opacity: 0.8 }}>Spłacono:</span>
                      <span style={{ fontWeight: '600', color: '#42e695' }}>{formatAmount(loan.total_paid || 0)}</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ opacity: 0.8 }}>Pozostało:</span>
                      <span style={{ fontWeight: '600', color: remaining <= 0 ? '#42e695' : '#ffa726' }}>
                        {formatAmount(Math.max(remaining, 0))}
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      marginTop: '4px'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(progress, 100)}%`,
                        background: progress >= 100 ? 'linear-gradient(90deg, #42e695, #42e695)' : 'linear-gradient(90deg, #42e695, #3bb2b8)',
                        borderRadius: '10px',
                        transition: 'width 0.3s ease'
                      }}></div>
                    </div>
                    {remaining <= 0 && (
                      <div style={{
                        marginTop: '4px',
                        padding: '6px 12px',
                        background: 'rgba(66, 230, 149, 0.2)',
                        border: '1px solid rgba(66, 230, 149, 0.4)',
                        borderRadius: '6px',
                        color: '#42e695',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        textAlign: 'center'
                      }}>
                        ✅ KREDYT SPŁACONY
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button 
                      className="action-btn primary full-width"
                      onClick={() => openPaymentsView(loan)}
                    >
                      📊 Szczegóły
                    </button>
                    <button 
                      className="action-btn secondary full-width"
                      onClick={() => startEditLoan(loan)}
                    >
                      ✏️ Edytuj
                    </button>
                    <button 
                      className="action-btn danger full-width"
                      onClick={() => handleDeleteLoan(loanId)}
                    >
                      🗑️ Usuń
                    </button>
                  </div>
                </div>
              );
            })}

            {loans.length === 0 && !loading && (
              <p style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
                Nie masz jeszcze żadnych kredytów. Dodaj pierwszy powyżej.
              </p>
            )}

            {loading && (
              <p style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
                Ładowanie kredytów...
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default LoanManager;