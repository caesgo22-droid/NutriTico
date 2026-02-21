import React, { useState, useMemo } from 'react';
import { useGlobalState } from '../context/GlobalState';
import { FoodItem } from '../types';

type DirectoryFoodItem = {
    id: string;
    name: string;
    protein: number;
    carbs: number;
    fat: number;
    calories: number;
    category: string;
    servingSize: string;
};

// Base de datos ampliada de alimentos ticos
const LOCAL_FOOD_DB: DirectoryFoodItem[] = [
    { id: '1', name: 'Gallo Pinto', calories: 154, protein: 5.5, carbs: 29, fat: 1.5, category: 'Carbohidratos', servingSize: '1/2 taza' },
    { id: '2', name: 'Plátano Maduro Horneado', calories: 110, protein: 1, carbs: 28, fat: 0, category: 'Carbohidratos', servingSize: '1/2 unidad' },
    { id: '3', name: 'Pejibaye (Sin mayonesa)', calories: 54, protein: 1, carbs: 12, fat: 1, category: 'Carbohidratos', servingSize: '1 unidad' },
    { id: '4', name: 'Pechuga de Pollo', calories: 165, protein: 31, carbs: 0, fat: 3.6, category: 'Proteínas', servingSize: '100g' },
    { id: '5', name: 'Atún en Agua (Loma Linda)', calories: 96, protein: 21, carbs: 0, fat: 1, category: 'Proteínas', servingSize: '1/2 lata (85g)' },
    { id: '6', name: 'Huevo Entero', calories: 72, protein: 6, carbs: 0.6, fat: 5, category: 'Proteínas', servingSize: '1 unidad' },
    { id: '7', name: 'Aguacate Hass', calories: 160, protein: 2, carbs: 8.5, fat: 14.6, category: 'Grasas', servingSize: '1/2 unidad pequeña' },
    { id: '8', name: 'Queso Turrialba', calories: 85, protein: 5, carbs: 1, fat: 6, category: 'Grasas/Bajas', servingSize: '1 rebanada (30g)' },
    { id: '9', name: 'Tortilla de Maíz (Casera)', calories: 52, protein: 1.4, carbs: 11, fat: 0.5, category: 'Carbohidratos', servingSize: '1 unidad pequeña' },
    { id: '10', name: 'Chifrijo (Porción Med)', calories: 350, protein: 18, carbs: 32, fat: 12, category: 'Plato Completo', servingSize: '1 taza servida' },
    { id: '11', name: 'Olla de Carne (Solo carne y caldo)', calories: 180, protein: 22, carbs: 5, fat: 8, category: 'Proteínas', servingSize: '1 tazón' },
    { id: '12', name: 'Frijoles Negros (Cocinados)', calories: 110, protein: 7, carbs: 20, fat: 0.5, category: 'Carbohidratos', servingSize: '1/2 taza' },
    { id: '13', name: 'Picadillo de Chayote con Carne', calories: 125, protein: 9, carbs: 12, fat: 5, category: 'Vegetales/Mix', servingSize: '1/2 taza' }
];

