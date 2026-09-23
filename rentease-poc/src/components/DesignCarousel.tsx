import { useCallback, useEffect, useRef, useState } from 'react';
import { DecorScene } from './DecorScene';
import { Button } from './ui/Button';
import { IconCheck, IconClock, IconRupee, IconSparkle } from './icons';
import { festivalById, type DesignIdea } from '../lib/decoration';
import { cx, inr } from '../lib/format';

/**
 * Hero carousel of decoration designs. Advances on its own, but pauses while
 * the pointer or keyboard focus is inside it, and does not auto-advance at all
 * when the visitor has asked for reduced motion.
 */
export function DesignCarousel({
  ideas,
  onOpen,
}: {
  ideas: DesignIdea[];
  onOpen?: (idea: DesignIdea) => void;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  const count = ideas.length;
  const go = useCallback((next: number) => setIndex(((next % count) + count) % count), [count]);
  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);

  useEffect(() => {
    if (paused || count < 2) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const t = setTimeout(next, 6000);
    return () => clearTimeout(t);
  }, [paused, count, next, index]);

  if (count === 0) return null;
  const idea = ideas[index];
  const festival = festivalById(idea.festivalId);
  const accent = festival?.accent ?? '#CE8A22';

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Decoration designs"
      className="relative overflow-hidden rounded-card bg-[linear-gradient(150deg,#1E4634_0%,#153726_100%)] text-[#EAF2E7]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') next();
        if (e.key === 'ArrowLeft') prev();
      }}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 45) (dx < 0 ? next : prev)();
        touchX.current = null;
      }}
    >
      <div
        className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center"
        aria-live="polite"
      >
        {/* The design itself. */}
        <div
          key={idea.id}
          className="rise rounded-xl border p-3"
          style={{ borderColor: `${accent}55`, background: `${accent}14` }}
        >
          <DecorScene scene={idea.scene} accent={accent} className="block h-[190px] w-full sm:h-[230px]" />
        </div>

        <div key={`${idea.id}-copy`} className="rise min-w-0">
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-2.5 py-1 text-[11.5px] font-bold tracking-[.06em] uppercase"
              style={{ background: `${accent}30`, color: '#F1F6EF' }}
            >
              {festival?.name}
            </span>
            <span className="rounded-full border border-white/25 px-2.5 py-1 text-[11.5px] font-semibold text-[#CBDAC9] capitalize">
              {idea.surface}
            </span>
            {idea.renterSafe && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11.5px] font-semibold text-[#CBDAC9]">
                <IconCheck className="h-3 w-3" />
                No nails
              </span>
            )}
          </div>

          <h3 className="display m-0 text-[22px] leading-tight font-semibold text-[#F3F8F1] sm:text-[26px]">
            {idea.title}
          </h3>
          <p className="m-0 mt-2 max-w-[54ch] text-[13.5px] leading-relaxed text-[#B9CDB6] sm:text-sm">
            {idea.blurb}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-[#CBDAC9]">
            <span className="inline-flex items-center gap-1.5">
              <IconRupee className="h-4 w-4 text-honey" />
              About {inr(idea.budget)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <IconClock className="h-4 w-4 text-honey" />
              {idea.effort}
            </span>
            <span className="flex items-center gap-1.5">
              {idea.palette.map((c) => (
                <span
                  key={c}
                  className="h-3.5 w-3.5 rounded-full border border-white/30"
                  style={{ background: c }}
                />
              ))}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            {onOpen && (
              <Button variant="honey" onClick={() => onOpen(idea)}>
                <IconSparkle />
                See how it's done
              </Button>
            )}
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={prev}
                aria-label="Previous design"
                className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg border border-white/25 bg-white/10 text-[#EAF2E7] hover:bg-white/20"
              >
                ‹
              </button>
              <span className="text-[12.5px] font-semibold text-[#9FB79C] tabular-nums">
                {index + 1} / {count}
              </span>
              <button
                type="button"
                onClick={next}
                aria-label="Next design"
                className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg border border-white/25 bg-white/10 text-[#EAF2E7] hover:bg-white/20"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-2 pb-4" role="tablist" aria-label="Choose a design">
        {ideas.map((d, i) => (
          <button
            key={d.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={d.title}
            onClick={() => go(i)}
            className={cx(
              'h-1.5 cursor-pointer rounded-full border-0 transition-all',
              i === index ? 'w-7 bg-honey' : 'w-1.5 bg-white/30 hover:bg-white/60',
            )}
          />
        ))}
      </div>
    </section>
  );
}
