import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import { Zap, BookOpen, GraduationCap, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

// ── Role selection shown to brand-new Google sign-ups ─────────────────────────
function RoleSelector({ onSelect, loading }) {
  const [selected, setSelected] = useState('learner');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
          <Zap size={24} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-text-primary">Welcome to SmartEduMate!</h1>
        <p className="text-text-muted mt-2 text-sm">How would you like to use the platform?</p>
      </div>

      <div className="card shadow-card-lg space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              role:  'learner',
              icon:  BookOpen,
              label: 'Learner',
              desc:  'I want to learn new skills with AI-powered courses',
              color: 'text-brand-600',
              bg:    'bg-brand-50 border-brand-300',
            },
            {
              role:  'tutor',
              icon:  GraduationCap,
              label: 'Tutor',
              desc:  'I want to teach and offer 1-on-1 sessions',
              color: 'text-violet-600',
              bg:    'bg-violet-50 border-violet-300',
            },
          ].map(({ role, icon: Icon, label, desc, color, bg }) => (
            <button
              key={role}
              type="button"
              onClick={() => setSelected(role)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                selected === role
                  ? bg
                  : 'bg-white border-surface-border hover:border-slate-300'
              }`}
            >
              <Icon size={22} className={`${selected === role ? color : 'text-text-muted'} mb-2`} />
              <p className={`font-semibold text-sm ${selected === role ? color : 'text-text-primary'}`}>
                {label}
              </p>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">{desc}</p>
              {selected === role && (
                <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-100 px-2 py-0.5 rounded-full">
                  Selected ✓
                </span>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={() => onSelect(selected)}
          disabled={loading}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2"
        >
          {loading
            ? <><Loader2 size={16} className="animate-spin" /> Setting up your account...</>
            : `Continue as ${selected === 'learner' ? 'Learner' : 'Tutor'} →`
          }
        </button>

        <p className="text-xs text-text-muted text-center">
          You can change this later in Settings
        </p>
      </div>
    </motion.div>
  );
}

// ── Main callback handler ─────────────────────────────────────────────────────
export default function AuthCallback() {
  const [params]    = useSearchParams();
  const { setTokens, updateUser } = useAuthStore();
  const navigate    = useNavigate();
  const [showRole,  setShowRole]  = useState(false);
  const [roleLoading, setRoleLoading] = useState(false);
  const [userData,  setUserData]  = useState(null);

  useEffect(() => {
    const token   = params.get('token');
    const refresh = params.get('refresh');
    const isNew   = params.get('is_new') === 'true';

    if (!token || !refresh) {
      navigate('/login?error=oauth_failed');
      return;
    }

    // Store tokens immediately
    setTokens(token, refresh);

    // Fetch user profile
    api.get('/auth/me').then(({ data }) => {
      const user = data.data;
      useAuthStore.setState({ user });
      setUserData(user);

      if (isNew) {
        // New Google user — show role selection
        setShowRole(true);
      } else {
        // Existing user — go straight to dashboard
        redirectToDashboard(user.role);
      }
    }).catch(() => navigate('/login?error=oauth_failed'));
  }, []);

  const redirectToDashboard = (role) => {
    if (role === 'admin')  navigate('/admin');
    else if (role === 'tutor') navigate('/tutor/dashboard');
    else navigate('/dashboard');
  };

  const handleRoleSelect = async (role) => {
    setRoleLoading(true);
    try {
      await api.post('/auth/set-role', { role });
      updateUser({ role });
      toast.success(`Welcome! Your account is set up as a ${role}.`);
      redirectToDashboard(role);
    } catch {
      toast.error('Failed to set role. Please try again.');
    } finally {
      setRoleLoading(false);
    }
  };

  // Show role selection for new Google users
  if (showRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50 flex items-center justify-center px-4">
        <RoleSelector onSelect={handleRoleSelect} loading={roleLoading} />
      </div>
    );
  }

  // Loading spinner while processing
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md animate-pulse">
          <Zap size={22} className="text-white" />
        </div>
        <p className="text-text-secondary text-sm font-medium">Completing sign in...</p>
      </div>
    </div>
  );
}
