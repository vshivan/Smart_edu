import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { BookOpen, Clock, Users, Star, CheckCircle, Lock } from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

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

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!course) return <div className="text-center text-gray-400 py-20">Course not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <span className={`badge text-xs mb-3 ${course.difficulty === 'beginner' ? 'bg-green-600/10 text-green-400 border border-green-500/20' : 'bg-yellow-600/10 text-yellow-400 border border-yellow-500/20'}`}>{course.difficulty}</span>
            <h1 className="text-3xl font-bold text-white mb-3">{course.title}</h1>
            <p className="text-gray-400">{course.description}</p>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1.5"><Clock size={15} /> {course.estimated_hours}h</span>
            <span className="flex items-center gap-1.5"><Users size={15} /> {course.total_enrolled} enrolled</span>
            <span className="flex items-center gap-1.5 text-yellow-400"><Star size={15} fill="currentColor" /> {parseFloat(course.rating || 0).toFixed(1)}</span>
          </div>

          {/* Modules */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Course Content</h2>
            <div className="space-y-3">
              {(course.modules || []).map((mod, i) => (
                <div key={mod.id} className="card">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-7 h-7 bg-brand-600/20 rounded-lg flex items-center justify-center text-brand-400 text-xs font-bold">{i + 1}</span>
                    <h3 className="font-medium text-white">{mod.title}</h3>
                    {mod.is_locked && !course.is_enrolled && <Lock size={14} className="text-gray-500 ml-auto" />}
                  </div>
                  <div className="space-y-1.5">
                    {(mod.lessons || []).filter(Boolean).map(lesson => (
                      <div key={lesson.id} className="flex items-center gap-2 text-sm text-gray-400 py-1">
                        <BookOpen size={13} />
                        <span className="flex-1">{lesson.title}</span>
                        <span className="text-xs text-gray-600">{lesson.duration_min}min</span>
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
          <div className="card sticky top-24">
            <div className="w-full h-40 bg-gradient-to-br from-brand-600/20 to-purple-600/20 rounded-xl mb-4 flex items-center justify-center">
              <BookOpen size={40} className="text-brand-400" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">{course.is_free ? 'Free' : `$${course.price}`}</p>
            {course.is_enrolled ? (
              <button onClick={() => navigate(`/learn/${id}`)} className="btn-primary w-full py-3 mt-3">Continue Learning</button>
            ) : (
              <button onClick={() => token ? enrollMutation.mutate() : navigate('/login')} disabled={enrollMutation.isPending} className="btn-primary w-full py-3 mt-3">
                {enrollMutation.isPending ? 'Enrolling...' : 'Enroll Now'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
