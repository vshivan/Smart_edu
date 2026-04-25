import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import { Zap } from 'lucide-react';

export default function AuthCallback() {
  const [params] = useSearchParams();
  const { setTokens } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    const refresh = params.get('refresh');
    if (token && refresh) {
      setTokens(token, refresh);
      api.get('/auth/me').then(({ data }) => {
        useAuthStore.setState({ user: data.data });
        const role = data.data.role;
        navigate(role === 'admin' ? '/admin' : role === 'tutor' ? '/tutor/dashboard' : '/dashboard');
      }).catch(() => navigate('/login'));
    } else {
      navigate('/login?error=oauth_failed');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md animate-pulse-soft">
          <Zap size={22} className="text-white" />
        </div>
        <p className="text-text-secondary text-sm font-medium">Completing sign in...</p>
      </div>
    </div>
  );
}
