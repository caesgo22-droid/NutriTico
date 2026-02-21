
import React, { useState } from 'react';
import { GlobalProvider, useGlobalState } from './context/GlobalState';
import { Auth } from './screens/Auth';
import { Onboarding } from './screens/Onboarding';
import { Dashboard } from './screens/Dashboard';
import { Diary } from './screens/Diary';
import { Fasting } from './screens/Fasting';
import { Plan } from './screens/Plan';
import { Performance } from './screens/Performance';
import { Profile } from './screens/Profile';
import { LabelScanner } from './screens/LabelScanner';
import { Navigation } from './components/Navigation';

const AppContent = () => {
  const { state } = useGlobalState();
  const [currentScreen, setCurrentScreen] = useState('dashboard');

  if (!state.user.isAuthenticated) {
    return <Auth />;
  }

  if (!state.isOnboardingComplete) {
    return <Onboarding />;
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard': return <Dashboard onNavigate={setCurrentScreen} />;
      case 'diary': return <Diary />;
      case 'fasting': return <Fasting />;
      case 'plan': return <Plan />;
      case 'scanner': return <LabelScanner />;
      case 'performance': return <Performance />;
      case 'profile': return <Profile />;
      default: return <Dashboard onNavigate={setCurrentScreen} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light font-sans text-slate-900">
      {renderScreen()}
      <Navigation currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} />
      
      {/* Cloud Sync Global Indicator */}
      {state.user.isSyncing && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] bg-primary/90 backdrop-blur text-white px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl animate-in slide-in-from-top duration-300">
            <span className="material-symbols-outlined text-sm animate-spin">sync</span>
            Respaldando en Nube...
          </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <GlobalProvider>
      <AppContent />
    </GlobalProvider>
  );
}
