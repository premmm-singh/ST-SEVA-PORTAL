import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Award,
  ArrowLeft,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  FileText,
  UserCheck,
  ChevronRight,
  Filter,
  RefreshCw,
  Scale,
  Sparkles,
} from 'lucide-react';
import allocationService from '../../services/allocationService';

const OfficerMeritListPage = () => {
  const { id: cycleId } = useParams();
  const [cycle, setCycle] = useState(null);
  const [meritList, setMeritList] = useState([]);
  const [results, setResults] = useState([]);
  const [objections, setObjections] = useState([]);
  const [sanctionOrders, setSanctionOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('merit'); // 'merit', 'results', 'waitlist', 'objections', 'sanction'
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sanction Order Modal
  const [showSanctionModal, setShowSanctionModal] = useState(false);
  const [sanctionResult, setSanctionResult] = useState(null);

  // Resolve Objection Modal
  const [selectedObjection, setSelectedObjection] = useState(null);
  const [objectionRemarks, setObjectionRemarks] = useState('');
  const [objectionDecision, setObjectionDecision] = useState('ACCEPTED');

  useEffect(() => {
    fetchData();
  }, [cycleId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cycleData, meritData, resultsData, objData, ordersData] = await Promise.all([
        allocationService.getAllocationCycle(cycleId),
        allocationService.getMeritList(cycleId),
        allocationService.getAllocationResults(cycleId),
        allocationService.getCycleObjections(cycleId),
        allocationService.getCycleSanctionOrders(cycleId),
      ]);
      setCycle(cycleData);
      setMeritList(meritData);
      setResults(resultsData);
      setObjections(objData);
      setSanctionOrders(ordersData);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load cycle merit and allocation roster');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenObjectionWindow = async () => {
    setActionLoading(true);
    setErrorMsg('');
    try {
      await allocationService.openObjectionWindow(cycleId, 7);
      setSuccessMsg('7-Day Statutory Objection Window opened. Applicants can now submit merit disputes.');
      fetchData();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Failed to open objection window');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePromoteWaitlist = async () => {
    setActionLoading(true);
    setErrorMsg('');
    try {
      const res = await allocationService.promoteWaitlistCandidate(cycleId);
      setSuccessMsg(res.message);
      fetchData();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Failed to promote candidate from waitlist');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateSanctionOrder = async () => {
    setActionLoading(true);
    setErrorMsg('');
    try {
      const order = await allocationService.generateSanctionOrder(cycleId);
      setSanctionResult(order);
      setShowSanctionModal(true);
      setSuccessMsg(`Sanction Order #${order.order_number} generated successfully with SHA-256 seal.`);
      fetchData();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Failed to generate sanction order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveObjection = async (e) => {
    e.preventDefault();
    if (!selectedObjection) return;
    setActionLoading(true);
    try {
      await allocationService.resolveMeritObjection(selectedObjection.id, {
        status_decision: objectionDecision,
        resolution_remarks: objectionRemarks,
      });
      setSelectedObjection(null);
      setSuccessMsg('Objection adjudicated successfully');
      fetchData();
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to resolve objection');
    } finally {
      setActionLoading(false);
    }
  };

  const waitlistCandidates = results.filter((r) => r.status === 'WAITLISTED');

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation back */}
        <Link
          to="/officer/allocations"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#005696] mb-4 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Allocation Simulator</span>
        </Link>

        {/* Top Header Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              <span>Academic Year {cycle?.academic_year || '2026-2027'}</span>
              <span>•</span>
              <span className="text-[#005696]">{cycle?.status}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Award className="w-6 h-6 text-[#005696]" />
              {cycle?.scheme_name || 'Scholarship Scheme Roster'}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Statutory merit roster computed via multi-criteria scoring with deterministic tie-breaking.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleOpenObjectionWindow}
              disabled={actionLoading || cycle?.status === 'OBJECTION_WINDOW'}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-xs transition disabled:opacity-50"
            >
              <Clock className="w-4 h-4" />
              <span>{cycle?.status === 'OBJECTION_WINDOW' ? 'Objection Window Open' : 'Open 7-Day Objection Window'}</span>
            </button>

            <button
              onClick={handleGenerateSanctionOrder}
              disabled={actionLoading || cycle?.status === 'FINALIZED'}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-xs transition disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Issue Sanction Order</span>
            </button>
          </div>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mt-4 p-3.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mt-6 flex border-b border-slate-200 gap-2">
          <button
            onClick={() => setActiveTab('merit')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'merit'
                ? 'border-[#005696] text-[#005696]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Ranked Merit List ({meritList.length})
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'results'
                ? 'border-[#005696] text-[#005696]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Allocated Beneficiaries ({results.filter((r) => r.status === 'SELECTED').length})
          </button>
          <button
            onClick={() => setActiveTab('waitlist')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'waitlist'
                ? 'border-[#005696] text-[#005696]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Waitlist Pool ({waitlistCandidates.length})
          </button>
          <button
            onClick={() => setActiveTab('objections')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'objections'
                ? 'border-[#005696] text-[#005696]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Merit Objections ({objections.length})
          </button>
          <button
            onClick={() => setActiveTab('sanction')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'sanction'
                ? 'border-[#005696] text-[#005696]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Sanction Orders ({sanctionOrders.length})
          </button>
        </div>

        {/* TAB 1: Ranked Merit List */}
        {activeTab === 'merit' && (
          <div className="mt-6 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Multi-Criteria Merit Score Table (F-59 & F-61)
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                Score Formula = Academic (60) + Income (25) + PVTG Bonus (+15)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-center">Rank</th>
                    <th className="p-3">Candidate</th>
                    <th className="p-3">Category / Tribe</th>
                    <th className="p-3 text-right">Academic (60)</th>
                    <th className="p-3 text-right">Income (25)</th>
                    <th className="p-3 text-right">PVTG (+15)</th>
                    <th className="p-3 text-right font-black text-slate-900">Total Score</th>
                    <th className="p-3">Tie-Breaker Criteria</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {meritList.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="p-6 text-center text-slate-500 font-medium">
                        No merit scores computed yet. Run the simulation above to calculate rankings.
                      </td>
                    </tr>
                  ) : (
                    meritList.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 text-center">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${
                              m.rank_overall === 1
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : m.rank_overall <= 3
                                ? 'bg-blue-100 text-blue-900'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {m.rank_overall}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{m.student_name || 'Tribal Scholar'}</div>
                          <div className="text-[10px] text-slate-500">{m.district || 'Ranchi'}</div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {m.pvtg_community ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                PVTG ({m.pvtg_community})
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                ST
                              </span>
                            )}
                            {m.is_female && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-pink-100 text-pink-800">
                                Female
                              </span>
                            )}
                            {m.is_pwd && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                                PwD
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-right font-semibold">{m.academic_score.toFixed(2)}</td>
                        <td className="p-3 text-right font-semibold">{m.income_score.toFixed(2)}</td>
                        <td className="p-3 text-right font-semibold text-purple-700">
                          {m.pvtg_bonus > 0 ? `+${m.pvtg_bonus}` : '-'}
                        </td>
                        <td className="p-3 text-right font-black text-slate-900 text-sm">
                          {m.total_merit_score.toFixed(2)}
                        </td>
                        <td className="p-3 text-[11px] text-slate-600">
                          <div>Marks: {m.core_subject_marks}%</div>
                          <div>Income: ₹{m.family_income?.toLocaleString('en-IN')}</div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Allocated Beneficiaries */}
        {activeTab === 'results' && (
          <div className="mt-6 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Candidate</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Quota Category</th>
                    <th className="p-3 text-right">Maintenance</th>
                    <th className="p-3 text-right">Tuition</th>
                    <th className="p-3 text-right font-black">Total Sanctioned</th>
                    <th className="p-3">Sanction Order #</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results
                    .filter((r) => r.status === 'SELECTED')
                    .map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-bold text-slate-900">{r.student_name}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            {r.status}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-700">{r.quota_category}</td>
                        <td className="p-3 text-right">₹{r.maintenance_allowance?.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right">₹{r.tuition_reimbursement?.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right font-black text-slate-900">
                          ₹{r.allocated_amount?.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-[#005696]">
                          {r.sanction_order_number || 'Pending Final Order'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Waitlist Management */}
        {activeTab === 'waitlist' && (
          <div className="mt-6 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Waitlist Promotion Desk (F-62)
                </span>
                <span className="text-xs text-slate-500">
                  Candidates are automatically ordered by statutory merit ranking for immediate elevation upon dropout.
                </span>
              </div>
              <button
                onClick={handlePromoteWaitlist}
                disabled={actionLoading || waitlistCandidates.length === 0}
                className="flex items-center gap-1.5 bg-[#005696] hover:bg-[#004275] text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-xs transition disabled:opacity-50"
              >
                <UserCheck className="w-4 h-4" />
                <span>Elevate Top Waitlist Candidate (#1)</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-center">Waitlist Pos</th>
                    <th className="p-3">Candidate</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {waitlistCandidates.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-6 text-center text-slate-500 font-medium">
                        No candidates on waitlist for this cycle.
                      </td>
                    </tr>
                  ) : (
                    waitlistCandidates.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 text-center">
                          <span className="px-2.5 py-1 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-200">
                            WL-{w.waitlist_number}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-900">{w.student_name}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800">
                            {w.status}
                          </span>
                        </td>
                        <td className="p-3">
                          {w.waitlist_number === 1 && (
                            <button
                              onClick={handlePromoteWaitlist}
                              className="text-xs text-[#005696] hover:underline font-bold"
                            >
                              Elevate to Selected
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: Objections */}
        {activeTab === 'objections' && (
          <div className="mt-6 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Student Merit Objections & Grievances (F-67)
              </span>
              <span className="text-xs text-slate-500">
                Submissions filed by students during the statutory 7-day correction window.
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Objection Type</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Claimed Score</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {objections.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-6 text-center text-slate-500 font-medium">
                        No objections filed for this allocation cycle.
                      </td>
                    </tr>
                  ) : (
                    objections.map((obj) => (
                      <tr key={obj.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-bold text-slate-900">{obj.objection_type}</td>
                        <td className="p-3 text-slate-700 max-w-xs">{obj.description}</td>
                        <td className="p-3 font-semibold">{obj.claimed_score || '-'}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              obj.status === 'ACCEPTED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : obj.status === 'REJECTED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {obj.status}
                          </span>
                        </td>
                        <td className="p-3">
                          {obj.status === 'PENDING' ? (
                            <button
                              onClick={() => {
                                setSelectedObjection(obj);
                                setObjectionDecision('ACCEPTED');
                              }}
                              className="text-xs text-[#005696] hover:underline font-bold"
                            >
                              Adjudicate
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-500">{obj.resolution_remarks}</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: Sanction Orders */}
        {activeTab === 'sanction' && (
          <div className="mt-6 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Order Number</th>
                    <th className="p-3">Issued Date</th>
                    <th className="p-3 text-center">Beneficiaries</th>
                    <th className="p-3 text-right">Total Outlay</th>
                    <th className="p-3">Digital Signature Hash (SHA-256)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sanctionOrders.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-6 text-center text-slate-500 font-medium">
                        No sanction orders issued yet. Click "Issue Sanction Order" to generate.
                      </td>
                    </tr>
                  ) : (
                    sanctionOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-mono font-bold text-[#005696]">{ord.order_number}</td>
                        <td className="p-3 text-slate-600">
                          {new Date(ord.issued_at).toLocaleDateString('en-IN')}
                        </td>
                        <td className="p-3 text-center font-bold text-slate-900">{ord.total_beneficiaries}</td>
                        <td className="p-3 text-right font-black text-slate-900">
                          ₹{ord.total_sanctioned_amount?.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 font-mono text-[10px] text-slate-500 truncate max-w-xs">
                          {ord.digital_signature_hash}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal: Sanction Order Generated */}
        {showSanctionModal && sanctionResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border-2 border-emerald-500">
              <div className="flex items-center gap-3 text-emerald-700 mb-4">
                <ShieldCheck className="w-8 h-8" />
                <div>
                  <h3 className="text-lg font-black tracking-tight">Statutory Sanction Order Issued</h3>
                  <span className="text-xs font-semibold text-emerald-600">MeitY/GIGW Compliant Seal</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 block">Sanction Order Reference:</span>
                  <span className="font-mono font-bold text-sm text-[#005696]">{sanctionResult.order_number}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-slate-500 block">Beneficiaries:</span>
                    <span className="font-bold text-slate-900">{sanctionResult.total_beneficiaries} Scholars</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Sanctioned Outlay:</span>
                    <span className="font-bold text-slate-900">
                      ₹{sanctionResult.total_sanctioned_amount?.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 block">Digital SHA-256 Seal:</span>
                  <span className="font-mono text-[10px] text-slate-700 break-all">
                    {sanctionResult.digital_signature_hash}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowSanctionModal(false)}
                  className="bg-[#005696] hover:bg-[#004275] text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-xs transition"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Adjudicate Objection */}
        {selectedObjection && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-base font-bold text-slate-900 mb-3">Adjudicate Merit Objection</h3>
              <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1 mb-4 border border-slate-200">
                <div className="font-bold text-slate-800">{selectedObjection.objection_type}</div>
                <div className="text-slate-600">{selectedObjection.description}</div>
              </div>

              <form onSubmit={handleResolveObjection} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Decision</label>
                  <select
                    value={objectionDecision}
                    onChange={(e) => setObjectionDecision(e.target.value)}
                    className="w-full text-xs font-bold border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#005696]"
                  >
                    <option value="ACCEPTED">ACCEPTED (Uphold objection & update score)</option>
                    <option value="REJECTED">REJECTED (No documentary merit)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Officer Justification</label>
                  <textarea
                    rows={3}
                    value={objectionRemarks}
                    onChange={(e) => setObjectionRemarks(e.target.value)}
                    required
                    placeholder="Enter statutory reason for decision..."
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#005696]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSelectedObjection(null)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-[#005696] hover:bg-[#004275] rounded-lg shadow-xs"
                  >
                    Confirm Resolution
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfficerMeritListPage;
