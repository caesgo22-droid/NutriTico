
import React, { useState, useMemo } from 'react';
import { useGlobalState } from '../context/GlobalState';
import { FoodItem, AIResponse } from '../types';
import { consultNutriTico } from '../services/aiCore';

export const equivalencies: Record<string, FoodItem[]> = {
  Harinas: [
    { id: 'h1', name: "Gallo Pinto", portion: "1/2 taza", calories: 140, baseAmount: 0.5, unit: "taza", macros: { p: 5, c: 25, f: 2, fiber: 4 } },
    { id: 'h2', name: "Plátano Maduro", portion: "1/3 taza", calories: 110, baseAmount: 0.33, unit: "taza", macros: { p: 1, c: 28, f: 0, fiber: 2 } },
    { id: 'h3', name: "Tortilla de Maíz", portion: "1 unidad", calories: 70, baseAmount: 1, unit: "unidad", macros: { p: 2, c: 15, f: 1, fiber: 2 } },
    { id: 'h4', name: "Pejibaye", portion: "1 unidad", calories: 65, baseAmount: 1, unit: "unidad", macros: { p: 1, c: 11, f: 3, fiber: 3 } },
    { id: 'h5', name: "Yuca", portion: "1/2 taza", calories: 120, baseAmount: 0.5, unit: "taza", macros: { p: 1, c: 29, f: 0, fiber: 2 } }
  ],
  Proteinas: [
    { id: 'p1', name: "Huevo entero", portion: "1 unidad", calories: 75, baseAmount: 1, unit: "unidad", macros: { p: 6, c: 0, f: 5, fiber: 0 } },
    { id: 'p2', name: "Queso Turrialba", portion: "30g", calories: 80, baseAmount: 30, unit: "g", macros: { p: 7, c: 1, f: 6, fiber: 0 } },
    { id: 'p3', name: "Pechuga de Pollo", portion: "90g", calories: 120, baseAmount: 90, unit: "g", macros: { p: 26, c: 0, f: 2, fiber: 0 } },
    { id: 'p4', name: "Atún en agua", portion: "1/2 taza", calories: 100, baseAmount: 0.5, unit: "taza", macros: { p: 22, c: 0, f: 1, fiber: 0 } }
  ],
  Grasas: [
    { id: 'g1', name: "Aguacate Hass", portion: "1/4 unidad", calories: 80, baseAmount: 0.25, unit: "unidad", macros: { p: 1, c: 4, f: 7, fiber: 3 } },
    { id: 'g2', name: "Natilla", portion: "1 cda", calories: 60, baseAmount: 1, unit: "cda", macros: { p: 1, c: 1, f: 6, fiber: 0 } },
    { id: 'g3', name: "Aceite de Coco", portion: "1 cdta", calories: 45, baseAmount: 1, unit: "cdta", macros: { p: 0, c: 0, f: 5, fiber: 0 } }
  ],
  Vegetales: [
    { id: 'v1', name: "Ensalada Verde", portion: "1 taza", calories: 20, baseAmount: 1, unit: "taza", macros: { p: 1, c: 4, f: 0, fiber: 2 } },
    { id: 'v2', name: "Chayote", portion: "1/2 taza", calories: 30, baseAmount: 0.5, unit: "taza", macros: { p: 1, c: 7, f: 0, fiber: 3 } }
  ]
};

const days = ['L', 'K', 'M', 'J', 'V', 'S', 'D'];

