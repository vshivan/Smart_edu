import { Flame } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import GlobalSearch from './GlobalSearch';
import NotificationsPanel from './NotificationsPanel';
import { Link } from 'react-router-dom';

export default function TopBar() {
  const { user } = useAuthStore();

  return (
    <header className="h-14 bg-white border-b border-surface-border flex items-center px-5 gap-3 shadow-sm shrink-0">
      {/* Global Search */}
      <GlobalSearch />

      <div className="flex-1" />

      {/* Streak pill */}
      {user?.role === 'learner' && (
        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
          <Flame size={13} className="text-amber-500" />
          <span className="text-amber-600 text-xs font-bold">{user.streak || 0} day streak</span>
        </div>
      )}

      {/* Notifications */}
      <NotificationsPanel />

      {/* Avatar → Settings */}
      <Link
        to="/settings"
        className="w-8 h-8 rounded-full bg-brand-100 border-2 border-brand-200 flex items-center justify-center text-xs font-bold text-brand-700 hover:border-brand-400 transition-all"
        title="Settings"
      >
        {user?.first_name?.[0]}{user?.last_name?.[0]}
      </Link>
    </header>
  );
}
