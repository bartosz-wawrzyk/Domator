import { useEffect } from 'react';
import '../assets/styles/unavailable.css';

function CarDashboard() {
  useEffect(() => {
    document.title = 'Domator – Auto';
  }, []);

  return (
    <div className="unavailable-box">
      <h1 className="unavailable-title">
        Funkcja chwilowo niedostępna
      </h1>

      <p className="unavailable-description">
        Ten moduł jest obecnie w trakcie prac rozwojowych lub tymczasowo
        wyłączony z powodu prac serwisowych.
        <br />
        Dokładamy starań, aby udostępnić go jak najszybciej.
      </p>
    </div>
  );
}

export default CarDashboard;
