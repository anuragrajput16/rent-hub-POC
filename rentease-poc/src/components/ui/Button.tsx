import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cx } from '../../lib/format';

type Variant = 'primary' | 'honey' | 'ghost' | 'onDark';
type Size = 'md' | 'sm';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-green text-[#F2F7F0] hover:brightness-112',
  honey: 'bg-honey text-[#2A1B04] hover:brightness-105',
  ghost: 'bg-panel text-green border border-green-line hover:bg-green-soft',
  onDark:
    'bg-white/10 text-[#EAF2E7] border border-white/25 hover:bg-white/20',
};

const SIZES: Record<Size, string> = {
  md: 'px-[18px] py-[11px] text-sm rounded-[10px]',
  sm: 'px-[13px] py-2 text-[13px] rounded-[9px]',
};

const BASE =
  'inline-flex items-center justify-center gap-[9px] font-semibold cursor-pointer border-0 transition-[filter,background-color] disabled:opacity-55 disabled:cursor-not-allowed [&_svg]:h-[17px] [&_svg]:w-[17px] [&_svg]:flex-none';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  children?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  block,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(BASE, VARIANTS[variant], SIZES[size], block && 'w-full', className)}
      {...rest}
    />
  );
}

interface LinkButtonProps {
  to: string;
  variant?: Variant;
  size?: Size;
  block?: boolean;
  className?: string;
  children?: ReactNode;
  state?: unknown;
}

export function LinkButton({
  to,
  variant = 'primary',
  size = 'md',
  block,
  className,
  state,
  children,
}: LinkButtonProps) {
  return (
    <Link
      to={to}
      state={state as never}
      className={cx(
        BASE,
        'no-underline',
        VARIANTS[variant],
        SIZES[size],
        block && 'w-full',
        className,
      )}
    >
      {children}
    </Link>
  );
}
