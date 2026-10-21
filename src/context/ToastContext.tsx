import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'success', title?: string, duration: number = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      {/* Toast Notification Container */}
      <div 
        aria-live="polite" 
        className="fixed top-4 inset-x-4 sm:left-auto sm:right-4 max-w-sm mx-auto sm:mx-0 z-[9999] pointer-events-none flex flex-col gap-2.5"
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const isSuccess = toast.type === 'success';
            const isError = toast.type === 'error';
            const isWarning = toast.type === 'warning';

            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: -25, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className={`pointer-events-auto w-full p-4 rounded-2xl shadow-2xl border backdrop-blur-md flex items-start gap-3.5 transition-all ${
                  isSuccess
                    ? 'bg-slate-900/95 text-white border-emerald-500/40 shadow-emerald-950/20'
                    : isError
                    ? 'bg-rose-950/95 text-white border-rose-500/50 shadow-rose-950/30'
                    : isWarning
                    ? 'bg-amber-950/95 text-white border-amber-500/50 shadow-amber-950/30'
                    : 'bg-slate-900/95 text-white border-cyan-500/40'
                }`}
              >
                {/* Type Icon */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isSuccess
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : isError
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : isWarning
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  }`}
                >
                  {isSuccess && <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />}
                  {isError && <AlertCircle className="w-5 h-5 stroke-[2.5]" />}
                  {isWarning && <AlertTriangle className="w-5 h-5 stroke-[2.5]" />}
                  {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 stroke-[2.5]" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-1">
                  {toast.title && (
                    <h5 className="font-extrabold text-sm text-white leading-snug tracking-tight mb-0.5">
                      {toast.title}
                    </h5>
                  )}
                  <p className="text-xs text-slate-200/90 font-medium leading-relaxed break-words">
                    {toast.message}
                  </p>
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="w-6 h-6 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
