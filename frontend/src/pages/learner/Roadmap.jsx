import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Lock, CheckCircle, Star, Zap, Trophy } from 'lucide-react';
import api from '../../lib/api';
import XPBar from '../../components/XPBar';

const NodeStatus = { LOCKED: 'locked', ACTIVE: 'active', COMPLETED: 'completed' };

const RoadmapNode = ({ level, status, icon }) => {
  const isLocked    = status === NodeStatus.LOCKED;
  const isDone      = status === NodeStatus.COMPLETED;
  const isActive    = status === NodeStatus.ACTIVE;

  return (
    <motion.div
      whileHover={!isLocked ? { scale: 1.08 } : {}}
      className={`relative w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all select-none ${
        isDone   ? 'bg-emerald-50 border-emerald-400 shadow-md shadow-emerald-100' :
        isActive ? 'bg-brand-50 border-brand-400 shadow-md shadow-brand-100' :
                   'bg-slate-50 border-slate-200 opacity-50'
      }`}
    >
      {isLocked  && <Lock size={18} className="text-slate-400" />}
      {isDone    && <span className="text-2xl">{icon}</span>}
      {isActive  && <span className="text-2xl">{icon}</span>}
      <span className={`text-[10px] font-bold ${isDone ? 'text-emerald-600' : isActive ? 'text-brand-600' : 'text-slate-400'}`}>
        Lv.{level}
      </span>
      {isActive && (
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 bg-brand-500 rounded-full border-2 border-white"
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
      )}
    </motion.div>
  );
};

const levels = [
  { level: 1,  title: 'Novice',      xp: 0,    icon: '🌱' },
  { level: 2,  title: 'Explorer',    xp: 100,  icon: '🔍' },
  { level: 3,  title: 'Learner',     xp: 300,  icon: '📚' },
  { level: 4,  title: 'Scholar',     xp: 600,  icon: '🎓' },
  { level: 5,  title: 'Expert',      xp: 1000, icon: '⚡' },
  { level: 6,  title: 'Master',      xp: 1500, icon: '🏆' },
  { level: 7,  title: 'Champion',    xp: 2200, icon: '👑' },
  { level: 8,  title: 'Legend',      xp: 3000, icon: '🌟' },
  { level: 9,  title: 'Grandmaster', xp: 4000, icon: '💎' },
  { level: 10, title: 'Sage',        xp: 5500, icon: '🔮' },
];

export default function Roadmap() {
  const { data: profile } = useQuery({
    queryKey: ['gamification-profile'],
    queryFn: () => api.get('/gamification/profile').then(r => r.data.data),
  });

  const currentLevel = profile?.level || 1;
  const currentXP    = profile?.xp_total || 0;
  const nextLevel    = levels.find(l => l.level === currentLevel + 1);

  const getStatus = (lvl) => {
    if (lvl < currentLevel) return NodeStatus.COMPLETED;
    if (lvl === currentLevel) return NodeStatus.ACTIVE;
    return NodeStatus.LOCKED;
  };

  const rows = [];
  for (let i = 0; i < levels.length; i += 4) rows.push(levels.slice(i, i + 4));

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <Trophy size={22} className="text-amber-500" /> Learning Roadmap
        </h1>
        <p className="page-subtitle">Unlock levels by earning XP through lessons, quizzes, and streaks</p>
      </div>

      {/* Current status card */}
      <div className="card border-brand-200 bg-gradient-to-r from-brand-50 to-violet-50">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-bold text-text-primary">
              Level {currentLevel} — <span className="text-brand-600">{levels[currentLevel - 1]?.title}</span>
            </p>
            <p className="text-text-muted text-sm mt-0.5">
              {nextLevel ? `${nextLevel.xp - currentXP} XP to Level ${nextLevel.level}` : 'Max level reached! 🎉'}
            </p>
          </div>
          <span className="text-4xl">{levels[currentLevel - 1]?.icon}</span>
        </div>
        {nextLevel && (
          <XPBar current={currentXP - levels[currentLevel - 1].xp} max={nextLevel.xp - levels[currentLevel - 1].xp} showLabel={false} />
        )}
      </div>

      {/* Skill tree */}
      <div className="card">
        <div className="space-y-8">
          {rows.map((row, rowIdx) => (
            <div key={rowIdx}>
              <div className={`flex items-center gap-4 justify-center ${rowIdx % 2 === 1 ? 'flex-row-reverse' : ''}`}>
                {row.map((lvl, i) => (
                  <div key={lvl.level} className="flex items-center gap-4">
                    <div className="flex flex-col items-center gap-1.5">
                      <RoadmapNode level={lvl.level} status={getStatus(lvl.level)} icon={lvl.icon} />
                      <div className="text-center">
                        <p className="text-xs font-semibold text-text-secondary">{lvl.title}</p>
                        <p className="text-[10px] text-text-muted flex items-center gap-0.5 justify-center">
                          <Zap size={8} />{lvl.xp.toLocaleString()} XP
                        </p>
                      </div>
                    </div>
                    {i < row.length - 1 && (
                      <div className={`w-8 h-0.5 rounded-full ${getStatus(lvl.level) === NodeStatus.COMPLETED ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                    )}
                  </div>
                ))}
              </div>
              {rowIdx < rows.length - 1 && (
                <div className="flex justify-center mt-4">
                  <div className={`w-0.5 h-6 rounded-full ${getStatus(row[rowIdx % 2 === 0 ? row.length - 1 : 0].level) === NodeStatus.COMPLETED ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
