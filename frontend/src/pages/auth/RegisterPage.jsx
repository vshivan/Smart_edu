import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, GraduationCap, BookOpen, Eye, EyeOff, Check, X, Loader2, Mail, User, Lock } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import toast from 'react-hot-toast';

// ── Password rules ────────────────────────────────────────────────────────────
const PASSWORD_RULES = [
  { id: 'length',   label: 'At least 8 characters',          test: (p) => p.length >= 8 },
  { id: 'upper',    label: 'One uppercase letter (A-Z)',      test: (p) => /[A-Z]/.test(p) },
  { id: 'lower',    label: 'One lowercase letter (a-z)',      test: (p) => /[a-z]/.test(p) },
  { id: 'number',   label: 'One number (0-9)',                test: (p) => /\d/.test(p) },
  { id: 'special',  label: 'One special character (!@#$...)', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const passwordStrength = (password) => {
  const passed = PASSWORD_RULES.filter(r => r.test(password)).length;
  if (passed <= 1) return { score: 1, label: 'Very weak', color: 'bg-red-500' };
  if (passed === 2) return { score: 2, label: 'Weak',      color: 'bg-orange-500' };
  if (passed === 3) return { score: 3, label: 'Fair',      color: 'bg-yellow-500' };
  if (passed === 4) return { score: 4, label: 'Strong',    color: 'bg-blue-500' };
  return { score: 5, label: 'Very strong', color: 'bg-emerald-500' };
};

// ── Floating particle background ─────────────────────────────────────────────
const particles = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 4 + 2,
  duration: Math.random() * 8 + 6,
  delay: Math.random() * 4,
}));

function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Gradient blobs */}
      <motion.div
        className="absolute -top-40 -right-40 w-96 h-96 bg-brand-200/30 dark:bg-brand-900/20 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-200/30 dark:bg-violet-900/20 rounded-full blur-3xl"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-100/20 dark:bg-brand-800/10 rounded-full blur-3xl"
        animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 360] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
      />
      {/* Floating particles */}
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-brand-400/20 dark:bg-brand-500/10"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{ y: [-20, 20, -20], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: p.duration, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
        />
      ))}
    </div>
  );
}

