import React from 'react';
import { useGlobalState } from '../context/GlobalState';
import { Package, Trash2, AlertTriangle, Plus, Search } from 'lucide-react';

export const Pantry: React.FC = () => {
    const { state, actions } = useGlobalState();

    const clusters = ['Proteína', 'Carbohidratos', 'Grasas', 'Vegetales', 'Ultraprocesados', 'Otros'];

    return (
        <div className="flex-1 overflow-y-auto pb-32 bg-slate-50 no-scrollbar p-6 space-y-8">
            <header className="pt-12 space-y-2">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Mi Despensa</h1>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">Auditoría de Alimentos en Stock</p>
            </header>

            <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input
                    type="text"
                    placeholder="Buscar en mi stock..."
                    className="w-full bg-white border border-slate-100 rounded-[2rem] pl-16 pr-8 py-5 text-slate-800 outline-none focus:border-emerald-500 transition-all font-semibold shadow-sm"
                />
            </div>

            <div className="space-y-8">
                {clusters.map(cluster => {
                    const items = state.pantry.filter(i => i.cluster === cluster);
                    if (items.length === 0 && cluster !== 'Ultraprocesados') return null;

                    return (
                        <div key={cluster} className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{cluster}</h3>
                                <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">{items.length} items</span>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {items.length === 0 && cluster === 'Ultraprocesados' ? (
                                    <div className="bg-emerald-50/30 border-2 border-dashed border-emerald-100 rounded-[2rem] p-8 text-center">
                                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">¡Felicidades! Despensa Limpia</p>
                                    </div>
                                ) : items.map(item => (
                                    <div key={item.id} className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between group animate-in fade-in slide-in-from-bottom-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`size-12 rounded-2xl flex items-center justify-center ${cluster === 'Ultraprocesados' ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-400'}`}>
                                                {cluster === 'Ultraprocesados' ? <AlertTriangle size={20} /> : <Package size={20} />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 leading-tight">{item.name}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.calories} kcal • {item.portion}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => actions.removeFromPantry(item.id)}
                                            className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <button className="fixed bottom-32 right-6 size-16 bg-slate-900 text-white rounded-full shadow-2xl shadow-slate-900/40 flex items-center justify-center active:scale-95 transition-all z-20">
                <Plus size={28} strokeWidth={3} />
            </button>
        </div>
    );
};
