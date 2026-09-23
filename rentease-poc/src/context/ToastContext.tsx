import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

interface Toast {
  id: number;
  message: string;
  tone: 'ok' | 'error';
}

const Ctx = createContext<{ toast: (message: string, tone?: Toast['tone']) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const toast = useCallback((message: string, tone: Toast['tone'] = 'ok') => {
    setItems((prev) => [...prev, { id: Date.now() + Math.random(), message, tone }]);
  }, []);

  useEffect(() => {
    if (items.length === 0) return;
    const t = setTimeout(() => setItems((prev) => prev.slice(1)), 2600);
    return () => clearTimeout(t);
  }, [items]);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-5 left-1/2 z-[60] flex w-[min(92vw,380px)] -translate-x-1/2 flex-col gap-2"
        aria-live="polite"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={
              'rise rounded-[10px] px-4 py-3 text-sm font-medium shadow-[0_8px_24px_-8px_rgba(21,55,38,.4)] ' +
              (t.tone === 'ok' ? 'bg-green text-[#EEF3EC]' : 'bg-rented text-white')
            }
          >
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useToast must be used inside <ToastProvider>');
  return v.toast;
}
