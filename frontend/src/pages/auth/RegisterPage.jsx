import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Zap size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-gray-400 mt-1">Start your AI-powered learning journey</p>
        </div>

        <div className="card">
          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {['learner', 'tutor'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setForm(f => ({ ...f, role: r }))}
                className={`py-3 rounded-xl border text-sm font-semibold capitalize transition-all ${
                  form.role === r
                    ? 'bg-brand-600/20 border-brand-500 text-brand-400'
                    : 'bg-surface border-surface-border text-gray-400 hover:border-gray-500'
                }`}
              >
                {r === 'learner' ? '🎓 Learner' : '👨‍🏫 Tutor'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">First Name</label>
                <input type="text" required value={form.first_name} onChange={set('first_name')} className="input" placeholder="John" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Last Name</label>
                <input type="text" required value={form.last_name} onChange={set('last_name')} className="input" placeholder="Doe" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <input type="email" required value={form.email} onChange={set('email')} className="input" placeholder="you@example.com" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <input type="password" required value={form.password} onChange={set('password')} className="input" placeholder="Min. 8 characters" />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
