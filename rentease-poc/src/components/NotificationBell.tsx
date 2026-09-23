/** Top-bar bell: a red dot while anything is unread, opening /notifications. */
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUnreadCount } from '../api/hooks';
import { IconBell } from './icons';
import { cx } from '../lib/format';

export function NotificationBell() {
  const { user } = useAuth();
  const unread = useUnreadCount(user?.id);

  if (!user) return null;

  return (
    <NavLink
      to="/notifications"
      aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
      title="Notifications"
      className={({ isActive }) =>
        cx(
          'relative grid h-9 w-9 flex-none place-items-center rounded-lg text-[#EEF3EC] no-underline',
          isActive ? 'bg-white/25' : 'bg-white/10 hover:bg-white/20',
        )
      }
    >
      <IconBell className="h-[18px] w-[18px]" />
      {unread > 0 && (
        <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full border-2 border-green bg-alert" />
      )}
    </NavLink>
  );
}
