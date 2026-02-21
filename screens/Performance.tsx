import React, { useMemo, useState } from 'react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip as ChartTooltip, CartesianGrid, Legend } from 'recharts';
import { useGlobalState } from '../context/GlobalState';
import { Tooltip } from '../components/Tooltip';

type MetricType = 'weight' | 'fatPct' | 'muscleKg' | 'waterPct' | 'boneKg' | 'imc';

export const Performance: React.FC = () => {
  const { state, actions } = useGlobalState();
  const [activeMetric, setActiveMetric] = useState<MetricType>('weight');
  const [isMultiView, setIsMultiView] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [isLogging, setIsLogging] = useState(false);

  const metricsInfo: Record<MetricType, { label: string, unit: string, color: string, tooltip: string }> = {
      weight: { label: 'Peso', unit: 'kg', color: '#004c24', tooltip: "Tu masa corporal total." },
      fatPct: { label: 'Grasa', unit: '%', color: '#f87171', tooltip: "Porcentaje de grasa corporal. Crucial para el cálculo Katch-McArdle." },
      muscleKg: { label: 'Músculo', unit: 'kg', color: '#eab308', tooltip: "Masa magra. Entre más tengas, mayor será tu quema calórica en reposo." },
      waterPct: { label: 'Agua', unit: '%', color: '#38bdf8', tooltip: "Nivel de hidratación celular." },
      boneKg: { label: 'Huesos', unit: 'kg', color: '#6366f1', tooltip: "Masa ósea estimada." },
      imc: { label: 'IMC', unit: '', color: '#f97316', tooltip: "Relación peso/altura. Menos preciso en atletas con mucho músculo." },
  };

  const chartData = useMemo(() => {
    return state.weightHistory.map(entry => ({
        name: new Date(entry.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
        ...entry
    }));
  }, [state.weightHistory]);

  const handleLog = () => {
      if (newWeight) {
          actions.logWeight(parseFloat(newWeight));
          setNewWeight('');
          setIsLogging(false);
      }
  };

  const latestData = state.weightHistory[state.weightHistory.length - 1];

  return (
    <div className="flex-1 overflow-y-auto pb-24 bg-background-light no-scrollbar">
      <header className="sticky top-0 z-40 bg-white border-b border-primary/10 px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-primary">Biometría & Progreso</h1>
          <button onClick={() => setIsLogging(true)} className="size-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all">
              <span className="material-symbols-outlined">add</span>
          </button>
      </header>

      <div className="p-4 space-y-6 max-w-lg mx-auto">
          {/* Toggle View Card */}
          <div className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-primary/5 flex items-center justify-between">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Modo de Análisis</h2>
            <button 
                onClick={() => setIsMultiView(!isMultiView)}
                className={`text-[10px] font-bold uppercase px-4 py-2 rounded-full border transition-all flex items-center gap-2 ${isMultiView ? 'bg-primary text-white border-primary shadow-md' : 'bg-slate-50 text-slate-500 border-slate-100'}`}
            >
                <span className="material-symbols-outlined text-xs">{isMultiView ? 'layers' : 'layers_clear'}</span>
                {isMultiView ? 'Ver Todas' : 'Ver Individual'}
            </button>
          </div>

          {/* Metric Scroller (Only if Individual View) */}
          {!isMultiView && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {(Object.keys(metricsInfo) as MetricType[]).map((key) => (
                    <button
                        key={key}
                        onClick={() => setActiveMetric(key)}
                        className={`px-5 py-3 rounded-2xl font-bold text-[10px] uppercase whitespace-nowrap transition-all border-2 ${activeMetric === key ? 'bg-primary text-white border-primary shadow-md scale-105' : 'bg-white text-slate-400 border-slate-50 hover:border-primary/10'}`}
                    >
                        {metricsInfo[key].label}
                    </button>
                ))}
            </div>
          )}

          {/* Chart Section */}
          <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-primary/5 space-y-6">
              <div className="flex justify-between items-end">
                  <div>
                    <div className="flex items-center gap-2">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            {isMultiView ? 'Análisis de Correlación' : `Evolución: ${metricsInfo[activeMetric].label}`}
                        </p>
                        {!isMultiView && (
                            <Tooltip content={metricsInfo[activeMetric].tooltip}>
                                <span className="material-symbols-outlined text-slate-300 text-xs">help</span>
                            </Tooltip>
                        )}
                    </div>
                    <p className="text-3xl font-black text-primary">
                        {isMultiView ? 'Completo' : `${latestData ? (latestData as any)[activeMetric] : '--'} `}
                        {!isMultiView && <span className="text-xs font-normal opacity-50">{metricsInfo[activeMetric].unit}</span>}
                    </p>
                  </div>
                  {chartData.length > 0 && !isMultiView && (
                      <span className="text-xs font-bold text-accent-lime bg-accent-lime/10 px-3 py-1 rounded-full mb-1">
                          Último registro
                      </span>
                  )}
              </div>
              <div className="h-72 -ml-6 pr-2">
                  {chartData.length > 1 ? (
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                              <defs>
                                  {(Object.keys(metricsInfo) as MetricType[]).map((key) => (
                                    <linearGradient key={`grad-${key}`} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={metricsInfo[key].color} stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor={metricsInfo[key].color} stopOpacity={0}/>
                                    </linearGradient>
                                  ))}
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="name" hide={isMultiView} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} />
                              <YAxis hide={isMultiView} domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                              <ChartTooltip 
                                contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }} 
                                labelStyle={{ fontWeight: 'bold', marginBottom: '8px', color: '#004c24' }}
                              />
                              
                              {isMultiView ? (
                                  (Object.keys(metricsInfo) as MetricType[]).map((key) => (
                                    <Area 
                                        key={key}
                                        type="monotone" 
                                        dataKey={key} 
                                        name={metricsInfo[key].label}
                                        stroke={metricsInfo[key].color} 
                                        fill={`url(#grad-${key})`} 
                                        strokeWidth={3}
                                        dot={{ fill: metricsInfo[key].color, r: 2 }}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                  ))
                              ) : (
                                <Area 
                                    type="monotone" 
                                    dataKey={activeMetric} 
                                    name={metricsInfo[activeMetric].label}
                                    stroke={metricsInfo[activeMetric].color} 
                                    fill={`url(#grad-${activeMetric})`} 
                                    strokeWidth={4}
                                    dot={{ fill: metricsInfo[activeMetric].color, r: 4 }}
                                    activeDot={{ r: 8, strokeWidth: 0 }}
                                />
                              )}
                          </AreaChart>
                      </ResponsiveContainer>
                  ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-300 text-xs gap-3">
                        <span className="material-symbols-outlined text-5xl opacity-20">analytics</span>
                        <p className="italic text-center px-8">Registra tu peso al menos dos veces para ver la tendencia de NutriTico IA.</p>
                      </div>
                  )}
              </div>
          </section>

          {/* Detailed Statistics Cards */}
          <section className="grid grid-cols-2 gap-4">
              {(Object.keys(metricsInfo) as MetricType[]).map((key) => (
                  <div key={key} className="bg-white p-5 rounded-[2rem] border border-primary/5 shadow-sm text-center space-y-1 hover:border-primary/20 transition-all group relative">
                      <div className="flex items-center justify-center gap-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest group-hover:text-primary transition-colors">{metricsInfo[key].label}</p>
                        <Tooltip content={metricsInfo[key].tooltip}>
                            <span className="material-symbols-outlined text-[10px] opacity-30">help</span>
                        </Tooltip>
                      </div>
                      <p className="text-2xl font-black text-slate-700">
                        {latestData ? (latestData as any)[key] : '--'} 
                        <span className="text-[10px] font-bold opacity-30 ml-1">{metricsInfo[key].unit}</span>
                      </p>
                  </div>
              ))}
          </section>
      </div>

      {isLogging && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl space-y-6 animate-in zoom-in duration-200">
                  <h3 className="text-xl font-bold text-primary text-center">Peso Actual</h3>
                  <p className="text-slate-400 text-xs text-center leading-relaxed">Al ingresar tu peso, la IA recalcula automáticamente tu IMC, masa muscular y grasa estimada.</p>
                  <div className="relative">
                      <input 
                        autoFocus
                        type="number" 
                        step="0.1"
                        placeholder="0.0"
                        value={newWeight}
                        onChange={(e) => setNewWeight(e.target.value)}
                        className="w-full text-center text-5xl font-black text-primary bg-slate-50 p-8 rounded-[2rem] outline-none shadow-inner border border-slate-100"
                      />
                      <span className="absolute right-8 top-1/2 -translate-y-1/2 text-primary/30 font-black text-xl">KG</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    <button onClick={handleLog} className="w-full py-5 bg-primary text-white rounded-[1.5rem] font-bold shadow-lg shadow-primary/20 hover:bg-primary-light active:scale-95 transition-all">Guardar Biometría</button>
                    <button onClick={() => setIsLogging(false)} className="w-full text-slate-400 text-[10px] font-bold uppercase tracking-widest py-2 hover:text-primary transition-colors">Cancelar</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
