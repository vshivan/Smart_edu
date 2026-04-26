import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Flame, Trophy, BookOpen, Zap, ArrowRight, Clock,
  Target, Star, TrendingUp, Play, CheckCircle, Award
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import XPBar from '../../components/XPBar';

const StatCard = ({ icon: Icon, label, value, color, bg, trend }) => (
  <motion.div whileHover={{ y: -2 }} className="card flex items-center gap-4 cursor-default">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg} shrink-0`}>
      <Icon size={22} className={color} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-2xl font-bold text-text-primary dark:text-white">{value}</p>
      <p className="text-text-muted text-xs font-medium">{label}</p>
    </div>
    {trend && (
      <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full shrink-0">
        {trend}
      </span>
    )}
  </motion.div>
);

const DAILY_GOALS = [5, 10, 15, 20];

export default function Dashboard() {
  const { user } = useAuthStore();
  const [dailyGoal, setDailyGoal] = useState(() => parseInt(localStorage.getItem('daily_goal') || '10'));
  const [showGoalPicker, setShowGoalPicker] = useState(false);

  // Auto-check streak on dashboard load
  useEffect(() => {
    api.post('/gamification/streak').catch(() => {});
  }, []);

  const { data: profile } = useQuery({
    queryKey: ['gamification-profile'],
    queryFn: () => api.get('/gamification/profile').then(r => r.data.data),
  });

  const { data: enrollments } = useQuery({
    queryKey: ['enrollments'],
    queryFn: () => api.get('/users/learner/progress').then(r => r.data.data),
  });

  const setGoal = (g) => {
    setDailyGoal(g);
    localStorage.setItem('daily_goal', g);
    setShowGoalPicker(false);
  };

  const inProgressCourses = (enrollments || []).filter(e => e.progress_pct > 0 && e.progress_pct < 100);
  const completedCourses  = (enrollments || []).filter(e => e.progress_pct === 100);

  return (
    <div className="space-y-6 animate-slide-up">

      {/* ── Welcome header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">
            {getGreeting()}, {user?.first_name}! {getGreetingEmoji()}
          </h1>
          <p className="page-subtitle mt-1">
            {profile?.streak_days > 0
              ? `🔥 ${profile.streak_days}-day streak — you're on fire!`
              : 'Start learning today to build your streak.'}
          </p>
        </div>
        <Link to="/generate" className="btn-primary flex items-center gap-2 text-sm shrink-0">
          <Zap size={15} /> New Course
        </Link>
      </div>

      {/* ── Daily goal banner ──────────────────────────────────────────── */}
      <div className="card bg-gradient-to-r from-brand-50 to-violet-50 dark:from-brand-900/20 dark:to-violet-900/20 border-brand-200 dark:border-brand-800/50">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/40 rounded-xl flex items-center justify-center">
              <Target size={18} className="text-brand-600" />
            </div>
            <div>
              <p className="font-semibold text-text-primary dark:text-white text-sm">Daily Goal</p>
              <p className="text-text-muted text-xs">{dailyGoal} minutes of learning per day</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowGoalPicker(!showGoalPicker)}
                className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:text-brand-700 border border-brand-200 dark:border-brand-700/50 px-3 py-1.5 rounded-lg bg-white dark:bg-dark-card transition-all"
              >
                Change goal
              </button>
              {showGoalPicker && (
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-xl shadow-card-lg z-10 overflow-hidden">
                  {DAILY_GOALS.map(g => (
                    <button
                      key={g}
                      onClick={() => setGoal(g)}
                      className={`w-full px-4 py-2.5 text-sm text-left hover:bg-surface-hover dark:hover:bg-dark-hover transition-colors ${
                        dailyGoal === g ? 'text-brand-600 font-semibold bg-brand-50 dark:bg-brand-900/20' : 'text-text-secondary dark:text-slate-400'
                      }`}
                    >
                      {g} min/day {g === 10 ? '(recommended)' : ''}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Zap}      label="Total XP"    value={(profile?.xp_total || 0).toLocaleString()} color="text-brand-600"   bg="bg-brand-50 dark:bg-brand-900/30"   trend="+25 today" />
        <StatCard icon={Trophy}   label="Level"       value={`${profile?.level || 1} — ${profile?.level_info?.title || 'Novice'}`} color="text-amber-600" bg="bg-amber-50 dark:bg-amber-900/30" />
        <StatCard icon={Flame}    label="Day Streak"  value={`${profile?.streak_days || 0} days`}       color="text-orange-500"  bg="bg-orange-50 dark:bg-orange-900/30" />
        <StatCard icon={BookOpen} label="Courses"     value={`${inProgressCourses.length} active`}      color="text-emerald-600" bg="bg-emerald-50 dark:bg-emerald-900/30" />
      </div>

      {/* ── XP Progress ────────────────────────────────────────────────── */}
      {profile && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold text-text-primary dark:text-white text-sm">
                Level {profile.level} — <span className="text-brand-600">{profile.level_info?.title}</span>
              </p>
              <p className="text-text-muted text-xs mt-0.5">
                {profile.xp_to_next_level > 0
                  ? `${profile.xp_to_next_level} XP to Level ${profile.level + 1}`
                  : 'Maximum level reached! 🎉'}
              </p>
            </div>
            <div className="text-right">
              <span className="badge-brand text-xs">{(profile.xp_total || 0).toLocaleString()} XP</span>
              {completedCourses.length > 0 && (
                <p className="text-xs text-text-muted mt-1">{completedCourses.length} course{completedCourses.length > 1 ? 's' : ''} completed</p>
              )}
            </div>
          </div>
          <XPBar current={profile.xp_total} max={profile.xp_total + (profile.xp_to_next_level || 100)} />
        </div>
      )}

      {/* ── Quick actions ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { to: '/generate',    icon: Zap,          label: 'Generate Course',  color: 'text-brand-600',   bg: 'bg-brand-50 dark:bg-brand-900/20',   border: 'border-brand-200 dark:border-brand-800/50' },
          { to: '/chat',        icon: Star,          label: 'Ask AI Tutor',     color: 'text-violet-600',  bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-200 dark:border-violet-800/50' },
          { to: '/roadmap',     icon: TrendingUp,    label: 'View Roadmap',     color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800/50' },
          { to: '/achievements',icon: Award,         label: 'Achievements',     color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-900/20',   border: 'border-amber-200 dark:border-amber-800/50' },
        ].map(({ to, icon: Icon, label, color, bg, border }) => (
          <Link
            key={to}
            to={to}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border ${border} ${bg} hover:shadow-card-md transition-all text-center group`}
          >
            <Icon size={20} className={`${color} group-hover:scale-110 transition-transform`} />
            <span className={`text-xs font-semibold ${color}`}>{label}</span>
          </Link>
        ))}
      </div>

      {/* ── Continue Learning ───────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Continue Learning</h2>
          <Link to="/courses" className="text-brand-600 text-sm hover:text-brand-700 flex items-center gap-1 font-medium">
            Browse all <ArrowRight size={14} />
          </Link>
        </div>

        {enrollments?.length ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrollments.slice(0, 6).map((e, i) => (
              <motion.div
                key={e.course_id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -2 }}
                className="card-hover group"
              >
                <Link to={`/learn/${e.course_id}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-brand-50 dark:bg-brand-900/30 rounded-xl flex items-center justify-center border border-brand-100 dark:border-brand-800/50">
                      {e.progress_pct === 100
                        ? <CheckCircle size={18} className="text-emerald-500" />
                        : <BookOpen size={18} className="text-brand-600" />
                      }
                    </div>
                    <div className="flex items-center gap-2">
                      {e.progress_pct === 100 && (
                        <span className="badge-green text-[10px]">✓ Done</span>
                      )}
                      <span className="text-xs font-semibold text-text-muted">{Math.round(e.progress_pct)}%</span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-text-primary dark:text-white text-sm mb-1 line-clamp-2">{e.title}</h3>
                  <p className="text-xs text-text-muted capitalize mb-3">{e.difficulty} · {e.estimated_hours}h</p>
                  <div className="xp-bar">
                    <div className="xp-fill" style={{ width: `${e.progress_pct}%` }} />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-text-muted flex items-center gap-1">
                      <Clock size={10} /> {e.last_active || 'Recently enrolled'}
                    </span>
                    <span className="text-xs text-brand-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <Play size={10} /> Continue
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-16 border-dashed">
            <div className="w-16 h-16 bg-brand-50 dark:bg-brand-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen size={28} className="text-brand-500" />
            </div>
            <p className="font-bold text-text-primary dark:text-white mb-1 text-lg">No courses yet</p>
            <p className="text-text-muted text-sm mb-6 max-w-xs mx-auto">
              Generate your first AI-powered course in seconds. Just pick a subject and let AI do the rest.
            </p>
            <Link to="/generate" className="btn-primary inline-flex items-center gap-2 text-sm">
              <Zap size={15} /> Generate My First Course
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getGreetingEmoji() {
  const h = new Date().getHours();
  if (h < 12) return '☀️';
  if (h < 17) return '👋';
  return '🌙';
}
