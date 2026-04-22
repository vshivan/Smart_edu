import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, FileText, ExternalLink } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function AdminTutors() {
  const qc = useQueryClient();
  const [rejectModal, setRejectModal] = useState(null);
  const [reason, setReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-pending-tutors'],
    queryFn: () => api.get('/admin/tutors/pending').then(r => r.data),
  });

  const approveMutation = useMutation({
    mutationFn: (id) => api.put(`/admin/tutors/${id}/approve`),
    onSuccess: () => { toast.success('Tutor approved!'); qc.invalidateQueries(['admin-pending-tutors']); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => api.put(`/admin/tutors/${id}/reject`, { reason }),
    onSuccess: () => { toast.success('Tutor rejected'); qc.invalidateQueries(['admin-pending-tutors']); setRejectModal(null); setReason(''); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const tutors = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Tutor Verification</h1>
        <span className="badge bg-yellow-600/10 text-yellow-400 border border-yellow-500/20">{data?.pagination?.total || 0} pending</span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : tutors.length === 0 ? (
        <div className="card text-center py-16">
          <CheckCircle size={40} className="text-green-400 mx-auto mb-3" />
          <p className="text-white font-semibold">All caught up!</p>
          <p className="text-gray-400 text-sm mt-1">No pending tutor applications</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tutors.map(tutor => (
            <div key={tutor.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center text-lg font-bold text-purple-400">
                    {tutor.first_name?.[0]}{tutor.last_name?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{tutor.first_name} {tutor.last_name}</p>
                    <p className="text-gray-400 text-sm">{tutor.email}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tutor.skills?.map(s => (
                        <span key={s} className="badge bg-surface text-gray-400 border border-surface-border text-xs">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button onClick={() => approveMutation.mutate(tutor.id)} disabled={approveMutation.isPending} className="flex items-center gap-1.5 bg-green-600/10 hover:bg-green-600/20 border border-green-500/20 text-green-400 px-4 py-2 rounded-xl text-sm font-medium transition-all">
                    <CheckCircle size={15} /> Approve
                  </button>
                  <button onClick={() => setRejectModal(tutor)} className="flex items-center gap-1.5 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 px-4 py-2 rounded-xl text-sm font-medium transition-all">
                    <XCircle size={15} /> Reject
                  </button>
                </div>
              </div>

              {/* Documents */}
              {tutor.documents?.filter(Boolean).length > 0 && (
                <div className="mt-4 pt-4 border-t border-surface-border">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Documents</p>
                  <div className="flex flex-wrap gap-3">
                    {tutor.documents.filter(Boolean).map(doc => (
                      <a key={doc.id} href={doc.file_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-surface border border-surface-border hover:border-brand-500/30 text-gray-300 hover:text-white px-3 py-2 rounded-lg text-sm transition-all">
                        <FileText size={14} />
                        <span className="capitalize">{doc.doc_type?.replace('_', ' ')}</span>
                        <ExternalLink size={12} className="text-gray-500" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <h3 className="text-lg font-bold text-white mb-2">Reject Application</h3>
            <p className="text-gray-400 text-sm mb-4">Provide a reason for rejecting <strong className="text-white">{rejectModal.first_name}</strong>'s application.</p>
            <textarea value={reason} onChange={e => setReason(e.target.value)} className="input mb-4 h-24 resize-none" placeholder="Rejection reason..." />
            <div className="flex gap-3">
              <button onClick={() => setRejectModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => rejectMutation.mutate({ id: rejectModal.id, reason })} disabled={!reason.trim() || rejectMutation.isPending} className="btn-primary flex-1 bg-red-600 hover:bg-red-500">
                {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
