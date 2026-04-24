import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, GraduationCap, BookOpen } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', role: 'learner' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      const data = await register(form);
      toast.success(`Welcome to SmartEduLearn, ${data.user.first_name}!`);
      navigate(data.user.role === 'tutor' ? '/tutor/dashboard' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md shadow-brand-200">
            <Zap size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Create your account</h1>
          <p className="text-text-muted mt-1 text-sm">Start your AI-powered learning journey</p>
        </div>

        <div className="card shadow-card-lg">
          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { role: 'learner', icon: BookOpen,      label: 'Learner',  desc: 'I want to learn' },
              { role: 'tutor',   icon: GraduationCap, label: 'Tutor',    desc: 'I want to teach' },
            ].map(({ role, icon: Icon, label, desc }) => (
              <button
                key={role}
                type="button"
                onClick={() => setForm(f => ({ ...f, role }))}
                className={`py-3 px-4 rounded-xl border text-left transition-all ${
                  form.role === role
                    ? 'bg-brand-50 border-brand-300 ring-1 ring-brand-200'
                    : 'bg-white border-surface-border hover:border-slate-300'
                }`}
              >
                <Icon size={18} className={form.role === role ? 'text-brand-600 mb-1' : 'text-text-muted mb-1'} />
                <p className={`text-sm font-semibold ${form.role === role ? 'text-brand-700' : 'text-text-primary'}`}>{label}</p>
                <p className="text-xs text-text-muted">{desc}</p>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">First Name</label>
                <input type="text" required value={form.first_name} onChange={set('first_name')} className="input" placeholder="John" />
              </div>
              <div>
                <label className="input-label">Last Name</label>
                <input type="text" required value={form.last_name} onChange={set('last_name')} className="input" placeholder="Doe" />
              </div>
            </div>

            <div>
              <label className="input-label">Email</label>
              <input type="email" required value={form.email} onChange={set('email')} className="input" placeholder="you@example.com" />
            </div>

            <div>
              <label className="input-label">Password</label>
              <input type="password" required value={form.password} onChange={set('password')} className="input" placeholder="Min. 8 characters" />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-sm mt-1">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-text-muted text-sm mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 hover:text-brand-700 font-semibold">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
