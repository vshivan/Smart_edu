import { Flame, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import GlobalSearch from './GlobalSearch';
import NotificationsPanel from './NotificationsPanel';
import { Link } from 'react-router-dom';

export default function TopBar() {
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const initials = user?.first_name && user?.last_name
    ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() || '?';

  return (
    <header className="h-14 bg-white dark:bg-dark-card border-b border-surface-border dark:border-dark-border flex items-center px-5 gap-3 shadow-sm shrink-0 transition-colors">
      {/* Global Search */}
      <GlobalSearch />

      <div className="flex-1" />

      {/* Streak pill */}
      {user?.role === 'learner' && (
        <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 px-3 py-1.5 rounded-full">
          <Flame size={13} className="text-amber-500" />
          <span className="text-amber-600 dark:text-amber-400 text-xs font-bold">{user.streak || 0} day streak</span>
        </div>
      )}

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="w-8 h-8 rounded-xl flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-hover dark:hover:bg-dark-hover transition-all"
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark'
          ? <Sun size={16} className="text-amber-400" />
          : <Moon size={16} />
        }
      </button>

      {/* Notifications */}
      <NotificationsPanel />

      {/* Avatar → Settings */}
      <Link
        to="/settings"
        className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/40 border-2 border-brand-200 dark:border-brand-700/50 flex items-center justify-center text-xs font-bold text-brand-700 dark:text-brand-300 hover:border-brand-400 transition-all"
        title={`${user?.first_name || ''} ${user?.last_name || ''} — Settings`}
      >
        {initials}
      </Link>
    </header>
  );
}
