
import React, { useState } from 'react';
import { useGlobalState } from '../context/GlobalState';
import { auth } from '../services/firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

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
    } catch (error: any) {
      console.error("Auth error:", error);
      setErrorMsg(error.message || 'Error de autenticación');
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Google Auth error:", error);
      setErrorMsg(error.message || 'Error al conectar con Google');
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

          <div className="flex items-center gap-4 py-2">
            <div className="h-px bg-white/20 flex-1"></div>
            <span className="text-[9px] text-white/50 font-black uppercase">O</span>
            <div className="h-px bg-white/20 flex-1"></div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            type="button"
            className="w-full py-4 px-6 bg-[#eb4335] text-white font-black uppercase tracking-widest rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 border border-red-400"
          >
            {/* Usando SVG en lugar de clase Material Symbols por si no está la de google */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
            </svg>
            Continuar con Google
          </button>
        </div>

        <p className="text-center text-[10px] text-white/30 font-bold uppercase tracking-widest px-8">
          Al continuar, aceptas que NutriTico IA procese tus datos biométricos para optimizar tu salud.
        </p>
      </div>
    </div>
  );
};
