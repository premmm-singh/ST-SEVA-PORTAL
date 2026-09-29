import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronDown,
  ExternalLink,
  Search,
  User,
  LogOut,
  Bell,
  CheckCircle2,
  FileText,
  Clock,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import notificationService from '../../services/notificationService';

// Official SVG Emblem of India (Ashoka Lion Capital with Satyameva Jayate)
const StateEmblemOfIndia = () => (
  <div className="flex flex-col items-center justify-center shrink-0" title="State Emblem of India | भारत का राजचिह्न">
    <svg viewBox="0 0 100 130" className="w-12 h-14 text-[#212529]" fill="currentColor" aria-label="Emblem of India">
      {/* Three Lions Top Profile */}
      <path d="M50 12 C44 12 40 16 38 21 C36 17 31 16 27 18 C22 21 21 27 23 32 C21 35 20 40 22 45 C24 49 28 52 33 53 C34 56 36 59 38 62 C37 65 35 69 36 73 C37 77 40 80 44 82 C46 83 48 83 50 83 C52 83 54 83 56 82 C60 80 63 77 64 73 C65 69 63 65 62 62 C64 59 66 56 67 53 C72 52 76 49 78 45 C80 40 79 35 77 32 C79 27 78 21 73 18 C69 16 64 17 62 21 C60 16 56 12 50 12 Z M50 16 C53 16 56 19 57 23 C55 25 53 28 50 28 C47 28 45 25 43 23 C44 19 47 16 50 16 Z" />
      {/* Abacus Base Platform */}
      <rect x="18" y="86" width="64" height="6" rx="1" fill="#212529" />
      {/* Ashoka Chakra in Abacus */}
      <circle cx="50" cy="98" r="8" fill="none" stroke="#003366" strokeWidth="2" />
      <circle cx="50" cy="98" r="2.5" fill="#003366" />
      {/* Dharma Spokes */}
      <line x1="50" y1="90" x2="50" y2="106" stroke="#003366" strokeWidth="1" />
      <line x1="42" y1="98" x2="58" y2="98" stroke="#003366" strokeWidth="1" />
      <line x1="44.3" y1="92.3" x2="55.7" y2="103.7" stroke="#003366" strokeWidth="1" />
      <line x1="44.3" y1="103.7" x2="55.7" y2="92.3" stroke="#003366" strokeWidth="1" />
      {/* Bull and Horse silhouette marks */}
      <circle cx="28" cy="98" r="3" fill="#212529" />
      <circle cx="72" cy="98" r="3" fill="#212529" />
      {/* Pedestal Bottom Plate */}
      <rect x="12" y="108" width="76" height="5" rx="1" fill="#212529" />
      {/* Satyameva Jayate (सत्यमेव जयते) Inscription text */}
      <text x="50" y="124" textAnchor="middle" fontSize="9" fontWeight="bold" fontFamily="'Noto Serif Devanagari', serif" fill="#1e293b" letterSpacing="0.5">
        सत्यमेव जयते
      </text>
    </svg>
  </div>
);

// Azadi Ka Amrit Mahotsav SVG Logo
const AzadiMahotsavLogo = () => (
  <div className="flex items-center gap-1.5 border border-slate-200 px-2 py-1 bg-white" title="75+ Azadi Ka Amrit Mahotsav">
    <div className="flex flex-col text-right">
      <span className="text-[13px] font-black leading-none text-[#FF9933]">आज़ादी का</span>
      <span className="text-[11px] font-bold leading-none text-[#138808]">अमृत महोत्सव</span>
    </div>
    <div className="w-8 h-8 rounded-full border border-amber-400 bg-amber-50 flex items-center justify-center font-serif font-black text-amber-700 text-xs shadow-2xs">
      75
    </div>
  </div>
);

// Digital India SVG Logo
const DigitalIndiaLogo = () => (
  <div className="flex items-center gap-1.5 border border-slate-200 px-2 py-1 bg-white" title="Digital India - Power To Empower">
    <div className="w-7 h-7 rounded-sm bg-[#003366] text-white flex items-center justify-center font-black text-[11px] tracking-tighter">
      DI
    </div>
    <div className="flex flex-col text-left leading-tight">
      <span className="text-[12px] font-extrabold text-[#003366]">Digital India</span>
      <span className="text-[8px] text-slate-500 font-semibold tracking-tight uppercase">Power To Empower</span>
    </div>
  </div>
);

const GovHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifs, setRecentNotifs] = useState([]);
  const [showBellDropdown, setShowBellDropdown] = useState(false);
  const [showSchemesMega, setShowSchemesMega] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const megaMenuRef = useRef(null);

  useEffect(() => {
    setMobileMenuOpen(false);
    setShowSchemesMega(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (megaMenuRef.current && !megaMenuRef.current.contains(event.target)) {
        setShowSchemesMega(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const data = await notificationService.getMyNotifications(false, 5);
        setUnreadCount(data.unread_count || 0);
        setRecentNotifs(data.items || []);
      } catch (err) {
        // silent fail fallback
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const scholarshipSchemes = [
    {
      id: 'pre-matric',
      name: 'Pre-Matric Scholarship for ST Students',
      hindi: 'अनुसूचित जनजाति प्री-मैट्रिक छात्रवृत्ति',
      classes: 'Class IX & X',
      amount: 'Up to ₹7,000 / year',
      income: '≤ ₹2.5 Lakh / annum'
    },
    {
      id: 'post-matric',
      name: 'Post-Matric Scholarship for ST Students',
      hindi: 'अनुसूचित जनजाति पोस्ट-मैट्रिक छात्रवृत्ति',
      classes: 'Class XI to Post-Graduate & Professional',
      amount: 'Full Course Fee + ₹1,200/mo Allowance',
      income: '≤ ₹2.5 Lakh / annum'
    },
    {
      id: 'nfst-fellowship',
      name: 'National Fellowship for Higher Education (NFST)',
      hindi: 'राष्ट्रीय उच्च शिक्षा फैलोशिप (एम.फिल / पीएच.डी)',
      classes: 'M.Phil / Ph.D Scholars',
      amount: '₹37,000 - ₹42,000 / month + HRA',
      income: 'Merit-based (UGC/CSIR NET)'
    },
    {
      id: 'nos-scholarship',
      name: 'National Overseas Scholarship for ST Candidates',
      hindi: 'राष्ट्रीय प्रवासी छात्रवृत्ति योजना (विदेश अध्ययन)',
      classes: 'Masters & Ph.D Abroad',
      amount: '100% Tuition + £9,900 / $15,400 Living Grant',
      income: '≤ ₹6.0 Lakh / annum'
    },
    {
      id: 'top-class-education',
      name: 'Top Class Education Scheme for ST Students',
      hindi: 'शीर्ष श्रेणी शिक्षा छात्रवृत्ति (आईआईटी, आईआईएम, एम्स)',
      classes: 'Notified Premier Institutes (IIT, IIM, AIIMS, NLUs)',
      amount: 'Full Tuition Fee + Living Expenses + Computer Grant',
      income: '≤ ₹6.0 Lakh / annum'
    }
  ];

  return (
    <header className="bg-white border-b border-[#E0E0E0] select-none font-sans sticky top-0 z-50">
      {/* 2. MAIN HEADER (Govt Emblem, Wordmark, Logos) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
        {/* Left: State Emblem of India + ST Seva Portal Wordmark */}
        <div className="flex items-center gap-3 sm:gap-5">
          <Link to="/" className="flex items-center gap-3 text-decoration-none group" style={{ textDecoration: 'none' }}>
            <StateEmblemOfIndia />
            <div className="flex flex-col">
              <span className="text-[13px] sm:text-[14px] text-slate-700 font-serif font-semibold leading-tight">
                जनजातीय कार्य मंत्रालय | Ministry of Tribal Affairs
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-2xl sm:text-3xl font-serif font-bold text-[#003366] tracking-tight">
                  ST Seva Portal
                </span>
                <span className="bg-[#FFF4E5] border border-[#FF9933] text-[#B84D00] text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wide">
                  Govt. of India
                </span>
              </div>
              <span className="text-[11px] text-slate-600 font-medium hidden sm:inline">
                National Scheduled Tribe Scholarship & Affirmative Verification Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Right: Digital India + Azadi Ka Amrit Mahotsav logos + User status */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3">
            <AzadiMahotsavLogo />
            <DigitalIndiaLogo />
          </div>

          {/* User profile / Login */}
          {user ? (
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowBellDropdown(!showBellDropdown)}
                  className="p-1.5 text-slate-700 border border-slate-300 hover:bg-slate-100 transition relative"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4 text-[#003366]" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold px-1 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showBellDropdown && (
                  <div className="absolute right-0 mt-1 w-80 bg-white border border-[#E0E0E0] shadow-md z-50">
                    <div className="p-2.5 bg-[#F1F5F9] border-b border-[#E0E0E0] font-bold text-xs text-slate-800 flex items-center justify-between">
                      <span>Official Notifications</span>
                      <Link to="/notifications" onClick={() => setShowBellDropdown(false)} className="text-[11px] text-[#003366] underline">
                        View All
                      </Link>
                    </div>
                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                      {recentNotifs.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500">No new notices.</div>
                      ) : (
                        recentNotifs.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              setShowBellDropdown(false);
                              navigate(n.action_url || '/notifications');
                            }}
                            className="p-2.5 text-xs hover:bg-[#F8F9FA] cursor-pointer"
                          >
                            <div className="font-bold text-slate-900 line-clamp-1">{n.title}</div>
                            <div className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{n.message}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Link
                to="/dashboard"
                className="bg-[#F1F5F9] border border-[#CBD5E1] text-[#003366] text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5 hover:bg-slate-200"
                style={{ textDecoration: 'none' }}
              >
                <User className="w-3.5 h-3.5" />
                <span className="capitalize">{user.role} Portal</span>
              </Link>

              <button
                onClick={logout}
                className="border border-[#CBD5E1] p-1.5 text-slate-600 hover:text-red-700 hover:bg-red-50"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="bg-[#003366] hover:bg-[#083D7C] text-white text-xs font-bold px-4 py-2 border border-[#002244] shadow-xs"
                style={{ textDecoration: 'none' }}
              >
                Scholar Login
              </Link>
              <Link
                to="/official-portal"
                className="bg-[#F8F9FA] hover:bg-slate-200 text-[#003366] text-xs font-semibold px-3 py-2 border border-[#CBD5E1] hidden sm:inline-block"
                style={{ textDecoration: 'none' }}
              >
                Officer Login
              </Link>
            </div>
          )}

          {/* Mobile menu toggle button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-700 border border-slate-300 ml-1"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Tricolor Ribbon: Saffron, White, Green strip */}
      <div className="h-[3px] w-full flex">
        <div className="w-1/3 bg-[#FF9933]" />
        <div className="w-1/3 bg-[#FFFFFF]" />
        <div className="w-1/3 bg-[#138808]" />
      </div>

      {/* 3. PRIMARY NAVIGATION BAR (Horizontal, Underline on Hover, Full Desktop Menu) */}
      <nav className="bg-[#003366] text-white border-b border-[#002244]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between">
          <ul className="hidden lg:flex items-center space-x-1 xl:space-x-2 text-[13px] font-medium tracking-wide">
            <li>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `block px-3 py-2.5 transition border-b-2 ${
                    isActive ? 'border-[#FF9933] text-white font-bold bg-[#002850]' : 'border-transparent text-slate-100 hover:text-white hover:underline'
                  }`
                }
                style={{ textDecoration: 'none' }}
              >
                Home
              </NavLink>
            </li>

            <li>
              <a
                href="#about"
                onClick={(e) => {
                  if (location.pathname !== '/') {
                    navigate('/#about');
                  }
                }}
                className="block px-3 py-2.5 transition border-b-2 border-transparent text-slate-100 hover:text-white hover:underline"
                style={{ textDecoration: 'none' }}
              >
                About Us
              </a>
            </li>

            {/* Schemes Dropdown with Mega Menu */}
            <li className="relative" ref={megaMenuRef}>
              <button
                type="button"
                onClick={() => setShowSchemesMega(!showSchemesMega)}
                onMouseEnter={() => setShowSchemesMega(true)}
                className={`flex items-center gap-1 px-3 py-2.5 transition border-b-2 cursor-pointer ${
                  showSchemesMega || location.pathname.startsWith('/schemes')
                    ? 'border-[#FF9933] text-white font-bold bg-[#002850]'
                    : 'border-transparent text-slate-100 hover:text-white hover:underline'
                }`}
              >
                <span>Schemes</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSchemesMega ? 'rotate-180' : ''}`} />
              </button>

              {/* Mega Menu Dropdown for Schemes (Columns layout, no cards) */}
              {showSchemesMega && (
                <div
                  onMouseLeave={() => setShowSchemesMega(false)}
                  className="absolute left-0 mt-0 w-[840px] bg-white text-[#212529] border border-[#CCCCCC] shadow-lg z-50 p-4"
                >
                  <div className="border-b border-[#E0E0E0] pb-2 mb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold font-serif text-[#003366]">
                        Government of India ST Scholarship & Fellowship Schemes (2026-27)
                      </h3>
                      <p className="text-[11px] text-slate-500 font-sans">
                        Ministry of Tribal Affairs Central Sector & Centrally Sponsored Schemes
                      </p>
                    </div>
                    <Link
                      to="/schemes"
                      onClick={() => setShowSchemesMega(false)}
                      className="text-xs text-[#003366] font-bold underline"
                    >
                      View All Schemes & Guidelines →
                    </Link>
                  </div>

                  {/* Table-based columns for the 5 Schemes */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {scholarshipSchemes.map((scheme) => (
                      <div
                        key={scheme.id}
                        className="p-2.5 border border-[#E0E0E0] bg-[#F8F9FA] hover:bg-[#F1F5F9] transition"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <Link
                            to={`/schemes?scheme=${scheme.id}`}
                            onClick={() => setShowSchemesMega(false)}
                            className="font-bold text-[#003366] hover:underline"
                          >
                            {scheme.name}
                          </Link>
                          <span className="text-[10px] bg-green-100 text-green-800 font-bold px-1 border border-green-300 shrink-0">
                            Active
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 mt-1 font-serif">{scheme.hindi}</div>
                        <div className="mt-1.5 text-[11px] text-slate-700 flex flex-col gap-0.5">
                          <div><span className="font-semibold">Target:</span> {scheme.classes}</div>
                          <div><span className="font-semibold">Assistance:</span> {scheme.amount}</div>
                          <div><span className="font-semibold">Income:</span> {scheme.income}</div>
                        </div>
                        <div className="mt-2 pt-1 border-t border-slate-200 flex justify-between items-center text-[11px]">
                          <Link
                            to={`/schemes?scheme=${scheme.id}`}
                            onClick={() => setShowSchemesMega(false)}
                            className="text-[#003366] font-semibold underline"
                          >
                            Scheme Details
                          </Link>
                          <Link
                            to="/applications/new"
                            onClick={() => setShowSchemesMega(false)}
                            className="bg-[#003366] text-white px-2 py-0.5 text-[10px] font-bold"
                            style={{ textDecoration: 'none' }}
                          >
                            Apply Online
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </li>

            <li>
              <NavLink
                to="/applications/new"
                className={({ isActive }) =>
                  `block px-3 py-2.5 transition border-b-2 ${
                    isActive ? 'border-[#FF9933] text-white font-bold bg-[#002850]' : 'border-transparent text-slate-100 hover:text-white hover:underline'
                  }`
                }
                style={{ textDecoration: 'none' }}
              >
                Apply Online
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/track-status"
                className={({ isActive }) =>
                  `block px-3 py-2.5 transition border-b-2 ${
                    isActive ? 'border-[#FF9933] text-white font-bold bg-[#002850]' : 'border-transparent text-slate-100 hover:text-white hover:underline'
                  }`
                }
                style={{ textDecoration: 'none' }}
              >
                Check Status
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/verify-certificate"
                className={({ isActive }) =>
                  `block px-3 py-2.5 transition border-b-2 ${
                    isActive ? 'border-[#FF9933] text-white font-bold bg-[#002850]' : 'border-transparent text-slate-100 hover:text-white hover:underline'
                  }`
                }
                style={{ textDecoration: 'none' }}
              >
                Documents
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/grievance/file"
                className={({ isActive }) =>
                  `block px-3 py-2.5 transition border-b-2 ${
                    isActive ? 'border-[#FF9933] text-white font-bold bg-[#002850]' : 'border-transparent text-slate-100 hover:text-white hover:underline'
                  }`
                }
                style={{ textDecoration: 'none' }}
              >
                Grievance
              </NavLink>
            </li>

            <li>
              <a
                href="#contact"
                onClick={(e) => {
                  if (location.pathname !== '/') {
                    navigate('/#contact');
                  }
                }}
                className="block px-3 py-2.5 transition border-b-2 border-transparent text-slate-100 hover:text-white hover:underline"
                style={{ textDecoration: 'none' }}
              >
                Contact
              </a>
            </li>
          </ul>

          {/* Quick Search on Right */}
          <div className="hidden lg:flex items-center gap-1.5 py-1.5">
            <input
              type="text"
              placeholder="Search scheme, circular, or guideline..."
              className="bg-[#002244] text-white placeholder-slate-400 text-xs px-2.5 py-1 border border-blue-400/40 focus:outline-none focus:ring-1 focus:ring-amber-400 w-56"
            />
            <button className="bg-[#FF9933] text-black font-bold p-1 hover:bg-amber-400" title="Search">
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer (Accessible on smaller screens) */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-[#E0E0E0] p-4 text-xs space-y-2">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 font-bold text-[#003366] border-b border-slate-100">
            Home
          </Link>
          <a href="#about" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-slate-700 border-b border-slate-100">
            About Us
          </a>
          <Link to="/schemes" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 font-bold text-[#003366] border-b border-slate-100">
            All Schemes (Pre-Matric, Post-Matric, NFST, NOS, Top-Class)
          </Link>
          <Link to="/applications/new" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 font-bold text-[#003366] border-b border-slate-100">
            Apply Online
          </Link>
          <Link to="/track-status" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-slate-700 border-b border-slate-100">
            Check Status
          </Link>
          <Link to="/verify-certificate" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-slate-700 border-b border-slate-100">
            Documents & Verification
          </Link>
          <Link to="/grievance/file" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-slate-700 border-b border-slate-100">
            Grievance Redressal
          </Link>
          <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-slate-700">
            Contact
          </a>
        </div>
      )}
    </header>
  );
};

export default GovHeader;
