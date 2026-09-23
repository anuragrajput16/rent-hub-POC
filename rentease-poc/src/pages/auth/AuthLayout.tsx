import type { ReactNode } from 'react';
import { FloorPlan } from '../../components/FloorPlan';
import { BrandMark } from '../../components/icons';

/** Split screen: the pitch on green, the form on canvas. */
export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden overflow-hidden bg-[linear-gradient(150deg,#1E4634_0%,#153726_100%)] p-12 text-[#EAF2E7] lg:flex lg:flex-col">
        <div className="display flex items-center gap-3 text-[22px] font-bold">
          <BrandMark className="h-9 w-9" />
          Rent<b className="text-honey">Ease</b>
        </div>

        <div className="mt-auto max-w-md">
          <h2 className="display m-0 mb-4 text-[34px] leading-tight font-bold">
            Rent a home, furnish it, live in it.
          </h2>
          <p className="m-0 text-[15px] leading-relaxed text-[#B9CDB6]">
            Verified owners, verified renters, and every floor plan drawn to scale — so the bed you
            order actually fits the room.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-4 gap-3" aria-hidden>
          {(['1 RK', '1 BHK', '2 BHK', '3 BHK'] as const).map((t) => (
            <div key={t} className="rounded-xl border border-honey/30 bg-white/5 p-2.5">
              <FloorPlan type={t} tone="light" labels={false} className="h-12 w-full" />
              <p className="m-0 mt-2 text-center text-[11px] font-semibold text-[#B9CDB6]">{t}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[400px]">
          <div className="display mb-8 flex items-center gap-2.5 text-xl font-bold lg:hidden">
            <BrandMark className="h-8 w-8" />
            Rent<b className="text-honey">Ease</b>
          </div>
          <h1 className="display m-0 mb-1.5 text-[27px] font-bold">{title}</h1>
          <p className="m-0 mb-7 text-[14.5px] text-muted">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
