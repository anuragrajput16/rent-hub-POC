import { useAuth } from '../../context/AuthContext';
import { useDecor, useFurniture, useOrders, useServiceRequests, usePros } from '../../api/hooks';
import { EmptyState, PageHead, SectionTitle } from '../../components/ui/Bits';
import { LinkButton } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/Chip';
import { ProductArt } from '../../components/ProductArt';
import { resolveLines } from '../../lib/cart';
import { inr, prettyDate, tradeLabel } from '../../lib/format';

export default function Orders() {
  const { user } = useAuth();
  const orders = useOrders(user?.id);
  const furniture = useFurniture();
  const decor = useDecor();
  const pros = usePros();
  const serviceReqs = useServiceRequests(user?.id);

  return (
    <>
      <PageHead
        title="Your history"
        subtitle="Everything you have ordered and booked. We use it to sharpen the suggestions you see."
      />

      <SectionTitle title="Orders" className="mt-0" />
      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          message="Furniture, décor and planner bundles you check out will be listed here."
          action={<LinkButton to="/furniture">Browse furniture</LinkButton>}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((o) => {
            const resolved = resolveLines(o.lines, furniture, decor);
            return (
              <div key={o.id} className="card overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-green-soft/50 px-4 py-3">
                  <div>
                    <b className="text-sm font-semibold">Order · {prettyDate(o.date)}</b>
                    <span className="ml-2 text-[12.5px] text-muted">
                      {resolved.length} item{resolved.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill tone="ok">Confirmed</StatusPill>
                    <span className="display text-[15px] font-semibold">{inr(o.total)}</span>
                  </div>
                </div>
                {resolved.map((l) => (
                  <div key={l.line.id} className="flex items-center gap-3.5 border-b border-line px-4 py-3 last:border-b-0">
                    <span className="h-11 w-14 flex-none rounded-lg border border-line bg-green-soft p-1">
                      <ProductArt art={l.art} className="h-full w-full" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <b className="block text-[13.5px] font-semibold">
                        {l.name}
                        {l.line.qty > 1 ? ` × ${l.line.qty}` : ''}
                      </b>
                      <span className="block text-[12.5px] text-muted">
                        {l.line.mode === 'rent' ? 'On rent' : 'Purchased'} · {inr(l.unitPrice)} {l.unitSuffix}
                      </span>
                    </div>
                    <span className="text-[13.5px] font-semibold">{inr(l.subtotal)}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      <SectionTitle title="Service bookings" />
      {serviceReqs.length === 0 ? (
        <EmptyState
          title="No services booked"
          message="Plumbers, electricians and construction jobs you book appear here."
          action={<LinkButton to="/services" variant="ghost">Book a pro</LinkButton>}
        />
      ) : (
        <div className="card overflow-hidden">
          {serviceReqs.map((s) => {
            const pro = pros.find((p) => p.id === s.proId);
            return (
              <div key={s.id} className="flex flex-wrap items-center gap-3.5 border-b border-line px-4 py-3.5 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <b className="block text-sm font-semibold">
                    {pro?.name} · {pro ? tradeLabel[pro.trade] : ''}
                  </b>
                  <span className="block text-[12.5px] text-muted">{s.slot}</span>
                </div>
                <span className="display text-[14px] font-semibold">{inr(pro?.ratePerVisit ?? 0)}</span>
                <StatusPill tone={s.status === 'done' ? 'ok' : 'wait'}>
                  {s.status === 'requested' ? 'Requested' : s.status === 'confirmed' ? 'Confirmed' : 'Done'}
                </StatusPill>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
