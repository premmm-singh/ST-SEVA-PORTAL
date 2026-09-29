import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Send,
  Mic,
  Volume2,
  BookOpen,
  ShieldCheck,
  Globe,
  Sparkles,
  ExternalLink,
  ChevronRight,
  FileText,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Info,
  PhoneCall,
  BarChart3,
  X,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import api from '../../services/api';

const KNOWLEDGE_DOCS = [
  { id: 'pre-matric-scheme.md', title: 'Pre-Matric Scholarship (Class IX & X)', category: 'Centrally Sponsored', income: '≤ ₹2.5 Lakh', allowance: '₹225 - ₹525/mo' },
  { id: 'post-matric-scheme.md', title: 'Post-Matric Scholarship (Class XI+)', category: 'Centrally Sponsored', income: '≤ ₹2.5 Lakh', allowance: '₹230 - ₹1,200/mo' },
  { id: 'top-class-scheme.md', title: 'Top Class Education Scheme (265 Institutes)', category: 'Central Sector', income: '≤ ₹6.0 Lakh', allowance: 'Full Tuition + Living' },
  { id: 'national-fellowship.md', title: 'National Fellowship (NFST M.Phil/Ph.D.)', category: '750 Slots / Year', income: 'No Income Cap', allowance: '₹37,000 - ₹42,000/mo' },
  { id: 'overseas-scholarship.md', title: 'National Overseas Scholarship (NOS)', category: 'Top 1000 QS Univ', income: '≤ ₹6.0 Lakh', allowance: 'USD $15,400/yr + Airfare' },
  { id: 'certificates-guide.md', title: 'Statutory Certificates & Issuing Authority', category: 'Compliance Guide', income: 'Official Circulars', allowance: 'Lifetime Validity' },
  { id: 'eligibility-rules.md', title: 'Eligibility Rules & Cap Matrices', category: 'Statutory Rules', income: 'Gap Years & Quotas', allowance: 'Normative Rules' },
  { id: 'application-process.md', title: 'NSP Application Lifecycle & OTR', category: 'Workflow SOP', income: 'DigiLocker / PFMS', allowance: 'DBT Direct Disbursal' },
  { id: 'deadlines-calendar.md', title: 'Statutory Deadlines & Calendar (AY 2026-27)', category: 'Official Dates', income: 'Disbursal Timeline', allowance: 'Annual Schedule' },
  { id: 'faq.md', title: '100+ Official MoTA FAQ Compendium', category: 'Official Q&A', income: 'Verification Help', allowance: 'Helpdesk Matrix' },
  { id: 'grievance-redressal.md', title: 'Grievance Redressal & Helpline Channels', category: 'Support & Escalation', income: 'Toll-Free 1800-11-7777', allowance: 'SLA Tracking' },
  { id: 'tribal-languages.md', title: 'Adi Vaani Multilingual Platform & BHASHINI', category: 'Tribal Dialects', income: 'Santali, Bhili, Gondi', allowance: 'Speech Engine' },
];

const LANGUAGES = [
  { code: 'en', label: 'English', greeting: 'How can I assist you today?' },
  { code: 'hi', label: 'हिंदी (Hindi)', greeting: 'नमस्ते! मैं आपकी सहायता कैसे कर सकता हूँ?' },
  { code: 'sat', label: 'संताली (Santali)', greeting: 'जोहार! आज आम चेत् लेकाते मदद दाड़ेयामा?' },
  { code: 'mun', label: 'मुंडारी (Mundari)', greeting: 'जोहार! आयिं आमके चिलिकते गोड़ो दाड़ियामे?' },
  { code: 'bhili', label: 'भीली (Bhili)', greeting: 'राम राम! मु तमारी कांई मदद करी सकूं?' },
  { code: 'gondi', label: 'गोंडी (Gondi)', greeting: 'सेवा जोहार! नना मिकुन बोरंग सहायता किया परंतोन?' },
];

