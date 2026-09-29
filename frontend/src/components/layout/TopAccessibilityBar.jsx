import React from 'react';
import { Link } from 'react-router-dom';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useAuth } from '../../context/AuthContext';

const TopAccessibilityBar = () => {
  const {
    fontSize, setFontSize,
    language, setLanguage,
    speakText
  } = useAccessibility();
  const { user } = useAuth();

  const handleSkipToMain = (e) => {
    e.preventDefault();
    const mainEl = document.getElementById('main-content');
    if (mainEl) {
      mainEl.setAttribute('tabindex', '-1');
      mainEl.focus();
      mainEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScreenReader = (e) => {
    e.preventDefault();
    speakText("ST Seva Portal, Ministry of Tribal Affairs, Government of India. Official National Tribal Scholarship Portal.");
  };

  return (
    <div className="bg-[#003366] text-white text-[12px] py-1 px-4 sm:px-8 border-b border-[#002244] select-none font-sans">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-1">
        {/* Left: भारत सरकार | Government of India */}
        <div className="flex items-center gap-2">
          <span className="font-semibold tracking-wide">
            भारत सरकार <span className="opacity-60 mx-1">|</span> Government of India
          </span>
        </div>

        {/* Center: Skip to Main Content | Screen Reader Access */}
        <div className="hidden md:flex items-center gap-3 text-[11px] text-slate-200">
          <a
            href="#main-content"
            onClick={handleSkipToMain}
            className="hover:text-white hover:underline text-slate-200 focus:outline-none focus:ring-1 focus:ring-white px-1"
          >
            Skip to Main Content
          </a>
          <span className="opacity-40">|</span>
          <button
            onClick={handleScreenReader}
            className="hover:text-white hover:underline text-slate-200 focus:outline-none focus:ring-1 focus:ring-white px-1 cursor-pointer"
            title="Screen Reader Access"
          >
            Screen Reader Access
          </button>
        </div>

        {/* Right: A- A A+ (font size) | Hindi/English toggle | Login */}
        <div className="flex items-center gap-3 text-[11px]">
          {/* Font Resizing Controls A- A A+ */}
          <div className="flex items-center border border-blue-400/40 rounded-xs bg-[#002850]">
            <button
              onClick={() => setFontSize('font-normal')}
              className={`px-1.5 py-0.5 text-[11px] hover:bg-blue-800 ${fontSize === 'font-normal' ? 'font-bold bg-blue-900 text-amber-300' : 'text-slate-200'}`}
              title="Decrease Font Size (A-)"
              aria-label="Decrease Font Size"
            >
              A-
            </button>
            <span className="opacity-30">|</span>
            <button
              onClick={() => setFontSize('font-large')}
              className={`px-1.5 py-0.5 text-[11px] hover:bg-blue-800 ${fontSize === 'font-large' ? 'font-bold bg-blue-900 text-amber-300' : 'text-slate-200'}`}
              title="Normal Font Size (A)"
              aria-label="Normal Font Size"
            >
              A
            </button>
            <span className="opacity-30">|</span>
            <button
              onClick={() => setFontSize('font-xlarge')}
              className={`px-1.5 py-0.5 text-[11px] hover:bg-blue-800 ${fontSize === 'font-xlarge' ? 'font-bold bg-blue-900 text-amber-300' : 'text-slate-200'}`}
              title="Increase Font Size (A+)"
              aria-label="Increase Font Size"
            >
              A+
            </button>
          </div>

          <span className="opacity-40 hidden sm:inline">|</span>

          {/* Hindi/English Language Toggle */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setLanguage('hi')}
              className={`px-1.5 py-0.5 rounded-xs transition ${language === 'hi' ? 'bg-amber-500 text-black font-bold' : 'text-slate-200 hover:text-white'}`}
            >
              हिन्दी
            </button>
            <span className="opacity-40">/</span>
            <button
              onClick={() => setLanguage('en')}
              className={`px-1.5 py-0.5 rounded-xs transition ${language === 'en' ? 'bg-blue-900 text-amber-300 font-bold border border-blue-400/40' : 'text-slate-200 hover:text-white'}`}
            >
              English
            </button>
          </div>

          <span className="opacity-40">|</span>

          {/* Login or User status */}
          {user ? (
            <Link
              to="/dashboard"
              className="text-amber-300 font-semibold hover:underline hover:text-amber-200"
            >
              My Account ({user.role})
            </Link>
          ) : (
            <Link
              to="/login"
              className="text-amber-300 font-semibold hover:underline hover:text-amber-200"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopAccessibilityBar;
