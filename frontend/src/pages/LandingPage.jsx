import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Brain, Trophy, Users, Star, ArrowRight, CheckCircle } from 'lucide-react';

const features = [
  { icon: Brain,  title: 'AI Course Generation',  desc: 'Input any subject — get a full structured course with modules, quizzes, and learning paths in seconds.' },
  { icon: Trophy, title: 'Gamified Learning',      desc: 'Earn XP, unlock badges, maintain streaks, and climb the leaderboard. Learning feels like a game.' },
  { icon: Users,  title: 'Expert Tutor Marketplace', desc: 'Book 1-on-1 sessions with verified tutors. Real-time chat, scheduling, and session management.' },
  { icon: Zap,    title: 'Adaptive AI Tutor',      desc: 'Context-aware AI chat tutor that knows your course, answers doubts, and adjusts to your level.' },
];

const stats = [
  { value: '50K+', label: 'Active Learners' },
  { value: '2K+',  label: 'Expert Tutors' },
  { value: '10K+', label: 'AI Courses' },
  { value: '98%',  label: 'Satisfaction Rate' },
];

export default function LandingPage() {
  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-600/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 bg-brand-600/10 border border-brand-500/20 text-brand-400 text-sm font-semibold px-4 py-2 rounded-full mb-6">
                <Zap size={14} /> AI-Powered Learning Platform
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6"
            >
              Learn Smarter with{' '}
              <span className="bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent">
                AI-Powered
              </span>{' '}
              Education
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto"
            >
              Generate personalized courses, earn XP, chat with an AI tutor, and book expert sessions — all in one platform.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link to="/register" className="btn-primary text-base px-8 py-4 flex items-center gap-2 justify-center">
                Start Learning Free <ArrowRight size={18} />
              </Link>
              <Link to="/courses" className="btn-secondary text-base px-8 py-4 flex items-center gap-2 justify-center">
                Browse Courses
              </Link>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20"
          >
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-extrabold text-white">{value}</p>
                <p className="text-gray-500 text-sm mt-1">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-surface-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Everything you need to master any skill</h2>
            <p className="text-gray-400 text-lg">Built for the next generation of learners</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="card hover:border-brand-500/30 transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-brand-600/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-600/20 transition-colors">
                  <Icon size={22} className="text-brand-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to level up your skills?</h2>
          <p className="text-gray-400 text-lg mb-8">Join thousands of learners already on their AI-powered journey.</p>
          <Link to="/register" className="btn-primary text-base px-10 py-4 inline-flex items-center gap-2">
            Get Started — It's Free <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
