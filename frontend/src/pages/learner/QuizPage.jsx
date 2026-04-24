import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, XCircle, Trophy, ArrowRight, CheckCircle } from 'lucide-react';
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
      const { data } = await api.post(`/quizzes/${quizId}/attempt`, {
        answers: payload,
        time_taken_s: quiz?.time_limit_s ? quiz.time_limit_s - (timeLeft || 0) : 0,
      });
      setResult(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
      setSubmitted(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!quiz) return <div className="text-center text-text-muted py-20">Quiz not found</div>;

  const questions = quiz.questions || [];
  const q = questions[current];
  const progress = ((current + 1) / questions.length) * 100;

  if (result) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg mx-auto text-center py-12">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border-4 ${
          result.passed ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'
        }`}>
          {result.passed
            ? <Trophy size={40} className="text-emerald-500" />
            : <XCircle size={40} className="text-red-500" />
          }
        </div>
        <h2 className="text-4xl font-extrabold text-text-primary mb-2">{result.score}%</h2>
        <p className={`text-lg font-semibold mb-2 ${result.passed ? 'text-emerald-600' : 'text-red-500'}`}>
          {result.passed ? '🎉 Passed!' : 'Not quite — try again'}
        </p>
        {result.xp_earned > 0 && (
          <p className="text-brand-600 font-semibold mb-6">+{result.xp_earned} XP earned!</p>
        )}
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate(-1)} className="btn-secondary text-sm">Back to Lesson</button>
          {!result.passed && result.attempts_remaining > 0 && (
            <button
              onClick={() => { setSubmitted(false); setResult(null); setAnswers({}); setCurrent(0); }}
              className="btn-primary text-sm"
            >
              Retry ({result.attempts_remaining} left)
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">{quiz.title}</h1>
          <p className="page-subtitle">Question {current + 1} of {questions.length}</p>
        </div>
        {timeLeft !== null && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-bold text-sm ${
            timeLeft < 30
              ? 'bg-red-50 border-red-200 text-red-600'
              : 'bg-white border-surface-border text-text-primary'
          }`}>
            <Clock size={15} /> {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </div>
        )}
      </div>

      <div className="xp-bar"><div className="xp-fill" style={{ width: `${progress}%` }} /></div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          className="card"
        >
          <p className="font-semibold text-text-primary text-base mb-5">{q?.question_text}</p>
          <div className="space-y-2.5">
            {q?.options && Object.entries(q.options).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setAnswers(a => ({ ...a, [q.id]: key }))}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                  answers[q?.id] === key
                    ? 'bg-brand-50 border-brand-400 text-brand-800 ring-1 ring-brand-200'
                    : 'bg-white border-surface-border text-text-secondary hover:border-slate-300 hover:bg-surface-hover'
                }`}
              >
                <span className="font-bold text-brand-600 mr-3">{key}.</span>{val}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between">
        <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0} className="btn-secondary text-sm">
          Previous
        </button>
        {current < questions.length - 1 ? (
          <button onClick={() => setCurrent(c => c + 1)} disabled={!answers[q?.id]} className="btn-primary text-sm flex items-center gap-2">
            Next <ArrowRight size={15} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitted || Object.keys(answers).length < questions.length}
            className="btn-primary text-sm flex items-center gap-2"
          >
            <CheckCircle size={15} /> Submit Quiz
          </button>
        )}
      </div>
    </div>
  );
}
