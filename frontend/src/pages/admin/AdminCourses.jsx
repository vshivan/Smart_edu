import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Trash2, BookOpen, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function AdminCourses() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-courses', page, search],
    queryFn: () => api.get(`/admin/courses?page=${page}&limit=20`).then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/courses/${id}`),
    onSuccess: () => { toast.success('Course deleted'); qc.invalidateQueries(['admin-courses']); },
  });

  const featureMutation = useMutation({
    mutationFn: ({ id, featured }) => api.put(`/admin/courses/${id}/feature`, { featured }),
    onSuccess: () => { toast.success('Updated'); qc.invalidateQueries(['admin-courses']); },
  });

  const courses = data?.data || [];
  const pagination = data?.pagination || {};

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Course Management</h1>
          <p className="page-subtitle">{pagination.total || 0} total courses</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" placeholder="Search courses..." />
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-border bg-surface-muted">
              {['Course', 'Creator', 'Type', 'Enrolled', 'Rating', 'Actions'].map(h => (
                <th key={h} className="table-header">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-12 text-text-muted text-sm">Loading...</td></tr>
            ) : courses.map(c => (
              <tr key={c.id} className="table-row">
                <td className="table-cell">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-brand-50 border border-brand-100 rounded-xl flex items-center justify-center shrink-0">
                      <BookOpen size={15} className="text-brand-600" />
                    </div>
                    <div>
                      <p className="text-text-primary text-sm font-medium line-clamp-1 max-w-[200px]">{c.title}</p>
                      <p className="text-text-muted text-xs capitalize">{c.difficulty}</p>
                    </div>
                  </div>
                </td>
                <td className="table-cell text-text-secondary">{c.creator_name || 'Unknown'}</td>
                <td className="table-cell">
                  <span className={`badge text-xs ${c.creator_type === 'ai' ? 'badge-brand' : 'badge-green'}`}>
                    {c.creator_type === 'ai' ? '🤖 AI' : '👨‍🏫 Tutor'}
                  </span>
                </td>
                <td className="table-cell text-text-secondary">{c.total_enrolled || 0}</td>
                <td className="table-cell">
                  <span className="flex items-center gap-1 text-amber-500 text-sm font-medium">
                    <Star size={12} fill="currentColor" /> {parseFloat(c.rating || 0).toFixed(1)}
                  </span>
                </td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => featureMutation.mutate({ id: c.id, featured: !c.is_featured })}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all ${
                        c.is_featured
                          ? 'bg-amber-50 border-amber-200 text-amber-700'
                          : 'bg-white border-surface-border text-text-muted hover:border-amber-300 hover:text-amber-600'
                      }`}
                    >
                      {c.is_featured ? '★ Featured' : '☆ Feature'}
                    </button>
                    <button
                      onClick={() => { if (confirm('Delete this course?')) deleteMutation.mutate(c.id); }}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-text-muted text-sm">Page {pagination.page || 1} of {pagination.totalPages || 1}</p>
        <div className="flex gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary py-2 px-3 text-sm">
            <ChevronLeft size={15} />
          </button>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= (pagination.totalPages || 1)} className="btn-secondary py-2 px-3 text-sm">
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
