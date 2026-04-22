import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Plus, X, ChevronDown, Loader2, BookOpen, Clock, Target } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const difficulties = ['beginner', 'intermediate', 'advanced'];

export default function GenerateCourse() {
  const [form, setForm] = useState({ subject: '', custom_topics: [], difficulty: 'beginner', estimated_hours: 10, target_audience: '' });
  const [topicInput, setTopicInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const addTopic = () => {
    if (topicInput.trim() && !form.custom_topics.includes(topicInput.trim())) {
      setForm(f => ({ ...f, custom_topics: [...f.custom_topics, topicInput.trim()] }));
      setTopicInput('');
    }
  };

  const removeTopic = (t) => setForm(f => ({ ...f, custom_topics: f.custom_topics.filter(x => x !== t) }));

  const generate = async (e) => {
    e.preventDefault();
    if (!form.subject.trim()) return toast.error('Subject is required');
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post('/ai/generate-course', form);
      setResult(data.data);
      toast.success('Course generated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveCourse = async () => {
    try {
      const { data } = await api.post('/courses', {
        title: result.title,
        description: result.description,
        subject: form.subject,
        difficulty: form.difficulty,
        estimated_hours: form.estimated_hours,
        is_free: true,
        creator_type: 'ai',
      });
      toast.success('Course saved!');
      navigate(`/learn/${data.data.id}`);
    } catch {
      toast.error('Failed to save course');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Zap className="text-brand-400" size={24} /> AI Course Generator
        </h1>
        <p className="text-gray-400 mt-1">Describe what you want to learn — AI builds the full curriculum</p>
      </div>

      <div className="card">
        <form onSubmit={generate} className="space-y-6">
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Subject *</label>
            <input
              type="text" required
              value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              className="input"
              placeholder="e.g. Machine Learning, Web Development, Data Science..."
            />
          </div>

          {/* Custom Topics */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Custom Topics (optional)</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={topicInput}
                onChange={e => setTopicInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTopic())}
                className="input flex-1"
                placeholder="Add a specific topic..."
              />
              <button type="button" onClick={addTopic} className="btn-secondary px-4">
                <Plus size={16} />
              </button>
            </div>
            {form.custom_topics.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.custom_topics.map(t => (
                  <span key={t} className="flex items-center gap-1.5 bg-brand-600/10 border border-brand-500/20 text-brand-400 text-sm px-3 py-1 rounded-full">
                    {t}
                    <button type="button" onClick={() => removeTopic(t)}><X size={12} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
              <div className="flex gap-2">
                {difficulties.map(d => (
                  <button
                    key={d} type="button"
                    onClick={() => setForm(f => ({ ...f, difficulty: d }))}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize border transition-all ${
                      form.difficulty === d
                        ? 'bg-brand-600/20 border-brand-500 text-brand-400'
                        : 'bg-surface border-surface-border text-gray-400'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Hours */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Estimated Hours</label>
              <input
                type="number" min="1" max="200"
                value={form.estimated_hours}
                onChange={e => setForm(f => ({ ...f, estimated_hours: parseInt(e.target.value) }))}
                className="input"
              />
            </div>

            {/* Audience */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Target Audience</label>
              <input
                type="text"
                value={form.target_audience}
                onChange={e => setForm(f => ({ ...f, target_audience: e.target.value }))}
                className="input"
                placeholder="e.g. Beginners with Python"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={18} className="animate-spin" /> Generating with AI...</> : <><Zap size={18} /> Generate Course</>}
          </button>
        </form>
      </div>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="card border-brand-500/30">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">{result.title}</h2>
                  <p className="text-gray-400 text-sm mt-1">{result.description}</p>
                </div>
                <button onClick={saveCourse} className="btn-primary flex items-center gap-2 shrink-0 ml-4">
                  <BookOpen size={16} /> Save Course
                </button>
              </div>

              <div className="flex flex-wrap gap-3 mb-6">
                <span className="badge bg-brand-600/10 text-brand-400 border border-brand-500/20">
                  <Target size={11} /> {result.modules?.length} modules
                </span>
                <span className="badge bg-green-600/10 text-green-400 border border-green-500/20">
                  <Clock size={11} /> {form.estimated_hours}h estimated
                </span>
              </div>

              {/* Modules */}
              <div className="space-y-3">
                {result.modules?.map((mod, i) => (
                  <details key={i} className="bg-surface rounded-xl border border-surface-border group">
                    <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 bg-brand-600/20 rounded-lg flex items-center justify-center text-brand-400 text-xs font-bold">{i + 1}</span>
                        <span className="font-medium text-white text-sm">{mod.title}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">{mod.lessons?.length} lessons</span>
                        <ChevronDown size={16} className="text-gray-500 group-open:rotate-180 transition-transform" />
                      </div>
                    </summary>
                    <div className="px-4 pb-4 space-y-2">
                      {mod.lessons?.map((lesson, j) => (
                        <div key={j} className="flex items-center gap-3 text-sm text-gray-400 py-1.5 border-t border-surface-border">
                          <span className="w-5 h-5 bg-surface-border rounded flex items-center justify-center text-xs">{j + 1}</span>
                          <span className="flex-1">{lesson.title}</span>
                          <span className="text-xs text-gray-600">{lesson.duration_min}min</span>
                          <span className="badge bg-yellow-600/10 text-yellow-400 text-[10px]">+{lesson.xp_reward} XP</span>
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
