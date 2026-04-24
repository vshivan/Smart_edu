import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { BookOpen, Clock, Users, Star, Lock, CheckCircle, ArrowRight } from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const difficultyStyle = { beginner: 'badge-green', intermediate: 'badge-yellow', advanced: 'badge-red' };

export default function CourseDetail() {
  const { id } = useParams();
  const { token } = useAuthStore();
  const navigate = useNavigate();

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: () => api.get(`/courses/${id}`).then(r => r.data.data),
  });

  const enrollMutation = useMutation({
    mutationFn: () => api.post(`/courses/${id}/enroll`),
    onSuccess: () => { toast.success('Enrolled!'); navigate(`/learn/${id}`); },
    onError: (e) => toast.error(e.response?.data?.message || 'Enrollment failed'),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!course) return <div className="text-center text-text-muted py-20">Course not found</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <span className={`${difficultyStyle[course.difficulty] || 'badge-gray'} mb-3`}>{course.difficulty}</span>
            <h1 className="text-3xl font-bold text-text-primary mt-2 mb-3 tracking-tight">{course.title}</h1>
            <p className="text-text-secondary leading-relaxed">{course.description}</p>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-text-muted">
            <span className="flex items-center gap-1.5"><Clock size={14} /> {course.estimated_hours}h estimated</span>
            <span className="flex items-center gap-1.5"><Users size={14} /> {course.total_enrolled} enrolled</span>
            <span className="flex items-center gap-1.5 text-amber-500"><Star size={14} fill="currentColor" /> {parseFloat(course.rating || 0).toFixed(1)}</span>
          </div>

          {/* Modules */}
          <div>
            <h2 className="section-title mb-4">Course Content</h2>
            <div className="space-y-3">
              {(course.modules || []).map((mod, i) => (
                <div key={mod.id} className="card p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-7 h-7 bg-brand-50 border border-brand-100 rounded-lg flex items-center justify-center text-brand-600 text-xs font-bold">{i + 1}</span>
                    <h3 className="font-semibold text-text-primary text-sm">{mod.title}</h3>
                    {mod.is_locked && !course.is_enrolled && <Lock size={13} className="text-text-muted ml-auto" />}
                  </div>
                  <div className="space-y-1">
                    {(mod.lessons || []).filter(Boolean).map(lesson => (
                      <div key={lesson.id} className="flex items-center gap-2 text-sm text-text-secondary py-1.5 border-t border-surface-border first:border-0">
                        <BookOpen size={12} className="text-text-muted shrink-0" />
                        <span className="flex-1">{lesson.title}</span>
                        <span className="text-xs text-text-muted">{lesson.duration_min}min</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="card sticky top-24 shadow-card-md">
            <div className="w-full h-36 bg-gradient-to-br from-brand-50 to-violet-50 rounded-xl mb-4 flex items-center justify-center border border-brand-100">
              <BookOpen size={36} className="text-brand-500" />
            </div>
            <p className="text-2xl font-bold text-text-primary mb-1">
              {course.is_free ? <span className="text-emerald-600">Free</span> : `$${course.price}`}
            </p>
            {course.is_enrolled ? (
              <div>
                <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium mb-3">
                  <CheckCircle size={15} /> Already enrolled
                </div>
                <button onClick={() => navigate(`/learn/${id}`)} className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2">
                  Continue Learning <ArrowRight size={15} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => token ? enrollMutation.mutate() : navigate('/login')}
                disabled={enrollMutation.isPending}
                className="btn-primary w-full py-2.5 text-sm mt-2"
              >
                {enrollMutation.isPending ? 'Enrolling...' : 'Enroll Now'}
              </button>
            )}
            <p className="text-xs text-text-muted text-center mt-3">Full lifetime access</p>
          </div>
        </div>
      </div>
    </div>
  );
}
