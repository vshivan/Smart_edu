import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen,
  BarChart3, Bell, Settings, Shield
} from 'lucide-react';

const navItems = [
  { to: '/admin',           icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users',     icon: Users,           label: 'Users' },
  { to: '/admin/tutors',    icon: GraduationCap,   label: 'Tutors' },
  { to: '/admin/courses',   icon: BookOpen,        label: 'Courses' },
  { to: '/admin/analytics', icon: BarChart3,       label: 'Analytics' },
];

export default function AdminLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-surface-card border-r border-surface-border flex flex-col">
        <div className="p-6 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">SmartEduLearn</p>
              <p className="text-xs text-red-400 font-semibold">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-surface-hover'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-surface-card border-b border-surface-border flex items-center px-6">
          <h1 className="text-white font-semibold">Admin Control Center</h1>
          <div className="ml-auto flex items-center gap-2">
            <span className="badge bg-red-500/10 text-red-400 border border-red-500/20">ADMIN</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-surface">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
