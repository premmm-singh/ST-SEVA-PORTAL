import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  ArrowRight,
  RefreshCw,
  Building,
  UserCheck,
  MapPin,
  Award,
  ArrowUpDown
} from 'lucide-react';
import scrutinyService from '../../services/scrutinyService';

export default function OfficerScrutinyDashboardPage() {
  const navigate = useNavigate();
  const [sortConfig, setSortConfig] = useState({ key: 'student_name', direction: 'asc' });
  const [stats, setStats] = useState({
    pending_l1_count: 0,
    pending_l2_count: 0,
    pending_l3_count: 0,
    sanctioned_count: 0,
    deficient_count: 0,
    rejected_count: 0,
    red_risk_count: 0,
    total_count: 0
  });
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [districtFilter, setDistrictFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, appsData] = await Promise.all([
        scrutinyService.getDashboardStats().catch(() => ({
          pending_l1_count: 0, pending_l2_count: 0, pending_l3_count: 0, sanctioned_count: 0,
          deficient_count: 0, rejected_count: 0, red_risk_count: 0, total_count: 0
        })),
        scrutinyService.getApplications({
          stage: stageFilter !== 'ALL' ? stageFilter : undefined,
          risk_level: riskFilter !== 'ALL' ? riskFilter : undefined,
          district: districtFilter || undefined
        }).catch(() => [])
      ]);
      setStats(statsData);
      setApplications(appsData);
    } catch (err) {
      console.error('Failed to load scrutiny queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [stageFilter, riskFilter, districtFilter]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredApps = applications
    .filter((app) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        app.student_name?.toLowerCase().includes(q) ||
        app.application_number?.toLowerCase().includes(q) ||
        app.institution_name?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      let valA = a[sortConfig.key] || '';
      let valB = b[sortConfig.key] || '';
      if (typeof valA === 'string') {
        const cmp = valA.localeCompare(valB);
        return sortConfig.direction === 'asc' ? cmp : -cmp;
      }
      return sortConfig.direction === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Welfare Directorate Header Banner */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 rounded-2xl shadow-xl text-white p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-xs font-bold tracking-wide uppercase flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  District Welfare Office • Tier-2 Scrutiny Engine
                </span>
                <span className="px-3 py-1 bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-semibold">
                  Multi-Level Workflow Active
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Scholarship Scrutiny & Sanction Portal
              </h1>
              <p className="text-sm text-slate-300 flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-400" />
                <span>Department of Scheduled Tribe, SC, Minority & Backward Class Welfare</span>
                <span className="text-slate-500">•</span>
                <span>Government of Jharkhand</span>
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-lg text-white shadow-inner">
                DWO
              </div>
              <div>
                <p className="text-xs text-blue-200 uppercase font-semibold">Authorized Scrutiny Level</p>
                <p className="font-bold text-sm text-white">L1 / L2 District Welfare Officer</p>
                <p className="text-xs text-slate-300">Collectorate Ranchi & ITDA Blocks</p>
              </div>
            </div>
          </div>
        </div>

        {/* 4 KPI Counter Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pending L1 / L2 Scrutiny */}
          <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-amber-500 border-y border-r border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Scrutiny</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  {stats.pending_l1_count + stats.pending_l2_count}
                </h3>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <p className="text-[11px] text-amber-700 font-semibold mt-3">
              L1: {stats.pending_l1_count} • L2 (DWO): {stats.pending_l2_count}
            </p>
          </div>

          {/* High Risk Alerts */}
          <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-red-600 border-y border-r border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Red Risk Flags</p>
                <h3 className="text-2xl font-black text-red-600 mt-1">{stats.red_risk_count}</h3>
              </div>
              <div className="p-3 bg-red-50 rounded-xl text-red-600">
                <ShieldAlert className="w-6 h-6" />
              </div>
            </div>
            <p className="text-[11px] text-red-700 font-semibold mt-3">Duplicate or Expired Certificate Collisions</p>
          </div>

          {/* Sanctioned / DWO Approved */}
          <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-emerald-600 border-y border-r border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Approved & Sanctioned</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  {stats.pending_l3_count + stats.sanctioned_count}
                </h3>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
            <p className="text-[11px] text-emerald-700 font-semibold mt-3">Ready for PFMS / DBT Disbursement</p>
          </div>

          {/* Total Handled */}
          <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-blue-600 border-y border-r border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Applications</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.total_count}</h3>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                <Award className="w-6 h-6" />
              </div>
            </div>
            <p className="text-[11px] text-blue-700 font-semibold mt-3">AY 2026-2027 Tribal Cohort</p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search applicant name, application ID, or college..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>

            {/* Risk Filters */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Risk Level:</span>
              {['ALL', 'RED', 'AMBER', 'GREEN'].map((rl) => (
                <button
                  key={rl}
                  onClick={() => setRiskFilter(rl)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                    riskFilter === rl
                      ? rl === 'RED'
                        ? 'bg-red-600 text-white shadow-sm'
                        : rl === 'AMBER'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : rl === 'GREEN'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-blue-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {rl}
                </button>
              ))}
            </div>

            {/* Refresh */}
            <button
              onClick={loadData}
              className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 self-end md:self-auto"
              title="Refresh Queue"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Scrutiny Stage Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto pt-2 border-t border-slate-200">
            {[
              { key: 'ALL', label: 'All Queue' },
              { key: 'INSTITUTION_VERIFIED', label: 'Pending L1 Scrutiny' },
              { key: 'UNDER_SCRUTINY', label: 'Pending L2 (DWO)' },
              { key: 'DWO_APPROVED', label: 'Approved (Pending L3)' },
              { key: 'SANCTIONED', label: 'Sanctioned' },
              { key: 'DEFICIENT', label: 'Deficient' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStageFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  stageFilter === tab.key
                    ? 'bg-blue-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrutiny Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <tr>
                  <th
                    className="py-3.5 px-4 cursor-pointer select-none group hover:bg-slate-200 transition-colors duration-150"
                    onClick={() => handleSort('student_name')}
                    title="Click to sort by applicant name"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Applicant & ID</span>
                      <ArrowUpDown className={`w-3.5 h-3.5 transition-transform duration-200 text-slate-400 group-hover:text-slate-700 ${
                        sortConfig.key === 'student_name'
                          ? (sortConfig.direction === 'desc' ? 'rotate-180 text-blue-600' : 'text-blue-600')
                          : ''
                      }`} />
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Institution & District</th>
                  <th
                    className="py-3.5 px-4 cursor-pointer select-none group hover:bg-slate-200 transition-colors duration-150"
                    onClick={() => handleSort('annual_family_income')}
                    title="Click to sort by annual family income"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Family Income</span>
                      <ArrowUpDown className={`w-3.5 h-3.5 transition-transform duration-200 text-slate-400 group-hover:text-slate-700 ${
                        sortConfig.key === 'annual_family_income'
                          ? (sortConfig.direction === 'desc' ? 'rotate-180 text-blue-600' : 'text-blue-600')
                          : ''
                      }`} />
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Risk Tag</th>
                  <th className="py-3.5 px-4">Current Scrutiny Stage</th>
                  <th className="py-3.5 px-4 text-right">Dossier Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      Loading scrutiny queue...
                    </td>
                  </tr>
                ) : filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No applications found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredApps.map((app) => (
                    <tr key={app.id} className="gov-table-row animate-row-insert">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{app.student_name}</div>
                        <div className="text-xs text-slate-500 font-mono">{app.application_number}</div>
                        <div className="text-xs text-blue-700 font-medium mt-0.5">{app.scheme_name}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{app.institution_name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{app.district}, {app.state}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-sm font-semibold text-slate-800">
                          ₹{app.annual_family_income?.toLocaleString('en-IN') || '1,20,000'}
                        </div>
                        <div className="text-[11px] text-emerald-700 font-medium">Under ₹2.5L Cap</div>
                      </td>

                      <td className="py-3.5 px-4">
                        {app.risk_level === 'RED' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                            <ShieldAlert className="w-3.5 h-3.5 mr-1 text-red-600" />
                            RED RISK
                          </span>
                        ) : app.risk_level === 'AMBER' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" />
                            AMBER RISK
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                            CLEAN (GREEN)
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {app.status === 'SANCTIONED' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            Sanction Order Issued
                          </span>
                        ) : app.status === 'DWO_APPROVED' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900">
                            DWO Approved (L2)
                          </span>
                        ) : app.status === 'UNDER_SCRUTINY' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-900">
                            L1 Scrutiny Done
                          </span>
                        ) : app.status === 'DEFICIENT' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
                            Deficient
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                            Pending Initial Scrutiny
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/officer/scrutiny/${app.id}`}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-950 hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm transition-all active:scale-95"
                        >
                          <span>Review Dossier</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
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
  );
}
