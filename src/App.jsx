import React, { useEffect, useState } from 'react';
import SmartOnboarding from './components/SmartOnboarding';
import Dashboard from './components/Dashboard';
import VoiceInterface from './components/VoiceInterface';
import GestureInterface from './components/GestureInterface';
import Statistics, { recordVisit } from './components/Statistics';
import './statistics.css';

function App() {
  const [currentInterface, setCurrentInterface] = useState('onboarding');
  const [showStatistics, setShowStatistics] = useState(false);
  useEffect(() => { recordVisit(); }, []);

  const renderInterface = () => {
    switch (currentInterface) {
      case 'onboarding':
        return <SmartOnboarding onComplete={setCurrentInterface} />;
      case 'gesture':
        return <GestureInterface onSwitch={setCurrentInterface} />;
      case 'voice':
        return <VoiceInterface onSwitch={setCurrentInterface} initialView="lesson_hub" />;
      case 'audio':
        return <VoiceInterface onSwitch={setCurrentInterface} initialView="lesson_hub" />; 
      case 'standard':
        return <Dashboard onSwitch={setCurrentInterface} />;
      default:
        return <SmartOnboarding onComplete={setCurrentInterface} />;
    }
  };

  return (
    <div className="app-container">
      {showStatistics ? <Statistics onClose={() => setShowStatistics(false)} /> : renderInterface()}
      {!showStatistics && currentInterface === 'onboarding' && <button className="stats-open" onClick={() => setShowStatistics(true)}>📊 Statistika</button>}
    </div>
  );
}

export default App;
