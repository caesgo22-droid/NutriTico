
import React, { useState, useEffect, useMemo } from 'react';
import { useGlobalState } from '../context/GlobalState';
import { consultNutriTico } from '../services/aiCore';
import { equivalencies } from './Plan';
import { Tooltip } from '../components/Tooltip';
import { AIResponse } from '../types';

export const Dashboard: React.FC<{ onNavigate: (s: string) => void }> = ({ onNavigate }) => {
    const { state, actions } = useGlobalState();
    const [query, setQuery] = useState('');
    const [aiResult, setAiResult] = useState<AIResponse | null>(null);
    const [loading, setLoading] = useState(false);

    const stats = useMemo(() => {
        let cals = 0, p = 0, c = 0, f = 0;
        const today = state.weeklyPlan[0] || {};
        Object.entries(today).forEach(([meal, groups]) => {
            Object.entries(groups).forEach(([group, items]) => {
                Object.entries(items).forEach(([id, qty]) => {
                    const item = (equivalencies[group] || []).find(it => it.id === id);
                    const log = state.consumedItems[`0-${meal}-${group}-${id}`];
                    if (item && log?.consumed) {
                        cals += item.calories * (qty as number) * log.factor;
                        p += item.macros.p * (qty as number) * log.factor;
                        c += (state.profile.strategy.includes('keto') ? item.macros.c - item.macros.fiber : item.macros.c) * (qty as number) * log.factor;
                        f += item.macros.f * (qty as number) * log.factor;
                    }
                });
            });
        });
        return { cals, p, c, f, targets: state.calculatedTargets };
    }, [state.weeklyPlan, state.consumedItems, state.profile.strategy, state.calculatedTargets]);

    const handleAsk = async () => {
        if (!query.trim()) return;
        setLoading(true);
        const res = await consultNutriTico(state, actions, query);

        // EJECUCIÓN DE COMANDOS (Hallazgo Auditoría 1.1) - Ahora funciona en Dashboard
        if (res.planCommands && res.planCommands.length > 0) {
            actions.applyAICommands(res.planCommands);
        }

        setAiResult(res);
        setLoading(false);
        setQuery('');
        actions.syncToCloud();
    };

    return (
        <div className="flex-1 overflow-y-auto pb-24 bg-background-light no-scrollbar">
            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-primary/10 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div onClick={() => onNavigate('profile')} className="size-14 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-black cursor-pointer shadow-lg shadow-primary/20 relative overflow-hidden group">
                        <span className="relative z-10">{state.profile.name[0]}</span>
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Elite Member</p>
                            {state.user.lastSync && (
                                <span className="text-[8px] text-accent-lime font-black uppercase">● Cloud Sync</span>
                            )}
                        </div>
                        <h1 className="text-xl font-bold text-primary leading-tight">Pura Vida, {state.profile.name.split(' ')[0]}</h1>
                    </div>
                </div>
                <div className="flex gap-1 bg-slate-100 p-1 rounded-full border border-slate-200">
                    {(['rest', 'moderate', 'high'] as const).map(i => (
                        <Tooltip key={i} content={i === 'high' ? 'Modo Entrenamiento: Ciclado de Carbos' : i === 'rest' ? 'Modo Descanso: Oxidación de Grasa' : 'Modo Balanceado'}>
                            <button onClick={() => { actions.setTrainingIntensity(i); actions.syncToCloud(); }} className={`size-10 rounded-full flex items-center justify-center transition-all ${state.trainingIntensity === i ? 'bg-primary text-white shadow-md scale-110 z-10' : 'text-slate-400 hover:text-primary/50'}`}>
                                <span className="material-symbols-outlined text-xl">{i === 'high' ? 'bolt' : i === 'rest' ? 'bed' : 'directions_run'}</span>
                            </button>
                        </Tooltip>
                    ))}
                </div>
            </header>

            <div className="p-6 space-y-6 max-w-lg mx-auto">
                {/* Dashboard Sync Hero con BMI y Peso */}
                <section className="bg-primary p-8 rounded-[3rem] shadow-2xl shadow-primary/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 size-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                    <div className="relative z-10 space-y-6">
                        <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                                <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                                    <p className="text-white/40 text-[8px] font-black uppercase tracking-widest">Peso Actual</p>
                                    <p className="text-2xl font-black text-white mt-1">{state.profile.weight}<span className="text-[10px] opacity-50 ml-1">kg</span></p>
                                </div>
                                <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                                    <p className="text-white/40 text-[8px] font-black uppercase tracking-widest">IMC (BMI)</p>
                                    <p className="text-2xl font-black text-white mt-1">
                                        {(state.profile.weight / (state.profile.height / 100) ** 2).toFixed(1)}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => actions.syncToCloud()} className="size-10 bg-white/10 rounded-2xl flex items-center justify-center text-white hover:bg-white/20 transition-all">
                                <span className="material-symbols-outlined text-xl">cloud_sync</span>
                            </button>
                        </div>

                        <div className="pt-4 border-t border-white/5">
                            <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">Calorías Consumidas Hoy</p>
                            <h2 className="text-4xl font-black text-white mt-1 tabular-nums">
                                {Math.round(stats.cals)} <span className="text-sm font-normal opacity-50">/ {stats.targets.calories} kcal</span>
                            </h2>
                        </div>

                        <div className="space-y-2">
                            <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden p-0.5 border border-white/5">
                                <div className="bg-accent-lime h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(132,204,22,0.5)]" style={{ width: `${Math.min(100, (stats.cals / stats.targets.calories) * 100)}%` }}></div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-primary/5 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="size-10 bg-accent-lime text-white rounded-xl flex items-center justify-center shadow-lg shadow-accent-lime/20">
                            <span className="material-symbols-outlined">psychology</span>
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-primary uppercase tracking-widest">Asistente Científico</h3>
                            <p className="text-[10px] text-slate-400 font-bold">Conectado a Base de Datos de Costa Rica</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="¿Es mejor el Pejibaye o la Yuca?"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAsk()}
                            className="flex-1 bg-slate-50 rounded-2xl px-5 py-4 text-sm outline-none border border-slate-100 focus:border-primary/20 transition-all font-medium placeholder:text-slate-300"
                        />
                        <button onClick={handleAsk} disabled={loading} className="size-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 active:scale-90 transition-all disabled:opacity-50">
                            <span className="material-symbols-outlined text-2xl">{loading ? 'sync' : 'smart_toy'}</span>
                        </button>
                    </div>

                    {aiResult && (
                        <div className="mt-4 p-6 bg-slate-50 rounded-[2rem] space-y-4 border border-slate-100 animate-in fade-in slide-in-from-top-4">
                            {aiResult.actionTaken && (
                                <div className="bg-accent-lime/10 text-accent-lime px-3 py-1 rounded-full text-[9px] font-black uppercase inline-block border border-accent-lime/20">
                                    IA Activa: {aiResult.actionTaken}
                                </div>
                            )}
                            <p className="text-xs text-slate-700 leading-relaxed font-semibold italic">"{aiResult.text}"</p>
                            {aiResult.sources.length > 0 && (
                                <div className="pt-4 border-t border-slate-200 space-y-2">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Fuentes de Veracidad Científica:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {aiResult.sources.map((s, i) => (
                                            <a key={i} href={s.uri} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[9px] text-primary font-black hover:bg-primary hover:text-white transition-all shadow-sm">
                                                <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                                                {s.title.substring(0, 20)}...
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* Macros Breakdown */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { l: 'Proteína', v: stats.p, t: stats.targets.protein, c: 'text-primary', b: 'bg-primary' },
                        { l: 'Carbos', v: stats.c, t: stats.targets.carbs, c: 'text-accent-lime', b: 'bg-accent-lime' },
                        { l: 'Grasas', v: stats.f, t: stats.targets.fat, c: 'text-yellow-500', b: 'bg-yellow-500' }
                    ].map(m => {
                        const isOverLimit = m.v > m.t;
                        const barColor = (m.l === 'Carbos' && isOverLimit) ? 'bg-red-500' : m.b;
                        const textColor = (m.l === 'Carbos' && isOverLimit) ? 'text-red-500' : m.c;

                        return (
                            <div key={m.l} className="bg-white p-5 rounded-[2rem] border border-primary/5 shadow-sm space-y-2">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{m.l}</p>
                                <p className={`text-xl font-black ${textColor}`}>{Math.round(m.v)}g</p>
                                <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden">
                                    <div className={`${barColor} h-full transition-all duration-1000`} style={{ width: `${Math.min(100, (m.v / m.t) * 100)}%` }}></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
