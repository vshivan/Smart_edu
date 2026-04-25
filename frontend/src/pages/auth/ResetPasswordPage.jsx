import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Zap, CheckCircle, XCircle } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const [params]          = useSearchParams();
  const navigate          = useNavigate();
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);

  const token = params.get('token');

  // Redirect if no token in URL
  useEffect(() => {
    if (!token) {
      toast.error('Invalid reset link');
      navigate('/forgot-password');
    }
  }, [token, navigate]);

  const passwordsMatch = password && confirm && password === confirm;
  const passwordLong   = password.length >= 8;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!passwordLong)   return toast.error('Password must be at least 8 characters');
    if (!passwordsMatch) return toast.error('Passwords do not match');

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset link is invalid or has expired');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Zap size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Set new password</h1>
          <p className="text-gray-400 mt-1">Choose a strong password for your account</p>
        </div>

        <div className="card">
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <div className="w-16 h-16 bg-green-600/20 border-2 border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-green-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Password updated!</h3>
              <p className="text-gray-400 text-sm mb-6">
                Your password has been reset. You've been signed out of all devices.
              </p>
              <Link to="/login" className="btn-primary inline-block">
                Sign in with new password
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  New password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pl-10 pr-10"
                    placeholder="Min. 8 characters"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Confirm password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="input pl-10 pr-10"
                    placeholder="Repeat password"
                  />
                  {/* Match indicator */}
                  {confirm && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      {passwordsMatch
                        ? <CheckCircle size={16} className="text-green-400" />
                        : <XCircle    size={16} className="text-red-400" />
                      }
                    </span>
                  )}
                </div>
              </div>

              {/* Strength hints */}
              <div className="flex items-center gap-2 text-xs">
                <span className={`flex items-center gap-1 ${passwordLong ? 'text-green-400' : 'text-gray-500'}`}>
                  <CheckCircle size={11} /> 8+ characters
                </span>
                {confirm && (
                  <span className={`flex items-center gap-1 ${passwordsMatch ? 'text-green-400' : 'text-red-400'}`}>
                    <CheckCircle size={11} /> Passwords match
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !passwordLong || !passwordsMatch}
                className="btn-primary w-full py-3 mt-2"
              >
                {loading ? 'Updating...' : 'Reset password'}
              </button>

              <p className="text-center text-sm text-gray-500 mt-2">
                Remember it?{' '}
                <Link to="/login" className="text-brand-400 hover:text-brand-300">Sign in</Link>
              </p>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
