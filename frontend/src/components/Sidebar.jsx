import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Map, MessageSquare,
  Trophy, Users, Zap, Star, TrendingUp, LogOut,
  Settings, GraduationCap,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import XPBar from './XPBar';

// ── Nav config with section grouping ─────────────────────────────────────────
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
      { to: '/tutors',       icon: Users,     label: 'Find Tutors' },
      { to: '/leaderboard',  icon: TrendingUp, label: 'Leaderboard' },
      { to: '/achievements', icon: Trophy,    label: 'Achievements' },
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
      { to: '/tutor/dashboard', icon: LayoutDashboard,  label: 'Dashboard', end: true },
      { to: '/courses',         icon: BookOpen,         label: 'My Courses' },
      { to: '/tutors',          icon: GraduationCap,    label: 'Marketplace' },
    ],
  },
  {
    section: 'Account',
    items: [
      { to: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

// ── NavItem ───────────────────────────────────────────────────────────────────
function NavItem({ to, icon: Icon, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
          isActive
            ? 'bg-brand-50 text-brand-700 border border-brand-100'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={16} className={isActive ? 'text-brand-600' : 'text-text-muted'} />
          {label}
        </>
      )}
    </NavLink>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const navGroups = user?.role === 'tutor' ? tutorNav : learnerNav;

  const handleLogout = async () => { await logout(); navigate('/'); };

  return (
    <aside className="w-60 bg-white border-r border-surface-border flex flex-col shadow-sm shrink-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-surface-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center shadow-sm">
            <Zap size={15} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-text-primary text-sm tracking-tight">SmartEduLearn</span>
            <p className="text-[10px] text-text-muted capitalize">{user?.role} Portal</p>
          </div>
        </div>
      </div>

      {/* User XP card — learner only */}
      {user?.role === 'learner' && (
        <div className="px-4 py-3 border-b border-surface-border bg-surface-muted">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-full bg-brand-100 border-2 border-brand-200 flex items-center justify-center text-xs font-bold text-brand-700 shrink-0">
              {user.first_name?.[0]}{user.last_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-text-primary truncate">{user.first_name} {user.last_name}</p>
              <p className="text-[10px] text-brand-600 flex items-center gap-1 font-medium">
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
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest px-3 mb-1.5">
              {section}
            </p>
            <div className="space-y-0.5">
              {items.map(item => (
                <NavItem key={item.to} {...item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-3 border-t border-surface-border">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-red-600 hover:bg-red-50 transition-all duration-150"
        >
          <LogOut size={16} className="text-text-muted" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
