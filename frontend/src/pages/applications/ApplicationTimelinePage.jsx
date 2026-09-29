import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import applicationService from '../../services/applicationService';

export default function ApplicationTimelinePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [appData, timelineData] = await Promise.all([
        applicationService.getApplicationById(id),
        applicationService.getApplicationTimeline(id)
      ]);
      setApplication(appData);
      setTimeline(timelineData);
    } catch (err) {
      console.error("Failed to load timeline:", err);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDownloadPdf = async () => {
    if (!application) return;
    try {
      const blob = await applicationService.exportApplicationPdf(application.id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Application_${application.application_number}.txt`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      showNotification('Downloaded official application record.');
    } catch (err) {
      showNotification('Failed to download application copy.', 'error');
    }
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    if (!withdrawReason.trim()) return;
    try {
      setActionLoading(true);
      await applicationService.withdrawApplication(application.id, withdrawReason);
      showNotification(`Application ${application.application_number} withdrawn.`);
      setWithdrawModal(false);
      loadData();
    } catch (err) {
      showNotification(err.response?.data?.detail || 'Withdrawal failed.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReapply = async () => {
    try {
      setActionLoading(true);
      const newApp = await applicationService.reapplyApplication(application.id);
      showNotification(`Re-application draft created: ${newApp.application_number}`);
      navigate(`/applications/${newApp.id}`);
    } catch (err) {
      showNotification(err.response?.data?.detail || 'Re-apply failed.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const STAGES_FLOW = [
    { key: 'APPLICATION_SUBMITTED', label: 'Application Submitted', desc: 'Tracking ID allocated & encrypted in database' },
    { key: 'INSTITUTE_VERIFIED', label: 'Institute Verification', desc: 'Bonafide student status & fee verification' },
    { key: 'OFFICER_VERIFIED', label: 'District Welfare Scrutiny', desc: 'ST certificate & income proof validation' },
    { key: 'STATE_SANCTIONED', label: 'State Sanction Order', desc: 'Sanction order issued for scholarship grant' },
    { key: 'PFMS_DISBURSED', label: 'PFMS DBT Disbursal', desc: 'Direct Benefit Transfer into Aadhaar-seeded bank account' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#ff6600] mx-auto"></div>
          <p className="mt-3 text-sm text-slate-500 font-medium">Tracking application progress across government gateways...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 text-center max-w-md">
          <p className="text-sm text-rose-600 font-semibold">Application not found</p>
          <Link to="/applications" className="mt-4 inline-block px-4 py-2 bg-[#0d3b66] text-white text-xs font-bold rounded">
            Back to Applications
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Top Breadcrumb & Actions */}
        <div className="flex items-center justify-between">
          <Link
            to="/applications"
            className="inline-flex items-center text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            ← Back to Applications List
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to={`/applications/${application.id}`}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
            >
              View Application Summary
            </Link>
            <button
              onClick={handleDownloadPdf}
              className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded hover:bg-emerald-100 flex items-center"
            >
              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </button>
            {application.status === 'SUBMITTED' && (
              <button
                onClick={() => setWithdrawModal(true)}
                className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-300 rounded hover:bg-rose-100"
              >
                Withdraw
              </button>
            )}
            {(application.status === 'WITHDRAWN' || application.status === 'REJECTED') && (
              <button
                onClick={handleReapply}
                disabled={actionLoading}
                className="px-3 py-1.5 text-xs font-bold text-white bg-[#ff6600] rounded hover:bg-[#e05a00]"
              >
                {actionLoading ? 'Creating Draft...' : 'Re-apply with Saved Data'}
              </button>
            )}
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className={`p-4 rounded-md text-sm font-medium border flex items-center justify-between ${
            notification.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-green-50 text-green-800 border-green-200'
          }`}>
            <span>{notification.msg}</span>
            <button onClick={() => setNotification(null)} className="text-xs font-bold ml-4">✕</button>
          </div>
        )}

        {/* Tracking Card Header */}
        <div className="bg-white border-t-4 border-[#ff6600] rounded-lg shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase">
                <span>Application Tracking</span>
                <span>•</span>
                <span className="text-[#ff6600]">AY {application.academic_year}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                {application.scheme?.scheme_name || application.scheme_id}
              </h1>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Tracking ID</span>
              <span className="font-mono text-base font-black text-[#0d3b66] bg-blue-50 px-3 py-1 rounded border border-blue-200 inline-block">
                {application.application_number}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Current Status</span>
              <strong className="text-blue-800 font-bold">{application.status}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Applicant</span>
              <strong className="text-slate-800">{application.application_data?.personal?.full_name || 'ST Student'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Submission Date</span>
              <strong className="text-slate-800">
                {application.submission_date ? new Date(application.submission_date).toLocaleString('en-IN') : 'N/A'}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block">Disbursal Target</span>
              <strong className="text-slate-800">NPCI Aadhaar Bridge</strong>
            </div>
          </div>
        </div>

        {/* Visual Lifecycle Stepper */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 space-y-6">
          <h2 className="text-base font-bold text-slate-900 border-b pb-2">
            Verification & Disbursal Progression
          </h2>

          <div className="relative pl-6 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {STAGES_FLOW.map((stage, idx) => {
              // Check if event exists in timeline
              const event = timeline.find(t => t.stage === stage.key);
              const isPast = !!event;
              const isCurrent = application.status === 'SUBMITTED' && stage.key === 'APPLICATION_SUBMITTED';

              return (
                <div key={stage.key} className="relative flex items-start space-x-4">
                  <div className={`absolute -left-6 mt-1 flex items-center justify-center w-6 h-6 rounded-full border-2 transition ${
                    isPast 
                      ? 'bg-emerald-500 border-emerald-600 text-white' 
                      : 'bg-white border-slate-300 text-slate-400'
                  }`}>
                    {isPast ? (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-[10px] font-bold">{idx + 1}</span>
                    )}
                  </div>

                  <div className="flex-1 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h3 className={`text-sm font-bold ${isPast ? 'text-slate-900' : 'text-slate-500'}`}>
                        {stage.label}
                      </h3>
                      {event && (
                        <span className="text-[11px] text-slate-400">
                          {new Date(event.created_at).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      {event ? event.description || stage.desc : stage.desc}
                    </p>
                    {event && (
                      <div className="mt-2 text-[10px] font-bold text-[#0d3b66] uppercase">
                        Actor: {event.actor_role} • Event ID: {event.id.slice(0, 8)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Withdrawal Modal */}
        {withdrawModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-rose-600">
                Withdraw Application
              </h3>
              <p className="text-xs text-slate-600">
                Are you sure you want to withdraw <strong>{application.application_number}</strong>?
              </p>
              <form onSubmit={handleWithdrawSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Reason for Withdrawal <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={withdrawReason}
                    onChange={(e) => setWithdrawReason(e.target.value)}
                    placeholder="e.g. Correcting bank IFSC or change of admission"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setWithdrawModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded shadow-sm disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Confirm Withdrawal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
