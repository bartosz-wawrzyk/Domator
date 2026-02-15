import { useState, useEffect } from 'react';
import LoanManager from '../components/loans/LoanManager';
import '../assets/styles/loan.css';

function LoanDashboard() {
  const [activeTab, setActiveTab] = useState('loans');

  useEffect(() => {
    document.title = 'Domator – Kredyty i pożyczki';
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'loans':
        return <LoanManager />;
      default:
        return null;
    }
  };

  return (
    <div className="loan-container">
      <div className="sub-nav">
        <button 
          className={`sub-nav-btn ${activeTab === 'loans' ? 'active' : ''}`}
          onClick={() => setActiveTab('loans')}
        >
          💰 Moje kredyty
        </button>
      </div>

      <div className="loan-content">
        {renderTabContent()}
      </div>
    </div>
  );
}

export default LoanDashboard;
