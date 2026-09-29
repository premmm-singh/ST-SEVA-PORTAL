import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Wifi,
  WifiOff,
  Languages,
  Zap,
  Volume2,
  Fingerprint,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  FileText,
  ShieldCheck,
  Play,
  Pause,
  Download,
  Database,
  ArrowRight,
  Layers,
  Sparkles
} from 'lucide-react';
import mobileService from '../../services/mobileService';
import { useVernacular } from '../../context/VernacularContext';

export const MobilePwaHubPage = () => {
  const { currentLang, switchLanguage, languages, t } = useVernacular();

  const [activeTab, setActiveTab] = useState('offline_sync'); // offline_sync | vernacular | bandwidth | voice_assist | biometric
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [simulatedOffline, setSimulatedOffline] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  // F-140 Offline Queue State
  const [localQueue, setLocalQueue] = useState([
    {
      idempotency_token: 'IDEMP-LOCAL-DRAFT-001',
      entity_type: 'APPLICATION_DRAFT',
      action: 'UPDATE',
      payload: {
        scheme_id: 'ST-POST-MATRIC',
        applicant_name: 'Birsa Soren',
        course: 'Diploma in Mining Engineering',
        institute_name: 'Govt Polytechnic Khunti'
      },
      status: 'PENDING_OFFLINE',
      created_at: new Date().toISOString()
    },
    {
      idempotency_token: 'IDEMP-LOCAL-GR-002',
      entity_type: 'GRIEVANCE',
      action: 'CREATE',
      payload: {
        subject: 'Caste certificate verification pending in circle office',
        description: 'Applied on 12th Jan 2026, verification pending for 30+ days'
      },
      status: 'PENDING_OFFLINE',
      created_at: new Date().toISOString()
    }
  ]);
  const [syncHistory, setSyncHistory] = useState(null);

  // F-142 Document Compression State
  const [compressFileName, setCompressFileName] = useState('caste_certificate_raw_scan.pdf');
  const [compressOriginalSize, setCompressOriginalSize] = useState('1850');
  const [compressTier, setCompressTier] = useState('2G_ULTRA_LOW');
  const [compressionResult, setCompressionResult] = useState(null);

  // F-143 Voice Assist State
  const [audioPromptKey, setAudioPromptKey] = useState('welcome_instructions');
  const [audioPromptResult, setAudioPromptResult] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // F-144 Biometric State
  const [deviceName, setDeviceName] = useState('Pixel / Galaxy In-Display Fingerprint');
  const [enrolledCred, setEnrolledCred] = useState(null);
  const [biometricLoginResult, setBiometricLoginResult] = useState(null);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync offline queue
  const handleTriggerSync = async () => {
    if (localQueue.length === 0) {
      setStatusMsg({ text: 'No pending offline items in local queue.', type: 'success' });
      return;
    }
    setLoading(true);
    setStatusMsg({ text: '', type: '' });
    try {
      const items = localQueue.map((item) => ({
        idempotency_token: item.idempotency_token,
        entity_type: item.entity_type,
        action: item.action,
        payload: item.payload
      }));
      const res = await mobileService.syncOfflineBatch('DEVICE-MOBILE-ST-PORTAL-CLIENT', items);
      setSyncHistory(res);
      setLocalQueue([]);
      setStatusMsg({ text: `Sync successful! ${res.synced_count} offline actions applied to central portal.`, type: 'success' });
    } catch (err) {
      setStatusMsg({ text: err.response?.data?.detail || 'Failed to sync offline queue', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Add dummy item to local queue
  const handleAddLocalDraft = () => {
    const newItem = {
      idempotency_token: `IDEMP-LOCAL-DRAFT-${Date.now()}`,
      entity_type: 'APPLICATION_DRAFT',
      action: 'UPDATE',
      payload: {
        notes: 'Offline auto-save checkpoint',
        timestamp: new Date().toISOString()
      },
      status: 'PENDING_OFFLINE',
      created_at: new Date().toISOString()
    };
    setLocalQueue([...localQueue, newItem]);
    setStatusMsg({ text: 'New draft action queued locally in browser device storage.', type: 'success' });
  };

  // Optimize document
  const handleCompress = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg({ text: '', type: '' });
    try {
      const res = await mobileService.optimizeDocument({
        filename: compressFileName,
        file_type: 'application/pdf',
        original_size_kb: parseFloat(compressOriginalSize),
        quality_tier: compressTier
      });
      setCompressionResult(res);
      setStatusMsg({ text: 'Document optimized for low-bandwidth cellular network!', type: 'success' });
    } catch (err) {
      setStatusMsg({ text: err.response?.data?.detail || 'Compression failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch Voice Audio Prompt
  const handleFetchAudioPrompt = async () => {
    setLoading(true);
    setStatusMsg({ text: '', type: '' });
    try {
      const res = await mobileService.getAudioPrompt(audioPromptKey, currentLang);
      setAudioPromptResult(res);
      setIsPlaying(true);
      setTimeout(() => setIsPlaying(false), 4500);
      setStatusMsg({ text: `Playing synthetic vernacular voice guidance in ${res.language_name}`, type: 'success' });
    } catch (err) {
      setStatusMsg({ text: 'Failed to retrieve voice prompt', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Enroll Biometric Credential
  const handleEnrollBiometrics = async () => {
    setLoading(true);
    setStatusMsg({ text: '', type: '' });
    try {
      const credId = `FIDO2-ST-${Date.now()}`;
      const payload = {
        credential_id: credId,
        public_key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE7...',
        attestation_type: 'none',
        device_name: deviceName
      };
      await mobileService.verifyWebAuthnRegister(payload);
      setEnrolledCred(credId);
      setStatusMsg({ text: `Biometric passkey securely enrolled for ${deviceName}`, type: 'success' });
    } catch (err) {
      setStatusMsg({ text: err.response?.data?.detail || 'Biometric enrollment failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Quick Biometric Login
  const handleBiometricLogin = async () => {
    if (!enrolledCred) {
      setStatusMsg({ text: 'Please enroll device biometrics first.', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const res = await mobileService.verifyWebAuthnLogin({
        credential_id: enrolledCred,
        signature: 'MOCK_ECDSA_FINGERPRINT_SIGNATURE_2026',
        challenge: 'MOCK_CHALLENGE'
      });
      setBiometricLoginResult(res);
      setStatusMsg({ text: 'Biometric passkey verified! Portal session token generated.', type: 'success' });
    } catch (err) {
      setStatusMsg({ text: err.response?.data?.detail || 'Biometric login failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const effectiveOnline = isOnline && !simulatedOffline;

  const tabs = [
    { id: 'offline_sync', label: 'Offline PWA & Sync', icon: Database, badge: 'F-139..140' },
    { id: 'vernacular', label: 'Vernacular Multi-Language', icon: Languages, badge: 'F-141' },
    { id: 'bandwidth', label: '2G/3G Low-Bandwidth', icon: Zap, badge: 'F-142' },
    { id: 'voice_assist', label: 'Voice Assist Prompts', icon: Volume2, badge: 'F-143' },
    { id: 'biometric', label: 'Biometrics & Passkeys', icon: Fingerprint, badge: 'F-144' },
  ];

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      {/* Top Banner */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-700 text-white rounded-lg shadow-sm">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Mobile Readiness, Offline PWA & Vernacular Support
                  </h1>
                  <p className="text-sm text-slate-600">
                    Phase 13: Offline Local Drafts, Ol Chiki / Ho / Mundari Dialects, 2G Data Saver, Voice Prompts & Biometrics
                  </p>
                </div>
              </div>
            </div>

            {/* Network indicator pill */}
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                  effectiveOnline
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}
              >
                {effectiveOnline ? (
                  <>
                    <Wifi className="w-4 h-4 text-emerald-600 animate-pulse" />
                    <span>Portal Online (Cloud Connected)</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-amber-600" />
                    <span>Offline PWA Shell (Local Storage)</span>
                  </>
                )}
              </div>

              <button
                onClick={() => setSimulatedOffline(!simulatedOffline)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  simulatedOffline
                    ? 'bg-amber-600 text-white border-amber-700'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
                title="Toggle simulated field disconnection"
              >
                {simulatedOffline ? 'Resume Online Network' : 'Simulate 0-Network'}
              </button>
            </div>
          </div>

          {/* Feedback banner */}
          {statusMsg.text && (
            <div
              className={`mt-4 p-4 rounded-lg flex items-center justify-between gap-3 text-sm font-medium ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {statusMsg.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                )}
                <span>{statusMsg.text}</span>
              </div>
              <button
                onClick={() => setStatusMsg({ text: '', type: '' })}
                className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="mt-6 border-b border-slate-200 overflow-x-auto scrollbar-none">
            <nav className="flex space-x-2 pb-px" aria-label="Mobile Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                      isActive
                        ? 'border-blue-700 text-blue-800 bg-blue-50/50 font-semibold'
                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-700' : 'text-slate-500'}`} />
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        isActive ? 'bg-blue-200/70 text-blue-900 font-bold' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* ========================================================================= */}
        {/* TAB 1: Offline PWA & Sync Engine (F-139, F-140) */}
        {/* ========================================================================= */}
        {activeTab === 'offline_sync' && (
          <div className="space-y-6">
            {/* PWA App Banner */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl p-6 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-800 text-blue-200 text-xs font-semibold tracking-wider uppercase">
                  <Sparkles className="w-3.5 h-3.5" /> Progressive Web App (PWA) Certified
                </span>
                <h2 className="text-xl font-bold">Install ST Seva Portal on Mobile or Desktop</h2>
                <p className="text-sm text-blue-200 max-w-2xl">
                  Work uninterrupted even in zero-reception tribal areas. Application drafts, document photos, and grievances are saved on your phone and automatically synced when back online.
                </p>
              </div>
              <button
                onClick={() => setStatusMsg({ text: 'PWA is installed and running service worker (sw.js) cache-first offline shell.', type: 'success' })}
                className="px-5 py-2.5 bg-white text-blue-900 hover:bg-blue-50 font-bold text-sm rounded-lg shadow-sm transition whitespace-nowrap flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Add to Home Screen
              </button>
            </div>

            {/* Offline Local Queue Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 mb-6 gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-700" />
                    Device IndexedDB / Local Queue (Pending Sync)
                  </h3>
                  <p className="text-xs text-slate-500">
                    {localQueue.length} pending actions queued locally in browser device storage.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddLocalDraft}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition"
                  >
                    + Queue Test Draft
                  </button>
                  <button
                    onClick={handleTriggerSync}
                    disabled={loading || localQueue.length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs rounded-lg shadow-sm transition disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                    Sync Local Queue to Cloud
                  </button>
                </div>
              </div>

              {localQueue.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2 opacity-80" />
                  <p className="text-sm font-semibold text-slate-700">All local items synchronized!</p>
                  <p className="text-xs text-slate-500">No pending offline drafts or grievance actions awaiting upload.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {localQueue.map((item, index) => (
                    <div key={item.idempotency_token} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2 font-mono font-semibold text-slate-800">
                          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px]">
                            {item.entity_type}
                          </span>
                          <span>{item.idempotency_token}</span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          Action: {item.action} | Queued At: {new Date(item.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded font-bold bg-amber-100 text-amber-800 text-[11px]">
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sync History */}
            {syncHistory && (
              <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-sm">
                <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Last Batch Sync Summary
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded">
                    <span className="text-slate-500 block">Device Identifier</span>
                    <span className="font-mono font-bold text-slate-800">{syncHistory.device_id}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded">
                    <span className="text-slate-500 block">Processed Count</span>
                    <span className="font-bold text-slate-800">{syncHistory.processed_count}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded">
                    <span className="text-slate-500 block">Synced Count</span>
                    <span className="font-bold text-emerald-700">{syncHistory.synced_count}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded">
                    <span className="text-slate-500 block">Conflict Count</span>
                    <span className="font-bold text-slate-800">{syncHistory.conflict_count}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: Vernacular Multi-Language Engine (F-141) */}
        {/* ========================================================================= */}
        {activeTab === 'vernacular' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="pb-4 border-b border-slate-100 mb-6">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Languages className="w-5 h-5 text-indigo-700" />
                  Vernacular Multi-Language Engine (Jharkhand Tribal Dialects)
                </h2>
                <p className="text-sm text-slate-500">
                  Switch the portal interface dynamically between English, Hindi, Santhali (Ol Chiki), Ho, and Mundari scripts.
                </p>
              </div>

              {/* Language Switcher Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                {languages.map((lang) => {
                  const isSelected = currentLang === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => switchLanguage(lang.code)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xl">{lang.flag}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-700" />}
                      </div>
                      <div className="font-bold text-slate-900 text-sm">{lang.name}</div>
                      <div className="text-xs text-slate-500">{lang.script}</div>
                    </button>
                  );
                })}
              </div>

              {/* Live Preview Card */}
              <div className="p-6 bg-slate-900 text-white rounded-xl shadow-inner space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-xs font-mono text-slate-400">
                    Active Locale: <strong className="text-indigo-400">{currentLang.toUpperCase()}</strong>
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded bg-indigo-900 text-indigo-200 font-semibold">
                    Dynamic i18n Applied
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-slate-400 uppercase tracking-wider block">Portal Banner Title:</span>
                    <p className="text-lg font-bold text-amber-300">
                      {t('portal_title', 'Scheduled Tribe Scholarship Verification Portal')}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 uppercase tracking-wider block">Welcome Message:</span>
                    <p className="text-sm text-slate-200">
                      {t('welcome', 'Welcome to Jharkhand Tribal Welfare Service Portal')}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3 bg-slate-800 rounded-lg">
                      <span className="text-[11px] text-slate-400 block">Offline Notice String</span>
                      <span className="text-xs text-slate-200 font-medium">
                        {t('offline_notice', 'Offline mode active.')}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-800 rounded-lg">
                      <span className="text-[11px] text-slate-400 block">Biometric Action String</span>
                      <span className="text-xs text-slate-200 font-medium">
                        {t('biometric_login', 'Login with Biometrics')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: Low-Bandwidth 2G/3G Optimization & Compression (F-142) */}
        {/* ========================================================================= */}
        {activeTab === 'bandwidth' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-600" />
                    Low-Bandwidth 2G/3G Adaptive Optimization & Compression
                  </h2>
                  <p className="text-sm text-slate-500">
                    Compress bulky certificate scans and photos down to &lt;100KB for rural cellular networks while preserving legal seal clarity.
                  </p>
                </div>
                <span className="px-2.5 py-1 text-xs font-semibold rounded bg-amber-100 text-amber-800">
                  Data Saver Protocol Active
                </span>
              </div>

              <form onSubmit={handleCompress} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Document Filename
                  </label>
                  <input
                    type="text"
                    required
                    value={compressFileName}
                    onChange={(e) => setCompressFileName(e.target.value)}
                    placeholder="caste_certificate.pdf"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Raw File Size (KB)
                  </label>
                  <input
                    type="number"
                    required
                    min={100}
                    max={10000}
                    value={compressOriginalSize}
                    onChange={(e) => setCompressOriginalSize(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Network Compression Tier
                  </label>
                  <select
                    value={compressTier}
                    onChange={(e) => setCompressTier(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="2G_ULTRA_LOW">2G Ultra-Low (Target &lt;80 KB)</option>
                    <option value="3G_BALANCED">3G Balanced (Target &lt;200 KB)</option>
                    <option value="STANDARD">Standard (High Fidelity)</option>
                  </select>
                </div>

                <div className="md:col-span-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    Simulate Adaptive Compression
                  </button>
                </div>
              </form>
            </div>

            {compressionResult && (
              <div className="bg-white p-6 rounded-xl border border-amber-200 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-amber-100 mb-4">
                  <span className="font-semibold text-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Adaptive Compression Verified: {compressionResult.filename}
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 font-mono">
                    TIER: {compressionResult.quality_tier}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs text-slate-500 block">Original Size</span>
                    <span className="font-mono text-slate-800 font-bold">{compressionResult.original_size_kb} KB</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs text-slate-500 block">Compressed Size</span>
                    <span className="font-mono text-emerald-700 font-bold">{compressionResult.compressed_size_kb} KB</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs text-slate-500 block">Compression Ratio</span>
                    <span className="font-mono text-slate-800 font-semibold">{compressionResult.compression_ratio}x ({(100 - compressionResult.compression_ratio * 100).toFixed(1)}% savings)</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs text-slate-500 block">Legibility Metric</span>
                    <span className="font-bold text-blue-700">{(compressionResult.legibility_score * 100).toFixed(0)}% OCR Precision</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: Voice Assist Audio Prompts (F-143) */}
        {/* ========================================================================= */}
        {activeTab === 'voice_assist' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-teal-700" />
                    WCAG 2.1 AA Screen Reader & Voice Audio Guidance
                  </h2>
                  <p className="text-sm text-slate-500">
                    Spoken voice prompts for rural, illiterate guardians and visually challenged tribal scholars across regional dialects.
                  </p>
                </div>
                <span className="px-2.5 py-1 text-xs font-semibold rounded bg-teal-100 text-teal-800">
                  Audio Synthesizer v2.0
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Select Guidance Scenario
                  </label>
                  <select
                    value={audioPromptKey}
                    onChange={(e) => setAudioPromptKey(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="welcome_instructions">Welcome & Certificate Preparation Instructions</option>
                    <option value="offline_draft_saved">Offline Draft Save Confirmation</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleFetchAudioPrompt}
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    Play Dialect Voice Prompt
                  </button>
                </div>
              </div>

              {audioPromptResult && (
                <div className="p-5 bg-teal-50 border border-teal-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-teal-950 flex items-center gap-2 text-sm">
                      <Volume2 className="w-4 h-4 text-teal-700" />
                      Voice Guidance Transcript ({audioPromptResult.language_name})
                    </span>
                    <span className="text-xs bg-teal-200 text-teal-900 px-2 py-0.5 rounded font-mono">
                      Duration: {audioPromptResult.duration_seconds}s
                    </span>
                  </div>

                  <p className="text-sm text-slate-800 italic bg-white p-4 rounded-lg border border-teal-100 font-sans leading-relaxed">
                    "{audioPromptResult.transcript}"
                  </p>

                  <div className="text-xs text-teal-800 font-mono flex items-center justify-between pt-1">
                    <span>Audio Stream URL: {audioPromptResult.audio_url}</span>
                    <span className="font-sans font-bold text-emerald-700">Audio Ready</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: Mobile Biometrics & WebAuthn / FIDO2 Passkeys (F-144) */}
        {/* ========================================================================= */}
        {activeTab === 'biometric' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Fingerprint className="w-5 h-5 text-indigo-700" />
                    Mobile Device Biometrics (WebAuthn / FIDO2 Passkeys)
                  </h2>
                  <p className="text-sm text-slate-500">
                    Hardware-backed fingerprint / Face ID authentication for rural citizens without SMS OTP dependency.
                  </p>
                </div>
                <span className="px-2.5 py-1 text-xs font-semibold rounded bg-indigo-100 text-indigo-800">
                  FIDO2 / WebAuthn Level 3
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Enrollment Card */}
                <div className="p-5 border border-slate-200 rounded-xl space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-700" />
                    Enroll Device Biometric Sensor
                  </h3>
                  <p className="text-xs text-slate-600">
                    Register your smartphone's secure enclave biometric hardware to unlock your scholarship profile instantly.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Device Description
                    </label>
                    <input
                      type="text"
                      value={deviceName}
                      onChange={(e) => setDeviceName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                  <button
                    onClick={handleEnrollBiometrics}
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold text-xs rounded-lg transition shadow-sm"
                  >
                    <Fingerprint className="w-4 h-4" />
                    Enroll Biometric Passkey
                  </button>

                  {enrolledCred && (
                    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs font-mono text-indigo-900">
                      Enrolled Credential: <span className="font-bold">{enrolledCred}</span>
                    </div>
                  )}
                </div>

                {/* Authentication Card */}
                <div className="p-5 border border-slate-200 rounded-xl space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    Test Biometric Passkey Login
                  </h3>
                  <p className="text-xs text-slate-600">
                    Verify enrolled passkey with cryptographic signature without submitting mobile OTP or passwords.
                  </p>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Enrolled Status:</span>
                      <span className={`font-bold ${enrolledCred ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {enrolledCred ? 'READY FOR AUTH' : 'NOT ENROLLED'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Auth Standard:</span>
                      <span className="font-mono text-slate-800">FIDO2 WebAuthn Passkey</span>
                    </div>
                  </div>

                  <button
                    onClick={handleBiometricLogin}
                    disabled={loading || !enrolledCred}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg transition shadow-sm disabled:opacity-50"
                  >
                    <Fingerprint className="w-4 h-4" />
                    Verify Fingerprint / Face ID
                  </button>

                  {biometricLoginResult && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-950">
                      <div className="font-bold mb-1 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Authenticated Successfully
                      </div>
                      <span className="font-mono text-[11px] text-slate-600 break-all">
                        Token: {biometricLoginResult.access_token.slice(0, 32)}...
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobilePwaHubPage;
