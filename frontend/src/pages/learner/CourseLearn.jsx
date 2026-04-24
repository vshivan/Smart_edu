import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, BookOpen, ChevronRight, Zap, Circle } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function CourseLearn() {
  const { courseId } = useParams();
  const qc = useQueryClient();
  const [activeLesson, setActiveLesson] = useState(null);

  const { data: course } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => api.get(`/courses/${courseId}`).then(r => r.data.data),
  });

  const completeMutation = useMutation({
    mutationFn: (lessonId) => api.post(`/courses/${courseId}/lessons/${lessonId}/complete`),
    onSuccess: (data) => {
      toast.success(`+${data.data.data.xp_earned} XP earned!`);
      qc.invalidateQueries(['course', courseId]);
    },
  });

  const lesson = activeLesson || course?.modules?.[0]?.lessons?.[0];

  return (
    <div className="flex h-[calc(100vh-3.5rem)] gap-0 -m-6">
      {/* Lesson sidebar */}
      <aside className="w-72 bg-white border-r border-surface-border overflow-y-auto shrink-0 shadow-sm">
        <div className="p-4 border-b border-surface-border bg-surface-muted">
          <h2 className="font-semibold text-text-primary text-sm line-clamp-2">{course?.title}</h2>
          <div className="xp-bar mt-2.5">
            <div className="xp-fill" style={{ width: `${course?.progress_pct || 0}%` }} />
          </div>
          <p className="text-xs text-text-muted mt-1">{Math.round(course?.progress_pct || 0)}% complete</p>
        </div>

        <div className="p-2">
          {(course?.modules || []).map((mod, mi) => (
            <div key={mod.id} className="mb-1">
              <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
                {mi + 1}. {mod.title}
              </div>
              {(mod.lessons || []).filter(Boolean).map(l => (
                <button
                  key={l.id}
                  onClick={() => setActiveLesson(l)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all text-left ${
                    activeLesson?.id === l.id
                      ? 'bg-brand-50 text-brand-700 border border-brand-100'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                  }`}
                >
                  {l.completed
                    ? <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                    : <Circle size={14} className="text-slate-300 shrink-0" />
                  }
                  <span className="flex-1 line-clamp-1 text-xs">{l.title}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </aside>

      {/* Content area */}
      <main className="flex-1 overflow-y-auto bg-surface">
        {lesson ? (
          <div className="max-w-3xl mx-auto p-8">
            <div className="flex items-start justify-between mb-6 gap-4">
              <h1 className="text-2xl font-bold text-text-primary leading-tight">{lesson.title}</h1>
              <button
                onClick={() => completeMutation.mutate(lesson.id)}
                disabled={completeMutation.isPending || lesson.completed}
                className={`btn-primary flex items-center gap-2 text-sm shrink-0 ${lesson.completed ? 'bg-emerald-600 hover:bg-emerald-600 cursor-default' : ''}`}
              >
                {lesson.completed
                  ? <><CheckCircle size={15} /> Completed</>
                  : <><Zap size={15} /> Mark Complete</>
                }
              </button>
            </div>

            <div className="card">
              {lesson.content_text ? (
                <div className="text-text-secondary leading-relaxed whitespace-pre-wrap text-sm">{lesson.content_text}</div>
              ) : lesson.content_url ? (
                <div className="aspect-video bg-surface-muted rounded-xl flex items-center justify-center border border-surface-border">
                  <BookOpen size={36} className="text-text-muted" />
                </div>
              ) : (
                <div className="text-center py-14">
                  <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <BookOpen size={24} className="text-brand-500" />
                  </div>
                  <p className="font-medium text-text-primary mb-1">Lesson content</p>
                  <p className="text-text-muted text-sm">Content will appear here once added by the course creator.</p>
                </div>
              )}
            </div>
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
