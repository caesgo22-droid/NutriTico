
import React, { useState } from 'react';
import { useGlobalState } from '../context/GlobalState';
import { auth } from '../services/firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

export const Auth: React.FC = () => {
  const { actions } = useGlobalState();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      actions.login(email);
    } catch (error: any) {
      console.error("Auth error:", error);
      setErrorMsg(error.message || 'Error de autenticación');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Circles */}
      <div className="absolute top-[-10%] right-[-10%] size-64 bg-accent-lime/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-5%] left-[-5%] size-80 bg-white/5 rounded-full blur-3xl"></div>

      <div className="w-full max-w-sm space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <div className="size-20 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl">
            <span className="material-symbols-outlined text-4xl text-white">nutrition</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">NutriTico IA</h1>
          <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em]">Sport & Health Edition</p>
        </div>

        <div className="bg-white/10 backdrop-blur-2xl border border-white/10 p-8 rounded-[3rem] shadow-2xl space-y-6">
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${isLogin ? 'bg-white text-primary shadow-lg' : 'text-white/40'}`}
            >
              Entrar
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${!isLogin ? 'bg-white text-primary shadow-lg' : 'text-white/40'}`}
            >
              Registro
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-[10px] p-3 rounded-xl font-bold text-center">
                {errorMsg}
              </div>
            )}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-white/50 uppercase ml-3">Correo Electrónico</label>
              <input
                required
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-white/30 transition-all text-sm font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-white/50 uppercase ml-3">Contraseña</label>
              <input
                required
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-white/30 transition-all text-sm font-medium"
              />
            </div>
            <button
              disabled={loading}
              className="w-full py-5 bg-white text-primary font-black uppercase tracking-widest rounded-2xl shadow-xl active:scale-95 transition-all mt-4 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin">sync</span>
              ) : (
                isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-white/30 font-bold uppercase tracking-widest px-8">
          Al continuar, aceptas que NutriTico IA procese tus datos biométricos para optimizar tu salud.
        </p>
      </div>
    </div>
  );
};
