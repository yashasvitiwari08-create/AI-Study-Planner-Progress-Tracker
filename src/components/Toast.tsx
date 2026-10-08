import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { ToastItem } from '../types';

interface ToastProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 p-4 rounded-xl bg-white border border-[#E5E7EB] vibrant-shadow-lg transition-all duration-200 text-[#0F172A]"
          >
            <div className="mt-0.5 shrink-0">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-[#10B981]" />}
              {isError && <AlertCircle className="w-5 h-5 text-[#EF4444]" />}
              {isWarning && <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />}
              {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-[#7C3AED]" />}
            </div>
            <div className="flex-1 text-xs font-semibold leading-relaxed text-[#0F172A]">{toast.message}</div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-[#64748B] hover:text-[#0F172A] transition-colors p-0.5 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
