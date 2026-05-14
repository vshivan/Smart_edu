import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle, BookOpen, Zap, Circle, ChevronDown, ChevronRight,
  FileText, Star, Award, Lock, AlertCircle, Download, X,
  HelpCircle, Trophy, RotateCcw, Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

// ── Inline markdown renderer (same as GenerateCourse) ────────────────────────
function renderInline(text) {
  const parts = [];
  const regex = /(\*\*(.+?)\*\*|`([^`]+)`)/g;
  let last = 0, match, key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(<span key={key++}>{text.slice(last, match.index)}</span>);
    if (match[0].startsWith('**'))
      parts.push(<strong key={key++} className="font-semibold text-text-primary dark:text-white">{match[2]}</strong>);
    else
      parts.push(<code key={key++} className="bg-slate-100 dark:bg-slate-800 text-brand-700 dark:text-brand-300 px-1.5 py-0.5 rounded text-xs font-mono">{match[3]}</code>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(<span key={key++}>{text.slice(last)}</span>);
  return parts.length > 0 ? parts : text;
}

function LessonContent({ content }) {
  if (!content) return null;
  const lines = content.split('\n');
  const elements = [];
  let i = 0, key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.trimStart().startsWith('```')) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) { codeLines.push(lines[i]); i++; }
      elements.push(
        <pre key={key++} className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-x-auto my-3 whitespace-pre-wrap">
          {codeLines.join('\n')}
        </pre>
      );
      i++; continue;
    }
    if (line.startsWith('## ')) { elements.push(<h2 key={key++} className="text-base font-bold text-text-primary dark:text-white mt-5 mb-2">{renderInline(line.slice(3))}</h2>); i++; continue; }
    if (line.startsWith('### ')) { elements.push(<h3 key={key++} className="text-sm font-semibold text-text-primary dark:text-white mt-4 mb-1">{renderInline(line.slice(4))}</h3>); i++; continue; }
    if (line.startsWith('# ')) { elements.push(<h2 key={key++} className="text-lg font-bold text-text-primary dark:text-white mt-5 mb-2">{renderInline(line.slice(2))}</h2>); i++; continue; }

    // Bullet list
    if (line.trimStart().startsWith('- ') || line.trimStart().startsWith('* ')) {
      const items = [];
      while (i < lines.length && (lines[i].trimStart().startsWith('- ') || lines[i].trimStart().startsWith('* '))) {
        items.push(<li key={i} className="text-sm text-text-secondary dark:text-slate-300 leading-relaxed">{renderInline(lines[i].trimStart().slice(2))}</li>);
        i++;
      }
      elements.push(<ul key={key++} className="list-disc list-inside space-y-1 my-2 pl-2">{items}</ul>);
      continue;
    }
    // Numbered list
    if (/^\d+\.\s/.test(line.trimStart())) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trimStart())) {
        items.push(<li key={i} className="text-sm text-text-secondary dark:text-slate-300 leading-relaxed">{renderInline(lines[i].trimStart().replace(/^\d+\.\s/, ''))}</li>);
        i++;
      }
      elements.push(<ol key={key++} className="list-decimal list-inside space-y-1 my-2 pl-2">{items}</ol>);
      continue;
    }
    if (line.trim() === '') { elements.push(<div key={key++} className="h-2" />); i++; continue; }
    elements.push(<p key={key++} className="text-sm text-text-secondary dark:text-slate-300 leading-relaxed">{renderInline(line)}</p>);
    i++;
  }
  return <div className="space-y-1">{elements}</div>;
}

