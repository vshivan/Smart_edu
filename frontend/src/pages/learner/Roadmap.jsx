import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Lock, CheckCircle, Star, Zap, Trophy } from 'lucide-react';
import api from '../../lib/api';
import { LEVELS } from '../../lib/constants';

const NodeStatus = { LOCKED: 'locked', ACTIVE: 'active', COMPLETED: 'completed' };

const RoadmapNode = ({ level, status, title, xp_required, current_xp, onClick }) => {
  const isLocked = status === NodeStatus.LOCKED;
  const isDone = status === NodeStatus.COMPLETED;
  const isActive = status === NodeStatus.ACTIVE;

  return (
    <motion.button
      whileHover={!isLocked ? { scale: 1.05 } : {}}
      whileTap={!isLocked ? { scale: 0.95 } : {}}
      onClick={!isLocked ? onClick : undefined}
      className={`relative w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${
        isDone   ? 'bg-green-600/20 border-green-500 shadow-lg shadow-green-500/20' :
        isActive ? 'bg-brand-600/20 border-brand-500 shadow-lg shadow-brand-500/30 animate-glow' :
                   'bg-surface-card border-surface-border opacity-50 cursor-not-allowed'
      }`}
    >
      {isLocked && <Lock size={20} className="text-gray-600" />}
      {isDone   && <CheckCircle size={20} className="text-green-400" />}
      {isActive && <Star size={20} className="text-brand-400" />}
      <span className={`text-xs font-bold ${isDone ? 'text-green-400' : isActive ? 'text-brand-400' : 'text-gray-600'}`}>
        Lv.{level}
      </span>
      {isActive && (
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 bg-brand-500 rounded-full"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
      )}
    </motion.button>
  );
};

export default function Roadmap() {
  const { data: profile } = useQuery({
    queryKey: ['gamification-profile'],
    queryFn: () => api.get('/gamification/profile').then(r => r.data.data),
  });

  const currentLevel = profile?.level || 1;
  const currentXP = profile?.xp_total || 0;

  const levels = [
    { level: 1, title: 'Novice',      xp: 0,    icon: '🌱' },
    { level: 2, title: 'Explorer',    xp: 100,  icon: '🔍' },
    { level: 3, title: 'Learner',     xp: 300,  icon: '📚' },
    { level: 4, title: 'Scholar',     xp: 600,  icon: '🎓' },
    { level: 5, title: 'Expert',      xp: 1000, icon: '⚡' },
    { level: 6, title: 'Master',      xp: 1500, icon: '🏆' },
    { level: 7, title: 'Champion',    xp: 2200, icon: '👑' },
    { level: 8, title: 'Legend',      xp: 3000, icon: '🌟' },
    { level: 9, title: 'Grandmaster', xp: 4000, icon: '💎' },
    { level: 10, title: 'Sage',       xp: 5500, icon: '🔮' },
  ];

  const getStatus = (lvl) => {
    if (lvl < currentLevel) return NodeStatus.COMPLETED;
    if (lvl === currentLevel) return NodeStatus.ACTIVE;
    return NodeStatus.LOCKED;
  };

  // Arrange in a snake pattern
  const rows = [];
  for (let i = 0; i < levels.length; i += 3) {
    rows.push(levels.slice(i, i + 3));
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Trophy className="text-yellow-400" size={24} /> Learning Roadmap
        </h1>
        <p className="text-gray-400 mt-1">Your skill progression journey — unlock levels by earning XP</p>
      </div>

      {/* Current status */}
      <div className="card border-brand-500/30 bg-brand-600/5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-brand-400 font-semibold">Current Level: {currentLevel} — {levels[currentLevel - 1]?.title}</p>
            <p className="text-gray-400 text-sm mt-0.5">{currentXP} XP earned</p>
          </div>
          <div className="text-4xl">{levels[currentLevel - 1]?.icon}</div>
        </div>
      </div>

      {/* Skill tree */}
      <div className="card">
        <div className="space-y-8">
          {rows.map((row, rowIdx) => (
            <div key={rowIdx}>
              <div className={`flex items-center gap-6 justify-center ${rowIdx % 2 === 1 ? 'flex-row-reverse' : ''}`}>
                {row.map((lvl, i) => (
                  <div key={lvl.level} className="flex items-center gap-6">
                    <div className="flex flex-col items-center gap-2">
                      <RoadmapNode
                        level={lvl.level}
                        status={getStatus(lvl.level)}
                        title={lvl.title}
                        xp_required={lvl.xp}
                        current_xp={currentXP}
                      />
                      <div className="text-center">
                        <p className="text-xs font-medium text-gray-300">{lvl.title}</p>
                        <p className="text-[10px] text-gray-600 flex items-center gap-0.5 justify-center">
                          <Zap size={9} />{lvl.xp} XP
                        </p>
                      </div>
                    </div>
                    {i < row.length - 1 && (
                      <div className={`w-12 h-0.5 ${getStatus(lvl.level) === NodeStatus.COMPLETED ? 'bg-green-500' : 'bg-surface-border'}`} />
                    )}
                  </div>
                ))}
              </div>
              {rowIdx < rows.length - 1 && (
                <div className="flex justify-center mt-4">
                  <div className={`w-0.5 h-8 ${getStatus(row[rowIdx % 2 === 0 ? row.length - 1 : 0].level) === NodeStatus.COMPLETED ? 'bg-green-500' : 'bg-surface-border'}`} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
