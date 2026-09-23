import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { listings } from '../../api';
import { useProperties, useUnit } from '../../api/hooks';
import { FloorPlan, UNIT_TYPES } from '../../components/FloorPlan';
import { PhotoUploader } from '../../components/PhotoUploader';
import { Button } from '../../components/ui/Button';
import { ErrorNote, Field, PageHead, inputClass } from '../../components/ui/Bits';
import { Modal } from '../../components/ui/Modal';
import { cx, furnishingLabel, inr } from '../../lib/format';
import type { Furnishing, UnitType } from '../../types';

const DEFAULT_RULES = [
  'Minimum stay 11 months (lock-in)',
  'Rent due on the 5th of each month',
  'Two months notice before vacating',
];

export default function ListingForm() {
  const { id } = useParams();
  const editing = !!id;
  const existing = useUnit(id);
  const { user } = useAuth();
  const properties = useProperties();
  const navigate = useNavigate();
  const toast = useToast();

  const myProperties = properties.filter((p) => p.ownerId === user?.id);
  const [form, setForm] = useState({
    propertyId: myProperties[0]?.id ?? '',
    unitNo: '',
    type: '1 BHK' as UnitType,
    sqft: 550,
    rent: 9000,
    deposit: 18000,
    furnishing: 'semi' as Furnishing,
    description: '',
    rules: DEFAULT_RULES.join('\n'),
    photos: [] as string[],
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Hydrate the form once the unit being edited resolves.
  useEffect(() => {
    if (!existing) return;
    setForm({
      propertyId: existing.propertyId,
      unitNo: existing.unitNo,
      type: existing.type,
      sqft: existing.sqft,
      rent: existing.rent,
      deposit: existing.deposit,
      furnishing: existing.furnishing,
      description: existing.description,
      rules: existing.rules.join('\n'),
      photos: existing.photos,
    });
  }, [existing]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const payload = {
      propertyId: form.propertyId,
      unitNo: form.unitNo.trim(),
      type: form.type,
      sqft: Number(form.sqft),
      rent: Number(form.rent),
      deposit: Number(form.deposit),
      furnishing: form.furnishing,
      description: form.description.trim(),
      rules: form.rules.split('\n').map((r) => r.trim()).filter(Boolean),
      floorPlanType: form.type,
      photos: form.photos,
      status: existing?.status ?? ('available' as const),
    };
    try {
      if (editing && id) {
        await listings.update(id, payload);
        toast(`Unit ${payload.unitNo} updated.`);
      } else {
        await listings.create(payload);
        toast(`Unit ${payload.unitNo} is live.`);
      }
      navigate('/owner/listings');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!id) return;
    await listings.remove(id);
    toast('Listing removed.');
    navigate('/owner/listings');
  }

  if (editing && !existing) {
    return <PageHead title="Listing not found" subtitle="It may have been removed." />;
  }

  return (
    <>
      <PageHead
        title={editing ? `Edit unit ${existing?.unitNo}` : 'List a new unit'}
        subtitle="Renters see everything you fill in here, plus the floor plan for the type you pick."
      />

      <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="card flex flex-col gap-5 p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Property">
              <select
                className={inputClass}
                value={form.propertyId}
                onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
              >
                {myProperties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.area}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Unit number">
              <input
                className={inputClass}
                required
                placeholder="304"
                value={form.unitNo}
                onChange={(e) => setForm({ ...form, unitNo: e.target.value })}
              />
            </Field>
          </div>

          <fieldset className="m-0 border-0 p-0">
            <legend className="mb-2 p-0 text-[12.5px] font-semibold text-muted">Home type</legend>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {UNIT_TYPES.map((t) => (
                <label
                  key={t}
                  className={cx(
                    'flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border p-2.5 transition-colors',
                    form.type === t ? 'border-green bg-green-soft' : 'border-line bg-panel hover:border-green-line',
                  )}
                >
                  <input
                    type="radio"
                    name="type"
                    className="sr-only"
                    checked={form.type === t}
                    onChange={() => setForm({ ...form, type: t })}
                  />
                  <FloorPlan type={t} labels={false} className="h-11 w-full" />
                  <span className="text-[12.5px] font-semibold">{t}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Carpet area (sq ft)">
              <input
                className={inputClass}
                type="number"
                min={100}
                required
                value={form.sqft}
                onChange={(e) => setForm({ ...form, sqft: Number(e.target.value) })}
              />
            </Field>
            <Field label="Monthly rent (₹)">
              <input
                className={inputClass}
                type="number"
                min={0}
                required
                value={form.rent}
                onChange={(e) => setForm({ ...form, rent: Number(e.target.value) })}
              />
            </Field>
            <Field label="Security deposit (₹)">
              <input
                className={inputClass}
                type="number"
                min={0}
                required
                value={form.deposit}
                onChange={(e) => setForm({ ...form, deposit: Number(e.target.value) })}
              />
            </Field>
          </div>

          <Field label="Furnishing">
            <select
              className={inputClass}
              value={form.furnishing}
              onChange={(e) => setForm({ ...form, furnishing: e.target.value as Furnishing })}
            >
              {(Object.keys(furnishingLabel) as Furnishing[]).map((f) => (
                <option key={f} value={f}>
                  {furnishingLabel[f]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Description" hint="Water, parking, floor number, nearby landmarks.">
            <textarea
              className={cx(inputClass, 'min-h-[110px] resize-y')}
              required
              placeholder="Bright one-bedroom with a separate hall, covered parking and 24×7 water."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>

          <Field label="Rules & conditions" hint="One per line.">
            <textarea
              className={cx(inputClass, 'min-h-[100px] resize-y')}
              value={form.rules}
              onChange={(e) => setForm({ ...form, rules: e.target.value })}
            />
          </Field>

          <Field label="Photos">
            <PhotoUploader photos={form.photos} onChange={(photos) => setForm({ ...form, photos })} />
          </Field>

          {error && <ErrorNote>{error}</ErrorNote>}

          <div className="flex flex-wrap gap-2.5">
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving…' : editing ? 'Save changes' : 'Publish listing'}
            </Button>
            <Button variant="ghost" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            {editing && (
              <Button
                variant="ghost"
                className="ml-auto border-[#E6C3AB] text-rented hover:bg-rented-soft"
                onClick={() => setConfirmDelete(true)}
              >
                Remove listing
              </Button>
            )}
          </div>
        </div>

        {/* Live preview of what the renter will see. */}
        <aside className="card overflow-hidden lg:sticky lg:top-[85px]">
          <div className="border-b border-line bg-green-soft p-4">
            {form.photos[0] ? (
              <img
                src={form.photos[0]}
                alt="Cover photo"
                className="h-28 w-full rounded-lg object-cover"
              />
            ) : (
              <FloorPlan type={form.type} className="h-28 w-full" />
            )}
          </div>
          <div className="p-4">
            <p className="m-0 mb-1 text-[11.5px] font-semibold text-muted">Renter preview</p>
            <h3 className="display m-0 text-base font-semibold">
              {form.type} · Unit {form.unitNo || '—'}
            </h3>
            <p className="m-0 mt-1 text-[13px] text-muted">
              {myProperties.find((p) => p.id === form.propertyId)?.name ?? 'Property'} ·{' '}
              {form.sqft || 0} sq ft
            </p>
            <div className="display mt-3 text-[19px] font-semibold">
              {inr(Number(form.rent) || 0)}
              <span className="font-sans text-[12.5px] font-normal text-muted"> / month</span>
            </div>
            <p className="m-0 mt-1 text-[12.5px] text-muted">
              {inr(Number(form.deposit) || 0)} deposit · {furnishingLabel[form.furnishing]}
            </p>
            <p className="m-0 mt-1 text-[12.5px] text-muted">
              {form.photos.length > 0
                ? `${form.photos.length} photo${form.photos.length === 1 ? '' : 's'} · floor plan`
                : 'Floor plan only — add photos above'}
            </p>
          </div>
        </aside>
      </form>

      <Modal
        open={confirmDelete}
        title="Remove this listing?"
        onClose={() => setConfirmDelete(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Keep it
            </Button>
            <Button className="bg-rented" onClick={remove}>
              Remove
            </Button>
          </>
        }
      >
        Unit {existing?.unitNo} will disappear from search and from your dashboard. Any pending
        requests on it stay in your queue.
      </Modal>
    </>
  );
}
