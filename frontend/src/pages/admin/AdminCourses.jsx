import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Trash2, BookOpen, Search } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Course Management</h1>
        <span className="badge bg-purple-600/10 text-purple-400 border border-purple-500/20">{data?.pagination?.total || 0} courses</span>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9 py-2" placeholder="Search courses..." />
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-surface-border">
            <tr>
              {['Course', 'Creator', 'Type', 'Enrolled', 'Rating', 'Actions'].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-500">Loading...</td></tr>
            ) : courses.map(c => (
              <tr key={c.id} className="hover:bg-surface-hover transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-brand-600/20 rounded-lg flex items-center justify-center">
                      <BookOpen size={16} className="text-brand-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium line-clamp-1 max-w-[200px]">{c.title}</p>
                      <p className="text-gray-500 text-xs capitalize">{c.difficulty}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-400 text-sm">{c.creator_name || 'Unknown'}</td>
                <td className="px-6 py-4">
                  <span className={`badge text-xs ${c.creator_type === 'ai' ? 'bg-brand-600/10 text-brand-400 border border-brand-500/20' : 'bg-green-600/10 text-green-400 border border-green-500/20'}`}>
                    {c.creator_type === 'ai' ? '🤖 AI' : '👨‍🏫 Tutor'}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-400 text-sm">{c.total_enrolled || 0}</td>
                <td className="px-6 py-4">
                  <span className="flex items-center gap-1 text-yellow-400 text-sm">
                    <Star size={13} fill="currentColor" /> {parseFloat(c.rating || 0).toFixed(1)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => featureMutation.mutate({ id: c.id, featured: !c.is_featured })}
                      className={`text-xs px-2 py-1 rounded-lg border transition-all ${c.is_featured ? 'bg-yellow-600/10 border-yellow-500/20 text-yellow-400' : 'border-surface-border text-gray-500 hover:text-yellow-400'}`}
                    >
                      {c.is_featured ? '★ Featured' : '☆ Feature'}
                    </button>
                    <button onClick={() => { if (confirm('Delete this course?')) deleteMutation.mutate(c.id); }} className="text-red-400 hover:text-red-300 p-1">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
