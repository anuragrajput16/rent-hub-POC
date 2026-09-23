import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { cart as cartApi } from '../../api';
import { useCartLines, useDecor, useFurniture, useRewardCard } from '../../api/hooks';
import { EmptyState, PageHead } from '../../components/ui/Bits';
import { Button, LinkButton } from '../../components/ui/Button';
import { Modal, SuccessModal } from '../../components/ui/Modal';
import { ProductArt } from '../../components/ProductArt';
import { orderTotals, resolveLines } from '../../lib/cart';
import { cashbackFor, pointsFor, tierOf } from '../../lib/rewards';
import { IconCoin } from '../../components/icons';
import { inr } from '../../lib/format';

export default function Cart() {
  const lines = useCartLines();
  const furniture = useFurniture();
  const decor = useDecor();
  const { user } = useAuth();
  const card = useRewardCard(user?.id);
  const toast = useToast();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const [placed, setPlaced] = useState(0);
  const [busy, setBusy] = useState(false);

  const resolved = resolveLines(lines, furniture, decor);
  const subtotal = resolved.reduce((s, l) => s + l.subtotal, 0);
  // The rewards tier decides the discount and whether delivery is on the house.
  const tier = tierOf(card?.lifetimePoints ?? 0);
  const { discount, delivery, total } = orderTotals(subtotal, tier);
  const earnPoints = pointsFor(total, 'shop');
  const earnCashback = cashbackFor(total, card?.lifetimePoints ?? 0);

  async function checkout() {
    if (!user) return;
    setBusy(true);
    try {
      await cartApi.checkout(user.id, total);
      setConfirm(false);
      setPlaced(total);
      toast('Order placed — delivery and assembly will be scheduled.');
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  if (resolved.length === 0) {
    return (
      <>
        <PageHead title="Your cart" />
        <EmptyState
          title="Your cart is empty"
          message="Add furniture on rent, décor for a function, or a whole bundle from the layout planner."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <LinkButton to="/furniture">Browse furniture</LinkButton>
              <LinkButton to="/planner" variant="ghost">
                Open planner
              </LinkButton>
            </div>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHead
        title="Your cart"
        subtitle={`${resolved.reduce((n, l) => n + l.line.qty, 0)} items · delivery and assembly included`}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="card overflow-hidden">
          {resolved.map((l) => (
            <div key={l.line.id} className="flex flex-wrap items-center gap-3.5 border-b border-line p-4 last:border-b-0">
              <span className="h-14 w-16 flex-none rounded-lg border border-line bg-green-soft p-1.5">
                <ProductArt art={l.art} className="h-full w-full" />
              </span>

              <div className="min-w-0 flex-1">
                <b className="block text-sm font-semibold">{l.name}</b>
                <span className="block text-[12.5px] text-muted">
                  {l.line.kind === 'furniture' ? 'Furniture' : 'Décor'} ·{' '}
                  {l.line.mode === 'rent' ? 'On rent' : 'Purchase'} · {inr(l.unitPrice)} {l.unitSuffix}
                </span>
              </div>

              <div className="flex items-center gap-1 rounded-[10px] border border-line bg-[#F3F6F1] p-1">
                <button
                  type="button"
                  aria-label={`Decrease ${l.name}`}
                  onClick={() => cartApi.setQty(l.line.id, l.line.qty - 1)}
                  className="grid h-7 w-7 cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-base font-semibold text-green hover:bg-green-soft"
                >
                  −
                </button>
                <span className="w-6 text-center text-[13px] font-semibold">{l.line.qty}</span>
                <button
                  type="button"
                  aria-label={`Increase ${l.name}`}
                  onClick={() => cartApi.setQty(l.line.id, l.line.qty + 1)}
                  className="grid h-7 w-7 cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-base font-semibold text-green hover:bg-green-soft"
                >
                  +
                </button>
              </div>

              <span className="display w-24 text-right text-[15px] font-semibold">{inr(l.subtotal)}</span>

              <button
                type="button"
                onClick={() => cartApi.remove(l.line.id)}
                className="cursor-pointer border-0 bg-transparent text-[12.5px] font-semibold text-rented hover:underline"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <aside className="card p-5 lg:sticky lg:top-[85px]">
          <h3 className="display m-0 text-base font-semibold">Order summary</h3>

          <dl className="m-0 mt-4 grid grid-cols-[1fr_auto] gap-y-2.5 text-[13.5px]">
            <dt className="text-muted">Items</dt>
            <dd className="m-0 text-right font-semibold">{inr(subtotal)}</dd>
            {discount > 0 && (
              <>
                <dt className="text-green">{tier.name} discount · {Math.round(tier.shopDiscount * 100)}%</dt>
                <dd className="m-0 text-right font-semibold text-green">−{inr(discount)}</dd>
              </>
            )}
            <dt className="text-muted">Delivery & assembly</dt>
            <dd className="m-0 text-right font-semibold">
              {delivery === 0 ? <span className="text-green">Free · {tier.name}</span> : inr(delivery)}
            </dd>
            <dt className="border-t border-line pt-3 text-muted">Total</dt>
            <dd className="display m-0 border-t border-line pt-3 text-right text-lg font-semibold">
              {inr(total)}
            </dd>
          </dl>

          <div className="mt-3.5 flex items-start gap-2.5 rounded-[10px] border border-green-line bg-green-soft px-3 py-2.5">
            <IconCoin className="mt-px h-[18px] w-[18px] flex-none text-green" />
            <p className="m-0 text-[12.5px] leading-snug text-green">
              Earns <b className="font-semibold">{earnPoints.toLocaleString('en-IN')} RentPoints</b>
              {earnCashback > 0 && <> and <b className="font-semibold">{inr(earnCashback)} cashback</b></>} on your
              rewards card.
              {tier.shopDiscount === 0 && ' Reach Silver for 5% off every order.'}
            </p>
          </div>

          <p className="m-0 mt-3 text-[12px] text-muted">
            Monthly rental items are billed every month; purchases are one-off.
          </p>

          <Button block className="mt-4" onClick={() => setConfirm(true)}>
            Checkout
          </Button>
          <Button variant="ghost" block className="mt-2" onClick={() => navigate('/furniture')}>
            Keep shopping
          </Button>
        </aside>
      </div>

      <Modal
        open={confirm}
        title="Confirm your order"
        onClose={() => setConfirm(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={checkout} disabled={busy}>
              {busy ? 'Placing…' : `Pay ${inr(total)}`}
            </Button>
          </>
        }
      >
        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-muted">Items</dt>
          <dd className="m-0 text-right font-semibold">{resolved.length}</dd>
          {discount > 0 && (
            <>
              <dt className="text-muted">{tier.name} discount</dt>
              <dd className="m-0 text-right font-semibold text-green">−{inr(discount)}</dd>
            </>
          )}
          <dt className="text-muted">Paying from</dt>
          <dd className="m-0 text-right font-semibold">Wallet · {inr(user?.walletBalance ?? 0)}</dd>
          <dt className="border-t border-line pt-2 text-muted">Total</dt>
          <dd className="display m-0 border-t border-line pt-2 text-right text-lg font-semibold">
            {inr(total)}
          </dd>
        </dl>
      </Modal>

      <SuccessModal
        open={placed > 0}
        title="Payment successful"
        message={
          <>
            Your order of <b>{inr(placed)}</b> is confirmed. Delivery and assembly get scheduled with you
            over the next day, and <b>{pointsFor(placed, 'shop').toLocaleString('en-IN')} RentPoints</b> have
            been added to your rewards card.
          </>
        }
        onClose={() => setPlaced(0)}
        actions={
          <>
            <Button variant="ghost" onClick={() => setPlaced(0)}>
              Close
            </Button>
            <Button onClick={() => navigate('/orders')}>View orders</Button>
          </>
        }
      />
    </>
  );
}
