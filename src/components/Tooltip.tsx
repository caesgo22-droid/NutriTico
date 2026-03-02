import React from 'react';
import { Info } from 'lucide-react';

interface Props {
    text: string;
    children?: React.ReactNode;
}

export const Tooltip: React.FC<Props> = ({ text, children }) => {
    return (
        <div className="group relative inline-flex items-center justify-center">
            {children || <Info size={14} className="text-slate-500 group-hover:text-emerald-400 cursor-help transition-all" />}
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-56 p-3 bg-[#1e293b] text-slate-200 text-[10px] rounded-xl shadow-2xl shadow-emerald-500/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[100] border border-white/10 text-left leading-relaxed font-medium normal-case tracking-normal">
                {text}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-[#1e293b]"></div>
            </div>
        </div>
    );
};
