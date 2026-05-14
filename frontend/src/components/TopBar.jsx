import { Flame, Sun, Moon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import GlobalSearch from './GlobalSearch';
import NotificationsPanel from './NotificationsPanel';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export default function TopBar({ embedded = false }) {
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  // FIX: streak was read from authStore (never updated after login)
  // Now reads from gamification-profile query which is live data
  const { data: profile } = useQuery({
    queryKey: ['gamification-profile'],
    queryFn: () => api.get('/gamification/profile').then(r => r.data.data),
    enabled: user?.role === 'learner',
    staleTime: 2 * 60 * 1000,  // 2 min cache
  });

  const streak = profile?.streak_days ?? user?.streak ?? 0;

  const initials = user?.first_name && user?.last_name
    ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() || '?';

  const content = (
    <>
      <GlobalSearch />
      <div className="flex-1" />

      {/* Streak pill — live from gamification profile */}
      {user?.role === 'learner' && (
        <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${
          streak > 0
            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/40'
            : 'bg-slate-50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-700/40'
        }`}>
          <Flame size={13} className={streak > 0 ? 'text-amber-500' : 'text-slate-400'} />
          <span className={`text-xs font-bold ${streak > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}>
            {streak > 0 ? `${streak} day streak` : '0 day streak'}
          </span>
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

      <NotificationsPanel />

      <Link
        to="/settings"
        className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/40 border-2 border-brand-200 dark:border-brand-700/50 flex items-center justify-center text-xs font-bold text-brand-700 dark:text-brand-300 hover:border-brand-400 transition-all"
        title={`${user?.first_name || ''} ${user?.last_name || ''} — Settings`}
      >
        {initials}
      </Link>
    </>
  );

  if (embedded) return <>{content}</>;

  return (
    <header className="h-14 bg-white dark:bg-dark-card border-b border-surface-border dark:border-dark-border flex items-center px-5 gap-3 shadow-sm shrink-0 transition-colors">
      {content}
    </header>
  );
}
