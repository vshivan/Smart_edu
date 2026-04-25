import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';

export default function Navbar() {
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => { await logout(); navigate('/'); };

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-surface-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center shadow-sm">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-text-primary text-lg tracking-tight">SmartEduLearn</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/courses" className="btn-ghost text-sm">Courses</Link>
            <Link to="/tutors"  className="btn-ghost text-sm">Tutors</Link>
          </div>

          {/* Auth */}
          <div className="hidden md:flex items-center gap-2">
            {token ? (
              <>
                <Link
                  to={user?.role === 'admin' ? '/admin' : user?.role === 'tutor' ? '/tutor/dashboard' : '/dashboard'}
                  className="btn-ghost text-sm"
                >
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="btn-secondary text-sm py-2 px-4">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login"    className="btn-ghost text-sm">Login</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden text-text-secondary p-2 rounded-lg hover:bg-surface-hover" onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-white border-t border-surface-border p-4 space-y-1"
        >
          <Link to="/courses" className="block py-2.5 px-3 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover text-sm font-medium" onClick={() => setOpen(false)}>Courses</Link>
          <Link to="/tutors"  className="block py-2.5 px-3 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover text-sm font-medium" onClick={() => setOpen(false)}>Tutors</Link>
          {token ? (
            <button onClick={handleLogout} className="w-full btn-secondary mt-2 text-sm">Logout</button>
          ) : (
            <Link to="/register" className="block btn-primary text-center mt-2 text-sm" onClick={() => setOpen(false)}>Get Started</Link>
          )}
        </motion.div>
      )}
    </nav>
  );
}
