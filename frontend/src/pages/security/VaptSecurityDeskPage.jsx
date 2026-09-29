import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  GitBranch,
  Terminal,
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  Zap,
  Globe,
  FileCode,
  Layers,
  ArrowRight,
  Eye,
  Server
} from 'lucide-react';
import vaptService from '../../services/vaptService';

export const VaptSecurityDeskPage = () => {
  const [activeTab, setActiveTab] = useState('headers'); // headers | merkle | vapt_scan | anomalies
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  // Tab 1: Headers & Sanitization State
  const [headersStatus, setHeadersStatus] = useState(null);
  const [probePayload, setProbePayload] = useState("' UNION SELECT password, secret FROM users --");
  const [probeType, setProbeType] = useState('SQLI');
  const [probeResult, setProbeResult] = useState(null);

  // Tab 2: Merkle Tree State
  const [merkleRecordId, setMerkleRecordId] = useState('SANCTION-ORDER-2026-JH-9901');
  const [merkleAmount, setMerkleAmount] = useState('54000');
  const [merkleDistrict, setMerkleDistrict] = useState('Khunti');
  const [merkleResult, setMerkleResult] = useState(null);
  const [verifyRecordId, setVerifyRecordId] = useState('SANCTION-ORDER-2026-JH-9901');
  const [verifyResult, setVerifyResult] = useState(null);

  // Tab 3: VAPT Scan State
  const [scanType, setScanType] = useState('CERT_IN_AUDIT');
  const [scanComponent, setScanComponent] = useState('PORTAL_API_CORE');
  const [vaptScanResult, setVaptScanResult] = useState(null);

  // Tab 4: Session Anomaly State
  const [anomalyUserId, setAnomalyUserId] = useState('SEC-USR-OFFICER-RANCHI');
  const [currentCity, setCurrentCity] = useState('Frankfurt');
  const [currentIp, setCurrentIp] = useState('194.26.29.102');
  const [anomalyResult, setAnomalyResult] = useState(null);

  useEffect(() => {
    loadSecurityHeaders();
  }, []);

  const loadSecurityHeaders = async () => {
    try {
      const data = await vaptService.getSecurityHeadersStatus();
      setHeadersStatus(data);
    } catch (err) {
      console.error('Failed to load security headers', err);
    }
  };

  const handleRunProbe = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg({ text: '', type: '' });
    try {
      const res = await vaptService.testInputSanitization(probePayload, probeType);
      setProbeResult(res);
      setStatusMsg({
        text: res.is_blocked
          ? 'Attack payload neutralized by input sanitization firewall!'
          : 'Payload passed validation.',
        type: res.is_blocked ? 'success' : 'error'
      });
    } catch (err) {
      setStatusMsg({ text: 'Sanitization probe failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRecordMerkleLeaf = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg({ text: '', type: '' });
    try {
      const payload = {
        record_id: merkleRecordId,
        entity_type: 'SANCTION_ORDER',
        data_payload: {
          amount: parseFloat(merkleAmount),
          district: merkleDistrict,
          timestamp: new Date().toISOString()
        }
      };
      const res = await vaptService.recordMerkleLeaf(payload);
      setMerkleResult(res);
      setStatusMsg({ text: 'Record anchored to immutable Merkle tree chain with cryptographic inclusion proof!', type: 'success' });
    } catch (err) {
      setStatusMsg({ text: err.response?.data?.detail || 'Failed to anchor Merkle leaf', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMerkle = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg({ text: '', type: '' });
    try {
      const res = await vaptService.verifyMerkleNode(verifyRecordId);
      setVerifyResult(res);
      setStatusMsg({ text: 'Cryptographic zero-tamper audit status confirmed!', type: 'success' });
    } catch (err) {
      setStatusMsg({ text: err.response?.data?.detail || 'Verification failed: record not found', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerVaptScan = async () => {
    setLoading(true);
    setStatusMsg({ text: '', type: '' });
    try {
      const res = await vaptService.runVaptScan({
        scan_type: scanType,
        target_component: scanComponent,
        include_privilege_escalation: true
      });
      setVaptScanResult(res);
      setStatusMsg({ text: `CERT-In VAPT audit simulation completed with Score: ${res.cert_in_score}/100 (Grade ${res.compliance_grade})`, type: 'success' });
    } catch (err) {
      setStatusMsg({ text: 'VAPT scan execution failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckSessionAnomaly = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg({ text: '', type: '' });
    try {
      const res = await vaptService.checkSessionAnomaly({
        user_id: anomalyUserId,
        current_ip: currentIp,
        current_city: currentCity
      });
      setAnomalyResult(res);
      setStatusMsg({
        text: res.anomaly_detected
          ? `High risk anomaly detected (${res.risk_score}/100)! Action: ${res.action_required}`
          : 'Session location verified normal.',
        type: res.anomaly_detected ? 'error' : 'success'
      });
    } catch (err) {
      setStatusMsg({ text: err.response?.data?.detail || 'Anomaly check failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'headers', label: 'CERT-In & OWASP Headers', icon: ShieldCheck, badge: 'F-145' },
    { id: 'merkle', label: 'Merkle Tree Audit Chains', icon: GitBranch, badge: 'F-146' },
    { id: 'vapt_scan', label: 'Automated VAPT Scanner', icon: Terminal, badge: 'F-147' },
    { id: 'anomalies', label: 'Session Anomaly Shield', icon: ShieldAlert, badge: 'F-148' },
  ];

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      {/* Top Banner */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-700 text-white rounded-lg shadow-sm">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Security Hardening, Cryptographic Integrity & VAPT Compliance
                  </h1>
                  <p className="text-sm text-slate-600">
                    Phase 14: CERT-In Compliance, Merkle Tree Chains, Automated Penetration Testbed & Session Anomaly Detection
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5" /> CERT-In Posture: Grade A+
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                <Lock className="w-3.5 h-3.5" /> Merkle Anti-Tamper Online
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
            <nav className="flex space-x-2 pb-px" aria-label="Security Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                      isActive
                        ? 'border-rose-700 text-rose-800 bg-rose-50/50 font-semibold'
                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-rose-700' : 'text-slate-500'}`} />
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        isActive ? 'bg-rose-200/70 text-rose-900 font-bold' : 'bg-slate-100 text-slate-600'
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
        {/* TAB 1: CERT-In & OWASP Headers & Injection Defense (F-145) */}
        {/* ========================================================================= */}
        {activeTab === 'headers' && (
          <div className="space-y-6">
            {/* Headers Grid */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-rose-700" />
                    CERT-In Baseline Security Headers Status (Annexure-I)
                  </h2>
                  <p className="text-sm text-slate-500">
                    Mandatory cyber security response guardrails guarding against clickjacking, MIME sniffing, and cross-site scripting.
                  </p>
                </div>
                <span className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-100 text-emerald-800">
                  ALL POLICIES ENFORCED
                </span>
              </div>

              {headersStatus && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono mb-6">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-slate-500 block mb-1 font-sans font-semibold">Strict-Transport-Security (HSTS)</span>
                    <span className="text-emerald-700 font-bold">max-age=31536000; includeSubDomains</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-slate-500 block mb-1 font-sans font-semibold">X-Frame-Options (Clickjacking)</span>
                    <span className="text-emerald-700 font-bold">{headersStatus.x_frame_options}</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-slate-500 block mb-1 font-sans font-semibold">X-Content-Type-Options</span>
                    <span className="text-emerald-700 font-bold">{headersStatus.x_content_type_options}</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg md:col-span-2">
                    <span className="text-slate-500 block mb-1 font-sans font-semibold">Content-Security-Policy (CSP)</span>
                    <span className="text-slate-700 break-all">{headersStatus.csp_header}</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-slate-500 block mb-1 font-sans font-semibold">Referrer-Policy</span>
                    <span className="text-slate-700">{headersStatus.referrer_policy}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Sanitization Probe Sandbox */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                <FileCode className="w-5 h-5 text-rose-700" />
                Input Sanitization & Injection Defense Sandbox
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Test how the central input filtration engine intercepts malicious SQL injection, XSS script tags, or directory traversal attempts.
              </p>

              <form onSubmit={handleRunProbe} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Attack Vector
                  </label>
                  <select
                    value={probeType}
                    onChange={(e) => setProbeType(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="SQLI">SQL Injection (SQLi)</option>
                    <option value="XSS">Cross-Site Scripting (XSS)</option>
                    <option value="PATH_TRAVERSAL">Path / Directory Traversal</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Test Payload
                  </label>
                  <input
                    type="text"
                    required
                    value={probePayload}
                    onChange={(e) => setProbePayload(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 font-mono"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs rounded-lg transition shadow-sm disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                    Execute Probe Test
                  </button>
                </div>
              </form>

              {probeResult && (
                <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-900 text-slate-100 font-mono text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Attack Classification: {probeResult.injection_type}</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      probeResult.is_blocked ? 'bg-emerald-900 text-emerald-200' : 'bg-rose-900 text-rose-200'
                    }`}>
                      {probeResult.is_blocked ? 'FIREWALL BLOCKED & NEUTRALIZED' : 'CLEAN'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Sanitized Output String:</span>
                    <span className="text-amber-300">{probeResult.sanitized_output}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: Merkle Tree Audit Chains (F-146) */}
        {/* ========================================================================= */}
        {activeTab === 'merkle' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <GitBranch className="w-5 h-5 text-indigo-700" />
                    Anti-Tamper Immutable Hash Chains & Merkle Trees
                  </h2>
                  <p className="text-sm text-slate-500">
                    Cryptographic chaining of sanction orders and DBT disbursements into binary Merkle trees for zero-knowledge anti-tamper auditing.
                  </p>
                </div>
                <span className="px-2.5 py-1 text-xs font-semibold rounded bg-indigo-100 text-indigo-800">
                  SHA-256 Merkle Engine
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Anchor Leaf Card */}
                <form onSubmit={handleRecordMerkleLeaf} className="p-5 border border-slate-200 rounded-xl space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-indigo-700" />
                    Anchor New Sanction Order Leaf
                  </h3>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Sanction Order Ref ID
                    </label>
                    <input
                      type="text"
                      required
                      value={merkleRecordId}
                      onChange={(e) => setMerkleRecordId(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Amount (₹)
                      </label>
                      <input
                        type="number"
                        required
                        value={merkleAmount}
                        onChange={(e) => setMerkleAmount(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        District
                      </label>
                      <input
                        type="text"
                        required
                        value={merkleDistrict}
                        onChange={(e) => setMerkleDistrict(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold text-xs rounded-lg transition shadow-sm"
                  >
                    <GitBranch className="w-4 h-4" />
                    Anchor Leaf into Merkle Tree
                  </button>
                </form>

                {/* Verify Node Card */}
                <form onSubmit={handleVerifyMerkle} className="p-5 border border-slate-200 rounded-xl space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Search className="w-4 h-4 text-emerald-600" />
                    Zero-Tamper Merkle Inclusion Verification
                  </h3>
                  <p className="text-xs text-slate-600">
                    Verify whether a sanction order has maintained absolute cryptographic integrity without database tampering.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Enter Sanction Record ID
                    </label>
                    <input
                      type="text"
                      required
                      value={verifyRecordId}
                      onChange={(e) => setVerifyRecordId(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg transition shadow-sm"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Verify Cryptographic Proof
                  </button>
                </form>
              </div>

              {/* Anchored Result */}
              {merkleResult && (
                <div className="mt-6 p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-indigo-400 font-sans font-bold">Merkle Leaf Cryptographic Proof</span>
                    <span className="text-emerald-400 font-sans text-xs">Block Height #{merkleResult.block_height}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-500 block">Leaf Hash (SHA-256):</span>
                      <span className="text-amber-300 break-all">{merkleResult.leaf_hash}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Root Hash (SHA-256):</span>
                      <span className="text-emerald-300 break-all">{merkleResult.root_hash}</span>
                    </div>
                  </div>
                  <div className="pt-1">
                    <span className="text-slate-500 block">Audit Proof Chain Nodes:</span>
                    <span className="text-slate-300">{merkleResult.audit_proof_chain.join(' -> ')}</span>
                  </div>
                </div>
              )}

              {/* Verification Result */}
              {verifyResult && (
                <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-950 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      {verifyResult.audit_status}
                    </span>
                    <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-mono font-semibold">
                      Block #{verifyResult.block_height}
                    </span>
                  </div>
                  <div className="text-slate-700 font-mono text-[11px] break-all">
                    Leaf Hash: {verifyResult.leaf_hash}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: Automated VAPT Scanner (F-147) */}
        {/* ========================================================================= */}
        {activeTab === 'vapt_scan' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 mb-6 gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-rose-700" />
                    Automated Vulnerability & Penetration Testing (VAPT) Scanner
                  </h2>
                  <p className="text-sm text-slate-500">
                    Executes automated DAST simulated penetration vectors across OWASP Top-10 and CERT-In requirements.
                  </p>
                </div>

                <button
                  onClick={handleTriggerVaptScan}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs rounded-lg transition shadow-sm disabled:opacity-50 whitespace-nowrap"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Terminal className="w-4 h-4" />}
                  Run Automated VAPT Audit
                </button>
              </div>

              {vaptScanResult && (
                <div className="space-y-6">
                  {/* Scoreboard */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-xs text-slate-500 block">CERT-In Compliance Score</span>
                      <span className="text-2xl font-black text-rose-700">{vaptScanResult.cert_in_score}/100</span>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-xs text-slate-500 block">Compliance Grade</span>
                      <span className="text-2xl font-black text-emerald-700">{vaptScanResult.compliance_grade}</span>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-xs text-slate-500 block">Total Vectors Audited</span>
                      <span className="text-2xl font-black text-slate-800">{vaptScanResult.total_checks}</span>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-xs text-slate-500 block">Critical Defects</span>
                      <span className="text-2xl font-black text-emerald-700">{vaptScanResult.failed_checks}</span>
                    </div>
                  </div>

                  {/* Findings Table */}
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="min-w-full divide-y divide-slate-200 text-xs">
                      <thead className="bg-slate-50 text-slate-600 uppercase font-semibold">
                        <tr>
                          <th className="px-4 py-3 text-left">Vuln ID</th>
                          <th className="px-4 py-3 text-left">Vector Title</th>
                          <th className="px-4 py-3 text-left">CWE</th>
                          <th className="px-4 py-3 text-left">Severity</th>
                          <th className="px-4 py-3 text-left">Status</th>
                          <th className="px-4 py-3 text-left">Remediation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {vaptScanResult.findings.map((f) => (
                          <tr key={f.vuln_id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-mono font-bold text-slate-800">{f.vuln_id}</td>
                            <td className="px-4 py-3 font-semibold text-slate-800">{f.title}</td>
                            <td className="px-4 py-3 font-mono text-slate-500">{f.cwe_id}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-700">
                                {f.severity}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800">
                                {f.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{f.remediation}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: Session Hijacking & Anomaly Detection (F-148) */}
        {/* ========================================================================= */}
        {activeTab === 'anomalies' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-700" />
                    Session Hijacking Defense & IP Roaming Anomaly Shield
                  </h2>
                  <p className="text-sm text-slate-500">
                    Detect sudden geographic relocation or ASN jumps during active officer sessions and mandate adaptive biometric step-up authentication.
                  </p>
                </div>
                <span className="px-2.5 py-1 text-xs font-semibold rounded bg-rose-100 text-rose-800">
                  Adaptive Step-Up Auth
                </span>
              </div>

              <form onSubmit={handleCheckSessionAnomaly} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    User Session Identifier
                  </label>
                  <input
                    type="text"
                    required
                    value={anomalyUserId}
                    onChange={(e) => setAnomalyUserId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Current Connection IP
                  </label>
                  <input
                    type="text"
                    required
                    value={currentIp}
                    onChange={(e) => setCurrentIp(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Current City / Geo Coordinate
                  </label>
                  <input
                    type="text"
                    required
                    value={currentCity}
                    onChange={(e) => setCurrentCity(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs rounded-lg transition shadow-sm disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                    Evaluate Session Risk
                  </button>
                </div>
              </form>

              {anomalyResult && (
                <div
                  className={`p-5 rounded-xl border ${
                    anomalyResult.anomaly_detected
                      ? 'bg-rose-50 border-rose-300 text-rose-950'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-sm flex items-center gap-2">
                      {anomalyResult.anomaly_detected ? (
                        <AlertTriangle className="w-5 h-5 text-rose-600" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      )}
                      Risk Score: {anomalyResult.risk_score} / 100
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded text-xs font-bold ${
                        anomalyResult.anomaly_detected ? 'bg-rose-200 text-rose-900' : 'bg-emerald-200 text-emerald-900'
                      }`}
                    >
                      ACTION: {anomalyResult.action_required}
                    </span>
                  </div>

                  <p className="text-xs mb-3">{anomalyResult.reason}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-3 bg-white/80 rounded border border-slate-200">
                      <span className="text-slate-500 block font-sans">Baseline Location</span>
                      <span>Ranchi, IN (Previous IP: {anomalyResult.previous_ip})</span>
                    </div>
                    <div className="p-3 bg-white/80 rounded border border-slate-200">
                      <span className="text-slate-500 block font-sans">Current Ingress</span>
                      <span>{currentCity} (Current IP: {anomalyResult.current_ip})</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VaptSecurityDeskPage;
