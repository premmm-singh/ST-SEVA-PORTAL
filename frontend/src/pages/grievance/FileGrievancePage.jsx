import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { grievanceService } from '../../services/grievanceService';

const DISTRICTS = [
  "Ranchi", "East Singhbhum", "West Singhbhum", "Gumla",
  "Khunti", "Dumka", "Hazaribagh", "Bokaro", "Dhanbad",
  "Palamu", "Latehar", "Simdega", "Seraikela Kharsawan"
];

const CATEGORIES = [
  { value: "APPLICATION_DELAY", label: "Application Processing Stalled", icon: "⏳" },
  { value: "SCRUTINY_REJECTION", label: "Disputed Scrutiny Defect / Rejection", icon: "❌" },
  { value: "DISBURSEMENT_FAILURE", label: "DBT Payment / PFMS Bank Credit Failure", icon: "💳" },
  { value: "INSTITUTION_HARASSMENT", label: "Educational Institution Delay / Harassment", icon: "🏫" },
  { value: "TECHNICAL_GLITCH", label: "Portal Technical Glitch / Document Upload Issue", icon: "⚙️" },
  { value: "OTHER", label: "Other Statutory Welfare Dispute", icon: "📋" }
];

export default function FileGrievancePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    category: "APPLICATION_DELAY",
    subject: "",
    description: "",
    district: "Ranchi",
    application_id: "",
    priority: "MEDIUM",
    evidence_document_url: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successResult, setSuccessResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.description.trim()) {
      setError("Please provide a subject and detailed description of your grievance.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await grievanceService.fileGrievance({
        ...formData,
        application_id: formData.application_id.trim() || null,
        evidence_document_url: formData.evidence_document_url.trim() || null
      });
      setSuccessResult(res);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to submit grievance. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-xs text-gray-500 mb-6 font-medium">
        <Link to="/" className="hover:text-brand-600">Home</Link>
        <span>/</span>
        <Link to="/helpdesk/faq" className="hover:text-brand-600">Helpdesk</Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold">Lodge Grievance</span>
      </div>

      {/* Official Government Header Banner */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white rounded-xl p-6 shadow-md mb-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="bg-orange-800 text-orange-100 text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                Right to Public Services Act
              </span>
              <span className="text-xs text-orange-200">Statutory 7-Day Resolution</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Citizen Grievance Redressal Portal</h1>
            <p className="text-sm text-orange-100 mt-1 max-w-2xl">
              File a formal grievance regarding scholarship processing delays, institution verifications, or DBT payment issues. Every submission receives a statutory tracking number and is monitored under time-bound SLA.
            </p>
          </div>
          <div className="hidden sm:block text-right">
            <span className="text-4xl">🏛️</span>
          </div>
        </div>
      </div>

      {successResult ? (
        <div className="bg-white border border-emerald-200 rounded-xl p-8 shadow-sm text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            ✓
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Grievance Registered Successfully!</h2>
          <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
            Your grievance has been lodged under statutory Tier 1 (Helpdesk) with a 7-day resolution timeline.
          </p>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5 max-w-md mx-auto mb-6 text-left">
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-emerald-200">
              <span className="text-xs font-semibold text-emerald-800">Statutory Ticket ID:</span>
              <span className="font-mono text-sm font-bold text-emerald-950">{successResult.ticket_number}</span>
            </div>
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-emerald-200">
              <span className="text-xs font-semibold text-emerald-800">Category:</span>
              <span className="text-xs font-medium text-emerald-900">{successResult.category}</span>
            </div>
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-emerald-200">
              <span className="text-xs font-semibold text-emerald-800">Assigned Level:</span>
              <span className="text-xs font-bold text-emerald-900">Tier 1 (Helpdesk Officer)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-emerald-800">SLA Target Date:</span>
              <span className="text-xs font-bold text-red-600">
                {new Date(successResult.sla_deadline).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric'
                })}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate(`/grievance/track/${successResult.ticket_number}`)}
              className="w-full sm:w-auto px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-lg shadow-sm transition"
            >
              Track Grievance Live
            </button>
            <button
              onClick={() => {
                setSuccessResult(null);
                setFormData({
                  category: "APPLICATION_DELAY",
                  subject: "",
                  description: "",
                  district: "Ranchi",
                  application_id: "",
                  priority: "MEDIUM",
                  evidence_document_url: ""
                });
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm rounded-lg transition"
            >
              Lodge Another Complaint
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center space-x-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Grievance Category Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Select Grievance Category <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CATEGORIES.map((cat) => (
                <div
                  key={cat.value}
                  onClick={() => setFormData({ ...formData, category: cat.value })}
                  className={`p-3.5 border rounded-lg cursor-pointer transition flex items-start space-x-3 ${
                    formData.category === cat.value
                      ? 'border-brand-500 bg-brand-50/50 shadow-sm ring-1 ring-brand-500'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <div>
                    <p className="text-xs font-bold text-gray-900">{cat.label}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Code: {cat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* District */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                District of Educational Institution / Residence <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:bg-white"
              >
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Application ID (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Linked Scholarship Application Number (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. ST-2026-A83F19"
                value={formData.application_id}
                onChange={(e) => setFormData({ ...formData, application_id: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:bg-white font-mono"
              />
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Grievance Summary / Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. College nodal officer has not verified my Bonafide certificate for 30 days"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:bg-white"
              maxLength={200}
              required
            />
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Detailed Complaint Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={5}
              placeholder="Provide complete facts: date of submission, names of officers/college contacted, exact error messages or failure details..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:bg-white"
              required
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Notice: Providing false statutory information is punishable under Section 182 of IPC.
            </p>
          </div>

          {/* Evidence URL / Document Proof */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Supporting Proof / Evidence Document Link (Optional)
            </label>
            <input
              type="url"
              placeholder="https://... (e.g. link to scanned receipt or acknowledgement)"
              value={formData.evidence_document_url}
              onChange={(e) => setFormData({ ...formData, evidence_document_url: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:bg-white"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Dispute Urgency Level
            </label>
            <div className="flex items-center space-x-4">
              {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
                <label key={p} className="flex items-center space-x-2 text-xs font-medium text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="priority"
                    value={p}
                    checked={formData.priority === p}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="text-brand-600 focus:ring-brand-500"
                  />
                  <span>{p} {p === "URGENT" ? "(3-Day SLA)" : "(7-Day SLA)"}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
            <Link
              to="/helpdesk/faq"
              className="text-xs font-medium text-gray-500 hover:text-gray-700"
            >
              ← Check Knowledgebase FAQs
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold text-sm rounded-lg shadow-sm transition flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Registering Grievance...</span>
                </>
              ) : (
                <span>Submit Statutory Grievance</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