export const Plan: React.FC = () => {
  const { state, actions } = useGlobalState();
  const [selectedDay, setSelectedDay] = useState(0);
  const [activeModal, setActiveModal] = useState<{ meal: string, group: string } | null>(null);

  // NutriChat State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatQuery, setChatQuery] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatResponse, setChatResponse] = useState<AIResponse | null>(null);

  // Mezclamos alimentos genéricos con los personalizados del usuario
  const allEquivalencies = useMemo(() => {
    const combined = { ...equivalencies };
    state.customFoods.forEach(food => {
      // Intentamos deducir la categoría si no está marcada o simplemente usar la que eligió el usuario en el escáner
      // Por simplicidad, los custom foods guardan su categoría en la porción o metadata.
      // Aquí asumimos que están registrados en la categoría que el usuario eligió al escanear.
      // Pero como equivalencies es estático, necesitamos una lógica dinámica:
      Object.keys(combined).forEach(cat => {
        if (food.portion.includes(`(${cat})`)) {
          if (!combined[cat].find(f => f.id === food.id)) {
            combined[cat] = [food, ...combined[cat]];
          }
        }
      });
    });
    return combined;
  }, [state.customFoods]);

  const getMealSelections = (meal: string) => (state.weeklyPlan[selectedDay]?.[meal] || {});

  // Lógica de Vigencia de Plan
  const { currentWeek, isExpired } = useMemo(() => {
    const joined = new Date(state.profile.joinedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - joined.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const weeksPassed = Math.floor(diffDays / 7) + 1;

    return {
      currentWeek: weeksPassed,
      isExpired: weeksPassed > 4
    };
  }, [state.profile.joinedAt]);

  const [updateNotice, setUpdateNotice] = useState<string | null>(null);

  const handleConsult = async () => {
    if (!chatQuery.trim()) return;
    setChatLoading(true);
    setChatResponse(null);
    const res = await consultNutriTico(state, actions, chatQuery);

    // EJECUCIÓN DE COMANDOS DE LA IA (Magia estructurada 6.2)
    if (res.planCommands && res.planCommands.length > 0) {
      let newPlan = { ...state.weeklyPlan };
      res.planCommands.forEach(cmd => {
        const dp = newPlan[cmd.dayIndex] || {};
        const mp = dp[cmd.meal] || {};
        const gp = mp[cmd.group] || {};
        const ng = { ...gp };
        if (cmd.qty <= 0) delete ng[cmd.itemId]; else ng[cmd.itemId] = cmd.qty;
        newPlan = { ...newPlan, [cmd.dayIndex]: { ...dp, [cmd.meal]: { ...mp, [cmd.group]: ng } } };
      });
      actions.setWeeklyPlan(newPlan);

      setUpdateNotice(`${res.planCommands.length} ajustes aplicados al plan`);
      setTimeout(() => setUpdateNotice(null), 4000);

      // Sincronización inmediata con la nube
      setTimeout(() => actions.syncToCloud(), 100);
    }

    setChatResponse(res);
    setChatLoading(false);
    setChatQuery('');
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 bg-background-light no-scrollbar">
      <header className="sticky top-0 z-40 bg-white border-b border-primary/10 p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-primary">Plan de Alimentación</h1>
          <button
            onClick={() => setChatOpen(true)}
            className="text-[10px] font-black uppercase bg-primary text-white px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg shadow-primary/20 active:scale-95"
          >
            <span className="material-symbols-outlined text-[14px]">support_agent</span>
            Nutricionista
          </button>
        </div>

        {/* Panel de Vigencia del Plan */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-inner ${isExpired ? 'bg-orange-50 border-orange-100' : 'bg-slate-50 border-slate-100'}`}>
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${isExpired ? 'text-orange-400' : 'text-slate-400'}`}>Semana Activa</p>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${isExpired ? 'bg-orange-500' : 'bg-accent-lime animate-pulse'}`}></div>
              <p className={`font-black text-sm ${isExpired ? 'text-orange-600' : 'text-slate-700'}`}>
                {isExpired ? 'Plan Expirado' : `Ciclo ${currentWeek} de 4 (Vigente)`}
              </p>
            </div>
          </div>
          <button className={`border shadow-sm p-2 rounded-xl flex flex-col items-center ${isExpired ? 'bg-orange-500 border-orange-600 text-white' : 'bg-white border-primary/10 text-primary'}`}>
            <span className="material-symbols-outlined text-sm">{isExpired ? 'warning' : 'update'}</span>
            <span className="text-[8px] font-black uppercase mt-1">Re-evaluar</span>
          </button>
        </div>

        <div className="flex justify-between bg-slate-100 p-1 rounded-2xl overflow-x-auto no-scrollbar">
          {days.map((d, i) => (
            <button key={i} onClick={() => setSelectedDay(i)} className={`w-10 h-10 rounded-xl font-bold text-sm ${selectedDay === i ? 'bg-primary text-white shadow-lg' : 'text-slate-400'}`}>
              {d}
            </button>
          ))}
        </div>
      </header>

      <div className="p-4 space-y-6 max-w-lg mx-auto">
        {updateNotice && (
          <div className="bg-accent-lime text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-between shadow-lg shadow-accent-lime/20 animate-in slide-in-from-top fade-in">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              {updateNotice}
            </div>
            <span className="text-[8px] opacity-70">Sincronizado</span>
          </div>
        )}
        {/* Panel explicativo de Metas (Punto 6.6) */}
        <section className="bg-white/40 border border-primary/10 rounded-3xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary text-sm">info</span>
            <h4 className="text-[10px] font-black uppercase text-primary tracking-widest">Lógica de Tu Plan</h4>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
            Este plan ha sido diseñado para un objetivo de **{state.profile.goal}**.
            Se basa en la ecuación de **Mifflin-St Jeor** considerando tu peso actual de {state.profile.weight}kg
            y un factor de actividad **{state.profile.activityLevel}**.
            En las próximas semanas, esperamos una adaptación de tu composición corporal basándonos en tu {state.profile.strategy.includes('keto') ? 'estado cetogénico' : 'balance vitamínico'}.
          </p>
        </section>
        {state.activeMeals.map((meal) => (
          <div key={meal} className="bg-white rounded-3xl p-6 shadow-sm border border-primary/5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined">restaurant</span>
                {meal}
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase">{state.mealTimes[meal]}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {Object.keys(allEquivalencies).map(group => (
                <button
                  key={group}
                  onClick={() => setActiveModal({ meal, group })}
                  className="text-[10px] font-bold uppercase px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 hover:border-primary/20"
                >
                  + {group}
                </button>
              ))}
            </div>

            <ul className="space-y-2 border-t border-slate-50 pt-4">
              {Object.entries(getMealSelections(meal)).map(([group, items]) => (
                Object.entries(items as object).map(([id, qty]) => {
                  const item = allEquivalencies[group]?.find(f => f.id === id);
                  return item ? (
                    <li key={id} className="flex justify-between text-xs font-bold text-slate-700 animate-in fade-in">
                      <span className="flex items-center gap-1">
                        {item.isCustom && <span className="material-symbols-outlined text-[10px] text-accent-lime">star</span>}
                        {qty} {item.portion.replace(/\(.*\)/, '')} {item.name}
                      </span>
                      <span className="text-primary">{Math.round(item.calories * qty)} kcal</span>
                    </li>
                  ) : null;
                })
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* MODAL NUTRICIONISTA (Fase 6.2) */}
      {chatOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-primary/20 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-t-[3rem] sm:rounded-[4rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom border-t border-primary/10">
            <header className="p-8 border-b border-slate-50 flex justify-between items-center bg-primary text-white">
              <div>
                <h3 className="font-black text-lg">NutriTico IA</h3>
                <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Experto en Nutrición Clínica</p>
              </div>
              <button onClick={() => setChatOpen(false)} className="size-10 bg-white/10 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            <div className="p-8 space-y-6 min-h-[300px] max-h-[60vh] overflow-y-auto no-scrollbar">
              {chatResponse ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  {chatResponse.actionTaken && (
                    <div className="bg-accent-lime/10 text-accent-lime px-3 py-1.5 rounded-full text-[9px] font-black uppercase inline-block border border-accent-lime/20">
                      {chatResponse.actionTaken}
                    </div>
                  )}
                  <p className="text-sm font-semibold text-slate-700 leading-relaxed italic">"{chatResponse.text}"</p>
                  <button onClick={() => setChatResponse(null)} className="text-[10px] text-primary font-black uppercase flex items-center gap-1 pt-4">
                    <span className="material-symbols-outlined text-[14px]">undo</span>
                    Hacer otra pregunta
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40">
                  <span className="material-symbols-outlined text-6xl">chat_bubble</span>
                  <p className="text-xs font-bold text-slate-500">¿Deseas que te genere un plan nutricional o que cambie algún alimento?</p>
                </div>
              )}

              {chatLoading && (
                <div className="flex items-center gap-2 text-primary animate-pulse">
                  <span className="material-symbols-outlined animate-spin">sync</span>
                  <span className="text-[10px] font-black uppercase">Analizando tus macros...</span>
                </div>
              )}
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Generame el plan de hoy..."
                  value={chatQuery}
                  onChange={e => setChatQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleConsult()}
                  className="flex-1 bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold shadow-inner outline-none focus:border-primary/30"
                />
                <button onClick={handleConsult} disabled={chatLoading} className="size-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all">
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modales de Selección Manual (Mantenemos por seguridad) */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-t-[3rem] p-8 space-y-6 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-primary">Elegir {activeModal.group}</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Incluyendo tus alimentos escaneados</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-2 bg-slate-100 rounded-full">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto no-scrollbar">
              {allEquivalencies[activeModal.group].map(item => {
                const qty = state.weeklyPlan[selectedDay]?.[activeModal.meal]?.[activeModal.group]?.[item.id] || 0;
                return (
                  <div key={item.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${item.isCustom ? 'bg-primary/5 border-primary/20' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-1">
                        <p className="font-bold text-slate-700">{item.name}</p>
                        {item.isCustom && <span className="text-[8px] bg-primary text-white px-1.5 rounded-full font-black uppercase">Mío</span>}
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{item.portion.replace(/\(.*\)/, '')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => actions.updatePlan(selectedDay, activeModal.meal, activeModal.group, item.id, qty - 1)} className="size-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center shadow-sm">-</button>
                      <span className="font-bold text-primary tabular-nums">{qty}</span>
                      <button onClick={() => actions.updatePlan(selectedDay, activeModal.meal, activeModal.group, item.id, qty + 1)} className="size-8 bg-primary text-white rounded-lg flex items-center justify-center shadow-lg">+</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
