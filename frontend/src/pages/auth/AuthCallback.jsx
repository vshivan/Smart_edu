import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';

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
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Completing sign in...</p>
      </div>
    </div>
  );
}
