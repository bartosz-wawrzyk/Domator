import { useState, useEffect } from 'react';
import * as financeApi from '../../api/finance';

function ImportManager() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAcc, setSelectedAcc] = useState('');
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    financeApi.getAccounts().then(res => {
      if (res.ok) setAccounts(res.data);
    });
  }, []);

  const handlePreview = async () => {
    if (!selectedAcc || !file) {
      alert("Wybierz konto i plik wyciągu!");
      return;
    }
    
    setLoading(true);
    setMessage(null);
    setPreviewData([]);

    const res = await financeApi.previewImport(selectedAcc, file);
    
    if (res.ok) {
      setPreviewData(res.data);
      if (res.data.length === 0) {
          setMessage({ type: 'error', text: 'Plik nie zawiera transakcji lub format jest niepoprawny.' });
      }
    } else {
      const errorDetail = res.data?.detail || "Wystąpił błąd podczas analizy pliku.";
      setMessage({ 
        type: 'error', 
        text: `Błąd: ${errorDetail}` 
      });
    }
    setLoading(false);
  };

  const handleConfirm = async () => {
    setLoading(true);
    const res = await financeApi.confirmImport(selectedAcc, previewData);

    if (res.ok) {
      setMessage({ 
        type: 'success', 
        text: `Pomyślnie zaimportowano ${previewData.length} transakcji!` 
      });
      setPreviewData([]);
      setFile(null);
      if (document.querySelector('input[type="file"]')) {
        document.querySelector('input[type="file"]').value = '';
      }
    } else {
      const errorDetail = res.data?.detail || '';
      
      if (errorDetail.includes('possible duplicates')) {
        setMessage({ 
          type: 'error', 
          text: 'Te dane zostały już wcześniej zaimportowane lub zawierają duplikaty.' 
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: 'Wystąpił błąd podczas zapisywania importu. Spróbuj ponownie później.' 
        });
      }
    }
    
    setLoading(false);
  };

  const isFormIncomplete = !selectedAcc || !file;

  return (
    <div className="finance-section">
      <h3 style={{ marginBottom: '20px' }}>📥 Importuj historię transakcji</h3>

      {message && (
        <div 
          onClick={() => setMessage(null)}
          style={{ 
            padding: '15px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            cursor: 'pointer',
            background: message.type === 'success' ? 'rgba(66, 230, 149, 0.2)' : 'rgba(255, 80, 80, 0.2)',
            color: message.type === 'success' ? '#42e695' : '#ff5050',
            border: `1px solid ${message.type === 'success' ? '#42e695' : '#ff5050'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            animation: message.type === 'error' ? 'shake 0.5s ease' : 'none'
          }}
        >
          <span>{message.text}</span>
          <span style={{ fontSize: '1.2rem', opacity: 0.5 }}>×</span>
        </div>
      )}

      <div style={{
        padding: '15px',
        borderRadius: '8px',
        background: 'rgba(255, 171, 0, 0.1)',
        border: '1px solid rgba(255, 171, 0, 0.3)',
        color: '#ffab00',
        fontSize: '0.85rem',
        marginBottom: '20px',
        lineHeight: '1.5'
      }}>
        <strong>💡 Wskazówka dot. automatyzacji:</strong> Aby system automatycznie przydzielał kategorie (np. <em>Biedronka</em> → <em>Spożywcze</em>), skonfiguruj <strong>Kategorie</strong> i <strong>Reguły</strong> w ustawieniach.
      </div>

      {isFormIncomplete && !message && (
        <div style={{
          padding: '12px',
          borderRadius: '8px',
          background: 'rgba(37, 117, 252, 0.1)',
          color: '#2575fc',
          fontSize: '0.9rem',
          marginBottom: '20px',
          borderLeft: '4px solid #2575fc'
        }}>
          📌 Aby wygenerować podgląd, <strong>wskaż konto bankowe</strong> oraz <strong>wybierz plik CSV</strong>.
        </div>
      )}

      <div className="finance-form">
        <div className="form-row-grid">
          <div>
            <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>1. Wybierz konto</label>
            <select 
              className="finance-select" 
              value={selectedAcc} 
              onChange={e => {
                  setSelectedAcc(e.target.value);
                  setMessage(null);
              }}
            >
              <option value="">Wybierz konto...</option>
              {accounts.map(a => (
                  <option key={a.id} value={a.id}>
                      {a.name} ({a.bank_type})
                  </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>2. Wgraj plik CSV</label>
            <input 
              type="file" 
              className="finance-input" 
              accept=".csv" 
              onChange={e => {
                  setFile(e.target.files[0]);
                  setMessage(null);
              }} 
            />
          </div>
          <button 
            className={`btn-submit-finance ${isFormIncomplete ? 'btn-disabled' : ''}`}
            onClick={handlePreview} 
            disabled={loading || isFormIncomplete}
            style={{
                opacity: isFormIncomplete ? 0.5 : 1,
                cursor: isFormIncomplete ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Analizuję...' : 'Pokaż podgląd'}
          </button>
        </div>
      </div>

      {previewData.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h4>Podgląd transakcji ({previewData.length})</h4>
          <div className="preview-container">
            <div className="transaction-item" style={{ fontWeight: 'bold', background: 'rgba(255,255,255,0.05)' }}>
              <div>Data</div>
              <div>Tytuł / Opis</div>
              <div>Kwota</div>
              <div>Kategoria</div>
            </div>
            
            {previewData.map((t, i) => (
              <div key={i} className="transaction-item">
                <div>{t.date.split('T')[0]}</div>
                <div style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {t.title}
                </div>
                <div className={t.amount < 0 ? 'val-expense' : 'val-income'} style={{ fontWeight: '600' }}>
                  {t.amount.toFixed(2)} PLN
                </div>
                <div>
                  {t.category_id ? (
                    <span className="badge-cat" style={{ background: 'rgba(66, 230, 149, 0.2)', color: '#42e695' }}>
                      Automatyczna
                    </span>
                  ) : (
                    <span className="badge-cat" style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#ccc' }}>
                      Brak dopasowania
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button 
            className="btn-submit-finance" 
            style={{ width: '100%', marginTop: '20px', height: '50px', fontSize: '1.1rem' }}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Zapisywanie...' : 'Zatwierdź i zapisz w bazie danych'}
          </button>
        </div>
      )}
    </div>
  );
}

export default ImportManager;