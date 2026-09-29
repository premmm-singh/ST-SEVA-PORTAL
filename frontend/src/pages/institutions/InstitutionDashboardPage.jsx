import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Users,
  Search,
  Filter,
  ShieldCheck,
  ArrowRight,
  FileSpreadsheet,
  HelpCircle,
  RefreshCw,
  CheckSquare,
  Square
} from 'lucide-react';
import institutionService from '../../services/institutionService';
import BulkVerifyModal from '../../components/institutions/BulkVerifyModal';

export default function InstitutionDashboardPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    pending_count: 0,
    verified_count: 0,
    defective_count: 0,
    rejected_count: 0,
    total_count: 0
  });
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [profileData, statsData, appsData] = await Promise.all([
        institutionService.getInstitutionProfile().catch(() => null),
        institutionService.getDashboardStats().catch(() => ({
          pending_count: 0, verified_count: 0, defective_count: 0, rejected_count: 0, total_count: 0
        })),
        institutionService.getApplications({ status: statusFilter !== 'ALL' ? statusFilter : undefined }).catch(() => [])
      ]);

      if (profileData) setProfile(profileData);
      setStats(statsData);
      setApplications(appsData);
    } catch (err) {
      console.error('Error loading institution dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleSelectAll = () => {
    if (selectedIds.length === applications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(applications.map((a) => a.id));
    }
  };

  const toggleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkVerifyConfirm = async (remarks) => {
    setIsBulkProcessing(true);
    try {
      const res = await institutionService.bulkVerifyApplications({
        application_ids: selectedIds,
        remarks
      });
      setToastMessage(`Successfully verified and sealed ${res.successful_count} application(s).`);
      setIsBulkModalOpen(false);
      setSelectedIds([]);
      await loadData();
    } catch (err) {
      alert('Bulk verification failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const filteredApps = applications.filter((app) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      app.student_name?.toLowerCase().includes(q) ||
      app.application_number?.toLowerCase().includes(q) ||
      app.roll_number?.toLowerCase().includes(q) ||
      app.course_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Toast Alert */}
        {toastMessage && (
          <div className="p-4 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in">
            <div className="flex items-center space-x-2 text-sm font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
              <span>{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage('')}
              className="text-emerald-700 hover:text-emerald-900 text-sm font-bold ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Institutional Accreditation Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl shadow-xl text-white p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-xs font-bold tracking-wide uppercase flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  AISHE Code: {profile?.aishe_code || 'C-44281'}
                </span>
                <span className="px-3 py-1 bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-semibold">
                  Accredited Institution Tier-1
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {profile?.institution_name || 'Birsa Institute of Technology (BIT) Sindri'}
              </h1>
              <p className="text-sm text-slate-300 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span>Affiliated: {profile?.affiliated_university || 'Jharkhand University of Technology, Ranchi'}</span>
                <span className="text-slate-500">•</span>
                <span>{profile?.district || 'Dhanbad'}, {profile?.state || 'Jharkhand'}</span>
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-bold text-lg text-white shadow-inner">
                {profile?.nodal_officer_name?.charAt(0) || 'P'}
              </div>
              <div>
                <p className="text-xs text-blue-200 uppercase font-semibold">Nodal Officer (INO)</p>
                <p className="font-bold text-sm text-white">{profile?.nodal_officer_name || 'Prof. Rajeshwar Soren'}</p>
                <p className="text-xs text-slate-300">{profile?.official_email || 'ino.bitsindri@stseva.gov.in'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Counter Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pending */}
          <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-amber-500 border-y border-r border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Verification</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.pending_count}</h3>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <p className="text-[11px] text-amber-700 font-semibold mt-3">Action required by Nodal Officer</p>
          </div>

          {/* Verified */}
          <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-emerald-500 border-y border-r border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Verified & Stamped</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.verified_count}</h3>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
            <p className="text-[11px] text-emerald-700 font-semibold mt-3">Forwarded to DWO Scrutiny</p>
          </div>

          {/* Defective */}
          <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-orange-500 border-y border-r border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Defective / Returned</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.defective_count}</h3>
              </div>
              <div className="p-3 bg-orange-50 rounded-xl text-orange-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
            <p className="text-[11px] text-orange-700 font-semibold mt-3">Awaiting Student Correction</p>
          </div>

          {/* Total ST Beneficiaries */}
          <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-blue-600 border-y border-r border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total ST Applicants</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.total_count}</h3>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <p className="text-[11px] text-blue-700 font-semibold mt-3">AY 2026-2027 Cohort</p>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name, roll number, or application ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>

          {/* Status Filters */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
            {['ALL', 'SUBMITTED', 'INSTITUTION_VERIFIED', 'DEFICIENT', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-blue-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {st === 'ALL' ? 'All Applications' : st.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <Link
              to="/institution/grievances"
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 flex items-center space-x-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Grievances</span>
            </Link>
            <button
              onClick={loadData}
              className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300"
              title="Refresh Roster"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bulk Action Sticky Bar */}
        {selectedIds.length > 0 && (
          <div className="p-4 bg-emerald-900 text-white rounded-xl shadow-lg flex items-center justify-between animate-in slide-in-from-top-2">
            <div className="flex items-center space-x-3">
              <CheckSquare className="w-5 h-5 text-emerald-300" />
              <span className="font-bold text-sm">
                {selectedIds.length} candidate(s) selected for batch verification
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSelectedIds([])}
                className="px-3 py-1 text-xs font-semibold text-emerald-200 hover:text-white"
              >
                Deselect All
              </button>
              <button
                onClick={() => setIsBulkModalOpen(true)}
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Bulk Verify & Apply Seal</span>
              </button>
            </div>
          </div>
        )}

        {/* Student Verification Roster Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-10">
                    <button onClick={handleSelectAll} className="text-slate-600 hover:text-slate-900">
                      {selectedIds.length > 0 && selectedIds.length === applications.length ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4">Applicant & Scheme</th>
                  <th className="py-3.5 px-4">Enrollment Details</th>
                  <th className="py-3.5 px-4">Income Status</th>
                  <th className="py-3.5 px-4">Current Status</th>
                  <th className="py-3.5 px-4 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      Loading verification roster...
                    </td>
                  </tr>
                ) : filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No student applications found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredApps.map((app) => {
                    const isSelected = selectedIds.includes(app.id);
                    return (
                      <tr
                        key={app.id}
                        className={`hover:bg-slate-50 transition-colors ${
                          isSelected ? 'bg-blue-50/60' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => toggleSelectOne(app.id)}
                            className="text-slate-600 hover:text-slate-900"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{app.student_name}</div>
                          <div className="text-xs text-slate-500 font-mono">{app.application_number}</div>
                          <div className="text-xs text-blue-700 font-medium mt-0.5">{app.scheme_name}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-800">{app.course_name}</div>
                          <div className="text-xs text-slate-500">
                            Year: <span className="font-semibold text-slate-700">{app.year_of_study}</span> • Roll:{' '}
                            <span className="font-mono text-slate-700">{app.roll_number}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-sm font-semibold text-slate-800">
                            ₹{app.annual_family_income?.toLocaleString('en-IN') || '1,20,000'}
                          </div>
                          <div className="text-xs text-emerald-700 font-medium">Eligible ST Bracket</div>
                        </td>

                        <td className="py-3.5 px-4">
                          {app.status === 'INSTITUTION_VERIFIED' || app.status === 'UNDER_SCRUTINY' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Institute Verified
                            </span>
                          ) : app.status === 'DEFICIENT' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
                              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                              Defective (Returned)
                            </span>
                          ) : app.status === 'REJECTED' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              Rejected
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                              <Clock className="w-3.5 h-3.5 mr-1" />
                              Pending Verification
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <Link
                            to={`/institution/verify/${app.id}`}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm transition-all active:scale-95"
                          >
                            <span>Verify Dossier</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Bulk Verify Modal */}
      <BulkVerifyModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        selectedCount={selectedIds.length}
        onConfirm={handleBulkVerifyConfirm}
        isProcessing={isBulkProcessing}
      />
    </div>
  );
}
