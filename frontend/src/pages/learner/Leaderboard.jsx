import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trophy, Zap, Crown, Medal } from 'lucide-react';
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

  const rankStyle = (i) => {
    if (i === 0) return { text: 'text-amber-500', bg: 'bg-amber-50 border-amber-200' };
    if (i === 1) return { text: 'text-slate-500', bg: 'bg-slate-50 border-slate-200' };
    if (i === 2) return { text: 'text-orange-500', bg: 'bg-orange-50 border-orange-200' };
    return { text: 'text-text-muted', bg: '' };
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
      <div className="flex items-center gap-2">
        <Trophy size={22} className="text-amber-500" />
        <h1 className="page-title">Global Leaderboard</h1>
      </div>

      {/* Top 3 podium */}
      {entries.length >= 3 && (
        <div className="card bg-gradient-to-b from-amber-50 to-white border-amber-100">
          <div className="flex items-end justify-center gap-6 py-4">
            {[
              { entry: entries[1], rank: 2, height: 'h-20', icon: <Medal size={18} className="text-slate-400" /> },
              { entry: entries[0], rank: 1, height: 'h-28', icon: <Crown size={20} className="text-amber-500" /> },
              { entry: entries[2], rank: 3, height: 'h-16', icon: <Medal size={18} className="text-orange-400" /> },
            ].map(({ entry, rank, height, icon }) => (
              <div key={rank} className="flex flex-col items-center gap-2">
                <div className="mb-1">{icon}</div>
                <div className="w-11 h-11 rounded-full bg-brand-100 border-2 border-brand-200 flex items-center justify-center text-sm font-bold text-brand-700">
                  {entry?.first_name?.[0] || entry?.user_id?.slice(0, 2).toUpperCase()}
                </div>
                <p className="text-xs font-semibold text-text-primary text-center max-w-[60px] truncate">
                  {entry?.first_name || `User`}
                </p>
                <div className={`w-16 ${height} ${rank === 1 ? 'bg-amber-100 border-amber-300' : rank === 2 ? 'bg-slate-100 border-slate-300' : 'bg-orange-100 border-orange-300'} border rounded-t-xl flex items-center justify-center`}>
                  <span className="text-xl font-black text-text-primary">#{rank}</span>
                </div>
                <p className="text-xs text-text-muted flex items-center gap-0.5">
                  <Zap size={9} className="text-brand-500" />{Math.round(entry?.xp || 0).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full list */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-text-muted text-sm">Loading rankings...</div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-text-muted text-sm">No entries yet. Start earning XP!</div>
        ) : entries.map((e, i) => {
          const style = rankStyle(i);
          const isMe = e.user_id === user?.id;
          return (
            <motion.div
              key={e.user_id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              className={`flex items-center gap-4 px-5 py-3.5 border-b border-surface-border last:border-0 transition-colors ${
                isMe ? 'bg-brand-50' : 'hover:bg-surface-hover'
              }`}
            >
              <span className={`w-7 text-center font-bold text-sm ${style.text}`}>
                #{i + 1}
              </span>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border ${
                isMe ? 'bg-brand-100 border-brand-200 text-brand-700' : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}>
                {e.first_name?.[0] || e.user_id?.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-text-primary text-sm font-medium">
                  {e.first_name ? `${e.first_name} ${e.last_name || ''}`.trim() : `User ${e.user_id?.slice(0, 8)}`}
                  {isMe && <span className="ml-2 text-xs text-brand-600 font-semibold">(You)</span>}
                </p>
                <p className="text-text-muted text-xs">Level {e.level || 1}</p>
              </div>
              <span className="flex items-center gap-1 text-brand-600 font-bold text-sm">
                <Zap size={12} /> {Math.round(e.xp || 0).toLocaleString()}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
