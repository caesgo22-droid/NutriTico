import React, { useState } from 'react';
import { useGlobalState } from '../context/GlobalState';
import { consultNutriTico } from '../services/aiCore';
import { Calendar, Apple, Check, ChevronLeft, ChevronRight, MessageSquare, Plus } from 'lucide-react';

export const Plan: React.FC = () => {
    const { state, actions } = useGlobalState();
    const [dayIndex, setDayIndex] = useState(0); // 0 = Lunes
    const [showChat, setShowChat] = useState(false);
    const [chatQuery, setChatQuery] = useState('');
    const [loading, setLoading] = useState(false);

    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const meals = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'];

    const handleConsult = async () => {
        if (!chatQuery.trim()) return;
        setLoading(true);
        try {
            const res = await consultNutriTico(state, actions, chatQuery);
            if (res.planCommands?.length) {
                actions.applyAICommands(res.planCommands);
            }
            setChatQuery('');
            actions.syncToCloud();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const currentDayPlan = state.weeklyPlan[dayIndex] || {};

    return (
        <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
            {/* Scroll de Días */}
            <header className="bg-white px-6 pt-12 pb-6 border-b border-slate-100 flex gap-3 overflow-x-auto no-scrollbar">
                {days.map((day, i) => (
                    <button
                        key={day}
                        onClick={() => setDayIndex(i)}
                        className={`flex-shrink-0 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${dayIndex === i ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-slate-50 text-slate-400'}`}
                    >
                        {day}
                    </button>
                ))}
            </header>

            {/* Grid de Comidas */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar pb-24">
                {meals.map(meal => (
                    <section key={meal} className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="size-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 font-black">
                                    {meal[0]}
                                </div>
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{meal}</h3>
                            </div>
                            <button className="size-8 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center">
                                <Plus size={16} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            {Object.entries(currentDayPlan[meal] || {}).map(([group, items]) => (
                                <div key={group} className="space-y-2">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{group}</p>
                                    {Object.entries(items).map(([id, qty]) => (
                                        <div key={id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group transition-all hover:bg-emerald-50">
                                            <div className="flex items-center gap-3">
                                                <div className="size-8 bg-white rounded-lg flex items-center justify-center shadow-sm text-emerald-500">
                                                    <Check size={14} strokeWidth={3} />
                                                </div>
                                                <p className="text-xs font-bold text-slate-700 capitalize">{id}</p>
                                            </div>
                                            <p className="text-xs font-black text-emerald-600">{qty} <span className="text-[9px] opacity-50 uppercase">porciones</span></p>
                                        </div>
                                    ))}
                                </div>
                            ))}
                            {(!currentDayPlan[meal] || Object.keys(currentDayPlan[meal]).length === 0) && (
                                <p className="text-[10px] text-slate-300 italic py-2 text-center">IA: Todavía no hay alimentos en esta celda.</p>
                            )}
                        </div>
                    </section>
                ))}
            </div>

            {/* Floating Nutri-Chat Trigger */}
            <button
                onClick={() => setShowChat(true)}
                className="absolute bottom-28 right-6 size-16 bg-emerald-600 text-white rounded-full shadow-2xl shadow-emerald-900/40 flex items-center justify-center animate-bounce duration-[4000ms] z-40"
            >
                <MessageSquare size={24} />
            </button>

            {/* Mini-Chat Overlay */}
            {showChat && (
                <div className="absolute inset-x-4 bottom-24 bg-slate-900 rounded-[3rem] p-6 z-50 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border border-white/10 animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <div className="size-2 bg-emerald-400 rounded-full animate-pulse"></div>
                            <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">NutriTico Bio-Link Activo</p>
                        </div>
                        <button onClick={() => setShowChat(false)} className="text-slate-500 hover:text-white transition-colors">
                            <Plus size={20} className="rotate-45" />
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Ej: 'Añade 1 huevo al desayuno...'"
                            value={chatQuery}
                            onChange={e => setChatQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleConsult()}
                            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-emerald-500 transition-all"
                        />
                        <button
                            onClick={handleConsult}
                            disabled={loading}
                            className="size-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center disabled:opacity-50"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
