import { useState, useEffect } from 'react';
import * as financeApi from '../../api/finance';

function TransactionHistory({ initialAccountId }) {
  const [selectedId, setSelectedId] = useState(initialAccountId || '');
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  
  const [availableYears, setAvailableYears] = useState([now.getFullYear()]);

  const months = [
    { v: 1, n: 'Styczeń' }, { v: 2, n: 'Luty' }, { v: 3, n: 'Marzec' },
    { v: 4, n: 'Kwiecień' }, { v: 5, n: 'Maj' }, { v: 6, n: 'Czerwiec' },
    { v: 7, n: 'Lipiec' }, { v: 8, n: 'Sierpień' }, { v: 9, n: 'Wrzesień' },
    { v: 10, n: 'Październik' }, { v: 11, n: 'Listopad' }, { v: 12, n: 'Grudzień' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      const [resAcc, resCats] = await Promise.all([
        financeApi.getAccounts(),
        financeApi.getCategories()
      ]);
      if (resAcc.ok) setAccounts(resAcc.data);
      if (resCats.ok) setCategories(resCats.data);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedId) {
      const fetchAvailableYears = async () => {
        const res = await financeApi.getAvailableYears(selectedId);
        
        if (res.ok && res.data.years) {
          const years = res.data.years;
          setAvailableYears(years);

          if (!years.includes(year)) {
            setYear(years[0]);
          }
        }
      };
      fetchAvailableYears();
    }
  }, [selectedId]);

  useEffect(() => {
    if (selectedId && month && year) {
      const loadHistory = async () => {
        setLoading(true);
        const res = await financeApi.getTransactions(selectedId, month, year);
        if (res.ok) {
          setTransactions(res.data);
        }
        setLoading(false);
      };
      loadHistory();
    }
  }, [selectedId, month, year]);

  const updateCategory = async (txId, catId) => {
    const res = await financeApi.updateTransactionCategory(txId, catId);
    if (res.ok) {
      setTransactions(transactions.map(t => t.id === txId ? { ...t, category_id: catId } : t));
    }
  };

  return (
    <div className="finance-section">
      <div className="history-filters-header" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center', marginBottom: '30px' }}>
        <h3 style={{ margin: 0, marginRight: 'auto' }}>📜 Historia Operacji</h3>
        
        <select 
          className="finance-select" style={{ width: 'auto', minWidth: '200px' }} 
          value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
        >
          <option value="">Wybierz konto...</option>
          {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
        </select>

        <select 
          className="finance-select" style={{ width: 'auto', minWidth: '100px' }} 
          value={year} onChange={(e) => setYear(parseInt(e.target.value))}
          disabled={!selectedId}
        >
          {availableYears.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <select 
          className="finance-select" style={{ width: 'auto' }} 
          value={month} onChange={(e) => setMonth(parseInt(e.target.value))}
          disabled={!selectedId}
        >
          {months.map(m => <option key={m.v} value={m.v}>{m.n}</option>)}
        </select>
      </div>

      {!selectedId ? (
        <div className="analysis-card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🏦</div>
          <p style={{ opacity: 0.6, fontSize: '1.1rem' }}>Wybierz konto bankowe z listy powyżej,<br/>a następnie wskaż interesujący Cię rok i miesiąc,<br/>aby przeglądać oraz kategoryzować historię transakcji.</p>
        </div>
      ) : loading ? (
        <div className="loading-spinner">Ładowanie transakcji dla {month}/{year}...</div>
      ) : (
        <div className="analysis-card">
          <div className="preview-container" style={{ maxHeight: '650px', overflowY: 'auto' }}>
            {transactions.length > 0 ? (
              <div className="data-table">
                <div className="transaction-item header" style={{ gridTemplateColumns: '120px 1fr 140px 220px', fontWeight: 'bold', borderBottom: '2px solid #333', marginBottom: '10px', paddingBottom: '10px' }}>
                    <span>Data</span>
                    <span>Tytuł operacji</span>
                    <span style={{ textAlign: 'right' }}>Kwota</span>
                    <span style={{ textAlign: 'center' }}>Kategoria</span>
                </div>

                {transactions.map(tx => (
                  <div key={tx.id} className="transaction-item" style={{ gridTemplateColumns: '120px 1fr 140px 220px', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #222' }}>
                    <small style={{ opacity: 0.7 }}>
                      {new Date(tx.date).toLocaleDateString('pl-PL')}
                    </small>
                    <span style={{ fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '15px' }} title={tx.title}>
                      {tx.title}
                    </span>
                    <span className={parseFloat(tx.amount) < 0 ? 'val-expense' : 'val-income'} style={{ fontWeight: 'bold', textAlign: 'right', paddingRight: '20px' }}>
                      {parseFloat(tx.amount).toFixed(2)} PLN
                    </span>
                    
                    <select 
                      className="finance-select" 
                      style={{ padding: '6px', fontSize: '0.85rem', width: '100%' }}
                      value={tx.category_id || ''} 
                      onChange={(e) => updateCategory(tx.id, e.target.value)}
                    >
                      <option value="">Brak kategorii</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p style={{ opacity: 0.5 }}>Brak zarejestrowanych transakcji w {months.find(m => m.v === month)?.n} {year} r.</p>
                <small style={{ opacity: 0.4 }}>Zaimportuj plik CSV w zakładce Import, aby dodać dane.</small>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TransactionHistory;