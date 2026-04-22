import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trophy, Lock } from 'lucide-react';
import api from '../../lib/api';

export default function Achievements() {
  const { data: profile } = useQuery({
    queryKey: ['gamification-profile'],
    queryFn: () => api.get('/gamification/profile').then(r => r.data.data),
  });

  const { data: allBadges } = useQuery({
    queryKey: ['all-badges'],
    queryFn: () => api.get('/gamification/badges').then(r => r.data.data),
  });

  const earnedIds = new Set((profile?.badges || []).filter(Boolean).map(b => b?.badge?.id));

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex items-center gap-2">
        <Trophy className="text-yellow-400" size={24} />
        <h1 className="text-2xl font-bold text-white">Achievements</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {(allBadges || []).map((badge, i) => {
          const earned = earnedIds.has(badge.id);
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`card text-center transition-all ${earned ? 'border-yellow-500/30 bg-yellow-500/5' : 'opacity-50'}`}
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 text-3xl ${earned ? 'bg-yellow-500/20' : 'bg-surface-border'}`}>
                {earned ? '🏆' : <Lock size={24} className="text-gray-600" />}
              </div>
              <p className={`font-semibold text-sm ${earned ? 'text-white' : 'text-gray-500'}`}>{badge.name}</p>
              <p className="text-xs text-gray-500 mt-1">{badge.description}</p>
              {earned && badge.xp_value > 0 && (
                <span className="badge bg-yellow-600/10 text-yellow-400 border border-yellow-500/20 text-xs mt-2">+{badge.xp_value} XP</span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
