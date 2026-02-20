import { useState, useEffect } from 'react';
import * as financeApi from '../../api/finance';

function MonthlyAnalysis({ initialAccountId }) {
  const [accounts, setAccounts] = useState([]);
  const [selectedId, setSelectedId] = useState(initialAccountId || '');
  
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const years = [2024, 2025, 2026];
  const months = [
    { v: 1, n: 'Styczeń' }, { v: 2, n: 'Luty' }, { v: 3, n: 'Marzec' },
    { v: 4, n: 'Kwiecień' }, { v: 5, n: 'Maj' }, { v: 6, n: 'Czerwiec' },
    { v: 7, n: 'Lipiec' }, { v: 8, n: 'Sierpień' }, { v: 9, n: 'Wrzesień' },
    { v: 10, n: 'Październik' }, { v: 11, n: 'Listopad' }, { v: 12, n: 'Grudzień' }
  ];

  useEffect(() => {
    financeApi.getAccounts().then(res => {
      if (res.ok) setAccounts(res.data);
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;

    const loadAnalysis = async () => {
      setLoading(true);
      const res = await financeApi.getMonthlyStats(selectedId, month, year);
      if (res.ok) {
        setData(res.data);
      }
      setLoading(false);
    };
    loadAnalysis();
  }, [selectedId, month, year]);

  const maxExpense = data ? Math.max(...data.categories.map(c => c.value), 1) : 0;

  return (
    <div className="finance-section">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center', marginBottom: '30px' }}>
        <h3 style={{ margin: 0, marginRight: 'auto' }}>📊 Analiza Finansowa</h3>
        
        <select 
          className="finance-select" style={{ width: 'auto' }}
          value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
        >
          <option value="">Wybierz konto...</option>
          {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
        </select>

        <select 
          className="finance-select" style={{ width: 'auto' }}
          value={month} onChange={(e) => setMonth(parseInt(e.target.value))}
        >
          {months.map(m => <option key={m.v} value={m.v}>{m.n}</option>)}
        </select>

        <select 
          className="finance-select" style={{ width: 'auto' }}
          value={year} onChange={(e) => setYear(parseInt(e.target.value))}
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {!selectedId ? (
        <div className="analysis-card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ opacity: 0.5 }}>Wybierz konto, aby zobaczyć statystyki dla {months.find(m => m.v === month).n} {year}.</p>
        </div>
      ) : loading ? (
        <p>Ładowanie danych...</p>
      ) : data ? (
        <>
          <div className="stats-grid" style={{ marginBottom: '30px' }}>
            <div className="stat-box">
              <small>Przychody ({months.find(m => m.v === month).n})</small>
              <span className="stat-value val-income">+{data.summary.income.toFixed(2)} PLN</span>
            </div>
            <div className="stat-box" style={{ borderTopColor: '#ff5050' }}>
              <small>Wydatki</small>
              <span className="stat-value val-expense">-{data.summary.expense.toFixed(2)} PLN</span>
            </div>
            <div className="stat-box" style={{ borderTopColor: '#2575fc' }}>
              <small>Bilans</small>
              <span className="stat-value">{data.summary.balance.toFixed(2)} PLN</span>
            </div>
          </div>

          <div className="analysis-card">
            <h4>Struktura wydatków</h4>
            <div style={{ marginTop: '20px' }}>
              {data.categories.length > 0 ? (
                data.categories.sort((a,b) => b.value - a.value).map((cat, idx) => (
                  <div key={idx} className="category-bar-wrapper">
                    <div className="category-bar-info">
                      <span>{cat.name}</span>
                      <span style={{ fontWeight: 'bold' }}>{cat.value.toFixed(2)} PLN</span>
                    </div>
                    <div className="bar-bg">
                      <div className="bar-fill" style={{ width: `${(cat.value / maxExpense) * 100}%` }}></div>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ opacity: 0.5, textAlign: 'center' }}>Brak skategoryzowanych operacji w tym okresie.</p>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default MonthlyAnalysis;