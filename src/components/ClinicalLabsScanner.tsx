import React, { useState, useRef } from 'react';
import { useGlobalState } from '../context/GlobalState';
import { ChevronRight, Activity, Droplet, HeartPulse, AlertCircle, CheckCircle2, UploadCloud } from 'lucide-react';
import { ClinicalLabs } from '../types';
import { Tooltip } from './Tooltip';
import { compressImageFile } from '../utils/imageCompressor';

interface Props {
    onBack: () => void;
}

export const ClinicalLabsScanner: React.FC<Props> = ({ onBack }) => {
    const { state, dispatch, syncToCloud } = useGlobalState();
    const [isScanning, setIsScanning] = useState(false);
    const [scannedData, setScannedData] = useState<ClinicalLabs | null>(state.profile.labs || null);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFiles = async (files: File[] | FileList) => {
        if (!files || files.length === 0) return;

        setIsScanning(true);
        setError(null);

        try {
            const imagePromises = Array.from(files).map(async (file) => {
                const base64 = await compressImageFile(file);
                return { data: base64, mimeType: file.type };
            });

            const images = await Promise.all(imagePromises);

            const res = await fetch('/api/analyze_labs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ images })
            });

            if (!res.ok) throw new Error("Falla en el Cerebro Médico");

            const data = await res.json();
            setScannedData(data);

            dispatch({ type: 'UPDATE_LABS', payload: data });
            syncToCloud();

        } catch (err: any) {
            console.error(err);
            let errorMsg = "No se pudo analizar el examen. Asegúrate de que los números sean legibles.";
            if (err.message?.includes("413") || err.message?.includes("large")) {
                errorMsg = "El archivo es demasiado grande. Intenta comprimirlo antes de subirlo.";
            } else if (err.message?.includes("429")) {
                errorMsg = "Límite alcanzado, intenta de nuevo en unos segundos.";
            } else if (err.message?.includes("500")) {
                errorMsg = "El Endocrinólogo IA no pudo responder. Revisa que el documento/foto sea claro.";
            }
            setError(errorMsg);
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

    return (
        <div className="space-y-6">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all mb-4"
            >
                <ChevronRight className="rotate-180" size={14} />
                Volver al Perfil
            </button>

            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`transition-all rounded-[2.5rem] p-1 ${dragActive ? 'bg-red-500 rounded-[2.5rem] scale-[1.02]' : ''}`}
            >
                <div className={`bg-gradient-to-br from-red-500/20 to-purple-500/20 border border-red-500/30 rounded-[2.5rem] p-8 text-center relative overflow-hidden h-full flex flex-col items-center justify-center min-h-[300px]`}>
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <HeartPulse size={120} />
                    </div>
                    <div className="relative z-10 w-full">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Consejo Médico (Pro)</h2>
                        <p className="text-xs text-slate-300 font-bold mb-8 max-w-sm mx-auto">Sube una foto o PDF de tus laboratorios recientes. Nuestro Endocrinólogo IA extraerá los biomarcadores para adaptar tu nutrición clínicamente.</p>

                        <input
                            type="file"
                            accept="image/*,application/pdf"
                            multiple
                            className="hidden"
                            ref={fileInputRef}
                            onChange={(e) => processFiles(e.target.files as FileList)}
                        />

                        {isScanning ? (
                            <div className="flex flex-col items-center gap-4 py-4">
                                <div className="w-16 h-1 bg-red-500 rounded-full animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.8)]"></div>
                                <p className="text-red-500 font-black uppercase tracking-widest text-xs">Alineando Biomarcadores...</p>
                            </div>
                        ) : (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-red-500/30 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/50 p-6 rounded-3xl mx-auto w-full max-w-sm cursor-pointer transition-all group"
                            >
                                <div className="size-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-red-500 group-hover:text-white transition-all">
                                    <UploadCloud size={24} />
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest text-red-400 block group-hover:text-white pointer-events-none">
                                    Arrastra o <span className="underline decoration-red-500/40 underline-offset-4 pointer-events-none">haz click</span>
                                </span>
                            </div>
                        )}
                        {error && <p className="text-red-400 text-xs mt-6 font-bold bg-black/40 p-3 rounded-xl inline-block">{error}</p>}
                    </div>
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
                        <LabCard label="Glucosa (Ayunas)" value={scannedData.fastingGlucose} unit="mg/dL" normalRange="< 100" icon={Droplet} tip="Nivel de azúcar base tras 8 horas sin comer. Valores elevados sugieren prediabetes o resistencia a la insulina." />
                        <LabCard label="HbA1c" value={scannedData.hba1c} unit="%" normalRange="< 5.7" icon={Activity} tip="Hemoglobina Glicosilada: Refleja tu promedio de glucosa en sangre de los últimos 3 meses." />
                        <LabCard label="Triglicéridos" value={scannedData.triglycerides} unit="mg/dL" normalRange="< 150" icon={Droplet} tip="Grasas en la sangre. Paradójicamente, se elevan por un exceso de azúcares y harinas, no tanto por comer grasa." />
                        <LabCard label="Colesterol HDL" value={scannedData.hdl} unit="mg/dL" normalRange="> 40" icon={HeartPulse} tip="Colesterol protector. Valores altos (>60) ayudan a limpiar las arterias y reducen el riesgo cardiovascular." />
                        <LabCard label="Colesterol LDL" value={scannedData.ldl} unit="mg/dL" normalRange="< 100" icon={HeartPulse} tip="Colesterol asociado a formación de placa arterial. Su riesgo aumenta si también tienes triglicéridos altos." />
                        <LabCard label="TSH (Tiroides)" value={scannedData.tsh} unit="mIU/L" normalRange="0.4 - 4.0" icon={Activity} tip="Hormona Estimulante de la Tiroides. Regula tu metabolismo; si está alta, tu metabolismo basal puede volverse lento." />
                        <LabCard label="Ácido Úrico" value={scannedData.uricAcid} unit="mg/dL" normalRange="< 7.0" icon={Droplet} tip="Producido al metabolizar purinas. Niveles muy altos reflejan estrés metabólico y riesgo de gota." />
                    </div>
                </div>
            )}
        </div>
    );
};

const LabCard = ({ label, value, unit, normalRange, icon: Icon, tip }: any) => {
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
        <div className={`p-5 rounded-3xl ${bgLight} border ${borderStatus} relative group`}>
            {tip && (
                <div className="absolute top-3 right-3 z-10">
                    <Tooltip text={tip} />
                </div>
            )}
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
