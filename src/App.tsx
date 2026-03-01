import React from 'react';
import { GlobalStateProvider, useGlobalState } from './context/GlobalState';
import { Onboarding } from './screens/Onboarding';
import { Dashboard } from './screens/Dashboard';

const AppContent: React.FC = () => {
    const { state } = useGlobalState();

    // v3 Logic: If name is empty, we are in onboarding mode
    if (!state.profile.name) {
        return <Onboarding />;
    }

    return <Dashboard />;
};

const App: React.FC = () => {
    return (
        <GlobalStateProvider>
            <AppContent />
        </GlobalStateProvider>
    );
};

export default App;
