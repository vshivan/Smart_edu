import { motion } from 'framer-motion';

export default function XPBar({ current, max, showLabel = true }) {
  const pct = Math.min(100, Math.round((current / Math.max(max, 1)) * 100));

  return (
    <div>
      {showLabel && (
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{current} XP</span>
          <span>{max} XP</span>
        </div>
      )}
      <div className="xp-bar">
        <motion.div
          className="xp-fill"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
