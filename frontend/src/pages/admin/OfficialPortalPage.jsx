import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  Building2,
  Lock,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  CreditCard,
  Radio,
  LifeBuoy,
  BarChart3,
  Network,
  Rocket,
  Sliders,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  KeyRound,
  Eye,
  EyeOff,
  LogOut,
  User,
  Shield,
  Users,
  Database,
  Activity,
  FileText,
  CheckSquare,
  Globe,
  Layers,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const OfficialPortalPage = () => {
  const { user, loginWithEmail, logout } = useAuth();
  const navigate = useNavigate();

  // Default evaluation accounts for Welfare & Administration
  const OFFICIAL_ROLES = {
    officer: {
      id: 'officer',
      title: 'District Welfare Officer',
      subtitle: 'DWO Ranchi / Khunti',
      email: 'officer@stseva.gov.in',
      password: 'Officer@1234',
      badge: 'Welfare Scrutiny & Verification'
    },
    admin: {
      id: 'admin',
      title: 'System Administrator',
      subtitle: 'Ministry of Tribal Affairs',
      email: 'admin@stseva.gov.in',
      password: 'Admin@1234',
      badge: 'Super Admin & Cyber Governance'
    }
  };

  // Login form state - Pre-filled with default District Welfare Officer credentials
  const [selectedRole, setSelectedRole] = useState('officer');
  const [email, setEmail] = useState('officer@stseva.gov.in');
  const [password, setPassword] = useState('Officer@1234');
  const [totpCode, setTotpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isOfficial = user && ['officer', 'admin', 'super_admin'].includes(user.role);

  // Authenticated workspace category tab - separate DWO and System Admin workspaces
  const [activeDeckTab, setActiveDeckTab] = useState(
    user?.role === 'officer' ? 'welfare_officer' : 'system_admin'
  );

  useEffect(() => {
    if (user?.role) {
      setActiveDeckTab(user.role === 'officer' ? 'welfare_officer' : 'system_admin');
    }
  }, [user?.role]);

  const handleSelectRole = (roleKey) => {
    setSelectedRole(roleKey);
    const target = OFFICIAL_ROLES[roleKey];
    setEmail(target.email);
    setPassword(target.password);
    setTotpCode('');
    setErrorMsg('');
  };

  const handleOfficialLogin = async (e, customEmail = null, customPass = null) => {
    e?.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      await loginWithEmail(customEmail || email, customPass || password, totpCode);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Authentication failed. Please verify government credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (roleKey) => {
    handleSelectRole(roleKey);
  };

  return (
    <div className="flex-1 bg-slate-900 text-slate-100 flex flex-col min-h-screen">
      {/* Top Security Banner */}
      <div className="bg-slate-950 border-b border-amber-500/30 px-4 sm:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-400 font-mono font-bold tracking-wide">
            <ShieldAlert className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>RESTRICTED ACCESS • AUTHORIZED GOVERNMENT OFFICIALS & ADMINS ONLY</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <span>IT Act 2000 § 66F Protected</span>
            <span className="hidden sm:inline">•</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              Cryptographic Audit Active
            </span>
          </div>
        </div>
      </div>

      {/* Hero Header */}
      <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900/90 border-b border-slate-800 px-4 sm:px-8 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Ministry of Tribal Affairs • Government of India</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              Tribal Welfare Authority & Administrative Command Deck
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              Dedicated, isolated gateway for District Welfare Officers (DWO), State Nodal Officers (SNO), and System Administrators to oversee scrutiny, merit allocations, DBT disbursements, and cyber governance.
            </p>
          </div>

          {user && (
            <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                <UserCheck className="w-6 h-6" />
              </div>
              <div className="text-left text-xs">
                <div className="text-slate-400 font-medium">Logged in as</div>
                <div className="text-white font-bold text-sm capitalize">{user.role?.replace('_', ' ')}</div>
                <div className="text-amber-400 font-mono text-[11px]">{user.email}</div>
              </div>
              <button
                onClick={() => logout()}
                className="ml-2 p-2 hover:bg-red-900/30 text-slate-400 hover:text-red-400 rounded-lg transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 w-full flex-1">
        {!isOfficial ? (
          /* STATE 1: OFFICIAL AUTHENTICATION GATEWAY */
          <div className="max-w-xl mx-auto">
            <div className="bg-slate-800/90 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md">
              <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-850 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Official Identity Verification</h2>
                    <p className="text-xs text-slate-400">Department Credentials Required</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-blue-900/60 text-blue-200 border border-blue-700 px-2.5 py-1 rounded-full font-bold">
                  256-Bit SSL
                </span>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                {errorMsg && (
                  <div className="p-3.5 bg-red-950/80 border border-red-700/60 rounded-xl text-xs text-red-200 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Role Switcher Tabs (District Welfare Officer & System Administrator) */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Select Official Role & Default Account
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-700">
                    {Object.values(OFFICIAL_ROLES).map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => handleSelectRole(role.id)}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                          selectedRole === role.id
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md scale-[1.02]'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <span className="leading-tight">{role.title}</span>
                        <span className={`text-[10px] ${selectedRole === role.id ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
                          {role.subtitle}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Role Description Badge */}
                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="text-slate-400">Default Authorized Role:</span>
                    <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[11px] font-semibold font-mono">
                      {OFFICIAL_ROLES[selectedRole].badge}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleOfficialLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Government Email / Employee ID
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="officer@stseva.gov.in"
                      required
                      className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Secure Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition pr-10 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>TOTP / Authenticator Token (Optional)</span>
                      <span className="text-[10px] text-slate-500">MFA Protected</span>
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="Leave blank for standard login"
                      className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition font-mono tracking-widest text-center"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-3 rounded-xl shadow-lg transition duration-200 text-sm flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    {loading ? (
                      'Authenticating Department Security...'
                    ) : (
                      <>
                        <span>Enter Official Command Deck</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={(e) => handleOfficialLogin(e, OFFICIAL_ROLES[selectedRole].email, OFFICIAL_ROLES[selectedRole].password)}
                    className="w-full bg-slate-900 hover:bg-slate-850 text-amber-300 border border-amber-500/40 hover:border-amber-400 font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <span>⚡ 1-Click Instant Login ({OFFICIAL_ROLES[selectedRole].title})</span>
                  </button>
                </form>

                {/* Quick Credentials for Development / Evaluation */}
                <div className="pt-4 border-t border-slate-700/80 space-y-2.5">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>Quick Evaluation Credentials (Click to Autofill)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectRole('officer')}
                      className={`text-left p-2.5 rounded-lg transition cursor-pointer border ${
                        selectedRole === 'officer'
                          ? 'bg-slate-850 border-amber-500 shadow-xs'
                          : 'bg-slate-900 hover:bg-slate-850 border-slate-700 hover:border-amber-500/60'
                      }`}
                    >
                      <div className="text-xs font-bold text-white flex items-center justify-between">
                        <span>District Welfare Officer</span>
                        {selectedRole === 'officer' && <span className="text-[10px] text-amber-400 font-mono">ACTIVE</span>}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">officer@stseva.gov.in</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectRole('admin')}
                      className={`text-left p-2.5 rounded-lg transition cursor-pointer border ${
                        selectedRole === 'admin'
                          ? 'bg-slate-850 border-amber-500 shadow-xs'
                          : 'bg-slate-900 hover:bg-slate-850 border-slate-700 hover:border-amber-500/60'
                      }`}
                    >
                      <div className="text-xs font-bold text-white flex items-center justify-between">
                        <span>System Administrator</span>
                        {selectedRole === 'admin' && <span className="text-[10px] text-amber-400 font-mono">ACTIVE</span>}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">admin@stseva.gov.in</div>
                    </button>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <Link
                    to="/"
                    className="text-xs text-slate-400 hover:text-white transition flex items-center justify-center gap-1"
                  >
                    <span>← Return to Public Student Portal</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* STATE 2: AUTHENTICATED WELFARE & ADMIN COMMAND HUB */
          <div className="space-y-8">
            {/* Status Strip */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${
                  user.role === 'officer'
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                }`}>
                  {user.role === 'officer' ? <Building2 className="w-5 h-5" /> : <Sliders className="w-5 h-5" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Identity Verified: Authorized Government Staff</span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700/60 font-mono">
                      ACTIVE SESSION
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Assigned Role: <strong className="text-amber-300 uppercase">{user.role}</strong> • Jurisdiction:{' '}
                    <span className="text-slate-200">
                      {user.role === 'officer' ? 'Ranchi District Welfare Directorate (Jharkhand)' : 'Ministry of Tribal Affairs (MoTA, New Delhi)'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Link
                  to="/security/sessions"
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-700 text-xs font-bold rounded-lg border border-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                  <span>Session Security</span>
                </Link>
                <Link
                  to="/"
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-700 text-xs font-bold rounded-lg border border-slate-700 text-slate-300 hover:text-white transition"
                >
                  Citizen Portal
                </Link>
              </div>
            </div>

            {/* Role & Workspace Category Switcher Tabs */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5 flex items-center justify-between">
                <span>Select Operational Category & Role Deck</span>
                <span className="text-[10px] text-slate-500">Separated Role Workspaces</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setActiveDeckTab('welfare_officer')}
                  className={`p-3 rounded-xl flex items-center gap-3 transition text-left cursor-pointer border ${
                    activeDeckTab === 'welfare_officer'
                      ? 'bg-amber-500/15 border-amber-500 text-white shadow-sm'
                      : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className={`p-2.5 rounded-lg shrink-0 ${
                    activeDeckTab === 'welfare_officer' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-amber-400'
                  }`}>
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-white">District Welfare Officer</span>
                      {user.role === 'officer' && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-mono font-bold">
                          YOUR LOGGED-IN ROLE
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      Scrutiny, Merit Allocations, DBT Disbursals & Field Grievances
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDeckTab('system_admin')}
                  className={`p-3 rounded-xl flex items-center gap-3 transition text-left cursor-pointer border ${
                    activeDeckTab === 'system_admin'
                      ? 'bg-purple-500/15 border-purple-500 text-white shadow-sm'
                      : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className={`p-2.5 rounded-lg shrink-0 ${
                    activeDeckTab === 'system_admin' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-purple-400'
                  }`}>
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-white">System Administrator</span>
                      {['admin', 'super_admin'].includes(user.role) && (
                        <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-1.5 py-0.2 rounded font-mono font-bold">
                          YOUR LOGGED-IN ROLE
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      Master Data, VAPT Security, Multi-Region DR & National Gateways
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* PANEL 1: DISTRICT WELFARE OFFICER WORKSTATION */}
            {activeDeckTab === 'welfare_officer' && (
              <div className="space-y-8 animate-in fade-in duration-200">
                {/* Officer Jurisdiction Sub-Header */}
                <div className="bg-gradient-to-r from-amber-500/10 via-slate-800 to-slate-850 border border-amber-500/30 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-white">
                          District Welfare Operations Panel (जिला कल्याण प्राधिकरण कार्यक्षेत्र)
                        </h2>
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono font-bold">
                          DWO WORKSTATION
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        District Jurisdiction: Ranchi & Khunti Sub-Divisions • Scheduled Tribe & Minority Welfare Department
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-slate-400">Assigned Schemes:</span>
                    <span className="bg-slate-900 border border-slate-700 px-2.5 py-1 rounded text-amber-300 font-bold">
                      Post-Matric ST • Fellowship • Top-Class
                    </span>
                  </div>
                </div>

                {/* CATEGORY 1: Application Scrutiny & Dossier Verification */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        1. Application Scrutiny & Verification (आवेदन संवीक्षा एवं प्रमाण पत्र सत्यापन)
                      </h3>
                    </div>
                    <span className="text-[11px] text-blue-400 font-medium">3 Verification Desks</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Scrutiny Desk */}
                    <Link
                      to="/officer/scrutiny"
                      className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/60 rounded-xl p-5 transition group space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="p-2.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          <FileCheck2 className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded">PRIMARY DESK</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition flex items-center justify-between">
                          <span>Scrutiny & Verification Desk</span>
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition" />
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Review tribal scholarship dossiers, cross-check institute verification stamps, and approve ST eligibility.
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>Pending Scrutiny:</span>
                        <span className="text-amber-400 font-bold">14 Applications</span>
                      </div>
                    </Link>

                    {/* Institution Verification Liaison */}
                    <Link
                      to="/institution/dashboard"
                      className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/60 rounded-xl p-5 transition group space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="p-2.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded">INSTITUTE LIAISON</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition flex items-center justify-between">
                          <span>College & Institute Verification</span>
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition" />
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Inspect AISHE college verification logs, monitor pending approvals by college nodal officers, and verify attendance.
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>Registered Colleges:</span>
                        <span className="text-indigo-400 font-bold">128 AISHE Units</span>
                      </div>
                    </Link>

                    {/* Document Vault */}
                    <Link
                      to="/documents"
                      className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/60 rounded-xl p-5 transition group space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="p-2.5 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30">
                          <FileText className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-mono bg-teal-950 text-teal-300 border border-teal-800 px-2 py-0.5 rounded">DIGILOCKER SYNC</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition flex items-center justify-between">
                          <span>Caste & Certificate Vault</span>
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition" />
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Access cryptographic DigiLocker certificates, ST caste certificates, and annual family income affidavits.
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>Verified Vaults:</span>
                        <span className="text-teal-400 font-bold">99.4% Automated</span>
                      </div>
                    </Link>
                  </div>
                </div>

                {/* CATEGORY 2: Merit Allocations & Quota Engineering */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        2. Merit Allocations & Quota Engineering (मेधा सूची एवं आरक्षण कोटा निर्धारण)
                      </h3>
                    </div>
                    <span className="text-[11px] text-amber-400 font-medium">2 Allocation Workbenches</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Merit List & Quota Allocator */}
                    <Link
                      to="/officer/allocations"
                      className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/60 rounded-xl p-5 transition group space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          <BarChart3 className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded">SIMULATOR ENGINE</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition flex items-center justify-between">
                          <span>Merit List & Quota Allocator</span>
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition" />
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Simulate scholarship merit cutoffs, optimize PVTG & female 33% reservations, and approve final beneficiary awardees.
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>District Quota Seats:</span>
                        <span className="text-amber-300 font-bold">1,850 Seats • Ranchi</span>
                      </div>
                    </Link>

                    {/* Merit Awardees Manifest */}
                    <Link
                      to="/officer/allocations"
                      className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/60 rounded-xl p-5 transition group space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="p-2.5 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
                          <CheckSquare className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-mono bg-orange-950 text-orange-300 border border-orange-800 px-2 py-0.5 rounded">GAZETTE EXPORT</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition flex items-center justify-between">
                          <span>Official Awardee Manifest & Gazette</span>
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition" />
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Generate gazette-ready district awardee manifests with digital signatures for State Welfare Directorate sign-off.
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>Current Batch:</span>
                        <span className="text-orange-400 font-bold">Batch 2026-Q1 Ready</span>
                      </div>
                    </Link>
                  </div>
                </div>

                {/* CATEGORY 3: DBT Disbursals & Banking Operations */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        3. DBT Disbursals & Banking Operations (डीबीटी छात्रवृत्ति भुगतान एवं बैंक निपटान)
                      </h3>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-medium">PFMS & APB Direct</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* DBT Workbench */}
                    <Link
                      to="/officer/dbt"
                      className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/60 rounded-xl p-5 transition group space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded">PFMS DISBURSAL</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition flex items-center justify-between">
                          <span>DBT Payments & PFMS Disbursals</span>
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition" />
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Authorize digital disbursement batches, push to Aadhaar payment bridge (APB), and monitor bank ACK/NACK status.
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>Disbursed This Fiscal:</span>
                        <span className="text-emerald-400 font-bold">₹14.82 Crores</span>
                      </div>
                    </Link>

                    {/* Failed Disbursal Reconciliation */}
                    <Link
                      to="/officer/dbt"
                      className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/60 rounded-xl p-5 transition group space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="p-2.5 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30">
                          <Activity className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-mono bg-teal-950 text-teal-300 border border-teal-800 px-2 py-0.5 rounded">AUTO-RECONCILIATION</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition flex items-center justify-between">
                          <span>Banking Reconciliation & Mandates</span>
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition" />
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Track NPCI reject codes (e.g. inactive Aadhaar seeding), re-trigger mandate updates, and SMS alerts to scholars.
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>Success Rate:</span>
                        <span className="text-teal-400 font-bold">99.1% First-Pass</span>
                      </div>
                    </Link>
                  </div>
                </div>

                {/* CATEGORY 4: Field Operations & Grievance Redressal */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        4. Field Operations & Grievance Redressal (क्षेत्रीय निवारण एवं लोक शिकायत)
                      </h3>
                    </div>
                    <span className="text-[11px] text-rose-400 font-medium">Statutory SLA Tracking</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Grievance Desk */}
                    <Link
                      to="/officer/grievances"
                      className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/60 rounded-xl p-5 transition group space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="p-2.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          <LifeBuoy className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-mono bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded">STATUTORY SLA</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition flex items-center justify-between">
                          <span>Grievance Redressal & Appellate Desk</span>
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition" />
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Investigate student ticket escalations, assign appellate hearings, and close statutory complaints within 15-day SLA.
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>Pending Tickets:</span>
                        <span className="text-rose-400 font-bold">2 Open Escalations</span>
                      </div>
                    </Link>

                    {/* Official Broadcasts */}
                    <Link
                      to="/officer/broadcasts"
                      className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/60 rounded-xl p-5 transition group space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="p-2.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
                          <Radio className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-mono bg-sky-950 text-sky-300 border border-sky-800 px-2 py-0.5 rounded">SMS / WHATSAPP / CIRCULAR</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition flex items-center justify-between">
                          <span>District Broadcasts & Official Circulars</span>
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition" />
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Dispatch district scholarship deadlines, physical verification camp schedules, and automated alerts to institutions.
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>Broadcast Network:</span>
                        <span className="text-sky-400 font-bold">Active • 12,400 Scholars</span>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* PANEL 2: SYSTEM ADMINISTRATOR & CYBER COMMAND CENTER */}
            {activeDeckTab === 'system_admin' && (
              <div className="space-y-8 animate-in fade-in duration-200">
                {/* Admin Jurisdiction Sub-Header */}
                <div className="bg-gradient-to-r from-purple-500/10 via-slate-800 to-slate-850 border border-purple-500/30 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/40">
                      <Sliders className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-white">
                          System Administration & Cyber Command (प्रशासन एवं साइबर कमान केंद्र)
                        </h2>
                        <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded font-mono font-bold">
                          SYSTEM ADMIN HUB
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        National Administrative Jurisdiction • Ministry of Tribal Affairs (MoTA) • Central Project Management Unit (CPMU)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-slate-400">Security Clearance:</span>
                    <span className="bg-slate-900 border border-slate-700 px-2.5 py-1 rounded text-purple-300 font-bold">
                      Level 5 • Super Administrator
                    </span>
                  </div>
                </div>

                {/* CATEGORY 1: Master Data & Multi-Tenancy Architecture */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        1. Master Data & Multi-Tenancy (मास्टर डेटा एवं बहु-किरायेदार विन्यास)
                      </h3>
                    </div>
                    <span className="text-[11px] text-purple-400 font-medium">Core Administration</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Master Data & Schemes */}
                    <Link
                      to="/admin/portal"
                      className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-purple-500/60 rounded-xl p-5 transition group space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="p-2.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          <Sliders className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded">SCHEME ENGINE</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition flex items-center justify-between">
                          <span>Master Data & Scheme Configuration</span>
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition" />
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Maintain central scholarship schemes, academic fee caps, caste sub-categories, and state eligibility rules.
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>Configured Schemes:</span>
                        <span className="text-purple-400 font-bold">Post-Matric, Top Class, Fellowship</span>
                      </div>
                    </Link>

                    {/* User & Officer RBAC Governance */}
                    <Link
                      to="/admin/portal"
                      className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-purple-500/60 rounded-xl p-5 transition group space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="p-2.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          <Users className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded">RBAC GOVERNANCE</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition flex items-center justify-between">
                          <span>Officer Directory & RBAC Governance</span>
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition" />
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Provision District Welfare Officers, State Nodal Officers, and manage cryptographic privilege levels.
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>Active Government Staff:</span>
                        <span className="text-blue-400 font-bold">24 District Officers</span>
                      </div>
                    </Link>
                  </div>
                </div>

                {/* CATEGORY 2: Cyber Security & Cryptographic Integrity */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        2. Cyber Security & Cryptographic Integrity (साइबर सुरक्षा एवं क्रिप्टोग्राफिक ऑडिट)
                      </h3>
                    </div>
                    <span className="text-[11px] text-red-400 font-medium">Zero-Trust & VAPT</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* VAPT Security Desk */}
                    <Link
                      to="/security/vapt-desk"
                      className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-purple-500/60 rounded-xl p-5 transition group space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="p-2.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-mono bg-red-950 text-red-300 border border-red-800 px-2 py-0.5 rounded">MERKLE TREE</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition flex items-center justify-between">
                          <span>VAPT Security & Merkle Audit</span>
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition" />
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Verify cryptographic Merkle tree hash integrity of scholarship approvals and run automated vulnerability scans.
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>Root Hash Integrity:</span>
                        <span className="text-emerald-400 font-bold font-mono">VERIFIED 100%</span>
                      </div>
                    </Link>

                    {/* Active Sessions Governance */}
                    <Link
                      to="/security/sessions"
                      className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-purple-500/60 rounded-xl p-5 transition group space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="p-2.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                          <Shield className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded">TERMINAL TRACKER</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition flex items-center justify-between">
                          <span>Session Security & Kill-Switch</span>
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition" />
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Real-time concurrent login tracking, force-kill compromised sessions, and inspect client device fingerprints.
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>Active Terminals:</span>
                        <span className="text-cyan-400 font-bold">Monitored 24/7</span>
                      </div>
                    </Link>

                    {/* MFA / TOTP Governance */}
                    <Link
                      to="/security/mfa"
                      className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-purple-500/60 rounded-xl p-5 transition group space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          <KeyRound className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded">HARDWARE / TOTP</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition flex items-center justify-between">
                          <span>Multi-Factor Authentication (MFA)</span>
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition" />
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Enforce time-based OTP (TOTP) and FIDO2 authentication policies across all government officer endpoints.
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>MFA Compliance:</span>
                        <span className="text-amber-400 font-bold">Mandatory for Admins</span>
                      </div>
                    </Link>
                  </div>
                </div>

                {/* CATEGORY 3: National Gateways & System Interoperability */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        3. National Gateways & System Interoperability (राष्ट्रीय गेटवे एवं एपीआई अवसंरचना)
                      </h3>
                    </div>
                    <span className="text-[11px] text-cyan-400 font-medium">Interoperability Telemetry</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Gateways & APIs */}
                    <Link
                      to="/officer/gateways"
                      className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-purple-500/60 rounded-xl p-5 transition group space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="p-2.5 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30">
                          <Network className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-mono bg-teal-950 text-teal-300 border border-teal-800 px-2 py-0.5 rounded">CIRCUIT BREAKERS</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition flex items-center justify-between">
                          <span>External Gateways & API Health</span>
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition" />
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Monitor live latency and uptime of DigiLocker, PFMS, NPCI APB, UIDAI Aadhaar, and State Caste Gateways.
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>Uptime Status:</span>
                        <span className="text-teal-400 font-bold">99.98% • All Gateways Green</span>
                      </div>
                    </Link>

                    {/* Executive BI */}
                    <Link
                      to="/officer/analytics"
                      className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-purple-500/60 rounded-xl p-5 transition group space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="p-2.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                          <BarChart3 className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded">NATIONAL BI</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition flex items-center justify-between">
                          <span>Executive BI & National Analytics</span>
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition" />
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          State-wise budget burn rate, tribal scholar inclusion ratios, and predictive intake modeling for Union Ministry.
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>National Allocation:</span>
                        <span className="text-indigo-400 font-bold">₹1,240 Cr Budget Tracked</span>
                      </div>
                    </Link>
                  </div>
                </div>

                {/* CATEGORY 4: Production Infrastructure & Disaster Recovery */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        4. Production Infrastructure & Disaster Recovery (उत्पादन अवसंरचना एवं आपदा बहाली)
                      </h3>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-medium">Mission-Critical Availability</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Go-Live Console */}
                    <Link
                      to="/production/go-live"
                      className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-purple-500/60 rounded-xl p-5 transition group space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <Rocket className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded">DR AUTOMATION</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition flex items-center justify-between">
                          <span>Go-Live & Multi-Region DR</span>
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition" />
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Execute full diagnostic preflight checks and simulate automated secondary datacenter failover.
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>Primary Datacenter:</span>
                        <span className="text-emerald-400 font-bold">NIC MeghRaj (Delhi) • Active</span>
                      </div>
                    </Link>

                    {/* Database & Audit Backups */}
                    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="p-2.5 rounded-lg bg-slate-700 text-slate-300 border border-slate-600">
                          <Database className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-mono bg-slate-900 text-slate-300 border border-slate-700 px-2 py-0.5 rounded">STORAGE ENGINE</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center justify-between">
                          <span>Database Storage & Audit Logs</span>
                          <span className="text-[10px] bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700 font-mono">SYNCHRONIZED</span>
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          AES-256 encrypted database snapshots, immutable transaction ledger, and automatic hourly offsite archival.
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>Last Offsite Backup:</span>
                        <span className="text-slate-300 font-bold">12 mins ago (Zero Loss RPO)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OfficialPortalPage;
