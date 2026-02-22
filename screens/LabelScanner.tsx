
import React, { useState, useRef } from 'react';
import { useGlobalState } from '../context/GlobalState';
import { analyzeLabels, extractFoodData } from '../services/aiCore';
import { FoodItem } from '../types';

// Helper de compresión y pre-procesamiento para el Satélite Escáner
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 1440; // Resolución ligeramente mayor para mejor OCR
        let { width, height } = img;
        if (width > height) {
          if (width > MAX_DIM) { height *= MAX_DIM / width; width = MAX_DIM; }
        } else {
          if (height > MAX_DIM) { width *= MAX_DIM / height; height = MAX_DIM; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return reject('No se pudo obtener el contexto del canvas');

        // Dibujo inicial
        ctx.drawImage(img, 0, 0, width, height);

        // Fase de Tratamiento: Filtros de Mejora de Lectura
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Parámetros de optimización (ajustables para el Satélite Escáner)
        const contrast = 1.25; // Aumento de contraste del 25% para separar texto de fondo
        const intercept = 128 * (1 - contrast);

        for (let i = 0; i < data.length; i += 4) {
          // 1. Grayscale (Luminosidad percibida)
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;

          // 2. Aplicar Contraste
          const v = gray * contrast + intercept;

          data[i] = data[i + 1] = data[i + 2] = v;
          // El canal Alpha (data[i+3]) se mantiene igual
        }

        ctx.putImageData(imageData, 0, 0);

        // Exportación optimizada: JPEG al 80% (buen balance de peso vs nitidez)
        resolve(canvas.toDataURL('image/jpeg', 0.8).split(',')[1]);
      };
    };
    reader.onerror = reject;
  });
};

const SHOT_SLOTS = [
  { id: 'front', label: 'Frente', icon: 'inventory_2', hint: 'Logo y nombre' },
  { id: 'nutrition', label: 'Nutrición', icon: 'format_list_numbered', hint: 'Tabla de valores' },
  { id: 'ingredients', label: 'Ingredientes', icon: 'science', hint: 'Lista de ingredientes' },
  { id: 'extra', label: 'Extra', icon: 'add_a_photo', hint: 'Otro ángulo' },
];

const COMPARE_SLOTS = [
  { id: 'cf', label: 'Frente', icon: 'inventory_2', hint: 'Producto A/B' },
  { id: 'cnut', label: 'Nutrición', icon: 'format_list_numbered', hint: 'Tabla A/B' },
];

