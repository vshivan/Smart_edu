import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Brain, Trophy, Users, ArrowRight, CheckCircle, Star, BookOpen } from 'lucide-react';

const features = [
  { icon: Brain,  title: 'AI Course Generation',     desc: 'Input any subject — get a full structured course with modules, quizzes, and learning paths in seconds.', color: 'bg-violet-50 text-violet-600 border-violet-100' },
  { icon: Trophy, title: 'Gamified Learning',         desc: 'Earn XP, unlock badges, maintain streaks, and climb the leaderboard. Learning feels like a game.',       color: 'bg-amber-50 text-amber-600 border-amber-100' },
  { icon: Users,  title: 'Expert Tutor Marketplace',  desc: 'Book 1-on-1 sessions with verified tutors. Real-time chat, scheduling, and session management.',         color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  { icon: Zap,    title: 'Adaptive AI Tutor',         desc: 'Context-aware AI chat tutor that knows your course, answers doubts, and adjusts to your level.',         color: 'bg-blue-50 text-blue-600 border-blue-100' },
];

const stats = [
  { value: '50K+', label: 'Active Learners' },
  { value: '2K+',  label: 'Expert Tutors' },
  { value: '10K+', label: 'AI Courses' },
  { value: '98%',  label: 'Satisfaction Rate' },
];

const perks = [
  'Generate personalized courses with AI',
  'Earn XP and level up as you learn',
  'Book sessions with verified tutors',
  'Track progress with detailed analytics',
];

export default function LandingPage() {
  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-brand-50 via-white to-white pt-20 pb-24">
        {/* Decorative blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-100 rounded-full blur-3xl opacity-60" />
          <div className="absolute top-20 -left-20 w-72 h-72 bg-violet-100 rounded-full blur-3xl opacity-40" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <span className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 text-brand-700 text-sm font-semibold px-4 py-2 rounded-full mb-6">
                <Zap size={14} /> AI-Powered Learning Platform
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-text-primary leading-tight mb-6 tracking-tight"
            >
              Learn Smarter with{' '}
              <span className="bg-gradient-to-r from-brand-600 to-violet-600 bg-clip-text text-transparent">
                AI-Powered
              </span>{' '}
              Education
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="text-xl text-text-secondary mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Generate personalized courses, earn XP, chat with an AI tutor, and book expert sessions — all in one platform.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <Link to="/register" className="btn-primary text-base px-8 py-3.5 flex items-center gap-2 justify-center shadow-md shadow-brand-200">
                Start Learning Free <ArrowRight size={18} />
              </Link>
              <Link to="/courses" className="btn-secondary text-base px-8 py-3.5 flex items-center gap-2 justify-center">
                <BookOpen size={18} /> Browse Courses
              </Link>
            </motion.div>

            {/* Perks */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-8"
            >
              {perks.map(p => (
                <span key={p} className="flex items-center gap-1.5 text-sm text-text-secondary">
                  <CheckCircle size={14} className="text-emerald-500 shrink-0" /> {p}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20"
          >
            {stats.map(({ value, label }) => (
              <div key={label} className="bg-white rounded-2xl border border-surface-border p-6 text-center shadow-card">
                <p className="text-3xl font-extrabold text-text-primary">{value}</p>
                <p className="text-text-muted text-sm mt-1">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-text-primary mb-4 tracking-tight">Everything you need to master any skill</h2>
            <p className="text-text-secondary text-lg">Built for the next generation of learners</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map(({ icon: Icon, title, desc, color }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="card hover:shadow-card-md hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 border ${color}`}>
                  <Icon size={20} />
                </div>
                <h3 className="font-semibold text-text-primary mb-2">{title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-16 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name: 'Sarah K.', role: 'Software Engineer', text: 'Generated a full React course in 30 seconds. The AI tutor helped me understand every concept.', stars: 5 },
              { name: 'Marcus T.', role: 'Data Scientist', text: 'The gamification keeps me motivated. I\'ve maintained a 45-day streak and leveled up to Expert!', stars: 5 },
              { name: 'Priya M.', role: 'Product Manager', text: 'Booked a session with a tutor who helped me ace my PM interview. Worth every penny.', stars: 5 },
            ].map((r, i) => (
              <motion.div
                key={r.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="card"
              >
                <div className="flex gap-0.5 mb-3">
                  {[...Array(r.stars)].map((_, j) => <Star key={j} size={14} fill="#f59e0b" className="text-amber-400" />)}
                </div>
                <p className="text-text-secondary text-sm leading-relaxed mb-4">"{r.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-sm font-bold text-brand-700">
                    {r.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{r.name}</p>
                    <p className="text-xs text-text-muted">{r.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-brand-600 to-brand-700">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">Ready to level up your skills?</h2>
          <p className="text-brand-200 text-lg mb-8">Join thousands of learners already on their AI-powered journey.</p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold text-base px-10 py-4 rounded-xl hover:bg-brand-50 transition-all shadow-lg">
            Get Started — It's Free <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-surface-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-brand-500 to-brand-700 rounded-md flex items-center justify-center">
              <Zap size={12} className="text-white" />
            </div>
            <span className="font-bold text-text-primary text-sm">SmartEduLearn</span>
          </div>
          <p className="text-text-muted text-sm">© 2026 SmartEduLearn. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
