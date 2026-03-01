import React from 'react';
import { useGlobalState } from '../context/GlobalState';
import { Calendar as CalendarIcon, Utensils, Zap, Edit3 } from 'lucide-react';

export const PlanViewer: React.FC = () => {
    const { state } = useGlobalState();

    // We expect the WeeklyPlan object to be populated by the AI.
    const plan = state.weeklyPlan[new Date().getDay()] || {};
    const isPlanEmpty = Object.keys(plan).length === 0;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white">Mi Plan Clínico</h2>
                    <p className="text-slate-400 mt-1">Basado en tus equivalencias y estrategia.</p>
                </div>
                <div className="size-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
                    <CalendarIcon className="text-emerald-500" />
                </div>
            </div>

            {isPlanEmpty ? (
                <div className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center">
                    <Utensils className="text-slate-600 mb-4" size={48} />
                    <h3 className="text-white text-lg font-bold">Tu plan está en blanco</h3>
                    <p className="text-slate-400 max-w-sm mt-2">
                        Habla con el Consultorio IA en el panel lateral para que genere tu plan semanal en base a tus calorías objetivo y patologías.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {(['Desayuno', 'Almuerzo', 'Merienda', 'Cena'] as const).map(meal => {
                        const items = plan[meal] || [];
                        if (items.length === 0) return null;

                        return (
                            <div key={meal} className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden">
                                <div className="p-4 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                                    <h4 className="text-white font-black uppercase tracking-widest text-xs flex items-center gap-2">
                                        <Zap size={14} className="text-emerald-500" />
                                        {meal}
                                    </h4>
                                    <button className="text-slate-500 hover:text-white transition-all">
                                        <Edit3 size={16} />
                                    </button>
                                </div>
                                <div className="p-4 space-y-3">
                                    {items.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-black/20 p-4 rounded-2xl">
                                            <div>
                                                <span className="text-white font-bold">{item.foodId}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-emerald-400 font-black text-lg">{item.portions}</span>
                                                <span className="text-slate-500 text-[10px] ml-1 uppercase font-black tracking-widest">Porciones</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
