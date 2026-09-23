import { useEffect, useRef, type ReactNode } from 'react';
import { IconClose } from '../icons';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, title, onClose, children, footer }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    // Move focus into the dialog so Escape and Tab behave.
    panelRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-green-deep/45 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="card rise w-full max-w-md overflow-hidden outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h2 className="display m-0 text-[17px] font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-muted hover:bg-green-soft hover:text-green"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-5 text-sm">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}

/** The mock "Payment successful" confirmation used across the money flows. */
export function SuccessModal({
  open,
  title,
  message,
  onClose,
  actions,
}: {
  open: boolean;
  title: string;
  message: ReactNode;
  onClose: () => void;
  actions?: ReactNode;
}) {
  return (
    <Modal open={open} title={title} onClose={onClose} footer={actions}>
      <div className="flex items-start gap-4">
        <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-green-soft text-green">
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
            <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <div className="text-[14.5px] leading-relaxed text-ink">{message}</div>
      </div>
      <p className="mt-4 mb-0 rounded-[10px] bg-[#F3F6F1] px-3 py-2 text-xs text-muted">
        This is a proof of concept — no real money moved and no gateway was called.
      </p>
    </Modal>
  );
}
