import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

const Message = ({ msg }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
  >
    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
      msg.role === 'user' ? 'bg-brand-600' : 'bg-purple-600/20 border border-purple-500/30'
    }`}>
      {msg.role === 'user' ? <User size={14} className="text-white" /> : <Bot size={14} className="text-purple-400" />}
    </div>
    <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
      msg.role === 'user'
        ? 'bg-brand-600 text-white rounded-tr-sm'
        : 'bg-surface-card border border-surface-border text-gray-200 rounded-tl-sm'
    }`}>
      {msg.content}
    </div>
  </motion.div>
);

export default function AIChat() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hi ${user?.first_name}! 👋 I'm your AI tutor. Ask me anything about your courses, or any topic you're learning. I'm here to help!` }
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
      setMessages(m => [...m, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now. Please try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = ['Explain this concept simply', 'Give me an example', 'Summarize what I learned', 'What should I study next?'];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="card mb-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-600/20 border border-purple-500/30 rounded-xl flex items-center justify-center">
          <Sparkles size={18} className="text-purple-400" />
        </div>
        <div>
          <h1 className="font-semibold text-white">AI Tutor</h1>
          <p className="text-xs text-green-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full" /> Online — context-aware
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
            <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
              <Bot size={14} className="text-purple-400" />
            </div>
            <div className="bg-surface-card border border-surface-border px-4 py-3 rounded-2xl rounded-tl-sm">
              <Loader2 size={16} className="text-gray-400 animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 my-3">
          {suggestions.map(s => (
            <button key={s} onClick={() => setInput(s)} className="text-xs bg-surface-card border border-surface-border text-gray-400 hover:text-white hover:border-brand-500/50 px-3 py-1.5 rounded-full transition-all">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={send} className="flex gap-3 mt-4">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          className="input flex-1"
          placeholder="Ask anything..."
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()} className="btn-primary px-4 py-3">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
