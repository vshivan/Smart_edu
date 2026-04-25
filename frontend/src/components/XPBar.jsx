import { motion } from 'framer-motion';

export default function XPBar({ current, max, showLabel = true }) {
  const pct = Math.min(100, Math.round((current / Math.max(max, 1)) * 100));

  return (
    <div>
      {showLabel && (
        <div className="flex justify-between text-xs text-text-muted mb-1.5">
          <span className="font-medium">{current.toLocaleString()} XP</span>
          <span>{max.toLocaleString()} XP</span>
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
