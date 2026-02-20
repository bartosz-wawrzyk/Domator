import { useState, useEffect } from 'react';
import AccountManager from '../components/finance/AccountManager';
import ImportManager from '../components/finance/ImportManager';
import RulesManager from '../components/finance/RulesManager';
import MonthlyAnalysis from '../components/finance/MonthlyAnalysis';
import * as financeApi from '../api/finance';
import '../assets/styles/finance.css';

function FinanceDashboard() {
  const [activeTab, setActiveTab] = useState('accounts');
  
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    const res = await financeApi.getAccounts();
    if (res.ok) {
      setAccounts(res.data);
    }
    setLoading(false);
  };

  const handleQuickView = (accountId) => {
    setSelectedAccountId(accountId);
    setActiveTab('analysis');
  };

  if (loading) return <div className="loading">Ładowanie portfela...</div>;

  return (
    <div className="finance-container">
      <div className="finance-nav">
        <button 
          className={`nav-tab-btn ${activeTab === 'accounts' ? 'active' : ''}`}
          onClick={() => setActiveTab('accounts')}
        >
          🏦 Konta
        </button>
        <button 
          className={`nav-tab-btn ${activeTab === 'import' ? 'active' : ''}`}
          onClick={() => setActiveTab('import')}
        >
          📥 Import
        </button>
        <button 
          className={`nav-tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          ⚙️ Kategorie / Reguły
        </button>
        <button 
          className={`nav-tab-btn ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          📈 Analiza
        </button>
      </div>

      <div className="finance-content">
        {activeTab === 'accounts' && (
          <AccountManager 
            accounts={accounts} 
            setAccounts={setAccounts} 
            selectedAccountId={selectedAccountId}
            setSelectedAccountId={setSelectedAccountId}
            onViewAnalysis={handleQuickView} 
          />
        )}
        
        {activeTab === 'import' && (
          <ImportManager accounts={accounts} />
        )}
        
        {activeTab === 'rules' && (
          <RulesManager accounts={accounts} />
        )}
        
        {activeTab === 'analysis' && (
          <MonthlyAnalysis 
            accounts={accounts}
            initialAccountId={selectedAccountId} 
          />
        )}
      </div>
    </div>
  );
}

export default FinanceDashboard;