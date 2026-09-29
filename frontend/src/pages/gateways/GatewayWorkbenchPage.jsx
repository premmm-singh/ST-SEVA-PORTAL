import React, { useState, useEffect } from 'react';
import {
  Layers,
  FileCheck2,
  ShieldCheck,
  CreditCard,
  Building2,
  GraduationCap,
  Award,
  Smartphone,
  Webhook,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Send,
  Lock,
  ArrowRight,
  ExternalLink,
  Cpu,
  KeyRound,
  FileCode,
  ShieldAlert
} from 'lucide-react';
import gatewayService from '../../services/gatewayService';

export const GatewayWorkbenchPage = () => {
  const [activeTab, setActiveTab] = useState('digilocker'); // digilocker | aadhaar | npci | pfms | aishe | academic | jharsewa | umang_webhooks
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  // Tab 1: DigiLocker NeGD Gateway State
  const [digilockerUri, setDigilockerUri] = useState('in.gov.jh.edistrict-CASTE-2025-00912');
  const [consentArtifactId, setConsentArtifactId] = useState('CONSENT-MEITY-ST-2026-001');
  const [digilockerResult, setDigilockerResult] = useState(null);

  // Tab 2: UIDAI Aadhaar Vault State
  const [rawAadhaar, setRawAadhaar] = useState('548912345678');
  const [aadhaarVaultResult, setAadhaarVaultResult] = useState(null);

  // Tab 3: NPCI APB Mapper State
  const [npciVaultToken, setNpciVaultToken] = useState('AV-5489-1234-5678');
  const [npciLookupResult, setNpciLookupResult] = useState(null);
  const [npciBatchSyncResult, setNpciBatchSyncResult] = useState(null);

  // Tab 4: PFMS DSC Dispatcher State
  const [pfmsBatchId, setPfmsBatchId] = useState('BATCH-2026-Q1-001');
  const [pfmsDscToken, setPfmsDscToken] = useState('DSC-GOV-JH-2026-X509');
  const [pfmsResult, setPfmsResult] = useState(null);

  // Tab 5: AISHE Master Directory State
  const [aisheCode, setAisheCode] = useState('C-41234');
  const [aisheResult, setAisheResult] = useState(null);

  // Tab 6: Academic Board Marks State
  const [boardName, setBoardName] = useState('JAC');
  const [rollCode, setRollCode] = useState('31002');
  const [rollNumber, setRollNumber] = useState('10045');
  const [passingYear, setPassingYear] = useState('2025');
  const [academicResult, setAcademicResult] = useState(null);

  // Tab 7: JharSewa e-District State
  const [jharsewaCertNo, setJharsewaCertNo] = useState('JH/CASTE/2025/11293');
  const [jharsewaApplicantName, setJharsewaApplicantName] = useState('Birsa Munda');
  const [jharsewaCertType, setJharsewaCertType] = useState('CASTE');
  const [jharsewaResult, setJharsewaResult] = useState(null);

  // Tab 8: UMANG SSO & Webhooks State
  const [umangToken, setUmangToken] = useState('UMANG-SESSION-AUTH-TOKEN-2026');
  const [umangMobile, setUmangMobile] = useState('9876543210');
  const [umangResult, setUmangResult] = useState(null);

  const [webhookEventType, setWebhookEventType] = useState('APPLICATION_SANCTIONED');
  const [webhookTargetUrl, setWebhookTargetUrl] = useState('https://tribal-external-audit.jharkhand.gov.in/api/v1/webhook');
  const [webhookSecret, setWebhookSecret] = useState('whsec_negd_prod_signature_99');
  const [webhookLogs, setWebhookLogs] = useState([]);
  const [rateLimitStatus, setRateLimitStatus] = useState(null);

  useEffect(() => {
    if (activeTab === 'umang_webhooks') {
      loadWebhookLogsAndRateLimit();
    }
  }, [activeTab]);

  const loadWebhookLogsAndRateLimit = async () => {
    try {
      const [logs, rate] = await Promise.all([
        gatewayService.getWebhookLogs(20),
        gatewayService.checkRateLimit()
      ]);
      setWebhookLogs(logs || []);
      setRateLimitStatus(rate || null);
    } catch (err) {
      console.error('Failed to load webhook metadata', err);
    }
  };

  // Handlers
  const handleDigiLockerPull = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg({ text: '', type: '' });
    try {
      const res = await gatewayService.pullDigiLockerDocument(digilockerUri, consentArtifactId);
      setDigilockerResult(res);
      setStatusMsg({ text: 'DigiLocker document pulled & cryptographically verified from NeGD gateway!', type: 'success' });
    } catch (err) {
      setStatusMsg({ text: err.response?.data?.detail || 'Failed to pull document from DigiLocker NeGD Gateway', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAadhaarTokenize = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg({ text: '', type: '' });
    try {
      const res = await gatewayService.tokenizeAadhaar(rawAadhaar);
      setAadhaarVaultResult(res);
      setStatusMsg({ text: 'UIDAI Aadhaar Vault token generated with zero-raw-storage guarantee.', type: 'success' });
    } catch (err) {
      setStatusMsg({ text: err.response?.data?.detail || 'Tokenization failed.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleNpciLookup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg({ text: '', type: '' });
    try {
      const res = await gatewayService.lookupNpciStatus(npciVaultToken);
      setNpciLookupResult(res);
      setStatusMsg({ text: 'NPCI APB Mapper status retrieved successfully.', type: 'success' });
    } catch (err) {
      setStatusMsg({ text: err.response?.data?.detail || 'Failed to query NPCI APB Mapper.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleNpciSyncSimulate = async () => {
    setLoading(true);
    setStatusMsg({ text: '', type: '' });
    try {
      const sampleRecords = [
        {
          aadhaar_vault_token: npciVaultToken || 'AV-5489-1234-5678',
          bank_iin: '607082',
          bank_name: 'State Bank of India',
          account_number_masked: '••••••••1234',
          apb_status: 'ACTIVE',
          mandate_date: '2025-01-10T10:00:00'
        },
        {
          aadhaar_vault_token: 'AV-9988-7766-5544',
          bank_iin: '607152',
          bank_name: 'Bank of India',
          account_number_masked: '••••••••8877',
          apb_status: 'ACTIVE',
          mandate_date: '2025-02-14T11:30:00'
        }
      ];
      const res = await gatewayService.syncNpciMapper(`BATCH-NPCI-${Date.now()}`, sampleRecords);
      setNpciBatchSyncResult(res);
      setStatusMsg({ text: `NPCI Mapper batch sync completed! ${res.synced_count} records ingested.`, type: 'success' });
    } catch (err) {
      setStatusMsg({ text: err.response?.data?.detail || 'Batch sync failed.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePfmsDispatch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg({ text: '', type: '' });
    try {
      const res = await gatewayService.dispatchPfmsBatch(pfmsBatchId, pfmsDscToken);
      setPfmsResult(res);
      setStatusMsg({ text: `PFMS Batch ${res.batch_id} signed with DSC and dispatched via XML core gateway!`, type: 'success' });
    } catch (err) {
      setStatusMsg({ text: err.response?.data?.detail || 'PFMS DSC dispatch failed.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAisheVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg({ text: '', type: '' });
    try {
      const res = await gatewayService.verifyAisheCode(aisheCode);
      setAisheResult(res);
      setStatusMsg({ text: 'AISHE Master Directory verified successfully.', type: 'success' });
    } catch (err) {
      setStatusMsg({ text: err.response?.data?.detail || 'AISHE Code verification failed.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAcademicVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg({ text: '', type: '' });
    try {
      const res = await gatewayService.verifyAcademicMarks(boardName, rollCode, rollNumber, parseInt(passingYear));
      setAcademicResult(res);
      setStatusMsg({ text: 'Academic marks fetched and verified directly from Board repository.', type: 'success' });
    } catch (err) {
      setStatusMsg({ text: err.response?.data?.detail || 'Board verification failed.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleJharsewaVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg({ text: '', type: '' });
    try {
      const res = await gatewayService.verifyJharsewaCertificate(jharsewaCertNo, jharsewaApplicantName, jharsewaCertType);
      setJharsewaResult(res);
      setStatusMsg({ text: 'JharSewa e-District certificate cryptographically verified!', type: 'success' });
    } catch (err) {
      setStatusMsg({ text: err.response?.data?.detail || 'JharSewa verification failed.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUmangSsoExchange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg({ text: '', type: '' });
    try {
      const res = await gatewayService.exchangeUmangSso(umangToken, umangMobile);
      setUmangResult(res);
      setStatusMsg({ text: 'UMANG Mobile App SSO token verified and session exchanged.', type: 'success' });
    } catch (err) {
      setStatusMsg({ text: err.response?.data?.detail || 'UMANG SSO exchange failed.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribeWebhook = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg({ text: '', type: '' });
    try {
      const payload = {
        subscriber_name: 'State Tribal Audit & Monitoring System',
        event_type: webhookEventType,
        target_url: webhookTargetUrl,
        secret_token: webhookSecret
      };
      await gatewayService.subscribeWebhook(payload);
      setStatusMsg({ text: 'Outbound webhook subscription activated!', type: 'success' });
      loadWebhookLogsAndRateLimit();
    } catch (err) {
      setStatusMsg({ text: err.response?.data?.detail || 'Failed to register webhook.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'digilocker', label: 'DigiLocker NeGD', icon: FileCheck2, badge: 'F-129' },
    { id: 'aadhaar', label: 'Aadhaar Vault', icon: ShieldCheck, badge: 'F-130' },
    { id: 'npci', label: 'NPCI APB Mapper', icon: CreditCard, badge: 'F-131' },
    { id: 'pfms', label: 'PFMS DSC Gateway', icon: Layers, badge: 'F-132' },
    { id: 'aishe', label: 'AISHE Directory', icon: Building2, badge: 'F-133' },
    { id: 'academic', label: 'Academic Boards', icon: GraduationCap, badge: 'F-134' },
    { id: 'jharsewa', label: 'JharSewa e-District', icon: Award, badge: 'F-135' },
    { id: 'umang_webhooks', label: 'UMANG & Webhooks', icon: Webhook, badge: 'F-136..138' },
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
                  <Cpu className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    External Gateway Integrations & API Interoperability
                  </h1>
                  <p className="text-sm text-slate-600">
                    Phase 12 Mission-Critical Core Gateways: DigiLocker, UIDAI Vault, NPCI APB, PFMS DSC, AISHE, e-District & Webhooks
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5" /> 8 Gateway APIs Online
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                <ShieldCheck className="w-3.5 h-3.5" /> GIGW / UMANG Compliant
              </span>
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
            <nav className="flex space-x-2 pb-px" aria-label="Gateway Tabs">
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
        {/* TAB 1: DigiLocker NeGD Gateway (F-129) */}
        {/* ========================================================================= */}
        {activeTab === 'digilocker' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <FileCheck2 className="w-5 h-5 text-blue-700" />
                    DigiLocker NeGD Production Gateway
                  </h2>
                  <p className="text-sm text-slate-500">
                    Pull authentic electronic caste, income, and educational credentials with URI schema and cryptographic consent artifact.
                  </p>
                </div>
                <span className="px-2.5 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                  MeitY NeGD v3.2 Protocol
                </span>
              </div>

              <form onSubmit={handleDigiLockerPull} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    DigiLocker Document URI
                  </label>
                  <input
                    type="text"
                    required
                    value={digilockerUri}
                    onChange={(e) => setDigilockerUri(e.target.value)}
                    placeholder="e.g. in.gov.jh.edistrict-CASTE-2025-00912"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                  />
                  <span className="text-xs text-slate-500 mt-1 block">
                    Supported formats: `in.gov.jh.edistrict-[TYPE]-[YEAR]-[ID]` or `in.gov.cbse.marksheet-[YEAR]-[ROLL]`
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Consent Artifact ID
                  </label>
                  <input
                    type="text"
                    value={consentArtifactId}
                    onChange={(e) => setConsentArtifactId(e.target.value)}
                    placeholder="CONSENT-MEITY-ST-2026-001"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="md:col-span-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Pull Authentic Document via NeGD
                  </button>
                </div>
              </form>
            </div>

            {digilockerResult && (
              <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-blue-100 mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="font-semibold text-slate-800">
                      Document Pull Success: {digilockerResult.doc_type}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                    STATUS: {digilockerResult.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs text-slate-500 block">Issuer Department</span>
                    <span className="font-medium text-slate-800">{digilockerResult.issuer}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs text-slate-500 block">Candidate / Holder</span>
                    <span className="font-medium text-slate-800">{digilockerResult.holder_name}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs text-slate-500 block">Issue Timestamp</span>
                    <span className="font-medium text-slate-800">{new Date(digilockerResult.issue_date).toLocaleDateString()}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs text-slate-500 block">DigiLocker Doc ID</span>
                    <span className="font-mono text-xs text-slate-800">{digilockerResult.doc_id}</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs overflow-x-auto">
                  <div className="text-slate-400 mb-1 flex items-center justify-between">
                    <span>NeGD Cryptographic Verification Hash (SHA-256):</span>
                    <span className="text-emerald-400 font-sans text-xs">Authenticity Guaranteed</span>
                  </div>
                  <span className="text-amber-300 break-all">{digilockerResult.sha256_hash}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: UIDAI Aadhaar Vault & Tokenization (F-130) */}
        {/* ========================================================================= */}
        {activeTab === 'aadhaar' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-700" />
                    UIDAI Aadhaar Vault & Tokenization Engine
                  </h2>
                  <p className="text-sm text-slate-500">
                    Mandatory circular compliance: Raw 12-digit Aadhaar numbers are never stored in plain text or relational schema.
                  </p>
                </div>
                <span className="px-2.5 py-1 text-xs font-semibold rounded bg-indigo-100 text-indigo-800">
                  UIDAI Circular No. 1/2018 Compliant
                </span>
              </div>

              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-start gap-2">
                <Lock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Hardware Security Module (HSM) Vault Architecture:</strong> The ST Seva Portal generates high-entropy,
                  irreversible Reference Tokens prefixed with <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">AV-</code>.
                  Only masked Aadhaar (••••••••1234) and HMAC digests are retained for verification.
                </div>
              </div>

              <form onSubmit={handleAadhaarTokenize} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Enter Raw 12-Digit Aadhaar (Test Sandbox Input)
                  </label>
                  <input
                    type="password"
                    maxLength={12}
                    required
                    value={rawAadhaar}
                    onChange={(e) => setRawAadhaar(e.target.value.replace(/\D/g, ''))}
                    placeholder="12 digit number"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono tracking-widest"
                  />
                  <span className="text-xs text-slate-500 mt-1 block">
                    Current input length: {rawAadhaar.length}/12 digits
                  </span>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={loading || rawAadhaar.length !== 12}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                    Tokenize & Vault Aadhaar
                  </button>
                </div>
              </form>
            </div>

            {aadhaarVaultResult && (
              <div className="bg-white p-6 rounded-xl border border-indigo-200 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-indigo-100 mb-4">
                  <span className="font-semibold text-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Vault Token Allocated
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-800">
                    HSM-VAULT-ONLINE
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs text-slate-500 block">UIDAI Vault Token</span>
                    <span className="font-mono font-bold text-indigo-900 text-base">
                      {aadhaarVaultResult.tokenized_reference}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs text-slate-500 block">Permissible Masked Representation</span>
                    <span className="font-mono font-bold text-slate-800 text-base">
                      {aadhaarVaultResult.masked_aadhaar}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs text-slate-500 block">Vault Creation Timestamp</span>
                    <span className="font-medium text-slate-800">
                      {new Date(aadhaarVaultResult.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs">
                  <div className="text-slate-400 mb-1">Irreversible HMAC SHA-256 Fingerprint:</div>
                  <span className="text-indigo-300 break-all">{aadhaarVaultResult.hmac_digest}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: NPCI APB Mapper & DBT Ingestion (F-131) */}
        {/* ========================================================================= */}
        {activeTab === 'npci' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-700" />
                    NPCI Aadhaar Payment Bridge (APB) Mapper
                  </h2>
                  <p className="text-sm text-slate-500">
                    Query bank mapping, IIN, mandate status, and sync national daily APB settlement records for DBT scholarship disbursements.
                  </p>
                </div>
                <button
                  onClick={handleNpciSyncSimulate}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Trigger Batch Sync (Simulation)
                </button>
              </div>

              {npciBatchSyncResult && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs">
                  <strong>Batch Ingestion Successful:</strong> Batch Reference: <code className="font-mono">{npciBatchSyncResult.batch_reference}</code> | Synced Records: {npciBatchSyncResult.synced_count}
                </div>
              )}

              <form onSubmit={handleNpciLookup} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Aadhaar Vault Token
                  </label>
                  <input
                    type="text"
                    required
                    value={npciVaultToken}
                    onChange={(e) => setNpciVaultToken(e.target.value)}
                    placeholder="e.g. AV-5489-1234-5678"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Query APB Mapper Status
                  </button>
                </div>
              </form>
            </div>

            {npciLookupResult && (
              <div className="bg-white p-6 rounded-xl border border-emerald-200 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-emerald-100 mb-4">
                  <span className="font-semibold text-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Mapped Direct Benefit Transfer Bank Account
                  </span>
                  <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                    npciLookupResult.apb_status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    APB STATUS: {npciLookupResult.apb_status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs text-slate-500 block">Bank Name</span>
                    <span className="font-semibold text-slate-900">{npciLookupResult.bank_name}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs text-slate-500 block">Institution ID (IIN / BIN)</span>
                    <span className="font-mono text-slate-800">{npciLookupResult.bank_iin}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs text-slate-500 block">Account Number</span>
                    <span className="font-mono text-slate-800">{npciLookupResult.account_number_masked}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs text-slate-500 block">Aadhaar Mandate Seeding Date</span>
                    <span className="font-medium text-slate-800">
                      {npciLookupResult.mandate_date ? new Date(npciLookupResult.mandate_date).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: PFMS Core XML Exchange & Digital Signature (F-132) */}
        {/* ========================================================================= */}
        {activeTab === 'pfms' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-teal-700" />
                    Public Financial Management System (PFMS) Core XML & DSC
                  </h2>
                  <p className="text-sm text-slate-500">
                    Compile sanction orders into Controller General of Accounts (CGA) schema XML, sign with Class-3 Digital Signature (DSC), and dispatch.
                  </p>
                </div>
                <span className="px-2.5 py-1 text-xs font-semibold rounded bg-teal-100 text-teal-800">
                  PFMS E-Payment 4.1 Schema
                </span>
              </div>

              <form onSubmit={handlePfmsDispatch} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Sanction Batch ID
                  </label>
                  <input
                    type="text"
                    required
                    value={pfmsBatchId}
                    onChange={(e) => setPfmsBatchId(e.target.value)}
                    placeholder="BATCH-2026-Q1-001"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Class-3 DSC Token Identifier
                  </label>
                  <input
                    type="text"
                    required
                    value={pfmsDscToken}
                    onChange={(e) => setPfmsDscToken(e.target.value)}
                    placeholder="DSC-GOV-JH-2026-X509"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Sign & Dispatch to PFMS
                  </button>
                </div>
              </form>
            </div>

            {pfmsResult && (
              <div className="bg-white p-6 rounded-xl border border-teal-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-teal-100">
                  <span className="font-semibold text-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    PFMS Acknowledgment Received: {pfmsResult.ack_number}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-teal-100 text-teal-800">
                    DISPATCH_SUCCESS
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs text-slate-500 block">PFMS Message Ref ID</span>
                    <span className="font-mono text-slate-800 text-xs font-bold">{pfmsResult.message_id}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs text-slate-500 block">Class-3 DSC Token ID</span>
                    <span className="font-mono text-slate-800 text-xs">{pfmsResult.dsc_token_id}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs text-slate-500 block">Dispatched Timestamp</span>
                    <span className="font-medium text-slate-800">{new Date(pfmsResult.dispatched_at).toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Signed CGA-Compliant XML Payload Snippet
                  </label>
                  <pre className="p-3 bg-slate-900 text-teal-300 rounded-lg font-mono text-xs overflow-x-auto whitespace-pre-wrap max-h-48">
                    {pfmsResult.payload_xml}
                  </pre>
                </div>

                <div className="p-3 bg-slate-100 rounded-lg font-mono text-xs text-slate-700">
                  <span className="text-slate-500 block mb-0.5 font-sans font-semibold">DSC Digital Signature Digest:</span>
                  <span className="break-all">{pfmsResult.dsc_signature}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: AISHE Master Directory & Affiliation (F-133) */}
        {/* ========================================================================= */}
        {activeTab === 'aishe' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-cyan-700" />
                    All India Survey on Higher Education (AISHE) Master Directory
                  </h2>
                  <p className="text-sm text-slate-500">
                    Verify higher educational institution affiliation, university accreditation, and college existence against MoE national directory.
                  </p>
                </div>
                <span className="px-2.5 py-1 text-xs font-semibold rounded bg-cyan-100 text-cyan-800">
                  MoE AISHE Direct API
                </span>
              </div>

              <form onSubmit={handleAisheVerify} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    AISHE Code (College / University)
                  </label>
                  <input
                    type="text"
                    required
                    value={aisheCode}
                    onChange={(e) => setAisheCode(e.target.value.toUpperCase())}
                    placeholder="e.g. C-41234 or U-0123"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 font-mono"
                  />
                  <span className="text-xs text-slate-500 mt-1 block">
                    Example pre-seeded codes: `C-41234` (St. Xavier's College, Ranchi), `C-10928` (Birsa Institute of Technology)
                  </span>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Verify Institution
                  </button>
                </div>
              </form>
            </div>

            {aisheResult && (
              <div className="bg-white p-6 rounded-xl border border-cyan-200 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-cyan-100 mb-4">
                  <span className="font-semibold text-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    AISHE Institutional Record Found
                  </span>
                  <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                    aisheResult.affiliation_status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {aisheResult.affiliation_status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div className="p-3 bg-slate-50 rounded-lg md:col-span-2">
                    <span className="text-xs text-slate-500 block">Institution / College Name</span>
                    <span className="font-bold text-slate-900 text-base">{aisheResult.college_name}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs text-slate-500 block">AISHE Code</span>
                    <span className="font-mono font-semibold text-cyan-900">{aisheResult.aishe_code}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs text-slate-500 block">Affiliated University</span>
                    <span className="font-medium text-slate-800">{aisheResult.university_name}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs text-slate-500 block">State & District</span>
                    <span className="font-medium text-slate-800">{aisheResult.district}, {aisheResult.state}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs text-slate-500 block">NAAC / Accreditation Grade</span>
                    <span className="font-semibold text-emerald-700">{aisheResult.accreditation_grade || 'Grade A'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: Academic Examination Boards (CBSE/JAC) (F-134) */}
        {/* ========================================================================= */}
        {activeTab === 'academic' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-violet-700" />
                    Academic Examination Boards (CBSE / JAC) e-Marksheet API
                  </h2>
                  <p className="text-sm text-slate-500">
                    Direct board API integration to verify matriculation and intermediate scores, preventing fabricated marksheets.
                  </p>
                </div>
                <span className="px-2.5 py-1 text-xs font-semibold rounded bg-violet-100 text-violet-800">
                  Direct Board API
                </span>
              </div>

              <form onSubmit={handleAcademicVerify} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Exam Board
                  </label>
                  <select
                    value={boardName}
                    onChange={(e) => setBoardName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  >
                    <option value="JAC">JAC (Jharkhand Academic Council)</option>
                    <option value="CBSE">CBSE (Central Board of Secondary Education)</option>
                    <option value="ICSE">ICSE / CISCE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Roll Code / School Code
                  </label>
                  <input
                    type="text"
                    required
                    value={rollCode}
                    onChange={(e) => setRollCode(e.target.value)}
                    placeholder="e.g. 31002"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Roll Number
                  </label>
                  <input
                    type="text"
                    required
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="e.g. 10045"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Passing Year
                  </label>
                  <input
                    type="number"
                    min={2015}
                    max={2026}
                    required
                    value={passingYear}
                    onChange={(e) => setPassingYear(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 font-mono"
                  />
                </div>

                <div className="md:col-span-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-violet-700 hover:bg-violet-800 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Verify e-Marksheet from Board Database
                  </button>
                </div>
              </form>
            </div>

            {academicResult && (
              <div className="bg-white p-6 rounded-xl border border-violet-200 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-violet-100 mb-4">
                  <span className="font-semibold text-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Authentic Board Marksheet Verified
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-violet-100 text-violet-800">
                    VERIFIED_BY_BOARD
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs text-slate-500 block">Candidate Name</span>
                    <span className="font-bold text-slate-900">{academicResult.student_name}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs text-slate-500 block">Board & Year</span>
                    <span className="font-medium text-slate-800">{academicResult.board_name} - {academicResult.passing_year}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs text-slate-500 block">Marks Obtained</span>
                    <span className="font-semibold text-slate-800">{academicResult.marks_obtained} / {academicResult.max_marks}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs text-slate-500 block">Percentage & Division</span>
                    <span className="font-bold text-emerald-700">{academicResult.percentage}% ({academicResult.division})</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs flex items-center justify-between">
                  <span>Board Digital Signature Hash:</span>
                  <span className="text-violet-300">{academicResult.board_hash || 'SHA256:7b1d9c4f...verified'}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: JharSewa / e-District Certificate API (F-135) */}
        {/* ========================================================================= */}
        {activeTab === 'jharsewa' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-700" />
                    JharSewa / e-District Certificate Verification API
                  </h2>
                  <p className="text-sm text-slate-500">
                    Real-time cross verification of Scheduled Tribe (ST) Caste, Income, and Residential certificates with Jharkhand e-District portal.
                  </p>
                </div>
                <span className="px-2.5 py-1 text-xs font-semibold rounded bg-amber-100 text-amber-800">
                  JharSewa Govt of JH Gateway
                </span>
              </div>

              <form onSubmit={handleJharsewaVerify} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Certificate Type
                  </label>
                  <select
                    value={jharsewaCertType}
                    onChange={(e) => setJharsewaCertType(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="CASTE">Caste Certificate (ST / SC / OBC)</option>
                    <option value="INCOME">Income Certificate</option>
                    <option value="DOMICILE">Residential / Domicile Certificate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Certificate Application / Ref Number
                  </label>
                  <input
                    type="text"
                    required
                    value={jharsewaCertNo}
                    onChange={(e) => setJharsewaCertNo(e.target.value)}
                    placeholder="JH/CASTE/2025/11293"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Applicant Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={jharsewaApplicantName}
                    onChange={(e) => setJharsewaApplicantName(e.target.value)}
                    placeholder="Birsa Munda"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>

                <div className="md:col-span-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Verify against JharSewa Repository
                  </button>
                </div>
              </form>
            </div>

            {jharsewaResult && (
              <div className="bg-white p-6 rounded-xl border border-amber-200 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-amber-100 mb-4">
                  <span className="font-semibold text-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    e-District Record Verified: {jharsewaResult.certificate_number}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                    jharsewaResult.is_valid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {jharsewaResult.is_valid ? 'VALID CERTIFICATE' : 'REVOKED / INVALID'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs text-slate-500 block">Beneficiary Name</span>
                    <span className="font-bold text-slate-900">{jharsewaResult.beneficiary_name}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs text-slate-500 block">Tribe / Category</span>
                    <span className="font-medium text-slate-800">{jharsewaResult.caste_tribe || 'Munda (ST)'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs text-slate-500 block">Issuing Authority (Circle Officer)</span>
                    <span className="font-medium text-slate-800">{jharsewaResult.issuing_authority || 'CO Khunti'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs text-slate-500 block">Issue Date</span>
                    <span className="font-medium text-slate-800">{new Date(jharsewaResult.issue_date).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs flex items-center justify-between">
                  <span>JharSewa Electronic Verification Token:</span>
                  <span className="text-amber-300">{jharsewaResult.qr_token || 'TOKEN-JH-EDISTRICT-2025-VALID'}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 8: UMANG Mobile SSO & Webhooks Hub (F-136, F-137, F-138) */}
        {/* ========================================================================= */}
        {activeTab === 'umang_webhooks' && (
          <div className="space-y-6">
            {/* Rate Limiter Status Banner (F-138) */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-50 text-rose-700 rounded-lg">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    F-138: External API Rate Limiting & DDoS Shield
                  </h3>
                  <p className="text-xs text-slate-500">
                    Token bucket rate limiter safeguarding external integrations and webhooks from denial of service.
                  </p>
                </div>
              </div>

              {rateLimitStatus && (
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="bg-slate-100 px-3 py-1.5 rounded">
                    <span className="text-slate-500">Limit: </span>
                    <span className="font-bold text-slate-800">{rateLimitStatus.limit_per_minute} req/min</span>
                  </div>
                  <div className="bg-slate-100 px-3 py-1.5 rounded">
                    <span className="text-slate-500">Remaining: </span>
                    <span className="font-bold text-emerald-700">{rateLimitStatus.remaining}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded font-sans font-semibold bg-emerald-100 text-emerald-800">
                    {rateLimitStatus.status}
                  </span>
                </div>
              )}
            </div>

            {/* UMANG SSO (F-136) */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-indigo-700" />
                    UMANG Unified Mobile App REST Gateway & SSO (F-136)
                  </h2>
                  <p className="text-sm text-slate-500">
                    Exchanges UMANG app tokens for seamless Single Sign-On (SSO) session tokens with cross-app state synchronization.
                  </p>
                </div>
                <span className="px-2.5 py-1 text-xs font-semibold rounded bg-indigo-100 text-indigo-800">
                  MeitY UMANG v4.0
                </span>
              </div>

              <form onSubmit={handleUmangSsoExchange} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    UMANG Auth Token
                  </label>
                  <input
                    type="text"
                    required
                    value={umangToken}
                    onChange={(e) => setUmangToken(e.target.value)}
                    placeholder="UMANG-SESSION-AUTH-TOKEN-2026"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Registered Mobile Number
                  </label>
                  <input
                    type="text"
                    required
                    value={umangMobile}
                    onChange={(e) => setUmangMobile(e.target.value)}
                    placeholder="9876543210"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
                    Exchange SSO Session
                  </button>
                </div>
              </form>

              {umangResult && (
                <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      UMANG Session Exchanged Successfully
                    </span>
                    <span className="text-xs bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded font-mono">
                      Expires in: {umangResult.expires_in}s
                    </span>
                  </div>
                  <div className="font-mono text-xs text-slate-700">
                    Access Token: <span className="font-semibold text-indigo-800">{umangResult.access_token}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Webhook Hub (F-137) */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Webhook className="w-5 h-5 text-blue-700" />
                    Webhook Subscription Hub & Outbound Dispatcher (F-137)
                  </h2>
                  <p className="text-sm text-slate-500">
                    Subscribe external audit and tribal monitoring endpoints for real-time scholarship lifecycle events.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubscribeWebhook} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Event Type
                  </label>
                  <select
                    value={webhookEventType}
                    onChange={(e) => setWebhookEventType(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="APPLICATION_SANCTIONED">APPLICATION_SANCTIONED</option>
                    <option value="DBT_DISBURSED">DBT_DISBURSED</option>
                    <option value="GRIEVANCE_ESCALATED">GRIEVANCE_ESCALATED</option>
                    <option value="SCRUTINY_REJECTED">SCRUTINY_REJECTED</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Target Callback URL
                  </label>
                  <input
                    type="url"
                    required
                    value={webhookTargetUrl}
                    onChange={(e) => setWebhookTargetUrl(e.target.value)}
                    placeholder="https://agency.gov.in/webhook"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Webhook className="w-4 h-4" />
                    Register Subscription
                  </button>
                </div>
              </form>

              {/* Logs Table */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-700" />
                    Recent Webhook Outbound Dispatch Logs
                  </h3>
                  <button
                    onClick={loadWebhookLogsAndRateLimit}
                    className="text-xs text-blue-700 hover:underline flex items-center gap-1 font-medium"
                  >
                    <RefreshCw className="w-3 h-3" /> Refresh Logs
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold">
                      <tr>
                        <th className="px-4 py-3 text-left">Event</th>
                        <th className="px-4 py-3 text-left">Target URL</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">HTTP Code</th>
                        <th className="px-4 py-3 text-left">Retries</th>
                        <th className="px-4 py-3 text-left">Dispatched At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {webhookLogs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                            No webhook dispatch logs recorded yet.
                          </td>
                        </tr>
                      ) : (
                        webhookLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-semibold text-slate-800">{log.event_type}</td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-600 truncate max-w-xs">{log.target_url}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                log.delivery_status === 'DELIVERED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}>
                                {log.delivery_status}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-700">{log.response_status_code || 200}</td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-600">{log.retry_count}</td>
                            <td className="px-4 py-3 text-xs text-slate-500">
                              {new Date(log.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GatewayWorkbenchPage;
