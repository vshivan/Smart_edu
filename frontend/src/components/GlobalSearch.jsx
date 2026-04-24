import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, Users, Zap, X, ArrowRight, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { useDebounce } from '../hooks/useDebounce';

const RECENT_KEY = 'sel_recent_searches';

export default function GlobalSearch() {
  const [open,    setOpen]    = useState(false);
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState({ courses: [], tutors: [] });
  const [loading, setLoading] = useState(false);
  const [recent,  setRecent]  = useState(() => {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
  });

  const inputRef = useRef(null);
  const wrapRef  = useRef(null);
  const navigate = useNavigate();
  const debounced = useDebounce(query, 300);

  // Open on Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else setQuery('');
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Search
  useEffect(() => {
    if (!debounced.trim()) { setResults({ courses: [], tutors: [] }); return; }
    setLoading(true);
    Promise.all([
      api.get(`/courses?search=${encodeURIComponent(debounced)}&limit=5`).then(r => r.data.data || []).catch(() => []),
      api.get(`/tutors?search=${encodeURIComponent(debounced)}&limit=4`).then(r => r.data.data || []).catch(() => []),
    ]).then(([courses, tutors]) => {
      setResults({ courses, tutors });
      setLoading(false);
    });
  }, [debounced]);

  const saveRecent = (label, path) => {
    const updated = [{ label, path }, ...recent.filter(r => r.path !== path)].slice(0, 5);
    setRecent(updated);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  };

  const go = (label, path) => {
    saveRecent(label, path);
    navigate(path);
    setOpen(false);
  };

  const hasResults = results.courses.length > 0 || results.tutors.length > 0;

  return (
    <>
      {/* Trigger button in TopBar */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-surface-muted border border-surface-border rounded-xl text-sm text-text-muted hover:border-brand-300 hover:text-text-primary transition-all w-48 lg:w-64"
      >
        <Search size={14} />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white border border-surface-border rounded text-[10px] font-mono text-text-muted">
          ⌘K
        </kbd>
      </button>

      {/* Modal overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4"
          >
            <motion.div
              ref={wrapRef}
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-xl bg-white rounded-2xl shadow-card-lg border border-surface-border overflow-hidden"
            >
              {/* Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-border">
                <Search size={17} className="text-text-muted shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search courses, tutors, topics..."
                  className="flex-1 text-sm text-text-primary placeholder-text-muted outline-none bg-transparent"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="text-text-muted hover:text-text-primary">
                    <X size={15} />
                  </button>
                )}
                <kbd className="px-1.5 py-0.5 bg-surface-muted border border-surface-border rounded text-[10px] font-mono text-text-muted">
                  ESC
                </kbd>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {/* Loading */}
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {/* No query — show recent */}
                {!query && !loading && (
                  <div className="p-3">
                    {recent.length > 0 ? (
                      <>
                        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider px-2 mb-2">Recent</p>
                        {recent.map(r => (
                          <button
                            key={r.path}
                            onClick={() => go(r.label, r.path)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-hover transition-colors text-left"
                          >
                            <Clock size={14} className="text-text-muted shrink-0" />
                            <span className="text-sm text-text-secondary">{r.label}</span>
                            <ArrowRight size={13} className="text-text-muted ml-auto" />
                          </button>
                        ))}
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <Search size={28} className="text-slate-200 mx-auto mb-2" />
                        <p className="text-text-muted text-sm">Search for courses, tutors, or topics</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Results */}
                {query && !loading && (
                  <div className="p-3 space-y-4">
                    {!hasResults && (
                      <div className="text-center py-8">
                        <p className="text-text-muted text-sm">No results for "<strong>{query}</strong>"</p>
                      </div>
                    )}

                    {results.courses.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
                          <BookOpen size={11} /> Courses
                        </p>
                        {results.courses.map(c => (
                          <button
                            key={c.id}
                            onClick={() => go(c.title, `/courses/${c.id}`)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-hover transition-colors text-left"
                          >
                            <div className="w-8 h-8 bg-brand-50 border border-brand-100 rounded-lg flex items-center justify-center shrink-0">
                              <BookOpen size={14} className="text-brand-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-text-primary truncate">{c.title}</p>
                              <p className="text-xs text-text-muted capitalize">{c.difficulty} · {c.estimated_hours}h</p>
                            </div>
                            <span className={`text-xs font-semibold shrink-0 ${c.is_free ? 'text-emerald-600' : 'text-text-secondary'}`}>
                              {c.is_free ? 'Free' : `₹${c.price}`}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {results.tutors.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
                          <Users size={11} /> Tutors
                        </p>
                        {results.tutors.map(t => (
                          <button
                            key={t.id}
                            onClick={() => go(`${t.first_name} ${t.last_name}`, `/tutors/${t.id}`)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-hover transition-colors text-left"
                          >
                            <div className="w-8 h-8 bg-violet-100 border border-violet-200 rounded-full flex items-center justify-center text-xs font-bold text-violet-700 shrink-0">
                              {t.first_name?.[0]}{t.last_name?.[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-text-primary">{t.first_name} {t.last_name}</p>
                              <p className="text-xs text-text-muted">{(t.skills || []).slice(0, 2).join(', ')}</p>
                            </div>
                            <span className="text-xs font-semibold text-text-secondary shrink-0">₹{t.hourly_rate}/hr</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Quick action */}
                    <button
                      onClick={() => go('AI Course Generator', '/generate')}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-brand-50 border border-brand-100 hover:bg-brand-100 transition-colors text-left"
                    >
                      <Zap size={14} className="text-brand-600 shrink-0" />
                      <span className="text-sm font-medium text-brand-700">Generate AI course for "{query}"</span>
                      <ArrowRight size={13} className="text-brand-500 ml-auto" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
