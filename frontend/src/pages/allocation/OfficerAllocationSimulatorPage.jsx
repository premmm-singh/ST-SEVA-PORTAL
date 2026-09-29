import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calculator,
  Play,
  CheckCircle2,
  AlertTriangle,
  Award,
  Users,
  ShieldCheck,
  TrendingUp,
  FileText,
  Clock,
  PlusCircle,
  ExternalLink,
  Percent,
} from 'lucide-react';
import allocationService from '../../services/allocationService';
import { applicationService } from '../../services/applicationService';

const OfficerAllocationSimulatorPage = () => {
  const [cycles, setCycles] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [selectedCycleId, setSelectedCycleId] = useState('');
  const [simulationData, setSimulationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Create Cycle Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSchemeId, setNewSchemeId] = useState('');
  const [newAcademicYear, setNewAcademicYear] = useState('2026-2027');
  const [newTotalBudget, setNewTotalBudget] = useState(2500000);
  const [newTotalSeats, setNewTotalSeats] = useState(100);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [cyclesData, schemesData] = await Promise.all([
        allocationService.getAllocationCycles(),
        applicationService.getSchemes(),
      ]);
      setCycles(cyclesData);
      setSchemes(schemesData);
      if (cyclesData && cyclesData.length > 0) {
        setSelectedCycleId(cyclesData[0].id);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load allocation cycles');
    } finally {
      setLoading(false);
    }
  };

  const handleRunSimulation = async (dryRun = true) => {
    if (!selectedCycleId) return;
    setErrorMsg('');
    setSuccessMsg('');
    if (dryRun) {
      setSimulating(true);
    } else {
      setCommitting(true);
    }

    try {
      const res = await allocationService.simulateAllocation(selectedCycleId, dryRun);
      setSimulationData(res);
      if (!dryRun) {
        setSuccessMsg('Allocation committed & frozen successfully. Results are now live!');
        // Refresh cycle list to get updated status
        const updatedCycles = await allocationService.getAllocationCycles();
        setCycles(updatedCycles);
      } else {
        setSuccessMsg('Dry-run simulation executed. Quota metrics calculated.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Simulation execution failed');
    } finally {
      setSimulating(false);
      setCommitting(false);
    }
  };

  const handleCreateCycle = async (e) => {
    e.preventDefault();
    if (!newSchemeId) {
      setErrorMsg('Please select a scheme');
      return;
    }
    try {
      const created = await allocationService.createAllocationCycle({
        scheme_id: newSchemeId,
        academic_year: newAcademicYear,
        financial_year: newAcademicYear,
        total_budget: Number(newTotalBudget),
        total_seats: Number(newTotalSeats),
      });
      setShowCreateModal(false);
      setSuccessMsg('New allocation cycle created successfully!');
      const updatedCycles = await allocationService.getAllocationCycles();
      setCycles(updatedCycles);
      setSelectedCycleId(created.id);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Failed to create allocation cycle');
    }
  };

  const currentCycle = cycles.find((c) => c.id === selectedCycleId);

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Breadcrumb & Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span>Welfare Directorate</span>
              <span>/</span>
              <span className="text-[#005696]">Merit & Allocation Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Calculator className="w-7 h-7 text-[#005696]" />
              Seat Matrix & Quota Allocation Simulator
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Deterministic multi-criteria merit ranking, statutory quota distribution (Female 33%, PVTG 5%, PwD 5%), and budgetary cap control.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-[#005696] hover:bg-[#004275] text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-xs transition"
            >
              <PlusCircle className="w-4 h-4" />
              New Allocation Cycle
            </button>
          </div>
        </div>

        {/* Notifications */}
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

        {/* Selector & Cycle Status Ribbon */}
        <div className="mt-6 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Active Scheme Cycle
            </label>
            <select
              value={selectedCycleId}
              onChange={(e) => {
                setSelectedCycleId(e.target.value);
                setSimulationData(null);
              }}
              className="w-full text-sm font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005696]"
            >
              {cycles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.scheme_name || c.scheme_id} ({c.academic_year}) - [{c.status}]
                </option>
              ))}
            </select>
          </div>

          {currentCycle && (
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="bg-slate-100 px-3 py-2 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Total Sanctioned Seats</span>
                <span className="text-slate-900 font-bold text-sm">{currentCycle.total_seats}</span>
              </div>
              <div className="bg-slate-100 px-3 py-2 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Fiscal Scheme Budget</span>
                <span className="text-slate-900 font-bold text-sm">
                  ₹{(currentCycle.total_budget || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="bg-slate-100 px-3 py-2 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Current Stage</span>
                <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">
                  {currentCycle.status}
                </span>
              </div>
              <Link
                to={`/officer/allocations/${currentCycle.id}/merit-list`}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold px-3 py-2 rounded-lg transition"
              >
                <span>Merit Roster</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Action Bar for Simulation */}
        <div className="mt-6 bg-gradient-to-r from-blue-900 to-[#005696] rounded-xl p-6 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-blue-200">
              Feature 66 Simulation Engine
            </span>
            <h2 className="text-xl font-bold mt-1">Multi-Quota Allocation Sandbox</h2>
            <p className="text-xs text-blue-100 mt-1 max-w-xl">
              Simulates seat distribution against statutory quotas, tie-breaking criteria (Core Marks &gt; Lower Income &gt; Older Age &gt; Timestamp), and validates budget ceilings before official sanction.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => handleRunSimulation(true)}
              disabled={simulating || committing || !selectedCycleId}
              className="flex items-center gap-2 bg-white text-[#005696] hover:bg-blue-50 font-bold px-5 py-2.5 rounded-lg text-sm shadow-xs transition disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              {simulating ? 'Simulating...' : 'Run Dry-Run Simulator'}
            </button>
            <button
              onClick={() => handleRunSimulation(false)}
              disabled={simulating || committing || !selectedCycleId}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-lg text-sm shadow-xs transition disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              {committing ? 'Committing...' : 'Commit & Freeze Allocation'}
            </button>
          </div>
        </div>

        {/* Simulation Output Cards */}
        {simulationData && (
          <div className="mt-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase">Applicants Evaluated</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-slate-900">{simulationData.total_applicants}</span>
                  <span className="text-xs text-slate-500">applications</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase">Seats Allocated</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-emerald-600">{simulationData.seats_filled}</span>
                  <span className="text-xs text-slate-500">/ {simulationData.total_seats} capacity</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase">Fiscal Outlay</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-[#005696]">
                    ₹{(simulationData.allocated_budget || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-slate-500 font-bold">
                    ({simulationData.budget_utilization_pct}%)
                  </span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase">Waitlisted Pool</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-amber-600">{simulationData.waitlisted_count}</span>
                  <span className="text-xs text-slate-500">candidates</span>
                </div>
              </div>
            </div>

            {/* Quota Distribution Breakdown */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-[#005696]" />
                Statutory Quota Distribution Matrix (F-60)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="p-4 rounded-lg border border-purple-200 bg-purple-50/50">
                  <div className="text-xs font-bold text-purple-900 uppercase">PVTG 5% Quota</div>
                  <div className="text-2xl font-extrabold text-purple-700 mt-1">
                    {simulationData.quota_distribution?.pvtg_5?.filled || 0}
                  </div>
                  <div className="text-[11px] text-purple-600 mt-1">
                    Target: {simulationData.quota_distribution?.pvtg_5?.target || 0} seats
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-blue-200 bg-blue-50/50">
                  <div className="text-xs font-bold text-blue-900 uppercase">PwD 5% Quota</div>
                  <div className="text-2xl font-extrabold text-blue-700 mt-1">
                    {simulationData.quota_distribution?.pwd_5?.filled || 0}
                  </div>
                  <div className="text-[11px] text-blue-600 mt-1">
                    Target: {simulationData.quota_distribution?.pwd_5?.target || 0} seats
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-pink-200 bg-pink-50/50">
                  <div className="text-xs font-bold text-pink-900 uppercase">Female 33% Quota</div>
                  <div className="text-2xl font-extrabold text-pink-700 mt-1">
                    {simulationData.quota_distribution?.female_33?.filled || 0}
                  </div>
                  <div className="text-[11px] text-pink-600 mt-1">
                    Target: {simulationData.quota_distribution?.female_33?.target || 0} seats
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-teal-200 bg-teal-50/50">
                  <div className="text-xs font-bold text-teal-900 uppercase">Sports 2% Quota</div>
                  <div className="text-2xl font-extrabold text-teal-700 mt-1">
                    {simulationData.quota_distribution?.sports_2?.filled || 0}
                  </div>
                  <div className="text-[11px] text-teal-600 mt-1">
                    Target: {simulationData.quota_distribution?.sports_2?.target || 0} seats
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="text-xs font-bold text-slate-800 uppercase">General ST Merit</div>
                  <div className="text-2xl font-extrabold text-slate-800 mt-1">
                    {simulationData.quota_distribution?.general_st || 0}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Open Merit Pool</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Create Allocation Cycle */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Create New Allocation Cycle</h3>
              <form onSubmit={handleCreateCycle} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Select Scheme</label>
                  <select
                    value={newSchemeId}
                    onChange={(e) => setNewSchemeId(e.target.value)}
                    required
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#005696]"
                  >
                    <option value="">-- Choose Scheme --</option>
                    {schemes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.scheme_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Academic Year</label>
                  <input
                    type="text"
                    value={newAcademicYear}
                    onChange={(e) => setNewAcademicYear(e.target.value)}
                    required
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#005696]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Total Seats</label>
                    <input
                      type="number"
                      value={newTotalSeats}
                      onChange={(e) => setNewTotalSeats(e.target.value)}
                      min="1"
                      required
                      className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#005696]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Total Budget (₹)</label>
                    <input
                      type="number"
                      value={newTotalBudget}
                      onChange={(e) => setNewTotalBudget(e.target.value)}
                      min="10000"
                      required
                      className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#005696]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-[#005696] hover:bg-[#004275] rounded-lg shadow-xs transition"
                  >
                    Create Cycle
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

export default OfficerAllocationSimulatorPage;
