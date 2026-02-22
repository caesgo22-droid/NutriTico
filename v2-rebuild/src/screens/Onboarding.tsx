import React, { useState } from 'react';
import { useGlobalState } from '../context/GlobalState';
import { User, Activity, Target, Zap, ChevronRight, ChevronLeft } from 'lucide-react';

export const Onboarding: React.FC = () => {
    const { state, actions } = useGlobalState();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [localProfile, setLocalProfile] = useState(state.profile);

    const updateProfile = (updates: Partial<typeof localProfile>) => {
        setLocalProfile({ ...localProfile, ...updates });
    };

    const calculateInitialPlan = () => {
        setLoading(true);
        // Lógica simplificada de Mifflin-St Jeor heredada de la iteración anterior
        const s = localProfile.gender === 'male' ? 5 : -161;
        const bmr = 10 * localProfile.weight + 6.25 * localProfile.height - 5 * localProfile.age + s;
        const maintenance = Math.round(bmr * localProfile.activityLevel);

        let targetCals = maintenance;
        if (localProfile.goal === 'lose') targetCals -= 500;
        if (localProfile.goal === 'gain') targetCals += 400;

        actions.setProfile(localProfile);
        // Aquí se generaría el plan inicial (puedes añadir lógica más compleja después)
        actions.completeOnboarding();
        setTimeout(() => actions.syncToCloud(), 500);
    };

    return (
        <div className="min-h-screen bg-emerald-600 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#10b981_0%,transparent_60%)]"></div>

            <div className="w-full max-w-xl bg-white rounded-[3rem] shadow-2xl relative z-10 flex flex-col min-h-[600px] overflow-hidden">
                <div className="h-2 bg-slate-100 w-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }}></div>
                </div>

                <div className="p-10 flex-1 flex flex-col">
                    {step === 1 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-8">
                            <div className="space-y-2">
                                <h2 className="text-3xl font-black text-slate-800">Conozcámonos</h2>
                                <p className="text-slate-500 font-medium">Ingresa tus datos básicos para calibrar tu IA.</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Nombre Completo</label>
                                    <input
                                        type="text"
                                        value={localProfile.name}
                                        onChange={(e) => updateProfile({ name: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-800 outline-none focus:border-emerald-500 transition-all font-semibold"
                                        placeholder="Ej. Juan Pérez"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Peso (kg)</label>
                                        <input
                                            type="number"
                                            value={localProfile.weight}
                                            onChange={(e) => updateProfile({ weight: Number(e.target.value) })}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-800 outline-none focus:border-emerald-500 transition-all font-semibold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Altura (cm)</label>
                                        <input
                                            type="number"
                                            value={localProfile.height}
                                            onChange={(e) => updateProfile({ height: Number(e.target.value) })}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-800 outline-none focus:border-emerald-500 transition-all font-semibold"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    {(['male', 'female'] as const).map(g => (
                                        <button
                                            key={g}
                                            onClick={() => updateProfile({ gender: g })}
                                            className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] border-2 transition-all ${localProfile.gender === g ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-100 text-slate-400'}`}
                                        >
                                            {g === 'male' ? 'Hombre' : 'Mujer'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-8">
                            <div className="space-y-2">
                                <h2 className="text-3xl font-black text-slate-800">Tu Ritmo</h2>
                                <p className="text-slate-500 font-medium">Selecciona tu nivel de actividad semanal diaria.</p>
                            </div>

                            <div className="space-y-3">
                                {[
                                    { v: 1.2, l: 'Sedentario', d: 'Poca o ninguna actividad' },
                                    { v: 1.375, l: 'Ligero', d: 'Ejercicio 1-3 días/sem' },
                                    { v: 1.55, l: 'Moderado', d: 'Ejercicio 3-5 días/sem' },
                                    { v: 1.725, l: 'Activo', d: 'Ejercicio 6-7 días/sem' },
                                    { v: 1.9, l: 'Intenso', d: 'Atleta o trabajo físico' }
                                ].map((act) => (
                                    <button
                                        key={act.v}
                                        onClick={() => updateProfile({ activityLevel: act.v as any })}
                                        className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${localProfile.activityLevel === act.v ? 'bg-emerald-50 border-emerald-500' : 'border-slate-100 hover:border-slate-200'}`}
                                    >
                                        <div className={`size-10 rounded-xl flex items-center justify-center ${localProfile.activityLevel === act.v ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                            <Activity size={20} />
                                        </div>
                                        <div>
                                            <p className={`font-black uppercase text-xs ${localProfile.activityLevel === act.v ? 'text-emerald-700' : 'text-slate-700'}`}>{act.l}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">{act.d}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-8">
                            <div className="space-y-2">
                                <h2 className="text-3xl font-black text-slate-800">Casi Listo</h2>
                                <p className="text-slate-500 font-medium">¿Cuál es tu objetivo principal con NutriTico?</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { id: 'lose', l: 'Bajar Grasa', i: Zap },
                                    { id: 'maintain', l: 'Peso Ideal', i: Target },
                                    { id: 'gain', l: 'Ganar Músculo', i: Activity }
                                ].map((goal) => {
                                    const Icon = goal.i;
                                    return (
                                        <button
                                            key={goal.id}
                                            onClick={() => updateProfile({ goal: goal.id as any })}
                                            className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-4 text-center ${localProfile.goal === goal.id ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-100 hover:border-slate-200'}`}
                                        >
                                            <Icon size={32} strokeWidth={2.5} />
                                            <span className="font-black uppercase text-[10px] tracking-widest">{goal.l}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="bg-slate-50 p-6 rounded-[2rem] space-y-3">
                                <p className="text-[10px] font-black uppercase text-slate-400 text-center tracking-widest">Estrategia Clínica Sugerida</p>
                                <div className="flex gap-2">
                                    {['Balanceado', 'Keto', 'Ciclado'].map(s => (
                                        <button
                                            key={s}
                                            onClick={() => updateProfile({ strategy: [s.toLowerCase()] })}
                                            className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${localProfile.strategy.includes(s.toLowerCase()) ? 'bg-slate-800 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-auto flex gap-4 pt-10">
                        {step > 1 && (
                            <button
                                onClick={() => setStep(step - 1)}
                                className="size-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-slate-200 transition-all"
                            >
                                <ChevronLeft size={24} />
                            </button>
                        )}
                        <button
                            onClick={() => step < 3 ? setStep(step + 1) : calculateInitialPlan()}
                            disabled={loading || (step === 1 && !localProfile.name)}
                            className="flex-1 bg-emerald-600 text-white font-black rounded-3xl py-5 shadow-xl shadow-emerald-200 hover:bg-emerald-500 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? 'Inicializando IA...' : (step === 3 ? 'Generar Mi Plan' : 'Siguiente')}
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
