import React, { useState, useEffect } from 'react';
import { useGlobalState } from '../context/GlobalState';

export const Fasting: React.FC = () => {
  const { state, actions } = useGlobalState();
  const [elapsed, setElapsed] = useState("00:00:00");
  const [progress, setProgress] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    let interval: number;
    if (state.fasting.isActive && state.fasting.startTime) {
      interval = window.setInterval(() => {
        const start = new Date(state.fasting.startTime!).getTime();
        const now = Date.now();
        const diff = now - start;

        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);

        setElapsed(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        setProgress(Math.min(100, (diff / (state.fasting.targetHours * 3600000)) * 100));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [state.fasting.isActive, state.fasting.startTime, state.fasting.targetHours]);

  const toggleFasting = () => {
    if (state.fasting.isActive) setShowSummary(true);
    else actions.setFastingStatus(true);
  };

  const finalize = () => {
    actions.stopFasting();
    setShowSummary(false);
  };

  const fastingOptions = [12, 16, 20, 24];

  return (
    <div className="flex-1 overflow-y-auto pb-24 bg-background-light no-scrollbar">
      <header className="w-full bg-white px-6 py-4 border-b border-primary/10 sticky top-0 z-40">
        <h1 className="text-xl font-bold text-primary">Sincronización Metabólica</h1>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Control de Ventanas de Ayuno</p>
      </header>

      <div className="p-4 flex flex-col items-center space-y-8 max-w-lg mx-auto">
        {/* Main Controls Card */}
        <section className="w-full bg-white p-6 rounded-[2.5rem] shadow-sm border border-primary/5 flex flex-col items-center space-y-8">
          <div className="w-full space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Elegir Meta (Horas)</p>
            <div className="flex justify-between bg-slate-50 p-1 rounded-2xl border border-slate-100 shadow-inner">
              {fastingOptions.map((opt) => (
                <button
                  key={opt}
                  disabled={state.fasting.isActive}
                  onClick={() => actions.updateFastingTarget(opt)}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${state.fasting.targetHours === opt
                      ? 'bg-primary text-white shadow-md scale-105'
                      : 'text-slate-400 hover:text-slate-600 disabled:opacity-50'
                    }`}
                >
                  {opt}h
                </button>
              ))}
            </div>
          </div>

          <div className="relative size-60 flex items-center justify-center mt-4">
            <svg className="size-full -rotate-90 text-primary transition-all duration-1000">
              <circle className="text-slate-50" cx="120" cy="120" r="108" stroke="currentColor" strokeWidth="12" fill="transparent" />
              <circle
                className="text-primary transition-all duration-1000 origin-center"
                cx="120" cy="120" r="108"
                stroke="currentColor" strokeWidth="12" fill="transparent"
                strokeDasharray="678.5"
                strokeDashoffset={678.5 - (678.5 * progress) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Llevas</p>
              <p className="text-4xl font-black text-primary tabular-nums my-1">{state.fasting.isActive ? elapsed : '00:00:00'}</p>
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold">
                  <span className="material-symbols-outlined text-xs">flag</span>
                  {state.fasting.targetHours}h Meta
                </div>
                {state.fasting.isActive && (
                  <div className="mt-2 text-[9px] font-black uppercase tracking-widest text-center animate-in fade-in">
                    {progress >= (12 / state.fasting.targetHours) * 100 && progress < (16 / state.fasting.targetHours) * 100 ? (
                      <span className="text-blue-500 bg-blue-50 px-2 py-1 rounded w-full line-clamp-2">🔥 Cetosis Leve Activa</span>
                    ) : progress >= (16 / state.fasting.targetHours) * 100 && progress < (20 / state.fasting.targetHours) * 100 ? (
                      <span className="text-purple-500 bg-purple-50 px-2 py-1 rounded w-full line-clamp-2">✨ Autofagia Iniciada</span>
                    ) : progress >= (20 / state.fasting.targetHours) * 100 ? (
                      <span className="text-accent-lime bg-accent-lime/10 px-2 py-1 rounded w-full line-clamp-2">💪 Pico HGH Max.</span>
                    ) : (
                      <span className="text-slate-400">Digestión...</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={toggleFasting}
            className={`w-full py-5 rounded-[1.5rem] font-bold shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${state.fasting.isActive ? 'bg-slate-700 text-white shadow-slate-200' : 'bg-primary text-white shadow-primary/20'}`}
          >
            <span className="material-symbols-outlined">{state.fasting.isActive ? 'stop_circle' : 'play_circle'}</span>
            {state.fasting.isActive ? 'Detener Ayuno' : 'Iniciar Ayuno'}
          </button>
        </section>

        {/* Stats & History List */}
        <section className="w-full space-y-4">
          <h3 className="text-sm font-bold text-primary uppercase tracking-wider ml-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">history</span>
            Historial de Sesiones
          </h3>

          <div className="bg-white rounded-[2rem] shadow-sm border border-primary/5 overflow-hidden">
            {state.fasting.history.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <span className="material-symbols-outlined text-4xl text-slate-100">timer_off</span>
                <p className="text-slate-400 text-xs italic">Aún no hay registros de ayuno.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {[...state.fasting.history].reverse().map((h, i) => (
                  <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`size-10 rounded-xl flex items-center justify-center ${h.completed ? 'bg-accent-lime/10 text-accent-lime' : 'bg-orange-100 text-orange-500'}`}>
                        <span className="material-symbols-outlined text-xl">{h.completed ? 'verified' : 'timer'}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700">
                          {new Date(h.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          Duración: {h.duration} horas
                        </p>
                      </div>
                    </div>
                    {h.completed && (
                      <div className="flex items-center gap-1 text-[9px] font-bold text-accent-lime uppercase bg-accent-lime/5 px-2 py-1 rounded-full border border-accent-lime/20">
                        <span className="material-symbols-outlined text-xs">auto_awesome</span>
                        Meta
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {showSummary && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl space-y-6 text-center animate-in zoom-in duration-200">
            <div className="size-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl">done_all</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-primary">Finalizar Sesión</h3>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">¿Confirmas el registro de este ayuno en tu historial metabólico?</p>
            </div>
            <div className="bg-slate-50 p-5 rounded-3xl flex flex-col gap-1 border border-slate-100 shadow-inner">
              <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Tiempo Acumulado</span>
              <span className="text-3xl font-black text-primary tabular-nums">{elapsed}</span>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={finalize} className="w-full py-5 bg-primary text-white rounded-[1.5rem] font-bold shadow-lg shadow-primary/20 hover:bg-primary-light transition-all active:scale-95">Guardar Registro</button>
              <button onClick={() => setShowSummary(false)} className="text-slate-400 text-[10px] font-bold uppercase tracking-widest py-2 hover:text-primary transition-colors">Seguir Ayunando</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};