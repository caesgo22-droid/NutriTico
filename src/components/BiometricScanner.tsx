import React, { useState, useRef } from 'react';
import { useGlobalState } from '../context/GlobalState';
import { Camera, ChevronRight, Activity, Percent, Droplets, Bone, Flame } from 'lucide-react';
import { Biometrics } from '../types';

interface Props {
    onBack: () => void;
}

export const BiometricScanner: React.FC<Props> = ({ onBack }) => {
    const { state, dispatch, syncToCloud } = useGlobalState();
    const [isScanning, setIsScanning] = useState(false);
    const [scannedData, setScannedData] = useState<Biometrics | null>(state.profile.biometrics || null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsScanning(true);
        setError(null);

        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = reader.result as string;

                // Call our new api/biometrics endpoint
                const res = await fetch('/api/biometrics', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ images: [base64String] })
                });

                if (!res.ok) throw new Error("Falla en el Cerebro Biométrico");

                const data: Biometrics = await res.json();
                setScannedData(data);

                // Save to Global State immediately
                dispatch({ type: 'UPDATE_BIOMETRICS', payload: data });
                syncToCloud();
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.error(err);
            setError("No se pudo extraer la biometría. Intenta con un pantallazo más claro.");
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="space-y-6">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all mb-4"
            >
                <ChevronRight className="rotate-180" size={14} />
                Volver al Perfil
            </button>

            <div className="bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 rounded-[2.5rem] p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Activity size={100} />
                </div>
                <div className="relative z-10">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Escáner Biométrico (Pro)</h2>
                    <p className="text-xs text-slate-400 font-bold mb-6">Sube un pantallazo de tu app (Cubitt, Garmin) para extraer tus niveles de composición corporal con IA.</p>

                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                    />

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isScanning}
                        className="bg-emerald-500 text-white px-8 py-4 rounded-full font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-3 mx-auto hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {isScanning ? (
                            <>
                                <span className="material-symbols-outlined animate-spin">sync</span>
                                Analizando Pixeles...
                            </>
                        ) : (
                            <>
                                <Camera size={18} />
                                Subir Pantallazo
                            </>
                        )}
                    </button>
                    {error && <p className="text-red-400 text-xs mt-4 font-bold">{error}</p>}
                </div>
            </div>

            {scannedData && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <MetricCard label="Grasa Corporal" value={scannedData.bodyFatPercentage} unit="%" icon={Percent} color="text-amber-500" bg="bg-amber-500/10" border="border-amber-500/20" />
                    <MetricCard label="Masa Muscular" value={scannedData.muscleMassPercentage} unit="%" icon={Activity} color="text-emerald-500" bg="bg-emerald-500/10" border="border-emerald-500/20" />
                    <MetricCard label="Agua / Hidratación" value={scannedData.waterPercentage} unit="%" icon={Droplets} color="text-blue-500" bg="bg-blue-500/10" border="border-blue-500/20" />
                    <MetricCard label="Masa Ósea" value={scannedData.boneMass} unit="kg" icon={Bone} color="text-slate-300" bg="bg-white/10" border="border-white/20" />
                    <MetricCard label="Grasa Visceral" value={scannedData.visceralFat} unit="" icon={Flame} color="text-red-500" bg="bg-red-500/10" border="border-red-500/20" />
                    <MetricCard label="Edad Metabólica" value={scannedData.metabolicAge} unit="años" icon={Activity} color="text-purple-500" bg="bg-purple-500/10" border="border-purple-500/20" />
                </div>
            )}
        </div>
    );
};

const MetricCard = ({ label, value, unit, icon: Icon, color, bg, border }: any) => {
    if (value === undefined || value === null) return null;
    return (
        <div className={`p-5 rounded-3xl ${bg} border ${border} flex flex-col items-center justify-center text-center`}>
            <Icon className={`${color} mb-2`} size={24} />
            <span className="text-2xl font-black text-white tracking-tighter">{value}<span className="text-sm text-slate-400 tracking-normal ml-1">{unit}</span></span>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-1">{label}</span>
        </div>
    );
};
