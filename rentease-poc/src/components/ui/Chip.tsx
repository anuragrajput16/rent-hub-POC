import type { ReactNode } from 'react';
import { cx } from '../../lib/format';
import { IconCheck } from '../icons';

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        'rounded-lg border border-green-line bg-green-soft px-[9px] py-1 text-xs font-semibold text-green',
        className,
      )}
    >
      {children}
    </span>
  );
}

type StatusTone = 'ok' | 'wait' | 'rented' | 'muted';

const TONES: Record<StatusTone, string> = {
  ok: 'bg-green-soft text-green border-green-line',
  wait: 'bg-honey-soft text-honey border-[#EBCF9C]',
  rented: 'bg-rented-soft text-rented border-[#E6C3AB]',
  muted: 'bg-[#F1F4EF] text-muted border-line',
};

export function StatusPill({ tone, children }: { tone: StatusTone; children: ReactNode }) {
  return (
    <span
      className={cx(
        'inline-block whitespace-nowrap rounded-full border px-[11px] py-1 text-xs font-semibold',
        TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

export function VerifiedBadge({ label = 'Verified' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-green-line bg-green-soft px-[11px] py-1 align-middle text-[12.5px] font-semibold text-green">
      <IconCheck className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

export function Avatar({ initials, size = 38 }: { initials: string; size?: number }) {
  return (
    <span
      className="display grid flex-none place-items-center rounded-full bg-honey-soft font-bold text-green-deep"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </span>
  );
}
