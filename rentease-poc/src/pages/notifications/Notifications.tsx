/** Everything the app has done for you, in one list. Opened from the top-bar bell. */
import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { notifications as notificationsApi } from '../../api';
import { useNotifications } from '../../api/hooks';
import { EmptyState, PageHead } from '../../components/ui/Bits';
import { Button } from '../../components/ui/Button';
import {
  IconBolt,
  IconDoc,
  IconGift,
  IconHelp,
  IconHome,
  IconList,
  IconRupee,
} from '../../components/icons';
import { cx, prettyDate } from '../../lib/format';
import type { NotificationKind } from '../../types';

const KIND_ICON: Record<NotificationKind, ReactNode> = {
  request: <IconList />,
  booking: <IconHome />,
  rent: <IconRupee />,
  bill: <IconBolt />,
  reward: <IconGift />,
  order: <IconDoc />,
  support: <IconHelp />,
};

const KIND_LABEL: Record<NotificationKind, string> = {
  request: 'Requests',
  booking: 'Bookings',
  rent: 'Rent',
  bill: 'Bills',
  reward: 'Rewards',
  order: 'Orders',
  support: 'Support',
};

export default function Notifications() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const items = useNotifications(user?.id);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unread = items.filter((n) => !n.read);
  const shown = filter === 'unread' ? unread : items;

  async function open(id: string, to: string) {
    await notificationsApi.markRead(id);
    navigate(to);
  }

  async function markAll() {
    if (!user) return;
    await notificationsApi.markAllRead(user.id);
    toast('All notifications marked as read.');
  }

  return (
    <>
      <PageHead
        title="Notifications"
        subtitle={
          unread.length > 0
            ? `${unread.length} unread · requests, rent, bills and orders as they happen.`
            : 'Requests, rent, bills and orders as they happen.'
        }
        action={
          unread.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={markAll}>
              Mark all read
            </Button>
          ) : undefined
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {(['all', 'unread'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={cx(
              'cursor-pointer rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
              filter === f
                ? 'border-green bg-green text-[#F1F6EF]'
                : 'border-green-line bg-panel text-green hover:bg-green-soft',
            )}
          >
            {f === 'all' ? `All (${items.length})` : `Unread (${unread.length})`}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <EmptyState
          title={filter === 'unread' ? 'Nothing unread' : 'No notifications yet'}
          message={
            filter === 'unread'
              ? 'You are caught up. New requests, payments and orders will show up here.'
              : 'Tour requests, rent, bills, orders and support replies all land on this page.'
          }
          action={
            filter === 'unread' ? (
              <Button variant="ghost" onClick={() => setFilter('all')}>
                See everything
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="card overflow-hidden">
          {shown.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => open(n.id, n.to)}
              className={cx(
                'flex w-full cursor-pointer items-start gap-3.5 border-0 border-b border-line px-[18px] py-4 text-left last:border-b-0 hover:bg-green-soft',
                n.read ? 'bg-transparent' : 'bg-honey-soft/35',
              )}
            >
              <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-green-soft text-green [&_svg]:h-[18px] [&_svg]:w-[18px]">
                {KIND_ICON[n.kind]}
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <b className="text-sm font-semibold">{n.title}</b>
                  <span className="rounded-full border border-line bg-[#F1F4EF] px-2 py-0.5 text-[11px] font-semibold text-muted">
                    {KIND_LABEL[n.kind]}
                  </span>
                </span>
                <span className="mt-0.5 block text-[13px] leading-snug text-muted">{n.body}</span>
                <span className="mt-1 block text-[12px] text-muted">{prettyDate(n.date)}</span>
              </span>

              {!n.read && <span className="mt-1.5 h-2.5 w-2.5 flex-none rounded-full bg-alert" />}
              <span className="mt-0.5 hidden text-[13px] font-semibold text-green sm:block">Open →</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
