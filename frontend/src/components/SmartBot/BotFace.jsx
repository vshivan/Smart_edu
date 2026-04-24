import { motion } from 'framer-motion';

/**
 * Ana — Clean minimalist professor avatar
 * Simple, friendly, professional
 */
export default function BotFace({ mood = 'happy', size = 56 }) {
  return (
    <motion.div
      style={{ width: size, height: size }}
      animate={{ y: [0, -2, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
        <defs>
          {/* Face gradient */}
          <radialGradient id="faceGrad" cx="50%" cy="45%" r="55%">
            <stop offset="0%"   stopColor="#fff7ed" />
            <stop offset="100%" stopColor="#fed7aa" />
          </radialGradient>
          {/* Blush */}
          <radialGradient id="blush" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#fca5a5" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#fca5a5" stopOpacity="0" />
          </radialGradient>
          {/* Eye */}
          <radialGradient id="eyeGrad" cx="40%" cy="35%" r="60%">
            <stop offset="0%"   stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1e40af" />
          </radialGradient>
        </defs>

        {/* ── FACE CIRCLE ──────────────────────────────────────────────── */}
        <circle cx="32" cy="32" r="30" fill="url(#faceGrad)" />

        {/* ── HAIR — simple bob cut ────────────────────────────────────── */}
        <path d="M 8 28 Q 6 18 32 14 Q 58 18 56 28 Q 50 20 32 18 Q 14 20 8 28 Z" fill="#4a2511" />
        <path d="M 8 28 Q 4 32 6 42 Q 10 36 10 30 Z" fill="#4a2511" />
        <path d="M 56 28 Q 60 32 58 42 Q 54 36 54 30 Z" fill="#4a2511" />

        {/* ── EYEBROWS ─────────────────────────────────────────────────── */}
        <path d="M 18 26 Q 22 24 26 25" stroke="#3b2314" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <path d="M 38 25 Q 42 24 46 26" stroke="#3b2314" strokeWidth="1.8" strokeLinecap="round" fill="none" />

        {/* ── LEFT EYE ─────────────────────────────────────────────────── */}
        <ellipse cx="22" cy="32" rx="5" ry="4.5" fill="white" />
        <motion.ellipse cx="22" cy="32" rx="3.5" ry="3.5" fill="url(#eyeGrad)"
          animate={{ ry: [3.5, 3.5, 3.5, 0.3, 3.5] }}
          transition={{ duration: 5, repeat: Infinity, repeatDelay: 2 }}
        />
        <motion.circle cx="22" cy="32" r="1.8" fill="#1e293b"
          animate={{ cx: [22, 23, 22, 21, 22] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <circle cx="24" cy="30" r="1.2" fill="white" opacity="0.9" />

        {/* ── RIGHT EYE ────────────────────────────────────────────────── */}
        <ellipse cx="42" cy="32" rx="5" ry="4.5" fill="white" />
        <motion.ellipse cx="42" cy="32" rx="3.5" ry="3.5" fill="url(#eyeGrad)"
          animate={{ ry: [3.5, 3.5, 3.5, 0.3, 3.5] }}
          transition={{ duration: 5, repeat: Infinity, repeatDelay: 2, delay: 0.1 }}
        />
        <motion.circle cx="42" cy="32" r="1.8" fill="#1e293b"
          animate={{ cx: [42, 43, 42, 41, 42] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
        />
        <circle cx="44" cy="30" r="1.2" fill="white" opacity="0.9" />

        {/* ── GLASSES (simple thin frames) ─────────────────────────────── */}
        <rect x="15" y="28" width="14" height="10" rx="4" stroke="#78350f" strokeWidth="1.5" fill="none" opacity="0.8" />
        <rect x="35" y="28" width="14" height="10" rx="4" stroke="#78350f" strokeWidth="1.5" fill="none" opacity="0.8" />
        <path d="M 29 33 Q 32 32 35 33" stroke="#78350f" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.8" />

        {/* ── NOSE ─────────────────────────────────────────────────────── */}
        <path d="M 30 38 Q 32 41 34 38" stroke="#d4a574" strokeWidth="1.2" strokeLinecap="round" fill="none" />

        {/* ── CHEEKS ───────────────────────────────────────────────────── */}
        <ellipse cx="16" cy="40" rx="6" ry="4.5" fill="url(#blush)" />
        <ellipse cx="48" cy="40" rx="6" ry="4.5" fill="url(#blush)" />

        {/* ── MOUTH ────────────────────────────────────────────────────── */}
        {mood !== 'thinking' && (
          <motion.path d="M 24 46 Q 32 51 40 46" stroke="#e07070" strokeWidth="2" strokeLinecap="round" fill="none"
            animate={mood === 'excited' ? { d: ['M 24 46 Q 32 51 40 46', 'M 23 45 Q 32 53 41 45', 'M 24 46 Q 32 51 40 46'] } : {}}
            transition={{ duration: 0.8, repeat: mood === 'excited' ? Infinity : 0 }}
          />
        )}
        {mood === 'thinking' && (
          <path d="M 26 47 Q 32 48 38 47" stroke="#d4a574" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        )}

        {/* ── BOOK ICON (professor symbol) ─────────────────────────────── */}
        <g opacity="0.9">
          <rect x="50" y="48" width="10" height="8" rx="1" fill="#6366f1" />
          <line x1="50" y1="52" x2="60" y2="52" stroke="white" strokeWidth="0.5" />
          <line x1="50" y1="54" x2="60" y2="54" stroke="white" strokeWidth="0.5" />
        </g>

        {/* ── SPARKLE ──────────────────────────────────────────────────── */}
        <motion.text x="8" y="18" fontSize="6" fill="#fbbf24"
          animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
          style={{ transformOrigin: '11px 15px' }}
        >✦</motion.text>
        <motion.text x="52" y="16" fontSize="5" fill="#93c5fd"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
        >✦</motion.text>
      </svg>
    </motion.div>
  );
}
