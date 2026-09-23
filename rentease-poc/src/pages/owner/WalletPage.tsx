import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { wallet } from '../../api';
import { useOwnerUnits, useTxns } from '../../api/hooks';
import { EmptyState, ErrorNote, Field, PageHead, SectionTitle, StatCard, inputClass } from '../../components/ui/Bits';
import { Button } from '../../components/ui/Button';
import { Modal, SuccessModal } from '../../components/ui/Modal';
import { WalletCard } from '../../components/WalletCard';
import { IconCard, IconHome, IconRupee } from '../../components/icons';
import { inr, prettyDate } from '../../lib/format';

const TXN_TONE = {
  credit: 'text-green',
  debit: 'text-rented',
  withdraw: 'text-muted',
} as const;

const TXN_SIGN = { credit: '+', debit: '−', withdraw: '−' } as const;

export default function OwnerWallet() {
  const { user } = useAuth();
  const toast = useToast();
  const txns = useTxns(user?.id);
  const units = useOwnerUnits(user?.id);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(0);

  const credited = txns.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const rentRoll = units.filter((u) => u.status === 'rented').reduce((s, u) => s + u.rent, 0);

  async function withdraw() {
    if (!user) return;
    setError('');
    try {
      const value = Number(amount);
      await wallet.withdraw(user.id, value);
      setOpen(false);
      setAmount('');
      setDone(value);
      toast(`${inr(value)} sent to your bank account.`);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <>
      <PageHead title="Rent wallet" subtitle="Rent lands here as renters pay. Withdraw to your bank any time." />

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <WalletCard
          balance={user?.walletBalance ?? 0}
          subtitle={`${inr(credited)} credited since you joined`}
          onWithdraw={() => setOpen(true)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard label="Monthly rent roll" value={inr(rentRoll)} icon={<IconRupee />} />
          <StatCard label="Occupied units" value={units.filter((u) => u.status === 'rented').length} icon={<IconHome />} />
        </div>
      </div>

      <SectionTitle title="Transactions" />
      {txns.length === 0 ? (
        <EmptyState title="No transactions yet" message="Rent payments and withdrawals show up here." />
      ) : (
        <div className="card overflow-hidden">
          {txns.map((t) => (
            <div key={t.id} className="flex items-center gap-3.5 border-b border-line px-[18px] py-3.5 last:border-b-0">
              <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-green-soft text-green">
                <IconCard className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <b className="block text-sm font-semibold">{t.note}</b>
                <span className="block text-[12.5px] text-muted">{prettyDate(t.date)}</span>
              </div>
              <span className={`display text-[15px] font-semibold ${TXN_TONE[t.type]}`}>
                {TXN_SIGN[t.type]}
                {inr(t.amount)}
              </span>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        title="Withdraw to bank"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={withdraw}>Withdraw</Button>
          </>
        }
      >
        <div className="flex flex-col gap-3.5">
          <p className="m-0 text-[13.5px] text-muted">
            Available: <b className="font-semibold text-ink">{inr(user?.walletBalance ?? 0)}</b> · Goes to
            HDFC ••4412
          </p>
          <Field label="Amount (₹)">
            <input
              className={inputClass}
              type="number"
              min={1}
              autoFocus
              placeholder="20000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>
          {error && <ErrorNote>{error}</ErrorNote>}
        </div>
      </Modal>

      <SuccessModal
        open={done > 0}
        title="Withdrawal successful"
        message={
          <>
            <b>{inr(done)}</b> is on its way to HDFC ••4412. It usually settles within a working day.
          </>
        }
        onClose={() => setDone(0)}
        actions={<Button onClick={() => setDone(0)}>Done</Button>}
      />
    </>
  );
}
