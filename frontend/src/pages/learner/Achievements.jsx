import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trophy, Lock, Zap } from 'lucide-react';
import api from '../../lib/api';

export default function Achievements() {
  const { data: profile } = useQuery({
    queryKey: ['gamification-profile'],
    queryFn: () => api.get('/gamification/profile').then(r => r.data.data),
  });

  const earnedBadges = (profile?.badges || []).filter(Boolean).map(b => b?.badge).filter(Boolean);
  const earnedIds = new Set(earnedBadges.map(b => b.id));

  // Show earned badges + placeholder locked ones
  const placeholderBadges = [
    { id: 'streak-7',   name: '7-Day Streak',    description: 'Log in 7 days in a row',       icon: '🔥', xp_value: 50 },
    { id: 'streak-30',  name: '30-Day Streak',   description: 'Log in 30 days in a row',      icon: '⚡', xp_value: 200 },
    { id: 'first-quiz', name: 'Quiz Master',     description: 'Pass your first quiz',          icon: '🎯', xp_value: 50 },
    { id: 'level-5',    name: 'Expert',          description: 'Reach Level 5',                icon: '🏆', xp_value: 100 },
    { id: 'level-10',   name: 'Sage',            description: 'Reach the maximum level',      icon: '🔮', xp_value: 500 },
    { id: 'perfect',    name: 'Perfect Score',   description: 'Get 100% on a quiz',           icon: '💯', xp_value: 100 },
    { id: 'course-1',   name: 'Course Complete', description: 'Complete your first course',   icon: '📚', xp_value: 150 },
    { id: 'course-5',   name: 'Bookworm',        description: 'Complete 5 courses',           icon: '🎓', xp_value: 300 },
  ];

  const allBadges = [
    ...earnedBadges,
    ...placeholderBadges.filter(p => !earnedIds.has(p.id)),
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Trophy size={22} className="text-amber-500" /> Achievements
          </h1>
          <p className="page-subtitle">{earnedBadges.length} of {allBadges.length} badges earned</p>
        </div>
        {earnedBadges.length > 0 && (
          <span className="badge-yellow">{earnedBadges.length} earned</span>
        )}
      </div>

      {/* XP from badges */}
      {earnedBadges.length > 0 && (
        <div className="card bg-amber-50 border-amber-200 flex items-center gap-4 py-4">
          <div className="w-10 h-10 bg-amber-100 border border-amber-200 rounded-xl flex items-center justify-center">
            <Zap size={18} className="text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-text-primary text-sm">
              {earnedBadges.reduce((sum, b) => sum + (b.xp_value || 0), 0)} XP from badges
            </p>
            <p className="text-text-muted text-xs">Keep earning to unlock more</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {allBadges.map((badge, i) => {
          const earned = earnedIds.has(badge.id);
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className={`card text-center transition-all ${
                earned
                  ? 'border-amber-200 bg-amber-50/50 shadow-card-md'
                  : 'opacity-60 border-dashed'
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 text-3xl ${
                earned ? 'bg-amber-100 border border-amber-200' : 'bg-slate-100 border border-slate-200'
              }`}>
                {earned ? badge.icon || '🏆' : <Lock size={22} className="text-slate-400" />}
              </div>
              <p className={`font-semibold text-sm ${earned ? 'text-text-primary' : 'text-text-muted'}`}>
                {badge.name}
              </p>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">{badge.description}</p>
              {badge.xp_value > 0 && (
                <span className={`${earned ? 'badge-yellow' : 'badge-gray'} text-xs mt-2`}>
                  +{badge.xp_value} XP
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
