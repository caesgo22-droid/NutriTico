import React, { useState, useRef } from 'react';
import { useGlobalState } from '../context/GlobalState';
import { ChevronRight, Activity, FileText, Droplet, HeartPulse, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ClinicalLabs } from '../types';

interface Props {
    onBack: () => void;
}

export const ClinicalLabsScanner: React.FC<Props> = ({ onBack }) => {
    const { state, dispatch, syncToCloud } = useGlobalState();
    const [isScanning, setIsScanning] = useState(false);
    const [scannedData, setScannedData] = useState<ClinicalLabs | null>(state.profile.labs || null);
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

                const res = await fetch('/api/analyze_labs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ images: [base64String] })
                });

                if (!res.ok) throw new Error("Falla en el Cerebro Médico");

                const data = await res.json();
                setScannedData(data);

                dispatch({ type: 'UPDATE_LABS', payload: data });
                syncToCloud();
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.error(err);
            setError("No se pudo analizar el examen. Asegúrate de que los números sean legibles.");
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

            <div className="bg-gradient-to-br from-red-500/20 to-purple-500/20 border border-red-500/30 rounded-[2.5rem] p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <HeartPulse size={100} />
                </div>
                <div className="relative z-10">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Consejo Médico (Pro)</h2>
                    <p className="text-xs text-slate-300 font-bold mb-6 max-w-sm mx-auto">Sube una foto de tus laboratorios recientes. Nuestro Endocrinólogo IA extraerá los biomarcadores para adaptar tu nutrición clínicamente.</p>

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
                        className="bg-red-500 text-white px-8 py-4 rounded-full font-black uppercase tracking-widest text-xs shadow-lg shadow-red-500/20 flex items-center gap-3 mx-auto hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {isScanning ? (
                            <>
                                <span className="material-symbols-outlined animate-spin">sync</span>
                                Analizando Biomarcadores...
                            </>
                        ) : (
                            <>
                                <FileText size={18} />
                                Subir Examen (Foto/PDF)
                            </>
                        )}
                    </button>
                    {error && <p className="text-red-400 text-xs mt-4 font-bold">{error}</p>}
                </div>
            </div>

            {scannedData && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {(scannedData as any).medicalObservations && (
                        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex gap-4 items-start">
                            <div className="size-10 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center shrink-0">
                                <Activity size={20} />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Análisis Clínico IA</h3>
                                <p className="text-sm text-slate-200 leading-relaxed font-medium">{(scannedData as any).medicalObservations}</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        <LabCard label="Glucosa (Ayunas)" value={scannedData.fastingGlucose} unit="mg/dL" normalRange="< 100" icon={Droplet} />
                        <LabCard label="HbA1c" value={scannedData.hba1c} unit="%" normalRange="< 5.7" icon={Activity} />
                        <LabCard label="Triglicéridos" value={scannedData.triglycerides} unit="mg/dL" normalRange="< 150" icon={Droplet} />
                        <LabCard label="Colesterol HDL" value={scannedData.hdl} unit="mg/dL" normalRange="> 40" icon={HeartPulse} />
                        <LabCard label="Colesterol LDL" value={scannedData.ldl} unit="mg/dL" normalRange="< 100" icon={HeartPulse} />
                        <LabCard label="TSH (Tiroides)" value={scannedData.tsh} unit="mIU/L" normalRange="0.4 - 4.0" icon={Activity} />
                        <LabCard label="Ácido Úrico" value={scannedData.uricAcid} unit="mg/dL" normalRange="< 7.0" icon={Droplet} />
                    </div>
                </div>
            )}
        </div>
    );
};

const LabCard = ({ label, value, unit, normalRange, icon: Icon }: any) => {
    if (value === undefined || value === null) return null;

    // Basic heuristics for visual flags
    let statusColor = "text-emerald-500";
    let bgLight = "bg-emerald-500/10";
    let borderStatus = "border-emerald-500/20";
    let StatusIcon = CheckCircle2;

    if (label.includes("Glucosa") && value >= 100) { statusColor = "text-amber-500"; bgLight = "bg-amber-500/10"; borderStatus = "border-amber-500/30"; StatusIcon = AlertCircle; }
    if (label.includes("HbA1c") && value >= 5.7) { statusColor = "text-red-500"; bgLight = "bg-red-500/10"; borderStatus = "border-red-500/30"; StatusIcon = AlertCircle; }
    if (label.includes("Triglicéridos") && value >= 150) { statusColor = "text-red-500"; bgLight = "bg-red-500/10"; borderStatus = "border-red-500/30"; StatusIcon = AlertCircle; }
    if (label.includes("LDL") && value >= 130) { statusColor = "text-amber-500"; bgLight = "bg-amber-500/10"; borderStatus = "border-amber-500/30"; StatusIcon = AlertCircle; }
    if (label.includes("HDL") && value < 40) { statusColor = "text-red-500"; bgLight = "bg-red-500/10"; borderStatus = "border-red-500/30"; StatusIcon = AlertCircle; }

    return (
        <div className={`p-5 rounded-3xl ${bgLight} border ${borderStatus} relative overflow-hidden`}>
            <div className="flex justify-between items-start mb-4">
                <Icon className={statusColor} size={20} />
                <StatusIcon className={`${statusColor} opacity-50`} size={16} />
            </div>
            <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white tracking-tighter">{value}</span>
                <span className="text-[10px] font-bold text-slate-400">{unit}</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 mt-1 block leading-tight">{label}</span>
            <span className="text-[9px] font-bold text-slate-500 mt-2 block">Normal: {normalRange}</span>
        </div>
    );
};
