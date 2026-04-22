import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, XCircle, Trophy, ArrowRight } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function QuizPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [current, setCurrent] = useState(0);

  const { data: quiz, isLoading } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: () => api.get(`/quizzes/${quizId}`).then(r => r.data.data),
  });

  useEffect(() => {
    if (quiz?.time_limit_s) {
      setTimeLeft(quiz.time_limit_s);
      const t = setInterval(() => setTimeLeft(s => {
        if (s <= 1) { clearInterval(t); handleSubmit(); return 0; }
        return s - 1;
      }), 1000);
      return () => clearInterval(t);
    }
  }, [quiz]);

  const handleSubmit = async () => {
    if (submitted) return;
    setSubmitted(true);
    const payload = Object.entries(answers).map(([question_id, answer]) => ({ question_id, answer }));
    try {
      const { data } = await api.post(`/quizzes/${quizId}/attempt`, { answers: payload, time_taken_s: quiz?.time_limit_s ? quiz.time_limit_s - (timeLeft || 0) : 0 });
      setResult(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
      setSubmitted(false);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!quiz) return <div className="text-center text-gray-400 py-20">Quiz not found</div>;

  const questions = quiz.questions || [];
  const q = questions[current];
  const progress = ((current + 1) / questions.length) * 100;

  if (result) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg mx-auto text-center py-12">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${result.passed ? 'bg-green-600/20 border-2 border-green-500' : 'bg-red-600/20 border-2 border-red-500'}`}>
          {result.passed ? <Trophy size={40} className="text-green-400" /> : <XCircle size={40} className="text-red-400" />}
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">{result.score}%</h2>
        <p className={`text-lg font-semibold mb-1 ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
          {result.passed ? '🎉 Passed!' : 'Not quite — try again'}
        </p>
        {result.xp_earned > 0 && (
          <p className="text-brand-400 font-semibold mb-6">+{result.xp_earned} XP earned!</p>
        )}
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate(-1)} className="btn-secondary">Back to Lesson</button>
          {!result.passed && result.attempts_remaining > 0 && (
            <button onClick={() => { setSubmitted(false); setResult(null); setAnswers({}); setCurrent(0); }} className="btn-primary">
              Retry ({result.attempts_remaining} left)
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">{quiz.title}</h1>
          <p className="text-gray-400 text-sm">{current + 1} of {questions.length} questions</p>
        </div>
        {timeLeft !== null && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-bold ${timeLeft < 30 ? 'bg-red-600/10 border-red-500/30 text-red-400' : 'bg-surface-card border-surface-border text-white'}`}>
            <Clock size={16} /> {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="xp-bar"><div className="xp-fill" style={{ width: `${progress}%` }} /></div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div key={current} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="card">
          <p className="text-white font-medium text-lg mb-6">{q?.question_text}</p>
          <div className="space-y-3">
            {q?.options && Object.entries(q.options).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setAnswers(a => ({ ...a, [q.id]: key }))}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                  answers[q?.id] === key
                    ? 'bg-brand-600/20 border-brand-500 text-white'
                    : 'bg-surface border-surface-border text-gray-300 hover:border-gray-500'
                }`}
              >
                <span className="font-bold text-brand-400 mr-3">{key}.</span>{val}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between">
        <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0} className="btn-secondary">Previous</button>
        {current < questions.length - 1 ? (
          <button onClick={() => setCurrent(c => c + 1)} disabled={!answers[q?.id]} className="btn-primary flex items-center gap-2">
            Next <ArrowRight size={16} />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={submitted || Object.keys(answers).length < questions.length} className="btn-primary">
            Submit Quiz
          </button>
        )}
      </div>
    </div>
  );
}
