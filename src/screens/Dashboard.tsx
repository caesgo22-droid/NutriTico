import React, { useState } from 'react';
import { useGlobalState } from '../context/GlobalState';
import { Calendar as CalendarIcon, Utensils, MessageSquare, PlusSquare, User, Search, TrendingUp, ChevronRight, Activity, Send, BookOpen } from 'lucide-react';
import { PantryScanner } from '../components/PantryScanner';
import { PlanViewer } from '../components/PlanViewer';
import { EquiposDirectorio } from '../components/EquiposDirectorio';
import { Methodology } from '../components/Methodology';
import { BiometricScanner } from '../components/BiometricScanner';

export const Dashboard: React.FC = () => {
    const { state, dispatch } = useGlobalState();
    const [activeTab, setActiveTab] = useState('chat');
    const [showMethodology, setShowMethodology] = useState(false);
    const [showBiometrics, setShowBiometrics] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [isAiTyping, setIsAiTyping] = useState(false);

    const handleSendMessage = async () => {
        if (!chatInput.trim() || isAiTyping) return;

        const q = chatInput;
        setChatInput('');
        dispatch({ type: 'ADD_CHAT_MESSAGE', payload: { role: 'user', text: q } });
        setIsAiTyping(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userQuery: q,
                    stateString: JSON.stringify({
                        profile: state.profile,
                        targets: state.calculatedTargets,
                        planLength: Object.keys(state.weeklyPlan).length,
                        pantry: state.pantry,
                        recentContext: state.chatHistory.slice(-3) // Send last 3 messages for continuity
                    })
                })
            });

            if (!res.ok) throw new Error("API Falla");
            const data = await res.json();

            // Render Response
            dispatch({ type: 'ADD_CHAT_MESSAGE', payload: { role: 'ai', text: data.responseText } });

            // Apply Plan Updates from Schema
            if (data.actions && data.actions.length > 0) {
                dispatch({ type: 'APPLY_PLAN_UPDATE', payload: data.actions });
            }
        } catch (e) {
            dispatch({ type: 'ADD_CHAT_MESSAGE', payload: { role: 'ai', text: 'Lo siento, hubo un error de conexión con el Cerebro.' } });
        } finally {
            setIsAiTyping(false);
        }
    };

    const navItems = [
        { id: 'chat', label: 'IA Chat', icon: MessageSquare },
        { id: 'plan', label: 'Mi Plan', icon: CalendarIcon },
        { id: 'scanner', label: 'Escanear', icon: PlusSquare },
        { id: 'equivalents', label: 'Equipos', icon: Search },
        { id: 'profile', label: 'Perfil', icon: User }
    ];

    return (
        <div className="min-h-screen bg-[#060b14] text-slate-200 flex flex-col selection:bg-emerald-500/30">
            {/* Animated Header */}
            <div className="p-6 md:p-8 flex items-center justify-between border-b border-white/5 bg-white/[0.02] backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="size-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Activity size={20} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black uppercase tracking-tight text-white leading-none">NutriTico <span className="text-emerald-500">v3</span></h1>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1 block">Dashboard Principal</span>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-full pl-4 pr-1 py-1">
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Calorías Hoy</span>
                        <span className="text-xs font-black text-white">{state.calculatedTargets.calories} kcal</span>
                    </div>
                    <div className="size-8 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] font-black text-white">
                        {Math.round((1200 / state.calculatedTargets.calories) * 100)}%
                    </div>
                </div>
            </div>

            <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-8">
                {/* Stats Summary Area */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Proteína', val: state.calculatedTargets.protein, unit: 'g', color: 'bg-emerald-500' },
                        { label: 'Carbos', val: state.calculatedTargets.carbs, unit: 'g', color: 'bg-blue-500' },
                        { label: 'Grasas', val: state.calculatedTargets.fat, unit: 'g', color: 'bg-amber-500' },
                        { label: 'Agua', val: 2.5, unit: 'L', color: 'bg-indigo-500' }
                    ].map(stat => (
                        <div key={stat.label} className="bg-white/5 border border-white/10 p-5 rounded-3xl relative overflow-hidden group hover:bg-white/[0.07] transition-all">
                            <div className={`absolute top-0 left-0 w-1 h-full ${stat.color}`}></div>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">{stat.label}</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-white tracking-tighter">{stat.val}</span>
                                <span className="text-[10px] font-bold text-slate-600">{stat.unit}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Area Conditional Rendering */}
                <div>
                    {activeTab === 'plan' && <PlanViewer />}
                    {activeTab === 'scanner' && <PantryScanner />}
                    {activeTab === 'equivalents' && <EquiposDirectorio />}
                    {activeTab === 'profile' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {showBiometrics ? (
                                <BiometricScanner onBack={() => setShowBiometrics(false)} />
                            ) : showMethodology ? (
                                <div>
                                    <button
                                        onClick={() => setShowMethodology(false)}
                                        className="mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all"
                                    >
                                        <ChevronRight className="rotate-180" size={14} />
                                        Volver al Perfil
                                    </button>
                                    <Methodology />
                                </div>
                            ) : (
                                <div className="space-y-8 max-w-2xl mx-auto">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="size-24 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-emerald-500/20 mb-6">
                                            <User size={48} />
                                        </div>
                                        <h2 className="text-3xl font-black text-white">{state.profile.name}</h2>
                                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Usuario v3 Premium</p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <div
                                            onClick={() => setShowBiometrics(true)}
                                            className="bg-white/5 border border-white/10 p-6 rounded-[2rem] flex items-center justify-between group hover:bg-white/[0.08] transition-all cursor-pointer"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="size-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400">
                                                    <Activity size={20} />
                                                </div>
                                                <div>
                                                    <span className="block text-white font-black uppercase text-xs tracking-widest">Datos Biométricos</span>
                                                    <span className="text-[10px] text-slate-500">{state.profile.weight}kg • {state.profile.height}cm • {state.profile.goal}</span>
                                                </div>
                                            </div>
                                            <ChevronRight className="text-slate-600 group-hover:text-emerald-500 transition-all" />
                                        </div>

                                        <button
                                            onClick={() => setShowMethodology(true)}
                                            className="bg-white/5 border border-white/10 p-6 rounded-[2rem] flex items-center justify-between group hover:bg-white/[0.08] transition-all text-left"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="size-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                                                    <BookOpen size={20} />
                                                </div>
                                                <div>
                                                    <span className="block text-white font-black uppercase text-xs tracking-widest">Bases Clínicas y Fundamentos</span>
                                                    <span className="text-[10px] text-slate-500">Justificación científica de la IA NutriTico</span>
                                                </div>
                                            </div>
                                            <ChevronRight className="text-slate-600 group-hover:text-emerald-500 transition-all" />
                                        </button>

                                        <div className="pt-4">
                                            <button className="w-full bg-red-500/10 border border-red-500/20 text-red-500 font-black uppercase tracking-widest text-[10px] py-4 rounded-2xl hover:bg-red-500/20 transition-all">
                                                Cerrar Sesión (v3)
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'chat' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Chat Area */}
                            <div className="lg:col-span-8 flex flex-col h-[600px] bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden">
                                <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 bg-white/5 rounded-lg flex items-center justify-center text-emerald-500">
                                            <MessageSquare size={18} />
                                        </div>
                                        <h2 className="font-black uppercase text-xs tracking-widest text-white">Consultorio IA</h2>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{isAiTyping ? 'Pensando...' : 'En Línea'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 p-6 overflow-y-auto space-y-6">
                                    {state.chatHistory.map((msg, i) => (
                                        <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                            <div className={`size-10 rounded-2xl flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-500' : 'bg-emerald-500'}`}>
                                                {msg.role === 'user' ? <User className="text-white" size={20} /> : <Activity className="text-white" size={20} />}
                                            </div>
                                            <div className={`border p-5 rounded-3xl max-w-[85%] ${msg.role === 'user' ? 'bg-blue-500/10 border-blue-500/20 rounded-tr-none' : 'bg-white/5 border-white/10 rounded-tl-none'}`}>
                                                <p className="text-sm text-slate-300 leading-relaxed font-medium">
                                                    {msg.text}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {isAiTyping && (
                                        <div className="flex gap-4">
                                            <div className="size-10 rounded-2xl bg-emerald-500 flex items-center justify-center shrink-0">
                                                <Activity className="text-white" size={20} />
                                            </div>
                                            <div className="bg-white/5 border border-white/10 p-5 rounded-3xl rounded-tl-none">
                                                <div className="flex gap-1">
                                                    <div className="size-2 bg-emerald-500 rounded-full animate-bounce"></div>
                                                    <div className="size-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                                    <div className="size-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 bg-white/[0.01]">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={chatInput}
                                            onChange={e => setChatInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                            disabled={isAiTyping}
                                            placeholder="Ej. Quítame el pan y ponme avena..."
                                            className="w-full bg-white/5 border border-white/10 rounded-[2rem] pl-6 pr-14 py-5 outline-none focus:border-emerald-500/50 focus:bg-white/[0.08] transition-all font-semibold text-white placeholder:text-slate-600 disabled:opacity-50"
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={isAiTyping || !chatInput.trim()}
                                            className="absolute right-3 top-3 size-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 transition-all active:scale-90 disabled:opacity-50 disabled:active:scale-100"
                                        >
                                            <Send size={18} className="translate-x-[1px]" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Desktop Sidebar Area */}
                            <div className="lg:col-span-4 space-y-6">
                                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 overflow-hidden relative group">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all group-hover:scale-110">
                                        <TrendingUp size={120} />
                                    </div>
                                    <h3 className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-500 mb-6">Estado de Ayuno</h3>
                                    <div className="space-y-4 relative z-10">
                                        <div className="flex justify-between items-end">
                                            <span className="text-3xl font-black text-white tracking-tighter">14<span className="text-slate-500 text-lg">h</span> 22<span className="text-slate-500 text-lg">m</span></span>
                                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-md">Ventana Abierta</span>
                                        </div>
                                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 w-[70%] shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 hover:bg-white/[0.07] transition-all cursor-pointer" onClick={() => setActiveTab('plan')}>
                                    <h3 className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-500 mb-6 flex justify-between items-center">
                                        Mi Plan Actual <ChevronRight size={14} />
                                    </h3>
                                    <div className="flex gap-4">
                                        <div className="size-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-emerald-500">
                                            <Utensils size={20} />
                                        </div>
                                        <div>
                                            <span className="block text-white font-black uppercase text-xs tracking-widest">
                                                {Object.keys(state.weeklyPlan[new Date().getDay()] || {}).length > 0 ? 'Plan Generado' : 'Sin Plan'}
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-medium italic">Click para ver detalle</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Mobile Bottom Nav */}
            <nav className="fixed bottom-0 left-0 w-full bg-[#060b14]/80 backdrop-blur-xl border-t border-white/5 pb-8 pt-4 px-4 flex justify-between items-center z-[100] md:hidden">
                {navItems.map(item => {
                    const Icon = item.icon;
                    const active = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-emerald-500' : 'text-slate-600'}`}
                        >
                            <div className={`p-2 rounded-xl transition-all ${active ? 'bg-emerald-500/10' : ''}`}>
                                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};
