import React, { useState } from 'react';
import { auth } from '../services/firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { Shield, Sparkles, UserPlus, LogIn } from 'lucide-react';

export const Auth: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (isLogin) await signInWithEmailAndPassword(auth, email, password);
            else await createUserWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGuest = async () => {
        setLoading(true);
        try { await signInAnonymously(auth); }
        catch (err: any) { setError(err.message); }
        finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_30%,#065f46_0%,transparent_50%)] opacity-30"></div>

            <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl rounded-[3rem] p-10 border border-white/10 shadow-2xl relative z-10 space-y-8 animate-in fade-in zoom-in duration-700">
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center justify-center size-20 bg-emerald-500 text-white rounded-[2rem] shadow-xl shadow-emerald-500/20 mb-4 animate-bounce duration-[3000ms]">
                        <Sparkles size={40} fill="currentColor" />
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight">NutriTico <span className="text-emerald-400">IA</span></h1>
                    <p className="text-slate-400 font-medium">Nutrición Clínica con Inteligencia Artificial</p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Correo Electrónico"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-slate-500 outline-none focus:border-emerald-500 transition-all font-medium"
                    />
                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-slate-500 outline-none focus:border-emerald-500 transition-all font-medium"
                    />

                    {error && <p className="text-red-400 text-xs font-bold px-2">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-600 text-white font-bold py-5 rounded-3xl shadow-xl shadow-emerald-900/40 hover:bg-emerald-500 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                        {loading ? 'Procesando...' : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')}
                    </button>
                </form>

                <div className="pt-4 border-t border-white/5 space-y-4">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="w-full text-emerald-400 text-sm font-bold hover:text-emerald-300 transition-colors"
                    >
                        {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
                    </button>

                    <button
                        onClick={handleGuest}
                        className="w-full flex items-center justify-center gap-2 text-slate-500 text-xs font-black uppercase tracking-widest hover:text-white transition-colors"
                    >
                        <Shield size={14} />
                        Continuar como Invitado
                    </button>
                </div>
            </div>
        </div>
    );
};
