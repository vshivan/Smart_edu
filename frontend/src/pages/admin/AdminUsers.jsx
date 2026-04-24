import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Ban, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react';
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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">{pagination.total || 0} total users</p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="input pl-9" placeholder="Search users..." />
        </div>
        <select value={role} onChange={e => { setRole(e.target.value); setPage(1); }} className="input w-36">
          <option value="">All Roles</option>
          <option value="learner">Learner</option>
          <option value="tutor">Tutor</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-border bg-surface-muted">
              {['User', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                <th key={h} className="table-header">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-12 text-text-muted text-sm">Loading...</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="table-row">
                <td className="table-cell">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center text-xs font-bold text-brand-700">
                      {u.first_name?.[0]}{u.last_name?.[0]}
                    </div>
                    <div>
                      <p className="text-text-primary text-sm font-medium">{u.first_name} {u.last_name}</p>
                      <p className="text-text-muted text-xs">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="table-cell">
                  <span className={`badge capitalize ${
                    u.role === 'admin'  ? 'badge-red' :
                    u.role === 'tutor'  ? 'badge-purple' : 'badge-brand'
                  }`}>{u.role}</span>
                </td>
                <td className="table-cell">
                  <span className={`badge ${u.is_banned ? 'badge-red' : 'badge-green'}`}>
                    {u.is_banned ? 'Banned' : 'Active'}
                  </span>
                </td>
                <td className="table-cell text-text-muted">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="table-cell">
                  {u.role !== 'admin' && (
                    u.is_banned ? (
                      <button onClick={() => unbanMutation.mutate(u.id)} className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 text-xs font-semibold">
                        <UserCheck size={13} /> Unban
                      </button>
                    ) : (
                      <button onClick={() => setBanModal(u)} className="flex items-center gap-1.5 text-red-500 hover:text-red-600 text-xs font-semibold">
                        <Ban size={13} /> Ban
                      </button>
                    )
                  )}
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

      {banModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full shadow-card-lg">
            <h3 className="text-lg font-bold text-text-primary mb-2">Ban User</h3>
            <p className="text-text-secondary text-sm mb-4">
              Banning <strong className="text-text-primary">{banModal.first_name} {banModal.last_name}</strong>. They won't be able to log in.
            </p>
            <textarea
              value={banReason}
              onChange={e => setBanReason(e.target.value)}
              className="input mb-4 h-24 resize-none"
              placeholder="Reason for ban (required)"
            />
            <div className="flex gap-3">
              <button onClick={() => setBanModal(null)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button
                onClick={() => banMutation.mutate({ id: banModal.id, reason: banReason })}
                disabled={!banReason.trim() || banMutation.isPending}
                className="btn-danger flex-1 text-sm"
              >
                {banMutation.isPending ? 'Banning...' : 'Confirm Ban'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
