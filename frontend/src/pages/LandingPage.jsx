import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap, Brain, Trophy, Users, ArrowRight, CheckCircle,
  Star, BookOpen, Flame, Target, Clock, Shield,
  TrendingUp, Award, MessageSquare, Play
} from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI Course Generation',
    desc: 'Type any subject — get a full course with modules, lessons, and quizzes in under 30 seconds.',
    color: 'bg-violet-50 text-violet-600 border-violet-100',
    stat: '30 sec',
    statLabel: 'avg generation time',
  },
  {
    icon: Trophy,
    title: 'Gamified Learning',
    desc: 'Earn XP, unlock badges, maintain streaks, and climb the leaderboard. Learning feels like a game.',
    color: 'bg-amber-50 text-amber-600 border-amber-100',
    stat: '10 levels',
    statLabel: 'to master',
  },
  {
    icon: Users,
    title: 'Expert Tutors',
    desc: 'Book 1-on-1 sessions with verified tutors. Real-time scheduling and session management.',
    color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    stat: '2K+',
    statLabel: 'verified tutors',
  },
  {
    icon: MessageSquare,
    title: 'AI Tutor Chat',
    desc: 'Context-aware AI that knows your course, answers doubts, and adapts to your learning style.',
    color: 'bg-blue-50 text-blue-600 border-blue-100',
    stat: '24/7',
    statLabel: 'always available',
  },
];

const stats = [
  { value: '50K+', label: 'Active Learners',  icon: Users },
  { value: '2K+',  label: 'Expert Tutors',    icon: Award },
  { value: '10K+', label: 'AI Courses',        icon: BookOpen },
  { value: '98%',  label: 'Satisfaction Rate', icon: Star },
];

const howItWorks = [
  { step: '01', title: 'Choose a subject',    desc: 'Pick any topic — programming, design, business, science, or anything else.',  icon: Target },
  { step: '02', title: 'AI builds your course', desc: 'Gemini AI generates a full curriculum with modules, lessons, and quizzes.',   icon: Brain },
  { step: '03', title: 'Learn & earn XP',     desc: 'Complete lessons, pass quizzes, and earn XP to level up your profile.',        icon: Zap },
  { step: '04', title: 'Get certified',       desc: 'Finish the course and download your completion certificate.',                  icon: Award },
];

const testimonials = [
  { name: 'Sarah K.',   role: 'Software Engineer',  text: 'Generated a full React course in 30 seconds. The AI tutor helped me understand every concept.', stars: 5, avatar: 'S' },
  { name: 'Marcus T.',  role: 'Data Scientist',      text: "The gamification keeps me motivated. I've maintained a 45-day streak and leveled up to Expert!", stars: 5, avatar: 'M' },
  { name: 'Priya M.',   role: 'Product Manager',     text: 'Booked a session with a tutor who helped me ace my PM interview. Worth every penny.',           stars: 5, avatar: 'P' },
];

const perks = [
  'No credit card required',
  'Cancel anytime',
  'Free forever plan',
  'AI-powered personalization',
];

// Floating particle background for hero
const particles = Array.from({ length: 12 }, (_, i) => ({
  id: i, x: Math.random() * 100, y: Math.random() * 100,
  size: Math.random() * 6 + 3, duration: Math.random() * 10 + 8, delay: Math.random() * 5,
}));

