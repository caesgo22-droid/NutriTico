import React, { useState } from 'react';
import { useGlobalState } from '../context/GlobalState';
import { Activity, Target, Zap, ChevronRight, ChevronLeft, ShieldCheck, HeartPulse } from 'lucide-react';
import { UserProfile, Gender, ActivityLevel, Goal, Strategy, ClinicalCondition } from '../types';
import { Tooltip } from '../components/Tooltip';

export const Onboarding: React.FC = () => {
    const { state, dispatch } = useGlobalState();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [localProfile, setLocalProfile] = useState<UserProfile>(state.profile);

    const updateProfile = (updates: Partial<UserProfile>) => {
        setLocalProfile(prev => ({ ...prev, ...updates }));
    };

    const handleComplete = () => {
        setLoading(true);
        dispatch({ type: 'SET_PROFILE', payload: localProfile });
        // Simulation of initial plan generation or sync
        setTimeout(() => {
            setLoading(false);
            // In a real app, we'd trigger a navigate or state change here
        }, 1500);
    };

    const steps = [
        { id: 1, title: 'Datos Básicos', desc: 'Calibramos tu motor metabólico.' },
        { id: 2, title: 'Tu Actividad', desc: '¿Cómo es tu ritmo diario?' },
        { id: 3, title: 'Tu Objetivo', desc: '¿Qué quieres lograr?' },
        { id: 4, title: 'Perfil Clínico', desc: 'Atención especial y estrategias.' }
    ];

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 flex items-center justify-center p-4 selection:bg-emerald-500/30">
            {/* Background Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full"></div>
            </div>

            <div className="w-full max-w-xl relative flex flex-col min-h-[600px]">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="size-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                            <HeartPulse className="text-white" size={28} />
                        </div>
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-white uppercase italic">NutriTico <span className="text-emerald-500">v3</span></h1>
                </div>

                {/* Card */}
                <div className="flex-1 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl flex flex-col relative overflow-hidden">
                    {/* Progress Bar */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
                        <div
                            className="h-full bg-emerald-500 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                            style={{ width: `${(step / 4) * 100}%` }}
                        ></div>
                    </div>

                    <div className="mb-10">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-2 block">Paso {step} de 4</span>
                        <h2 className="text-3xl font-black text-white leading-tight">{steps[step - 1].title}</h2>
                        <p className="text-slate-400 font-medium mt-1">{steps[step - 1].desc}</p>
                    </div>

                    <div className="flex-1">
                        {step === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nombre</label>
                                    <input
                                        type="text"
                                        placeholder="Ej. Carlos Esquivel"
                                        value={localProfile.name}
                                        onChange={e => updateProfile({ name: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-emerald-500/50 focus:bg-white/[0.08] transition-all font-semibold text-white placeholder:text-slate-600"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Peso (kg)</label>
                                        <input
                                            type="number"
                                            value={localProfile.weight}
                                            onChange={e => updateProfile({ weight: Number(e.target.value) })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-emerald-500/50 transition-all font-semibold text-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Altura (cm)</label>
                                        <input
                                            type="number"
                                            value={localProfile.height}
                                            onChange={e => updateProfile({ height: Number(e.target.value) })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-emerald-500/50 transition-all font-semibold text-white"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    {(['male', 'female'] as Gender[]).map(g => (
                                        <button
                                            key={g}
                                            onClick={() => updateProfile({ gender: g })}
                                            className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] border transition-all ${localProfile.gender === g ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10'}`}
                                        >
                                            {g === 'male' ? 'Hombre' : 'Mujer'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-500">
                                {[
                                    { v: 1.2, l: 'Sedentario', d: 'Poca o ninguna actividad' },
                                    { v: 1.375, l: 'Ligero', d: 'Actividad 1-3 días/sem' },
                                    { v: 1.55, l: 'Moderado', d: 'Actividad 3-5 días/sem' },
                                    { v: 1.725, l: 'Activo', d: 'Actividad 6-7 días/sem' },
                                    { v: 1.9, l: 'Intenso', d: 'Atleta o trabajo físico' }
                                ].map((act) => (
                                    <button
                                        key={act.v}
                                        onClick={() => updateProfile({ activityLevel: act.v as ActivityLevel })}
                                        className={`w-full p-4 rounded-2xl border transition-all flex items-center gap-4 group ${localProfile.activityLevel === act.v ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                                    >
                                        <div className={`size-10 rounded-xl flex items-center justify-center transition-all ${localProfile.activityLevel === act.v ? 'bg-emerald-500 text-white' : 'bg-white/5 text-slate-500 group-hover:bg-white/10'}`}>
                                            <Activity size={20} />
                                        </div>
                                        <div className="text-left">
                                            <p className={`font-black uppercase text-xs tracking-wider ${localProfile.activityLevel === act.v ? 'text-emerald-400' : 'text-slate-300'}`}>{act.l}</p>
                                            <p className="text-[10px] text-slate-500 font-medium">{act.d}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {step === 3 && (
                            <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
                                {[
                                    { id: 'lose', l: 'Bajar Porcentaje de Grasa', i: Zap, desc: 'Déficit calórico controlado' },
                                    { id: 'maintain', l: 'Mejorar Composición Física', i: Target, desc: 'Balance metabólico perfecto' },
                                    { id: 'gain', l: 'Ganar Masa Muscular', i: Activity, desc: 'Superávit optimizado para fuerza' }
                                ].map((goal) => {
                                    const Icon = goal.i;
                                    const active = localProfile.goal === goal.id;
                                    return (
                                        <button
                                            key={goal.id}
                                            onClick={() => updateProfile({ goal: goal.id as Goal })}
                                            className={`p-6 rounded-3xl border transition-all text-left flex gap-5 items-center group ${active ? 'bg-emerald-500 border-emerald-500 shadow-xl shadow-emerald-500/20' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                                        >
                                            <div className={`size-14 rounded-2xl flex items-center justify-center transition-all ${active ? 'bg-white text-emerald-600' : 'bg-white/5 text-slate-500 group-hover:bg-white/10'}`}>
                                                <Icon size={28} />
                                            </div>
                                            <div>
                                                <span className={`block font-black uppercase text-xs tracking-widest ${active ? 'text-white' : 'text-slate-300'}`}>{goal.l}</span>
                                                <span className={`text-[10px] font-medium ${active ? 'text-emerald-100' : 'text-slate-500'}`}>{goal.desc}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Estrategia Clínica</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { id: 'balanceado', l: 'Balanceado', tip: 'Equilibrio de macronutrientes (Ej. 40% Carbos, 30% Prot, 30% Grasa). Ideal para mantenimiento y salud general.' },
                                            { id: 'keto', l: 'Keto (Alta Grasa)', tip: 'Cetosis metabólica mediante ingesta mínima de carbohidratos (< 5%) y alta en grasas saludables. Útil para recomposición rápida.' },
                                            { id: 'ayuno_intermitente', l: 'Ayuno (IF)', tip: 'Restricción de la ventana de alimentación (Ej. 16/8). Optimiza la sensibilidad a la insulina y autofagia.' },
                                            { id: 'ciclado', l: 'Ciclado Carbs', tip: 'Alternar días de altos/bajos carbohidratos según entrenamiento. Protege el músculo y acelera la quema de grasa.' }
                                        ].map(s => (
                                            <button
                                                key={s.id}
                                                onClick={() => {
                                                    const exists = localProfile.strategies.includes(s.id as Strategy);
                                                    const next = exists
                                                        ? localProfile.strategies.filter(x => x !== s.id)
                                                        : [...localProfile.strategies, s.id as Strategy];
                                                    updateProfile({ strategies: next });
                                                }}
                                                className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-2 ${localProfile.strategies.includes(s.id as Strategy) ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10'}`}
                                            >
                                                <span className="text-[10px] font-black uppercase tracking-widest text-left">{s.l}</span>
                                                <div onClick={e => e.stopPropagation()} className="shrink-0">
                                                    <Tooltip text={s.tip} />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Condiciones Médicas (DASH/ADA)</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {[
                                            { id: 'Hypertension', l: 'Hipertensión', tip: 'Enfoque clínico DASH: Bajo en sodio, rico en potasio para control vascular.' },
                                            { id: 'Diabetes', l: 'Diabetes / Insulina', tip: 'Control estricto del índice glucémico y priorización de fibra.' },
                                            { id: 'MetabolicSyndrome', l: 'Síndrome Metabólico', tip: 'Estrategia agresiva contra dislipidemia limitando azúcares y grasas saturadas.' },
                                            { id: 'HighPerformance', l: 'Alto Rendimiento', tip: 'Optimización de glucógeno para atletas. Mayor carga energética limpia.' }
                                        ].map(c => (
                                            <button
                                                key={c.id}
                                                onClick={() => {
                                                    const exists = localProfile.conditions.includes(c.id as ClinicalCondition);
                                                    const next = exists
                                                        ? localProfile.conditions.filter(x => x !== c.id)
                                                        : [...localProfile.conditions, c.id as ClinicalCondition];
                                                    updateProfile({ conditions: next });
                                                }}
                                                className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${localProfile.conditions.includes(c.id as ClinicalCondition) ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10'}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black uppercase text-[10px] tracking-widest">{c.l}</span>
                                                    <div onClick={e => e.stopPropagation()} className="mt-0.5">
                                                        <Tooltip text={c.tip} />
                                                    </div>
                                                </div>
                                                {localProfile.conditions.includes(c.id as ClinicalCondition) && <ShieldCheck size={16} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <div className="mt-10 flex gap-4 pt-6 border-t border-white/5">
                        {step > 1 && (
                            <button
                                onClick={() => setStep(step - 1)}
                                className="size-14 rounded-2xl bg-white/5 border border-white/10 text-slate-400 flex items-center justify-center hover:bg-white/10 transition-all active:scale-95"
                            >
                                <ChevronLeft size={24} />
                            </button>
                        )}
                        <button
                            onClick={() => step < 4 ? setStep(step + 1) : handleComplete()}
                            disabled={loading || (step === 1 && !localProfile.name)}
                            className="flex-1 bg-emerald-600 text-white font-black rounded-2xl py-4 shadow-xl shadow-emerald-500/20 hover:bg-emerald-500 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Iniciando v3...</span>
                                </div>
                            ) : (
                                <>
                                    <span>{step === 4 ? 'Generar Mi Plan' : 'Continuar'}</span>
                                    <ChevronRight size={20} />
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <p className="text-center mt-6 text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">IA Powered • Clinical Evidence • v3.0.0</p>
            </div>
        </div>
    );
};
