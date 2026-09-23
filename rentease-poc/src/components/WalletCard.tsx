import { Button } from './ui/Button';
import { IconDownload } from './icons';
import { inr } from '../lib/format';

/** The dark rent-wallet panel with the concentric honey rings from the mockup. */
export function WalletCard({
  balance,
  subtitle,
  onWithdraw,
  onHistory,
}: {
  balance: number;
  subtitle: string;
  onWithdraw?: () => void;
  onHistory?: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-card bg-[linear-gradient(150deg,#1E4634_0%,#153726_100%)] p-[22px] text-[#EAF2E7]">
      <span
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-10 h-[180px] w-[180px] rounded-full border border-honey/35"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -top-2.5 -right-2.5 h-[120px] w-[120px] rounded-full border border-honey/25"
      />

      <div className="mb-1.5 text-[13px] text-[#B7CCB4]">Available balance</div>
      <div className="display text-[33px] font-semibold">{inr(balance)}</div>
      <div className="mt-1.5 text-[12.5px] text-[#9FB79C]">{subtitle}</div>

      {(onWithdraw || onHistory) && (
        <div className="relative z-10 mt-[18px] flex gap-2.5">
          {onWithdraw && (
            <Button variant="honey" className="flex-1" onClick={onWithdraw}>
              <IconDownload />
              Withdraw
            </Button>
          )}
          {onHistory && (
            <Button variant="onDark" className="flex-1" onClick={onHistory}>
              History
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
