import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Ban, UserCheck, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [banModal, setBanModal] = useState(null);
  const [banReason, setBanReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search, role],
    queryFn: () => api.get(`/admin/users?page=${page}&limit=20&search=${search}&role=${role}`).then(r => r.data),
    keepPreviousData: true,
  });

  const banMutation = useMutation({
    mutationFn: ({ id, reason }) => api.put(`/admin/users/${id}/ban`, { reason }),
    onSuccess: () => { toast.success('User banned'); qc.invalidateQueries(['admin-users']); setBanModal(null); setBanReason(''); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const unbanMutation = useMutation({
    mutationFn: (id) => api.put(`/admin/users/${id}/unban`),
    onSuccess: () => { toast.success('User unbanned'); qc.invalidateQueries(['admin-users']); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const users = data?.data || [];
  const pagination = data?.pagination || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <span className="badge bg-blue-600/10 text-blue-400 border border-blue-500/20">{pagination.total || 0} total</span>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="input pl-9 py-2" placeholder="Search users..." />
        </div>
        <select value={role} onChange={e => { setRole(e.target.value); setPage(1); }} className="input py-2 w-36">
          <option value="">All Roles</option>
          <option value="learner">Learner</option>
          <option value="tutor">Tutor</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-surface-border">
            <tr>
              {['User', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-500">Loading...</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-surface-hover transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-600/20 flex items-center justify-center text-xs font-bold text-brand-400">
                      {u.first_name?.[0]}{u.last_name?.[0]}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{u.first_name} {u.last_name}</p>
                      <p className="text-gray-500 text-xs">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`badge capitalize ${
                    u.role === 'admin'  ? 'bg-red-600/10 text-red-400 border border-red-500/20' :
                    u.role === 'tutor'  ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20' :
                                         'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                  }`}>{u.role}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`badge ${u.is_banned ? 'bg-red-600/10 text-red-400 border border-red-500/20' : 'bg-green-600/10 text-green-400 border border-green-500/20'}`}>
                    {u.is_banned ? 'Banned' : 'Active'}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-400 text-sm">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  {u.role !== 'admin' && (
                    u.is_banned ? (
                      <button onClick={() => unbanMutation.mutate(u.id)} className="flex items-center gap-1.5 text-green-400 hover:text-green-300 text-xs font-medium">
                        <UserCheck size={14} /> Unban
                      </button>
                    ) : (
                      <button onClick={() => setBanModal(u)} className="flex items-center gap-1.5 text-red-400 hover:text-red-300 text-xs font-medium">
                        <Ban size={14} /> Ban
                      </button>
                    )
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-gray-400 text-sm">Page {pagination.page} of {pagination.totalPages}</p>
        <div className="flex gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary py-2 px-3"><ChevronLeft size={16} /></button>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= pagination.totalPages} className="btn-secondary py-2 px-3"><ChevronRight size={16} /></button>
        </div>
      </div>

      {/* Ban Modal */}
      {banModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <h3 className="text-lg font-bold text-white mb-2">Ban User</h3>
            <p className="text-gray-400 text-sm mb-4">Banning <strong className="text-white">{banModal.first_name} {banModal.last_name}</strong>. This will prevent them from logging in.</p>
            <textarea value={banReason} onChange={e => setBanReason(e.target.value)} className="input mb-4 h-24 resize-none" placeholder="Reason for ban (required)" />
            <div className="flex gap-3">
              <button onClick={() => setBanModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => banMutation.mutate({ id: banModal.id, reason: banReason })} disabled={!banReason.trim() || banMutation.isPending} className="btn-primary flex-1 bg-red-600 hover:bg-red-500">
                {banMutation.isPending ? 'Banning...' : 'Confirm Ban'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
