import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trophy, Zap, Crown } from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

export default function Leaderboard() {
  const { user } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => api.get('/gamification/leaderboard?limit=50').then(r => r.data.data),
    refetchInterval: 30000,
  });

  const entries = data || [];

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
      <div className="flex items-center gap-2">
        <Trophy className="text-yellow-400" size={24} />
        <h1 className="text-2xl font-bold text-white">Global Leaderboard</h1>
      </div>

      {/* Top 3 podium */}
      {entries.length >= 3 && (
        <div className="flex items-end justify-center gap-4 py-6">
          {[entries[1], entries[0], entries[2]].map((e, i) => {
            const rank = i === 0 ? 2 : i === 1 ? 1 : 3;
            const heights = ['h-24', 'h-32', 'h-20'];
            const colors = ['bg-gray-500/20 border-gray-500/30', 'bg-yellow-500/20 border-yellow-500/30', 'bg-orange-500/20 border-orange-500/30'];
            return (
              <div key={rank} className={`flex flex-col items-center gap-2 ${i === 1 ? 'order-2' : i === 0 ? 'order-1' : 'order-3'}`}>
                {rank === 1 && <Crown size={20} className="text-yellow-400" />}
                <div className="w-12 h-12 rounded-full bg-brand-600/20 border-2 border-brand-500/30 flex items-center justify-center font-bold text-white">
                  {e?.user_id?.slice(0, 2).toUpperCase()}
                </div>
                <div className={`w-20 ${heights[i]} ${colors[i]} border rounded-t-xl flex items-center justify-center`}>
                  <span className="text-2xl font-black text-white">#{rank}</span>
                </div>
                <p className="text-xs text-gray-400 flex items-center gap-1"><Zap size={10} className="text-brand-400" />{Math.round(e?.xp || 0)}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Full list */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : entries.map((e, i) => (
          <motion.div
            key={e.user_id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className={`flex items-center gap-4 px-6 py-4 border-b border-surface-border last:border-0 ${e.user_id === user?.id ? 'bg-brand-600/5' : 'hover:bg-surface-hover'} transition-colors`}
          >
            <span className={`w-8 text-center font-bold text-sm ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-400' : 'text-gray-600'}`}>
              #{i + 1}
            </span>
            <div className="w-9 h-9 rounded-full bg-brand-600/20 flex items-center justify-center text-xs font-bold text-brand-400">
              {e.first_name?.[0] || e.user_id?.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-medium">
                {e.first_name ? `${e.first_name} ${e.last_name}` : `User ${e.user_id?.slice(0, 8)}`}
                {e.user_id === user?.id && <span className="ml-2 text-xs text-brand-400">(You)</span>}
              </p>
              <p className="text-gray-500 text-xs">Level {e.level || 1}</p>
            </div>
            <span className="flex items-center gap-1 text-brand-400 font-semibold text-sm">
              <Zap size={13} /> {Math.round(e.xp || 0).toLocaleString()}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
