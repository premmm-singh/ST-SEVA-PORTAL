import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { grievanceService } from '../../services/grievanceService';

const CATEGORIES = [
  { id: "ALL", label: "All Questions" },
  { id: "APPLICATION", label: "Application & Eligibility" },
  { id: "VERIFICATION", label: "College Scrutiny & Delays" },
  { id: "DBT_PAYMENT", label: "DBT & Bank Credit" },
  { id: "DEFECT_RECTIFICATION", label: "Defects & Resubmission" },
  { id: "SLAS_AND_APPEALS", label: "SLAs & Legal Appeals" }
];

export default function HelpdeskFaqPage() {
  const [articles, setArticles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [openAccordion, setOpenAccordion] = useState(null);
  const [loading, setLoading] = useState(false);

  // WhatsApp Bot Simulation State
  const [showWhatsAppBot, setShowWhatsAppBot] = useState(false);
  const [waPhone, setWaPhone] = useState("+91 98765 43210");
  const [waInput, setWaInput] = useState("");
  const [waMessages, setWaMessages] = useState([
    { sender: "bot", text: "🏛️ *Namaste! Welcome to ST Seva Grievance WhatsApp Desk.*\n\nReply `STATUS <TicketID>` to track an existing complaint or `NEW <DELAY|REJECTION|PAYMENT|COLLEGE> <Details>` to lodge a new complaint." }
  ]);
  const [waLoading, setWaLoading] = useState(false);

  useEffect(() => {
    loadArticles();
  }, [selectedCategory]);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const data = await grievanceService.getFaqArticles({
        category: selectedCategory,
        query: searchQuery.trim() || undefined
      });
      setArticles(data);
    } catch (err) {
      console.error("Failed to load FAQs", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadArticles();
  };

  const toggleAccordion = async (id) => {
    if (openAccordion === id) {
      setOpenAccordion(null);
    } else {
      setOpenAccordion(id);
      // Record view count
      try {
        await grievanceService.recordArticleView(id);
      } catch (e) {
        // silent fail
      }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!waInput.trim()) return;

    const userText = waInput.trim();
    setWaMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setWaInput("");
    setWaLoading(true);

    try {
      const res = await grievanceService.interactWhatsAppBot({
        phone_number: waPhone.replace(/\s+/g, ''),
        message_text: userText
      });
      setWaMessages((prev) => [...prev, { sender: "bot", text: res.reply }]);
    } catch (err) {
      setWaMessages((prev) => [...prev, { sender: "bot", text: "⚠️ Temporary connection glitch. Please try again or visit portal directly." }]);
    } finally {
      setWaLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white rounded-xl p-8 shadow-md mb-8 text-center">
        <span className="bg-emerald-900/60 text-emerald-100 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          ST Seva Helpdesk & Knowledgebase
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold mt-2">How can we assist you today?</h1>
        <p className="text-sm text-emerald-100 mt-2 max-w-xl mx-auto">
          Find instant answers to statutory scholarship rules, eligibility criteria, DBT disbursement steps, and grievance redressal timelines.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="max-w-xl mx-auto mt-6 flex gap-2">
          <input
            type="text"
            placeholder="Search keywords (e.g. caste certificate, DBT failure, 7-day SLA)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-3 bg-white text-gray-900 rounded-lg text-sm shadow focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold text-sm rounded-lg shadow transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Quick Action Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link
          to="/grievance/file"
          className="p-5 bg-white border border-gray-200 hover:border-brand-500 rounded-xl shadow-sm transition hover:shadow group flex items-start space-x-3"
        >
          <span className="text-2xl p-2 bg-brand-50 text-brand-600 rounded-lg group-hover:scale-110 transition">
            ✍️
          </span>
          <div>
            <h3 className="text-sm font-bold text-gray-900 group-hover:text-brand-600">Lodge Formal Grievance</h3>
            <p className="text-xs text-gray-500 mt-1">Submit under Right to Public Services Act with 7-day statutory SLA.</p>
          </div>
        </Link>

        <Link
          to="/grievance/track"
          className="p-5 bg-white border border-gray-200 hover:border-brand-500 rounded-xl shadow-sm transition hover:shadow group flex items-start space-x-3"
        >
          <span className="text-2xl p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-110 transition">
            🔍
          </span>
          <div>
            <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-600">Track Grievance / ATR</h3>
            <p className="text-xs text-gray-500 mt-1">Check live progress, hearing notices, and Action Taken Reports.</p>
          </div>
        </Link>

        <div
          onClick={() => setShowWhatsAppBot(!showWhatsAppBot)}
          className="p-5 bg-white border border-emerald-200 hover:border-emerald-500 rounded-xl shadow-sm transition hover:shadow group flex items-start space-x-3 cursor-pointer"
        >
          <span className="text-2xl p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:scale-110 transition">
            💬
          </span>
          <div>
            <h3 className="text-sm font-bold text-gray-900 group-hover:text-emerald-600">WhatsApp Helpdesk Bot</h3>
            <p className="text-xs text-gray-500 mt-1">Simulate interactive conversational complaint intake & status checks.</p>
          </div>
        </div>
      </div>

      {/* WhatsApp Bot Simulation Widget (Toggled) */}
      {showWhatsAppBot && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-6 shadow-sm mb-8">
          <div className="flex justify-between items-center pb-3 mb-4 border-b border-emerald-200">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🟢</span>
              <div>
                <h3 className="text-sm font-bold text-emerald-950">
                  ST Seva WhatsApp Business Grievance Bot (Demo Simulator)
                </h3>
                <p className="text-[11px] text-emerald-800">
                  Government of Jharkhand Official Helpline: +91 651-2400118
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowWhatsAppBot(false)}
              className="text-emerald-700 hover:text-emerald-900 text-sm font-bold"
            >
              ✕ Close
            </button>
          </div>

          <div className="bg-[#ECE5DD] rounded-lg p-4 h-64 overflow-y-auto space-y-3 mb-3 border border-emerald-200 text-xs">
            {waMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-md p-3 rounded-lg shadow-sm whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-[#DCF8C6] text-gray-900 rounded-tr-none'
                      : 'bg-white text-gray-800 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {waLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-2 rounded-lg text-gray-500 text-xs italic">
                  ST Seva Bot is typing...
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              placeholder="Try: STATUS GRV-JH-2026-A1B2C3 or NEW DELAY Application pending 20 days"
              value={waInput}
              onChange={(e) => setWaInput(e.target.value)}
              className="flex-1 px-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={waLoading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-sm transition"
            >
              Send
            </button>
          </form>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedCategory === cat.id
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Accordion FAQ List */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-center py-8 text-xs text-gray-500">Loading knowledgebase articles...</p>
        ) : articles.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-sm font-semibold text-gray-700">No articles matched your search.</p>
            <p className="text-xs text-gray-500 mt-1">Try different keywords or lodge a direct complaint.</p>
          </div>
        ) : (
          articles.map((item) => {
            const isOpen = openAccordion === item.id;
            return (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden transition shadow-sm hover:border-gray-300"
              >
                <button
                  onClick={() => toggleAccordion(item.id)}
                  className="w-full px-5 py-4 text-left flex justify-between items-center gap-4 hover:bg-gray-50/50"
                >
                  <div>
                    <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider block mb-1">
                      {item.category}
                    </span>
                    <h3 className="text-sm font-bold text-gray-900">{item.question}</h3>
                  </div>
                  <span className={`text-base font-bold text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-gray-700 leading-relaxed border-t border-gray-100 bg-gray-50/30">
                    <p className="mt-2 whitespace-pre-wrap">{item.answer}</p>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                      <span>🏷️ Tags: {item.tags}</span>
                      <span>👁️ {item.view_count} views</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
