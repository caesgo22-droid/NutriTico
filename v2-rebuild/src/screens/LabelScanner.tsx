import React, { useState, useRef } from 'react';
import { useGlobalState } from '../context/GlobalState';
import { analyzeLabels, extractFoodData } from '../services/aiCore';
import { FoodItem } from '../types';
import { Camera, Scan, Sparkles, ShoppingCart, RefreshCcw, Check } from 'lucide-react';

const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_DIM = 1200;
                let { width, height } = img;
                if (width > height) { if (width > MAX_DIM) { height *= MAX_DIM / width; width = MAX_DIM; } }
                else { if (height > MAX_DIM) { width *= MAX_DIM / height; height = MAX_DIM; } }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.8).split(',')[1]);
            };
        };
        reader.onerror = reject;
    });
};

export const LabelScanner: React.FC = () => {
    const { state, actions } = useGlobalState();
    const [shots, setShots] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [extracted, setExtracted] = useState<Partial<FoodItem> | null>(null);
    const [saved, setSaved] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const currentSlot = useRef<string | null>(null);

    const slots = [
        { id: 'front', label: 'Frente', icon: Camera },
        { id: 'label', label: 'Tabla', icon: Scan },
        { id: 'ings', label: 'Ingredientes', icon: Sparkles },
    ];

    const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && currentSlot.current) {
            const b64 = await compressImage(file);
            setShots(prev => ({ ...prev, [currentSlot.current!]: b64 }));
        }
    };

    const startScan = async () => {
        const images = Object.values(shots);
        if (images.length === 0) return;
        setLoading(true);
        setResult(null);
        setExtracted(null);
        setSaved(false);
        try {
            const r = await analyzeLabels(state, images);
            setResult(r);
            const e = await extractFoodData(state, images);
            if (e) setExtracted(e);
        } catch (e) {
            setResult("Error al procesar las imágenes.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto pb-32 bg-slate-50 no-scrollbar p-6 space-y-8">
            <header className="pt-6 space-y-1">
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">Escáner <span className="text-emerald-500">Bio</span></h2>
                <p className="text-slate-400 font-medium text-sm letter-spacing-tight">Auditoría inteligente de etiquetas nutricionales.</p>
            </header>

            <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex justify-between gap-4">
                {slots.map(slot => {
                    const Icon = slot.icon;
                    const hasImg = shots[slot.id];
                    return (
                        <button
                            key={slot.id}
                            onClick={() => { currentSlot.current = slot.id; fileInputRef.current?.click(); }}
                            className={`flex-1 aspect-square rounded-[2rem] border-2 flex flex-col items-center justify-center gap-2 transition-all relative overflow-hidden ${hasImg ? 'border-emerald-500 bg-emerald-50' : 'border-dashed border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                        >
                            {hasImg ? (
                                <>
                                    <img src={`data:image/jpeg;base64,${hasImg}`} className="absolute inset-0 size-full object-cover opacity-20" />
                                    <Check size={28} className="text-emerald-500" strokeWidth={3} />
                                </>
                            ) : <Icon size={24} className="text-slate-300" />}
                            <span className={`text-[8px] font-black uppercase tracking-widest ${hasImg ? 'text-emerald-600' : 'text-slate-400'}`}>{slot.label}</span>
                        </button>
                    );
                })}
            </section>

            <input type="file" hidden ref={fileInputRef} onChange={handleCapture} accept="image/*" />

            <button
                onClick={startScan}
                disabled={loading || Object.keys(shots).length === 0}
                className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
                {loading ? <RefreshCcw size={20} className="animate-spin" /> : <Scan size={20} />}
                {loading ? 'Analizando...' : 'Iniciar Auditoría'}
            </button>

            {result && (
                <article className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 space-y-6 animate-in fade-in slide-in-from-bottom-6">
                    <div className="flex items-center gap-3 text-emerald-600">
                        <Sparkles size={24} fill="currentColor" />
                        <h3 className="font-black uppercase text-xs tracking-widest">Dictamen NutriTico</h3>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed italic">"{result}"</p>

                    {extracted && (
                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex justify-between items-center group">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detección</p>
                                <h4 className="text-sm font-bold text-slate-800">{extracted.name || 'Producto Desconocido'}</h4>
                                <p className="text-[10px] text-emerald-600 font-black">{extracted.calories} kcal • {extracted.portion}</p>
                            </div>
                            <button
                                onClick={() => { actions.addCustomFood(extracted as FoodItem); setSaved(true); actions.syncToCloud(); }}
                                disabled={saved}
                                className={`size-12 rounded-2xl flex items-center justify-center transition-all ${saved ? 'bg-emerald-500 text-white' : 'bg-white shadow-sm border border-slate-200 text-slate-400 hover:text-emerald-500'}`}
                            >
                                {saved ? <Check size={20} /> : <ShoppingCart size={20} />}
                            </button>
                        </div>
                    )}
                </article>
            )}
        </div>
    );
};
