
import React, { useState, useRef } from 'react';
import { useGlobalState } from '../context/GlobalState';
import { analyzeLabels, extractFoodData } from '../services/aiCore';
import { FoodItem } from '../types';

export const LabelScanner: React.FC = () => {
  const { state, actions } = useGlobalState();
  const [productA, setProductA] = useState<string[]>([]);
  const [productB, setProductB] = useState<string[]>([]);
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [extractedFood, setExtractedFood] = useState<Partial<FoodItem> | null>(null);
  const [saveCategory, setSaveCategory] = useState('Proteinas');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetProduct, setTargetProduct] = useState<'A' | 'B' | null>(null);

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && targetProduct) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        if (targetProduct === 'A') setProductA(prev => [...prev, base64]);
        else setProductB(prev => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    }
  };

  const openPicker = (prod: 'A' | 'B') => {
    setTargetProduct(prod);
    fileInputRef.current?.click();
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setExtractedFood(null);
    const allImages = [...productA, ...productB];
    
    // Análisis narrativo
    const prompt = productB.length > 0 
      ? "Compara estos dos productos ticos." 
      : "Analiza la calidad de este producto tico.";
    
    const res = await analyzeLabels(allImages, prompt);
    setResult(res);

    // Si solo hay un producto, intentamos extracción estructurada para guardarlo
    if (productB.length === 0) {
        const extracted = await extractFoodData(productA);
        if (extracted) setExtractedFood(extracted);
    }
    
    setLoading(false);
  };

  const handleSaveToPantry = () => {
      if (extractedFood) {
          actions.addCustomFood({
              ...extractedFood as FoodItem,
              id: `custom_${Date.now()}`,
              isCustom: true,
              portion: `${extractedFood.baseAmount} ${extractedFood.unit} (${saveCategory})`
          });
          setExtractedFood(null);
          alert("¡Alimento guardado en tu despensa!");
          actions.syncToCloud();
      }
  };

  const ProductCard = ({ title, images, onAdd, onClear }: { title: string, images: string[], onAdd: () => void, onClear: () => void }) => (
    <div className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-primary/5 space-y-4">
      <div className="flex justify-between items-center px-2">
        <h3 className="text-xs font-black text-primary uppercase tracking-widest">{title}</h3>
        {images.length > 0 && <button onClick={onClear} className="text-[10px] text-red-400 font-bold uppercase">Limpiar</button>}
      </div>
      
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        <button onClick={onAdd} className="min-w-[80px] h-20 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 hover:border-primary/30 transition-all">
          <span className="material-symbols-outlined text-2xl">add_a_photo</span>
          <span className="text-[8px] font-bold uppercase mt-1">Añadir</span>
        </button>
        {images.map((img, i) => (
          <div key={i} className="min-w-[80px] h-20 rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-slate-100">
            <img src={`data:image/jpeg;base64,${img}`} className="size-full object-cover" alt="Capture" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto pb-24 bg-background-light no-scrollbar">
      <header className="sticky top-0 z-40 bg-white border-b border-primary/10 px-6 py-4">
          <h1 className="text-xl font-bold text-primary">Escáner Bio-Analítico</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Auditoría de Etiquetas Nutricionales</p>
      </header>

      <div className="p-6 space-y-6 max-w-lg mx-auto">
          <div className="space-y-4">
            <ProductCard title="Producto Principal" images={productA} onAdd={() => openPicker('A')} onClear={() => setProductA([])} />
            <ProductCard title="Comparar con (Opcional)" images={productB} onAdd={() => openPicker('B')} onClear={() => setProductB([])} />
          </div>

          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleCapture} className="hidden" />
          
          <button disabled={productA.length === 0 || loading} onClick={handleAnalyze} className="w-full py-5 bg-primary text-white rounded-3xl font-bold shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 transition-all">
            <span className="material-symbols-outlined">{loading ? 'sync' : 'biotech'}</span>
            {loading ? 'Analizando...' : 'Iniciar Auditoría'}
          </button>

          {result && (
              <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-primary/5 space-y-6">
                  <div className="flex items-center gap-3 text-primary">
                      <span className="material-symbols-outlined">description</span>
                      <h3 className="text-sm font-black uppercase tracking-widest">Dictamen NutriTico</h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{result}</p>

                  {/* Panel de Guardado si se detectó un solo alimento */}
                  {extractedFood && (
                      <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4 animate-in fade-in zoom-in">
                          <div className="flex justify-between items-start">
                              <div>
                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Producto Detectado</p>
                                  <h4 className="text-sm font-bold text-primary">{extractedFood.name}</h4>
                              </div>
                              <span className="text-[10px] font-black bg-primary text-white px-2 py-0.5 rounded-md">{extractedFood.calories} kcal</span>
                          </div>
                          
                          <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-400 uppercase block">Categoría en tu Plan</label>
                              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                  {['Harinas', 'Proteinas', 'Grasas', 'Vegetales'].map(cat => (
                                      <button key={cat} onClick={() => setSaveCategory(cat)} className={`px-3 py-1.5 rounded-full text-[9px] font-black transition-all ${saveCategory === cat ? 'bg-primary text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>
                                          {cat}
                                      </button>
                                  ))}
                              </div>
                          </div>

                          <button onClick={handleSaveToPantry} className="w-full py-3 bg-accent-lime text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-accent-lime/20 active:scale-95 transition-all">
                              Guardar en mi Despensa
                          </button>
                      </div>
                  )}
              </section>
          )}
      </div>
    </div>
  );
};
