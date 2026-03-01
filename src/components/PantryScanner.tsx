import React, { useState } from 'react';
import { useGlobalState } from '../context/GlobalState';
import { Camera, CheckCircle, Tag, AlertTriangle } from 'lucide-react';
import { FoodEquivalent } from '../types';

export const PantryScanner: React.FC = () => {
    const { state, dispatch } = useGlobalState();
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<FoodEquivalent | null>(null);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsScanning(true);
        setScanResult(null);

        try {
            // Convert to base64
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve) => {
                reader.onload = () => {
                    const base64 = (reader.result as string).split(',')[1];
                    resolve(base64);
                };
            });
            reader.readAsDataURL(file);
            const base64Image = await base64Promise;

            // Call real Vision API
            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    images: [base64Image],
                    stateString: JSON.stringify({
                        profile: state.profile,
                        targets: state.calculatedTargets
                    })
                })
            });

            if (!res.ok) throw new Error("Falla en el análisis de visión");
            const result = await res.json();

            setScanResult(result);
            dispatch({ type: 'ADD_TO_PANTRY', payload: result });

            // Also notify chat
            dispatch({
                type: 'ADD_CHAT_MESSAGE',
                payload: { role: 'ai', text: `He analizado tu imagen. He detectado "${result.name}" (${result.group}) y lo he añadido a tu despensa para futuros planes.` }
            });

        } catch (error: any) {
            console.error(error);
            let errorMsg = "Error al escanear: La IA no pudo procesar esta imagen.";
            if (error.message?.includes("413") || error.message?.includes("large")) {
                errorMsg = "La imagen es demasiado grande. Prueba con una foto más pequeña o de menor resolución.";
            } else if (error.message?.includes("429")) {
                errorMsg = "Límite de peticiones alcanzado. Espera un momento (aunque en tu plan Pago esto es poco común).";
            }
            alert(errorMsg);
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Context Warning if Strict Strategy */}
            {state.profile.strategies.includes('keto') && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-start gap-4">
                    <AlertTriangle className="text-amber-500 shrink-0" />
                    <div>
                        <h4 className="text-amber-500 font-bold uppercase text-xs">Estrategia Keto Activa</h4>
                        <p className="text-amber-200/70 text-sm mt-1">
                            La IA de Visión será muy estricta al categorizar alimentos con alto contenido de carbohidratos netos.
                        </p>
                    </div>
                </div>
            )}

            {/* Hidden Input */}
            <input
                type="file"
                id="pantry-upload"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageChange}
                disabled={isScanning}
            />

            {/* Scanner Box */}
            <label
                htmlFor="pantry-upload"
                className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden group hover:border-emerald-500/30 transition-all cursor-pointer"
            >
                {isScanning ? (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-1 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.8)]"></div>
                        <p className="text-emerald-500 font-black uppercase tracking-widest text-xs">Analizando mediante Visión IA...</p>
                    </div>
                ) : (
                    <>
                        <div className="size-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-500 mb-6 group-hover:scale-110 group-hover:bg-emerald-500 transition-all group-hover:text-white">
                            <Camera size={32} />
                        </div>
                        <h3 className="text-white font-black text-xl mb-2">Escáner de Despensa</h3>
                        <p className="text-slate-400 text-center max-w-sm">
                            Sube una foto de un platillo, ingrediente o etiqueta nutricional. La IA lo clasificará según el sistema GABSA y tus porciones.
                        </p>
                    </>
                )}
            </label>

            {/* Scan Result */}
            {scanResult && !isScanning && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-[2rem] animate-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="size-12 bg-emerald-500 rounded-2xl flex items-center justify-center">
                            <CheckCircle className="text-white" />
                        </div>
                        <div>
                            <span className="text-emerald-500 font-black uppercase text-[10px] tracking-widest">Reconocimiento Exitoso</span>
                            <h4 className="text-white text-xl font-bold">{scanResult.name}</h4>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        <div className="bg-black/20 p-4 rounded-2xl">
                            <span className="text-slate-400 text-[10px] font-black uppercase">Grupo</span>
                            <p className="text-white font-bold">{scanResult.group}</p>
                        </div>
                        <div className="bg-black/20 p-4 rounded-2xl">
                            <span className="text-slate-400 text-[10px] font-black uppercase">Porción Clínica</span>
                            <p className="text-white font-bold">{scanResult.equivalentPortion}</p>
                        </div>
                        <div className="bg-black/20 p-4 rounded-2xl">
                            <span className="text-slate-400 text-[10px] font-black uppercase">Calorías</span>
                            <p className="text-emerald-400 font-black">{scanResult.calories} kcal</p>
                        </div>
                        <div className="bg-black/20 p-4 rounded-2xl">
                            <span className="text-slate-400 text-[10px] font-black uppercase">Carbohidratos</span>
                            <p className="text-blue-400 font-bold">{scanResult.macros.c}g</p>
                        </div>
                    </div>

                    <div className="mt-6 flex gap-4">
                        <button className="flex-1 bg-emerald-500 text-white font-black py-4 rounded-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-2">
                            <Tag size={18} />
                            Añadir a Despensa
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
