import React, { useState, useMemo } from 'react';
import { useGlobalState } from '../context/GlobalState';
import { consultNutriTico } from '../services/aiCore';
import { Sparkles, Send, Brain, ChevronRight, Apple, Zap, Flame } from 'lucide-react';

export const Dashboard: React.FC<{ onNavigate: (s: string) => void }> = ({ onNavigate }) => {
    const { state, actions } = useGlobalState();
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [aiResponse, setAiResponse] = useState<string | null>(null);

    const stats = useMemo(() => {
        // Cálculo de macros consumidos (simplificado para v2 inicial)
        return {
            cals: 1250,
            p: 85,
            c: 110,
            f: 45,
            targets: state.calculatedTargets
        };
    }, [state.calculatedTargets]);

    const handleConsult = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setAiResponse(null);
        try {
            const res = await consultNutriTico(state, actions, query);
            if (res.planCommands?.length) actions.applyAICommands(res.planCommands);
            setAiResponse(res.text);
            setQuery('');
            actions.syncToCloud();
        } catch (e) {
            setAiResponse("Hubo un error al conectar con mi núcleo. Por favor intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto pb-32 bg-slate-50 no-scrollbar">
            {/* Bio-Header */}
            <header className="bg-emerald-600 p-8 pt-12 rounded-b-[4rem] shadow-2xl shadow-emerald-900/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 size-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>

                <div className="relative z-10 space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-emerald-100 text-[10px] font-black uppercase tracking-[0.2em]">Estado Metabólico</p>
                            <h1 className="text-3xl font-black text-white mt-1">¡Hola, {state.profile.name.split(' ')[0]}!</h1>
                        </div>
                        <div className="size-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/20">
                            <Brain size={28} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/10">
                            <p className="text-emerald-200 text-[9px] font-bold uppercase">Calorías Totales</p>
                            <p className="text-2xl font-black text-white mt-1">{stats.cals} <span className="text-xs opacity-50 font-medium">/ {stats.targets.calories}</span></p>
                            <div className="h-1.5 w-full bg-white/10 rounded-full mt-3 overflow-hidden">
                                <div className="h-full bg-emerald-400" style={{ width: '65%' }}></div>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/10 flex flex-col justify-center">
                            <p className="text-emerald-200 text-[9px] font-bold uppercase">Estrategia Activa</p>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="size-2 bg-emerald-400 rounded-full animate-pulse"></div>
                                <p className="text-sm font-black text-white uppercase tracking-wider">{state.profile.strategy[0]}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="p-6 space-y-6 max-w-lg mx-auto -mt-6">
                {/* Quick Actions */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { l: 'Proteína', v: stats.p, t: stats.targets.protein, c: 'text-emerald-600', i: Flame },
                        { l: 'Carbos', v: stats.c, t: stats.targets.carbs, c: 'text-blue-600', i: Zap },
                        { l: 'Grasas', v: stats.f, t: stats.targets.fat, c: 'text-amber-500', i: Apple }
                    ].map(m => {
                        const Icon = m.i;
                        return (
                            <div key={m.l} className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center gap-2">
                                <div className={`size-10 rounded-xl bg-slate-50 flex items-center justify-center ${m.c}`}>
                                    <Icon size={18} />
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase">{m.l}</p>
                                <p className="text-sm font-black text-slate-800">{m.v}g</p>
                            </div>
                        );
                    })}
                </div>

                {/* AI Smart Input */}
                <section className="bg-white p-6 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-4 relative overflow-hidden">
                    <div className="flex items-center gap-3">
                        <div className="size-10 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Sparkles size={20} fill="currentColor" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-tight">NutriTico IA</h3>
                            <p className="text-[10px] text-emerald-600 font-bold uppercase">Online • Procesador Bio-Analítico</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="¿Qué almorzamos hoy?"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleConsult()}
                            className="flex-1 bg-slate-50 rounded-2xl px-5 py-4 text-sm outline-none border border-slate-100 focus:border-emerald-500/30 transition-all font-medium"
                        />
                        <button
                            onClick={handleConsult}
                            disabled={loading}
                            className="size-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all disabled:opacity-50"
                        >
                            {loading ? <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Send size={20} />}
                        </button>
                    </div>

                    {aiResponse && (
                        <div className="mt-4 p-5 bg-emerald-50 rounded-[2rem] border border-emerald-100 animate-in fade-in slide-in-from-top-4">
                            <p className="text-xs text-emerald-900 leading-relaxed font-semibold italic">"{aiResponse}"</p>
                        </div>
                    )}
                </section>

                {/* Recent Card */}
                <div onClick={() => onNavigate('plan')} className="bg-slate-900 p-6 rounded-[3rem] flex items-center justify-between text-white cursor-pointer group hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20">
                    <div className="flex items-center gap-4">
                        <div className="size-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Calendar size={22} className="text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Ver Mi Plan</p>
                            <h4 className="text-sm font-bold">Planificación Semanal</h4>
                        </div>
                    </div>
                    <ChevronRight className="text-slate-600" />
                </div>
            </div>
        </div>
    );
};

const Calendar = ({ size, className }: { size: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);