// ── Module Quiz Panel ─────────────────────────────────────────────────────────
function ModuleQuizPanel({ quiz, onClose }) {
  const [quizData,  setQuizData]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [answers,   setAnswers]   = useState({});
  const [result,    setResult]    = useState(null);
  const [submitting,setSubmitting]= useState(false);
  const [current,   setCurrent]   = useState(0);

  useEffect(() => {
    api.get(`/quizzes/${quiz.id}`)
      .then(r => { setQuizData(r.data.data); setLoading(false); })
      .catch(() => { toast.error('Failed to load quiz'); onClose(); });
  }, [quiz.id]);

  const getOptionLetter = (opt) => {
    if (!opt) return '';
    const m = opt.match(/^([A-D])[).\s]/);
    return m ? m[1] : opt.charAt(0).toUpperCase();
  };

  const getOptions = (options) => {
    if (!options) return [];
    if (Array.isArray(options)) return options.map((opt, i) => ({ key: String.fromCharCode(65 + i), label: opt }));
    return Object.entries(options).map(([key, label]) => ({ key, label }));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    const payload = Object.entries(answers).map(([question_id, answer]) => ({ question_id, answer }));
    try {
      const { data } = await api.post(`/quizzes/${quiz.id}/attempt`, { answers: payload, time_taken_s: 0 });
      setResult(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
      setSubmitting(false);
    }
  };

  const retake = () => { setAnswers({}); setResult(null); setCurrent(0); setSubmitting(false); };

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const questions = quizData?.questions || [];
  const q = questions[current];
  const options = getOptions(q?.options);
  const allAnswered = Object.keys(answers).length === questions.length;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Quiz header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle size={18} className="text-amber-500" />
          <h3 className="font-bold text-text-primary">{quizData?.title || quiz.title}</h3>
          <span className="badge-yellow text-xs">{questions.length} questions</span>
        </div>
        <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-hover rounded-lg transition-all">
          <X size={16} />
        </button>
      </div>

      {/* Result screen */}
      {result ? (
        <div className="text-center py-6 space-y-4">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto border-4 ${
            result.passed ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'
          }`}>
            {result.passed ? <Trophy size={36} className="text-emerald-500" /> : <X size={36} className="text-red-500" />}
          </div>
          <div>
            <p className="text-3xl font-extrabold text-text-primary">{result.score}%</p>
            <p className={`font-semibold mt-1 ${result.passed ? 'text-emerald-600' : 'text-red-500'}`}>
              {result.passed ? '🎉 Passed!' : 'Not quite — try again'}
            </p>
            {result.xp_earned > 0 && <p className="text-brand-600 font-semibold text-sm mt-1">+{result.xp_earned} XP earned!</p>}
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={onClose} className="btn-secondary text-sm">Close</button>
            {!result.passed && result.attempts_remaining > 0 && (
              <button onClick={retake} className="btn-primary text-sm flex items-center gap-2">
                <RotateCcw size={14} /> Retry ({result.attempts_remaining} left)
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Progress */}
          <div className="flex items-center justify-between text-xs text-text-muted mb-1">
            <span>Question {current + 1} of {questions.length}</span>
            <span>{Object.keys(answers).length} answered</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
          </div>

          {/* Question */}
          <AnimatePresence mode="wait">
            <motion.div key={current} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="card">
              <p className="font-semibold text-text-primary mb-4 leading-relaxed">{q?.question_text}</p>
              <div className="space-y-2">
                {options.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setAnswers(a => ({ ...a, [q.id]: key }))}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                      answers[q?.id] === key
                        ? 'bg-brand-50 border-brand-400 text-brand-800 ring-1 ring-brand-200'
                        : 'bg-white border-surface-border text-text-secondary hover:border-slate-300 hover:bg-surface-hover'
                    }`}
                  >
                    <span className="font-bold text-brand-600 mr-3">{key}.</span>{label}
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between">
            <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0} className="btn-secondary text-sm">
              Previous
            </button>
            {current < questions.length - 1 ? (
              <button onClick={() => setCurrent(c => c + 1)} disabled={!answers[q?.id]} className="btn-primary text-sm flex items-center gap-2">
                Next <ChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting || !allAnswered}
                className="btn-primary text-sm flex items-center gap-2"
              >
                {submitting ? 'Submitting...' : <><CheckCircle size={14} /> Submit Quiz</>}
              </button>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}

// ── Certificate Modal ─────────────────────────────────────────────────────────
function CertificateModal({ cert, onClose }) {
  const printRef = useRef(null);

  const handleDownload = () => {
    const content = printRef.current;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Certificate — ${cert.course_title}</title>
      <style>
        body { margin: 0; font-family: Georgia, serif; background: #fff; }
        .cert { width: 800px; margin: 40px auto; padding: 60px; border: 8px solid #4f46e5;
                border-radius: 16px; text-align: center; position: relative; }
        .cert::before { content: ''; position: absolute; inset: 12px;
                        border: 2px solid #c7d2fe; border-radius: 8px; pointer-events: none; }
        .logo { font-size: 14px; color: #6366f1; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px; }
        .title { font-size: 42px; color: #1e1b4b; font-weight: bold; margin: 20px 0 8px; }
        .subtitle { font-size: 16px; color: #6b7280; margin-bottom: 32px; }
        .name { font-size: 36px; color: #4f46e5; font-style: italic; margin: 16px 0; border-bottom: 2px solid #e0e7ff; padding-bottom: 16px; }
        .course { font-size: 22px; color: #1f2937; font-weight: bold; margin: 16px 0; }
        .date { font-size: 14px; color: #9ca3af; margin-top: 32px; }
        .hash { font-size: 11px; color: #d1d5db; margin-top: 8px; font-family: monospace; }
      </style></head><body>
      <div class="cert">
        <div class="logo">⚡ SmartEduMate</div>
        <div class="title">Certificate of Completion</div>
        <div class="subtitle">This is to certify that</div>
        <div class="name">${cert.learner_name}</div>
        <div class="subtitle">has successfully completed the course</div>
        <div class="course">${cert.course_title}</div>
        <div class="date">Issued on ${new Date(cert.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        <div class="hash">Certificate ID: ${cert.cert_hash}</div>
      </div></body></html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-dark-card rounded-3xl shadow-2xl max-w-lg w-full p-8 relative"
        onClick={e => e.stopPropagation()}
        ref={printRef}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-surface-hover">
          <X size={18} />
        </button>

        {/* Certificate preview */}
        <div className="border-4 border-brand-500 rounded-2xl p-8 text-center relative mb-6">
          <div className="absolute inset-2 border border-brand-200 dark:border-brand-800/50 rounded-xl pointer-events-none" />
          <div className="text-brand-600 text-xs font-bold uppercase tracking-widest mb-3">⚡ SmartEduMate</div>
          <h2 className="text-2xl font-bold text-text-primary dark:text-white mb-1">Certificate of Completion</h2>
          <p className="text-text-muted text-sm mb-4">This is to certify that</p>
          <p className="text-3xl font-bold text-brand-600 italic mb-1">{cert.learner_name}</p>
          <p className="text-text-muted text-sm mb-3">has successfully completed</p>
          <p className="text-lg font-bold text-text-primary dark:text-white mb-4">{cert.course_title}</p>
          <p className="text-xs text-text-muted">
            {new Date(cert.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-[10px] text-text-muted mt-1 font-mono">ID: {cert.cert_hash}</p>
        </div>

        <button onClick={handleDownload} className="btn-primary w-full flex items-center justify-center gap-2">
          <Download size={16} /> Download Certificate
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Rating Modal ──────────────────────────────────────────────────────────────
function RatingModal({ courseId, onClose, onSubmit }) {
  const [rating,  setRating]  = useState(0);
  const [hover,   setHover]   = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!rating) return toast.error('Please select a rating');
    setLoading(true);
    try {
      await api.post(`/courses/${courseId}/rate`, { rating, comment });
      toast.success('Thanks for your feedback!');
      onSubmit();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl max-w-md w-full p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Star size={24} className="text-amber-500" />
          </div>
          <h3 className="text-lg font-bold text-text-primary dark:text-white">Rate this course</h3>
          <p className="text-text-muted text-sm mt-1">Your feedback helps other learners</p>
        </div>

        {/* Stars */}
        <div className="flex justify-center gap-2 mb-4">
          {[1,2,3,4,5].map(s => (
            <button
              key={s}
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(s)}
              className="transition-transform hover:scale-110"
            >
              <Star
                size={32}
                fill={(hover || rating) >= s ? '#f59e0b' : 'none'}
                className={(hover || rating) >= s ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}
              />
            </button>
          ))}
        </div>

        {rating > 0 && (
          <p className="text-center text-sm font-semibold text-amber-600 mb-4">
            {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent!'][rating]}
          </p>
        )}

        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          className="input resize-none h-24 mb-4"
          placeholder="Share your experience (optional)..."
        />

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1 text-sm">Skip</button>
          <button onClick={submit} disabled={loading || !rating} className="btn-primary flex-1 text-sm">
            {loading ? 'Submitting...' : 'Submit Rating'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Notes Panel ───────────────────────────────────────────────────────────────
function NotesPanel({ courseId, lessonId, lessonTitle }) {
  const [notes,   setNotes]   = useState('');
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const saveTimer = useRef(null);

  // Load notes for this lesson
  useEffect(() => {
    if (!lessonId) return;
    // Load from localStorage first (instant)
    const local = localStorage.getItem(`notes:${lessonId}`);
    if (local) setNotes(local);
    // Then sync from server
    api.get(`/courses/${courseId}/lessons/${lessonId}/notes`)
      .then(r => {
        const serverNotes = r.data.data?.notes || '';
        if (serverNotes) {
          setNotes(serverNotes);
          localStorage.setItem(`notes:${lessonId}`, serverNotes);
        }
      })
      .catch(() => {});
  }, [lessonId, courseId]);

  const handleChange = (val) => {
    setNotes(val);
    setSaved(false);
    localStorage.setItem(`notes:${lessonId}`, val);

    // Debounced save to server
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        await api.put(`/courses/${courseId}/lessons/${lessonId}/notes`, { notes: val });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch {}
      setSaving(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText size={15} className="text-brand-500" />
          <span className="text-sm font-semibold text-text-primary dark:text-white">My Notes</span>
        </div>
        <span className={`text-xs transition-all ${saving ? 'text-text-muted' : saved ? 'text-emerald-500' : 'text-transparent'}`}>
          {saving ? 'Saving...' : 'Saved ✓'}
        </span>
      </div>
      <p className="text-xs text-text-muted mb-2 line-clamp-1">{lessonTitle}</p>
      <textarea
        value={notes}
        onChange={e => handleChange(e.target.value)}
        className="flex-1 input resize-none text-sm leading-relaxed"
        placeholder="Take notes while you learn... Notes are saved automatically."
      />
    </div>
  );
}

// ── Main CourseLearn ──────────────────────────────────────────────────────────
export default function CourseLearn() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [activeLesson,    setActiveLesson]    = useState(null);
  const [expandedModules, setExpandedModules] = useState({});
  const [showNotes,       setShowNotes]       = useState(false);
  const [showRating,      setShowRating]      = useState(false);
  const [certificate,     setCertificate]     = useState(null);
  const [masteryBlocked,  setMasteryBlocked]  = useState(null);
  const [activeQuiz,      setActiveQuiz]      = useState(null); // quiz being taken

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => api.get(`/courses/${courseId}`).then(r => r.data.data),
    onSuccess: (data) => {
      if (data?.modules?.[0]) {
        setExpandedModules({ [data.modules[0].id]: true });
        if (!activeLesson && data.modules[0].lessons?.[0]) {
          setActiveLesson(data.modules[0].lessons[0]);
        }
      }
    },
  });

  const { user, updateUser } = useAuthStore();

  const completeMutation = useMutation({
    mutationFn: (lessonId) => api.post(`/courses/${courseId}/lessons/${lessonId}/complete`),
    onSuccess: async (data) => {
      const xp = data?.data?.data?.xp_earned || 10;
      toast.success(`+${xp} XP earned! 🎉`);
      qc.invalidateQueries(['course', courseId]);
      qc.invalidateQueries(['gamification-profile']);
      qc.invalidateQueries(['enrollments']);

      // Award XP and update sidebar immediately
      try {
        const { data: xpData } = await api.post('/gamification/xp', { amount: xp, reason: 'lesson_complete' });
        // Update authStore so sidebar XP/level reflects immediately
        if (xpData?.data) {
          updateUser({
            xp:          xpData.data.xp_total,
            level:       xpData.data.level?.level || xpData.data.level,
            xp_to_next:  xpData.data.xp_to_next_level,
          });
        }
      } catch {}

      // Check if course is now 100% complete
      const updated = await api.get(`/courses/${courseId}`).then(r => r.data.data);
      if (updated?.progress_pct >= 100) {
        setTimeout(() => setShowRating(true), 800);
      }
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to mark complete'),
  });

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  // Module unlock: module 0 always accessible.
  // Subsequent modules unlock only when previous module is fully completed
  // (all lessons done + quiz passed if quiz exists)
  const canAccessModule = useCallback((moduleIndex) => {
    if (moduleIndex === 0) return true;
    const prevModule = course?.modules?.[moduleIndex - 1];
    if (!prevModule) return true;
    return prevModule.is_completed === true;
  }, [course]);

  const handleLessonClick = (lesson, moduleIndex) => {
    if (!canAccessModule(moduleIndex)) {
      const prevModule = course?.modules?.[moduleIndex - 1];
      setMasteryBlocked(prevModule?.title || 'previous module');
      setTimeout(() => setMasteryBlocked(null), 3000);
      return;
    }
    setActiveLesson(lesson);
  };

  const handleGetCertificate = async () => {
    try {
      const { data } = await api.post(`/courses/${courseId}/certificate`);
      setCertificate(data.data);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to generate certificate');
    }
  };

  const lesson = activeLesson;
  const isComplete = (course?.progress_pct || 0) >= 100;

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="flex h-[calc(100vh-3.5rem)] gap-0 -m-6">

        {/* ── Sidebar ─────────────────────────────────────────────────── */}
        <aside className="w-72 bg-white dark:bg-dark-card border-r border-surface-border dark:border-dark-border flex flex-col shrink-0 shadow-sm">
          {/* Course header */}
          <div className="p-4 border-b border-surface-border dark:border-dark-border bg-surface-muted dark:bg-dark-muted shrink-0">
            <h2 className="font-semibold text-text-primary dark:text-white text-sm line-clamp-2 mb-2">{course?.title}</h2>
            <div className="xp-bar mb-1">
              <div className="xp-fill" style={{ width: `${course?.progress_pct || 0}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-text-muted">{Math.round(course?.progress_pct || 0)}% complete</p>
              {isComplete && (
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle size={11} /> Done!
                </span>
              )}
            </div>
          </div>

          {/* Mastery blocked toast */}
          <AnimatePresence>
            {masteryBlocked && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="mx-3 mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl flex items-start gap-2"
              >
                <Lock size={13} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Complete all lessons in <strong>{masteryBlocked}</strong> first.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Modules list */}
          <div className="flex-1 overflow-y-auto p-2">
            {(course?.modules || []).map((mod, mi) => {
              const accessible = canAccessModule(mi);
              return (
                <div key={mod.id} className="mb-1">
                  <button
                    onClick={() => accessible ? toggleModule(mod.id) : handleLessonClick(null, mi)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all ${
                      accessible
                        ? 'text-text-muted dark:text-slate-500 hover:text-text-primary dark:hover:text-white hover:bg-surface-hover dark:hover:bg-dark-hover'
                        : 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    {!accessible
                      ? <Lock size={11} className="shrink-0" />
                      : expandedModules[mod.id]
                        ? <ChevronDown size={12} />
                        : <ChevronRight size={12} />
                    }
                    <span className="flex-1 text-left">{mi + 1}. {mod.title}</span>
                    <span className="text-[10px] font-normal normal-case">
                      {mod.is_completed
                        ? <CheckCircle size={10} className="text-emerald-500" />
                        : `${(mod.lessons || []).filter(l => l?.completed).length}/${(mod.lessons || []).length}`
                      }
                    </span>
                  </button>

                  {/* Unlock hint for locked modules */}
                  {!accessible && mi > 0 && (
                    <div className="mx-2 mb-1 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/20 rounded-lg">
                      <p className="text-[10px] text-amber-600 dark:text-amber-500 flex items-center gap-1">
                        <Lock size={9} /> Complete Module {mi} lessons + quiz to unlock
                      </p>
                    </div>
                  )}

                  <AnimatePresence>
                    {expandedModules[mod.id] && accessible && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }}
                        className="overflow-hidden"
                      >
                        {(mod.lessons || []).filter(Boolean).map(l => (
                          <button
                            key={l.id}
                            onClick={() => handleLessonClick(l, mi)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all text-left ml-2 ${
                              activeLesson?.id === l.id
                                ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 border border-brand-100 dark:border-brand-800/50'
                                : 'text-text-secondary dark:text-slate-400 hover:text-text-primary dark:hover:text-white hover:bg-surface-hover dark:hover:bg-dark-hover'
                            }`}
                          >
                            {l.completed
                              ? <CheckCircle size={13} className="text-emerald-500 shrink-0" />
                              : <Circle size={13} className="text-slate-300 dark:text-slate-600 shrink-0" />
                            }
                            <span className="flex-1 line-clamp-1 text-xs">{l.title}</span>
                            {l.xp_reward > 0 && (
                              <span className="text-[10px] text-brand-500 font-semibold shrink-0">+{l.xp_reward}</span>
                            )}
                          </button>
                        ))}

                        {/* Module quiz button */}
                        {mod.quiz && (
                          <button
                            onClick={() => { setActiveQuiz(mod.quiz); setActiveLesson(null); }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all text-left ml-2 mt-1 border ${
                              activeQuiz?.id === mod.quiz.id
                                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700/50 text-amber-700 dark:text-amber-400'
                                : 'border-amber-200 dark:border-amber-800/40 text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                            }`}
                          >
                            <HelpCircle size={13} className="shrink-0" />
                            <span className="flex-1 line-clamp-1 text-xs font-medium">Module Quiz</span>
                            <span className="text-[10px] font-semibold shrink-0">
                              {mod.quiz.attempts_used > 0 ? '✓ Done' : `+${mod.quiz.xp_reward} XP`}
                            </span>
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Certificate button — shown when complete */}
          {isComplete && (
            <div className="p-3 border-t border-surface-border dark:border-dark-border shrink-0">
              <button
                onClick={handleGetCertificate}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-sm py-2.5 rounded-xl transition-all shadow-sm"
              >
                <Award size={15} /> Get Certificate
              </button>
            </div>
          )}
        </aside>

        {/* ── Main content ─────────────────────────────────────────────── */}
        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-y-auto bg-surface dark:bg-dark-bg">
            {activeQuiz ? (
              /* ── Quiz panel ─────────────────────────────────────────── */
              <div className="max-w-2xl mx-auto p-6 md:p-8">
                <ModuleQuizPanel
                  quiz={activeQuiz}
                  onClose={() => { setActiveQuiz(null); qc.invalidateQueries(['course', courseId]); }}
                />
              </div>
            ) : lesson ? (
              <div className="max-w-3xl mx-auto p-6 md:p-8">
                {/* Lesson header */}
                <div className="flex items-start justify-between mb-6 gap-4">
                  <div>
                    <p className="text-xs text-text-muted dark:text-slate-500 mb-1 font-medium uppercase tracking-wider">
                      {course?.modules?.find(m => m.lessons?.some(l => l.id === lesson.id))?.title}
                    </p>
                    <h1 className="text-2xl font-bold text-text-primary dark:text-white leading-tight">{lesson.title}</h1>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Notes toggle */}
                    <button
                      onClick={() => setShowNotes(!showNotes)}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all ${
                        showNotes
                          ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-700/50 text-brand-600'
                          : 'bg-white dark:bg-dark-card border-surface-border dark:border-dark-border text-text-secondary dark:text-slate-400 hover:border-brand-300'
                      }`}
                    >
                      <FileText size={13} /> Notes
                    </button>
                    {/* Complete button */}
                    <button
                      onClick={() => completeMutation.mutate(lesson.id)}
                      disabled={completeMutation.isPending || lesson.completed}
                      className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl font-semibold transition-all ${
                        lesson.completed
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/40 text-emerald-700 dark:text-emerald-400 cursor-default'
                          : 'btn-primary'
                      }`}
                    >
                      {lesson.completed
                        ? <><CheckCircle size={15} /> Done</>
                        : completeMutation.isPending ? 'Saving...'
                        : <><Zap size={15} /> Complete</>
                      }
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="card dark:bg-dark-card dark:border-dark-border mb-4">
                  {lesson.content_text || lesson.content ? (
                    <>
                      <LessonContent content={lesson.content_text || lesson.content} />
                      {/* Show regenerate button if content looks like a placeholder */}
                      {(lesson.content_text || '').length < 200 && (
                        <div className="mt-4 pt-4 border-t border-surface-border">
                          <button
                            onClick={async () => {
                              toast.loading('Regenerating content...', { id: 'regen' });
                              try {
                                await api.post(`/courses/${courseId}/regenerate-content`);
                                toast.success('Content regenerated! Refreshing...', { id: 'regen' });
                                qc.invalidateQueries(['course', courseId]);
                              } catch {
                                toast.error('Regeneration failed', { id: 'regen' });
                              }
                            }}
                            className="flex items-center gap-2 text-xs text-brand-600 hover:text-brand-700 font-medium"
                          >
                            <Zap size={12} /> Regenerate full content with AI
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen size={32} className="text-text-muted mx-auto mb-3" />
                      <p className="font-medium text-text-primary dark:text-white mb-2">No content yet</p>
                      <button
                        onClick={async () => {
                          toast.loading('Generating content...', { id: 'regen' });
                          try {
                            await api.post(`/courses/${courseId}/regenerate-content`);
                            toast.success('Content generated!', { id: 'regen' });
                            qc.invalidateQueries(['course', courseId]);
                          } catch {
                            toast.error('Generation failed', { id: 'regen' });
                          }
                        }}
                        className="btn-primary text-sm flex items-center gap-2 mx-auto"
                      >
                        <Zap size={14} /> Generate Content with AI
                      </button>
                    </div>
                  )}
                </div>

                {/* YouTube video search link */}
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center shrink-0">
                      {/* YouTube icon */}
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-red-600" xmlns="http://www.w3.org/2000/svg">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary dark:text-white">Watch Video Lecture</p>
                      <p className="text-xs text-text-muted">Find related YouTube tutorials for this lesson</p>
                    </div>
                  </div>
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(lesson.title + ' tutorial ' + (course?.subject || ''))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shrink-0"
                  >
                    Search YouTube →
                  </a>
                </div>

                {/* XP hint */}
                {!lesson.completed && lesson.xp_reward > 0 && (
                  <div className="flex items-center gap-2 text-sm text-text-muted">
                    <Zap size={13} className="text-brand-500" />
                    Complete to earn <strong className="text-brand-600">+{lesson.xp_reward} XP</strong>
                  </div>
                )}

                {/* Course complete banner */}
                {isComplete && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-5 bg-gradient-to-r from-emerald-50 to-brand-50 dark:from-emerald-900/20 dark:to-brand-900/20 border border-emerald-200 dark:border-emerald-700/40 rounded-2xl"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center">
                        <Award size={20} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-bold text-text-primary dark:text-white">Course Complete! 🎉</p>
                        <p className="text-text-muted text-xs">You've finished all lessons</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={handleGetCertificate} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-all">
                        <Download size={14} /> Get Certificate
                      </button>
                      <button onClick={() => setShowRating(true)} className="flex items-center gap-2 btn-secondary text-sm">
                        <Star size={14} /> Rate Course
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <BookOpen size={36} className="text-text-muted mx-auto mb-3" />
                  <p className="text-text-muted text-sm">Select a lesson to begin</p>
                </div>
              </div>
            )}
          </main>

          {/* ── Notes panel ─────────────────────────────────────────── */}
          <AnimatePresence>
            {showNotes && lesson && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }} animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                className="bg-white dark:bg-dark-card border-l border-surface-border dark:border-dark-border overflow-hidden shrink-0"
              >
                <div className="p-4 h-full flex flex-col" style={{ width: 320 }}>
                  <NotesPanel courseId={courseId} lessonId={lesson.id} lessonTitle={lesson.title} />
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showRating && (
          <RatingModal
            courseId={courseId}
            onClose={() => setShowRating(false)}
            onSubmit={() => qc.invalidateQueries(['course', courseId])}
          />
        )}
        {certificate && (
          <CertificateModal cert={certificate} onClose={() => setCertificate(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
