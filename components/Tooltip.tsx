import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={tooltipRef}>
      <div
        onClick={() => setIsVisible(!isVisible)}
        className="cursor-help flex items-center"
      >
        {children}
      </div>
      {isVisible && (
        <div className="fixed sm:absolute bottom-20 sm:bottom-full left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 mb-2 sm:w-max sm:max-w-[200px] p-4 border border-slate-700 bg-slate-800 text-white text-[11px] font-medium rounded-2xl shadow-2xl z-[100] animate-in fade-in slide-in-from-bottom-2 duration-200">
          <p className="leading-relaxed text-center break-words">{content}</p>
          <div className="hidden sm:block absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
        </div>
      )}
    </div>
  );
};
