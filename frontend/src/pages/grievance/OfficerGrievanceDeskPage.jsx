import React, { useState, useEffect } from 'react';
import { grievanceService } from '../../services/grievanceService';

export default function OfficerGrievanceDeskPage() {
  const [activeTab, setActiveTab] = useState('QUEUE'); // QUEUE, ANALYTICS
  const [queue, setQueue] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    tier_level: '',
    district: '',
    is_sla_breached: ''
  });

  // Action modal
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [actionType, setActionType] = useState('RESOLVE'); // RESOLVE, IN_REVIEW, ASSIGN, ESCALATE
  const [remarks, setRemarks] = useState('');
  const [atrText, setAtrText] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  // Hearing modal
  const [showHearingModal, setShowHearingModal] = useState(false);
  const [hearingForm, setHearingForm] = useState({
    scheduled_at: '',
    mode: 'VIRTUAL_MEETING',
    venue_or_link: '',
    hearing_notes: ''
  });

  useEffect(() => {
    if (activeTab === 'QUEUE') {
      loadQueue();
    } else {
      loadAnalytics();
    }
  }, [activeTab, filters]);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.tier_level) params.tier_level = parseInt(filters.tier_level);
      if (filters.district) params.district = filters.district;
      if (filters.is_sla_breached !== '') params.is_sla_breached = filters.is_sla_breached === 'true';

      const data = await grievanceService.getOfficerQueue(params);
      setQueue(data);
    } catch (err) {
      console.error("Failed to load officer queue", err);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await grievanceService.getAnalyticsDashboard();
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to load analytics", err);
    } finally {
      setLoading(false);
    }
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setActionSubmitting(true);
    try {
      await grievanceService.takeOfficerAction(selectedTicket.id, {
        action: actionType,
        remarks: remarks || `Action ${actionType} taken by officer desk.`,
        action_taken_report: actionType === 'RESOLVE' ? atrText : null,
        resolution_summary: actionType === 'RESOLVE' ? remarks : null
      });
      setSelectedTicket(null);
      setRemarks('');
      setAtrText('');
      loadQueue();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to execute officer action.");
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleHearingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTicket || !hearingForm.scheduled_at || !hearingForm.venue_or_link) return;
    try {
      await grievanceService.scheduleHearing(selectedTicket.id, hearingForm);
      setShowHearingModal(false);
      setSelectedTicket(null);
      setHearingForm({ scheduled_at: '', mode: 'VIRTUAL_MEETING', venue_or_link: '', hearing_notes: '' });
      loadQueue();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to schedule hearing.");
    }
  };

  const handleRunEscalations = async () => {
    if (!window.confirm("Run automated statutory SLA escalation scan across all active tickets?")) return;
    try {
      const res = await grievanceService.runSlaEscalations();
      alert(`SLA Scan Complete: ${res.escalated_count} overdue grievance(s) auto-escalated to higher tier.`);
      loadQueue();
    } catch (err) {
      alert("Failed to run SLA escalations.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-gray-200 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-amber-100 text-amber-900 text-[11px] font-bold px-2 py-0.5 rounded uppercase">
              District Welfare Officer / Directorate
            </span>
            <span className="text-xs text-gray-500">Statutory SLA Compliance Desk</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Grievance Redressal & Scrutiny Workbench</h1>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRunEscalations}
            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-1.5"
          >
            <span>⚡ Run SLA Escalation Scan</span>
          </button>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('QUEUE')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition ${
                activeTab === 'QUEUE' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Action Queue
            </button>
            <button
              onClick={() => setActiveTab('ANALYTICS')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition ${
                activeTab === 'ANALYTICS' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Executive BI & Heatmap
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'QUEUE' ? (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-gray-600 font-semibold mb-1">Status Filter</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full p-2 bg-gray-50 border rounded-lg"
              >
                <option value="">All Statuses</option>
                <option value="SUBMITTED">SUBMITTED</option>
                <option value="IN_REVIEW">IN_REVIEW</option>
                <option value="HEARING_SCHEDULED">HEARING_SCHEDULED</option>
                <option value="ESCALATED_L2">ESCALATED_L2 (DWO)</option>
                <option value="ESCALATED_L3">ESCALATED_L3 (Directorate)</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="APPEALED">APPEALED</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-600 font-semibold mb-1">Escalation Tier</label>
              <select
                value={filters.tier_level}
                onChange={(e) => setFilters({ ...filters, tier_level: e.target.value })}
                className="w-full p-2 bg-gray-50 border rounded-lg"
              >
                <option value="">All Tiers</option>
                <option value="1">Tier 1 (Helpdesk)</option>
                <option value="2">Tier 2 (District Officer)</option>
                <option value="3">Tier 3 (State Directorate)</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-600 font-semibold mb-1">District</label>
              <input
                type="text"
                placeholder="e.g. Ranchi, Khunti..."
                value={filters.district}
                onChange={(e) => setFilters({ ...filters, district: e.target.value })}
                className="w-full p-2 bg-gray-50 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-gray-600 font-semibold mb-1">SLA Breach Overdue</label>
              <select
                value={filters.is_sla_breached}
                onChange={(e) => setFilters({ ...filters, is_sla_breached: e.target.value })}
                className="w-full p-2 bg-gray-50 border rounded-lg"
              >
                <option value="">All Tickets</option>
                <option value="true">⚠️ Overdue / Breached Only</option>
                <option value="false">Within SLA</option>
              </select>
            </div>
          </div>

          {/* Grievances Table */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-semibold">
                  <tr>
                    <th className="p-3.5">Ticket ID</th>
                    <th className="p-3.5">Category & Subject</th>
                    <th className="p-3.5">District</th>
                    <th className="p-3.5">Tier & SLA Deadline</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-gray-500">
                        Loading officer redressal queue...
                      </td>
                    </tr>
                  ) : queue.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-gray-500">
                        No pending grievances matching the selected filters.
                      </td>
                    </tr>
                  ) : (
                    queue.map((grv) => (
                      <tr key={grv.id} className="hover:bg-gray-50/70 transition">
                        <td className="p-3.5 font-mono font-bold text-gray-900">
                          {grv.ticket_number}
                          {grv.external_source && grv.external_source !== 'PORTAL' && (
                            <span className="block text-[10px] text-purple-700 font-sans font-semibold">
                              via {grv.external_source}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 max-w-xs">
                          <span className="text-[10px] font-bold text-gray-500 block uppercase">
                            {grv.category}
                          </span>
                          <span className="font-semibold text-gray-900 block truncate">
                            {grv.subject}
                          </span>
                        </td>
                        <td className="p-3.5 text-gray-700 font-medium">
                          {grv.district}
                        </td>
                        <td className="p-3.5">
                          <span className="text-gray-900 font-bold block">
                            Tier {grv.tier_level}
                          </span>
                          <span className={`text-[11px] block mt-0.5 ${
                            grv.is_sla_breached ? 'text-red-600 font-bold' : 'text-gray-500'
                          }`}>
                            {grv.is_sla_breached ? '⚠️ SLA Breached' : new Date(grv.sla_deadline).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short'
                            })}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            grv.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' :
                            grv.status === 'CLOSED' ? 'bg-gray-100 text-gray-700' :
                            grv.status === 'APPEALED' ? 'bg-purple-100 text-purple-800' :
                            grv.status === 'HEARING_SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                            grv.is_sla_breached ? 'bg-red-100 text-red-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {grv.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-1">
                          <button
                            onClick={() => {
                              setSelectedTicket(grv);
                              setActionType('RESOLVE');
                            }}
                            className="px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded font-semibold transition"
                          >
                            Resolve / ATR
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTicket(grv);
                              setShowHearingModal(true);
                            }}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded font-medium transition"
                          >
                            Hearing
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Executive Analytics Tab */
        analytics && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white border rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500 font-semibold uppercase">Total Inflow</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.total_grievances}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Statutory Tickets</p>
              </div>
              <div className="bg-white border rounded-xl p-4 shadow-sm">
                <p className="text-xs text-emerald-600 font-semibold uppercase">Resolved (ATR)</p>
                <p className="text-2xl font-bold text-emerald-700 mt-1">{analytics.resolved_count}</p>
                <p className="text-[11px] text-emerald-600/80 mt-0.5">Closed with Digital Seal</p>
              </div>
              <div className="bg-white border rounded-xl p-4 shadow-sm">
                <p className="text-xs text-brand-600 font-semibold uppercase">SLA Compliance Rate</p>
                <p className="text-2xl font-bold text-brand-700 mt-1">{analytics.sla_compliance_rate}%</p>
                <p className="text-[11px] text-brand-600/80 mt-0.5">Within 7-day statute</p>
              </div>
              <div className="bg-white border rounded-xl p-4 shadow-sm">
                <p className="text-xs text-blue-600 font-semibold uppercase">Avg. Resolution Speed</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">{analytics.avg_resolution_hours} hrs</p>
                <p className="text-[11px] text-blue-600/80 mt-0.5">From intake to closure</p>
              </div>
            </div>

            {/* Breakdowns Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* District Heatmap / Breakdown */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4">
                  District Dispute Heatmap (Complaint Inflow)
                </h3>
                <div className="space-y-3">
                  {Object.entries(analytics.district_breakdown).map(([dist, count]) => (
                    <div key={dist} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-gray-700">{dist}</span>
                        <span className="font-bold text-gray-900">{count} complaints</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-brand-500 h-2 rounded-full"
                          style={{
                            width: `${Math.min(100, (count / Math.max(...Object.values(analytics.district_breakdown))) * 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tier & Category Breakdown */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Multi-Tier Escalation Distribution</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(analytics.tier_distribution).map(([tierName, cnt]) => (
                      <div key={tierName} className="p-3 bg-gray-50 border rounded-lg text-center">
                        <p className="text-lg font-bold text-gray-900">{cnt}</p>
                        <p className="text-[10px] text-gray-500 font-medium mt-0.5">{tierName}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Dispute Categories</h3>
                  <div className="space-y-2">
                    {Object.entries(analytics.category_breakdown).map(([cat, cnt]) => (
                      <div key={cat} className="flex justify-between text-xs py-1 border-b border-gray-100">
                        <span className="text-gray-600">{cat}</span>
                        <span className="font-bold text-gray-900">{cnt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {/* Action / Resolution Modal */}
      {selectedTicket && !showHearingModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Officer Redressal Action</h3>
                <p className="text-xs font-mono text-gray-500">{selectedTicket.ticket_number}</p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleActionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Select Action</label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full p-2 bg-gray-50 border rounded-lg"
                >
                  <option value="RESOLVE">RESOLVE (Formulate ATR & Generate Digital Seal)</option>
                  <option value="IN_REVIEW">Mark Under Scrutiny / IN_REVIEW</option>
                  <option value="ESCALATE">Escalate to Next Higher Tier (DWO/Directorate)</option>
                  <option value="CLOSE">Close Ticket</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Internal Officer Remarks</label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Notes for the audit trail..."
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>

              {actionType === 'RESOLVE' && (
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Formal Action Taken Report (ATR) <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={atrText}
                    onChange={(e) => setAtrText(e.target.value)}
                    placeholder="State detailed findings and specific statutory rectification (e.g. scholarship sanctioned, bank account updated, college issued warning)..."
                    className="w-full p-2 border rounded-lg bg-emerald-50/30"
                    required
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    System will automatically compute a SHA-256 digital signature seal on this text.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 bg-gray-100 rounded-lg text-gray-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionSubmitting}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold shadow-sm transition"
                >
                  {actionSubmitting ? "Processing..." : "Commit Action"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hearing Scheduler Modal */}
      {selectedTicket && showHearingModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Summons / Schedule Formal Dispute Hearing</h3>
                <p className="text-xs font-mono text-gray-500">{selectedTicket.ticket_number}</p>
              </div>
              <button onClick={() => setShowHearingModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleHearingSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Hearing Date & Time</label>
                <input
                  type="datetime-local"
                  value={hearingForm.scheduled_at}
                  onChange={(e) => setHearingForm({ ...hearingForm, scheduled_at: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-gray-50"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Hearing Mode</label>
                <select
                  value={hearingForm.mode}
                  onChange={(e) => setHearingForm({ ...hearingForm, mode: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-gray-50"
                >
                  <option value="VIRTUAL_MEETING">Virtual Video Conference (Govt NIC / Bharat VC)</option>
                  <option value="PHYSICAL_OFFICE">Physical In-Person (District Welfare Office)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Meeting Link or Office Address</label>
                <input
                  type="text"
                  placeholder="e.g. https://meet.gov.in/jh-st-dispute-room-4 or Room 104, Collectorate, Ranchi"
                  value={hearingForm.venue_or_link}
                  onChange={(e) => setHearingForm({ ...hearingForm, venue_or_link: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Instructions for Complainant</label>
                <textarea
                  rows={3}
                  placeholder="List documents complainant and nodal officer must present during hearing..."
                  value={hearingForm.hearing_notes}
                  onChange={(e) => setHearingForm({ ...hearingForm, hearing_notes: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowHearingModal(false)}
                  className="px-4 py-2 bg-gray-100 rounded-lg text-gray-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm transition"
                >
                  Issue Hearing Summons Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
