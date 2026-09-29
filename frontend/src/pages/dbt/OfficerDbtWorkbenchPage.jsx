import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  PlusCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Building,
  DollarSign,
  TrendingUp,
  Download,
  Award,
  Layers,
  FileCheck
} from 'lucide-react';
import dbtService from '../../services/dbtService';
import allocationService from '../../services/allocationService';
import { applicationService } from '../../services/applicationService';

const OfficerDbtWorkbenchPage = () => {
  const [batches, setBatches] = useState([]);
  const [ledger, setLedger] = useState(null);
  const [cycles, setCycles] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Batch Generator Modal State
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedSchemeId, setSelectedSchemeId] = useState('');
  const [selectedCycleId, setSelectedCycleId] = useState('');
  const [trancheNumber, setTrancheNumber] = useState(1);
  const [tranchePercentage, setTranchePercentage] = useState(100);
  const [splitEnabled, setSplitEnabled] = useState(true);

  // CAG Export Preview Modal
  const [cagModalOpen, setCagModalOpen] = useState(false);
  const [cagData, setCagData] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [batchesRes, ledgerRes, cyclesRes, schemesRes] = await Promise.all([
        dbtService.getPaymentBatches(),
        dbtService.getTreasuryLedger(),
        allocationService.getAllocationCycles(),
        applicationService.getSchemes(),
      ]);
      setBatches(batchesRes);
      setLedger(ledgerRes);
      setCycles(cyclesRes);
      setSchemes(schemesRes);
      if (schemesRes.length > 0) setSelectedSchemeId(schemesRes[0].id);
      if (cyclesRes.length > 0) setSelectedCycleId(cyclesRes[0].id);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load DBT workbench data.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBatch = async (e) => {
    e.preventDefault();
    if (!selectedSchemeId || !selectedCycleId) {
      setErrorMsg('Please select both Scheme and Finalized Cycle.');
      return;
    }
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const newBatch = await dbtService.generatePaymentBatch(
        selectedSchemeId,
        selectedCycleId,
        parseInt(trancheNumber),
        parseFloat(tranchePercentage),
        splitEnabled
      );
      setSuccessMsg(`Payment Batch ${newBatch.batch_number} created successfully with ${newBatch.total_records} disbursement records!`);
      setShowBatchModal(false);
      await loadData();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Failed to generate payment batch');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispatchPfms = async (batchId) => {
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await dbtService.dispatchBatchToPfms(batchId);
      setSuccessMsg(`Batch dispatched to PFMS successfully! Ref ID: ${res.pfms_reference_id}`);
      await loadData();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Failed to dispatch to PFMS');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReconcile = async (batchId) => {
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await dbtService.reconcileBatch(batchId);
      setSuccessMsg(`Bank credits reconciled! Status: ${res.status}. UTR numbers assigned to beneficiaries.`);
      await loadData();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Failed to reconcile bank batch');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateTreasuryBill = async (batchId) => {
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const bill = await dbtService.generateTreasuryBill(batchId, 'RANCHI');
      setSuccessMsg(`Form TR-27 Treasury Bill ${bill.bill_number} generated with SHA-256 seal! Token: ${bill.token_number}`);
      await loadData();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Failed to generate Treasury Bill');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenCagExport = async () => {
    setActionLoading(true);
    try {
      const data = await dbtService.exportCagCompliance();
      setCagData(data);
      setCagModalOpen(true);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to generate CAG compliance export.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PROCESSED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3 h-3 mr-1" /> Credited & Reconciled</span>;
      case 'DISPATCHED_TO_PFMS':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Send className="w-3 h-3 mr-1" /> Dispatched to PFMS</span>;
      case 'PARTIALLY_FAILED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><AlertTriangle className="w-3 h-3 mr-1" /> Partially Failed</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800"><Clock className="w-3 h-3 mr-1" /> Draft Queue</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header Breadcrumb */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
              <span>MoTA Portal</span>
              <span>/</span>
              <span>DBT & Payment Gateway</span>
              <span>/</span>
              <span className="text-emerald-700 font-semibold">Disbursement Workbench</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1 flex items-center">
              <Send className="w-7 h-7 text-emerald-600 mr-2" />
              Direct Benefit Transfer (DBT) & Treasury Workbench
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Public Financial Management System (PFMS) & NPCI Aadhaar Payment Bridge System (APBS) Hub
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleOpenCagExport}
              disabled={actionLoading}
              className="inline-flex items-center px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition"
            >
              <Download className="w-4 h-4 mr-1.5 text-slate-500" />
              CAG Audit Export
            </button>
            <button
              onClick={() => setShowBatchModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Generate Payment Batch
            </button>
          </div>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-center justify-between">
            <div className="flex items-center text-red-800 text-sm">
              <AlertTriangle className="w-5 h-5 mr-2 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg('')} className="text-red-500 hover:text-red-700 font-bold ml-4">✕</button>
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg flex items-center justify-between">
            <div className="flex items-center text-emerald-800 text-sm">
              <CheckCircle2 className="w-5 h-5 mr-2 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-700 font-bold ml-4">✕</button>
          </div>
        )}

        {/* Treasury Major/Minor Head KPI Cards */}
        {ledger && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Treasury Allocation</span>
                <Building className="w-5 h-5 text-indigo-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">₹{(ledger.allocated_budget / 100000).toFixed(2)} Lakhs</p>
              <p className="text-xs text-slate-500 mt-1">Head: {ledger.major_head}-{ledger.sub_major_head}-{ledger.minor_head}</p>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Expended (DBT Settled)</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-emerald-600 mt-2">₹{(ledger.expended_amount / 100000).toFixed(2)} Lakhs</p>
              <p className="text-xs text-slate-500 mt-1">RBI UTR Confirmed Transfers</p>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Committed (In Batches)</span>
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-amber-600 mt-2">₹{(ledger.committed_amount / 100000).toFixed(2)} Lakhs</p>
              <p className="text-xs text-slate-500 mt-1">Queued for PFMS clearance</p>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unutilized Balance</span>
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600 mt-2">₹{(ledger.balance_amount / 100000).toFixed(2)} Lakhs</p>
              <p className="text-xs text-slate-500 mt-1">Fiscal Year {ledger.financial_year}</p>
            </div>
          </div>
        )}

        {/* Live Payment Batches List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 flex items-center">
              <Layers className="w-5 h-5 text-slate-600 mr-2" />
              Disbursement Payment Batches ({batches.length})
            </h2>
            <button
              onClick={loadData}
              disabled={loading}
              className="text-xs text-slate-600 hover:text-emerald-700 flex items-center font-medium"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
              Loading payment batches...
            </div>
          ) : batches.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              No DBT payment batches generated yet. Click "Generate Payment Batch" to disburse sanctioned students.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-xs">
                  <tr>
                    <th className="px-6 py-3 text-left">Batch Number</th>
                    <th className="px-6 py-3 text-left">Records</th>
                    <th className="px-6 py-3 text-left">Total Amount</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">PFMS Ref ID</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {batches.map((batch) => (
                    <tr key={batch.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-mono font-medium text-slate-900">
                        {batch.batch_number}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <span className="font-semibold text-slate-800">{batch.total_records}</span> transactions
                      </td>
                      <td className="px-6 py-4 font-semibold text-emerald-700">
                        ₹{batch.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(batch.status)}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">
                        {batch.pfms_reference_id || <span className="text-slate-400 italic">Pending Dispatch</span>}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {batch.status === 'DRAFT' && (
                          <button
                            onClick={() => handleDispatchPfms(batch.id)}
                            disabled={actionLoading}
                            className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition"
                          >
                            <Send className="w-3 h-3 mr-1" />
                            Dispatch PFMS
                          </button>
                        )}

                        {batch.status === 'DISPATCHED_TO_PFMS' && (
                          <button
                            onClick={() => handleReconcile(batch.id)}
                            disabled={actionLoading}
                            className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded transition"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Reconcile Bank
                          </button>
                        )}

                        <button
                          onClick={() => handleGenerateTreasuryBill(batch.id)}
                          disabled={actionLoading}
                          className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition"
                        >
                          <FileCheck className="w-3 h-3 mr-1" />
                          Form TR-27
                        </button>

                        <Link
                          to={`/officer/dbt/batches/${batch.id}`}
                          className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded transition"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Batch Generator Modal */}
        {showBatchModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 flex items-center">
                  <Send className="w-5 h-5 text-emerald-600 mr-2" />
                  Generate Direct Benefit Transfer Batch
                </h3>
                <button onClick={() => setShowBatchModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <form onSubmit={handleGenerateBatch} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select Scholarship Scheme</label>
                  <select
                    value={selectedSchemeId}
                    onChange={(e) => setSelectedSchemeId(e.target.value)}
                    className="w-full text-sm border-slate-300 rounded-lg p-2 border focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  >
                    {schemes.map((s) => (
                      <option key={s.id} value={s.id}>{s.scheme_name || s.name} ({s.academic_year})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Allocation Cycle (Beneficiary Pool)</label>
                  <select
                    value={selectedCycleId}
                    onChange={(e) => setSelectedCycleId(e.target.value)}
                    className="w-full text-sm border-slate-300 rounded-lg p-2 border focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  >
                    {cycles.map((c) => (
                      <option key={c.id} value={c.id}>Cycle #{c.id.slice(0, 8)} - {c.academic_year} (Budget: ₹{c.total_budget?.toLocaleString()})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tranche Number</label>
                    <select
                      value={trancheNumber}
                      onChange={(e) => setTrancheNumber(e.target.value)}
                      className="w-full text-sm border-slate-300 rounded-lg p-2 border"
                    >
                      <option value={1}>Tranche 1 (Admission)</option>
                      <option value={2}>Tranche 2 (Progress/Sem 2)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tranche Percentage</label>
                    <input
                      type="number"
                      value={tranchePercentage}
                      onChange={(e) => setTranchePercentage(e.target.value)}
                      min="10"
                      max="100"
                      step="5"
                      className="w-full text-sm border-slate-300 rounded-lg p-2 border"
                      required
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">F-74 Split Payment Mechanism</p>
                    <p className="text-xs text-slate-500">60% Tuition to Institute + 40% Maintenance to Student</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={splitEnabled}
                    onChange={(e) => setSplitEnabled(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowBatchModal(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition"
                  >
                    {actionLoading ? 'Compiling Batch...' : 'Generate Batch'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CAG Audit Export Modal */}
        {cagModalOpen && cagData && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 flex items-center">
                  <ShieldCheck className="w-5 h-5 text-indigo-600 mr-2" />
                  CAG Compliance Audit Report & Hash Seal
                </h3>
                <button onClick={() => setCagModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <div className="bg-slate-900 text-slate-200 p-4 rounded-lg font-mono text-xs space-y-2">
                <p><span className="text-emerald-400 font-bold">Audit Seal (SHA-256):</span> {cagData.cag_audit_seal}</p>
                <p><span className="text-blue-400 font-bold">Financial Year:</span> {cagData.financial_year}</p>
                <p><span className="text-amber-400 font-bold">Major Head 2225 Expended:</span> ₹{cagData.treasury_ledger?.expended_amount?.toLocaleString()}</p>
                <p><span className="text-slate-400 font-bold">Total Transactions Audited:</span> {cagData.total_transactions_count}</p>
                <p><span className="text-slate-400 font-bold">Generated Timestamp:</span> {cagData.generated_at}</p>
              </div>

              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg">
                <table className="min-w-full text-xs divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-semibold">
                    <tr>
                      <th className="px-3 py-2 text-left">Beneficiary</th>
                      <th className="px-3 py-2 text-left">Type</th>
                      <th className="px-3 py-2 text-left">Amount</th>
                      <th className="px-3 py-2 text-left">UTR Number</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cagData.records.slice(0, 20).map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-3 py-1.5 font-medium">{r.beneficiary_name}</td>
                        <td className="px-3 py-1.5">{r.component_type}</td>
                        <td className="px-3 py-1.5 font-semibold text-emerald-700">₹{r.amount}</td>
                        <td className="px-3 py-1.5 font-mono text-slate-600">{r.utr_number || 'PENDING'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-200">
                <button
                  onClick={() => setCagModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-900 transition"
                >
                  Close Audit View
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default OfficerDbtWorkbenchPage;
