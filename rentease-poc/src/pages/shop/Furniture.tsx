import { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { cart } from '../../api';
import { useFurniture } from '../../api/hooks';
import { EmptyState, PageHead } from '../../components/ui/Bits';
import { Button, LinkButton } from '../../components/ui/Button';
import { ProductArt } from '../../components/ProductArt';
import { cx, inr } from '../../lib/format';

export default function Furniture() {
  const items = useFurniture();
  const toast = useToast();
  const [category, setCategory] = useState('All');

  const categories = ['All', ...Array.from(new Set(items.map((i) => i.category)))];
  const shown = category === 'All' ? items : items.filter((i) => i.category === category);

  async function add(refId: string, mode: 'rent' | 'buy', name: string) {
    await cart.add({ kind: 'furniture', refId, mode, qty: 1 });
    toast(`${name} added to cart — ${mode === 'rent' ? 'monthly rent' : 'buy'}.`);
  }

  return (
    <>
      <PageHead
        title="Furniture on rent or buy"
        subtitle="Sized against the floor plans on RentEase, so what you order actually fits the room."
        action={<LinkButton to="/planner" variant="ghost">Suggest from my floor plan</LinkButton>}
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={cx(
              'cursor-pointer rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
              category === c
                ? 'border-green bg-green text-[#F1F6EF]'
                : 'border-green-line bg-panel text-green hover:bg-green-soft',
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <EmptyState title="Nothing in this category" message="Pick another category to keep browsing." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((f) => (
            <article key={f.id} className="card flex flex-col overflow-hidden">
              <div className="border-b border-line bg-green-soft px-4 py-5">
                <ProductArt art={f.image} className="mx-auto block h-24 w-full max-w-[190px]" />
              </div>
              <div className="flex flex-1 flex-col p-4">
                <p className="m-0 text-[11.5px] font-semibold text-muted">{f.category}</p>
                <h3 className="display m-0 mt-1 text-base font-semibold">{f.name}</h3>

                <div className="mt-3 mb-3.5 flex items-baseline gap-4">
                  <span className="display text-[19px] font-semibold">
                    {inr(f.rentPerMonth)}
                    <span className="font-sans text-[12px] font-normal text-muted"> / mo</span>
                  </span>
                  <span className="text-[13px] text-muted">buy {inr(f.buyPrice)}</span>
                </div>

                <div className="mt-auto flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => add(f.id, 'rent', f.name)}>
                    Rent monthly
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1" onClick={() => add(f.id, 'buy', f.name)}>
                    Buy
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
