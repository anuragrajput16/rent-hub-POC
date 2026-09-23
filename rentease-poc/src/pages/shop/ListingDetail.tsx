import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { cart, requests as requestsApi } from '../../api';
import {
  useFurniture,
  useProperty,
  useRenterRequests,
  useUnit,
  useUsers,
} from '../../api/hooks';
import { FloorPlan } from '../../components/FloorPlan';
import { Button, LinkButton } from '../../components/ui/Button';
import { Chip, StatusPill, VerifiedBadge } from '../../components/ui/Chip';
import { Modal, SuccessModal } from '../../components/ui/Modal';
import { EmptyState, Field, SectionTitle, inputClass } from '../../components/ui/Bits';
import { IconArea, IconCheck, IconPin } from '../../components/icons';
import { bundleFor, bundleTotals } from '../../lib/planner';
import { cx, furnishingLabel, inr } from '../../lib/format';

const SLOTS = [
  'Sat, 6 Sep · 11:00 AM',
  'Sat, 6 Sep · 4:30 PM',
  'Sun, 7 Sep · 10:00 AM',
  'Sun, 7 Sep · 5:00 PM',
];

const AMENITIES = ['24×7 water', 'Covered parking', 'Power backup', 'Lift', 'Piped gas', 'Security'];

export default function ListingDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const unit = useUnit(id);
  const property = useProperty(unit?.propertyId);
  const users = useUsers();
  const furniture = useFurniture();
  const { user, role } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const myRequests = useRenterRequests(user?.id);

  const [tourOpen, setTourOpen] = useState(params.get('tour') === '1');
  const [kind, setKind] = useState<'tour' | 'booking'>('tour');
  const [slot, setSlot] = useState(SLOTS[0]);
  const [sent, setSent] = useState<'tour' | 'booking' | null>(null);
  const [busy, setBusy] = useState(false);
  const [shot, setShot] = useState(0);

  if (!unit) {
    return (
      <EmptyState
        title="Listing not found"
        message="This unit may have been removed by its owner."
        action={<LinkButton to="/renter/search">Back to search</LinkButton>}
      />
    );
  }

  const owner = users.find((u) => u.id === property?.ownerId);
  const lines = bundleFor(unit.floorPlanType, furniture);
  const totals = bundleTotals(lines);
  const existing = myRequests.find((r) => r.unitId === unit.id && r.status !== 'declined');
  const available = unit.status === 'available';

  function openRequest(next: 'tour' | 'booking') {
    // Guests can browse a listing but not act on it (§4 route guards).
    if (role === 'guest') {
      navigate('/upgrade', { state: { from: `/listing/${unit!.id}` } });
      return;
    }
    if (role === 'owner') {
      toast('Switch to the renter account to request a tour.', 'error');
      return;
    }
    setKind(next);
    setTourOpen(true);
  }

  async function submitRequest() {
    if (!user || !unit) return;
    setBusy(true);
    try {
      await requestsApi.create({
        unitId: unit.id,
        renterId: user.id,
        renterName: user.name,
        kind,
        when: kind === 'tour' ? slot : undefined,
      });
      setTourOpen(false);
      setSent(kind);
    } finally {
      setBusy(false);
    }
  }

  async function addBundle() {
    await cart.addMany(lines.map((l) => ({ kind: 'furniture' as const, refId: l.item.id, mode: 'rent' as const, qty: l.qty })));
    toast(`${lines.length} items added to your cart on monthly rent.`);
  }

  return (
    <>
      <nav className="mb-4 text-[13px] text-muted">
        <Link to="/renter/search" className="text-muted no-underline hover:underline">
          Search
        </Link>{' '}
        / <span className="text-ink">{property?.name}</span>
      </nav>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="flex flex-col gap-5">
          {/* Gallery — the owner's photos, with the floor plan as the first frame. */}
          <div className="relative overflow-hidden rounded-card bg-[linear-gradient(135deg,#2C5B44,#1E4634_60%)]">
            {shot === 0 ? (
              <div className="p-6 sm:p-10">
                <FloorPlan type={unit.floorPlanType} tone="light" className="mx-auto h-48 w-full max-w-lg sm:h-64" />
              </div>
            ) : (
              <img
                src={unit.photos[shot - 1]}
                alt={`Unit ${unit.unitNo}, photo ${shot} of ${unit.photos.length}`}
                className="block h-[260px] w-full object-cover sm:h-[380px]"
              />
            )}

            <div className="absolute top-4 left-4 flex gap-2">
              <StatusPill tone={available ? 'ok' : 'rented'}>
                {available ? 'Available' : 'Rented'}
              </StatusPill>
            </div>

            {unit.photos.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto border-t border-white/10 bg-black/15 p-3">
                {['plan', ...unit.photos].map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setShot(i)}
                    aria-label={i === 0 ? 'Show the floor plan' : `Show photo ${i}`}
                    aria-current={shot === i}
                    className={cx(
                      'h-14 w-[84px] flex-none cursor-pointer overflow-hidden rounded-lg border-2 p-0 transition-colors',
                      shot === i ? 'border-honey' : 'border-white/15 hover:border-white/40',
                    )}
                  >
                    {i === 0 ? (
                      <span className="grid h-full w-full place-items-center bg-white/10 text-[11px] font-semibold text-honey">
                        Floor plan
                      </span>
                    ) : (
                      <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="border-t border-white/10 bg-black/15 px-3 py-3.5 text-center text-[12px] font-medium text-[#9FB79C]">
                This owner hasn't added photos yet — the floor plan is to scale.
              </div>
            )}
          </div>

          <div className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="display m-0 text-[26px] font-bold">
                  {unit.type} · Unit {unit.unitNo}
                </h1>
                <p className="m-0 mt-1.5 flex items-center gap-1.5 text-sm text-muted">
                  <IconPin className="h-4 w-4" />
                  {property?.name}, {property?.area}, {property?.city}
                </p>
              </div>
              <div className="text-right">
                <div className="display text-[26px] font-semibold">{inr(unit.rent)}</div>
                <div className="text-[12.5px] text-muted">per month</div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Chip>
                <span className="inline-flex items-center gap-1.5">
                  <IconArea className="h-3.5 w-3.5" />
                  {unit.sqft} sq ft
                </span>
              </Chip>
              <Chip>{furnishingLabel[unit.furnishing]}</Chip>
              <Chip>{inr(unit.deposit)} deposit</Chip>
              <Chip>
                {unit.photos.length > 0
                  ? `${unit.photos.length} photo${unit.photos.length === 1 ? '' : 's'} + floor plan`
                  : 'Floor plan included'}
              </Chip>
            </div>

            <p className="mt-4 mb-0 text-[14.5px] leading-relaxed text-ink">{unit.description}</p>

            <h2 className="display mt-6 mb-3 text-base font-semibold">Amenities</h2>
            <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-3">
              {AMENITIES.map((a) => (
                <li key={a} className="flex items-center gap-2 text-[13.5px] text-muted">
                  <IconCheck className="h-3.5 w-3.5 flex-none text-green" />
                  {a}
                </li>
              ))}
            </ul>

            <h2 className="display mt-6 mb-3 text-base font-semibold">Rules & conditions</h2>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {unit.rules.map((r) => (
                <li key={r} className="flex items-start gap-2 text-[13.5px] text-muted">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-green-line" />
                  {r}
                </li>
              ))}
            </ul>
          </div>

          {/* Suggested furniture from the floor plan (§9.7). */}
          <div className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="m-0 text-[12.5px] font-semibold text-honey">Suggested for this plan</p>
                <h2 className="display m-0 mt-1 text-lg font-semibold">
                  {unit.type} — furniture that fits
                </h2>
              </div>
              <LinkButton to={`/planner?type=${encodeURIComponent(unit.floorPlanType)}`} variant="ghost" size="sm">
                Open in planner
              </LinkButton>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-[180px_1fr] sm:items-start">
              <div className="rounded-xl border border-green-line bg-green-soft p-3">
                <FloorPlan type={unit.floorPlanType} furnished className="h-28 w-full" />
                <p className="m-0 mt-2 text-center text-[11px] font-semibold text-muted">
                  Suggested layout
                </p>
              </div>
              <div>
                <ul className="m-0 flex list-none flex-col gap-2 p-0">
                  {lines.map((l) => (
                    <li key={l.item.id} className="flex items-baseline justify-between gap-3 text-[13.5px]">
                      <span>
                        <b className="font-semibold">
                          {l.item.name}
                          {l.qty > 1 ? ` × ${l.qty}` : ''}
                        </b>
                        <span className="ml-2 text-muted">{l.where}</span>
                      </span>
                      <span className="whitespace-nowrap text-muted">
                        {inr(l.item.rentPerMonth * l.qty)}/mo
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-3.5">
                  <div className="display text-[17px] font-semibold">
                    {inr(totals.rent)}
                    <span className="font-sans text-[12.5px] font-normal text-muted"> / month on rent</span>
                  </div>
                  <span className="text-[12.5px] text-muted">or {inr(totals.buy)} to buy</span>
                  <Button size="sm" className="ml-auto" onClick={addBundle}>
                    Add bundle to cart
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky booking rail */}
        <aside className="card p-5 lg:sticky lg:top-[85px]">
          <div className="display text-[24px] font-semibold">
            {inr(unit.rent)}
            <span className="font-sans text-[13px] font-normal text-muted"> / month</span>
          </div>
          <p className="m-0 mt-1 text-[13px] text-muted">
            {inr(unit.deposit)} refundable deposit
          </p>

          <div className="mt-4 flex items-center gap-3 rounded-xl bg-green-soft p-3">
            <span className="display grid h-10 w-10 flex-none place-items-center rounded-full bg-honey-soft font-bold text-green-deep">
              {owner?.avatarInitials ?? 'RK'}
            </span>
            <div className="min-w-0">
              <b className="block text-[13.5px] font-semibold">{owner?.name ?? 'Property owner'}</b>
              <span className="text-[12px] text-muted">Owner · responds in a day</span>
            </div>
          </div>

          {owner?.verified && (
            <div className="mt-3">
              <VerifiedBadge label="Ownership verified" />
            </div>
          )}

          {existing ? (
            <div className="mt-4 rounded-xl border border-green-line bg-green-soft p-3.5 text-[13.5px]">
              <b className="block font-semibold text-green">
                {existing.status === 'accepted' ? 'Request accepted' : 'Request sent'}
              </b>
              <span className="text-muted">
                {existing.status === 'accepted'
                  ? `Confirmed for ${existing.when ?? 'a slot the owner will share'}.`
                  : 'The owner has it in their queue — you will see the answer in My tours.'}
              </span>
              <LinkButton to="/renter/tours" variant="ghost" size="sm" block className="mt-3">
                View my tours
              </LinkButton>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-2">
              <Button block disabled={!available} onClick={() => openRequest('tour')}>
                {available ? 'Book a tour' : 'Currently rented'}
              </Button>
              <Button variant="ghost" block disabled={!available} onClick={() => openRequest('booking')}>
                Request to book
              </Button>
            </div>
          )}

          <p className="m-0 mt-4 text-center text-[11.5px] leading-snug text-muted">
            Your verified ID is shared with the owner only when you request a booking.
          </p>
        </aside>
      </div>

      <SectionTitle title="Same building" className="mt-10" link="/renter/search" linkLabel="See all homes" />
      <p className="m-0 text-[13.5px] text-muted">
        {property?.name} has more units in {property?.area}. Filter by type on the search page to compare
        them side by side.
      </p>

      <Modal
        open={tourOpen}
        title={kind === 'tour' ? 'Book a tour' : 'Request to book'}
        onClose={() => setTourOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setTourOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitRequest} disabled={busy}>
              {busy ? 'Sending…' : 'Send request'}
            </Button>
          </>
        }
      >
        <p className="m-0 mb-4 text-[13.5px] text-muted">
          {kind === 'tour'
            ? `Pick a slot that suits you. ${owner?.name ?? 'The owner'} confirms or suggests another time.`
            : `Your verified profile is shared with ${owner?.name ?? 'the owner'}. If they accept, the unit is held for you and rent starts from the move-in date.`}
        </p>

        {kind === 'tour' && (
          <Field label="Preferred slot">
            <select className={inputClass} value={slot} onChange={(e) => setSlot(e.target.value)}>
              {SLOTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
        )}

        <dl className="mt-4 mb-0 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-[13.5px]">
          <dt className="text-muted">Home</dt>
          <dd className="m-0 text-right font-semibold">
            {unit.type} · Unit {unit.unitNo}
          </dd>
          <dt className="text-muted">Rent</dt>
          <dd className="m-0 text-right font-semibold">{inr(unit.rent)} / month</dd>
          {kind === 'booking' && (
            <>
              <dt className="text-muted">Deposit</dt>
              <dd className="m-0 text-right font-semibold">{inr(unit.deposit)}</dd>
            </>
          )}
        </dl>
      </Modal>

      <SuccessModal
        open={sent !== null}
        title={sent === 'booking' ? 'Booking request sent' : 'Tour requested'}
        message={
          sent === 'booking' ? (
            <>
              {owner?.name ?? 'The owner'} now has your booking request for{' '}
              <b>
                Unit {unit.unitNo} · {unit.type}
              </b>
              . Once they accept, the unit is marked rented and your rent schedule starts.
            </>
          ) : (
            <>
              {owner?.name ?? 'The owner'} has your tour request for <b>{slot}</b>. You will see the
              confirmation under My tours.
            </>
          )
        }
        onClose={() => setSent(null)}
        actions={
          <>
            <Button variant="ghost" onClick={() => setSent(null)}>
              Keep browsing
            </Button>
            <Button onClick={() => navigate('/renter/tours')}>View my tours</Button>
          </>
        }
      />
    </>
  );
}
