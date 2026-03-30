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
      
      if (selectedLoanForPayments) {
        const updatedLoan = data.find(l => (l.loan_id || l.id) === (selectedLoanForPayments.loan_id || selectedLoanForPayments.id));
        if (updatedLoan) {
          setSelectedLoanForPayments(updatedLoan);
        }
      }
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

  const refreshData = async () => {
    await loadLoans();
    if (selectedLoanForPayments) {
      await loadPayments(selectedLoanForPayments.loan_id || selectedLoanForPayments.id);
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
      await refreshData();
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
      if (!window.confirm('Czy na pewno chcesz usunąć ten kredyt? Tej operacji nie można cofnąć.')) {
        return;
      }

      setError(null);
      setLoading(true);

      try {
        const res = await loansApi.deleteLoan(loanId);

        if (!res.ok) {
          let msg = 'Wystąpił błąd podczas usuwania kredytu.';

          if (res.status === 400) {
            msg = 'Nie można usunąć kredytu, który posiada historię płatności. Najpierw usuń wszystkie powiązane raty.';
          } else if (res.status === 401) {
            msg = 'Twoja sesja wygasła. Zaloguj się ponownie.';
          }

          setError(msg);
          return;
        }

        await loadLoans();
        setError(null);

      } catch (err) {
        setError('Błąd połączenia z serwerem. Spróbuj ponownie później.');
      } finally {
        setLoading(false);
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

      await refreshData();
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
      await refreshData();
      setError(null);
    } catch (err) {
      console.error('Błąd usuwania płatności:', err);
      setError('Nie udało się usunąć płatności');
    }
  };

  const formatAmount = (amount) =>
    new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(amount);

  if (loading && loans.length === 0 && !selectedLoanForPayments) {
    return <p className="loan-loading">Ładowanie kredytów...</p>;
  }

  return (
    <div>
      <p className="loan-section-title">💰 Kredyty i pożyczki</p>

      {error && <div className="loan-alert error">{error}</div>}

      {selectedLoanForPayments ? (
        <div className="loan-payment-view">

          <div className="loan-payments-header">
            <p className="loan-payments-title">
              Historia płatności: <strong>{selectedLoanForPayments.name}</strong>
            </p>
            <button className="loan-btn-secondary" onClick={closePaymentsView}>
              ← Powrót do listy kredytów
            </button>
          </div>

          <div className="loan-summary-box">
            <div className="loan-summary-item">
              <span>Kwota kredytu</span>
              <strong>{formatAmount(selectedLoanForPayments.total_amount)}</strong>
            </div>
            <div className="loan-summary-item">
              <span>Spłacono</span>
              <strong className="paid">{formatAmount(selectedLoanForPayments.total_paid || 0)}</strong>
            </div>
            <div className="loan-summary-item">
              <span>Pozostało</span>
              <strong className="remaining">
                {formatAmount(selectedLoanForPayments.remaining ?? selectedLoanForPayments.total_amount)}
              </strong>
            </div>
          </div>

          <div className="loan-payment-form">
            <p className="loan-form-title">
              {editingPaymentId ? '✏️ Edycja płatności' : '➕ Dodaj ratę lub nadpłatę'}
            </p>
            <form onSubmit={handlePaymentSubmit}>
              <div className="loan-payment-form-row">
                <div className="loan-form-group">
                  <label className="loan-form-label">Kwota</label>
                  <input
                    className="loan-input"
                    type="number"
                    step="0.01"
                    placeholder="np. 1200.00"
                    value={paymentFormData.amount || ''}
                    onChange={(e) =>
                      setPaymentFormData((p) => ({ ...p, amount: parseFloat(e.target.value) || 0 }))
                    }
                    required
                  />
                </div>
                <div className="loan-form-group">
                  <label className="loan-form-label">Typ</label>
                  <select
                    className="loan-select"
                    value={paymentFormData.type}
                    onChange={(e) => setPaymentFormData((p) => ({ ...p, type: e.target.value }))}
                  >
                    <option value="installment">Rata</option>
                    <option value="prepayment">Nadpłata</option>
                  </select>
                </div>
                <div className="loan-form-group">
                  <label className="loan-form-label">Data</label>
                  <input
                    className="loan-input"
                    type="date"
                    value={paymentFormData.paid_at}
                    onChange={(e) => setPaymentFormData((p) => ({ ...p, paid_at: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="loan-form-actions" style={{ marginTop: '14px' }}>
                <button className="loan-btn-primary" type="submit">
                  {editingPaymentId ? 'Zapisz zmiany' : 'Dodaj płatność'}
                </button>
                {editingPaymentId && (
                  <button type="button" className="loan-btn-secondary" onClick={resetPaymentForm}>
                    Anuluj
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="loan-table-header">
            <div>Data</div>
            <div>Kwota</div>
            <div>Typ</div>
            <div className="actions-right">Akcje</div>
          </div>

          {payments.map((payment) => (
            <div key={payment.id} className="loan-table-row">
              <div className="loan-table-cell-date">{payment.paid_at}</div>
              <div className="loan-table-cell-amount">{formatAmount(payment.amount)}</div>
              <div>
                <span className={`loan-payment-badge ${payment.type}`}>
                  {payment.type === 'installment' ? '📅 Rata' : '⬆️ Nadpłata'}
                </span>
              </div>
              <div className="loan-table-cell-actions actions-right">
                <button className="loan-btn-icon" onClick={() => startEditPayment(payment)}>
                  ✏️ Edytuj
                </button>
                <button className="loan-btn-danger" onClick={() => handleDeletePayment(payment.id)}>
                  🗑️ Usuń
                </button>
              </div>
            </div>
          ))}

          {payments.length === 0 && (
            <p className="loan-empty">Brak płatności dla tego kredytu.</p>
          )}
        </div>

      ) : (
        <>
          <div className="loan-form">
            <p className="loan-form-title">
              {editingLoanId ? '✏️ Edycja kredytu' : '➕ Nowy kredyt'}
            </p>
            <form onSubmit={handleLoanSubmit}>
              <div className="loan-form-grid">
                <div className="loan-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="loan-form-label">Nazwa kredytu</label>
                  <input
                    className="loan-input"
                    placeholder="np. Kredyt hipoteczny PKO"
                    value={loanFormData.name}
                    onChange={(e) => setLoanFormData((p) => ({ ...p, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="loan-form-group">
                  <label className="loan-form-label">Kwota całkowita</label>
                  <input
                    className="loan-input"
                    type="number"
                    step="0.01"
                    placeholder="np. 250000"
                    value={loanFormData.total_amount || ''}
                    onChange={(e) =>
                      setLoanFormData((p) => ({ ...p, total_amount: parseFloat(e.target.value) || 0 }))
                    }
                    required
                  />
                </div>
                <div className="loan-form-group">
                  <label className="loan-form-label">Liczba rat</label>
                  <input
                    className="loan-input"
                    type="number"
                    placeholder="np. 360"
                    value={loanFormData.installments_count || ''}
                    onChange={(e) =>
                      setLoanFormData((p) => ({
                        ...p,
                        installments_count: parseInt(e.target.value) || 0,
                      }))
                    }
                    required
                  />
                </div>
                <div className="loan-form-group">
                  <label className="loan-form-label">Dzień spłaty (1–31)</label>
                  <input
                    className="loan-input"
                    type="number"
                    min="1"
                    max="31"
                    placeholder="np. 10"
                    value={loanFormData.due_day || ''}
                    onChange={(e) =>
                      setLoanFormData((p) => ({ ...p, due_day: parseInt(e.target.value) || 1 }))
                    }
                    required
                  />
                </div>
                <div className="loan-form-group">
                  <label className="loan-form-label">Kwota raty</label>
                  <input
                    className="loan-input"
                    type="number"
                    step="0.01"
                    placeholder="np. 1200.00"
                    value={loanFormData.installment_amount || ''}
                    onChange={(e) =>
                      setLoanFormData((p) => ({
                        ...p,
                        installment_amount: parseFloat(e.target.value) || 0,
                      }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="loan-form-actions">
                <button className="loan-btn-primary" type="submit">
                  {editingLoanId ? 'Zaktualizuj kredyt' : 'Dodaj kredyt'}
                </button>
                {editingLoanId && (
                  <button type="button" className="loan-btn-secondary" onClick={resetLoanForm}>
                    Anuluj
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="loan-list-header">
            <div>Kredyt</div>
            <div className="summary-header">Podsumowanie</div>
            <div className="actions-right">Akcje</div>
          </div>

          <div className="loan-list">
            {loans.map((loan) => {
              const loanId = loan.loan_id || loan.id;
              const remaining = loan.remaining ?? (loan.total_amount - (loan.total_paid || 0));
              const progress = Math.min(((loan.total_paid || 0) / loan.total_amount) * 100, 100);
              const isPaid = remaining <= 0;

              return (
                <div key={loanId} className="loan-card">
                  <div className="loan-card-icon">💰</div>

                  <div className="loan-card-info">
                    <div className="loan-card-title">{loan.name}</div>
                    <div className="loan-card-meta">
                      <span className="loan-meta-item">
                        📅 Rata: <strong>{formatAmount(loan.installment_amount)}</strong>
                      </span>
                      <span className="loan-meta-item">
                        🗓️ Dzień spłaty: <strong>{loan.due_day}</strong>
                      </span>
                      <span className="loan-meta-item">
                        📋 Rat: <strong>{loan.installments_count}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="loan-card-progress">
                    <div className="loan-progress-row">
                      <span>Kredyt:</span>
                      <strong>{formatAmount(loan.total_amount)}</strong>
                    </div>
                    <div className="loan-progress-row">
                      <span>Spłacono:</span>
                      <strong className="paid">{formatAmount(loan.total_paid || 0)}</strong>
                    </div>
                    <div className="loan-progress-row">
                      <span>Pozostało:</span>
                      <strong className={isPaid ? 'done' : 'remaining'}>
                        {formatAmount(Math.max(remaining, 0))}
                      </strong>
                    </div>

                    <div className="loan-progress-bar-wrap">
                      <div
                        className={`loan-progress-bar-fill${isPaid ? ' complete' : ''}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    {isPaid && (
                      <span className="loan-badge-paid">✅ KREDYT SPŁACONY</span>
                    )}
                  </div>

                  <div className="loan-card-actions">
                    <button
                      className="loan-btn-primary loan-btn-block"
                      onClick={() => openPaymentsView(loan)}
                    >
                      📊 Szczegóły
                    </button>
                    <button
                      className="loan-btn-secondary loan-btn-block"
                      onClick={() => startEditLoan(loan)}
                    >
                      ✏️ Edytuj
                    </button>
                    <button
                      className="loan-btn-danger loan-btn-block"
                      onClick={() => handleDeleteLoan(loanId)}
                    >
                      🗑️ Usuń
                    </button>
                  </div>
                </div>
              );
            })}

            {loans.length === 0 && !loading && (
              <p className="loan-empty">
                Nie masz jeszcze żadnych kredytów. Dodaj pierwszy powyżej.
              </p>
            )}

            {loading && <p className="loan-loading">Ładowanie kredytów...</p>}
          </div>
        </>
      )}
    </div>
  );
}

export default LoanManager;