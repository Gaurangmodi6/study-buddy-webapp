import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'info' | 'error';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isWarning = toast.type === 'warning';
          const isError = toast.type === 'error';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto p-4 rounded-xl border flex items-center justify-between shadow-2xl backdrop-blur-md transition-all animate-in slide-in-from-bottom-3 ${
                isSuccess
                  ? 'bg-[#1C120A]/95 border-[#D4A017]/40 text-[#F5E6C8]'
                  : isWarning
                  ? 'bg-amber-950/90 border-amber-500/50 text-amber-200'
                  : isError
                  ? 'bg-red-950/90 border-red-500/50 text-red-200'
                  : 'bg-[#1C120A]/95 border-[#4DA3FF]/40 text-[#F5E6C8]'
              }`}
            >
              <div className="flex items-center space-x-3">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-[#FFB84D] shrink-0" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />}
                {isError && <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />}
                {!isSuccess && !isWarning && !isError && (
                  <Info className="w-5 h-5 text-[#4DA3FF] shrink-0" />
                )}
                <span className="text-xs font-medium">{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-3 p-1 rounded hover:bg-white/10 text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
