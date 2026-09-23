import { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { cart } from '../../api';
import { useDecor } from '../../api/hooks';
import { EmptyState, PageHead } from '../../components/ui/Bits';
import { Button } from '../../components/ui/Button';
import { ProductArt } from '../../components/ProductArt';
import { cx, inr } from '../../lib/format';

export default function Decor() {
  const items = useDecor();
  const toast = useToast();
  const [occasion, setOccasion] = useState('All');

  const occasions = ['All', ...Array.from(new Set(items.map((i) => i.occasion)))];
  const shown = occasion === 'All' ? items : items.filter((i) => i.occasion === occasion);

  async function add(refId: string, mode: 'rent' | 'buy', name: string) {
    await cart.add({ kind: 'decor', refId, mode, qty: 1 });
    toast(`${name} added to cart — ${mode === 'rent' ? 'rented for the day' : 'buy'}.`);
  }

  return (
    <>
      <PageHead
        title="Festival & décor store"
        subtitle="Lights, diyas and party décor — buy it, or rent it in bulk for one function and send it back."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {occasions.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => setOccasion(o)}
            className={cx(
              'cursor-pointer rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
              occasion === o
                ? 'border-green bg-green text-[#F1F6EF]'
                : 'border-green-line bg-panel text-green hover:bg-green-soft',
            )}
          >
            {o}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <EmptyState title="Nothing for this occasion" message="Pick another occasion to keep browsing." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((d) => (
            <article key={d.id} className="card flex flex-col overflow-hidden">
              <div className="border-b border-line bg-honey-soft/60 px-4 py-5">
                <ProductArt art={d.image} className="mx-auto block h-24 w-full max-w-[190px]" />
              </div>
              <div className="flex flex-1 flex-col p-4">
                <p className="m-0 text-[11.5px] font-semibold text-muted">{d.occasion}</p>
                <h3 className="display m-0 mt-1 text-base font-semibold">{d.name}</h3>

                <div className="mt-3 mb-3.5 flex items-baseline gap-4">
                  <span className="display text-[19px] font-semibold">{inr(d.buyPrice)}</span>
                  {d.rentPerDay && (
                    <span className="text-[13px] text-muted">or {inr(d.rentPerDay)} / day</span>
                  )}
                </div>

                <div className="mt-auto flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => add(d.id, 'buy', d.name)}>
                    Buy
                  </Button>
                  {d.rentPerDay && (
                    <Button variant="ghost" size="sm" className="flex-1" onClick={() => add(d.id, 'rent', d.name)}>
                      Rent for a day
                    </Button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
