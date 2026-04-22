import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, BookOpen, Lock, ChevronRight, Zap } from 'lucide-react';
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
    <div className="flex h-[calc(100vh-8rem)] gap-0 -m-6">
      {/* Sidebar */}
      <aside className="w-72 bg-surface-card border-r border-surface-border overflow-y-auto shrink-0">
        <div className="p-4 border-b border-surface-border">
          <h2 className="font-semibold text-white text-sm line-clamp-2">{course?.title}</h2>
          <div className="xp-bar mt-2">
            <div className="xp-fill" style={{ width: `${course?.progress_pct || 0}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-1">{Math.round(course?.progress_pct || 0)}% complete</p>
        </div>

        <div className="p-2">
          {(course?.modules || []).map((mod, mi) => (
            <div key={mod.id} className="mb-2">
              <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <span>{mi + 1}. {mod.title}</span>
              </div>
              {(mod.lessons || []).filter(Boolean).map(l => (
                <button
                  key={l.id}
                  onClick={() => setActiveLesson(l)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all text-left ${
                    activeLesson?.id === l.id ? 'bg-brand-600/20 text-brand-400' : 'text-gray-400 hover:text-white hover:bg-surface-hover'
                  }`}
                >
                  <CheckCircle size={14} className={l.completed ? 'text-green-400' : 'text-gray-600'} />
                  <span className="flex-1 line-clamp-1">{l.title}</span>
                  <ChevronRight size={12} className="text-gray-600" />
                </button>
              ))}
            </div>
          ))}
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {lesson ? (
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-white">{lesson.title}</h1>
              <button
                onClick={() => completeMutation.mutate(lesson.id)}
                disabled={completeMutation.isPending}
                className="btn-primary flex items-center gap-2"
              >
                <Zap size={16} /> Mark Complete
              </button>
            </div>

            <div className="card prose prose-invert max-w-none">
              {lesson.content_text ? (
                <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">{lesson.content_text}</div>
              ) : lesson.content_url ? (
                <div className="aspect-video bg-surface rounded-xl flex items-center justify-center">
                  <BookOpen size={40} className="text-gray-600" />
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen size={40} className="mx-auto mb-3 text-gray-600" />
                  <p>Content will appear here</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a lesson to begin
          </div>
        )}
      </main>
    </div>
  );
}
