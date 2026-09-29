import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Megaphone,
  Send,
  Users,
  Smartphone,
  MessageSquare,
  Bell,
  History,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  FileCheck
} from 'lucide-react';
import notificationService from '../../services/notificationService';

const OfficerBroadcastPage = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Form state
  const [title, setTitle] = useState('');
  const [messageText, setMessageText] = useState('');
  const [targetRole, setTargetRole] = useState('STUDENT');
  const [targetDistrict, setTargetDistrict] = useState('');
  const [selectedChannels, setSelectedChannels] = useState(['IN_APP', 'SMS', 'WHATSAPP']);

  // Modal / audit inspection
  const [showTraiModal, setShowTraiModal] = useState(false);
  const [traiAuditData, setTraiAuditData] = useState(null);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [chaserRunning, setChaserRunning] = useState(false);
  const [chaserResult, setChaserResult] = useState(null);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getBroadcasts();
      setCampaigns(data || []);
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleChannelToggle = (channel) => {
    setSelectedChannels(prev =>
      prev.includes(channel)
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
  };

  const handleDispatch = async (e) => {
    e.preventDefault();
    if (!title.trim() || !messageText.trim()) {
      setErrorMsg('Please specify both broadcast title and statutory message content.');
      return;
    }
    if (selectedChannels.length === 0) {
      setErrorMsg('Please select at least one delivery channel.');
      return;
    }

    try {
      setDispatching(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const payload = {
        title,
        message_text: messageText,
        target_role: targetRole,
        target_district: targetDistrict || null,
        channels: selectedChannels
      };

      const result = await notificationService.dispatchBroadcast(payload);
      setSuccessMsg(`Broadcast dispatched successfully to ${result.total_recipients} recipients (${result.success_count} delivered).`);
      setTitle('');
      setMessageText('');
      fetchCampaigns();
    } catch (err) {
      console.error('Dispatch failed:', err);
      setErrorMsg('Failed to dispatch broadcast campaign. Check officer authorization.');
    } finally {
      setDispatching(false);
    }
  };

  const handleRunChasers = async () => {
    try {
      setChaserRunning(true);
      setChaserResult(null);
      const res = await notificationService.runDeadlineChasers();
      setChaserResult(res.message);
    } catch (err) {
      console.error('Failed to run chasers:', err);
      setChaserResult('Failed to run deadline chasers.');
    } finally {
      setChaserRunning(false);
    }
  };

  const handleViewTraiAudit = async () => {
    try {
      setLoadingAudit(true);
      setShowTraiModal(true);
      const data = await notificationService.getTraiComplianceLogs();
      setTraiAuditData(data);
    } catch (err) {
      console.error('Failed to load TRAI audit logs:', err);
    } finally {
      setLoadingAudit(false);
    }
  };

  const districts = [
    'Ranchi', 'Khunti', 'Dumka', 'West Singhbhum', 'East Singhbhum',
    'Gumla', 'Simdega', 'Latehar', 'Lohardaga', 'Pakur', 'Sahebganj'
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Breadcrumb & Tools */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span>Welfare Officer Desk</span>
              <span>/</span>
              <span className="text-[#005696]">Communication Hub</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Megaphone className="w-7 h-7 text-[#005696]" />
              Official Broadcast & Alerts Console (F-89)
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Dispatch statutory welfare circulars, critical deadline reminders, and emergency scheme announcements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRunChasers}
              disabled={chaserRunning}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold rounded-lg transition"
            >
              <Clock className={`w-4 h-4 text-amber-700 ${chaserRunning ? 'animate-spin' : ''}`} />
              Run 48h Deadline Chasers
            </button>
            <button
              onClick={handleViewTraiAudit}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-lg transition"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              TRAI DLT Compliance Log
            </button>
          </div>
        </div>

        {/* Chaser feedback */}
        {chaserResult && (
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold flex items-center justify-between">
            <span>{chaserResult}</span>
            <button onClick={() => setChaserResult(null)} className="text-amber-700 hover:text-amber-900">×</button>
          </div>
        )}

        {/* Feedback alerts */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Broadcast Dispatcher Form */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
            <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2 border-b border-slate-100 pb-3">
              <Send className="w-4 h-4 text-[#005696]" />
              Compose Statutory Broadcast Alert
            </h2>

            <form onSubmit={handleDispatch} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Broadcast Subject / Header *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Extended Deadline for Post-Matric Scholarship 2026-2027"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#005696]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Statutory Message Body (DLT Compliant) *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Enter the official notification text to be delivered via SMS, WhatsApp, and In-App notification..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#005696]"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  TRAI DLT Template ID: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono">DLT-TE-1006 (BROADCAST_ALERT)</code>
                </p>
              </div>

              {/* Targeting Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Cohort
                  </label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white font-semibold"
                  >
                    <option value="STUDENT">All Registered Students</option>
                    <option value="INSTITUTION">All Verified Educational Institutions</option>
                    <option value="OFFICER">Welfare Scrutiny Officers</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target District (Optional)
                  </label>
                  <select
                    value={targetDistrict}
                    onChange={(e) => setTargetDistrict(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white font-semibold"
                  >
                    <option value="">All 24 Districts (Statewide)</option>
                    {districts.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Channel Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Delivery Channels
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'IN_APP', label: 'In-App Bell', icon: Bell, color: 'text-amber-600' },
                    { id: 'SMS', label: 'CDAC SMS', icon: Smartphone, color: 'text-[#005696]' },
                    { id: 'WHATSAPP', label: 'WhatsApp', icon: MessageSquare, color: 'text-emerald-600' }
                  ].map((ch) => {
                    const Icon = ch.icon;
                    const isChecked = selectedChannels.includes(ch.id);
                    return (
                      <button
                        type="button"
                        key={ch.id}
                        onClick={() => handleChannelToggle(ch.id)}
                        className={`p-3 rounded-lg border flex flex-col items-center gap-1.5 transition ${isChecked
                          ? 'bg-blue-50/60 border-[#005696] ring-1 ring-[#005696]'
                          : 'bg-white border-slate-200 hover:border-slate-300 opacity-60'
                          }`}
                      >
                        <Icon className={`w-4 h-4 ${ch.color}`} />
                        <span className="text-xs font-bold text-slate-800">{ch.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={dispatching}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#005696] hover:bg-[#00477D] text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {dispatching ? 'Dispatching Broadcast...' : 'Dispatch Broadcast Now'}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Statutory Guidelines & Audience Summary */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Statutory Compliance Rules
              </h3>
              <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4">
                <li>Every outgoing SMS strictly validates against statutory TRAI DLT template IDs.</li>
                <li>Night DND hours (21:00 to 07:00) hold routine announcements in queue.</li>
                <li>Automated delivery fallback hierarchy executes from WhatsApp to CDAC SMS.</li>
                <li>All outgoing dispatches record SHA-256 digests in statutory audit ledger.</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-[#005696] to-[#003B66] p-5 rounded-xl text-white shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Audience Targeting</h3>
              </div>
              <p className="text-xs text-blue-100">
                Targeting: <strong className="text-white">{targetRole}</strong> in <strong className="text-white">{targetDistrict || 'All Jharkhand Districts'}</strong>
              </p>
              <div className="pt-2 text-[11px] text-blue-200 border-t border-blue-400/30">
                Estimated coverage: Over 12,000+ active beneficiaries registered across 24 tribal districts.
              </div>
            </div>
          </div>
        </div>

        {/* Historical Campaigns Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
              <History className="w-4 h-4 text-[#005696]" />
              Broadcast Campaign Ledger
            </h2>
            <button
              onClick={fetchCampaigns}
              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Campaign Title</th>
                  <th className="p-3.5">Target Cohort</th>
                  <th className="p-3.5">Channels</th>
                  <th className="p-3.5">Recipients</th>
                  <th className="p-3.5">Delivered</th>
                  <th className="p-3.5">Dispatched Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">
                      Loading campaign history...
                    </td>
                  </tr>
                ) : campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">
                      No broadcast campaigns dispatched yet.
                    </td>
                  </tr>
                ) : (
                  campaigns.map((camp) => (
                    <tr key={camp.id} className="hover:bg-slate-50/50">
                      <td className="p-3.5 font-bold text-slate-900">
                        {camp.title}
                        <div className="text-[11px] text-slate-500 font-normal truncate max-w-xs">
                          {camp.message_text}
                        </div>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-700">
                        {camp.target_role} ({camp.target_district || 'ALL'})
                      </td>
                      <td className="p-3.5">
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">
                          {camp.channels}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">
                        {camp.total_recipients}
                      </td>
                      <td className="p-3.5">
                        <span className="text-emerald-700 font-bold">
                          {camp.success_count}
                        </span>
                        {camp.failed_count > 0 && (
                          <span className="text-red-600 ml-1">({camp.failed_count} failed)</span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-500">
                        {new Date(camp.created_at).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Statutory TRAI Compliance Log */}
        {showTraiModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Statutory TRAI DLT Compliance Audit Ledger
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Telecom Regulatory Authority of India (TRAI) Delivery Confirmation Records
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTraiModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold p-1 text-base"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                {loadingAudit ? (
                  <div className="p-12 text-center">
                    <RefreshCw className="w-8 h-8 text-[#005696] animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-500">Retrieving TRAI delivery audit trails...</p>
                  </div>
                ) : traiAuditData ? (
                  <>
                    <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-emerald-900">Cryptographic TRAI Seal</div>
                        <code className="text-[11px] text-emerald-700 font-mono break-all">
                          {traiAuditData.trai_audit_seal}
                        </code>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-emerald-900">{traiAuditData.total_dispatches} Records</div>
                        <div className="text-[10px] text-emerald-700">Verified Dispatches</div>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-2.5">Channel</th>
                            <th className="p-2.5">DLT Template ID</th>
                            <th className="p-2.5">Gateway Ref</th>
                            <th className="p-2.5">Status</th>
                            <th className="p-2.5">DLR Code</th>
                            <th className="p-2.5">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {traiAuditData.records.slice(0, 50).map((r, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2.5 font-bold text-slate-800">{r.channel}</td>
                              <td className="p-2.5 font-mono text-[11px] text-slate-600">{r.dlt_template_id || 'N/A'}</td>
                              <td className="p-2.5 font-mono text-[11px] text-slate-600">{r.gateway_ref_id || 'N/A'}</td>
                              <td className="p-2.5">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${r.delivery_status === 'DELIVERED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : r.delivery_status === 'FAILED'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-blue-100 text-blue-800'
                                  }`}>
                                  {r.delivery_status}
                                </span>
                              </td>
                              <td className="p-2.5 text-slate-600 text-[11px]">{r.dlr_code || '-'}</td>
                              <td className="p-2.5 text-slate-500 text-[11px]">
                                {r.sent_at ? new Date(r.sent_at).toLocaleTimeString() : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-slate-500 text-center py-4">No audit records available.</p>
                )}
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                <button
                  onClick={() => setShowTraiModal(false)}
                  className="px-5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition"
                >
                  Close Audit View
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfficerBroadcastPage;
