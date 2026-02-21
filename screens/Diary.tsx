import React, { useMemo, useState } from 'react';
import { useGlobalState } from '../context/GlobalState';
import { FoodItem } from '../types';
import { equivalencies } from './Plan';

export const Diary: React.FC = () => {
  const { state, actions } = useGlobalState();
  const [activeItem, setActiveItem] = useState<{ key: string, item: FoodItem, qty: number } | null>(null);
  const [showAltForm, setShowAltForm] = useState(false);
  const [altText, setAltText] = useState('');
  
  const todayIndex = 0; 
  const currentPlan = state.weeklyPlan[todayIndex] || {};

  const stats = useMemo(() => {
    let projectedCals = 0;
    let realCals = 0;
    let itemsCompleted = 0;
    let totalItems = 0;
    
    // Detailed macros comparison
    let pTarget = 0, cTarget = 0, fTarget = 0;
    let pReal = 0, cReal = 0, fReal = 0;

    Object.entries(currentPlan).forEach(([meal, groups]) => {
      Object.entries(groups).forEach(([group, items]) => {
        Object.entries(items).forEach(([itemId, qty]) => {
          const item = equivalencies[group]?.find(f => f.id === itemId);
          if (item) {
            const quantity = qty as number;
            totalItems++;
            
            projectedCals += item.calories * quantity;
            pTarget += item.macros.p * quantity;
            cTarget += item.macros.c * quantity;
            fTarget += item.macros.f * quantity;

            const uniqueKey = `${todayIndex}-${meal}-${group}-${itemId}`;
            const log = state.consumedItems[uniqueKey];
            if (log?.consumed) {
                const factor = log.factor;
                realCals += (item.calories * quantity) * factor;
                pReal += (item.macros.p * quantity) * factor;
                cReal += (item.macros.c * quantity) * factor;
                fReal += (item.macros.f * quantity) * factor;
                itemsCompleted++;
            }
          }
        });
      });
    });

    return { projectedCals, realCals, itemsCompleted, totalItems, pTarget, cTarget, fTarget, pReal, cReal, fReal };
  }, [currentPlan, state.consumedItems]);

  const handleLog = (factor: number, alt?: string) => {
      if (activeItem) {
          actions.logConsumption(activeItem.key, factor, alt);
          setActiveItem(null);
          setShowAltForm(false);
          setAltText('');
      }
  };

  const progressPct = stats.totalItems > 0 ? (stats.itemsCompleted / stats.totalItems) * 100 : 0;

  return (
    <div className="flex-1 overflow-y-auto pb-24 bg-background-light no-scrollbar">
       <header className="sticky top-0 z-40 bg-white border-b border-primary/10 px-6 py-4">
           <h1 className="text-xl font-bold text-primary">Diario de Hoy</h1>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Sincronización de Consumo</p>
       </header>

       <div className="p-4 space-y-6 max-w-lg mx-auto">
           {/* Progress visualization */}
           <section className="bg-white rounded-[2rem] p-6 shadow-sm border border-primary/5 space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Consumido Real</p>
                  <p className="text-4xl font-black text-primary">{Math.round(stats.realCals)} <span className="text-sm font-normal text-slate-400">kcal</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Proyectado</p>
                  <p className="text-xl font-bold text-slate-600">{Math.round(stats.projectedCals)} <span className="text-xs font-normal">kcal</span></p>
                </div>
              </div>

              {/* Macro breakdown */}
              <div className="grid grid-cols-3 gap-4 border-t border-slate-50 pt-4">
                 <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase">
                       <span>Prot.</span> <span className="text-primary">{Math.round(stats.pReal)}/{Math.round(stats.pTarget)}g</span>
                    </div>
                    <div className="w-full bg-slate-50 h-1 rounded-full overflow-hidden">
                       <div className="bg-primary h-full" style={{ width: `${Math.min(100, (stats.pReal / (stats.pTarget || 1)) * 100)}%` }}></div>
                    </div>
                 </div>
                 <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase">
                       <span>Carb.</span> <span className="text-primary">{Math.round(stats.cReal)}/{Math.round(stats.cTarget)}g</span>
                    </div>
                    <div className="w-full bg-slate-50 h-1 rounded-full overflow-hidden">
                       <div className="bg-accent-lime h-full" style={{ width: `${Math.min(100, (stats.cReal / (stats.cTarget || 1)) * 100)}%` }}></div>
                    </div>
                 </div>
                 <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase">
                       <span>Gras.</span> <span className="text-primary">{Math.round(stats.fReal)}/{Math.round(stats.fTarget)}g</span>
                    </div>
                    <div className="w-full bg-slate-50 h-1 rounded-full overflow-hidden">
                       <div className="bg-yellow-400 h-full" style={{ width: `${Math.min(100, (stats.fReal / (stats.fTarget || 1)) * 100)}%` }}></div>
                    </div>
                 </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>Estado de Cumplimiento</span>
                  <span>{stats.itemsCompleted} de {stats.totalItems} Items</span>
                </div>
                <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden border border-slate-100 p-0.5">
                  <div className="h-full bg-primary rounded-full transition-all duration-700 shadow-sm shadow-primary/20" style={{ width: `${progressPct}%` }}></div>
                </div>
              </div>
           </section>

           {state.activeMeals.map((mealName) => {
               const mealData = currentPlan[mealName];
               if (!mealData) return null;

               const items: any[] = [];
               Object.entries(mealData).forEach(([group, groupItems]) => {
                   Object.entries(groupItems).forEach(([itemId, qty]) => {
                       const item = equivalencies[group]?.find(f => f.id === itemId);
                       if (item) items.push({ group, itemId, qty, item, key: `${todayIndex}-${mealName}-${group}-${itemId}` });
                   });
               });

               if (items.length === 0) return null;

               return (
                <div key={mealName} className="space-y-3 animate-in fade-in duration-500">
                    <div className="flex items-center justify-between px-2">
                      <h4 className="font-bold text-slate-800 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-primary">circle</span>
                        {mealName}
                      </h4>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px] text-slate-300">schedule</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{state.mealTimes[mealName] || '12:00'}</span>
                      </div>
                    </div>
                    
                    {items.map(({ key, item, qty }) => {
                        const log = state.consumedItems[key];
                        return (
                            <div 
                                key={key}
                                onClick={() => setActiveItem({ key, item, qty: qty as number })}
                                className={`p-4 rounded-[2rem] border-2 flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] ${log?.consumed ? 'bg-primary/5 border-primary/20 shadow-inner' : 'bg-white border-slate-50 shadow-sm'}`}
                            >
                                <div className="flex-1">
                                    <h5 className={`font-bold transition-colors ${log?.consumed ? 'text-primary' : 'text-slate-700'}`}>{item.name}</h5>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-[10px] text-slate-400 font-bold uppercase">
                                        {qty * item.baseAmount} {item.unit} • {item.calories * qty} kcal
                                      </span>
                                      {log?.consumed && log.factor !== 1 && (
                                        <span className="text-[9px] bg-primary/10 text-primary px-2 rounded-full font-bold">Factor: {log.factor}x</span>
                                      )}
                                    </div>
                                    {log?.alternative && (
                                      <div className="flex items-center gap-1 mt-1 text-orange-500">
                                        <span className="material-symbols-outlined text-[12px]">edit</span>
                                        <span className="text-[10px] font-bold uppercase italic">Sustitución: {log.alternative}</span>
                                      </div>
                                    )}
                                </div>
                                <div className={`size-10 rounded-2xl flex items-center justify-center transition-all ${log?.consumed ? 'bg-primary text-white shadow-lg' : 'bg-slate-50 text-slate-200'}`}>
                                    <span className="material-symbols-outlined text-2xl">
                                        {log?.consumed ? 'check_circle' : 'radio_button_unchecked'}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
               );
           })}
       </div>

       {activeItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl flex flex-col gap-6 animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
               <div className="text-center space-y-1">
                   <h3 className="text-lg font-bold text-primary">Registrar Consumo</h3>
                   <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                       {activeItem.item.name}<br/>
                       ¿Consumiste la porción planeada?
                   </p>
               </div>
               
               {!showAltForm ? (
                <>
                    <div className="grid grid-cols-3 gap-3">
                        <button onClick={() => handleLog(0.5)} className="p-4 border-2 border-slate-100 rounded-3xl hover:bg-slate-50 flex flex-col items-center group transition-all">
                                <span className="text-xl font-bold text-slate-600 group-hover:text-primary">½</span>
                                <span className="text-[8px] font-bold uppercase text-slate-400 group-hover:text-primary opacity-60">Media</span>
                        </button>
                        <button onClick={() => handleLog(1)} className="p-4 bg-primary text-white rounded-3xl shadow-xl shadow-primary/20 flex flex-col items-center hover:bg-primary-light active:scale-95 transition-all">
                                <span className="text-xl font-bold">1.0</span>
                                <span className="text-[8px] font-bold uppercase opacity-70">Normal</span>
                        </button>
                        <button onClick={() => handleLog(1.5)} className="p-4 border-2 border-slate-100 rounded-3xl hover:bg-slate-50 flex flex-col items-center group transition-all">
                                <span className="text-xl font-bold text-slate-600 group-hover:text-primary">1.5</span>
                                <span className="text-[8px] font-bold uppercase text-slate-400 group-hover:text-primary opacity-60">Extra</span>
                        </button>
                    </div>
                    <button onClick={() => setShowAltForm(true)} className="w-full py-4 text-slate-500 text-xs font-bold border-2 border-dashed border-slate-200 rounded-2xl uppercase hover:border-primary/40 hover:text-primary transition-all">
                        Comí algo diferente
                    </button>
                </>
               ) : (
                <div className="space-y-4">
                    <p className="text-[10px] text-slate-400 font-bold uppercase text-center">Describe qué consumiste en su lugar</p>
                    <input 
                        autoFocus
                        type="text" 
                        placeholder="Ej: Empanada de queso..."
                        value={altText}
                        onChange={(e) => setAltText(e.target.value)}
                        className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl text-sm outline-none focus:border-primary transition-all text-center font-bold text-primary"
                    />
                    <button 
                        onClick={() => handleLog(1, altText)}
                        className="w-full py-5 bg-primary text-white rounded-[1.5rem] font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all"
                    >
                        Guardar Cambio
                    </button>
                </div>
               )}

               <button onClick={() => { setActiveItem(null); setShowAltForm(false); }} className="text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:text-primary transition-colors py-2">Cerrar</button>
           </div>
        </div>
       )}
    </div>
  );
};