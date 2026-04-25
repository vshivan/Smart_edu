import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, BookOpen, Zap, Circle, Lock, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function CourseLearn() {
  const { courseId } = useParams();
  const qc = useQueryClient();
  const [activeLesson, setActiveLesson] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => api.get(`/courses/${courseId}`).then(r => r.data.data),
    onSuccess: (data) => {
      // Auto-expand first module and select first lesson
      if (data?.modules?.[0]) {
        setExpandedModules({ [data.modules[0].id]: true });
        if (!activeLesson && data.modules[0].lessons?.[0]) {
          setActiveLesson(data.modules[0].lessons[0]);
        }
      }
    },
  });

  const completeMutation = useMutation({
    mutationFn: (lessonId) => api.post(`/courses/${courseId}/lessons/${lessonId}/complete`),
    onSuccess: (data) => {
      const xp = data?.data?.data?.xp_earned || 10;
      toast.success(`+${xp} XP earned! 🎉`);
      // Refresh course progress + gamification profile
      qc.invalidateQueries(['course', courseId]);
      qc.invalidateQueries(['gamification-profile']);
      qc.invalidateQueries(['enrollments']);
      // Award XP via gamification service
      api.post('/gamification/xp', { amount: xp, reason: 'lesson_complete' }).catch(() => {});
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to mark complete'),
  });

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const lesson = activeLesson;

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] gap-0 -m-6">
      {/* Lesson sidebar */}
      <aside className="w-72 bg-white dark:bg-dark-card border-r border-surface-border dark:border-dark-border overflow-y-auto shrink-0 shadow-sm">
        {/* Course header */}
        <div className="p-4 border-b border-surface-border dark:border-dark-border bg-surface-muted dark:bg-dark-muted">
          <h2 className="font-semibold text-text-primary dark:text-white text-sm line-clamp-2 mb-2">{course?.title}</h2>
          <div className="xp-bar">
            <div className="xp-fill" style={{ width: `${course?.progress_pct || 0}%` }} />
          </div>
          <p className="text-xs text-text-muted mt-1">{Math.round(course?.progress_pct || 0)}% complete</p>
        </div>

        {/* Modules */}
        <div className="p-2">
          {(course?.modules || []).map((mod, mi) => (
            <div key={mod.id} className="mb-1">
              {/* Module header — collapsible */}
              <button
                onClick={() => toggleModule(mod.id)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-text-muted dark:text-slate-500 uppercase tracking-wider hover:text-text-primary dark:hover:text-white hover:bg-surface-hover dark:hover:bg-dark-hover rounded-lg transition-all"
              >
                {expandedModules[mod.id]
                  ? <ChevronDown size={12} />
                  : <ChevronRight size={12} />
                }
                <span className="flex-1 text-left">{mi + 1}. {mod.title}</span>
                <span className="text-[10px] font-normal normal-case">
                  {(mod.lessons || []).filter(l => l?.completed).length}/{(mod.lessons || []).length}
                </span>
              </button>

              {/* Lessons */}
              <AnimatePresence>
                {expandedModules[mod.id] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                  >
                    {(mod.lessons || []).filter(Boolean).map(l => (
                      <button
                        key={l.id}
                        onClick={() => setActiveLesson(l)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all text-left ml-2 ${
                          activeLesson?.id === l.id
                            ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 border border-brand-100 dark:border-brand-800/50'
                            : 'text-text-secondary dark:text-slate-400 hover:text-text-primary dark:hover:text-white hover:bg-surface-hover dark:hover:bg-dark-hover'
                        }`}
                      >
                        {l.completed
                          ? <CheckCircle size={13} className="text-emerald-500 shrink-0" />
                          : <Circle size={13} className="text-slate-300 dark:text-slate-600 shrink-0" />
                        }
                        <span className="flex-1 line-clamp-1 text-xs">{l.title}</span>
                        {l.xp_reward > 0 && (
                          <span className="text-[10px] text-brand-500 font-semibold shrink-0">+{l.xp_reward}</span>
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </aside>

      {/* Content area */}
      <main className="flex-1 overflow-y-auto bg-surface dark:bg-dark-bg">
        {lesson ? (
          <div className="max-w-3xl mx-auto p-8">
            {/* Lesson header */}
            <div className="flex items-start justify-between mb-6 gap-4">
              <div>
                <p className="text-xs text-text-muted dark:text-slate-500 mb-1 font-medium uppercase tracking-wider">
                  {course?.modules?.find(m => m.lessons?.some(l => l.id === lesson.id))?.title}
                </p>
                <h1 className="text-2xl font-bold text-text-primary dark:text-white leading-tight">{lesson.title}</h1>
              </div>
              <button
                onClick={() => completeMutation.mutate(lesson.id)}
                disabled={completeMutation.isPending || lesson.completed}
                className={`flex items-center gap-2 text-sm shrink-0 px-4 py-2.5 rounded-xl font-semibold transition-all ${
                  lesson.completed
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/40 text-emerald-700 dark:text-emerald-400 cursor-default'
                    : 'btn-primary'
                }`}
              >
                {lesson.completed
                  ? <><CheckCircle size={15} /> Completed</>
                  : completeMutation.isPending
                    ? 'Saving...'
                    : <><Zap size={15} /> Mark Complete</>
                }
              </button>
            </div>

            {/* Content */}
            <div className="card dark:bg-dark-card dark:border-dark-border">
              {lesson.content_text ? (
                <div className="text-text-secondary dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">
                  {lesson.content_text}
                </div>
              ) : lesson.content_url ? (
                <div className="aspect-video bg-surface-muted dark:bg-dark-muted rounded-xl flex items-center justify-center border border-surface-border dark:border-dark-border">
                  <div className="text-center">
                    <BookOpen size={36} className="text-text-muted mx-auto mb-2" />
                    <p className="text-text-muted text-sm">Video content</p>
                    <a href={lesson.content_url} target="_blank" rel="noopener noreferrer" className="text-brand-600 text-sm hover:underline mt-1 block">
                      Open resource →
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center py-14">
                  <div className="w-14 h-14 bg-brand-50 dark:bg-brand-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <BookOpen size={24} className="text-brand-500" />
                  </div>
                  <p className="font-medium text-text-primary dark:text-white mb-1">Lesson content</p>
                  <p className="text-text-muted text-sm">Content will appear here once added by the course creator.</p>
                </div>
              )}
            </div>

            {/* XP reward info */}
            {!lesson.completed && lesson.xp_reward > 0 && (
              <div className="mt-4 flex items-center gap-2 text-sm text-text-muted">
                <Zap size={14} className="text-brand-500" />
                Complete this lesson to earn <strong className="text-brand-600">+{lesson.xp_reward} XP</strong>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <BookOpen size={36} className="text-text-muted mx-auto mb-3" />
              <p className="text-text-muted text-sm">Select a lesson from the sidebar to begin</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
