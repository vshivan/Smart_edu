import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ChevronDown, Loader2, BookOpen,
  Clock, Target, X, Check, Search, Plus,
} from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { SUBJECTS, getTopics } from '../../lib/subjectTopics';

const difficulties = ['beginner', 'intermediate', 'advanced'];
const diffColors = {
  beginner:     'bg-emerald-50 border-emerald-200 text-emerald-700',
  intermediate: 'bg-amber-50  border-amber-200  text-amber-700',
  advanced:     'bg-red-50    border-red-200    text-red-700',
};

// ── Subject dropdown with search ─────────────────────────────────────────────
function SubjectDropdown({ value, onChange }) {
  const [open, setOpen]       = useState(false);
  const [search, setSearch]   = useState('');
  const ref                   = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = SUBJECTS.filter(s => s.toLowerCase().includes(search.toLowerCase()));

  const select = (s) => { onChange(s); setOpen(false); setSearch(''); };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`input flex items-center justify-between text-left ${value ? 'text-text-primary' : 'text-text-muted'}`}
      >
        <span>{value || 'Select a subject...'}</span>
        <ChevronDown size={15} className={`text-text-muted transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-white border border-surface-border rounded-xl shadow-card-lg overflow-hidden"
          >
            {/* Search inside dropdown */}
            <div className="p-2 border-b border-surface-border">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  autoFocus
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-surface-border rounded-lg focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100"
                  placeholder="Search subjects..."
                />
              </div>
            </div>

            {/* Subject list */}
            <div className="max-h-56 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-center text-text-muted text-sm py-4">No subjects found</p>
              ) : filtered.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => select(s)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                    value === s
                      ? 'bg-brand-50 text-brand-700 font-medium'
                      : 'text-text-secondary hover:bg-surface-hover'
                  }`}
                >
                  {s}
                  {value === s && <Check size={13} className="text-brand-600" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Topic selector (checkboxes from subject catalog + custom input) ───────────
function TopicSelector({ subject, selected, onChange }) {
  const [customInput, setCustomInput] = useState('');
  const catalogTopics = getTopics(subject);

  const toggle = (topic) => {
    onChange(
      selected.includes(topic)
        ? selected.filter(t => t !== topic)
        : [...selected, topic]
    );
  };

  const addCustom = () => {
    const t = customInput.trim();
    if (t && !selected.includes(t)) {
      onChange([...selected, t]);
      setCustomInput('');
    }
  };

  return (
    <div className="space-y-3">
      {/* Catalog topics as checkboxes */}
      {catalogTopics.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            Suggested topics for <span className="text-brand-600">{subject}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {catalogTopics.map(topic => {
              const checked = selected.includes(topic);
              return (
                <button
                  key={topic}
                  type="button"
                  onClick={() => toggle(topic)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    checked
                      ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                      : 'bg-white border-surface-border text-text-secondary hover:border-brand-300 hover:text-brand-700'
                  }`}
                >
                  {checked && <Check size={10} />}
                  {topic}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom topic input */}
      <div>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
          Add custom topic
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustom())}
            className="input flex-1 text-sm"
            placeholder="Type a topic and press Enter..."
          />
          <button type="button" onClick={addCustom} className="btn-secondary px-3">
            <Plus size={15} />
          </button>
        </div>
      </div>

      {/* Selected topics summary */}
      {selected.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            Selected ({selected.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {selected.map(t => (
              <span
                key={t}
                className="flex items-center gap-1.5 bg-brand-50 border border-brand-200 text-brand-700 text-xs px-3 py-1.5 rounded-full font-medium"
              >
                {t}
                <button type="button" onClick={() => toggle(t)} className="hover:text-brand-900 ml-0.5">
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function GenerateCourse() {
  const [form, setForm] = useState({
    subject:         '',
    custom_topics:   [],
    difficulty:      'beginner',
    estimated_hours: 10,
  });
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const navigate = useNavigate();

  // Reset topics when subject changes
  const handleSubjectChange = (subject) => {
    setForm(f => ({ ...f, subject, custom_topics: [] }));
    setResult(null);
  };

  const generate = async (e) => {
    e.preventDefault();
    if (!form.subject.trim()) return toast.error('Please select a subject');
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post('/ai/generate-course', {
        subject:         form.subject,
        topics:          form.custom_topics,
        difficulty:      form.difficulty,
        estimated_hours: form.estimated_hours,
        audience:        'general learners',
      });
      setResult(data.data);
      toast.success('Course generated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed. Check your Gemini API key.');
    } finally {
      setLoading(false);
    }
  };

  const saveCourse = async () => {
    try {
      const { data } = await api.post('/courses', {
        title:           result.title,
        description:     result.description,
        subject:         form.subject,
        difficulty:      form.difficulty,
        estimated_hours: form.estimated_hours,
        is_free:         true,
        tags:            result.tags || [],
      });
      toast.success('Course saved!');
      navigate(`/learn/${data.data.id}`);
    } catch {
      toast.error('Failed to save course');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="page-title flex items-center gap-2">
          <Sparkles size={22} className="text-brand-600" /> AI Course Generator
        </h1>
        <p className="page-subtitle">Select a subject, pick topics, and let AI build your full curriculum</p>
      </div>

      <div className="card space-y-6">
        <form onSubmit={generate} className="space-y-6">

          {/* Step 1 — Subject */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-5 h-5 bg-brand-600 text-white rounded-full text-xs flex items-center justify-center font-bold">1</span>
              <label className="input-label mb-0">Subject *</label>
            </div>
            <SubjectDropdown value={form.subject} onChange={handleSubjectChange} />
          </div>

          {/* Step 2 — Topics (only shown after subject selected) */}
          <AnimatePresence>
            {form.subject && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-5 h-5 bg-brand-600 text-white rounded-full text-xs flex items-center justify-center font-bold">2</span>
                  <label className="input-label mb-0">
                    Topics <span className="text-text-muted font-normal">(optional — select any or add custom)</span>
                  </label>
                </div>
                <div className="bg-surface-muted border border-surface-border rounded-xl p-4">
                  <TopicSelector
                    subject={form.subject}
                    selected={form.custom_topics}
                    onChange={(topics) => setForm(f => ({ ...f, custom_topics: topics }))}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 3 — Settings */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 bg-brand-600 text-white rounded-full text-xs flex items-center justify-center font-bold">3</span>
              <label className="input-label mb-0">Course Settings</label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Difficulty */}
              <div>
                <label className="input-label">Difficulty</label>
                <div className="flex gap-1.5">
                  {difficulties.map(d => (
                    <button
                      key={d} type="button"
                      onClick={() => setForm(f => ({ ...f, difficulty: d }))}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize border transition-all ${
                        form.difficulty === d
                          ? diffColors[d]
                          : 'bg-white border-surface-border text-text-muted hover:border-slate-300'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hours */}
              <div>
                <label className="input-label">Estimated Hours</label>
                <input
                  type="number" min="1" max="200"
                  value={form.estimated_hours}
                  onChange={e => setForm(f => ({ ...f, estimated_hours: parseInt(e.target.value) || 1 }))}
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Generate button */}
          <button
            type="submit"
            disabled={loading || !form.subject}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm"
          >
            {loading
              ? <><Loader2 size={16} className="animate-spin" /> Generating with AI...</>
              : <><Sparkles size={16} /> Generate Course</>
            }
          </button>
        </form>
      </div>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="card border-brand-200 bg-brand-50/30">
              {/* Result header */}
              <div className="flex items-start justify-between mb-4 gap-4">
                <div>
                  <h2 className="text-lg font-bold text-text-primary">{result.title}</h2>
                  <p className="text-text-secondary text-sm mt-1 leading-relaxed">{result.description}</p>
                </div>
                <button onClick={saveCourse} className="btn-primary flex items-center gap-2 shrink-0 text-sm">
                  <BookOpen size={14} /> Save Course
                </button>
              </div>

              {/* Meta badges */}
              <div className="flex flex-wrap gap-2 mb-5">
                <span className="badge-brand"><Target size={11} /> {result.modules?.length} modules</span>
                <span className="badge-green"><Clock size={11} /> {form.estimated_hours}h</span>
                <span className="badge-gray capitalize">{form.difficulty}</span>
                {form.custom_topics.length > 0 && (
                  <span className="badge-purple">{form.custom_topics.length} topics selected</span>
                )}
              </div>

              {/* Learning outcomes */}
              {result.learning_outcomes?.length > 0 && (
                <div className="mb-5 p-4 bg-white rounded-xl border border-surface-border">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Learning Outcomes</p>
                  <ul className="space-y-1">
                    {result.learning_outcomes.map((o, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                        <Check size={13} className="text-emerald-500 mt-0.5 shrink-0" />
                        {o}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Modules */}
              <div className="space-y-2">
                {result.modules?.map((mod, i) => (
                  <details key={i} className="bg-white rounded-xl border border-surface-border group">
                    <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-brand-50 border border-brand-100 rounded-lg flex items-center justify-center text-brand-600 text-xs font-bold shrink-0">
                          {i + 1}
                        </span>
                        <span className="font-medium text-text-primary text-sm">{mod.title}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-text-muted">{mod.lessons?.length} lessons</span>
                        <ChevronDown size={14} className="text-text-muted group-open:rotate-180 transition-transform" />
                      </div>
                    </summary>
                    <div className="px-4 pb-4 space-y-1">
                      {mod.lessons?.map((lesson, j) => (
                        <div key={j} className="flex items-center gap-3 text-sm text-text-secondary py-2 border-t border-surface-border">
                          <span className="w-5 h-5 bg-surface-muted rounded-md flex items-center justify-center text-xs text-text-muted font-medium shrink-0">
                            {j + 1}
                          </span>
                          <span className="flex-1">{lesson.title}</span>
                          <span className="text-xs text-text-muted shrink-0">{lesson.estimated_minutes || lesson.duration_min}min</span>
                          <span className="badge-yellow text-[10px] shrink-0">+{lesson.xp_reward} XP</span>
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
