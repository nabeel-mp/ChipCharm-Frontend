import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ToastContext = createContext(null);

const ICONS = {
  success: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  error: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
  warning: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  info: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
};

const STYLES = {
  success: {
    bg:      'bg-[#0d2b1e] border border-[#40916c]',
    icon_bg: 'bg-[#40916c]/20 text-[#95d5b2]',
    bar:     'bg-[#52b788]',
    title:   'text-[#95d5b2]',
  },
  error: {
    bg:      'bg-[#2b0d0d] border border-[#c0392b]',
    icon_bg: 'bg-red-900/30 text-red-400',
    bar:     'bg-red-500',
    title:   'text-red-400',
  },
  warning: {
    bg:      'bg-[#2b220d] border border-[#f4c430]',
    icon_bg: 'bg-yellow-900/30 text-[#f4c430]',
    bar:     'bg-[#f4c430]',
    title:   'text-[#f4c430]',
  },
  info: {
    bg:      'bg-[#0d1f2b] border border-[#3b82f6]',
    icon_bg: 'bg-blue-900/30 text-blue-400',
    bar:     'bg-blue-500',
    title:   'text-blue-400',
  },
};

function ToastItem({ toast, onRemove }) {
  const [exiting, setExiting] = useState(false);
  const s = STYLES[toast.type] || STYLES.info;

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  }, [toast.id, onRemove]);

  useEffect(() => {
    const t = setTimeout(dismiss, toast.duration || 4000);
    return () => clearTimeout(t);
  }, [dismiss, toast.duration]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl shadow-2xl w-80 pointer-events-auto
                  ${s.bg} ${exiting ? 'toast-exit' : 'toast-enter'}`}
      style={{ backdropFilter: 'blur(12px)' }}
    >
      <div className="flex items-start gap-3 p-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.icon_bg}`}>
          {ICONS[toast.type]}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <p className={`text-sm font-semibold font-display ${s.title}`}>{toast.title}</p>
          {toast.message && (
            <p className="text-xs text-[#7fb89a] mt-0.5 leading-relaxed">{toast.message}</p>
          )}
        </div>
        <button
          onClick={dismiss}
          className="text-[#7fb89a] hover:text-white transition-colors flex-shrink-0 mt-0.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
        <div
          className={`h-full ${s.bar} toast-bar`}
          style={{ animationDuration: `${toast.duration || 4000}ms` }}
        />
      </div>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((type, title, message, duration) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, title, message, duration }]);
  }, []);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const api = {
    success: (title, msg, dur) => toast('success', title, msg, dur),
    error:   (title, msg, dur) => toast('error',   title, msg, dur),
    warning: (title, msg, dur) => toast('warning', title, msg, dur),
    info:    (title, msg, dur) => toast('info',    title, msg, dur),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onRemove={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);