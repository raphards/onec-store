import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { 
  ShoppingBag, 
  Receipt, 
  BarChart3, 
  Package, 
  Download, 
  PlusCircle, 
  Plus,
  QrCode 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePix } from '../context/PixContext';

export const Layout: React.FC = () => {
  const { activeKey, openContingencyModal } = usePix();
  const location = useLocation();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  const navItems = [
    { to: '/', label: 'PDV', icon: ShoppingBag, color: 'text-emerald-600' },
    { to: '/cadastrar-produto', label: 'Cadastrar', icon: PlusCircle, color: 'text-emerald-600' },
    { to: '/vendas', label: 'Vendas', icon: Receipt, color: 'text-blue-600' },
    { to: '/dashboard', label: 'Dashboard', icon: BarChart3, color: 'text-violet-600' },
    { to: '/produtos', label: 'Produtos', icon: Package, color: 'text-amber-600' },
  ];

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans overflow-x-hidden">
      
      {/* Dynamic Watermark Background (Centered transparent logo in the middle of the screen) */}
      <div 
        aria-hidden="true" 
        className="fixed inset-0 flex items-center justify-center pointer-events-none select-none -z-10 overflow-hidden"
      >
        <img 
          src="/logo.png" 
          alt="Watermark Logo" 
          className="watermark-bg w-[85vw] max-w-[460px] object-contain opacity-[0.08] filter drop-shadow-sm"
        />
      </div>

      {/* Header (Hidden on mobile as requested, visible on desktop) */}
      <header className="hidden md:block sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200/80 shadow-xs px-4 py-3 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          
          {/* Logo & Brand */}
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-md shadow-emerald-500/20 text-white overflow-hidden p-1.5 transition-transform group-hover:scale-105">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain filter drop-shadow-sm" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 bg-clip-text text-transparent">
                  OneC Store
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  PDV
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Terminal Inteligente de Vendas</p>
            </div>
          </NavLink>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/70">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs shadow-slate-950/5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? item.color : 'text-slate-400'}`} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          {/* Header Action Tools */}
          <div className="flex items-center gap-2">
            {/* PIX Contingency Selector Button */}
            <button
              onClick={openContingencyModal}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/90 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:border-slate-300 active:scale-95 group cursor-pointer"
              title="Gerenciar Chaves PIX e Contingência"
            >
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                style={{ backgroundColor: activeKey.bankColor }}
              />
              <span className="text-slate-500 font-medium">PIX:</span>
              <span className="font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors">
                {activeKey.name}
              </span>
            </button>

            {/* Install PWA Button */}
            {isInstallable && (
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs shadow-emerald-600/30 transition-transform active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Instalar App</span>
              </button>
            )}

            {/* Online / Neon Database Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="hidden sm:inline">{isOnline ? 'Neon DB Ativo' : 'Offline'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Top Header Bar with PIX Contingency Button */}
      <div className="md:hidden flex items-center justify-between px-4 py-2.5 bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
        <NavLink to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain" />
          <span className="font-extrabold text-sm text-slate-900 tracking-tight">OneC Store</span>
        </NavLink>
        <button
          onClick={openContingencyModal}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 active:scale-95 transition-transform cursor-pointer"
          title="Chave PIX Ativa e Contingência"
        >
          <span
            className="w-2 h-2 rounded-full shrink-0 animate-pulse"
            style={{ backgroundColor: activeKey.bankColor }}
          />
          <span className="text-slate-500 font-medium">PIX:</span>
          <span className="text-emerald-700 font-black">{activeKey.name}</span>
        </button>
      </div>

      {/* Main Page Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 pb-28 md:pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-lg px-2 py-2 safe-area-pb">
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`relative flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all ${
                  isActive
                    ? 'text-slate-900 font-bold'
                    : 'text-slate-400 font-medium hover:text-slate-600'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileNavIndicator"
                    className="absolute inset-0 bg-slate-100 rounded-xl -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className={`w-4.5 h-4.5 mb-1 ${isActive ? item.color : 'text-slate-400'}`} />
                <span className="text-[10px] leading-none tracking-tight">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

    </div>
  );
};