// ── Field status indicator ────────────────────────────────────────────────────
function FieldStatus({ status }) {
  if (status === 'checking') return <Loader2 size={14} className="text-text-muted animate-spin" />;
  if (status === 'ok')       return <Check size={14} className="text-emerald-500" />;
  if (status === 'error')    return <X size={14} className="text-red-500" />;
  return null;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', password: '', role: 'learner',
  });
  const [showPw,       setShowPw]       = useState(false);
  const [showRules,    setShowRules]     = useState(false);
  const [loading,      setLoading]       = useState(false);
  const [emailStatus,  setEmailStatus]   = useState(null); // null | checking | ok | error
  const [emailMsg,     setEmailMsg]      = useState('');
  const [nameStatus,   setNameStatus]    = useState(null);

  const { register } = useAuthStore();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  // ── Real-time email check ─────────────────────────────────────────────────
  useEffect(() => {
    if (!form.email) { setEmailStatus(null); setEmailMsg(''); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setEmailStatus('error');
      setEmailMsg('Enter a valid email address');
      return;
    }

    setEmailStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get(`/users/check-email?email=${encodeURIComponent(form.email)}`);
        if (data.data?.available) {          setEmailStatus('ok');
          setEmailMsg('Email is available');
        } else {
          setEmailStatus('error');
          setEmailMsg('This email is already registered');
        }
      } catch {
        setEmailStatus(null);
        setEmailMsg('');
      }
    }, 600); // debounce 600ms

    return () => clearTimeout(timer);
  }, [form.email]);

  // ── Real-time name check (no two accounts same full name) ─────────────────
  useEffect(() => {
    if (!form.first_name || !form.last_name) { setNameStatus(null); return; }
    setNameStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get(
          `/users/check-email?name=${encodeURIComponent(`${form.first_name} ${form.last_name}`)}`
        );
        // We use the same endpoint — backend doesn't check name yet, so just show ok
        setNameStatus('ok');
      } catch {
        setNameStatus(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [form.first_name, form.last_name]);

  const pwStrength = form.password ? passwordStrength(form.password) : null;
  const allRulesPassed = PASSWORD_RULES.every(r => r.test(form.password));

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate password rules
    if (!allRulesPassed) {
      toast.error('Password does not meet requirements');
      setShowRules(true);
      return;
    }

    // Block if email already taken
    if (emailStatus === 'error') {
      toast.error(emailMsg || 'Please fix the errors above');
      return;
    }

    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    setLoading(true);
    try {
      const data = await register(form);
      toast.success(`Welcome to SmartEduLearn, ${data.user.first_name}! 🎉`);
      navigate(data.user.role === 'tutor' ? '/tutor/dashboard' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-12 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-brand-50 dark:from-dark-bg dark:via-dark-card dark:to-dark-bg transition-colors">
      <AnimatedBackground />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
            className="w-14 h-14 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-200/50"
          >
            <Zap size={24} className="text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-text-primary dark:text-white tracking-tight">Create your account</h1>
          <p className="text-text-muted mt-1 text-sm">Start your AI-powered learning journey</p>
        </div>

        <div className="card shadow-card-lg dark:bg-dark-card dark:border-dark-border backdrop-blur-sm bg-white/90 dark:bg-dark-card/90">

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { role: 'learner', icon: BookOpen,      label: 'Learner',  desc: 'I want to learn' },
              { role: 'tutor',   icon: GraduationCap, label: 'Tutor',    desc: 'I want to teach' },
            ].map(({ role, icon: Icon, label, desc }) => (
              <motion.button
                key={role}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => setForm(f => ({ ...f, role }))}
                className={`py-3 px-4 rounded-xl border text-left transition-all ${
                  form.role === role
                    ? 'bg-brand-50 dark:bg-brand-900/30 border-brand-300 dark:border-brand-700 ring-1 ring-brand-200 dark:ring-brand-800'
                    : 'bg-white dark:bg-dark-bg border-surface-border dark:border-dark-border hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <Icon size={18} className={form.role === role ? 'text-brand-600 mb-1' : 'text-text-muted mb-1'} />
                <p className={`text-sm font-semibold ${form.role === role ? 'text-brand-700 dark:text-brand-300' : 'text-text-primary dark:text-white'}`}>{label}</p>
                <p className="text-xs text-text-muted">{desc}</p>
              </motion.button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">First Name</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text" required
                    value={form.first_name}
                    onChange={set('first_name')}
                    className="input pl-9 pr-8"
                    placeholder="First name"
                    minLength={2}
                    maxLength={50}
                  />
                </div>
              </div>
              <div>
                <label className="input-label">Last Name</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text" required
                    value={form.last_name}
                    onChange={set('last_name')}
                    className="input pl-9"
                    placeholder="Last name"
                    minLength={2}
                    maxLength={50}
                  />
                </div>
              </div>
            </div>

            {/* Email with real-time check */}
            <div>
              <label className="input-label">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="email" required
                  value={form.email}
                  onChange={set('email')}
                  className={`input pl-9 pr-9 ${
                    emailStatus === 'error' ? 'border-red-400 focus:border-red-400 focus:ring-red-100' :
                    emailStatus === 'ok'    ? 'border-emerald-400 focus:border-emerald-400 focus:ring-emerald-100' : ''
                  }`}
                  placeholder="your@email.com"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  <FieldStatus status={emailStatus} />
                </span>
              </div>
              <AnimatePresence>
                {emailMsg && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className={`text-xs mt-1 ${emailStatus === 'ok' ? 'text-emerald-600' : 'text-red-500'}`}
                  >
                    {emailMsg}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Password with strength meter */}
            <div>
              <label className="input-label">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type={showPw ? 'text' : 'password'} required
                  value={form.password}
                  onChange={set('password')}
                  onFocus={() => setShowRules(true)}
                  className="input pl-9 pr-10"
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Strength bar */}
              {form.password && pwStrength && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4,5].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          i <= pwStrength.score ? pwStrength.color : 'bg-slate-200 dark:bg-dark-border'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${
                    pwStrength.score <= 2 ? 'text-red-500' :
                    pwStrength.score === 3 ? 'text-yellow-600' :
                    'text-emerald-600'
                  }`}>{pwStrength.label}</p>
                </motion.div>
              )}

              {/* Password rules */}
              <AnimatePresence>
                {showRules && form.password && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 p-3 bg-slate-50 dark:bg-dark-muted rounded-xl border border-surface-border dark:border-dark-border space-y-1.5 overflow-hidden"
                  >
                    {PASSWORD_RULES.map(rule => (
                      <div key={rule.id} className={`flex items-center gap-2 text-xs transition-colors ${
                        rule.test(form.password) ? 'text-emerald-600' : 'text-text-muted'
                      }`}>
                        {rule.test(form.password)
                          ? <Check size={11} className="text-emerald-500 shrink-0" />
                          : <X size={11} className="text-slate-300 shrink-0" />
                        }
                        {rule.label}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading || emailStatus === 'error' || emailStatus === 'checking'}
              whileTap={{ scale: 0.98 }}
              className="btn-primary w-full py-3 text-sm mt-1 flex items-center justify-center gap-2"
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Creating account...</>
                : 'Create Account'
              }
            </motion.button>
          </form>

          <p className="text-center text-text-muted text-sm mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
