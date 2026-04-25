import { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, X, Info, Trophy, Zap, BookOpen, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

const TYPE_ICON = {
  badge_earned:     { icon: Trophy,   bg: 'bg-amber-50',   color: 'text-amber-500' },
  level_up:         { icon: Zap,      bg: 'bg-brand-50',   color: 'text-brand-600' },
  course_enrolled:  { icon: BookOpen, bg: 'bg-emerald-50', color: 'text-emerald-600' },
  lesson_complete:  { icon: Check,    bg: 'bg-emerald-50', color: 'text-emerald-600' },
  session_booked:   { icon: Calendar, bg: 'bg-violet-50',  color: 'text-violet-600' },
  announcement:     { icon: Info,     bg: 'bg-blue-50',    color: 'text-blue-600' },
};

function getIcon(type) {
  const cfg = TYPE_ICON[type] || { icon: Info, bg: 'bg-slate-50', color: 'text-slate-500' };
  return cfg;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationsPanel() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const qc  = useQueryClient();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { data: notifs = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data.data || []),
    refetchInterval: 30000,
  });

  const unread = notifs.filter(n => !n.is_read).length;

  const markOne = useMutation({
    mutationFn: (id) => api.put(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries(['notifications']),
  });

  const markAll = useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries(['notifications']),
  });

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 text-text-muted hover:text-text-primary hover:bg-surface-hover rounded-xl transition-all"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-600 rounded-full text-[10px] font-bold flex items-center justify-center text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 bg-white border border-surface-border rounded-2xl shadow-card-lg z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-text-primary text-sm">Notifications</h3>
                {unread > 0 && (
                  <span className="badge-brand text-xs">{unread} new</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unread > 0 && (
                  <button
                    onClick={() => markAll.mutate()}
                    className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium px-2 py-1 rounded-lg hover:bg-brand-50 transition-all"
                  >
                    <CheckCheck size={12} /> Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface-hover">
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {notifs.length === 0 ? (
                <div className="text-center py-10">
                  <Bell size={28} className="text-slate-200 mx-auto mb-2" />
                  <p className="text-text-muted text-sm">No notifications yet</p>
                </div>
              ) : notifs.slice(0, 15).map(n => {
                const { icon: Icon, bg, color } = getIcon(n.type);
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-surface-border last:border-0 transition-colors ${
                      !n.is_read ? 'bg-brand-50/40' : 'hover:bg-surface-hover'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                      <Icon size={14} className={color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold ${!n.is_read ? 'text-text-primary' : 'text-text-secondary'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-text-muted mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.is_read && (
                      <button
                        onClick={() => markOne.mutate(n.id)}
                        className="p-1 text-text-muted hover:text-brand-600 rounded-lg hover:bg-brand-50 transition-all shrink-0"
                        title="Mark as read"
                      >
                        <Check size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
