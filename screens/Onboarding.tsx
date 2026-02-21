import React, { useState } from 'react';
import { useGlobalState } from '../context/GlobalState';

export const Onboarding: React.FC = () => {
  const { state, actions } = useGlobalState();
  const [step, setStep] = useState(1);
  const [localProfile, setLocalProfile] = useState(state.profile);

  const toggleCondition = (cond: string) => {
    setLocalProfile(prev => {
        const current = prev.medicalConditions || [];
        if (current.includes(cond)) return { ...prev, medicalConditions: current.filter(c => c !== cond) };
        return { ...prev, medicalConditions: [...current, cond] };
    });
  };

  const handleFinish = () => {
      actions.updateProfile(localProfile);
      actions.logWeight(localProfile.weight);
      actions.completeOnboarding();
  };

  return (
    <div className="min-h-screen bg-background-light flex flex-col items-center pb-24">
      <div className="w-full bg-white p-4 flex items-center justify-between border-b border-primary/10 sticky top-0 z-10">
        <button onClick={() => step > 1 && setStep(step - 1)} className={`text-primary p-2 rounded-full ${step === 1 ? 'invisible' : ''}`}><span className="material-symbols-outlined">arrow_back</span></button>
        <h1 className="text-primary text-lg font-black uppercase tracking-widest">NutriTico IA</h1>
        <div className="w-10"></div>
      </div>

      <div className="w-full max-w-md p-6 space-y-8">
          {step === 1 ? (
              <div className="space-y-6">
                  <div className="space-y-2 text-center">
                    <h2 className="text-2xl font-black text-primary">Perfil Biométrico</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase">Bases científicas de tu metabolismo</p>
                  </div>
                  <div className="space-y-4">
                      <input type="text" placeholder="Tu Nombre" value={localProfile.name} onChange={e => setLocalProfile({...localProfile, name: e.target.value})} className="w-full p-5 bg-white rounded-2xl border border-primary/5 shadow-sm font-bold text-primary outline-none focus:border-primary" />
                      <div className="grid grid-cols-2 gap-4">
                          <input type="number" placeholder="Peso (kg)" value={localProfile.weight || ''} onChange={e => setLocalProfile({...localProfile, weight: parseFloat(e.target.value)})} className="w-full p-5 bg-white rounded-2xl border border-primary/5 shadow-sm font-bold text-primary" />
                          <input type="number" placeholder="Estatura (cm)" value={localProfile.height || ''} onChange={e => setLocalProfile({...localProfile, height: parseFloat(e.target.value)})} className="w-full p-5 bg-white rounded-2xl border border-primary/5 shadow-sm font-bold text-primary" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-2">% Grasa Corporal (Si lo conoces)</label>
                          <input type="number" placeholder="Ej: 15%" value={localProfile.bodyFat || ''} onChange={e => setLocalProfile({...localProfile, bodyFat: parseFloat(e.target.value)})} className="w-full p-5 bg-white rounded-2xl border border-primary/5 shadow-sm font-bold text-primary" />
                      </div>
                  </div>
              </div>
          ) : (
              <div className="space-y-6">
                  <div className="space-y-2 text-center">
                    <h2 className="text-2xl font-black text-primary">Seguridad Médica</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase">Personalización por salud clínica</p>
                  </div>
                  <div className="space-y-3">
                      {['Diabetes', 'Hipertensión', 'Afección Renal', 'Ninguna'].map(c => (
                          <button 
                            key={c}
                            onClick={() => toggleCondition(c.toLowerCase())}
                            className={`w-full p-5 rounded-2xl font-bold flex items-center justify-between transition-all border-2 ${localProfile.medicalConditions.includes(c.toLowerCase()) ? 'bg-primary/5 border-primary text-primary' : 'bg-white border-primary/5 text-slate-400'}`}
                          >
                            {c}
                            <span className="material-symbols-outlined">{localProfile.medicalConditions.includes(c.toLowerCase()) ? 'check_circle' : 'circle'}</span>
                          </button>
                      ))}
                  </div>
              </div>
          )}
      </div>

      <div className="fixed bottom-0 w-full max-w-md p-6 bg-background-light/80 backdrop-blur">
          <button 
            onClick={() => step === 1 ? setStep(2) : handleFinish()}
            className="w-full py-5 bg-primary text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 active:scale-95 transition-all"
          >
              {step === 1 ? 'Siguiente' : 'Comenzar Plan'}
          </button>
      </div>
    </div>
  );
};