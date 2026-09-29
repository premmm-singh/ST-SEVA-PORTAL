import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { grievanceService } from '../../services/grievanceService';

export default function GrievanceTrackerPage() {
  const { ticketNumber: routeTicket } = useParams();
  const navigate = useNavigate();

  const [ticketInput, setTicketInput] = useState(routeTicket || '');
  const [grievance, setGrievance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Appeal state
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [appealSubmitting, setAppealSubmitting] = useState(false);
  const [appealSuccess, setAppealSuccess] = useState(false);

  useEffect(() => {
    if (routeTicket) {
      loadGrievance(routeTicket);
    }
  }, [routeTicket]);

  const loadGrievance = async (ticket) => {
    setLoading(true);
    setError(null);
    try {
      const data = await grievanceService.trackPublicGrievance(ticket.trim());
      setGrievance(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Grievance ticket not found. Please verify the code.");
      setGrievance(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (ticketInput.trim()) {
      navigate(`/grievance/track/${ticketInput.trim().toUpperCase()}`);
    }
  };

  const handleAppealSubmit = async (e) => {
    e.preventDefault();
    if (!appealReason.trim() || !grievance) return;
    setAppealSubmitting(true);
    try {
      await grievanceService.appealGrievance(grievance.id, { appeal_reason: appealReason.trim() });
      setAppealSuccess(true);
      setShowAppealModal(false);
      // Reload grievance details
      loadGrievance(grievance.ticket_number);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to submit appeal. You must be logged in as the complainant.");
    } finally {
      setAppealSubmitting(false);
    }
  };

  // Helper for SLA Remaining
  const getSlaRemaining = (deadlineStr) => {
    if (!deadlineStr) return null;
    const deadline = new Date(deadlineStr);
    const now = new Date();
    const diffMs = deadline - now;
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    if (diffHours < 0) {
      return { breached: true, text: `SLA Breached by ${Math.abs(diffHours)} hours` };
    }
    const days = Math.floor(diffHours / 24);
    const hours = diffHours % 24;
    return { breached: false, text: `${days}d ${hours}h remaining` };
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-xs text-gray-500 mb-6 font-medium">
        <Link to="/" className="hover:text-brand-600">Home</Link>
        <span>/</span>
        <Link to="/grievance/file" className="hover:text-brand-600">Grievances</Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold">Track Status</span>
      </div>

      {/* Search Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-8">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Track Statutory Grievance Status</h1>
        <p className="text-xs text-gray-500 mb-4">
          Enter your 16-character statutory tracking ID (e.g. <span className="font-mono text-brand-600 font-bold">GRV-JH-2026-XXXXX</span>) to monitor officer scrutiny, hearings, and formal Action Taken Reports (ATR).
        </p>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Enter Ticket ID (e.g. GRV-JH-2026-A1B2C3)"
            value={ticketInput}
            onChange={(e) => setTicketInput(e.target.value.toUpperCase())}
            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-brand-500 focus:bg-white"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold text-sm rounded-lg shadow-sm transition"
          >
            {loading ? "Searching..." : "Track Status"}
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm mb-6 flex items-center space-x-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {appealSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm mb-6 flex items-center space-x-2">
          <span>✓</span>
          <span>Appeal lodged successfully! Your dispute has been escalated directly to Tier 3 (State Welfare Directorate).</span>
        </div>
      )}

      {grievance && (
        <div className="space-y-6">
          {/* Status Overview Card */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-gray-100 gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-base font-bold text-gray-900">{grievance.ticket_number}</span>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    grievance.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' :
                    grievance.status === 'CLOSED' ? 'bg-gray-100 text-gray-700' :
                    grievance.status === 'APPEALED' ? 'bg-purple-100 text-purple-800' :
                    grievance.status === 'HEARING_SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                    grievance.is_sla_breached ? 'bg-red-100 text-red-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {grievance.status}
                  </span>
                  <span className="text-[11px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                    Tier {grievance.tier_level} {grievance.tier_level === 1 ? '(Helpdesk)' : grievance.tier_level === 2 ? '(DWO)' : '(Directorate)'}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-gray-900 mt-2">{grievance.subject}</h2>
              </div>

              {/* SLA Badge */}
              <div className="text-right sm:text-right">
                {(() => {
                  const sla = getSlaRemaining(grievance.sla_deadline);
                  if (!sla) return null;
                  return (
                    <div className={`inline-block p-2.5 rounded-lg border text-left ${
                      sla.breached
                        ? 'bg-red-50 border-red-200 text-red-800'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    }`}>
                      <p className="text-[10px] font-bold uppercase tracking-wider">Statutory SLA Window</p>
                      <p className="text-xs font-semibold mt-0.5">{sla.text}</p>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Description & Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 text-xs">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-500 font-medium">Category</p>
                <p className="text-gray-900 font-semibold mt-0.5">{grievance.category}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-500 font-medium">District</p>
                <p className="text-gray-900 font-semibold mt-0.5">{grievance.district}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-500 font-medium">Lodged Date</p>
                <p className="text-gray-900 font-semibold mt-0.5">
                  {new Date(grievance.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg text-xs text-gray-700 leading-relaxed mb-4">
              <p className="font-semibold text-gray-900 mb-1">Complainant Statement:</p>
              <p>{grievance.description}</p>
            </div>

            {grievance.evidence_document_url && (
              <div className="flex items-center space-x-2 text-xs text-brand-600">
                <span>📎 Proof Document:</span>
                <a
                  href={grievance.evidence_document_url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-brand-800 font-medium"
                >
                  View Uploaded Evidence
                </a>
              </div>
            )}
          </div>

          {/* Action Taken Report (ATR) Section if Resolved */}
          {grievance.action_taken_report && (
            <div className="bg-emerald-50/70 border border-emerald-300 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">📜</span>
                  <h3 className="text-sm font-bold text-emerald-950 uppercase tracking-wide">
                    Statutory Action Taken Report (ATR)
                  </h3>
                </div>
                {grievance.atr_digital_seal && (
                  <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded font-bold">
                    ✓ Verified Digital Seal
                  </span>
                )}
              </div>

              <div className="bg-white p-4 rounded-lg border border-emerald-200 text-xs text-gray-800 mb-3 space-y-2">
                <p className="font-semibold text-gray-900">Official Finding & Action Taken:</p>
                <p className="leading-relaxed">{grievance.action_taken_report}</p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-emerald-900 font-mono gap-2">
                <span>Digital Seal: {grievance.atr_digital_seal}</span>
                {grievance.status === 'RESOLVED' && (
                  <button
                    onClick={() => setShowAppealModal(true)}
                    className="px-3 py-1 bg-white hover:bg-emerald-100 text-emerald-800 font-semibold rounded border border-emerald-300 transition text-xs font-sans"
                  >
                    Dispute Resolution? File Appeal →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Dispute Hearing Notice Card if Scheduled */}
          {grievance.hearings && grievance.hearings.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-lg">⚖️</span>
                <h3 className="text-sm font-bold text-blue-950 uppercase tracking-wide">
                  Formal Dispute Hearing Schedule
                </h3>
              </div>
              <div className="space-y-3">
                {grievance.hearings.map((h, i) => (
                  <div key={h.id || i} className="bg-white p-4 rounded-lg border border-blue-200 text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-900">Session Mode: {h.mode}</span>
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        {h.status}
                      </span>
                    </div>
                    <p className="text-gray-600">
                      Scheduled Date: <strong className="text-gray-900">
                        {new Date(h.scheduled_at).toLocaleDateString('en-IN', {
                          weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </strong>
                    </p>
                    <p className="text-gray-600">
                      Link / Office Venue: <span className="font-mono text-brand-600 font-semibold">{h.venue_or_link}</span>
                    </p>
                    {h.hearing_notes && (
                      <p className="text-gray-700 bg-gray-50 p-2 rounded">
                        <strong>Officer Instructions:</strong> {h.hearing_notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vertical Progress Timeline */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <span>⏱️</span>
              <span>Grievance Redressal Audit Trail & Timeline</span>
            </h3>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
              {grievance.timelines && grievance.timelines.map((step, idx) => (
                <div key={step.id || idx} className="relative">
                  {/* Dot */}
                  <div className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                    step.action.includes('RESOLVED') ? 'border-emerald-500 bg-emerald-50' :
                    step.action.includes('ESCALATED') ? 'border-red-500 bg-red-50' :
                    step.action.includes('HEARING') ? 'border-blue-500 bg-blue-50' :
                    'border-brand-500'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      step.action.includes('RESOLVED') ? 'bg-emerald-500' :
                      step.action.includes('ESCALATED') ? 'bg-red-500' :
                      'bg-brand-500'
                    }`} />
                  </div>

                  {/* Content */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                      <span className="font-bold text-gray-900">{step.action}</span>
                      <span className="text-[11px] text-gray-400">
                        {new Date(step.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{step.remarks}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 font-medium">
                      Action By: {step.actor_name} ({step.actor_role})
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Citizen Appeal Modal */}
      {showAppealModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">
                Lodge Statutory Appeal (Tier 3 Directorate)
              </h3>
              <button
                onClick={() => setShowAppealModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Under Right to Public Services Act, if you are dissatisfied with the District Welfare Officer's action report, you can appeal directly to the State Welfare Directorate within 15 days.
            </p>

            <form onSubmit={handleAppealSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Reason for Appeal / Specific Objections to ATR <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  placeholder="State clearly why the previous resolution was unsatisfactory (e.g. document facts were overlooked)..."
                  className="w-full px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAppealModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={appealSubmitting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                >
                  {appealSubmitting ? "Submitting Appeal..." : "Submit Formal Appeal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
