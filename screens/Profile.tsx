import React, { useState } from 'react';
import { useGlobalState } from '../context/GlobalState';
import { UserProfile } from '../types';

export const Profile: React.FC = () => {
  const { state, actions } = useGlobalState();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<UserProfile>({ ...state.profile });

  const handleSave = () => {
      actions.updateProfile(editData);
      setIsEditing(false);
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 bg-background-light no-scrollbar">
      <div className="bg-primary pt-14 pb-20 px-6 rounded-b-[4rem] text-center space-y-4 shadow-xl shadow-primary/20">
          <div className="size-28 bg-white/10 border-4 border-white/20 rounded-full flex items-center justify-center mx-auto text-4xl font-black text-white shadow-2xl">
              {state.profile.name[0]}
          </div>
          <h1 className="text-3xl font-black text-white">{state.profile.name}</h1>
          <p className="text-white/60 text-sm font-bold uppercase tracking-[0.2em]">Socio NutriTico IA • Elite</p>
      </div>

      <div className="px-4 -mt-10 space-y-6 max-w-lg mx-auto">
          {isEditing ? (
              <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-primary/5 space-y-6 animate-in slide-in-from-bottom duration-300">
                  <h3 className="text-xs font-bold text-primary uppercase tracking-widest text-center">Editar Perfil Clínico</h3>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Nombre</label>
                          <input type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-primary outline-none focus:border-primary" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Edad</label>
                          <input type="number" value={editData.age} onChange={e => setEditData({...editData, age: parseInt(e.target.value)})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-primary outline-none focus:border-primary" />
                      </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Peso (kg)</label>
                          <input type="number" value={editData.weight} onChange={e => setEditData({...editData, weight: parseFloat(e.target.value)})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-primary outline-none focus:border-primary" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">% Grasa (Opcional)</label>
                          <input type="number" value={editData.bodyFat || ''} placeholder="Katch-McArdle" onChange={e => setEditData({...editData, bodyFat: parseFloat(e.target.value)})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-primary outline-none focus:border-primary" />
                      </div>
                  </div>
                  <button onClick={handleSave} className="w-full py-5 bg-primary text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all">Guardar Cambios</button>
                  <button onClick={() => setIsEditing(false)} className="w-full text-slate-400 text-xs font-bold uppercase text-center py-2">Cancelar</button>
              </div>
          ) : (
              <div className="space-y-4">
                  <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-primary/5 flex justify-around text-center">
                      <div><p className="text-[10px] font-bold text-slate-400 uppercase">Peso</p><p className="text-2xl font-black text-primary">{state.profile.weight}kg</p></div>
                      <div className="w-px bg-slate-50"></div>
                      <div><p className="text-[10px] font-bold text-slate-400 uppercase">BMI</p><p className="text-2xl font-black text-primary">{(state.profile.weight / (state.profile.height/100)**2).toFixed(1)}</p></div>
                  </div>
                  <button onClick={() => setIsEditing(true)} className="w-full p-5 bg-white rounded-3xl border border-primary/5 shadow-sm font-bold text-primary flex items-center justify-center gap-3 active:scale-95 transition-all">
                      <span className="material-symbols-outlined">edit_square</span>
                      Editar Información Metabólica
                  </button>
                  <button onClick={actions.resetApp} className="w-full p-5 bg-red-50 text-red-500 rounded-3xl font-bold flex items-center justify-center gap-3 hover:bg-red-100 transition-all">
                      <span className="material-symbols-outlined">logout</span>
                      Cerrar Sesión / Reiniciar App
                  </button>
              </div>
          )}
      </div>
    </div>
  );
};