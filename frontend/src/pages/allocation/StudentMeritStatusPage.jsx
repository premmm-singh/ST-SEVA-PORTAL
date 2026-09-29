import React, { useState, useEffect } from 'react';
import {
  Award,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  HelpCircle,
  FileText,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import allocationService from '../../services/allocationService';

const StudentMeritStatusPage = () => {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Objection Modal
  const [showObjectionModal, setShowObjectionModal] = useState(false);
  const [selectedCycleId, setSelectedCycleId] = useState('');
  const [objectionType, setObjectionType] = useState('MARKS_DISCREPANCY');
  const [description, setDescription] = useState('');
  const [claimedScore, setClaimedScore] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMyAllocations();
  }, []);

  const fetchMyAllocations = async () => {
    setLoading(true);
    try {
      const data = await allocationService.getMyAllocations();
      setAllocations(data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load your scholarship allocation status');
    } finally {
      setLoading(false);
    }
  };

  const handleFileObjection = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await allocationService.fileMeritObjection(selectedCycleId, {
        objection_type: objectionType,
        description,
        claimed_score: claimedScore ? Number(claimedScore) : null,
      });
      setShowObjectionModal(false);
      setDescription('');
      setClaimedScore('');
      setSuccessMsg('Your merit objection has been submitted. The Welfare Officer will review and respond.');
      fetchMyAllocations();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Failed to submit objection');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="border-b border-slate-200 pb-5 mb-6">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            <span>Student Services</span>
            <span>/</span>
            <span className="text-[#005696]">Award Status</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Award className="w-6 h-6 text-[#005696]" />
            Merit Rank & Scholarship Award Status
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Check your verified merit position, statutory quota category, and official sanction order details.
          </p>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Allocations Cards */}
        {loading ? (
          <div className="text-center py-12 text-slate-500 text-xs">Loading merit and award status...</div>
        ) : allocations.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-xs">
            <HelpCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No Allocation Records Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You currently have no processed allocations. Allocation runs once institutional and welfare scrutiny stages are completed.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {allocations.map((alloc) => (
              <div
                key={alloc.cycle_id}
                className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs relative overflow-hidden"
              >
                {/* Top Accent Strip */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${
                    alloc.allocation_status === 'SELECTED'
                      ? 'bg-emerald-500'
                      : alloc.allocation_status === 'WAITLISTED'
                      ? 'bg-amber-500'
                      : 'bg-slate-300'
                  }`}
                />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      Academic Year {alloc.academic_year}
                    </span>
                    <h2 className="text-lg font-black text-slate-900 mt-0.5">{alloc.scheme_name}</h2>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black tracking-wide ${
                        alloc.allocation_status === 'SELECTED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : alloc.allocation_status === 'WAITLISTED'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {alloc.allocation_status}
                    </span>
                  </div>
                </div>

                {/* Score & Quota Highlights */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">Overall Merit Rank</span>
                    <span className="text-base font-black text-[#005696]">
                      {alloc.rank_overall ? `#${alloc.rank_overall}` : 'Under Evaluation'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Merit Score (Max 100)</span>
                    <span className="text-base font-black text-slate-800">
                      {alloc.total_merit_score ? alloc.total_merit_score.toFixed(2) : '-'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Quota Category</span>
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded inline-block mt-0.5">
                      {alloc.quota_category || 'General ST'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Sanctioned Amount</span>
                    <span className="text-base font-black text-emerald-600">
                      ₹{(alloc.allocated_amount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Status-specific banners */}
                {alloc.allocation_status === 'SELECTED' && (
                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-emerald-900 font-semibold">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Sanction Order No:{' '}
                        <strong className="font-mono">{alloc.sanction_order_number || 'Pending Final Seal'}</strong>
                      </span>
                    </div>
                  </div>
                )}

                {alloc.allocation_status === 'WAITLISTED' && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-amber-900 font-semibold">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        Your position in the waitlist is <strong>WL-{alloc.waitlist_number}</strong>. You will be automatically elevated upon any candidate dropout.
                      </span>
                    </div>
                  </div>
                )}

                {/* Objection Button */}
                {alloc.objection_window_open && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => {
                        setSelectedCycleId(alloc.cycle_id);
                        setShowObjectionModal(true);
                      }}
                      className="flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-3.5 py-1.5 rounded-lg transition"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Dispute Merit Rank (7-Day Objection Window)</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal: File Merit Objection */}
        {showObjectionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-xs">
              <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-orange-600" />
                File Statutory Merit Objection (F-67)
              </h3>
              <p className="text-slate-500 mb-4">
                Submit documentary grievances regarding academic normalization, income tier, or PVTG priority marks.
              </p>

              <form onSubmit={handleFileObjection} className="space-y-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Objection Category</label>
                  <select
                    value={objectionType}
                    onChange={(e) => setObjectionType(e.target.value)}
                    className="w-full text-xs font-bold border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#005696]"
                  >
                    <option value="MARKS_DISCREPANCY">Marks / Percentage Discrepancy</option>
                    <option value="INCOME_TIER_ERROR">Annual Family Income Error</option>
                    <option value="PVTG_QUOTA_MISSED">PVTG Community Bonus Omitted</option>
                    <option value="PWD_QUOTA_MISSED">PwD Benchmark Disability Omitted</option>
                    <option value="TIE_BREAKER_DISPUTE">Tie-Breaker Rule Challenge</option>
                    <option value="OTHER">Other Statutory Grievance</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Claimed Merit Score</label>
                  <input
                    type="number"
                    step="0.01"
                    value={claimedScore}
                    onChange={(e) => setClaimedScore(e.target.value)}
                    placeholder="e.g. 84.50"
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#005696]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Grievance Description</label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    placeholder="Provide exact details of the discrepancy and reference certificates..."
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#005696]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowObjectionModal(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#005696] hover:bg-[#004275] rounded-lg shadow-xs transition disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Submitting...' : 'Submit Objection'}</span>
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

export default StudentMeritStatusPage;
