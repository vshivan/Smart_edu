import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Map, MessageSquare,
  Trophy, Users, Zap, Star, TrendingUp, LogOut,
  Settings, GraduationCap,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import XPBar from './XPBar';

const learnerNav = [
  {
    section: 'Learning',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard',       end: true },
      { to: '/generate',  icon: Zap,             label: 'AI Course Gen' },
      { to: '/roadmap',   icon: Map,             label: 'Roadmap' },
      { to: '/chat',      icon: MessageSquare,   label: 'AI Tutor' },
      { to: '/courses',   icon: BookOpen,        label: 'Course Catalog' },
    ],
  },
  {
    section: 'Community',
    items: [
      { to: '/tutors',       icon: Users,      label: 'Find Tutors' },
      { to: '/leaderboard',  icon: TrendingUp, label: 'Leaderboard' },
      { to: '/achievements', icon: Trophy,     label: 'Achievements' },
    ],
  },
  {
    section: 'Account',
    items: [
      { to: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

const tutorNav = [
  {
    section: 'Workspace',
    items: [
      { to: '/tutor/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
      { to: '/courses',         icon: BookOpen,        label: 'My Courses' },
      { to: '/tutors',          icon: GraduationCap,   label: 'Marketplace' },
    ],
  },
  {
    section: 'Account',
    items: [
      { to: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

function NavItem({ to, icon: Icon, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
          isActive
            ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 border border-brand-100 dark:border-brand-800/50'
            : 'text-text-secondary dark:text-slate-400 hover:text-text-primary dark:hover:text-white hover:bg-surface-hover dark:hover:bg-dark-hover'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={16} className={isActive ? 'text-brand-600 dark:text-brand-400' : 'text-text-muted dark:text-slate-500'} />
          {label}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const navGroups = user?.role === 'tutor' ? tutorNav : learnerNav;

  const handleLogout = async () => { await logout(); navigate('/'); };

  const initials = user?.first_name && user?.last_name
    ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() || '?';

  const displayName = user?.first_name
    ? `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`
    : user?.email?.split('@')[0] || 'User';

  return (
    <aside className="w-60 bg-white dark:bg-dark-card border-r border-surface-border dark:border-dark-border flex flex-col shadow-sm shrink-0 transition-colors">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-surface-border dark:border-dark-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center shadow-sm">
            <Zap size={15} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-text-primary dark:text-white text-sm tracking-tight">SmartEduLearn</span>
            <p className="text-[10px] text-text-muted dark:text-slate-500 capitalize">{user?.role} Portal</p>
          </div>
        </div>
      </div>

      {/* User XP card — learner only */}
      {user?.role === 'learner' && (
        <div className="px-4 py-3 border-b border-surface-border dark:border-dark-border bg-surface-muted dark:bg-dark-muted">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/40 border-2 border-brand-200 dark:border-brand-700/50 flex items-center justify-center text-xs font-bold text-brand-700 dark:text-brand-300 shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-text-primary dark:text-white truncate">{displayName}</p>
              <p className="text-[10px] text-brand-600 dark:text-brand-400 flex items-center gap-1 font-medium">
                <Star size={9} /> Level {user.level || 1} · {(user.xp || 0).toLocaleString()} XP
              </p>
            </div>
          </div>
          <XPBar current={user.xp || 0} max={user.xp_to_next || 100} showLabel={false} />
        </div>
      )}

      {/* Grouped nav */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {navGroups.map(({ section, items }) => (
          <div key={section}>
            <p className="text-[10px] font-semibold text-text-muted dark:text-slate-600 uppercase tracking-widest px-3 mb-1.5">
              {section}
            </p>
            <div className="space-y-0.5">
              {items.map(item => <NavItem key={item.to} {...item} />)}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-3 border-t border-surface-border dark:border-dark-border">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-secondary dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all duration-150"
        >
          <LogOut size={16} className="text-text-muted dark:text-slate-500" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
