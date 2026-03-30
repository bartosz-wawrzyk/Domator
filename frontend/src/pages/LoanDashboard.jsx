import { useState, useEffect } from 'react';
import LoanManager from '../components/loan/LoanManager';
import '../assets/styles/loan.css';

const TABS = [
  { id: 'loans', label: '💰 Moje kredyty' },
];

function LoanDashboard() {
  const [activeTab, setActiveTab] = useState('loans');

  useEffect(() => {
    document.title = 'Domator – Kredyty i pożyczki';
  }, []);

  return (
    <div className="loans-container">

      <div className="loans-nav">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`loans-nav-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="loans-content">
        {activeTab === 'loans' && <LoanManager />}
      </div>

    </div>
  );
}

export default LoanDashboard;