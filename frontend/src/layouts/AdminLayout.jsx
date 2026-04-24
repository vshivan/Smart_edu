import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen,
  BarChart3, Shield, Zap, LogOut, Settings,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import Breadcrumb from '../components/Breadcrumb';
import GlobalSearch from '../components/GlobalSearch';
import NotificationsPanel from '../components/NotificationsPanel';
import PageTransition from '../components/PageTransition';
import { Link } from 'react-router-dom';

const navGroups = [
  {
    section: 'Overview',
    items: [
      { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    ],
  },
  {
    section: 'Management',
    items: [
      { to: '/admin/users',   icon: Users,         label: 'Users' },
      { to: '/admin/tutors',  icon: GraduationCap, label: 'Tutors' },
      { to: '/admin/courses', icon: BookOpen,      label: 'Courses' },
    ],
  },
  {
    section: 'Insights',
    items: [
      { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    ],
  },
  {
    section: 'System',
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

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const handleLogout = async () => { await logout(); navigate('/'); };

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Admin Sidebar */}
      <aside className="w-60 bg-white border-r border-surface-border flex flex-col shadow-sm shrink-0">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-surface-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center shadow-sm">
              <Zap size={15} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-text-primary text-sm tracking-tight">SmartEduLearn</p>
              <p className="text-[10px] text-brand-600 font-semibold flex items-center gap-1">
                <Shield size={9} /> Admin Panel
              </p>
            </div>
          </div>
        </div>

        {/* Admin user badge */}
        <div className="px-4 py-3 border-b border-surface-border bg-surface-muted">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-brand-100 border-2 border-brand-200 flex items-center justify-center text-xs font-bold text-brand-700">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-text-primary truncate">{user?.first_name} {user?.last_name}</p>
              <span className="badge-brand text-[10px]">ADMIN</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
          {navGroups.map(({ section, items }) => (
            <div key={section}>
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest px-3 mb-1.5">
                {section}
              </p>
              <div className="space-y-0.5">
                {items.map(item => <NavItem key={item.to} {...item} />)}
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

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Admin TopBar */}
        <header className="h-14 bg-white border-b border-surface-border flex items-center px-5 gap-3 shadow-sm shrink-0">
          <GlobalSearch />
          <div className="flex-1" />
          <NotificationsPanel />
          <Link
            to="/settings"
            className="w-8 h-8 rounded-full bg-brand-100 border-2 border-brand-200 flex items-center justify-center text-xs font-bold text-brand-700 hover:border-brand-400 transition-all"
          >
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto bg-surface">
          <div className="p-6">
            <Breadcrumb />
            <AnimatePresence mode="wait">
              <PageTransition key={location.pathname}>
                <Outlet />
              </PageTransition>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
