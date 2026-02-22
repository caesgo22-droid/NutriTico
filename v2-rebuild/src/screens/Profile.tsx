import React from 'react';
import { useGlobalState } from '../context/GlobalState';
import { User, LogOut, Settings, ShieldCheck, ChevronRight } from 'lucide-react';

export const Profile: React.FC<{ onNavigate: (s: string) => void }> = ({ onNavigate }) => {
    const { state, actions } = useGlobalState();

    const menuItems = [
        { label: 'Ajustes de Cuenta', icon: Settings, color: 'text-slate-400' },
        { label: 'Privacidad y Datos', icon: ShieldCheck, color: 'text-emerald-500' },
    ];

    return (
        <div className="flex-1 overflow-y-auto pb-32 bg-slate-50 no-scrollbar p-6 space-y-8">
            <header className="pt-12 flex flex-col items-center gap-4">
                <div className="size-24 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-emerald-500/20 animate-in zoom-in duration-500">
                    <User size={48} strokeWidth={2.5} />
                </div>
                <div className="text-center">
                    <h2 className="text-2xl font-black text-slate-800">{state.profile.name}</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{state.user.email}</p>
                </div>
            </header>

            <section className="bg-white p-4 rounded-[3rem] shadow-sm border border-slate-100 space-y-1">
                {menuItems.map(item => (
                    <button key={item.label} className="w-full p-5 flex items-center justify-between hover:bg-slate-50 rounded-3xl transition-all group">
                        <div className="flex items-center gap-4">
                            <div className={`size-10 rounded-xl bg-slate-50 flex items-center justify-center ${item.color}`}>
                                <item.icon size={20} />
                            </div>
                            <span className="text-sm font-bold text-slate-700">{item.label}</span>
                        </div>
                        <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                    </button>
                ))}
            </section>

            <button
                onClick={() => actions.resetApp()}
                className="w-full py-5 bg-red-50 text-red-500 rounded-3xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 active:scale-95 transition-all mt-4 border border-red-100"
            >
                <LogOut size={18} />
                Cerrar Sesión Activa
            </button>

            <div className="text-center pt-8">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">NutriTico IA • v2.0.0</p>
            </div>
        </div>
    );
};
