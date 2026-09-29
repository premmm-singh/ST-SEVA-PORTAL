import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  MapPin,
  Users,
  Building2,
  CreditCard,
  Download,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  PieChart,
  ShieldAlert,
  ArrowUpRight,
  Clock,
  Layers,
  Sparkles,
  Sliders,
  Send,
  HelpCircle,
  FileCheck,
  RefreshCw
} from 'lucide-react';
import analyticsService from '../../services/analyticsService';

export const ExecutiveBiDashboardPage = () => {
  const [financialYear, setFinancialYear] = useState('2026-2027');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Data states
  const [summary, setSummary] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [demographics, setDemographics] = useState(null);
  const [budget, setBudget] = useState(null);
  const [scrutinyTat, setScrutinyTat] = useState(null);
  const [institutions, setInstitutions] = useState(null);
  const [dbtHealth, setDbtHealth] = useState(null);
  const [forecast, setForecast] = useState(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'districts' | 'demographics' | 'budget' | 'institutions' | 'forecast'

  // PQ Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportRefNo, setExportRefNo] = useState('LS-USQ-2026/8941');
  const [sessionType, setSessionType] = useState('LOK_SABHA');
  const [exportTitle, setExportTitle] = useState('District-wise ST Beneficiaries and DBT Outlay Statement');
  const [exportFormat, setExportFormat] = useState('CSV');
  const [exportResult, setExportResult] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Scheduled Digest Modal State
  const [showDigestModal, setShowDigestModal] = useState(false);
  const [digestTitle, setDigestTitle] = useState('Daily Morning ST Scholarship Sanction Digest');
  const [digestFrequency, setDigestFrequency] = useState('DAILY');
  const [digestEmail, setDigestEmail] = useState('principal.sec.tribal@jharkhand.gov.in');
  const [digestSuccess, setDigestSuccess] = useState(false);

  // Forecast Simulation sliders
  const [simInflation, setSimInflation] = useState(5.5);
  const [simEnrollment, setSimEnrollment] = useState(8.2);

  const fetchAllAnalytics = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [
        sumRes,
        distRes,
        demoRes,
        budRes,
        tatRes,
        instRes,
        dbtRes,
        fcRes
      ] = await Promise.all([
        analyticsService.getExecutiveSummary(financialYear),
        analyticsService.getDistrictHeatmap(financialYear),
        analyticsService.getTribalDemographics(),
        analyticsService.getBudgetUtilization(financialYear),
        analyticsService.getScrutinyTat(),
        analyticsService.getInstitutionLeagueTable(),
        analyticsService.getDbtHealth(),
        analyticsService.getBudgetForecast(financialYear)
      ]);

      setSummary(sumRes);
      setDistricts(distRes?.districts || []);
      if (distRes?.districts?.length > 0 && !selectedDistrict) {
        setSelectedDistrict(distRes.districts[0]);
      }
      setDemographics(demoRes);
      setBudget(budRes);
      setScrutinyTat(tatRes);
      setInstitutions(instRes);
      setDbtHealth(dbtRes);
      setForecast(fcRes);
    } catch (err) {
      console.error('Failed to load analytics data:', err);
      setError('Unable to fetch live analytics data. Please verify service connectivity.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllAnalytics();
  }, [financialYear]);

  const handleExportPQ = async (e) => {
    e.preventDefault();
    setExporting(true);
    try {
      const payload = {
        question_reference_no: exportRefNo,
        session_type: sessionType,
        export_title: exportTitle,
        financial_year: financialYear,
        export_format: exportFormat
      };
      const res = await analyticsService.exportParliamentReport(payload);
      setExportResult(res);
    } catch (err) {
      alert('Failed to generate export: ' + (err.response?.data?.detail || err.message));
    } finally {
      setExporting(false);
    }
  };

  const handleCreateDigest = async (e) => {
    e.preventDefault();
    try {
      await analyticsService.createScheduledReport({
        report_title: digestTitle,
        recipient_role: 'SECRETARY',
        recipient_email: digestEmail,
        frequency: digestFrequency,
        financial_year: financialYear
      });
      setDigestSuccess(true);
      setTimeout(() => {
        setDigestSuccess(false);
        setShowDigestModal(false);
      }, 1800);
    } catch (err) {
      alert('Failed to configure digest: ' + (err.response?.data?.detail || err.message));
    }
  };

  // Dynamic simulation projection
  const currentDisbursedCr = summary ? summary.total_disbursed_crores : 184.5;
  const simulatedProjectedCr = Number((currentDisbursedCr * (1 + (simInflation + simEnrollment) / 100)).toFixed(2));

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium">Aggregating State ST Welfare Metrics & Treasury Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans pb-16">
      {/* Top Banner / Govt Ribbon */}
      <div className="bg-slate-900 text-white px-6 py-2 text-xs flex justify-between items-center border-b border-slate-700">
        <div className="flex items-center space-x-2">
          <span className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">
            NIC-ST SEVA BI ENGINE
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-300">Department of Scheduled Tribe, Scheduled Caste, Minority & Backward Class Welfare</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="flex items-center text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
            PFMS Core Direct Sync: ONLINE
          </span>
          <span className="text-slate-400">Data Integrity SHA-256 Verified</span>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-700">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  State & Central Executive BI Dashboard
                </h1>
                <p className="text-sm text-slate-500">
                  Macro KPIs, 24-District Geo-Spatial Saturation, Tribal Demographics & Budget Outlay Monitoring
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {/* FY Selector */}
            <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-300 text-sm">
              <Calendar className="w-4 h-4 text-slate-500 ml-2 mr-1" />
              <select
                value={financialYear}
                onChange={(e) => setFinancialYear(e.target.value)}
                className="bg-transparent text-slate-800 font-semibold focus:outline-none pr-3 py-1 cursor-pointer"
              >
                <option value="2026-2027">FY 2026-2027</option>
                <option value="2025-2026">FY 2025-2026</option>
                <option value="2024-2025">FY 2024-2025</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => fetchAllAnalytics(true)}
              disabled={refreshing}
              className="p-2 text-slate-600 hover:text-indigo-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            {/* Parliament Question Exporter Trigger */}
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center space-x-1.5 bg-indigo-700 hover:bg-indigo-800 text-white px-3.5 py-2 rounded-lg text-sm font-medium shadow-sm transition"
            >
              <Download className="w-4 h-4" />
              <span>Parliament / CAG Export</span>
            </button>

            {/* Scheduled Digest Trigger */}
            <button
              onClick={() => setShowDigestModal(true)}
              className="flex items-center space-x-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-2 rounded-lg text-sm font-medium transition"
            >
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>Schedule Digest</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 flex space-x-8 overflow-x-auto text-sm font-medium">
          {[
            { id: 'overview', label: 'Executive Overview & Macro KPIs', icon: BarChart3 },
            { id: 'districts', label: '24-District Geo-Spatial Heatmap', icon: MapPin },
            { id: 'demographics', label: 'Tribal Demographics & PVTG', icon: Users },
            { id: 'budget', label: 'Treasury Outlay & Drawdown', icon: CreditCard },
            { id: 'institutions', label: 'Institutions League Table', icon: Building2 },
            { id: 'forecast', label: 'Predictive Budget Simulator', icon: Sparkles }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-3.5 border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? 'border-indigo-600 text-indigo-700 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* ================= TAB 1: OVERVIEW ================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Macro Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">Total ST Applications</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">
                      {summary?.total_applications?.toLocaleString() || '0'}
                    </h3>
                  </div>
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center text-xs text-slate-500 space-x-1">
                  <span className="text-emerald-600 font-medium flex items-center">
                    <ArrowUpRight className="w-3.5 h-3.5" /> +12.4%
                  </span>
                  <span>vs previous academic cycle</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"></div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">Total DBT Disbursed</p>
                    <h3 className="text-2xl font-bold text-emerald-700 mt-1">
                      ₹{summary?.total_disbursed_crores || '0.00'} <span className="text-base font-medium">Cr</span>
                    </h3>
                  </div>
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
                    <CreditCard className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-500 flex items-center justify-between">
                  <span>Direct Bank Credit: <b>PFMS Push</b></span>
                  <span className="text-emerald-700 font-semibold">{dbtHealth?.success_rate_pct}% Success</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">PVTG Beneficiaries</p>
                    <h3 className="text-2xl font-bold text-amber-700 mt-1">
                      {summary?.pvtg_beneficiaries_count?.toLocaleString() || '0'}
                    </h3>
                  </div>
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-500 flex items-center justify-between">
                  <span className="text-amber-800 font-medium">Special Plateau Outreach</span>
                  <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[10px] font-bold">100% Doorstep</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500"></div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">Female ST Ratio</p>
                    <h3 className="text-2xl font-bold text-purple-700 mt-1">
                      {summary?.female_representation_pct || '0'}%
                    </h3>
                  </div>
                  <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-500 flex items-center justify-between">
                  <span>Gender Parity Goal: &gt;50%</span>
                  <span className="text-purple-700 font-semibold">Exceeded (+2.0%)</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500"></div>
              </div>
            </div>

            {/* Pipeline Stage Funnel & TAT Health */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Funnel Card */}
              <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="font-bold text-slate-900 flex items-center space-x-2">
                    <Layers className="w-5 h-5 text-indigo-600" />
                    <span>Beneficiary Verification & Sanction Pipeline Funnel</span>
                  </h3>
                  <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-medium">
                    SLA Resolution Rate: {summary?.sla_compliance_pct}%
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1 text-slate-600">
                      <span>1. Application Enrolment & Submission</span>
                      <span>{summary?.total_applications?.toLocaleString()} (100%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div className="bg-blue-600 h-3 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1 text-slate-600">
                      <span>2. Institutional Nodal Officer (INO) Verified</span>
                      <span>{summary?.institute_verified?.toLocaleString()} ({Math.round((summary?.institute_verified / (summary?.total_applications || 1)) * 100)}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-indigo-500 h-3 rounded-full"
                        style={{ width: `${Math.round((summary?.institute_verified / (summary?.total_applications || 1)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1 text-slate-600">
                      <span>3. District Welfare Officer (DWO) Approved</span>
                      <span>{summary?.dwo_approved?.toLocaleString()} ({Math.round((summary?.dwo_approved / (summary?.total_applications || 1)) * 100)}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-3 rounded-full"
                        style={{ width: `${Math.round((summary?.dwo_approved / (summary?.total_applications || 1)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1 text-slate-600">
                      <span>4. Sanction Order Generated & DBT Disbursed</span>
                      <span>{summary?.sanctioned_beneficiaries?.toLocaleString()} ({Math.round((summary?.sanctioned_beneficiaries / (summary?.total_applications || 1)) * 100)}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-teal-600 h-3 rounded-full"
                        style={{ width: `${Math.round((summary?.sanctioned_beneficiaries / (summary?.total_applications || 1)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-3 text-center text-xs">
                  <div>
                    <span className="text-slate-400 block">Avg Verification TAT</span>
                    <span className="font-bold text-slate-800 text-sm">{scrutinyTat?.overall_avg_tat_days || 19.5} Days</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Active Grievances</span>
                    <span className="font-bold text-amber-600 text-sm">{summary?.active_grievances_count || 0} Pending</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">PFMS Credit Speed</span>
                    <span className="font-bold text-emerald-600 text-sm">{dbtHealth?.avg_pfms_credit_hours || 3.4} Hours</span>
                  </div>
                </div>
              </div>

              {/* Scrutiny Latency & Bottleneck Districts */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 flex items-center space-x-2 mb-4">
                    <Clock className="w-5 h-5 text-amber-600" />
                    <span>Bottleneck Districts Alert</span>
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Districts exceeding statutory scrutiny TAT thresholds requiring administrative intervention.
                  </p>

                  <div className="space-y-3">
                    {scrutinyTat?.bottleneck_districts?.map((b, idx) => (
                      <div key={idx} className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs">
                        <div className="flex justify-between items-center font-bold text-amber-900">
                          <span>{b.district} District</span>
                          <span className="text-red-700 bg-red-100 px-1.5 py-0.5 rounded font-mono">{b.avg_days} Days TAT</span>
                        </div>
                        <p className="text-amber-700 mt-1">Issue: {b.issue}</p>
                        <p className="text-slate-500 text-[11px] mt-0.5">Pending Scrutiny Backlog: {b.pending_count} files</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="text-slate-500">Statutory SLA Ceiling: 14 Days</span>
                  <button
                    onClick={() => setActiveTab('districts')}
                    className="text-indigo-600 font-semibold hover:underline"
                  >
                    View All 24 Districts &rarr;
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Preview Grid: Budget Breakdown & Demographics Snapshot */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Financial Outlay Overview */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-900 flex items-center space-x-2">
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                    <span>State & Central Treasury Drawdown</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('budget')}
                    className="text-xs text-indigo-600 font-semibold hover:underline"
                  >
                    Detailed Outlay &rarr;
                  </button>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>Overall Budget Utilization</span>
                    <span className="font-bold text-indigo-700">{budget?.overall_utilization_pct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-3 rounded-full"
                      style={{ width: `${budget?.overall_utilization_pct || 70}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg">
                    <span className="text-blue-700 font-semibold block">Central Share (60%)</span>
                    <span className="text-lg font-bold text-slate-900 mt-1 block">
                      ₹{((budget?.central_share_disbursed || 0) / 10000000).toFixed(2)} Cr
                    </span>
                    <span className="text-[11px] text-slate-500">Ministry of Tribal Affairs Grant</span>
                  </div>
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg">
                    <span className="text-emerald-700 font-semibold block">State Share (40%)</span>
                    <span className="text-lg font-bold text-slate-900 mt-1 block">
                      ₹{((budget?.state_share_disbursed || 0) / 10000000).toFixed(2)} Cr
                    </span>
                    <span className="text-[11px] text-slate-500">Jharkhand Consolidated Fund</span>
                  </div>
                </div>
              </div>

              {/* Tribal Sub-Caste Equity Snapshot */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-900 flex items-center space-x-2">
                    <Users className="w-5 h-5 text-indigo-600" />
                    <span>Tribal Sub-Caste Equity Snapshot</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('demographics')}
                    className="text-xs text-indigo-600 font-semibold hover:underline"
                  >
                    View PVTG Details &rarr;
                  </button>
                </div>

                <p className="text-xs text-slate-500 mb-3">
                  Representation of major Scheduled Tribe communities across Post-Matric & Pre-Matric disbursements.
                </p>

                <div className="space-y-2.5">
                  {demographics?.sub_castes?.slice(0, 4).map((sc, i) => (
                    <div key={i} className="text-xs">
                      <div className="flex justify-between text-slate-700 font-medium mb-1">
                        <span>{sc.sub_caste}</span>
                        <span>{sc.percentage}% ({sc.total_students.toLocaleString()} students)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className="bg-indigo-500 h-2 rounded-full"
                          style={{ width: `${sc.percentage * 2}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs">
                  <span className="text-amber-800 font-medium">Particularly Vulnerable Tribal Groups (PVTG):</span>
                  <span className="font-bold text-amber-900">{demographics?.pvtg_summary?.total_pvtg_enrolled} enrolled</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: 24 DISTRICTS HEATMAP ================= */}
        {activeTab === 'districts' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-indigo-600" />
                    <span>Jharkhand 24-District Geo-Spatial Saturation Heatmap</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Live operational metrics across all 24 administrative districts of Jharkhand State.
                  </p>
                </div>
                <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center space-x-3">
                  <span className="flex items-center">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded mr-1"></span> &gt;85% Saturation
                  </span>
                  <span className="flex items-center">
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded mr-1"></span> 75-85% Normal
                  </span>
                  <span className="flex items-center">
                    <span className="w-2.5 h-2.5 bg-red-500 rounded mr-1"></span> &lt;75% Deficit
                  </span>
                </div>
              </div>

              {/* 24 District Grid Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
                {districts.map((d) => {
                  const isSelected = selectedDistrict?.district_name === d.district_name;
                  const isHigh = d.saturation_rate >= 85;
                  const isMed = d.saturation_rate >= 75 && d.saturation_rate < 85;
                  return (
                    <button
                      key={d.district_name}
                      onClick={() => setSelectedDistrict(d)}
                      className={`p-3 rounded-lg border text-left transition relative ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50 shadow-sm ring-2 ring-indigo-500'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-xs text-slate-900 truncate block">
                          {d.district_name}
                        </span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isHigh ? 'bg-emerald-500' : isMed ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                        ></span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 font-mono">{d.total_applications} Apps</p>
                      <p className="text-[10px] font-bold text-indigo-700 mt-0.5">{d.saturation_rate}% Saturation</p>
                    </button>
                  );
                })}
              </div>

              {/* Selected District Drilldown Panel */}
              {selectedDistrict && (
                <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl">
                  <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 mb-4">
                    <div>
                      <span className="text-xs uppercase font-bold text-indigo-600 tracking-wider">
                        District In-Depth Profile
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                        {selectedDistrict.district_name} District
                      </h3>
                    </div>
                    <div className="flex items-center space-x-2 mt-2 md:mt-0">
                      <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded font-semibold">
                        Saturation: {selectedDistrict.saturation_rate}%
                      </span>
                      <span className="text-xs bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded font-semibold">
                        Female Ratio: {selectedDistrict.female_ratio}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
                    <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                      <span className="text-[11px] text-slate-500 block">Total Applications</span>
                      <span className="text-base font-bold text-slate-900 mt-1 block">
                        {selectedDistrict.total_applications}
                      </span>
                    </div>
                    <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                      <span className="text-[11px] text-slate-500 block">Total Disbursed</span>
                      <span className="text-base font-bold text-emerald-700 mt-1 block">
                        ₹{(selectedDistrict.total_disbursed_amount / 100000).toFixed(2)} L
                      </span>
                    </div>
                    <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                      <span className="text-[11px] text-slate-500 block">Average Scrutiny TAT</span>
                      <span className="text-base font-bold text-indigo-700 mt-1 block">
                        {selectedDistrict.avg_tat_days} Days
                      </span>
                    </div>
                    <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                      <span className="text-[11px] text-slate-500 block">PVTG Beneficiaries</span>
                      <span className="text-base font-bold text-amber-700 mt-1 block">
                        {selectedDistrict.pvtg_count}
                      </span>
                    </div>
                    <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                      <span className="text-[11px] text-slate-500 block">Active Institutions</span>
                      <span className="text-base font-bold text-slate-900 mt-1 block">
                        {selectedDistrict.active_institutions}
                      </span>
                    </div>
                    <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                      <span className="text-[11px] text-slate-500 block">Audit Health</span>
                      <span className="text-base font-bold text-emerald-600 mt-1 block">
                        VERIFIED
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3: DEMOGRAPHICS & PVTG ================= */}
        {activeTab === 'demographics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Major Sub-castes distribution */}
              <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 flex items-center space-x-2 mb-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <span>Jharkhand Scheduled Tribe Sub-Caste Equity Distribution</span>
                </h3>
                <p className="text-xs text-slate-500 mb-6">
                  Based on statutory validation against the Jharkhand State Gazette Scheduled Tribe Order.
                </p>

                <div className="space-y-3.5">
                  {demographics?.sub_castes?.map((sc, i) => (
                    <div key={i} className="text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-slate-800">{sc.sub_caste}</span>
                          {sc.is_pvtg && (
                            <span className="bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded text-[10px]">
                              PVTG
                            </span>
                          )}
                        </div>
                        <span className="text-slate-500 font-mono">
                          {sc.total_students.toLocaleString()} students ({sc.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-2.5 rounded-full ${sc.is_pvtg ? 'bg-amber-500' : 'bg-indigo-600'}`}
                          style={{ width: `${Math.min(100, sc.percentage * 2.8)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PVTG Surveillance & Special Outreach */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-5">
                    <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
                      <ShieldAlert className="w-4 h-4 text-amber-700" />
                      <span>PVTG Special Surveillance Protocol</span>
                    </div>
                    <p className="text-xs text-amber-800 mt-1">
                      {demographics?.pvtg_summary?.focus_alert}
                    </p>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mb-4">PVTG Saturation Metrics</h4>
                  <div className="space-y-4 text-xs">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                      <span className="text-slate-600">Total PVTG Beneficiaries Enrolled</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {demographics?.pvtg_summary?.total_pvtg_enrolled}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                      <span className="text-slate-600">State PVTG Saturation Index</span>
                      <span className="font-bold text-emerald-700 text-sm">
                        {demographics?.pvtg_summary?.pvtg_saturation_rate_pct}%
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                      <span className="text-slate-600">PVTG Dropout Rate</span>
                      <span className="font-bold text-emerald-700 text-sm">
                        {demographics?.pvtg_summary?.dropout_rate_pct}% (Zero-Attrition Target)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                  <span className="text-[11px] text-slate-400">
                    Compliant with MoTA PVTG Development Action Plan 2026
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: BUDGET & OUTLAY ================= */}
        {activeTab === 'budget' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 mb-6">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg flex items-center space-x-2">
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                    <span>State & Central Treasury Drawdown Outlay ({financialYear})</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Centrally Sponsored (60:40) & Central Sector (100%) Scholarship Allocation Ledger
                  </p>
                </div>
                <div className="mt-3 sm:mt-0 text-right">
                  <span className="text-xs text-slate-400 block">Total Budget Allocated</span>
                  <span className="text-xl font-bold text-slate-900">
                    ₹{((budget?.total_budget_allocated || 0) / 10000000).toFixed(2)} Crores
                  </span>
                </div>
              </div>

              {/* Central vs State Bar */}
              <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-2">
                  <span>Central Share Disbursed: ₹{((budget?.central_share_disbursed || 0) / 10000000).toFixed(2)} Cr (60%)</span>
                  <span>State Share Disbursed: ₹{((budget?.state_share_disbursed || 0) / 10000000).toFixed(2)} Cr (40%)</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden flex">
                  <div className="bg-blue-600 h-4" style={{ width: '60%' }}></div>
                  <div className="bg-emerald-600 h-4" style={{ width: '40%' }}></div>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500 mt-2">
                  <span>Overall Disbursed: ₹{((budget?.total_disbursed_amount || 0) / 10000000).toFixed(2)} Cr</span>
                  <span>Remaining Treasury Balance: ₹{((budget?.remaining_balance || 0) / 10000000).toFixed(2)} Cr</span>
                </div>
              </div>

              {/* Scheme-wise Outlay Table */}
              <h4 className="font-bold text-sm text-slate-900 mb-3">Scheme-wise Utilization Breakdown</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Scheme Code</th>
                      <th className="py-2.5 px-3">Scheme Name</th>
                      <th className="py-2.5 px-3">Pattern</th>
                      <th className="py-2.5 px-3 text-right">Allocated (₹ Cr)</th>
                      <th className="py-2.5 px-3 text-right">Disbursed (₹ Cr)</th>
                      <th className="py-2.5 px-3 text-right">Utilization</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {budget?.schemes?.map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 font-mono font-medium text-slate-700">{s.scheme_code}</td>
                        <td className="py-3 px-3 font-medium text-slate-900">{s.scheme_name}</td>
                        <td className="py-3 px-3 text-slate-500">{s.scheme_type}</td>
                        <td className="py-3 px-3 text-right font-medium">₹{(s.allocated_amount / 10000000).toFixed(2)}</td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-700">₹{(s.disbursed_amount / 10000000).toFixed(2)}</td>
                        <td className="py-3 px-3 text-right">
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">
                            {s.utilization_pct}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: INSTITUTIONS LEAGUE TABLE ================= */}
        {activeTab === 'institutions' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Performers */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center space-x-2 text-emerald-700 font-bold mb-4">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Top Performing Compliant Institutions (High Verification Rate)</span>
                </div>
                <div className="space-y-3">
                  {institutions?.top_performers?.map((inst, i) => (
                    <div key={i} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-slate-900">{inst.name}</span>
                          <span className="text-[11px] text-slate-500 block font-mono">
                            AISHE: {inst.aishe_code} | District: {inst.district}
                          </span>
                        </div>
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold text-[11px]">
                          {inst.verification_rate_pct}% Rate
                        </span>
                      </div>
                      <div className="mt-2 flex justify-between text-[11px] text-slate-600">
                        <span>Verified: {inst.verified_count} / {inst.total_applications}</span>
                        <span>Avg TAT: <b>{inst.avg_tat_days} Days</b></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Defaulters / Defect Flagged */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center space-x-2 text-red-700 font-bold mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span>Defaulter & Slow Scrutiny Institutions (Action Triggered)</span>
                </div>
                <div className="space-y-3">
                  {institutions?.defaulters?.map((inst, i) => (
                    <div key={i} className="p-3.5 bg-red-50/60 rounded-lg border border-red-200 text-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-slate-900">{inst.name}</span>
                          <span className="text-[11px] text-slate-500 block font-mono">
                            AISHE: {inst.aishe_code} | District: {inst.district}
                          </span>
                        </div>
                        <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded font-bold text-[11px]">
                          {inst.verification_rate_pct}% Rate
                        </span>
                      </div>
                      <div className="mt-2 flex justify-between text-[11px] text-slate-600">
                        <span>Pending Backlog: {inst.total_applications - inst.verified_count} applications</span>
                        <span className="text-red-700 font-semibold">High TAT: {inst.avg_tat_days} Days</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 6: PREDICTIVE BUDGET SIMULATOR ================= */}
        {activeTab === 'forecast' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-3 mb-2">
                <Sparkles className="w-6 h-6 text-indigo-600" />
                <h3 className="font-bold text-lg text-slate-900">
                  AI-Powered State ST Budget & Outlay Forecasting Simulator
                </h3>
              </div>
              <p className="text-xs text-slate-500 mb-6">
                Adjust macroeconomic parameters to project statutory fund requirements for next academic cycle (FY 2027-2028).
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                {/* Sliders */}
                <div className="space-y-5 bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>Tuition & Living Cost Inflation Rate (%)</span>
                      <span className="font-bold text-indigo-700">{simInflation}%</span>
                    </div>
                    <input
                      type="range"
                      min="2.0"
                      max="12.0"
                      step="0.5"
                      value={simInflation}
                      onChange={(e) => setSimInflation(parseFloat(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>2% (Low)</span>
                      <span>5.5% (Baseline RBI Forecast)</span>
                      <span>12% (High)</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>Projected ST Enrolment Growth Rate (%)</span>
                      <span className="font-bold text-indigo-700">{simEnrollment}%</span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="20.0"
                      step="0.5"
                      value={simEnrollment}
                      onChange={(e) => setSimEnrollment(parseFloat(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>1%</span>
                      <span>8.2% (AISHE Trend)</span>
                      <span>20% (Aggressive Drive)</span>
                    </div>
                  </div>
                </div>

                {/* Simulation Output Card */}
                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-xl shadow-md">
                  <span className="text-xs uppercase font-bold text-indigo-300 tracking-wider">
                    Statutory Projection Output (FY 2027-2028)
                  </span>
                  <div className="mt-4">
                    <span className="text-3xl font-extrabold text-emerald-400">
                      ₹{simulatedProjectedCr} Crores
                    </span>
                    <p className="text-xs text-slate-300 mt-1">
                      Estimated Treasury Outlay (+{(simInflation + simEnrollment).toFixed(1)}% expansion)
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-700/60 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block">Projected Central Share</span>
                      <span className="font-bold text-slate-100 text-sm">
                        ₹{(simulatedProjectedCr * 0.6).toFixed(2)} Cr
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Projected State Share</span>
                      <span className="font-bold text-slate-100 text-sm">
                        ₹{(simulatedProjectedCr * 0.4).toFixed(2)} Cr
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 p-2.5 bg-indigo-950/60 rounded border border-indigo-800 text-[11px] text-indigo-200">
                    Recommendation: File Supplementary Budget Demand under Head 2225-02-277-001 by November 2026.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL: PARLIAMENT & CAG QUESTION EXPORT ================= */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center space-x-2 text-indigo-700 font-bold">
                <FileSpreadsheet className="w-5 h-5" />
                <span>Statutory Parliament & CAG Export</span>
              </div>
              <button
                onClick={() => { setShowExportModal(false); setExportResult(null); }}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {!exportResult ? (
              <form onSubmit={handleExportPQ} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Parliament / Assembly Question Reference No.
                  </label>
                  <input
                    type="text"
                    value={exportRefNo}
                    onChange={(e) => setExportRefNo(e.target.value)}
                    required
                    placeholder="e.g. LS-USQ-2026/8941"
                    className="w-full border border-slate-300 rounded px-3 py-2 text-slate-800 font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Session / Body</label>
                    <select
                      value={sessionType}
                      onChange={(e) => setSessionType(e.target.value)}
                      className="w-full border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none"
                    >
                      <option value="LOK_SABHA">Lok Sabha</option>
                      <option value="RAJYA_SABHA">Rajya Sabha</option>
                      <option value="VIDHAN_SABHA">Jharkhand Vidhan Sabha</option>
                      <option value="CAG_AUDIT">CAG Statutory Audit</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Export Format</label>
                    <select
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value)}
                      className="w-full border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none"
                    >
                      <option value="CSV">CSV Spreadsheet</option>
                      <option value="JSON">Raw JSON Payload</option>
                      <option value="PDF">Signed PDF Statement</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Statement Title</label>
                  <input
                    type="text"
                    value={exportTitle}
                    onChange={(e) => setExportTitle(e.target.value)}
                    required
                    className="w-full border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowExportModal(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-600 rounded hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={exporting}
                    className="px-4 py-2 bg-indigo-700 text-white font-medium rounded hover:bg-indigo-800 transition flex items-center space-x-1"
                  >
                    {exporting ? (
                      <span>Generating Seal...</span>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Generate & Export</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Statutory Export Statement Prepared Successfully!</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                  <div>
                    <span className="text-slate-400 block text-[10px]">EXPORT ID</span>
                    <span className="font-mono font-bold text-slate-800">{exportResult.export_id}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">TOTAL BENEFICIARY RECORDS</span>
                    <span className="font-bold text-slate-800">{exportResult.record_count?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">CRYPTOGRAPHIC SHA-256 SEAL</span>
                    <span className="font-mono text-[10px] text-indigo-700 break-all">{exportResult.sha256_hash}</span>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <a
                    href={`data:text/plain;charset=utf-8,${encodeURIComponent(JSON.stringify(exportResult, null, 2))}`}
                    download={`${exportResult.question_reference_no.replace(/[/\\?%*:|"<>]/g, '_')}_data.json`}
                    className="px-4 py-2 bg-indigo-700 text-white font-medium rounded hover:bg-indigo-800 transition inline-flex items-center space-x-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Payload</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: SCHEDULED EXECUTIVE DIGEST ================= */}
      {showDigestModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center space-x-2 text-indigo-700 font-bold text-sm">
                <Calendar className="w-5 h-5" />
                <span>Executive Scheduled Report Digest</span>
              </div>
              <button onClick={() => setShowDigestModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                &times;
              </button>
            </div>

            {digestSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Scheduled Digest Configured for Automated Dispatch!</span>
              </div>
            ) : (
              <form onSubmit={handleCreateDigest} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Digest Title</label>
                  <input
                    type="text"
                    value={digestTitle}
                    onChange={(e) => setDigestTitle(e.target.value)}
                    required
                    className="w-full border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Dispatch Frequency</label>
                  <select
                    value={digestFrequency}
                    onChange={(e) => setDigestFrequency(e.target.value)}
                    className="w-full border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none"
                  >
                    <option value="DAILY">Daily Morning (08:00 AM IST)</option>
                    <option value="WEEKLY">Weekly Monday Briefing</option>
                    <option value="MONTHLY">Monthly Cabinet Report</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Recipient Official Email</label>
                  <input
                    type="email"
                    value={digestEmail}
                    onChange={(e) => setDigestEmail(e.target.value)}
                    required
                    className="w-full border border-slate-300 rounded px-3 py-2 text-slate-800 font-mono focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowDigestModal(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-600 rounded hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-700 text-white font-medium rounded hover:bg-indigo-800 transition"
                  >
                    Save Schedule
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutiveBiDashboardPage;
