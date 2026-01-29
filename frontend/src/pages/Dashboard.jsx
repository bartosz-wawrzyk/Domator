import { useState, useContext, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import CreditsDashboard from '../pages/CreditsDashboard';
import VehiclesDashboard from '../pages/VehiclesDashboard';
import FinancesDashboard from '../pages/FinancesDashboard';
import PlanerDashboard from '../pages/PlanerDashboard';
import { AuthContext } from '../context/AuthContext';
import '../assets/styles/dashboard.css';

function Dashboard() {
  const [activeMenu, setActiveMenu] = useState('');
  const [activeKredytTab, setActiveKredytTab] = useState('dodajKredyt');

  const { logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    document.title = 'Domator – Strona główna';
  }, []);

  const renderContent = () => {
    switch (activeMenu) {
      case 'pojazdy': return <VehiclesDashboard />;
      case 'finanse': return <FinancesDashboard />;
      case 'kredyty':
        return (
          <CreditsDashboard
            activeTab={activeKredytTab}
            setActiveTab={setActiveKredytTab}
          />
        );
      case 'planer': return <PlanerDashboard />;
      default:
        return (
          <div className="welcome-screen">
            <h1 className="welcome-title">Witaj w systemie do zarządzania domem</h1>
            <p className="welcome-subtitle">Wybierz jedną z opcji poniżej, aby rozpocząć:</p>
            <div className="welcome-tiles">
              <div className="tile" onClick={() => setActiveMenu('pojazdy')}>
                <div className="tile-icon">🚗</div>
                <div className="tile-title">Pojazdy</div>
                <div className="tile-desc">Zarządzaj swoimi pojazdami i wydatkami.</div>
              </div>
              <div className="tile" onClick={() => setActiveMenu('finanse')}>
                <div className="tile-icon">💰</div>
                <div className="tile-title">Finanse</div>
                <div className="tile-desc">Kontroluj budżet i wydatki domowe.</div>
              </div>
              <div className="tile" onClick={() => setActiveMenu('kredyty')}>
                <div className="tile-icon">🏦</div>
                <div className="tile-title">Kredyty</div>
                <div className="tile-desc">Dodawaj i przeglądaj swoje kredyty.</div>
              </div>
              <div className="tile" onClick={() => setActiveMenu('planer')}>
                <div className="tile-icon">📅</div>
                <div className="tile-title">Planer posiłków</div>
                <div className="tile-desc">Planuj i organizuj posiłki na cały tydzień, kontroluj jadłospis i zakupy.</div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <DashboardLayout
      onLogout={handleLogout}
      onMenuSelect={setActiveMenu}
      activeMenu={activeMenu}
    >
      {renderContent()}
    </DashboardLayout>
  );
}

export default Dashboard;