export const FoodDirectory: React.FC<{ onOpenScanner: () => void }> = ({ onOpenScanner }) => {
    const { state } = useGlobalState();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('Todos');

    // Unificamos la DB Local con los Custom Foods del usuario
    const combinedDB = useMemo(() => {
        const customItems: DirectoryFoodItem[] = state.customFoods.map(f => ({
            id: f.id,
            name: f.name,
            calories: f.calories,
            protein: f.macros.p,
            carbs: f.macros.c,
            fat: f.macros.f,
            category: 'Mis Productos',
            servingSize: f.portion
        }));
        return [...LOCAL_FOOD_DB, ...customItems];
    }, [state.customFoods]);

    const categories = ['Todos', 'Mis Productos', ...Array.from(new Set(combinedDB.map(f => f.category)))];

    const filteredFoods = combinedDB.filter(food => {
        const matchesSearch = food.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === 'Todos' || food.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="flex-1 overflow-y-auto pb-24 bg-background-light no-scrollbar animate-in fade-in duration-300">
            <div className="bg-primary pt-14 pb-8 px-6 rounded-b-[4rem] text-center shadow-xl shadow-primary/20 sticky top-0 z-20">
                <h1 className="text-3xl font-black text-white">Directorio NutriTico</h1>
                <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-2">Equivalentes Ticos Aprobados</p>

                <div className="mt-6 relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/50">search</span>
                    <input
                        type="text"
                        placeholder="Buscar Pinto, Atún, Pejibaye..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-2xl py-4 pl-12 pr-4 outline-none focus:bg-white/20 transition-all font-medium"
                    />
                </div>

                <div className="flex overflow-x-auto gap-2 mt-4 pb-2 no-scrollbar px-2">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-white text-primary shadow-lg' : 'bg-white/10 text-white/70 hover:bg-white/20'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-4 mt-6 space-y-4 max-w-lg mx-auto">
                {/* Banner CTA Escáner */}
                <div onClick={onOpenScanner} className="bg-gradient-to-r from-accent-lime to-[#c0d860] p-6 rounded-3xl shadow-xl shadow-accent-lime/20 flex items-center justify-between cursor-pointer active:scale-95 transition-all group overflow-hidden relative">
                    <div className="absolute right-0 top-0 size-32 bg-white/20 rounded-full blur-2xl group-hover:bg-white/30 transition-all"></div>
                    <div className="relative z-10 w-2/3">
                        <h3 className="text-primary font-black text-lg leading-tight uppercase relative">
                            <span className="material-symbols-outlined text-sm align-middle mr-1">document_scanner</span>
                            ¿No está en la lista?
                        </h3>
                        <p className="text-primary/80 text-xs font-bold mt-1">Usa la IA para escanear etiquetas del súper.</p>
                    </div>
                    <div className="size-12 bg-white rounded-full flex items-center justify-center text-primary shadow-lg group-hover:scale-110 transition-transform relative z-10">
                        <span className="material-symbols-outlined">qr_code_scanner</span>
                    </div>
                </div>

                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2">Base de Equivalentes Oficial</h3>

                {filteredFoods.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-3xl border border-slate-100">
                        <span className="material-symbols-outlined text-4xl text-slate-300">search_off</span>
                        <p className="text-slate-500 font-bold mt-2">No encontramos alimentos con ese nombre en la base local.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredFoods.map(food => (
                            <div key={food.id} className={`bg-white p-5 rounded-3xl border shadow-sm hover:shadow-md transition-shadow ${food.category === 'Mis Productos' ? 'border-primary/20 bg-primary/5' : 'border-primary/5'}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-black text-primary text-base">{food.name}</h4>
                                            {food.category === 'Mis Productos' && <span className="text-[8px] bg-primary text-white px-1.5 py-0.5 rounded-full font-black uppercase">Escaneado</span>}
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-full inline-block mt-1">{food.servingSize}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-accent-orange text-lg">{food.calories}<span className="text-[10px] text-slate-400 font-bold">kcal</span></p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl relative">
                                    <div className="text-center">
                                        <p className="text-[9px] font-black uppercase text-primary">Prot</p>
                                        <p className="font-bold text-slate-700 text-sm">{food.protein}g</p>
                                    </div>
                                    <div className="text-center border-l border-r border-slate-200">
                                        <p className="text-[9px] font-black uppercase text-accent-lime">Carb</p>
                                        <p className="font-bold text-slate-700 text-sm">{food.carbs}g</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[9px] font-black uppercase text-accent-orange">Gras</p>
                                        <p className="font-bold text-slate-700 text-sm">{food.fat}g</p>
                                    </div>
                                </div>

                                {/* Acción de Personalización */}
                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={onOpenScanner}
                                        className="text-[9px] font-black uppercase flex items-center gap-1 text-primary/60 hover:text-primary transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm">edit_note</span>
                                        Personalizar Marca con Escáner
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
