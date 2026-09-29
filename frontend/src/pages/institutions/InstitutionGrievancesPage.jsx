import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  HelpCircle,
  Plus,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileQuestion,
  Loader2
} from 'lucide-react';
import institutionService from '../../services/institutionService';

const GRIEVANCE_CATEGORIES = [
  { value: 'QUOTA_INQUIRY', label: 'ST Scholarship Quota Allocation Discrepancy' },
  { value: 'FEE_REIMBURSEMENT', label: 'Institutional Fee Reimbursement Delay' },
  { value: 'PORTAL_BUG', label: 'Technical / Biometric / eKYC Portal Issue' },
  { value: 'STUDENT_DISPUTE', label: 'Applicant Course / Roll No Dispute' },
  { value: 'OTHER', label: 'Other Operational Query' }
];

export default function InstitutionGrievancesPage() {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [category, setCategory] = useState('QUOTA_INQUIRY');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [successNotice, setSuccessNotice] = useState('');

  const loadGrievances = async () => {
    setLoading(true);
    try {
      const data = await institutionService.getGrievances();
      setGrievances(data);
    } catch (err) {
      console.error('Failed to load grievances:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGrievances();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await institutionService.submitGrievance({
        category,
        subject,
        description,
        priority
      });
      setSuccessNotice(`Ticket #${res.ticket_number} successfully registered with District Welfare Officer.`);
      setSubject('');
      setDescription('');
      setIsFormOpen(false);
      await loadGrievances();
    } catch (err) {
      alert('Failed to submit grievance: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Top Header */}
        <div className="flex items-center justify-between">
          <Link
            to="/institution/dashboard"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-900 hover:text-blue-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Lodge New Grievance</span>
          </button>
        </div>

        {/* Title Banner */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <HelpCircle className="w-5 h-5 text-blue-900" />
              <h1 className="text-xl font-black text-slate-900">
                Institutional Grievance & Escalation Desk
              </h1>
            </div>
            <p className="text-xs text-slate-500">
              Feature 45: Direct official communication channel with District Welfare Officers (DWO) and State Tribal Welfare Directorate.
            </p>
          </div>
          <span className="px-3 py-1 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg text-xs font-bold">
            SLA: 48 Hours Response
          </span>
        </div>

        {/* Success Notice */}
        {successNotice && (
          <div className="p-4 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl flex items-center justify-between text-xs font-bold shadow-sm animate-in fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>{successNotice}</span>
            </div>
            <button onClick={() => setSuccessNotice('')} className="text-emerald-700 hover:text-emerald-900">
              ✕
            </button>
          </div>
        )}

        {/* New Grievance Form Collapse */}
        {isFormOpen && (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-md border border-blue-200 space-y-4 animate-in fade-in slide-in-from-top-2">
            <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-200 pb-2">
              Lodge New Official Grievance Ticket
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Grievance Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  {GRIEVANCE_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Priority Level
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="LOW">Low (General Query)</option>
                  <option value="MEDIUM">Medium (Normal)</option>
                  <option value="HIGH">High (Disbursement / Quota Block)</option>
                  <option value="URGENT">Urgent (Deadline Approaching)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Subject Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Sanctioned ST Quota for 2026 Mismatch in B.Tech CSE"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Detailed Description & Supporting Facts <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide complete facts, affected candidate roll numbers, or AISHE registration details..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg resize-none"
                required
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Transmitting Ticket...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit to District Officer</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Existing Grievances Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">
              Registered Institutional Tickets ({grievances.length})
            </h3>
            <button
              onClick={loadGrievances}
              className="text-xs font-semibold text-blue-900 hover:text-blue-700"
            >
              Refresh Status
            </button>
          </div>

          <div className="divide-y divide-slate-200">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Loading grievance history...
              </div>
            ) : grievances.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No active or previous grievances found for this institution.
              </div>
            ) : (
              grievances.map((g) => (
                <div key={g.id} className="p-6 space-y-2 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {g.ticket_number}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">•</span>
                      <span className="text-xs font-bold text-slate-700">{g.category.replace(/_/g, ' ')}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        g.priority === 'HIGH' || g.priority === 'URGENT'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {g.priority} PRIORITY
                      </span>

                      {g.status === 'RESOLVED' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          RESOLVED
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {g.status}
                        </span>
                      )}
                    </div>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900">{g.subject}</h4>
                  <p className="text-xs text-slate-600">{g.description}</p>

                  {g.response_notes && (
                    <div className="mt-3 p-3 bg-slate-100 rounded-lg text-xs space-y-1">
                      <span className="font-bold text-slate-800">DWO Resolution Response:</span>
                      <p className="text-slate-600">{g.response_notes}</p>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-400 pt-1">
                    Submitted on {new Date(g.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
