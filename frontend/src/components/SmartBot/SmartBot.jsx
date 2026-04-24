import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, ChevronRight, RotateCcw, Lightbulb, HelpCircle, Sparkles, GraduationCap } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import BotFace from './BotFace';
import { PAGE_KNOWLEDGE, ONBOARDING_FLOWS, FAQ } from './botKnowledge';
import { detectMode, detectIntent, generateResponse } from './anaEngine';

const ONBOARDING_KEY = 'sel_onboarding_done';

function getPageInfo(pathname) {
  if (PAGE_KNOWLEDGE[pathname]) return PAGE_KNOWLEDGE[pathname];
  const prefix = '/' + pathname.split('/')[1];
  return PAGE_KNOWLEDGE[prefix] || null;
}

function useTypewriter(text, speed = 10) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    if (!text) return;
    let i = 0;
    const t = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(t);
    }, speed);
    return () => clearInterval(t);
  }, [text, speed]);
  return displayed;
}

function RenderText({ text }) {
  return (
    <div className="space-y-1">
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className="leading-relaxed">
            {parts.map((part, j) =>
              part.startsWith('**') && part.endsWith('**')
                ? <strong key={j} className="font-semibold text-text-primary">{part.slice(2, -2)}</strong>
                : <span key={j}>{part}</span>
            )}
          </p>
        );
      })}
    </div>
  );
}

function Message({ msg }) {
  const displayed = useTypewriter(msg.role === 'bot' ? msg.text : '', 10);
  const text = msg.role === 'bot' ? displayed : msg.text;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={'flex gap-2 ' + (msg.role === 'user' ? 'flex-row-reverse' : '')}>
      {msg.role === 'bot' && <div className="shrink-0 mt-0.5"><BotFace size={30} mood="happy" /></div>}
      <div className={'max-w-[84%] rounded-2xl text-xs leading-relaxed ' + (
        msg.role === 'user'
          ? 'bg-indigo-600 text-white px-3.5 py-2.5 rounded-tr-sm'
          : 'bg-white border border-surface-border text-text-secondary px-3.5 py-2.5 rounded-tl-sm shadow-card'
      )}>
        {msg.role === 'bot' ? <RenderText text={text} /> : msg.text}
      </div>
    </motion.div>
  );
}

function TypingDots() {
  return (
    <div className="flex gap-2 items-start">
      <div className="shrink-0"><BotFace size={30} mood="thinking" /></div>
      <div className="bg-white border border-surface-border px-4 py-3 rounded-2xl rounded-tl-sm shadow-card">
        <span className="flex gap-1 items-center">
          {[0,1,2].map(i => (
            <motion.span key={i} className="w-1.5 h-1.5 bg-slate-400 rounded-full"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }} />
          ))}
        </span>
      </div>
    </div>
  );
}

const QUICK_MODES = [
  { label: 'Explain Simply', icon: '🧒', text: "Explain like I'm 15: " },
  { label: 'Exam Mode',      icon: '📋', text: 'Exam mode: ' },
  { label: 'Short Note',     icon: '📝', text: 'Short note on ' },
  { label: 'Deep Dive',      icon: '🔬', text: 'Deep dive into ' },
  { label: 'Quiz Me',        icon: '🎯', text: 'Quiz me on ' },
  { label: 'Revise',         icon: '🔄', text: 'Revise ' },
];

const SUGGESTIONS = [
  'Explain machine learning',
  'What is XP?',
  'How to generate a course?',
  'Quiz me on Python',
  'Short note on React',
  'Deep dive into neural networks',
];

const STUDY_MODES_LIST = [
  { icon: '🧒', label: "Explain Like I'm 15",  desc: 'Simple language, real-life analogies',       prefix: "Explain like I'm 15: " },
  { icon: '📋', label: 'Exam Mode',             desc: 'Definition · Key Points · Conclusion',       prefix: 'Exam mode: ' },
  { icon: '📝', label: 'Short Note',            desc: '5-mark format, concise and structured',      prefix: 'Short note on ' },
  { icon: '🔬', label: 'Deep Dive',             desc: 'Full technical explanation with logic',      prefix: 'Deep dive into ' },
  { icon: '🎯', label: 'Quiz Me',               desc: 'Ana asks questions, evaluates your answers', prefix: 'Quiz me on ' },
  { icon: '🔄', label: 'Revise',                desc: 'Quick bullet summary for fast review',       prefix: 'Revise ' },
];

