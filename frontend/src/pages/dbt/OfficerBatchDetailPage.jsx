import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  RefreshCw,
  Building,
  User,
  ShieldCheck,
  RotateCcw,
  Code
} from 'lucide-react';
import dbtService from '../../services/dbtService';

const OfficerBatchDetailPage = () => {
  const { id } = useParams();
  const [batch, setBatch] = useState(null);
  const [treasuryBill, setTreasuryBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Retry Modal State
  const [retryModalOpen, setRetryModalOpen] = useState(false);
  const [targetTx, setTargetTx] = useState(null);
  const [newAcc, setNewAcc] = useState('');
  const [newIfsc, setNewIfsc] = useState('');

  // Reversal Modal State
  const [reverseModalOpen, setReverseModalOpen] = useState(false);
  const [reverseTx, setReverseTx] = useState(null);
  const [reverseReason, setReverseReason] = useState('');

  // XML Payload Viewer Modal
  const [xmlModalOpen, setXmlModalOpen] = useState(false);

  useEffect(() => {
    loadBatchDetail();
  }, [id]);

  const loadBatchDetail = async () => {
    setLoading(true);
    try {
      const [batchData, tbData] = await Promise.all([
        dbtService.getPaymentBatchDetail(id),
        dbtService.getTreasuryBill(id)
      ]);
      setBatch(batchData);
      setTreasuryBill(tbData);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load payment batch details');
    } finally {
      setLoading(false);
    }
  };

  const handleRetrySubmit = async (e) => {
    e.preventDefault();
    if (!targetTx) return;
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await dbtService.retryFailedTransaction(targetTx.id, newAcc || null, newIfsc || null);
      setSuccessMsg(`Transaction ${targetTx.id.slice(0, 8)} successfully reset for retry with verified status.`);
      setRetryModalOpen(false);
      await loadBatchDetail();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Failed to retry transaction');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReverseSubmit = async (e) => {
    e.preventDefault();
    if (!reverseTx) return;
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await dbtService.reverseTransaction(reverseTx.id, reverseReason);
      setSuccessMsg(`Disbursement transaction reversed and budget restored to Treasury Ledger.`);
      setReverseModalOpen(false);
      await loadBatchDetail();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Failed to reverse transaction');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CREDIT_CONFIRMED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3 h-3 mr-1" /> Credit Confirmed</span>;
      case 'SENT_TO_PFMS':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"><Send className="w-3 h-3 mr-1" /> Sent to PFMS</span>;
      case 'FAILED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" /> Credit Failed</span>;
      case 'REVERSED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800"><RotateCcw className="w-3 h-3 mr-1" /> Reversed</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800"><Clock className="w-3 h-3 mr-1" /> {status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
          Loading payment batch details...
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 text-center">
        <p className="text-red-600">Payment batch not found.</p>
        <Link to="/officer/dbt" className="text-emerald-700 underline mt-4 inline-block">Return to DBT Workbench</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Back navigation */}
        <Link to="/officer/dbt" className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to DBT Workbench
        </Link>

        {/* Batch Overview Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold font-mono text-slate-900">{batch.batch_number}</h1>
                {getStatusBadge(batch.status)}
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Scheme ID: {batch.scheme_id} | Created on {new Date(batch.created_at).toLocaleDateString()}
              </p>
              {batch.pfms_reference_id && (
                <p className="text-xs font-mono text-blue-700 mt-1">
                  PFMS Reference ID: {batch.pfms_reference_id}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setXmlModalOpen(true)}
                className="inline-flex items-center px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50"
              >
                <Code className="w-3.5 h-3.5 mr-1 text-slate-500" />
                View PFMS XML Payload
              </button>

              <div className="text-right pl-4 border-l border-slate-200">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Net Amount</span>
                <p className="text-2xl font-bold text-emerald-600">
                  ₹{batch.total_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Form TR-27 Treasury Bill Notice if Present */}
          {treasuryBill && (
            <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center">
                <ShieldCheck className="w-5 h-5 text-indigo-700 mr-2 shrink-0" />
                <div className="text-xs text-indigo-900">
                  <span className="font-bold">Form TR-27 Treasury Bill #{treasuryBill.bill_number} Signed.</span> Token: <span className="font-mono">{treasuryBill.token_number}</span> | Digital Seal: <span className="font-mono">{treasuryBill.digital_sign_hash?.slice(0, 16)}...</span>
                </div>
              </div>
              <span className="text-xs font-semibold text-indigo-800 uppercase px-2 py-0.5 bg-indigo-100 rounded">Treasury Pass: 2 Days</span>
            </div>
          )}
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg text-sm text-red-800">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg text-sm text-emerald-800">
            {successMsg}
          </div>
        )}

        {/* Transactions Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-900">
              Disbursement Transactions ({batch.transactions?.length || 0})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Includes split tuition payments to academic institutions and direct maintenance credits to students.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-6 py-3 text-left">Beneficiary & Component</th>
                  <th className="px-6 py-3 text-left">Bank & Account</th>
                  <th className="px-6 py-3 text-left">Amount</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">RBI UTR Number</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {batch.transactions?.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {tx.component_type === 'TUITION_INSTITUTION' ? (
                          <Building className="w-4 h-4 text-indigo-600 shrink-0" />
                        ) : (
                          <User className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                        <div>
                          <p className="font-semibold text-slate-900">{tx.beneficiary_name}</p>
                          <p className="text-xs text-slate-500 font-mono">
                            {tx.component_type === 'TUITION_INSTITUTION' ? 'Tuition Fee (Institution Credit)' : 'Maintenance Allowance (Student DBT)'}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs">
                      <p className="font-medium text-slate-800">{tx.bank_name}</p>
                      <p className="text-slate-500 font-mono">{tx.account_number_masked} | IFSC: {tx.ifsc_code}</p>
                    </td>

                    <td className="px-6 py-4 font-semibold text-emerald-700">
                      ₹{tx.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="px-6 py-4">
                      {getStatusBadge(tx.status)}
                      {tx.failure_reason && (
                        <p className="text-xs text-red-600 mt-1 max-w-xs">{tx.failure_reason}</p>
                      )}
                    </td>

                    <td className="px-6 py-4 font-mono text-xs">
                      {tx.utr_number ? (
                        <span className="font-bold text-slate-900">{tx.utr_number}</span>
                      ) : (
                        <span className="text-slate-400 italic">Awaiting Credit</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right space-x-2">
                      {tx.status === 'FAILED' && (
                        <button
                          onClick={() => {
                            setTargetTx(tx);
                            setRetryModalOpen(true);
                          }}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded transition"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Retry ({tx.retry_count}/3)
                        </button>
                      )}

                      {tx.status === 'CREDIT_CONFIRMED' && (
                        <button
                          onClick={() => {
                            setReverseTx(tx);
                            setReverseModalOpen(true);
                          }}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded transition"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Reverse
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Retry Modal */}
        {retryModalOpen && targetTx && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center">
                <RefreshCw className="w-5 h-5 text-amber-600 mr-2" />
                Retry Failed Disbursement Transaction
              </h3>
              <p className="text-xs text-slate-600">
                Update account details for <span className="font-semibold">{targetTx.beneficiary_name}</span>. Current attempt: #{targetTx.retry_count + 1}
              </p>

              <form onSubmit={handleRetrySubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">New Bank Account Number</label>
                  <input
                    type="text"
                    value={newAcc}
                    onChange={(e) => setNewAcc(e.target.value)}
                    placeholder="Enter updated account number"
                    className="w-full text-sm border-slate-300 rounded-lg p-2 border"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">New IFSC Code</label>
                  <input
                    type="text"
                    value={newIfsc}
                    onChange={(e) => setNewIfsc(e.target.value)}
                    placeholder="e.g. SBIN0000001"
                    className="w-full text-sm border-slate-300 rounded-lg p-2 border uppercase"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setRetryModalOpen(false)}
                    className="px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-amber-600 text-white rounded text-xs font-medium hover:bg-amber-700 transition"
                  >
                    Queue for Retry
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reversal Modal */}
        {reverseModalOpen && reverseTx && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center">
                <RotateCcw className="w-5 h-5 text-purple-600 mr-2" />
                Reverse Confirmed Disbursement
              </h3>
              <p className="text-xs text-slate-600">
                You are initiating a financial revocation of ₹{reverseTx.amount} for <span className="font-semibold">{reverseTx.beneficiary_name}</span>. Funds will be restored to the State Treasury ledger.
              </p>

              <form onSubmit={handleReverseSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Statutory Reason for Revocation</label>
                  <textarea
                    value={reverseReason}
                    onChange={(e) => setReverseReason(e.target.value)}
                    placeholder="e.g. Beneficiary availed dual scholarship or course discontinued"
                    className="w-full text-sm border-slate-300 rounded-lg p-2 border"
                    rows="3"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setReverseModalOpen(false)}
                    className="px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700 transition"
                  >
                    Confirm Reversal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* XML Viewer Modal */}
        {xmlModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-3xl w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-base font-bold text-slate-900 font-mono">PFMS XML E-Payment Request Payload</h3>
                <button onClick={() => setXmlModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <pre className="bg-slate-900 text-emerald-400 p-4 rounded-lg text-xs font-mono max-h-96 overflow-y-auto">
                {batch.xml_payload || '<!-- XML Payload will be generated upon dispatch to PFMS -->'}
              </pre>

              <div className="flex justify-end pt-2 border-t">
                <button
                  onClick={() => setXmlModalOpen(false)}
                  className="px-4 py-1.5 bg-slate-800 text-white rounded text-xs hover:bg-slate-900"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default OfficerBatchDetailPage;