export const LabelScanner: React.FC = () => {
  const { state, actions } = useGlobalState();

  // Producto principal: mapa slotId → base64
  const [shotsA, setShotsA] = useState<Record<string, string>>({});
  // Producto comparar: mapa slotId → base64
  const [shotsB, setShotsB] = useState<Record<string, string>>({});

  const [mode, setMode] = useState<'single' | 'compare'>('single');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState<string | null>(null);
  const [extractedFood, setExtractedFood] = useState<Partial<FoodItem> | null>(null);
  const [saveCategory, setSaveCategory] = useState('Proteinas');
  const [saved, setSaved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingSlot = useRef<{ product: 'A' | 'B'; slotId: string } | null>(null);

  const imagesA: string[] = Object.values(shotsA);
  const imagesB: string[] = Object.values(shotsB);

  const openPicker = (product: 'A' | 'B', slotId: string) => {
    pendingSlot.current = { product, slotId };
    if (fileInputRef.current) fileInputRef.current.value = '';
    fileInputRef.current?.click();
  };

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const slot = pendingSlot.current;
    if (!file || !slot) return;

    setCompressing(slot.slotId);
    try {
      const b64 = await compressImage(file);
      if (slot.product === 'A') setShotsA(prev => ({ ...prev, [slot.slotId]: b64 }));
      else setShotsB(prev => ({ ...prev, [slot.slotId]: b64 }));
    } catch {
      alert('No se pudo procesar la imagen.');
    } finally {
      setCompressing(null);
    }
  };

  const handleAnalyze = async () => {
    if (imagesA.length === 0) return;
    setLoading(true);
    setResult('');
    setExtractedFood(null);
    setSaved(false);

    const allImages = mode === 'compare' ? [...imagesA, ...imagesB] : imagesA;
    const prompt = mode === 'compare'
      ? `Compara estos dos productos. Las primeras ${imagesA.length} imágenes son Producto A y las siguientes ${imagesB.length} son Producto B. Indica cuál es más saludable y por qué.`
      : `Analiza este producto costarricense. ${imagesA.length > 1 ? `Tienes ${imagesA.length} ángulos del mismo producto (frente, tabla nutricional, ingredientes, etc). Extrae todos los datos posibles.` : ''}`;

    const res = await analyzeLabels(state, allImages, prompt);
    setResult(res);

    if (mode === 'single') {
      const extracted = await extractFoodData(state, imagesA);
      if (extracted) setExtractedFood(extracted);
    }

    setLoading(false);
  };

  const handleSaveToPantry = () => {
    if (!extractedFood) return;
    actions.addCustomFood({
      ...extractedFood as FoodItem,
      id: `custom_${Date.now()}`,
      isCustom: true,
      portion: `${extractedFood.baseAmount} ${extractedFood.unit} (${saveCategory})`
    });
    setSaved(true);
    actions.syncToCloud();
  };

  const totalPhotos = imagesA.length + imagesB.length;

  // ── Slot Card ───────────────────────────────────────────────────────────────
  const SlotCard = ({ slot, product, shots }: { slot: typeof SHOT_SLOTS[0] | typeof COMPARE_SLOTS[0]; product: 'A' | 'B'; shots: Record<string, string> }) => {
    const img = shots[slot.id];
    const isCompressing = compressing === slot.id;
    return (
      <button
        onClick={() => openPicker(product, slot.id)}
        className={`relative flex flex-col items-center justify-center rounded-3xl border-2 transition-all active:scale-95 overflow-hidden
          ${img ? 'border-primary/30 bg-primary/5' : 'border-dashed border-slate-200 bg-slate-50 hover:border-primary/30'}
        `}
        style={{ minHeight: 88, minWidth: 80, flex: '1 1 0' }}
      >
        {img ? (
          <>
            <img src={`data:image/jpeg;base64,${img}`} className="absolute inset-0 w-full h-full object-cover" alt={slot.label} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <span className="relative text-white text-[8px] font-black uppercase tracking-wider mt-auto mb-1 z-10">{slot.label}</span>
            <div className="absolute top-1.5 right-1.5 bg-accent-lime rounded-full p-0.5">
              <span className="material-symbols-outlined text-white text-[10px]">check</span>
            </div>
          </>
        ) : (
          <>
            {isCompressing ? (
              <span className="material-symbols-outlined text-primary text-xl animate-spin">sync</span>
            ) : (
              <span className="material-symbols-outlined text-slate-400 text-xl">{slot.icon}</span>
            )}
            <span className="text-[8px] font-black text-slate-400 uppercase mt-1">{slot.label}</span>
            <span className="text-[7px] text-slate-300 mt-0.5 px-1 text-center">{slot.hint}</span>
          </>
        )}
      </button>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto pb-28 bg-background-light no-scrollbar">
      <header className="sticky top-0 z-40 bg-white border-b border-primary/10 px-5 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-primary">Escáner Bio-Analítico</h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              {totalPhotos > 0 ? `${totalPhotos} foto${totalPhotos > 1 ? 's' : ''} lista${totalPhotos > 1 ? 's' : ''}` : 'Auditoría de Etiquetas'}
            </p>
          </div>
          {/* Modo toggle */}
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button onClick={() => setMode('single')} className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${mode === 'single' ? 'bg-primary text-white shadow' : 'text-slate-400'}`}>
              Analizar
            </button>
            <button onClick={() => setMode('compare')} className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${mode === 'compare' ? 'bg-primary text-white shadow' : 'text-slate-400'}`}>
              Comparar
            </button>
          </div>
        </div>
      </header>

      <div className="p-5 space-y-5 max-w-lg mx-auto">

        {/* ── Producto Principal ──────────────────────────── */}
        <section className="bg-white rounded-[2.5rem] shadow-sm border border-primary/5 p-5 space-y-3">
          <div className="flex justify-between items-center px-1">
            <div>
              <h3 className="text-[10px] font-black text-primary uppercase tracking-widest">
                {mode === 'compare' ? 'Producto A' : 'Producto Principal'}
              </h3>
              <p className="text-[9px] text-slate-400 mt-0.5">Toca cada ángulo para fotografiarlo</p>
            </div>
            {imagesA.length > 0 && (
              <button onClick={() => setShotsA({})} className="text-[9px] text-red-400 font-black uppercase">Limpiar</button>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2" style={{ gridAutoRows: '88px' }}>
            {SHOT_SLOTS.map(slot => (
              <SlotCard key={slot.id} slot={slot} product="A" shots={shotsA} />
            ))}
          </div>
        </section>

        {/* ── Producto B (solo en modo comparar) ──────────── */}
        {mode === 'compare' && (
          <section className="bg-white rounded-[2.5rem] shadow-sm border border-primary/5 p-5 space-y-3">
            <div className="flex justify-between items-center px-1">
              <div>
                <h3 className="text-[10px] font-black text-primary uppercase tracking-widest">Producto B</h3>
                <p className="text-[9px] text-slate-400 mt-0.5">El producto a comparar</p>
              </div>
              {imagesB.length > 0 && (
                <button onClick={() => setShotsB({})} className="text-[9px] text-red-400 font-black uppercase">Limpiar</button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2" style={{ gridAutoRows: '88px' }}>
              {COMPARE_SLOTS.map(slot => (
                <SlotCard key={slot.id} slot={slot} product="B" shots={shotsB} />
              ))}
            </div>
          </section>
        )}

        {/* ── Input oculto ─────────────────────────────────── */}
        <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleCapture} className="hidden" />

        {/* ── Tips de guía cuando no hay fotos ────────────── */}
        {imagesA.length === 0 && (
          <div className="bg-primary/5 border border-primary/10 rounded-3xl p-5 space-y-2">
            <p className="text-[10px] font-black text-primary uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">tips_and_updates</span>
              Consejos para mejor lectura
            </p>
            <ul className="text-[10px] text-slate-500 space-y-1 list-disc ml-4">
              <li>Fotografía la <strong>tabla nutricional</strong> con buena iluminación</li>
              <li>Toma el <strong>frente</strong> para identificar marca y nombre</li>
              <li>Agrega <strong>ingredientes</strong> para detección de alérgenos</li>
              <li>Mantén la foto <strong>estable y enfocada</strong></li>
            </ul>
          </div>
        )}

        {/* ── Botón Analizar ────────────────────────────────── */}
        <button
          disabled={imagesA.length === 0 || loading}
          onClick={handleAnalyze}
          className="w-full py-5 bg-primary text-white rounded-3xl font-bold shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-40 active:scale-95 transition-all"
        >
          <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>{loading ? 'sync' : 'biotech'}</span>
          {loading ? 'Analizando con Gemini...' : `Iniciar Auditoría${imagesA.length > 0 ? ` (${imagesA.length} foto${imagesA.length > 1 ? 's' : ''})` : ''}`}
        </button>

        {/* ── Resultado ────────────────────────────────────── */}
        {result && (
          <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-primary/5 space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-3 text-primary">
              <div className="size-10 bg-primary/10 rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">description</span>
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest">Dictamen NutriTico</h3>
                <p className="text-[9px] text-slate-400">Análisis con Gemini 1.5 Pro</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{result}</p>

            {extractedFood && (
              <div className="bg-gradient-to-br from-primary/5 to-accent-lime/5 p-6 rounded-[2rem] border border-primary/10 space-y-4 animate-in fade-in zoom-in">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Producto Detectado</p>
                    <h4 className="text-sm font-bold text-primary mt-0.5">{extractedFood.name}</h4>
                    <p className="text-[9px] text-slate-400">{extractedFood.portion}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-black bg-primary text-white px-2 py-1 rounded-lg block">{extractedFood.calories} kcal</span>
                    <p className="text-[8px] text-slate-400 mt-1">P:{extractedFood.macros?.p}g C:{extractedFood.macros?.c}g G:{extractedFood.macros?.f}g</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase block">Categoría en tu Plan</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {['Harinas', 'Proteinas', 'Grasas', 'Vegetales'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSaveCategory(cat)}
                        className={`py-2 rounded-xl text-[8px] font-black uppercase transition-all ${saveCategory === cat ? 'bg-primary text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {saved ? (
                  <div className="w-full py-3 bg-accent-lime/10 text-accent-lime rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-accent-lime/20">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    ¡Guardado en tu Despensa!
                  </div>
                ) : (
                  <button
                    onClick={handleSaveToPantry}
                    className="w-full py-3 bg-accent-lime text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-accent-lime/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                    Añadir a mi Despensa
                  </button>
                )}
              </div>
            )}

            <button
              onClick={() => { setResult(''); setExtractedFood(null); setSaved(false); setShotsA({}); setShotsB({}); }}
              className="text-[10px] text-slate-400 font-black uppercase flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">refresh</span>
              Nuevo Escaneo
            </button>
          </section>
        )}
      </div>
    </div>
  );
};
