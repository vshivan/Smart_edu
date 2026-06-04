import { motion } from 'framer-motion';

/**
 * Ana — Cute anime-style AI assistant character
 * Large sparkly eyes, cat ears, soft pastel colors
 */
export default function BotFace({ mood = 'happy', size = 56 }) {
  const isThinking = mood === 'thinking';
  const isExcited  = mood === 'excited';

  return (
    <motion.div
      style={{ width: size, height: size }}
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
        <defs>
          {/* Skin */}
          <radialGradient id="skin" cx="50%" cy="40%" r="60%">
            <stop offset="0%"   stopColor="#fff0f5" />
            <stop offset="100%" stopColor="#ffd6e7" />
          </radialGradient>
          {/* Hair gradient — purple-pink anime */}
          <linearGradient id="hair" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#c084fc" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
          {/* Eye iris gradient */}
          <radialGradient id="iris" cx="35%" cy="30%" r="65%">
            <stop offset="0%"   stopColor="#a78bfa" />
            <stop offset="50%"  stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#4c1d95" />
          </radialGradient>
          {/* Eye shine */}
          <radialGradient id="shine" cx="30%" cy="25%" r="60%">
            <stop offset="0%"   stopColor="#ffffff" stopOpacity="1" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          {/* Blush */}
          <radialGradient id="blush" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#fb7185" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#fb7185" stopOpacity="0" />
          </radialGradient>
          {/* Cheek glow */}
          <radialGradient id="cheek" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#fda4af" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#fda4af" stopOpacity="0" />
          </radialGradient>
          {/* Body gradient */}
          <linearGradient id="body" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#e9d5ff" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
        </defs>

        {/* ── NECK + BODY (uniform bottom) ─────────────────────────── */}
        <rect x="26" y="54" width="12" height="6" rx="2" fill="#ffd6e7" />
        <rect x="16" y="58" width="32" height="6" rx="3" fill="url(#body)" />

        {/* ── CAT EARS ──────────────────────────────────────────────── */}
        {/* Left ear */}
        <path d="M 10 22 L 7 8 L 21 17 Z" fill="url(#hair)" />
        <path d="M 11 20 L 9 11 L 19 17 Z" fill="#f9a8d4" opacity="0.7" />
        {/* Right ear */}
        <path d="M 54 22 L 57 8 L 43 17 Z" fill="url(#hair)" />
        <path d="M 53 20 L 55 11 L 45 17 Z" fill="#f9a8d4" opacity="0.7" />

        {/* ── HAIR — long anime style with bangs ────────────────────── */}
        {/* Back hair */}
        <ellipse cx="32" cy="22" rx="26" ry="18" fill="url(#hair)" />
        {/* Long side hair left */}
        <path d="M 8 26 Q 4 38 7 52 Q 12 48 14 42 Q 12 34 10 28 Z" fill="url(#hair)" />
        {/* Long side hair right */}
        <path d="M 56 26 Q 60 38 57 52 Q 52 48 50 42 Q 52 34 54 28 Z" fill="url(#hair)" />
        {/* Bangs */}
        <path d="M 10 22 Q 14 14 22 16 Q 26 13 32 14 Q 38 13 42 16 Q 50 14 54 22 Q 46 18 32 18 Q 18 18 10 22 Z" fill="url(#hair)" />
        {/* Front bang pieces */}
        <path d="M 16 18 Q 14 24 17 28 Q 19 22 18 18 Z" fill="url(#hair)" />
        <path d="M 22 15 Q 20 22 22 27 Q 25 21 24 15 Z" fill="url(#hair)" />
        <path d="M 42 15 Q 44 22 42 27 Q 39 21 40 15 Z" fill="url(#hair)" />
        <path d="M 48 18 Q 50 24 47 28 Q 45 22 46 18 Z" fill="url(#hair)" />

        {/* Hair highlight */}
        <path d="M 20 15 Q 32 11 44 15 Q 38 13 32 13 Q 26 13 20 15 Z" fill="white" opacity="0.3" />

        {/* ── FACE ──────────────────────────────────────────────────── */}
        <ellipse cx="32" cy="36" rx="20" ry="19" fill="url(#skin)" />

        {/* ── EYEBROWS — thin arched anime style ───────────────────── */}
        <motion.path
          d="M 17 27 Q 21 24.5 25 26"
          stroke="#7c3aed" strokeWidth="1.4" strokeLinecap="round" fill="none"
          animate={isThinking ? { d: "M 17 27 Q 21 25.5 25 26.5" } : {}}
        />
        <motion.path
          d="M 39 26 Q 43 24.5 47 27"
          stroke="#7c3aed" strokeWidth="1.4" strokeLinecap="round" fill="none"
          animate={isThinking ? { d: "M 39 26.5 Q 43 25.5 47 27" } : {}}
        />

        {/* ── LEFT EYE — large anime eye ───────────────────────────── */}
        <ellipse cx="22" cy="33" rx="6.5" ry="7" fill="white" />
        <ellipse cx="22" cy="33.5" rx="5" ry="5.5" fill="url(#iris)" />
        {/* Pupil */}
        <motion.ellipse cx="22" cy="34" rx="2.5" ry="2.8" fill="#1e1b4b"
          animate={{ ry: isThinking ? [2.8, 2.8, 2.8, 0.4, 2.8] : [2.8, 2.8, 2.8, 0.3, 2.8] }}
          transition={{ duration: isThinking ? 2 : 4.5, repeat: Infinity, repeatDelay: isThinking ? 0.5 : 3 }}
        />
        {/* Shine dots */}
        <circle cx="24.5" cy="30.5" r="1.8" fill="url(#shine)" />
        <circle cx="20" cy="35.5" r="0.9" fill="white" opacity="0.7" />
        {/* Lower lash line */}
        <path d="M 16.5 37 Q 22 39 27.5 37" stroke="#c084fc" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.6" />

        {/* ── RIGHT EYE — large anime eye ──────────────────────────── */}
        <ellipse cx="42" cy="33" rx="6.5" ry="7" fill="white" />
        <ellipse cx="42" cy="33.5" rx="5" ry="5.5" fill="url(#iris)" />
        <motion.ellipse cx="42" cy="34" rx="2.5" ry="2.8" fill="#1e1b4b"
          animate={{ ry: isThinking ? [2.8, 2.8, 2.8, 0.4, 2.8] : [2.8, 2.8, 2.8, 0.3, 2.8] }}
          transition={{ duration: isThinking ? 2 : 4.5, repeat: Infinity, repeatDelay: isThinking ? 0.5 : 3, delay: 0.15 }}
        />
        <circle cx="44.5" cy="30.5" r="1.8" fill="url(#shine)" />
        <circle cx="40" cy="35.5" r="0.9" fill="white" opacity="0.7" />
        <path d="M 36.5 37 Q 42 39 47.5 37" stroke="#c084fc" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.6" />

        {/* ── EYE SPARKLES on excited ──────────────────────────────── */}
        {isExcited && <>
          <motion.text x="26" y="27" fontSize="4" fill="#fbbf24"
            animate={{ opacity: [0,1,0], scale:[0.5,1.3,0.5] }}
            transition={{ duration: 0.6, repeat: Infinity }}
            style={{ transformOrigin: '28px 25px' }}
          >✦</motion.text>
          <motion.text x="44" y="27" fontSize="4" fill="#fbbf24"
            animate={{ opacity: [0,1,0], scale:[0.5,1.3,0.5] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
            style={{ transformOrigin: '46px 25px' }}
          >✦</motion.text>
        </>}

        {/* ── NOSE — tiny cute dot ─────────────────────────────────── */}
        <ellipse cx="32" cy="42" rx="1.2" ry="0.8" fill="#f9a8d4" opacity="0.8" />

        {/* ── BLUSH CHEEKS ────────────────────────────────────────── */}
        <ellipse cx="14" cy="41" rx="7" ry="5" fill="url(#cheek)" />
        <ellipse cx="50" cy="41" rx="7" ry="5" fill="url(#cheek)" />

        {/* ── MOUTH ────────────────────────────────────────────────── */}
        {!isThinking && (
          <motion.path
            d={isExcited ? "M 26 46 Q 32 52 38 46" : "M 27 46 Q 32 50 37 46"}
            stroke="#f472b6"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
            animate={isExcited ? {
              d: ["M 26 46 Q 32 52 38 46", "M 25 45 Q 32 53 39 45", "M 26 46 Q 32 52 38 46"]
            } : {}}
            transition={{ duration: 0.7, repeat: isExcited ? Infinity : 0 }}
          />
        )}
        {isThinking && (
          /* Thinking — small wavy mouth */
          <path d="M 28 47 Q 30 46 32 47 Q 34 48 36 47" stroke="#f472b6" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        )}

        {/* ── CUTE FANGS (small) ──────────────────────────────────── */}
        {!isThinking && (
          <>
            <path d="M 29.5 47 L 29 50 L 31 48 Z" fill="white" />
            <path d="M 34.5 47 L 35 50 L 33 48 Z" fill="white" />
          </>
        )}

        {/* ── FLOATING SPARKLES ────────────────────────────────────── */}
        <motion.g
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '5px 12px' }}
        >
          <motion.text x="2" y="14" fontSize="5" fill="#f472b6"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
          >✦</motion.text>
        </motion.g>
        <motion.g
          animate={{ rotate: [360, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '58px 10px' }}
        >
          <motion.text x="55" y="12" fontSize="4" fill="#a78bfa"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: 0.9 }}
          >★</motion.text>
        </motion.g>
        <motion.text x="2" y="52" fontSize="4" fill="#fbbf24"
          animate={{ opacity: [0, 1, 0], y: [52, 48, 52] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1.2 }}
        >♡</motion.text>
      </svg>
    </motion.div>
  );
}