export default function SmartBot() {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [open,       setOpen]       = useState(false);
  const [messages,   setMessages]   = useState([]);
  const [input,      setInput]      = useState('');
  const [mood,       setMood]       = useState('happy');
  const [isTyping,   setIsTyping]   = useState(false);
  const [activeTab,  setActiveTab]  = useState('chat');
  const [onboarding, setOnboarding] = useState(null);
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleMsg,  setBubbleMsg]  = useState('');
  const [hasGreeted, setHasGreeted] = useState(false);
  const [quizState,  setQuizState]  = useState(null);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const pageInfo  = getPageInfo(location.pathname);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 100); else setInput(''); }, [open]);

  // Onboarding trigger
  useEffect(() => {
    if (!user) return;
    if (localStorage.getItem(ONBOARDING_KEY)) return;
    const flow = ONBOARDING_FLOWS[user.role];
    if (!flow) return;
    const t = setTimeout(() => {
      setOnboarding({ step: 0, flow });
      setOpen(true);
      addBotMessage(flow[0].message);
    }, 1800);
    return () => clearTimeout(t);
  }, [user]);

  // Page bubble
  useEffect(() => {
    if (!open && pageInfo && hasGreeted) {
      setBubbleMsg(pageInfo.emoji + ' ' + pageInfo.title);
      setShowBubble(true);
      const t = setTimeout(() => setShowBubble(false), 3500);
      return () => clearTimeout(t);
    }
  }, [location.pathname]);

  const addBotMessage = useCallback((text, delay = 700) => {
    setIsTyping(true);
    setMood('thinking');
    setTimeout(() => {
      setIsTyping(false);
      setMood('happy');
      setMessages(m => [...m, { role: 'bot', text }]);
    }, delay);
  }, []);

  const handleOpen = () => {
    setOpen(true);
    if (!hasGreeted && messages.length === 0 && !onboarding) {
      setHasGreeted(true);
      const name = user?.first_name ? ', ' + user.first_name : '';
      addBotMessage(
        "Hello" + name + "! 👋 I'm **Ana**, your AI professor and personal study assistant.\n\nI can **teach** any topic, **quiz** you, create **study notes**, give **exam-ready answers**, or help you navigate this platform.\n\nTry saying:\n• \"Explain machine learning\"\n• \"Exam mode: what is Python?\"\n• \"Quiz me on data structures\"\n• \"Short note on React\"\n\nWhat would you like to learn today? 🎓"
      );
    }
  };

  const handleSend = (text) => {
    const msg = (text || input).trim();
    if (!msg) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', text: msg }]);
    setMood('thinking');

    // Quiz answer evaluation
    if (quizState) {
      const ans = msg.trim().toUpperCase();
      if (['A','B','C','D'].includes(ans)) {
        const correct = ans === quizState.correct;
        const reply = correct
          ? '✅ **Correct!** Well done! ' + quizState.explanation + '\n\nWant another question? Say "quiz me" again!'
          : '❌ **Not quite.** The correct answer is **' + quizState.correct + '**.\n\n' + quizState.explanation + '\n\nDon\'t worry — mistakes are how we learn! Try again?';
        setQuizState(null);
        addBotMessage(reply, 600);
        return;
      }
    }

    const mode   = detectMode(msg);
    const intent = detectIntent(msg);
    const reply  = generateResponse(msg, intent, mode, pageInfo, user, quizState);
    addBotMessage(reply, 900);
  };

  const nextOnboardingStep = () => {
    if (!onboarding) return;
    const { step, flow } = onboarding;
    const next = step + 1;
    if (next >= flow.length) {
      localStorage.setItem(ONBOARDING_KEY, 'true');
      setOnboarding(null);
      addBotMessage("You're all set! 🚀 I'll be here whenever you need help.\n\nRemember — I'm not just a guide, I'm your **AI professor**. Ask me to explain any topic, quiz you, or create study notes!");
      return;
    }
    setOnboarding({ step: next, flow });
    addBotMessage(flow[next].message);
  };

  const skipOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setOnboarding(null);
    addBotMessage("No problem! I'll be here whenever you need me. 😊\n\nI'm **Ana**, your AI professor — ask me anything about this platform or any topic you want to learn!");
  };

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_KEY);
    const flow = ONBOARDING_FLOWS[user?.role || 'learner'];
    setOnboarding({ step: 0, flow });
    setMessages([]);
    addBotMessage(flow[0].message);
  };

  const currentStep = onboarding ? onboarding.flow[onboarding.step] : null;

  const TABS = [
    { id: 'chat',  icon: Sparkles,      label: 'Chat' },
    { id: 'modes', icon: GraduationCap, label: 'Study Modes' },
    { id: 'tips',  icon: Lightbulb,     label: 'Page Tips' },
    { id: 'faq',   icon: HelpCircle,    label: 'FAQ' },
  ];

  return (
    <>
      {/* Page bubble */}
      <AnimatePresence>
        {showBubble && !open && (
          <motion.div
            initial={{ opacity: 0, x: 16, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 16, scale: 0.9 }}
            className="fixed bottom-24 right-6 z-40 bg-white border border-surface-border rounded-2xl px-4 py-2.5 shadow-card-md text-xs font-semibold text-text-primary max-w-[180px]"
          >
            {bubbleMsg}
            <div className="absolute bottom-[-6px] right-5 w-3 h-3 bg-white border-r border-b border-surface-border rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button — no background circle, just the face */}
      <motion.button
        onClick={handleOpen}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center drop-shadow-lg"
        title="Ask Ana"
        style={{ width: 64, height: 64 }}
      >
        <BotFace size={64} mood={mood} />
        {!open && messages.filter(m => m.role === 'bot').length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white text-[9px] font-bold text-white flex items-center justify-center">
            {messages.filter(m => m.role === 'bot').length}
          </span>
        )}
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 24 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="fixed bottom-24 right-6 z-50 w-[360px] sm:w-[400px] bg-white rounded-3xl shadow-card-lg border border-surface-border overflow-hidden flex flex-col"
            style={{ maxHeight: '580px' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 px-4 py-3 flex items-center gap-3 shrink-0">
              <BotFace size={44} mood={mood} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-white text-sm">Ana</p>
                  <span className="bg-white/20 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">AI Professor</span>
                </div>
                <p className="text-indigo-200 text-[11px] flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  Teach · Quiz · Study Notes · Exam Prep
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={resetOnboarding} className="p-1.5 text-indigo-200 hover:text-white hover:bg-white/10 rounded-lg transition-all" title="Restart tour">
                  <RotateCcw size={13} />
                </button>
                <button onClick={() => setOpen(false)} className="p-1.5 text-indigo-200 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-surface-border bg-slate-50 shrink-0">
              {TABS.map(({ id, icon: Icon, label }) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  className={'flex-1 flex items-center justify-center gap-1 py-2.5 text-[10px] font-semibold transition-all ' + (
                    activeTab === id
                      ? 'text-indigo-700 border-b-2 border-indigo-600 bg-white'
                      : 'text-text-muted hover:text-text-secondary'
                  )}>
                  <Icon size={11} />{label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">

              {/* ── CHAT ─────────────────────────────────────────────────── */}
              {activeTab === 'chat' && (
                <div className="p-3 space-y-3 min-h-[200px]">
                  {messages.length === 0 && !isTyping && (
                    <div className="text-center py-4">
                      <BotFace size={60} mood="excited" />
                      <p className="text-text-primary font-bold text-sm mt-2">Hi! I'm Ana 👋</p>
                      <p className="text-text-muted text-xs mt-0.5">Your AI Professor & Study Assistant</p>
                      <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                        {SUGGESTIONS.map(s => (
                          <button key={s} onClick={() => handleSend(s)}
                            className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 px-2.5 py-1.5 rounded-full transition-all font-medium">
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((msg, i) => <Message key={i} msg={msg} />)}
                  {isTyping && <TypingDots />}

                  {/* Onboarding controls */}
                  {onboarding && currentStep && !isTyping && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                      <div className="flex gap-1 justify-center">
                        {onboarding.flow.map((_, i) => (
                          <div key={i} className={'h-1.5 rounded-full transition-all ' + (
                            i === onboarding.step ? 'w-5 bg-indigo-600' : i < onboarding.step ? 'w-1.5 bg-indigo-300' : 'w-1.5 bg-slate-200'
                          )} />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        {currentStep.action && (
                          <button onClick={() => { navigate(currentStep.action.path); nextOnboardingStep(); }}
                            className="flex-1 btn-primary text-xs py-2 flex items-center justify-center gap-1">
                            {currentStep.action.label} <ChevronRight size={11} />
                          </button>
                        )}
                        <button onClick={nextOnboardingStep}
                          className={(currentStep.action ? '' : 'flex-1 ') + 'btn-secondary text-xs py-2'}>
                          {onboarding.step === onboarding.flow.length - 1 ? 'Finish ✓' : 'Next →'}
                        </button>
                        {onboarding.step === 0 && (
                          <button onClick={skipOnboarding} className="text-xs text-text-muted hover:text-text-secondary px-2">Skip</button>
                        )}
                      </div>
                    </motion.div>
                  )}
                  <div ref={bottomRef} />
                </div>
              )}

              {/* ── STUDY MODES ──────────────────────────────────────────── */}
              {activeTab === 'modes' && (
                <div className="p-4 space-y-3">
                  <div className="text-center mb-1">
                    <p className="font-bold text-text-primary text-sm">Ana's Study Modes</p>
                    <p className="text-text-muted text-xs mt-0.5">Click any mode to activate it in chat</p>
                  </div>
                  {STUDY_MODES_LIST.map(mode => (
                    <button key={mode.label}
                      onClick={() => { setActiveTab('chat'); setInput(mode.prefix); setTimeout(() => inputRef.current?.focus(), 100); }}
                      className="w-full flex items-center gap-3 p-3 bg-white border border-surface-border rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left">
                      <span className="text-2xl shrink-0">{mode.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary">{mode.label}</p>
                        <p className="text-xs text-text-muted">{mode.desc}</p>
                      </div>
                      <ChevronRight size={14} className="text-text-muted shrink-0" />
                    </button>
                  ))}
                  <div className="mt-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                    <p className="text-xs font-semibold text-indigo-700 mb-1">💡 How to use modes</p>
                    <p className="text-xs text-indigo-600">Type the mode name followed by your topic. Example: <strong>"Exam mode: machine learning"</strong> or <strong>"Quiz me on Python"</strong></p>
                  </div>
                </div>
              )}

              {/* ── PAGE TIPS ────────────────────────────────────────────── */}
              {activeTab === 'tips' && (
                <div className="p-4">
                  {pageInfo ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                        <span className="text-3xl">{pageInfo.emoji}</span>
                        <div>
                          <p className="font-bold text-text-primary text-sm">{pageInfo.title}</p>
                          <p className="text-text-muted text-xs">{pageInfo.description}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {pageInfo.tips.map((tip, i) => (
                          <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                            className="flex items-start gap-2.5 p-2.5 bg-white rounded-xl border border-surface-border">
                            <span className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                            <p className="text-text-secondary text-xs leading-relaxed">{tip}</p>
                          </motion.div>
                        ))}
                      </div>
                      {pageInfo.quickActions?.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Quick Actions</p>
                          {pageInfo.quickActions.map(a => (
                            <button key={a.path} onClick={() => { navigate(a.path); setOpen(false); }}
                              className="w-full flex items-center justify-between px-3 py-2.5 bg-white border border-surface-border rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all text-xs font-medium text-text-primary">
                              {a.label} <ChevronRight size={13} className="text-text-muted" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <Lightbulb size={28} className="text-slate-200 mx-auto mb-2" />
                      <p className="text-text-muted text-sm">No tips for this page yet.</p>
                      <p className="text-text-muted text-xs mt-1">Switch to Chat and ask Ana anything!</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── FAQ ──────────────────────────────────────────────────── */}
              {activeTab === 'faq' && (
                <div className="p-3 space-y-2">
                  <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider px-1 mb-3">Common Questions</p>
                  {FAQ.map((item, i) => (
                    <motion.details key={i} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className="group bg-white border border-surface-border rounded-xl overflow-hidden">
                      <summary className="flex items-center justify-between px-3.5 py-3 cursor-pointer list-none text-xs font-semibold text-text-primary hover:bg-surface-hover transition-colors">
                        <span>{item.q}</span>
                        <ChevronRight size={13} className="text-text-muted group-open:rotate-90 transition-transform shrink-0 ml-2" />
                      </summary>
                      <div className="px-3.5 pb-3 text-xs text-text-secondary leading-relaxed border-t border-surface-border pt-2.5">{item.a}</div>
                    </motion.details>
                  ))}
                </div>
              )}
            </div>

            {/* Input — chat tab only */}
            {activeTab === 'chat' && (
              <div className="p-3 border-t border-surface-border bg-slate-50 shrink-0">
                {/* Mode chips */}
                <div className="flex gap-1.5 mb-2 overflow-x-auto pb-0.5">
                  {QUICK_MODES.map(m => (
                    <button key={m.label}
                      onClick={() => { setInput(m.text); setTimeout(() => inputRef.current?.focus(), 50); }}
                      className="flex items-center gap-1 px-2.5 py-1 bg-white border border-surface-border hover:border-indigo-300 hover:bg-indigo-50 rounded-full text-[10px] font-semibold text-text-secondary hover:text-indigo-700 transition-all whitespace-nowrap shrink-0">
                      {m.icon} {m.label}
                    </button>
                  ))}
                </div>
                <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                  <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                    placeholder="Ask Ana anything..."
                    className="flex-1 text-xs bg-white border border-surface-border rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition-all"
                    disabled={isTyping}
                  />
                  <button type="submit" disabled={!input.trim() || isTyping}
                    className="w-9 h-9 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-all active:scale-95">
                    <Send size={14} />
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
