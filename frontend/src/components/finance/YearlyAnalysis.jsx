import { useState, useEffect } from 'react';
import * as financeApi from '../../api/finance';

function YearlyAnalysis({ initialAccountId }) {
  const [accounts, setAccounts] = useState([]);
  const [selectedId, setSelectedId] = useState(initialAccountId || '');

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [availableYears, setAvailableYears] = useState([now.getFullYear()]);
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    financeApi.getAccounts().then(res => {
      if (res.ok) setAccounts(res.data);
    });
  }, []);

  useEffect(() => {
    if (selectedId) {
      const fetchYears = async () => {
        const res = await financeApi.getAvailableYears(selectedId);
        if (res.ok && res.data.years) {
          const yearsFromDb = res.data.years;
          setAvailableYears(yearsFromDb);

          if (!yearsFromDb.includes(year)) {
            setYear(yearsFromDb[0]);
          }
        }
      };
      fetchYears();
    }
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId || !year) return;
    const loadYearly = async () => {
      setLoading(true);
      const res = await financeApi.getYearlyStats(selectedId, year);
      if (res.ok) setData(res.data);
      setLoading(false);
    };
    loadYearly();
  }, [selectedId, year]);

  return (
    <div className="finance-section">
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '30px' }}>
        <h3 style={{ margin: 0, marginRight: 'auto' }}>📅 Analiza Roczna</h3>
        
        <select 
          className="finance-select" 
          style={{ width: 'auto', minWidth: '200px'  }} 
          value={selectedId} 
          onChange={(e) => setSelectedId(e.target.value)}
        >
          <option value="">Wybierz konto...</option>
          {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
        </select>

        <select 
          className="finance-select" 
          style={{ width: 'auto', minWidth: '100px' }} 
          value={year} 
          onChange={(e) => setYear(parseInt(e.target.value))}
          disabled={!selectedId}
        >
          {availableYears.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {!selectedId ? (
        <div className="analysis-card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🏦</div>
          <p style={{ opacity: 0.6, fontSize: '1.1rem' }}>Wybierz konto bankowe z listy powyżej,<br/>a następnie wskaż interesujący Cię rok,<br/>aby zobaczyć podsumowanie roku.</p>
        </div>
      ) : loading ? (
        <p>Ładowanie danych dla roku {year}...</p>
      ) : data ? (
        <div className="stats-grid">
          {data.data.map((m) => (
            <div key={m.month_num} className="stat-box" style={{ borderTop: `4px solid ${m.balance >= 0 ? '#42e695' : '#ff5050'}` }}>
              <small style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{m.name}</small>
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                  Przychód: <span className="val-income">+{m.income.toFixed(2)}</span>
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                  Wydatki: <span className="val-expense">-{m.expense.toFixed(2)}</span>
                </div>
                <div className="stat-value" style={{ fontSize: '1.1rem', marginTop: '5px' }}>
                  {m.balance.toFixed(2)} PLN
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ textAlign: 'center', opacity: 0.5 }}>Brak danych do wyświetlenia.</p>
      )}
    </div>
  );
}

export default YearlyAnalysis;