
import React, { useState, useMemo } from 'react';
import { useGlobalState } from '../context/GlobalState';
import { FoodItem } from '../types';

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

  return (
    <div className="flex-1 overflow-y-auto pb-24 bg-background-light no-scrollbar">
      <header className="sticky top-0 z-40 bg-white border-b border-primary/10 p-4 space-y-4">
        <h1 className="text-xl font-bold text-primary">Plan de Alimentación</h1>
        <div className="flex justify-between bg-slate-100 p-1 rounded-2xl">
          {days.map((d, i) => (
            <button key={i} onClick={() => setSelectedDay(i)} className={`w-10 h-10 rounded-xl font-bold text-sm ${selectedDay === i ? 'bg-primary text-white shadow-lg' : 'text-slate-400'}`}>
              {d}
            </button>
          ))}
        </div>
      </header>

      <div className="p-4 space-y-6 max-w-lg mx-auto">
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
