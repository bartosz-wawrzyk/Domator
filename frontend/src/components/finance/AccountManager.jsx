import { useEffect, useState } from 'react';
import * as financeApi from '../../api/finance';

function AccountManager({ 
    accounts, 
    setAccounts, 
    selectedAccountId, 
    setSelectedAccountId, 
    onViewAnalysis 
}) {
    const [stats, setStats] = useState(null);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({ name: '', bank_type: 'SANTANDER' });

    const loadAccounts = async () => {
        setLoading(true);
        const res = await financeApi.getAccounts();
        if (res.ok) {
            setAccounts(res.data);
        } else {
            setError("Nie udało się pobrać listy kont.");
        }
        setLoading(false);
    };

    const loadStats = async (account) => {
        setSelectedAccount(account);
        
        if (onViewAnalysis) {
            onViewAnalysis(account.id);
        }

        const now = new Date();
        const res = await financeApi.getMonthlyStats(account.id, now.getMonth() + 1, now.getFullYear());
        if (res.ok) {
            setStats(res.data);
            setError(null);
        } else {
            setStats(null);
            setError("Brak statystyk dla tego konta.");
        }
    };

    useEffect(() => {
        if (accounts.length === 0) {
            loadAccounts();
        }
    }, []);

    const handleCreateAccount = async (e) => {
        e.preventDefault();
        if (!formData.name) return;
        
        const res = await financeApi.createAccount(formData);
        if (res.ok) {
            setFormData({ name: '', bank_type: 'SANTANDER' });
            loadAccounts();
        }
    };

    const handleDelete = async (accountId) => {
        if (!window.confirm("Czy na pewno chcesz usunąć to konto?")) return;

        const res = await financeApi.deleteAccount(accountId);

        if (res.ok) {
            setAccounts(prev => prev.filter(acc => acc.id !== accountId));
            
            if (selectedAccountId === accountId) {
                setSelectedAccountId(null);
            }

            if (selectedAccount?.id === accountId) {
                setSelectedAccount(null);
                setStats(null);
            }
            
        } else {
            const msg = res.data?.detail || "Nie udało się usunąć konta.";
            alert(`Błąd: ${msg}`);
        }
    };

    return (
        <div className="finance-section">
            <h3 style={{ marginBottom: '20px' }}>🏦 Zarządzanie kontami</h3>

            {error && <div style={{ color: '#ff5050', marginBottom: '15px' }}>{error}</div>}

            <form className="finance-form" onSubmit={handleCreateAccount}>
                <p style={{ marginBottom: '10px', fontSize: '0.9rem', opacity: 0.8 }}>Dodaj nowe konto bankowe:</p>
                <div className="form-row-grid">
                    <input 
                        className="finance-input"
                        placeholder="Np. Santander Główne"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <select 
                        className="finance-select"
                        value={formData.bank_type}
                        onChange={e => setFormData({ ...formData, bank_type: e.target.value })}
                    >
                        <option value="SANTANDER">Santander</option>
                        <option value="MBANK">mBank</option>
                        <option value="PKO">PKO BP</option>
                        <option value="OTHER">Inny bank</option>
                    </select>
                    <button className="btn-submit-finance" type="submit">Dodaj konto</button>
                </div>
            </form>

            <div className="data-table">
                <div className="data-row data-header">
                    <div>Nazwa konta</div>
                    <div>Typ banku</div>
                    <div style={{ textAlign: 'right' }}>Akcje</div>
                </div>
                
                {loading ? <p>Ładowanie...</p> : accounts.map(acc => (
                    <div key={acc.id} className="data-row">
                        <div style={{ fontWeight: '600' }}>{acc.name}</div>
                        <div><span className="badge-cat">{acc.bank_type}</span></div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button 
                                className="nav-tab-btn" 
                                style={{ padding: '5px 10px' }}
                                onClick={() => loadStats(acc)}
                            >
                                📊 Statystyki
                            </button>
                            <button 
                                className="nav-tab-btn" 
                                style={{ padding: '5px 10px', color: '#ff5050' }}
                                onClick={() => handleDelete(acc.id)}
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {stats && selectedAccount && (
                <div className="stats-grid" style={{ marginTop: '25px' }}>
                    <div className="stat-box">
                        <span style={{ opacity: 0.7 }}>Szybki podgląd: {selectedAccount.name}</span>
                        <div style={{ marginTop: '15px' }}>
                            <small>Przychody</small>
                            <span className="stat-value val-income">+{stats.summary.income.toFixed(2)} PLN</span>
                        </div>
                        <div style={{ marginTop: '15px' }}>
                            <small>Wydatki</small>
                            <span className="stat-value val-expense">-{stats.summary.expense.toFixed(2)} PLN</span>
                        </div>
                        <div style={{ marginTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
                            <small>Bilans</small>
                            <span className="stat-value">{stats.summary.balance.toFixed(2)} PLN</span>
                        </div>
                    </div>

                    <div className="stat-box" style={{ borderTopColor: '#2575fc' }}>
                        <span style={{ opacity: 0.7 }}>Główne wydatki</span>
                        <div style={{ marginTop: '10px' }}>
                            {stats.categories.length === 0 ? <p style={{fontSize: '0.8rem'}}>Brak wydatków w tym miesiącu.</p> : 
                             stats.categories.slice(0, 5).map((cat, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '0.9rem' }}>
                                    <span>{cat.name}</span>
                                    <span style={{ fontWeight: '600' }}>{cat.value.toFixed(2)} PLN</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AccountManager;