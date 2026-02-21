
import React from 'react';

interface NavigationProps {
  currentScreen: string;
  setCurrentScreen: (screen: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentScreen, setCurrentScreen }) => {
  const navItems = [
    { id: 'dashboard', label: 'Inicio', icon: 'home' },
    { id: 'scanner', label: 'Escáner', icon: 'biotech' },
    { id: 'plan', label: 'Plan', icon: 'calendar_month' },
    { id: 'diary', label: 'Diario', icon: 'history_edu' },
    { id: 'fasting', label: 'Ayuno', icon: 'timer' },
    { id: 'profile', label: 'Perfil', icon: 'person' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-background-dark border-t border-primary/5 px-2 pb-6 pt-2 z-50">
      <div className="flex justify-between items-center max-w-lg mx-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentScreen(item.id)}
            className={`flex flex-col items-center gap-1 group transition-colors min-w-[50px] ${
              currentScreen === item.id ? 'text-primary' : 'text-slate-400 hover:text-primary'
            }`}
          >
            <span className={`material-symbols-outlined text-2xl ${currentScreen === item.id ? 'filled' : ''}`}>
              {item.icon}
            </span>
            <span className="text-[10px] font-bold">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};
