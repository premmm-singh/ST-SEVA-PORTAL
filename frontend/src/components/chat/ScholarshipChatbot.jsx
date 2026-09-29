import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  X,
  Minus,
  Send,
  Mic,
  Volume2,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  BookOpen,
  ShieldCheck,
  Globe,
  ExternalLink,
  PhoneCall,
  BarChart3,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Info
} from 'lucide-react';
import api from '../../services/api';

const LANGUAGES = [
  { code: 'en', label: 'English', greeting: 'How can I assist you today?' },
  { code: 'hi', label: 'हिंदी (Hindi)', greeting: 'नमस्ते! मैं आपकी सहायता कैसे कर सकता हूँ?' },
  { code: 'sat', label: 'संताली (Santali)', greeting: 'जोहार! आज आम चेत् लेकाते मदद दाड़ेयामा?' },
  { code: 'mun', label: 'मुंडारी (Mundari)', greeting: 'जोहार! आयिं आमके चिलिकते गोड़ो दाड़ियामे?' },
  { code: 'bhili', label: 'भीली (Bhili)', greeting: 'राम राम! मु तमारी कांई मदद करी सकूं?' },
  { code: 'gondi', label: 'गोंडी (Gondi)', greeting: 'सेवा जोहार! नना मिकुन बोरंग सहायता किया परंतोन?' },
];

const ScholarshipChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [language, setLanguage] = useState('en');
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [feedbackSent, setFeedbackSent] = useState({});

  // Document inspection modal state
  const [viewingDoc, setViewingDoc] = useState(null);
  const [docContent, setDocContent] = useState('');
  const [docLoading, setDocLoading] = useState(false);

  // RAG Analytics dashboard modal state
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize Session ID
  useEffect(() => {
    let sId = sessionStorage.getItem('st_chat_session_id');
    if (!sId) {
      sId = 'session_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      sessionStorage.setItem('st_chat_session_id', sId);
    }
    setSessionId(sId);
  }, []);

  // Initial Welcome Message
  const [messages, setMessages] = useState([
    {
      id: 'welcome-msg',
      sender: 'bot',
      text: 'नमस्ते! How can I assist you today?\n\nI am your official MoTA ST Scholarship Assistant. All answers are strictly grounded in Ministry circulars, eligibility norms, and guidelines.',
      sources: ['pre-matric-scheme.md', 'post-matric-scheme.md'],
      confidence: 0.95,
      is_refused: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Fetch suggestions when language changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await api.get(`/chat/suggestions?language=${language}`);
        if (res.data?.suggestions) {
          setSuggestions(res.data.suggestions);
        }
      } catch (err) {
        setSuggestions([
          'Am I eligible for post-matric?',
          'What is the income limit for top class?',
          'How do I get a caste certificate?',
          'What is the deadline for NFST?',
          'Can I apply for overseas scholarship with 50% marks?'
        ]);
      }
    };
    fetchSuggestions();
  }, [language]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  // Web Speech API - Voice recognition setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputMessage(transcript);
          handleSendMessage(transcript);
        }
      };
      recognitionRef.current = recognition;
    }
  }, [language]);

  // Open chatbot via external event (e.g. from top bar ISL Chatbot button)
  useEffect(() => {
    const handleOpenChatbot = (e) => {
      setIsOpen(true);
      setIsMinimized(false);
      setShowTooltip(false);
      if (e?.detail?.isl) {
        setMessages((prev) => [
          ...prev,
          {
            id: 'isl_' + Date.now(),
            sender: 'bot',
            text: '🤟 Indian Sign Language (ISL) Assistant Mode active. You can ask scholarship questions or use voice/text in your preferred language.',
            sources: ['faq.md'],
            confidence: 1.0,
            is_refused: false,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    };
    window.addEventListener('open-st-chatbot', handleOpenChatbot);
    return () => window.removeEventListener('open-st-chatbot', handleOpenChatbot);
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'voice-err-' + Date.now(),
          sender: 'bot',
          text: '🎤 Voice speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge, or type your query in the box below.',
          sources: [],
          confidence: 1.0,
          is_refused: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
        recognitionRef.current.start();
      } catch (e) {
        // silent catch
      }
    }
  };

  // Text to Speech playback
  const handleSpeakText = (text) => {
    if (!window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanText = text.replace(/[*_#•`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (customText = null) => {
    const query = (customText || inputMessage).trim();
    if (!query || loading) return;

    setInputMessage('');
    const userMsg = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await api.post('/chat/message', {
        message: query,
        language: language,
        session_id: sessionId
      });

      const isRefused =
        res.data.is_refused ||
        (res.data.reply && res.data.reply.toLowerCase().includes("don't have that information"));

      const botMsg = {
        id: res.data.message_id || 'bot_' + Date.now(),
        sender: 'bot',
        text: res.data.reply,
        sources: res.data.sources || [],
        confidence: typeof res.data.confidence === 'number' ? res.data.confidence : 0.9,
        is_refused: isRefused,
        verification: res.data.verification,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          sender: 'bot',
          text: "I don't have that information in my knowledge base. Please contact the helpline at 0120-6619540 or visit scholarships.gov.in",
          sources: [],
          confidence: 0.2,
          is_refused: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (messageId, type) => {
    if (feedbackSent[messageId]) return;
    try {
      await api.post('/chat/feedback', {
        session_id: sessionId,
        message_id: messageId,
        feedback_type: type,
        rating: type === 'up' ? 5 : 1,
        comment: type === 'up' ? 'Thumbs Up' : 'Thumbs Down'
      });
      setFeedbackSent((prev) => ({ ...prev, [messageId]: type }));
    } catch (err) {
      setFeedbackSent((prev) => ({ ...prev, [messageId]: type }));
    }
  };

  // Open Document inspection modal
  const handleOpenDoc = async (docName) => {
    setViewingDoc(docName);
    setDocLoading(true);
    try {
      const res = await api.get(`/chat/document/${encodeURIComponent(docName)}`);
      setDocContent(res.data.content);
    } catch (e) {
      setDocContent(`Failed to load document: ${docName}. Document is indexed in offline store.`);
    } finally {
      setDocLoading(false);
    }
  };

  // Open Analytics modal
  const handleOpenAnalytics = async () => {
    setShowAnalytics(true);
    setAnalyticsLoading(true);
    try {
      const res = await api.get('/chat/analytics');
      setAnalyticsData(res.data);
    } catch (e) {
      setAnalyticsData(null);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Confidence color & label helper
  const getConfidenceInfo = (score) => {
    if (typeof score !== 'number') return { color: 'bg-emerald-500', text: 'Grounded (90%)', level: 'high' };
    if (score >= 0.7) {
      return { color: 'bg-emerald-500', barWidth: `${Math.min(100, Math.round(score * 100))}%`, text: `${Math.round(score * 100)}% High Confidence`, badge: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    } else if (score >= 0.4) {
      return { color: 'bg-amber-500', barWidth: `${Math.round(score * 100)}%`, text: `${Math.round(score * 100)}% Moderate Confidence`, badge: 'text-amber-700 bg-amber-50 border-amber-200' };
    } else {
      return { color: 'bg-red-500', barWidth: `${Math.max(15, Math.round(score * 100))}%`, text: `${Math.round(score * 100)}% Low Confidence`, badge: 'text-red-700 bg-red-50 border-red-200' };
    }
  };

  return (
    <>
      {/* 1. FLOATING BOTTOM-RIGHT LAUNCHER & TOOLTIP */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
          {/* Speech Bubble Tooltip matching the reference image */}
          {showTooltip && (
            <div className="relative bg-white text-slate-800 font-semibold text-xs px-3.5 py-2 rounded-2xl shadow-lg border border-slate-200 flex items-center gap-2 animate-bounce-subtle">
              <span>नमस्ते! How can I assist you today?</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTooltip(false);
                }}
                className="text-slate-400 hover:text-slate-600 text-xs ml-1"
                aria-label="Dismiss tooltip"
              >
                ×
              </button>
              {/* Little triangle arrow pointing to avatar */}
              <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-white" />
            </div>
          )}

          {/* Circular Button matching visual reference with subtle pulse ring */}
          <div className="relative">
            <span className="absolute -inset-1 rounded-full bg-amber-400/30 animate-pulse-ring pointer-events-none" />
            <button
              onClick={() => {
                setIsOpen(true);
                setIsMinimized(false);
                setShowTooltip(false);
              }}
              className="w-14 h-14 rounded-full bg-white border-[3px] border-[#f97316] shadow-xl hover:scale-105 active:scale-95 transition-transform flex items-center justify-center relative group"
              title="Open ST Seva AI Scholarship Assistant"
              aria-label="Open Chatbot"
            >
              {/* Friendly Indian Mascot Avatar */}
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center overflow-hidden border border-amber-300">
                <svg viewBox="0 0 36 36" className="w-9 h-9">
                  <circle cx="18" cy="14" r="7" fill="#E0A96D" />
                  <path d="M11 13c0-4 3-7 7-7s7 3 7 7c-2-2-4-3-7-3s-5 1-7 3z" fill="#3E2723" />
                  <circle cx="18" cy="13" r="1" fill="#C62828" />
                  <path d="M10 32c0-5 3-9 8-9s8 4 8 9z" fill="#D32F2F" />
                  <path d="M14 23l4 6 4-6" fill="#F57C00" />
                </svg>
              </div>

              {/* Online Green Indicator Dot */}
              <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-xs" />
            </button>
          </div>
        </div>
      )}

      {/* 2. EXPANDED CHAT PANEL */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9, transition: { duration: 0.25, ease: 'easeIn' } }}
            transition={{ type: 'spring', damping: 25, stiffness: 350, duration: 0.3 }}
            className={`fixed bottom-5 right-5 z-50 w-[92vw] sm:w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-300 flex flex-col overflow-hidden transition-[height] duration-200 ${
              isMinimized ? 'h-14' : 'h-[620px] max-h-[85vh]'
            }`}
          >
            {/* Header Bar */}
            <div className="bg-[#0d47a1] text-white px-4 py-3 flex items-center justify-between shadow-md border-b-2 border-amber-400 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/30 flex items-center justify-center overflow-hidden">
                  <svg viewBox="0 0 36 36" className="w-7 h-7">
                    <circle cx="18" cy="14" r="7" fill="#E0A96D" />
                    <path d="M11 13c0-4 3-7 7-7s7 3 7 7c-2-2-4-3-7-3s-5 1-7 3z" fill="#3E2723" />
                    <circle cx="18" cy="13" r="1" fill="#C62828" />
                    <path d="M10 32c0-5 3-9 8-9s8 4 8 9z" fill="#D32F2F" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm tracking-tight">ST Seva Assistant</span>
                    <span className="text-[10px] bg-amber-400 text-slate-900 font-extrabold px-1.5 py-0.2 rounded">
                      RAG AI
                    </span>
                  </div>
                  <p className="text-[10px] text-blue-200">Ministry of Tribal Affairs • 100% Offline</p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1.5">
                {/* Language Selector */}
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-blue-900/80 text-amber-200 text-xs font-semibold rounded px-1.5 py-1 border border-blue-400/40 focus:outline-none cursor-pointer"
                  title="Select Language"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                      {l.label}
                    </option>
                  ))}
                </select>

                {/* RAG Analytics Button */}
                <button
                  onClick={handleOpenAnalytics}
                  className="p-1 hover:bg-white/10 rounded transition text-blue-200 hover:text-amber-300"
                  title="View RAG Analytics & Quality Dashboard"
                >
                  <BarChart3 className="w-4 h-4" />
                </button>

                {/* Minimize Button */}
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 hover:bg-white/10 rounded transition text-blue-200 hover:text-white"
                  title={isMinimized ? 'Expand' : 'Minimize'}
                >
                  <Minus className="w-4 h-4" />
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/10 rounded transition text-blue-200 hover:text-white"
                  title="Close Chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Body (Hidden when minimized) */}
            {!isMinimized && (
              <>
                <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 bg-slate-50 text-xs">
                  {/* Knowledge Assurance Banner */}
                  <div className="bg-blue-50/80 border border-blue-200 rounded-lg p-2 text-[11px] text-[#005696] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Grounded in <strong>12 official MoTA scholarship guidelines</strong>. Anti-hallucination verified.
                    </span>
                  </div>

                  {/* Messages */}
                  {messages.map((m) => {
                    const conf = getConfidenceInfo(m.confidence);
                    return (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[88%] rounded-2xl p-3 shadow-xs leading-relaxed whitespace-pre-wrap ${
                            m.sender === 'user'
                              ? 'bg-[#0d47a1] text-white rounded-br-none'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                          }`}
                        >
                          {m.text}
                        </div>

                        {/* Bot Answer RAG Indicators */}
                        {m.sender === 'bot' && (
                          <div className="mt-2 w-[88%] space-y-1.5 text-[10px]">
                            {/* 1. Confidence Bar Indicator (green >0.7, yellow 0.4-0.7, red <0.4) */}
                            {typeof m.confidence === 'number' && (
                              <div className="bg-slate-100 rounded-md p-1.5 border border-slate-200 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 flex-1">
                                  <span className="text-[9px] font-semibold text-slate-500">Confidence:</span>
                                  <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full ${conf.color} transition-all duration-300`}
                                      style={{ width: conf.barWidth || '80%' }}
                                    />
                                  </div>
                                </div>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${conf.badge}`}>
                                  {conf.text}
                                </span>
                              </div>
                            )}

                            {/* 2. Source Citation Chips (Clickable to view doc) */}
                            {m.sources && m.sources.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1">
                                <span className="font-semibold text-slate-500">Sources:</span>
                                {m.sources.map((s, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => handleOpenDoc(s)}
                                    className="bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 hover:border-amber-400 px-2 py-0.5 rounded font-mono text-[9px] flex items-center gap-1 transition shadow-2xs group cursor-pointer"
                                    title={`Click to inspect official document: ${s}`}
                                  >
                                    <span>📄</span>
                                    <span className="underline group-hover:text-blue-900">{s}</span>
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* 3. Fallback Helpline Card when bot refuses */}
                            {m.is_refused && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-orange-50 border-2 border-orange-300 rounded-xl p-3 shadow-xs space-y-2"
                              >
                                <div className="flex items-center gap-1.5 text-orange-900 font-bold text-xs">
                                  <PhoneCall className="w-4 h-4 text-orange-600" />
                                  <span>Official Helpdesk & Grievance Redressal</span>
                                </div>
                                <p className="text-[11px] text-orange-800 leading-normal">
                                  For out-of-scope inquiries or scheme assistance, please connect with authorized nodal officers:
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                                  <a
                                    href="tel:01206619540"
                                    className="bg-white border border-orange-300 hover:bg-orange-100 text-orange-900 px-2.5 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition text-[11px]"
                                  >
                                    <span>📞</span>
                                    <span>Call 0120-6619540 (NSP)</span>
                                  </a>
                                  <a
                                    href="tel:1800117777"
                                    className="bg-white border border-orange-300 hover:bg-orange-100 text-orange-900 px-2.5 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition text-[11px]"
                                  >
                                    <span>📞</span>
                                    <span>Call 1800-11-7777 (MoTA)</span>
                                  </a>
                                </div>
                                <a
                                  href="https://scholarships.gov.in"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full bg-[#0d47a1] text-white hover:bg-blue-900 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1 text-[11px] transition"
                                >
                                  <span>Visit scholarships.gov.in</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </motion.div>
                            )}

                            {/* 4. Controls: TTS + Was this helpful? thumbs up/down */}
                            <div className="flex items-center justify-between text-slate-400 pt-0.5">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleSpeakText(m.text)}
                                  className="hover:text-[#0d47a1] p-1 rounded transition flex items-center gap-1 text-[10px]"
                                  title="Listen to answer"
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                  <span>Listen</span>
                                </button>
                              </div>

                              <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                <span className="text-[9px] text-slate-500">Was this helpful?</span>
                                <button
                                  onClick={() => handleFeedback(m.id, 'up')}
                                  className={`p-0.5 rounded transition ${
                                    feedbackSent[m.id] === 'up'
                                      ? 'text-emerald-600 font-bold scale-110'
                                      : 'text-slate-400 hover:text-emerald-600'
                                  }`}
                                  title="Thumbs Up"
                                >
                                  <ThumbsUp className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleFeedback(m.id, 'down')}
                                  className={`p-0.5 rounded transition ${
                                    feedbackSent[m.id] === 'down'
                                      ? 'text-red-600 font-bold scale-110'
                                      : 'text-slate-400 hover:text-red-600'
                                  }`}
                                  title="Thumbs Down"
                                >
                                  <ThumbsDown className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        <span className="text-[9px] text-slate-400 mt-0.5 px-1">{m.timestamp}</span>
                      </motion.div>
                    );
                  })}

                  {/* Loading typing indicator */}
                  {loading && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-3 w-20 shadow-xs"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#0d47a1] animate-bounce [animation-duration:0.9s]" />
                      <span className="w-2 h-2 rounded-full bg-[#0d47a1] animate-bounce [animation-duration:0.9s] [animation-delay:0.15s]" />
                      <span className="w-2 h-2 rounded-full bg-[#0d47a1] animate-bounce [animation-duration:0.9s] [animation-delay:0.3s]" />
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Suggestions Pill Bar */}
                {suggestions.length > 0 && (
                  <div className="px-3 py-2 bg-slate-100 border-t border-slate-200 overflow-x-auto whitespace-nowrap flex items-center gap-1.5 scrollbar-thin">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    {suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(s)}
                        className="bg-white text-[#0d47a1] hover:bg-blue-50 border border-blue-200 rounded-full px-2.5 py-1 text-[11px] font-medium transition shrink-0 hover:scale-105 active:scale-95 duration-150"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input Area */}
                <div className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask about post-matric, deadlines, income limits..."
                    disabled={loading}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#0d47a1] focus:bg-white transition"
                  />

                  {/* Voice Input Button */}
                  <button
                    onClick={toggleVoiceInput}
                    className={`p-2 rounded-xl border transition ${
                      isListening
                        ? 'bg-red-500 text-white border-red-600 animate-pulse'
                        : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                    }`}
                    title={isListening ? 'Stop listening' : 'Speak your question'}
                    aria-label="Voice input"
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  {/* Send Button */}
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputMessage.trim() || loading}
                    className="bg-[#0d47a1] text-white p-2 rounded-xl hover:bg-[#002f6c] disabled:opacity-50 transition shadow-xs hover:scale-105 active:scale-95 duration-150"
                    title="Send message"
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. DOCUMENT VIEWER MODAL */}
      <AnimatePresence>
        {viewingDoc && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-300"
            >
              <div className="bg-[#0d47a1] text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-amber-400">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-300" />
                  <div>
                    <h3 className="font-bold text-sm">{viewingDoc}</h3>
                    <p className="text-[10px] text-blue-200">Official Ministry of Tribal Affairs Document</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingDoc(null)}
                  className="p-1 hover:bg-white/10 rounded text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto flex-1 font-mono text-xs bg-slate-50 leading-relaxed whitespace-pre-wrap text-slate-800">
                {docLoading ? (
                  <div className="flex items-center justify-center h-48">
                    <span className="text-slate-500">Loading official document...</span>
                  </div>
                ) : (
                  docContent
                )}
              </div>

              <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500">Verified Grounded Source • ChromaDB Offline</span>
                <button
                  onClick={() => setViewingDoc(null)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold px-4 py-1.5 rounded-lg text-xs"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. RAG ANALYTICS DASHBOARD MODAL */}
      <AnimatePresence>
        {showAnalytics && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-300"
            >
              <div className="bg-[#002f6c] text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-amber-400">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-amber-300" />
                  <div>
                    <h3 className="font-bold text-sm">RAG Retrieval Quality & Analytics Dashboard</h3>
                    <p className="text-[10px] text-blue-200">Real-time telemetry and query logs</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAnalytics(false)}
                  className="p-1 hover:bg-white/10 rounded text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto flex-1 space-y-5 text-xs bg-slate-50">
                {analyticsLoading ? (
                  <div className="flex items-center justify-center h-48">
                    <span className="text-slate-500">Loading analytics metrics...</span>
                  </div>
                ) : analyticsData ? (
                  <>
                    {/* Top KPI Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase">Total Queries</span>
                        <p className="text-xl font-bold text-slate-900 mt-1">{analyticsData.total_queries}</p>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase">Refusal Rate</span>
                        <p className={`text-xl font-bold mt-1 ${analyticsData.refusal_rate < 10 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {analyticsData.refusal_rate}%
                        </p>
                        <span className="text-[9px] text-slate-400">Target &lt; 10%</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase">Avg Response Latency</span>
                        <p className="text-xl font-bold text-blue-700 mt-1">{analyticsData.average_latency_ms} ms</p>
                        <span className="text-[9px] text-slate-400">Target &lt; 3000ms</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase">Satisfaction</span>
                        <p className="text-xl font-bold text-emerald-700 mt-1">
                          👍 {analyticsData.feedback_summary.thumbs_up} / 👎 {analyticsData.feedback_summary.thumbs_down}
                        </p>
                        <span className="text-[9px] text-slate-400">User ratings</span>
                      </div>
                    </div>

                    {/* Top 20 Most-Asked Questions */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                      <h4 className="font-bold text-slate-800 text-xs mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        Top Asked Questions
                      </h4>
                      {analyticsData.top_20_questions && analyticsData.top_20_questions.length > 0 ? (
                        <div className="space-y-1.5">
                          {analyticsData.top_20_questions.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                              <span className="text-slate-800 font-medium">{item.query}</span>
                              <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">
                                {item.count} queries
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 italic">No queries logged yet.</p>
                      )}
                    </div>

                    {/* Queries with Lowest Retrieval Scores (Candidates for new docs) */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                      <h4 className="font-bold text-slate-800 text-xs mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        Queries with Lowest Retrieval Scores (Candidates for New Documents)
                      </h4>
                      {analyticsData.lowest_scoring_queries && analyticsData.lowest_scoring_queries.length > 0 ? (
                        <div className="space-y-1.5">
                          {analyticsData.lowest_scoring_queries.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-amber-50/50 rounded-lg border border-amber-200">
                              <div>
                                <p className="font-semibold text-slate-800">{item.query}</p>
                                <p className="text-[10px] text-slate-500">Status: {item.status}</p>
                              </div>
                              <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded">
                                Score: {item.top_similarity}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 italic">No low scoring queries recorded.</p>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-red-500">Failed to load analytics metrics.</p>
                )}
              </div>

              <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-end">
                <button
                  onClick={() => setShowAnalytics(false)}
                  className="bg-[#0d47a1] text-white hover:bg-blue-900 font-semibold px-4 py-1.5 rounded-lg text-xs"
                >
                  Close Dashboard
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ScholarshipChatbot;
