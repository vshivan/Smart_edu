import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, FileText, ExternalLink } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Tutor Verification</h1>
          <p className="page-subtitle">{data?.pagination?.total || 0} pending applications</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tutors.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-emerald-500" />
          </div>
          <p className="font-semibold text-text-primary">All caught up!</p>
          <p className="text-text-muted text-sm mt-1">No pending tutor applications</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tutors.map(tutor => (
            <div key={tutor.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-violet-100 border-2 border-violet-200 flex items-center justify-center text-lg font-bold text-violet-700 shrink-0">
                    {tutor.first_name?.[0]}{tutor.last_name?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">{tutor.first_name} {tutor.last_name}</p>
                    <p className="text-text-muted text-sm">{tutor.email}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {tutor.skills?.map(s => (
                        <span key={s} className="badge-gray text-xs">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => approveMutation.mutate(tutor.id)}
                    disabled={approveMutation.isPending}
                    className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  >
                    <CheckCircle size={14} /> Approve
                  </button>
                  <button
                    onClick={() => setRejectModal(tutor)}
                    className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              </div>

              {tutor.documents?.filter(Boolean).length > 0 && (
                <div className="mt-4 pt-4 border-t border-surface-border">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Documents</p>
                  <div className="flex flex-wrap gap-2">
                    {tutor.documents.filter(Boolean).map(doc => (
                      <a
                        key={doc.id}
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-white border border-surface-border hover:border-brand-300 hover:bg-brand-50 text-text-secondary hover:text-brand-700 px-3 py-2 rounded-lg text-sm transition-all"
                      >
                        <FileText size={13} />
                        <span className="capitalize">{doc.doc_type?.replace('_', ' ')}</span>
                        <ExternalLink size={11} className="text-text-muted" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {rejectModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full shadow-card-lg">
            <h3 className="text-lg font-bold text-text-primary mb-2">Reject Application</h3>
            <p className="text-text-secondary text-sm mb-4">
              Provide a reason for rejecting <strong className="text-text-primary">{rejectModal.first_name}</strong>'s application.
            </p>
            <textarea value={reason} onChange={e => setReason(e.target.value)} className="input mb-4 h-24 resize-none" placeholder="Rejection reason..." />
            <div className="flex gap-3">
              <button onClick={() => setRejectModal(null)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button
                onClick={() => rejectMutation.mutate({ id: rejectModal.id, reason })}
                disabled={!reason.trim() || rejectMutation.isPending}
                className="btn-danger flex-1 text-sm"
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
