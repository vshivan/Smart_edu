import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

const Message = ({ msg }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
  >
    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
      msg.role === 'user'
        ? 'bg-brand-600 shadow-sm'
        : 'bg-violet-50 border border-violet-200'
    }`}>
      {msg.role === 'user'
        ? <User size={14} className="text-white" />
        : <Bot size={14} className="text-violet-600" />
      }
    </div>
    <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
      msg.role === 'user'
        ? 'bg-brand-600 text-white rounded-tr-sm shadow-sm'
        : 'bg-white border border-surface-border text-text-primary rounded-tl-sm shadow-card'
    }`}>
      {msg.content}
    </div>
  </motion.div>
);

export default function AIChat() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hi ${user?.first_name || 'there'}! 👋 I'm your AI tutor. Ask me anything about your courses or any topic you're learning.` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(m => [...m, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const { data } = await api.post('/ai/chat', { message: userMsg, session_id: sessionId });
      setSessionId(data.data.session_id);
      setMessages(m => [...m, { role: 'assistant', content: data.data.reply }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = ['Explain this concept simply', 'Give me a real-world example', 'Summarize what I learned', 'What should I study next?'];

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem-3rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="card mb-4 flex items-center gap-3 py-4">
        <div className="w-10 h-10 bg-violet-50 border border-violet-200 rounded-xl flex items-center justify-center">
          <Sparkles size={18} className="text-violet-600" />
        </div>
        <div>
          <h1 className="font-semibold text-text-primary text-sm">AI Tutor</h1>
          <p className="text-xs text-emerald-600 flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Online — context-aware
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        <AnimatePresence>
          {messages.map((msg, i) => <Message key={i} msg={msg} />)}
        </AnimatePresence>

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-violet-50 border border-violet-200 flex items-center justify-center">
              <Bot size={14} className="text-violet-600" />
            </div>
            <div className="bg-white border border-surface-border px-4 py-3 rounded-2xl rounded-tl-sm shadow-card">
              <Loader2 size={15} className="text-text-muted animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 my-3">
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => setInput(s)}
              className="text-xs bg-white border border-surface-border text-text-secondary hover:text-brand-700 hover:border-brand-300 hover:bg-brand-50 px-3 py-1.5 rounded-full transition-all font-medium"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={send} className="flex gap-2 mt-3">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          className="input flex-1"
          placeholder="Ask anything..."
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn-primary px-4 py-2.5 flex items-center justify-center"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
