import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cx } from '../../lib/format';

export function PageHead({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="display m-0 mb-1 text-[26px] font-bold sm:text-[29px]">{title}</h1>
        {subtitle && <p className="m-0 text-[14.5px] text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function SectionTitle({
  title,
  link,
  linkLabel,
  className,
}: {
  title: string;
  link?: string;
  linkLabel?: string;
  className?: string;
}) {
  return (
    <div className={cx('mt-[30px] mb-[15px] flex items-center justify-between gap-3 first:mt-0', className)}>
      <h2 className="display m-0 text-xl font-semibold">{title}</h2>
      {link && (
        <Link to={link} className="text-[13.5px] font-semibold text-green no-underline hover:underline">
          {linkLabel ?? 'See all'} →
        </Link>
      )}
    </div>
  );
}

export function StatCard({
  label,
  value,
  suffix,
  icon,
}: {
  label: string;
  value: ReactNode;
  suffix?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="card px-[18px] py-[17px]">
      <div className="mb-[9px] flex items-center gap-2 text-[12.5px] font-medium text-muted">
        <span className="text-green [&_svg]:h-4 [&_svg]:w-4">{icon}</span>
        {label}
      </div>
      <div className="display text-[27px] leading-none font-semibold">
        {value}
        {suffix && <small className="font-sans text-[15px] font-medium text-muted"> {suffix}</small>}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center">
      <svg viewBox="0 0 120 80" className="mb-1 h-16 w-24 opacity-45" aria-hidden>
        <rect x="4" y="4" width="112" height="72" rx="2" fill="none" stroke="#CBD8C6" strokeWidth="2.4" />
        <path d="M60 4v72M60 40h56" fill="none" stroke="#CBD8C6" strokeWidth="1.4" />
      </svg>
      <h3 className="display m-0 text-base font-semibold">{title}</h3>
      <p className="m-0 max-w-sm text-[13.5px] text-muted">{message}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12.5px] font-semibold text-muted">{label}</span>
      {children}
      {hint && <span className="text-[11.5px] text-muted">{hint}</span>}
    </label>
  );
}

export const inputClass =
  'w-full rounded-[10px] border border-line bg-[#F7F9F5] px-3 py-2.5 text-sm text-ink outline-none placeholder:text-muted/70 focus:border-green-line focus:bg-panel';

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p className="m-0 rounded-[10px] border border-[#E6C3AB] bg-rented-soft px-3 py-2 text-[13px] font-medium text-rented">
      {children}
    </p>
  );
}