export default function LandingPage() {
  return (
    <div className="overflow-hidden bg-white dark:bg-dark-bg">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-slate-50 via-white to-brand-50 dark:from-dark-bg dark:via-dark-card dark:to-dark-bg overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-brand-100/40 dark:bg-brand-900/10 rounded-full blur-3xl"
            animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 10, repeat: Infinity }} />
          <motion.div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-violet-100/40 dark:bg-violet-900/10 rounded-full blur-3xl"
            animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 12, repeat: Infinity, delay: 2 }} />
          {particles.map(p => (
            <motion.div key={p.id} className="absolute rounded-full bg-brand-300/20 dark:bg-brand-500/10"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
              animate={{ y: [-15, 15, -15], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: p.duration, repeat: Infinity, delay: p.delay }} />
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left — copy */}
            <div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <span className="inline-flex items-center gap-2 bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-700/50 text-brand-700 dark:text-brand-300 text-sm font-semibold px-4 py-2 rounded-full mb-6">
                  <Zap size={14} /> AI-Powered Learning Platform
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
                className="text-5xl sm:text-6xl font-extrabold text-text-primary dark:text-white leading-tight mb-6 tracking-tight"
              >
                Learn anything with{' '}
                <span className="bg-gradient-to-r from-brand-600 to-violet-600 bg-clip-text text-transparent">
                  AI as your tutor
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg text-text-secondary dark:text-slate-400 mb-8 leading-relaxed max-w-lg"
              >
                Generate personalized courses in seconds, earn XP as you learn, and get help from AI or expert tutors — all in one place.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-3 mb-8"
              >
                <Link to="/register" className="btn-primary text-base px-8 py-4 flex items-center gap-2 justify-center shadow-lg shadow-brand-200/50">
                  Start Learning Free <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="btn-secondary text-base px-8 py-4 flex items-center gap-2 justify-center">
                  <Play size={16} /> See how it works
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-x-5 gap-y-2"
              >
                {perks.map(p => (
                  <span key={p} className="flex items-center gap-1.5 text-sm text-text-secondary dark:text-slate-400">
                    <CheckCircle size={14} className="text-emerald-500 shrink-0" /> {p}
                  </span>
                ))}
              </motion.div>
            </div>

            {/* Right — dashboard preview card */}
            <motion.div
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
              className="hidden lg:block"
            >
              <div className="bg-white dark:bg-dark-card rounded-3xl shadow-2xl border border-surface-border dark:border-dark-border p-6 space-y-4">
                {/* Mock dashboard header */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-text-primary dark:text-white">Welcome back, Alex! 👋</p>
                    <p className="text-xs text-text-muted">You're on a 12-day streak 🔥</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 px-3 py-1.5 rounded-full">
                    <Flame size={13} className="text-amber-500" />
                    <span className="text-amber-600 dark:text-amber-400 text-xs font-bold">12 days</span>
                  </div>
                </div>

                {/* XP bar */}
                <div className="bg-surface-muted dark:bg-dark-muted rounded-xl p-4">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="font-semibold text-text-primary dark:text-white">Level 5 — Expert</span>
                    <span className="text-brand-600 font-bold">1,240 XP</span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-dark-border rounded-full overflow-hidden">
                    <motion.div className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full"
                      initial={{ width: 0 }} animate={{ width: '68%' }} transition={{ duration: 1.5, delay: 0.8 }} />
                  </div>
                  <p className="text-xs text-text-muted mt-1">260 XP to Level 6</p>
                </div>

                {/* Course cards */}
                {[
                  { title: 'Python for Data Science', progress: 72, color: 'bg-blue-500' },
                  { title: 'React Advanced Patterns',  progress: 45, color: 'bg-violet-500' },
                ].map(c => (
                  <div key={c.title} className="flex items-center gap-3 p-3 bg-surface-muted dark:bg-dark-muted rounded-xl">
                    <div className={`w-9 h-9 ${c.color} rounded-lg flex items-center justify-center shrink-0`}>
                      <BookOpen size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-text-primary dark:text-white truncate">{c.title}</p>
                      <div className="h-1.5 bg-slate-200 dark:bg-dark-border rounded-full mt-1.5 overflow-hidden">
                        <div className={`h-full ${c.color} rounded-full`} style={{ width: `${c.progress}%` }} />
                      </div>
                    </div>
                    <span className="text-xs text-text-muted shrink-0">{c.progress}%</span>
                  </div>
                ))}

                {/* Badges row */}
                <div className="flex items-center gap-2">
                  <p className="text-xs text-text-muted">Recent badges:</p>
                  {['🔥', '🏆', '⚡', '🎯'].map(b => (
                    <span key={b} className="w-8 h-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-lg flex items-center justify-center text-sm">{b}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16"
          >
            {stats.map(({ value, label, icon: Icon }) => (
              <div key={label} className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-sm rounded-2xl border border-surface-border dark:border-dark-border p-5 text-center shadow-card">
                <Icon size={20} className="text-brand-500 mx-auto mb-2" />
                <p className="text-2xl font-extrabold text-text-primary dark:text-white">{value}</p>
                <p className="text-text-muted text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section className="py-24 bg-surface dark:bg-dark-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-brand-600 text-sm font-semibold uppercase tracking-wider">Simple process</span>
            <h2 className="text-4xl font-bold text-text-primary dark:text-white mt-2 mb-3 tracking-tight">From zero to certified in 4 steps</h2>
            <p className="text-text-secondary dark:text-slate-400 text-lg max-w-2xl mx-auto">No setup, no waiting. Start learning in under a minute.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map(({ step, title, desc, icon: Icon }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="relative"
              >
                {i < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-brand-200 to-transparent dark:from-brand-800 z-0" />
                )}
                <div className="bg-white dark:bg-dark-card rounded-2xl border border-surface-border dark:border-dark-border p-6 relative z-10 hover:shadow-card-md transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-black text-brand-400 dark:text-brand-600">{step}</span>
                    <div className="w-10 h-10 bg-brand-50 dark:bg-brand-900/30 rounded-xl flex items-center justify-center border border-brand-100 dark:border-brand-800/50">
                      <Icon size={18} className="text-brand-600" />
                    </div>
                  </div>
                  <h3 className="font-bold text-text-primary dark:text-white mb-2">{title}</h3>
                  <p className="text-text-secondary dark:text-slate-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white dark:bg-dark-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-brand-600 text-sm font-semibold uppercase tracking-wider">Everything you need</span>
            <h2 className="text-4xl font-bold text-text-primary dark:text-white mt-2 mb-3 tracking-tight">Built for serious learners</h2>
            <p className="text-text-secondary dark:text-slate-400 text-lg">Every feature designed to keep you engaged and progressing.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map(({ icon: Icon, title, desc, color, stat, statLabel }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="card hover:shadow-card-md hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 border ${color} group-hover:scale-110 transition-transform`}>
                  <Icon size={20} />
                </div>
                <h3 className="font-bold text-text-primary dark:text-white mb-2">{title}</h3>
                <p className="text-text-secondary dark:text-slate-400 text-sm leading-relaxed mb-4">{desc}</p>
                <div className="pt-3 border-t border-surface-border dark:border-dark-border">
                  <span className="text-lg font-extrabold text-text-primary dark:text-white">{stat}</span>
                  <span className="text-xs text-text-muted ml-1">{statLabel}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-surface dark:bg-dark-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text-primary dark:text-white tracking-tight">Loved by learners worldwide</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((r, i) => (
              <motion.div
                key={r.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="card hover:shadow-card-md transition-all"
              >
                <div className="flex gap-0.5 mb-3">
                  {[...Array(r.stars)].map((_, j) => <Star key={j} size={14} fill="#f59e0b" className="text-amber-400" />)}
                </div>
                <p className="text-text-secondary dark:text-slate-400 text-sm leading-relaxed mb-5">"{r.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-sm font-bold text-white">
                    {r.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary dark:text-white">{r.name}</p>
                    <p className="text-xs text-text-muted">{r.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-br from-brand-600 via-brand-700 to-violet-700 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-violet-400/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">Start your learning journey today</h2>
            <p className="text-brand-200 text-lg mb-8">Join 50,000+ learners. Free forever. No credit card needed.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register" className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold text-base px-10 py-4 rounded-xl hover:bg-brand-50 transition-all shadow-lg">
                Get Started Free <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-base px-8 py-4 rounded-xl transition-all border border-white/20">
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="bg-white dark:bg-dark-card border-t border-surface-border dark:border-dark-border py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center shadow-sm">
                <Zap size={15} className="text-white" />
              </div>
              <div>
                <span className="font-bold text-text-primary dark:text-white">SmartEduLearn</span>
                <p className="text-xs text-text-muted">AI-Powered Learning Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-text-muted">
              <span className="flex items-center gap-1.5"><Shield size={13} /> Secure & Private</span>
              <span className="flex items-center gap-1.5"><TrendingUp size={13} /> Always improving</span>
            </div>
            <p className="text-text-muted text-sm">© 2026 SmartEduLearn. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
