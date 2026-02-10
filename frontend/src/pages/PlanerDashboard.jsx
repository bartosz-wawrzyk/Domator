import { useState, useEffect } from 'react';
import ProductManager from '../components/meals/ProductManager';
import MealManager from '../components/meals/MealManager';
import MealPlannerManager from '../components/meals/MealPlannerManager';
import MealSettingsManager from '../components/meals/MealSettingsManager';
import MealIngredientManager from '../components/meals/MealIngredientManager';
import MealAnalysis from '../components/meals/MealAnalysis';
import '../assets/styles/planer.css';

function PlanerDashboard() {
  const [activeTab, setActiveTab] = useState('harmonogram');

  useEffect(() => {
    document.title = 'Domator – Planer posiłków';
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'harmonogram':
        return <MealPlannerManager />;
      case 'produkty':
        return (
          <div className="planer-products-split">
            <ProductManager type="proteins" />
            <div style={{ margin: '40px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}></div>
            <ProductManager type="bases" />
          </div>
        );
      case 'dania':
        return <MealManager />;
      case 'analiza':
        return <MealAnalysis />;
      case 'skladniki':
        return <MealIngredientManager />;
      case 'ustawienia':
        return <MealSettingsManager />;
      default:
        return null;
    }
  };

  return (
    <div className="planer-container">
      <div className="sub-nav">
        <button 
          className={`sub-nav-btn ${activeTab === 'harmonogram' ? 'active' : ''}`}
          onClick={() => setActiveTab('harmonogram')}
        >
          Harmonogram
        </button>
        <button 
          className={`sub-nav-btn ${activeTab === 'produkty' ? 'active' : ''}`}
          onClick={() => setActiveTab('produkty')}
        >
          Bazy / Proteiny
        </button>
        <button 
          className={`sub-nav-btn ${activeTab === 'dania' ? 'active' : ''}`}
          onClick={() => setActiveTab('dania')}
        >
          Dania
        </button>
        <button 
          className={`sub-nav-btn ${activeTab === 'analiza' ? 'active' : ''}`}
          onClick={() => setActiveTab('analiza')}
        >
          Analiza
        </button>
        <button 
          className={`sub-nav-btn ${activeTab === 'skladniki' ? 'active' : ''}`}
          onClick={() => setActiveTab('skladniki')}
        >
          Składniki
        </button>
        <button 
          className={`sub-nav-btn ${activeTab === 'ustawienia' ? 'active' : ''}`}
          onClick={() => setActiveTab('ustawienia')}
        >
          Konfiguracja
        </button>
      </div>

      <div className="planer-content">
        {renderTabContent()}
      </div>
    </div>
  );
}

export default PlanerDashboard;