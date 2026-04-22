import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, BookOpen, Map, MessageSquare,
  Trophy, Users, Zap, Star, TrendingUp
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import XPBar from './XPBar';

const learnerNav = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/generate',     icon: Zap,             label: 'AI Course Gen' },
  { to: '/roadmap',      icon: Map,             label: 'Roadmap' },
  { to: '/chat',         icon: MessageSquare,   label: 'AI Tutor' },
  { to: '/courses',      icon: BookOpen,        label: 'Courses' },
  { to: '/tutors',       icon: Users,           label: 'Find Tutors' },
  { to: '/leaderboard',  icon: TrendingUp,      label: 'Leaderboard' },
  { to: '/achievements', icon: Trophy,          label: 'Achievements' },
];

const tutorNav = [
  { to: '/tutor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/courses',         icon: BookOpen,        label: 'My Courses' },
];

export default function Sidebar() {
  const { user } = useAuthStore();
  const nav = user?.role === 'tutor' ? tutorNav : learnerNav;

  return (
    <aside className="w-64 bg-surface-card border-r border-surface-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-bold text-white">SmartEduLearn</span>
        </div>
      </div>

      {/* User XP card */}
      {user?.role === 'learner' && (
        <div className="p-4 border-b border-surface-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-sm font-bold">
              {user.first_name?.[0]}{user.last_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.first_name} {user.last_name}</p>
              <p className="text-xs text-brand-400 flex items-center gap-1"><Star size={10} /> Level {user.level || 1}</p>
            </div>
          </div>
          <XPBar current={user.xp || 0} max={user.xp_to_next || 100} />
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard' || to === '/tutor/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-brand-600/20 text-brand-400 border border-brand-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-surface-hover'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} className={isActive ? 'text-brand-400' : ''} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
