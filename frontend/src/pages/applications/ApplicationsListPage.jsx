import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import applicationService from '../../services/applicationService';
import { useAuth } from '../../context/AuthContext';

export default function ApplicationsListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [withdrawModal, setWithdrawModal] = useState({ isOpen: false, app: null, reason: '' });
  const [cloneModal, setCloneModal] = useState({ isOpen: false, app: null, targetSchemeId: '' });
  const [multiApplyModal, setMultiApplyModal] = useState(false);
  const [selectedSchemes, setSelectedSchemes] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [appsData, schemesData] = await Promise.all([
        applicationService.getApplications(),
        applicationService.getSchemes()
      ]);
      setApplications(appsData);
      setSchemes(schemesData);
    } catch (err) {
      console.error("Error loading applications:", err);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDownloadPdf = async (app) => {
    try {
      const blob = await applicationService.exportApplicationPdf(app.id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Application_${app.application_number}.txt`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      showNotification(`Downloaded official copy for ${app.application_number}`);
    } catch (err) {
      showNotification('Failed to download application copy.', 'error');
    }
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    if (!withdrawModal.reason.trim()) return;
    try {
      setActionLoading(true);
      await applicationService.withdrawApplication(withdrawModal.app.id, withdrawModal.reason);
      showNotification(`Application ${withdrawModal.app.application_number} withdrawn successfully.`);
      setWithdrawModal({ isOpen: false, app: null, reason: '' });
      loadData();
    } catch (err) {
      showNotification(err.response?.data?.detail || 'Withdrawal failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloneSubmit = async (e) => {
    e.preventDefault();
    if (!cloneModal.targetSchemeId) return;
    try {
      setActionLoading(true);
      const newApp = await applicationService.cloneApplication(cloneModal.app.id, cloneModal.targetSchemeId);
      showNotification(`Cloned into draft ${newApp.application_number}!`);
      setCloneModal({ isOpen: false, app: null, targetSchemeId: '' });
      loadData();
      navigate(`/applications/${newApp.id}`);
    } catch (err) {
      showNotification(err.response?.data?.detail || 'Cloning failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMultiApplySubmit = async (e) => {
    e.preventDefault();
    if (selectedSchemes.length === 0) return;
    try {
      setActionLoading(true);
      const defaultData = {
        personal: {
          full_name: user?.full_name || 'ST Applicant',
          category: 'Scheduled Tribe (ST)',
          annual_income: user?.student_profile?.annual_family_income || 180000
        },
        academic: {
          institution: 'State Tribal College of Technology',
          course: 'B.Tech / Degree Course',
          current_year: '2nd Year'
        },
        bank: {
          account: '************3456',
          ifsc: 'SBIN0001234',
          dbt_seeded: true
        }
      };
      const res = await applicationService.multiApply({
        scheme_ids: selectedSchemes,
        academic_year: '2026-2027',
        shared_application_data: defaultData
      });
      showNotification(res.message);
      setMultiApplyModal(false);
      setSelectedSchemes([]);
      loadData();
    } catch (err) {
      showNotification(err.response?.data?.detail || 'Multi-apply failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredApps = applications.filter(app => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'SUBMITTED') return app.status === 'SUBMITTED';
    if (activeTab === 'APPROVED') return app.status === 'APPROVED';
    if (activeTab === 'DRAFT') return app.status === 'DRAFT';
    if (activeTab === 'WITHDRAWN') return app.status === 'WITHDRAWN';
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUBMITTED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">Submitted</span>;
      case 'APPROVED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Approved</span>;
      case 'DRAFT':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">Draft (Unsubmitted)</span>;
      case 'WITHDRAWN':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">Withdrawn</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">Rejected</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Banner */}
        <div className="bg-white border-t-4 border-[#ff6600] rounded-lg shadow-sm p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#ff6600]">
              <span>Government of India</span>
              <span>•</span>
              <span>Ministry of Tribal Affairs</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              My Scholarship Applications
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Track real-time status, manage drafts, view timeline events, or submit new ST scholarship forms.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setMultiApplyModal(true)}
              className="inline-flex items-center px-4 py-2 border border-[#0d3b66] text-sm font-semibold rounded-md text-[#0d3b66] bg-white hover:bg-slate-50 transition shadow-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Batch Multi-Apply
            </button>
            <Link
              to="/applications/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-md shadow-sm text-white bg-[#ff6600] hover:bg-[#e05a00] transition"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Apply for Scheme
            </Link>
          </div>
        </div>

        {/* Notification Toast with slide-in */}
        {notification && (
          <div className={`p-4 rounded-md text-sm font-medium border flex items-center justify-between toast-slide-in ${
            notification.type === 'error'
              ? 'bg-red-50 text-red-800 border-red-200 toast-error'
              : 'bg-green-50 text-green-800 border-green-200 toast-success'
          }`}>
            <span>{notification.msg}</span>
            <button onClick={() => setNotification(null)} className="text-xs font-bold ml-4">✕</button>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-2 flex overflow-x-auto gap-2">
          {['ALL', 'SUBMITTED', 'APPROVED', 'DRAFT', 'WITHDRAWN'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-md whitespace-nowrap transition duration-150 ${
                activeTab === tab 
                  ? 'bg-[#0d3b66] text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab === 'ALL' ? 'All Applications' : tab.charAt(0) + tab.slice(1).toLowerCase()}
              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
                activeTab === tab ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {tab === 'ALL' ? applications.length : applications.filter(a => a.status === tab).length}
              </span>
            </button>
          ))}
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#ff6600] mx-auto"></div>
            <p className="mt-3 text-sm text-slate-500 font-medium">Fetching government portal records...</p>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-base font-bold text-slate-900">No applications found</h3>
            <p className="mt-1 text-sm text-slate-500">You currently have no applications matching this filter category.</p>
            <div className="mt-6">
              <Link
                to="/applications/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-semibold rounded-md text-white bg-[#ff6600] hover:bg-[#e05a00]"
              >
                Apply for First Scholarship
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredApps.map((app) => (
              <div 
                key={app.id} 
                className="bg-white rounded-lg shadow-sm border border-slate-200 hover:border-[#0066cc] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md animate-row-insert p-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-sm font-extrabold text-[#0d3b66] bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                      {app.application_number}
                    </span>
                    {getStatusBadge(app.status)}
                    <span className="text-xs text-slate-500 font-medium">
                      AY {app.academic_year}
                    </span>
                    {app.cloned_from_id && (
                      <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
                        Cloned Application
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">
                    {app.scheme?.scheme_name || app.scheme_id}
                  </h3>

                  <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                    <span>Submitted: {app.submission_date ? new Date(app.submission_date).toLocaleDateString('en-IN') : 'Not submitted'}</span>
                    <span>•</span>
                    <span>Last Updated: {new Date(app.updated_at).toLocaleDateString('en-IN')}</span>
                  </div>

                  {app.status === 'WITHDRAWN' && app.withdrawal_reason && (
                    <div className="text-xs text-rose-700 bg-rose-50 p-2 rounded border border-rose-200 mt-2">
                      <span className="font-semibold">Withdrawal Reason:</span> {app.withdrawal_reason}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/applications/${app.id}`}
                    className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition"
                  >
                    View Details
                  </Link>

                  <Link
                    to={`/applications/${app.id}/timeline`}
                    className="px-3 py-1.5 text-xs font-bold text-[#0d3b66] bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition flex items-center"
                  >
                    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Track Timeline
                  </Link>

                  <button
                    onClick={() => handleDownloadPdf(app)}
                    className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition flex items-center"
                    title="Download Official Government Copy"
                  >
                    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    PDF
                  </button>

                  <button
                    onClick={() => setCloneModal({ isOpen: true, app, targetSchemeId: '' })}
                    className="px-3 py-1.5 text-xs font-bold text-purple-800 bg-purple-50 hover:bg-purple-100 rounded border border-purple-200 transition"
                    title="Clone details to apply for another scheme"
                  >
                    Clone Form
                  </button>

                  {app.status === 'SUBMITTED' && (
                    <button
                      onClick={() => setWithdrawModal({ isOpen: true, app, reason: '' })}
                      className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 transition"
                    >
                      Withdraw
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Withdrawal Modal */}
        {withdrawModal.isOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center text-rose-600">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Withdraw Application
              </h3>
              <p className="text-xs text-slate-600">
                Are you sure you want to withdraw <strong>{withdrawModal.app?.application_number}</strong>? Once withdrawn, verification will stop immediately.
              </p>
              <form onSubmit={handleWithdrawSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Reason for Withdrawal <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={withdrawModal.reason}
                    onChange={(e) => setWithdrawModal({ ...withdrawModal, reason: e.target.value })}
                    placeholder="e.g. Need to update bank IFSC code or chose wrong course"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setWithdrawModal({ isOpen: false, app: null, reason: '' })}
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

        {/* Clone Application Modal */}
        {cloneModal.isOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
              <h3 className="text-lg font-bold text-slate-900">
                Clone Application Details
              </h3>
              <p className="text-xs text-slate-600">
                Copy all your personal, academic, and bank details from <strong>{cloneModal.app?.application_number}</strong> into a new scheme draft without retyping.
              </p>
              <form onSubmit={handleCloneSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Select Target Scheme <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={cloneModal.targetSchemeId}
                    onChange={(e) => setCloneModal({ ...cloneModal, targetSchemeId: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded focus:ring-1 focus:ring-[#0d3b66]"
                  >
                    <option value="">-- Choose a scheme --</option>
                    {schemes.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.scheme_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCloneModal({ isOpen: false, app: null, targetSchemeId: '' })}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 text-xs font-bold text-white bg-[#0d3b66] hover:bg-[#08233d] rounded shadow-sm disabled:opacity-50"
                  >
                    {actionLoading ? 'Cloning...' : 'Create Cloned Draft'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Multi-Apply Modal */}
        {multiApplyModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl space-y-4">
              <div className="border-b pb-3">
                <h3 className="text-lg font-bold text-slate-900">
                  Batch Multi-Scheme Application
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Apply simultaneously to multiple eligible Ministry of Tribal Affairs schemes using your verified student profile.
                </p>
              </div>

              <form onSubmit={handleMultiApplySubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Select Schemes to Apply ({selectedSchemes.length} chosen)
                  </label>
                  <div className="max-h-56 overflow-y-auto space-y-2 border border-slate-200 rounded p-2">
                    {schemes.map(s => {
                      const isSelected = selectedSchemes.includes(s.id);
                      return (
                        <label 
                          key={s.id} 
                          className={`flex items-start p-2.5 rounded cursor-pointer border text-xs transition ${
                            isSelected ? 'bg-blue-50 border-[#0d3b66]' : 'hover:bg-slate-50 border-slate-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5 mr-2.5 text-[#0d3b66] focus:ring-0 rounded"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSchemes([...selectedSchemes, s.id]);
                              } else {
                                setSelectedSchemes(selectedSchemes.filter(id => id !== s.id));
                              }
                            }}
                          />
                          <div>
                            <div className="font-bold text-slate-900">{s.scheme_name}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{s.financial_assistance_details}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-amber-50 p-3 rounded border border-amber-200 text-xs text-amber-900">
                  <strong>Note:</strong> Pre-filled information from your verified student profile will be securely attached to each application.
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { setMultiApplyModal(false); setSelectedSchemes([]); }}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading || selectedSchemes.length === 0}
                    className="px-4 py-2 text-xs font-bold text-white bg-[#ff6600] hover:bg-[#e05a00] rounded shadow-sm disabled:opacity-50"
                  >
                    {actionLoading ? 'Submitting...' : `Submit ${selectedSchemes.length} Applications`}
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
