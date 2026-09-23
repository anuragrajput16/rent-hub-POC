import { useMemo, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { cart } from '../../api';
import { useDecor } from '../../api/hooks';
import { EmptyState, PageHead, SectionTitle } from '../../components/ui/Bits';
import { Button, LinkButton } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { DesignCarousel } from '../../components/DesignCarousel';
import { DecorScene } from '../../components/DecorScene';
import { ProductArt } from '../../components/ProductArt';
import { IconCheck, IconClock, IconRupee, IconSparkle } from '../../components/icons';
import {
  FESTIVALS,
  featuredIdeas,
  ideasFor,
  upcomingFestival,
  type DesignIdea,
  type Surface,
} from '../../lib/decoration';
import { cx, inr } from '../../lib/format';

const SURFACES: { id: Surface; title: string; blurb: string }[] = [
  {
    id: 'wall',
    title: 'For your walls',
    blurb: 'Backdrops, ledges and light — the wall you see first from the front door.',
  },
  {
    id: 'door',
    title: 'For your doors',
    blurb: 'Torans, wreaths and the threshold. The bit your neighbours actually see.',
  },
];

export default function Decoration() {
  const decor = useDecor();
  const toast = useToast();
  // Open on whichever festival is next on the calendar.
  const [festivalId, setFestivalId] = useState(() => upcomingFestival().id);
  const [open, setOpen] = useState<DesignIdea | null>(null);

  const featured = useMemo(() => featuredIdeas(), []);
  const festival = FESTIVALS.find((f) => f.id === festivalId) ?? FESTIVALS[0];
  const upcoming = useMemo(() => upcomingFestival(), []);

  const itemsOf = (idea: DesignIdea) =>
    idea.itemIds.map((id) => decor.find((d) => d.id === id)).filter((d) => !!d);

  async function addKit(idea: DesignIdea) {
    const items = itemsOf(idea);
    if (items.length === 0) {
      toast('Nothing in this kit is stocked right now.', 'error');
      return;
    }
    await cart.addMany(
      items.map((d) => ({
        kind: 'decor' as const,
        refId: d.id,
        mode: (d.rentPerDay ? 'rent' : 'buy') as 'rent' | 'buy',
        qty: 1,
      })),
    );
    toast(`${items.length} pieces from “${idea.title}” added to your cart.`);
  }

  const kitTotal = (idea: DesignIdea) =>
    itemsOf(idea).reduce((sum, d) => sum + (d.rentPerDay ?? d.buyPrice), 0);

  return (
    <>
      <PageHead
        title="Decoration"
        subtitle="Designs for your walls and doors, picked for the festival that's next — and every piece rents or buys in a tap."
        action={
          <LinkButton to="/decor" variant="ghost">
            Shop the store
          </LinkButton>
        }
      />

      <DesignCarousel ideas={featured} onOpen={setOpen} />

      {/* ------------------------- festival picker ------------------------- */}
      <SectionTitle title="Decorating for" />
      <div className="mb-5 flex flex-wrap gap-2">
        {FESTIVALS.map((f) => {
          const active = f.id === festivalId;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFestivalId(f.id)}
              className={cx(
                'cursor-pointer rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
                active
                  ? 'border-green bg-green text-[#F1F6EF]'
                  : 'border-green-line bg-panel text-green hover:bg-green-soft',
              )}
            >
              {f.name}
              <span className={cx('ml-2 text-[11.5px] font-medium', active ? 'text-[#B9CDB6]' : 'text-muted')}>
                {f.window}
              </span>
              {f.id === upcoming.id && (
                <span
                  className={cx(
                    'ml-2 rounded-full px-1.5 py-0.5 text-[10.5px] font-bold',
                    active ? 'bg-honey text-[#2A1B04]' : 'bg-honey-soft text-honey',
                  )}
                >
                  NEXT
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div
        className="mb-6 flex items-start gap-3.5 rounded-card border p-4"
        style={{ borderColor: `${festival.accent}55`, background: `${festival.accent}12` }}
      >
        <span
          className="grid h-10 w-10 flex-none place-items-center rounded-full"
          style={{ background: `${festival.accent}26`, color: festival.accent }}
        >
          <IconSparkle />
        </span>
        <div className="min-w-0">
          <b className="display block text-[15px] font-semibold">
            {festival.name} · {festival.window}
          </b>
          <p className="m-0 mt-0.5 text-[13.5px] text-muted">{festival.tagline}</p>
        </div>
      </div>

      {/* ---------------------- wall & door suggestions ---------------------- */}
      {SURFACES.map((surface) => {
        const ideas = ideasFor(festivalId, surface.id);
        return (
          <section key={surface.id}>
            <SectionTitle title={surface.title} />
            <p className="-mt-2 mb-4 max-w-[68ch] text-[13.5px] text-muted">{surface.blurb}</p>

            {ideas.length === 0 ? (
              <EmptyState
                title={`No ${surface.id} ideas for ${festival.name} yet`}
                message="Pick another festival — or browse the store and put your own together."
                action={<LinkButton to="/decor">Browse décor</LinkButton>}
              />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {ideas.map((idea) => {
                  // A single idea would leave half the row empty — lay it out
                  // sideways across both columns instead.
                  const wide = ideas.length === 1;
                  return (
                  <article
                    key={idea.id}
                    className={cx('card flex overflow-hidden', wide ? 'flex-col sm:flex-row lg:col-span-2' : 'flex-col')}
                  >
                    <div
                      className={cx(
                        'border-line p-3',
                        wide ? 'border-b sm:w-[46%] sm:flex-none sm:border-r sm:border-b-0' : 'border-b',
                      )}
                      style={{ background: `${festival.accent}12` }}
                    >
                      <DecorScene
                        scene={idea.scene}
                        accent={festival.accent}
                        className={cx('block w-full', wide ? 'h-[150px] sm:h-[215px]' : 'h-[150px]')}
                      />
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-lg border border-green-line bg-green-soft px-2 py-0.5 text-[11.5px] font-semibold text-green capitalize">
                          {idea.surface}
                        </span>
                        {idea.renterSafe && (
                          <span className="inline-flex items-center gap-1 rounded-lg border border-[#EBCF9C] bg-honey-soft px-2 py-0.5 text-[11.5px] font-semibold text-honey">
                            <IconCheck className="h-3 w-3" />
                            Renter-safe
                          </span>
                        )}
                      </div>

                      <h3 className="display m-0 text-base font-semibold">{idea.title}</h3>
                      <p className="m-0 mt-1.5 flex-1 text-[13.5px] leading-snug text-muted">{idea.blurb}</p>

                      <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] text-muted">
                        <span className="inline-flex items-center gap-1.5">
                          <IconRupee className="h-3.5 w-3.5 text-green" />
                          About {inr(idea.budget)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <IconClock className="h-3.5 w-3.5 text-green" />
                          {idea.effort}
                        </span>
                        <span className="flex items-center gap-1">
                          {idea.palette.map((c) => (
                            <span
                              key={c}
                              title={c}
                              className="h-3 w-3 rounded-full border border-line"
                              style={{ background: c }}
                            />
                          ))}
                        </span>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Button size="sm" variant="ghost" className="flex-1" onClick={() => setOpen(idea)}>
                          How to do it
                        </Button>
                        <Button size="sm" className="flex-1" onClick={() => addKit(idea)}>
                          Add the kit
                        </Button>
                      </div>
                    </div>
                  </article>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}

      {/* --------------------------- idea detail --------------------------- */}
      <Modal
        open={!!open}
        title={open?.title ?? ''}
        onClose={() => setOpen(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(null)}>
              Close
            </Button>
            {open && (
              <Button
                onClick={async () => {
                  await addKit(open);
                  setOpen(null);
                }}
              >
                Add the kit · {inr(kitTotal(open))}
              </Button>
            )}
          </>
        }
      >
        {open && (
          <div className="flex flex-col gap-4">
            <p className="m-0 text-[13.5px] leading-relaxed text-muted">{open.blurb}</p>

            <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
              {open.steps.map((step, i) => (
                <li key={step} className="flex gap-3 text-[13.5px] leading-snug">
                  <span className="display grid h-6 w-6 flex-none place-items-center rounded-full bg-green-soft text-[12px] font-bold text-green">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>

            <div>
              <p className="m-0 mb-2 text-[12.5px] font-semibold text-muted">What you'll need</p>
              <div className="flex flex-col gap-2">
                {itemsOf(open).map((d) => (
                  <div key={d.id} className="flex items-center gap-3 rounded-[10px] border border-line p-2.5">
                    <span className="h-10 w-12 flex-none rounded-lg bg-honey-soft/60 p-1">
                      <ProductArt art={d.image} className="h-full w-full" />
                    </span>
                    <span className="min-w-0 flex-1 text-[13px] font-semibold">{d.name}</span>
                    <span className="text-[12.5px] whitespace-nowrap text-muted">
                      {d.rentPerDay ? `${inr(d.rentPerDay)} / day` : inr(d.buyPrice)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
