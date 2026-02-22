import React, { useState } from 'react';
import { useGlobalState } from './context/GlobalState';
import { Layout } from './components/Layout';
import { Dashboard } from './screens/Dashboard';
import { Plan } from './screens/Plan';
import { LabelScanner } from './screens/LabelScanner';
import { Profile } from './screens/Profile';
import { Onboarding } from './screens/Onboarding';
import { Auth } from './screens/Auth';

const App: React.FC = () => {
    const { state } = useGlobalState();
    const [currentScreen, setCurrentScreen] = useState('dashboard');

    if (!state.user.uid) return <Auth />;
    if (!state.isOnboardingComplete) return <Onboarding />;

    const renderScreen = () => {
        switch (currentScreen) {
            case 'dashboard': return <Dashboard onNavigate={setCurrentScreen} />;
            case 'plan': return <Plan />;
            case 'scanner': return <LabelScanner />;
            case 'profile': return <Profile onNavigate={setCurrentScreen} />;
            default: return <Dashboard onNavigate={setCurrentScreen} />;
        }
    };

    return (
        <Layout currentScreen={currentScreen} onNavigate={setCurrentScreen}>
            {renderScreen()}
        </Layout>
    );
};

export default App;
