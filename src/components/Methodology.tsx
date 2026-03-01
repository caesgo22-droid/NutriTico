import React from 'react';
import { CLINICAL_BASIS } from '../data/clinical_basis';
import { ShieldCheck, BookOpen, Cpu, AlertTriangle, ChevronRight } from 'lucide-react';

export const Methodology: React.FC = () => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white">Fundamentos Clínicos</h2>
                    <p className="text-slate-400 mt-1">Versión del Cerebro: <span className="text-emerald-500 font-bold">{CLINICAL_BASIS.version}</span></p>
                </div>
                <div className="size-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
                    <BookOpen className="text-emerald-500" />
                </div>
            </div>

            {/* AI Disclaimer */}
            <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-[2rem] flex items-start gap-4">
                <AlertTriangle className="text-red-500 shrink-0" size={24} />
                <div>
                    <h4 className="text-red-500 font-black uppercase text-xs tracking-widest mb-2">Aviso Importante</h4>
                    <p className="text-slate-300 text-sm leading-relaxed">
                        {CLINICAL_BASIS.disclaimer}
                    </p>
                </div>
            </div>

            {/* Grid of information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bases Científicas */}
                <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 ml-2">Fuentes y Bases</h3>
                    {CLINICAL_BASIS.foundations.map((item, idx) => (
                        <div key={idx} className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/[0.08] transition-all">
                            <h4 className="text-emerald-400 font-black text-sm mb-2">{item.name}</h4>
                            <p className="text-slate-400 text-xs leading-relaxed mb-3">{item.description}</p>
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500">
                                <ShieldCheck size={12} className="text-emerald-500" />
                                <span>Aplicado en: {item.application}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Algoritmos Meta */}
                <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 ml-2">Metodologías de Cálculo</h3>
                    {CLINICAL_BASIS.methodologies.map((item, idx) => (
                        <div key={idx} className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/[0.08] transition-all">
                            <h4 className="text-blue-400 font-black text-sm mb-2">{item.name}</h4>
                            <p className="text-slate-400 text-xs leading-relaxed mb-3">{item.description}</p>
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500">
                                <ChevronRight size={12} className="text-blue-500" />
                                <span>Lógica: {item.application}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* AI Architecture Section */}
            <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all">
                    <Cpu size={120} />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="size-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                            <Cpu size={20} />
                        </div>
                        <h3 className="text-white font-black text-xl">{CLINICAL_BASIS.aiLogic.title}</h3>
                    </div>
                    <ul className="space-y-4">
                        {CLINICAL_BASIS.aiLogic.principles.map((principle, idx) => (
                            <li key={idx} className="flex gap-4 items-start">
                                <div className="size-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mt-0.5 shrink-0">
                                    <div className="size-1.5 bg-emerald-500 rounded-full"></div>
                                </div>
                                <p className="text-slate-300 text-sm leading-relaxed">{principle}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <p className="text-center text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">
                Última Actualización Metodológica: {CLINICAL_BASIS.lastUpdate}
            </p>
        </div>
    );
};