export default function ScholarshipAssistantPage() {
  const [activeTab, setActiveTab] = useState('assistant'); // 'assistant' or 'analytics'
  const [language, setLanguage] = useState('en');
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docContent, setDocContent] = useState('');
  const [docLoading, setDocLoading] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState({});

  // Analytics
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [suggestions, setSuggestions] = useState([
    'Am I eligible for post-matric?',
    'What is the income limit for top class?',
    'How do I get a caste certificate?',
    'What is the deadline for NFST?',
    'Can I apply for overseas scholarship with 50% marks?'
  ]);
  const [messages, setMessages] = useState([
    {
      id: 'welcome-rag-msg',
      sender: 'bot',
      text: 'नमस्ते! How can I assist you today?\n\nI am the official ST Seva AI Scholarship Assistant for the Ministry of Tribal Affairs (MoTA). Every answer is strictly grounded in official government scholarship circulars and guidelines with source citations.',
      sources: ['pre-matric-scheme.md', 'post-matric-scheme.md', 'faq.md'],
      confidence: 0.95,
      is_refused: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    let sId = sessionStorage.getItem('st_chat_session_id');
    if (!sId) {
      sId = 'assistant_page_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      sessionStorage.setItem('st_chat_session_id', sId);
    }
    setSessionId(sId);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Load analytics when switching to analytics tab
  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab]);

  const fetchAnalytics = async () => {
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

  const handleOpenDoc = async (docName) => {
    setSelectedDoc(docName);
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

  const handleSendMessage = async (textToSend = null) => {
    const query = (textToSend || inputMessage).trim();
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

  // Confidence color & label helper
  const getConfidenceInfo = (score) => {
    if (typeof score !== 'number') return { color: 'bg-emerald-500', barWidth: '90%', text: '90% High Confidence', badge: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (score >= 0.7) {
      return { color: 'bg-emerald-500', barWidth: `${Math.min(100, Math.round(score * 100))}%`, text: `${Math.round(score * 100)}% High Confidence`, badge: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    } else if (score >= 0.4) {
      return { color: 'bg-amber-500', barWidth: `${Math.round(score * 100)}%`, text: `${Math.round(score * 100)}% Moderate Confidence`, badge: 'text-amber-700 bg-amber-50 border-amber-200' };
    } else {
      return { color: 'bg-red-500', barWidth: `${Math.max(15, Math.round(score * 100))}%`, text: `${Math.round(score * 100)}% Low Confidence`, badge: 'text-red-700 bg-red-50 border-red-200' };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Official Banner Header */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 rounded-2xl shadow-xl text-white p-6 sm:p-8 relative overflow-hidden border border-blue-900/60">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-xs font-bold tracking-wide uppercase flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Grounded RAG Assistant • 100% Offline & Anti-Hallucination
                </span>
                <span className="px-2.5 py-0.5 bg-blue-800 text-blue-200 rounded text-xs font-semibold">
                  12 Official MoTA Documents Indexed
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                नमस्ते! How can I assist you today?
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
                Ask questions regarding Scheduled Tribe pre-matric, post-matric, top class scholarships, national fellowships (NFST), and overseas scholarships (NOS). Every answer is strictly grounded in retrieved circulars.
              </p>
            </div>

            {/* Language & Tab Toggle Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveTab('assistant')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'assistant'
                    ? 'bg-amber-400 text-slate-900 shadow-md'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat Assistant</span>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'analytics'
                    ? 'bg-amber-400 text-slate-900 shadow-md'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>RAG Analytics</span>
              </button>

              <div className="flex items-center gap-2 bg-white/10 p-2 rounded-xl backdrop-blur-md border border-white/20">
                <Globe className="w-4 h-4 text-amber-300" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-transparent text-white font-semibold text-xs focus:outline-none cursor-pointer pr-2"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tab 1: Chat Assistant & Knowledge Docs */}
        {activeTab === 'assistant' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Conversational RAG Stream (8 Cols) */}
            <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[680px] overflow-hidden">
              
              {/* Chat Messages Stream */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50">
                {messages.map((m) => {
                  const conf = getConfidenceInfo(m.confidence);
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'} animate-row-insert`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-4 shadow-xs leading-relaxed whitespace-pre-wrap text-sm ${
                          m.sender === 'user'
                            ? 'bg-[#005696] text-white rounded-br-none'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                        }`}
                      >
                        {m.text}
                      </div>

                      {/* Bot RAG Indicators & Actions */}
                      {m.sender === 'bot' && (
                        <div className="mt-2 w-[85%] space-y-2 text-xs">
                          {/* 1. Confidence Bar Indicator */}
                          {typeof m.confidence === 'number' && (
                            <div className="bg-white rounded-lg p-2 border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 flex-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Retrieval Score:</span>
                                <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${conf.color} transition-all duration-300`}
                                    style={{ width: conf.barWidth }}
                                  />
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 rounded font-bold text-[10px] border ${conf.badge}`}>
                                {conf.text}
                              </span>
                            </div>
                          )}

                          {/* 2. Source Citation Chips (Clickable) */}
                          {m.sources && m.sources.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-bold text-slate-600 text-xs">Sources:</span>
                              {m.sources.map((s, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleOpenDoc(s)}
                                  className="bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 hover:border-amber-400 px-2.5 py-1 rounded font-mono text-[11px] flex items-center gap-1 cursor-pointer transition shadow-2xs group"
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
                            <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-3.5 shadow-xs space-y-2">
                              <div className="flex items-center gap-2 text-orange-950 font-bold text-xs">
                                <PhoneCall className="w-4 h-4 text-orange-600" />
                                <span>Official Helpdesk & Redressal Matrix</span>
                              </div>
                              <p className="text-xs text-orange-900 leading-normal">
                                For out-of-scope inquiries or scheme assistance, please connect with authorized nodal officers:
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                <a
                                  href="tel:01206619540"
                                  className="bg-white border border-orange-300 hover:bg-orange-100 text-orange-900 px-3 py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition text-xs shadow-2xs"
                                >
                                  <span>📞</span>
                                  <span>Call 0120-6619540 (NSP)</span>
                                </a>
                                <a
                                  href="tel:1800117777"
                                  className="bg-white border border-orange-300 hover:bg-orange-100 text-orange-900 px-3 py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition text-xs shadow-2xs"
                                >
                                  <span>📞</span>
                                  <span>Call 1800-11-7777 (MoTA)</span>
                                </a>
                              </div>
                              <a
                                href="https://scholarships.gov.in"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full bg-[#005696] text-white hover:bg-[#004070] py-2 rounded-lg font-semibold flex items-center justify-center gap-1 text-xs transition shadow-2xs"
                              >
                                <span>Visit scholarships.gov.in</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}

                          {/* 4. Was this helpful? feedback */}
                          <div className="flex items-center justify-between text-slate-400 pt-1">
                            <span className="text-[10px] text-slate-400">{m.timestamp}</span>
                            <div className="flex items-center gap-2 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                              <span className="text-[10px] text-slate-500 font-medium">Was this helpful?</span>
                              <button
                                onClick={() => handleFeedback(m.id, 'up')}
                                className={`p-0.5 rounded transition ${
                                  feedbackSent[m.id] === 'up'
                                    ? 'text-emerald-600 font-bold scale-110'
                                    : 'text-slate-400 hover:text-emerald-600'
                                }`}
                                title="Thumbs Up"
                              >
                                <ThumbsUp className="w-3.5 h-3.5" />
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
                                <ThumbsDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-3 w-32 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-[#005696] animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-[#005696] animate-bounce [animation-delay:0.15s]" />
                    <span className="w-2 h-2 rounded-full bg-[#005696] animate-bounce [animation-delay:0.3s]" />
                    <span className="text-xs text-slate-400 font-medium">Retrieving...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Suggestion Pills */}
              <div className="px-4 py-2.5 bg-slate-100/80 border-t border-slate-200 overflow-x-auto whitespace-nowrap flex items-center gap-2 scrollbar-thin">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(s)}
                    className="bg-white text-[#005696] hover:bg-blue-50 border border-blue-200 rounded-full px-3 py-1 text-xs font-semibold transition shrink-0 hover:scale-105 active:scale-95 duration-150"
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Input Area */}
              <div className="p-3.5 bg-white border-t border-slate-200 flex items-center gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask about ST scholarship eligibility, documents, allowances, deadlines..."
                  disabled={loading}
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm input-gov-focus transition"
                />

                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || loading}
                  className="bg-[#005696] text-white px-4 py-2.5 rounded-xl hover:bg-[#004070] disabled:opacity-50 transition shadow-sm font-bold text-xs flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </div>
            </div>

            {/* Right Column: 12 Knowledge Base Documents & Fact Inspector (4 Cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#005696]" />
                    <h3 className="font-bold text-slate-800 text-sm">Indexed MoTA Guidelines</h3>
                  </div>
                  <span className="text-[11px] font-mono bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-bold">
                    12 Docs
                  </span>
                </div>

                <div className="mt-3 space-y-2 max-h-[580px] overflow-y-auto pr-1">
                  {KNOWLEDGE_DOCS.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => handleOpenDoc(doc.id)}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/50 transition cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-[#005696] transition">
                          {doc.title}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] text-slate-500">
                        <span className="bg-slate-200/80 px-1.5 py-0.2 rounded font-mono text-[9px]">{doc.id}</span>
                        <span>•</span>
                        <span className="text-emerald-700 font-semibold">{doc.income}</span>
                        <span>•</span>
                        <span>{doc.allowance}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Tab 2: Dedicated RAG Analytics Dashboard */
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-900 rounded-xl">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Retrieval Quality Monitoring Dashboard</h2>
                    <p className="text-xs text-slate-500">Real-time telemetry, refusal rates, retrieval scores, and candidate gaps</p>
                  </div>
                </div>
                <button
                  onClick={fetchAnalytics}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                >
                  Refresh Telemetry
                </button>
              </div>

              {analyticsLoading ? (
                <div className="flex items-center justify-center h-48">
                  <span className="text-slate-500 font-medium">Loading retrieval analytics...</span>
                </div>
              ) : analyticsData ? (
                <div className="space-y-6">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <span className="text-xs font-semibold text-slate-500 uppercase">Total User Queries</span>
                      <p className="text-2xl font-bold text-slate-900 mt-1">{analyticsData.total_queries}</p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <span className="text-xs font-semibold text-slate-500 uppercase">Refusal Rate</span>
                      <p className={`text-2xl font-bold mt-1 ${analyticsData.refusal_rate < 10 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {analyticsData.refusal_rate}%
                      </p>
                      <span className="text-[10px] text-slate-400">Target &lt; 10% for valid questions</span>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <span className="text-xs font-semibold text-slate-500 uppercase">Average Latency</span>
                      <p className="text-2xl font-bold text-blue-800 mt-1">{analyticsData.average_latency_ms} ms</p>
                      <span className="text-[10px] text-slate-400">Target &lt; 3000ms on CPU</span>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <span className="text-xs font-semibold text-slate-500 uppercase">Feedback Ratio</span>
                      <p className="text-2xl font-bold text-emerald-700 mt-1">
                        👍 {analyticsData.feedback_summary.thumbs_up} / 👎 {analyticsData.feedback_summary.thumbs_down}
                      </p>
                      <span className="text-[10px] text-slate-400">User helpfulness votes</span>
                    </div>
                  </div>

                  {/* Top 20 Questions & Lowest Scores Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Top 20 Asked Questions */}
                    <div className="border border-slate-200 rounded-xl p-4 bg-white">
                      <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        Top 20 Most-Asked Questions
                      </h3>
                      {analyticsData.top_20_questions && analyticsData.top_20_questions.length > 0 ? (
                        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                          {analyticsData.top_20_questions.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                              <span className="font-medium text-slate-800">{item.query}</span>
                              <span className="bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded text-[11px]">
                                {item.count} asks
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 italic text-xs">No queries logged yet.</p>
                      )}
                    </div>

                    {/* Lowest Retrieval Scores (Candidates for new docs) */}
                    <div className="border border-slate-200 rounded-xl p-4 bg-white">
                      <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        Queries with Lowest Retrieval Scores (Candidates for New Documents)
                      </h3>
                      {analyticsData.lowest_scoring_queries && analyticsData.lowest_scoring_queries.length > 0 ? (
                        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                          {analyticsData.lowest_scoring_queries.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2.5 bg-amber-50/60 rounded-lg border border-amber-200 text-xs">
                              <div>
                                <p className="font-semibold text-slate-900">{item.query}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">Status: {item.status}</p>
                              </div>
                              <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded text-[11px]">
                                Score: {item.top_similarity}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 italic text-xs">No queries recorded with low retrieval score.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-red-500 text-xs">Failed to load analytics metrics from server.</p>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Document Content Modal */}
      <AnimatePresence>
        {selectedDoc && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-300"
            >
              <div className="bg-[#005696] text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-amber-400">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-300" />
                  <div>
                    <h3 className="font-bold text-sm">{selectedDoc}</h3>
                    <p className="text-[10px] text-blue-200">Official Ministry of Tribal Affairs Document</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="p-1 hover:bg-white/10 rounded text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto flex-1 font-mono text-xs bg-slate-50 leading-relaxed whitespace-pre-wrap text-slate-800">
                {docLoading ? (
                  <div className="flex items-center justify-center h-48">
                    <span className="text-slate-500">Loading document content...</span>
                  </div>
                ) : (
                  docContent
                )}
              </div>

              <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500">Verified Grounded Source • ChromaDB Offline</span>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold px-4 py-1.5 rounded-lg text-xs"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
