import { Bell, Flame } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export default function TopBar() {
  const { user } = useAuthStore();

  const { data: notifs } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data.data),
    refetchInterval: 30000,
  });

  const unread = notifs?.filter(n => !n.is_read).length || 0;

  return (
    <header className="h-16 bg-surface-card border-b border-surface-border flex items-center px-6 gap-4">
      <div className="flex-1" />

      {/* Streak */}
      {user?.role === 'learner' && (
        <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full">
          <Flame size={14} className="text-orange-400" />
          <span className="text-orange-400 text-sm font-semibold">{user.streak || 0}</span>
        </div>
      )}

      {/* Notifications */}
      <button className="relative p-2 text-gray-400 hover:text-white hover:bg-surface-hover rounded-xl transition-all">
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-sm font-bold text-white">
        {user?.first_name?.[0]}{user?.last_name?.[0]}
      </div>
    </header>
  );
}
