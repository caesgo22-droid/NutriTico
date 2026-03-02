import React, { useState, useRef } from 'react';
import { useGlobalState } from '../context/GlobalState';
import { AlertTriangle, Save, Edit3, X, UploadCloud } from 'lucide-react';
import { FoodEquivalent } from '../types';
import { compressImageFile } from '../utils/imageCompressor';

export const PantryScanner: React.FC = () => {
    const { state, dispatch, syncToCloud } = useGlobalState();
    const [isScanning, setIsScanning] = useState(false);
    const [editableResult, setEditableResult] = useState<FoodEquivalent | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFiles = async (files: File[] | FileList) => {
        if (!files || files.length === 0) return;

        setIsScanning(true);
        setEditableResult(null);

        try {
            const imagePromises = Array.from(files).map(async (file) => {
                const base64 = await compressImageFile(file);
                return { data: base64, mimeType: file.type };
            });

            const images = await Promise.all(imagePromises);

            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    images,
                    stateString: JSON.stringify({
                        profile: state.profile,
                        targets: state.calculatedTargets
                    })
                })
            });

            if (!res.ok) throw new Error("Falla en el análisis de visión");
            const result = await res.json();

            // Default to empty strings for brand/ingredients if missing
            setEditableResult({
                ...result,
                brand: result.brand || '',
                ingredients: result.ingredients || ''
            });

        } catch (error: any) {
            console.error(error);
            let errorMsg = "Error al escanear: La IA no pudo procesar esta imagen.";
            if (error.message?.includes("413") || error.message?.includes("large")) {
                errorMsg = "La imagen es demasiado grande. Prueba con una foto más pequeña o de menor resolución.";
            } else if (error.message?.includes("429")) {
                errorMsg = "Límite de peticiones alcanzado. Espera un momento (aunque en tu plan Pago esto es poco común).";
            } else if (error.message?.includes("500")) {
                errorMsg = "Falla interna del Cerebro IA. Intenta tomar la foto con mejor iluminación o reintenta.";
            }
            alert(errorMsg);
        } finally {
            setIsScanning(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFiles(e.dataTransfer.files);
        }
    };

    const handleSave = () => {
        if (!editableResult) return;

        dispatch({ type: 'ADD_TO_PANTRY', payload: editableResult });
        syncToCloud();

        dispatch({
            type: 'ADD_CHAT_MESSAGE',
            payload: { role: 'ai', text: `He guardado "${editableResult.name}" (${editableResult.group}) en tu despensa inteligente. He ajustado su perfil nutricional para considerarlo en tus planes.` }
        });

        setEditableResult(null);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {state.profile.strategies.includes('keto') && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-start gap-4">
                    <AlertTriangle className="text-amber-500 shrink-0" />
                    <div>
                        <h4 className="text-amber-500 font-bold uppercase text-xs">Estrategia Keto Activa</h4>
                        <p className="text-amber-200/70 text-sm mt-1">
                            La IA será muy estricta al categorizar alimentos e ingredientes ocultos (carbohidratos netos).
                        </p>
                    </div>
                </div>
            )}

            {!editableResult && (
                <>
                    <input
                        type="file"
                        id="pantry-upload"
                        accept="image/*,application/pdf"
                        multiple
                        className="hidden"
                        ref={fileInputRef}
                        onChange={(e) => processFiles(e.target.files as FileList)}
                        disabled={isScanning}
                    />

                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed p-8 rounded-[2.5rem] flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden group transition-all cursor-pointer ${dragActive ? 'bg-emerald-500/10 border-emerald-500' : 'bg-white/5 border-white/10 hover:border-emerald-500/30'}`}
                    >
                        {isScanning ? (
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-16 h-1 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.8)]"></div>
                                <p className="text-emerald-500 font-black uppercase tracking-widest text-xs text-center">Analizando documentos (OCR+)...</p>
                            </div>
                        ) : (
                            <>
                                <div className={`size-20 rounded-3xl flex items-center justify-center mb-6 transition-all ${dragActive ? 'bg-emerald-500 text-white scale-110' : 'bg-emerald-500/10 text-emerald-500 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white'}`}>
                                    <UploadCloud size={32} />
                                </div>
                                <h3 className="text-white font-black text-xl mb-2 text-center">Escáner de Despensa</h3>
                                <p className="text-slate-400 text-center max-w-sm text-sm">
                                    Arrastra o <span className="text-emerald-400 underline decoration-emerald-500/30 underline-offset-4">haz click</span> para subir fotos (ingredientes, empaques, etiquetas) o documentos PDF. Puedes subir múltiples archivos a la vez.
                                </p>
                            </>
                        )}
                    </div>
                </>
            )}

            {editableResult && !isScanning && (
                <div className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-[2.5rem] animate-in slide-in-from-bottom-4">
                    <div className="flex items-start justify-between mb-6 border-b border-white/5 pb-6">
                        <div className="flex items-center gap-4">
                            <div className="size-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl flex items-center justify-center shrink-0">
                                <Edit3 size={24} />
                            </div>
                            <div>
                                <span className="text-emerald-500 font-black uppercase text-[10px] tracking-widest block mb-1">Revisión AI Activa</span>
                                <h4 className="text-white text-xl font-bold">Auditar Ingrediente</h4>
                            </div>
                        </div>
                        <button onClick={() => setEditableResult(null)} className="size-10 bg-white/5 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <InputGroup
                                label="Nombre del Producto"
                                value={editableResult.name}
                                onChange={(val: string) => setEditableResult({ ...editableResult, name: val })}
                            />
                            <InputGroup
                                label="Marca"
                                value={editableResult.brand || ''}
                                onChange={(val: string) => setEditableResult({ ...editableResult, brand: val })}
                                placeholder="Ej. Dos Pinos, Numar"
                            />
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Grupo GABSA</label>
                                <select
                                    value={editableResult.group}
                                    onChange={(e) => setEditableResult({ ...editableResult, group: e.target.value as any })}
                                    className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-emerald-500/50 transition-all font-semibold text-white appearance-none"
                                >
                                    {['Proteína', 'Carbohidratos', 'Grasas', 'Vegetales', 'Frutas', 'Lácteos', 'Ultraprocesados', 'Otros'].map(g => (
                                        <option key={g} value={g} className="bg-[#0f172a]">{g}</option>
                                    ))}
                                </select>
                            </div>
                            <InputGroup
                                label="Porción Clínica"
                                value={editableResult.equivalentPortion}
                                onChange={(val: string) => setEditableResult({ ...editableResult, equivalentPortion: val })}
                                placeholder="Ej. 1 Taza, 30g"
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <InputGroup
                                    label="Calorías (kcal)"
                                    type="number"
                                    value={String(editableResult.calories)}
                                    onChange={(val: string) => setEditableResult({ ...editableResult, calories: Number(val) })}
                                />
                                <InputGroup
                                    label="Proteína (g)"
                                    type="number"
                                    value={String(editableResult.macros.p)}
                                    onChange={(val: string) => setEditableResult({ ...editableResult, macros: { ...editableResult.macros, p: Number(val) } })}
                                />
                                <InputGroup
                                    label="Carbos (g)"
                                    type="number"
                                    value={String(editableResult.macros.c)}
                                    onChange={(val: string) => setEditableResult({ ...editableResult, macros: { ...editableResult.macros, c: Number(val) } })}
                                />
                                <InputGroup
                                    label="Grasas (g)"
                                    type="number"
                                    value={String(editableResult.macros.f)}
                                    onChange={(val: string) => setEditableResult({ ...editableResult, macros: { ...editableResult.macros, f: Number(val) } })}
                                />
                            </div>

                            <div className="space-y-2 h-full">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Ingredientes</label>
                                <textarea
                                    value={editableResult.ingredients || ''}
                                    onChange={(e) => setEditableResult({ ...editableResult, ingredients: e.target.value })}
                                    className="w-full h-[116px] bg-black/20 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-emerald-500/50 transition-all font-medium text-slate-300 text-sm resize-none"
                                    placeholder="Detalle de ingredientes..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">
                        <button
                            onClick={handleSave}
                            className="w-full bg-emerald-500 text-white font-black py-5 rounded-2xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                        >
                            <Save size={20} />
                            GUARDAR EN DESPENSA
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const InputGroup = ({ label, value, onChange, type = "text", placeholder = "" }: any) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">{label}</label>
        <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-emerald-500/50 transition-all font-semibold text-white placeholder:text-slate-600"
        />
    </div>
);
