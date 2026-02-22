import React from 'react';
import { Home, Calendar, Scan, User, LogOut } from 'lucide-react';
import { useGlobalState } from '../context/GlobalState';

interface LayoutProps {
    children: React.ReactNode;
    currentScreen: string;
    onNavigate: (s: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentScreen, onNavigate }) => {
    const { actions } = useGlobalState();

    const navItems = [
        { id: 'dashboard', icon: Home, label: 'Inicio' },
        { id: 'plan', icon: Calendar, label: 'Plan' },
        { id: 'scanner', icon: Scan, label: 'Escáner' },
        { id: 'profile', icon: User, label: 'Perfil' },
    ];

    return (
        <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-inter">
            <main className="flex-1 overflow-hidden">
                {children}
            </main>

            <nav className="bg-white/80 backdrop-blur-md border-t border-slate-200 px-6 py-4 pb-8 flex justify-between items-center z-50">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentScreen === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`flex flex-col items-center gap-1 transition-all ${isActive ? 'text-emerald-600 scale-110' : 'text-slate-400 hover:text-emerald-500'}`}
                        >
                            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
                <button
                    onClick={() => actions.resetApp()}
                    className="flex flex-col items-center gap-1 text-slate-400 hover:text-red-500 transition-all pointer-events-auto"
                >
                    <LogOut size={20} strokeWidth={2} />
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Salir</span>
                </button>
            </nav>
        </div>
    );
};
