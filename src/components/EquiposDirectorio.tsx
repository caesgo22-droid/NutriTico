import React, { useState } from 'react';
import { Search, Database } from 'lucide-react';
import { EQUIVALENTS_DB } from '../data/equivalents';

export const EquiposDirectorio: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const filtered = EQUIVALENTS_DB.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.group.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white">Directorio GABSA</h2>
                    <p className="text-slate-400 mt-1">Sistema de porciones equivalentes.</p>
                </div>
                <div className="size-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
                    <Database className="text-emerald-500" />
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input
                    type="text"
                    placeholder="Buscar alimento o grupo (ej. Proteína, Arroz)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-[2rem] pl-16 pr-6 py-5 outline-none focus:border-emerald-500/50 transition-all text-white font-semibold"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map(food => (
                    <div key={food.id} className="bg-white/5 border border-white/10 p-5 rounded-3xl hover:bg-white/[0.08] transition-all group flex items-start justify-between">
                        <div>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md mb-2 inline-block
                                ${food.group === 'Proteína' ? 'bg-red-500/20 text-red-400' :
                                    food.group === 'Carbohidratos' ? 'bg-blue-500/20 text-blue-400' :
                                        food.group === 'Grasas' ? 'bg-amber-500/20 text-amber-400' :
                                            'bg-emerald-500/20 text-emerald-400'}`
                            }>
                                {food.group}
                            </span>
                            <h4 className="text-white font-bold text-lg">{food.name}</h4>
                            <p className="text-slate-400 text-sm mt-1">1 Porción Clínica = <span className="text-white font-bold">{food.equivalentPortion}</span></p>
                        </div>
                        <div className="text-right">
                            <span className="text-emerald-400 font-black block">{food.calories} kcal</span>
                            <span className="text-slate-500 text-[10px] uppercase font-black tracking-widest">{food.macros.p}P / {food.macros.c}C / {food.macros.f}F</span>
                        </div>
                    </div>
                ))}

                {filtered.length === 0 && (
                    <div className="col-span-full py-12 text-center">
                        <p className="text-slate-500">No se encontraron equivalencias para "{searchTerm}"</p>
                    </div>
                )}
            </div>
        </div>
    );
};
