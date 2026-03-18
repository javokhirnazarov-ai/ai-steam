import React, { useState } from 'react';
import SmartOnboarding from './components/SmartOnboarding';
import Dashboard from './components/Dashboard';
import VoiceInterface from './components/VoiceInterface';
import GestureInterface from './components/GestureInterface';

function App() {
  const [currentInterface, setCurrentInterface] = useState('onboarding');

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
      {renderInterface()}
    </div>
  );
}

export default App;
