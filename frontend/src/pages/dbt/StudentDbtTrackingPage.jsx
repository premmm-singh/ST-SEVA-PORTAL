import React, { useState, useEffect } from 'react';
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Building,
  User,
  CreditCard,
  QrCode,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import dbtService from '../../services/dbtService';

const StudentDbtTrackingPage = () => {
  const [dbtRecords, setDbtRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Aadhaar Seeding Lookup State
  const [checkAadhaar, setCheckAadhaar] = useState('');
  const [seedingResult, setSeedingResult] = useState(null);
  const [seedingLoading, setSeedingLoading] = useState(false);

  // Penny Drop Validation State
  const [showPennyModal, setShowPennyModal] = useState(false);
  const [accNum, setAccNum] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [enteredName, setEnteredName] = useState('');
  const [pennyResult, setPennyResult] = useState(null);
  const [pennyLoading, setPennyLoading] = useState(false);

  // UPI Refund Mock State
  const [upiModalOpen, setUpiModalOpen] = useState(false);
  const [upiData, setUpiData] = useState(null);
  const [refundAmount, setRefundAmount] = useState(2500);

  useEffect(() => {
    loadDbtTimeline();
  }, []);

  const loadDbtTimeline = async () => {
    setLoading(true);
    try {
      const records = await dbtService.getMyDbtTimeline();
      setDbtRecords(records);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load DBT disbursement records');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckSeeding = async (e) => {
    e.preventDefault();
    if (!checkAadhaar || checkAadhaar.length < 4) return;
    setSeedingLoading(true);
    try {
      const res = await dbtService.getNpciSeedingStatus(checkAadhaar);
      setSeedingResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSeedingLoading(false);
    }
  };

  const handlePennyDropTest = async (e) => {
    e.preventDefault();
    setPennyLoading(true);
    setPennyResult(null);
    try {
      const res = await dbtService.verifyPennyDrop(accNum, ifsc, enteredName);
      setPennyResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setPennyLoading(false);
    }
  };

  const handleInitiateRefundUpi = async () => {
    try {
      const res = await dbtService.initiateUpiRefund(refundAmount, 'EXCESS_RECOVERY');
      setUpiData(res);
      setUpiModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header Breadcrumb */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
              <span>Student Services</span>
              <span>/</span>
              <span>Financial Benefits</span>
              <span>/</span>
              <span className="text-emerald-700 font-semibold">DBT Tracking</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1 flex items-center">
              <Send className="w-7 h-7 text-emerald-600 mr-2" />
              Direct Benefit Transfer (DBT) Tracker
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Track your scholarship disbursement milestones directly via PFMS and NPCI Aadhaar Payment Bridge System (APBS)
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowPennyModal(true)}
              className="inline-flex items-center px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-sm"
            >
              <CreditCard className="w-4 h-4 mr-1.5 text-slate-500" />
              Verify Bank (Penny Drop)
            </button>
            <button
              onClick={handleInitiateRefundUpi}
              className="inline-flex items-center px-3.5 py-2 border border-transparent rounded-lg text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 shadow-sm"
            >
              <QrCode className="w-4 h-4 mr-1.5" />
              Pay/Refund via UPI
            </button>
          </div>
        </div>

        {/* NPCI Aadhaar Seeding Checker Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center">
                <ShieldCheck className="w-4 h-4 text-emerald-600 mr-1.5" />
                NPCI Aadhaar Payment Bridge (APBS) Seeding Status
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Check whether your bank account is seeded with NPCI to receive direct DBT scholarship credits.
              </p>
            </div>

            <form onSubmit={handleCheckSeeding} className="flex items-center space-x-2 w-full md:w-auto">
              <input
                type="text"
                value={checkAadhaar}
                onChange={(e) => setCheckAadhaar(e.target.value)}
                placeholder="Enter last 4 digits or full Aadhaar"
                maxLength={12}
                className="text-xs border border-slate-300 rounded-lg px-3 py-2 w-full md:w-56 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
              <button
                type="submit"
                disabled={seedingLoading}
                className="px-3.5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition shrink-0"
              >
                {seedingLoading ? 'Checking...' : 'Check Status'}
              </button>
            </form>
          </div>

          {seedingResult && (
            <div className={`mt-4 p-3 rounded-lg text-xs border flex items-center justify-between ${
              seedingResult.is_seeded ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <div className="flex items-center space-x-2">
                {seedingResult.is_seeded ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <div>
                  <span className="font-bold">{seedingResult.message}</span>
                  {seedingResult.mandate_bank && (
                    <span className="ml-2 font-mono">Bank: {seedingResult.mandate_bank}</span>
                  )}
                </div>
              </div>
              <span className="font-semibold uppercase tracking-wider text-[11px] px-2 py-0.5 rounded bg-white/70">
                Status: {seedingResult.seeding_status}
              </span>
            </div>
          )}
        </div>

        {/* Disbursed Scholarships & Vertical Timeline */}
        {loading ? (
          <div className="bg-white p-12 rounded-xl text-center text-slate-500 text-sm shadow-sm border">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
            Loading your DBT tracking milestones...
          </div>
        ) : dbtRecords.length === 0 ? (
          <div className="bg-white p-12 rounded-xl text-center text-slate-500 text-sm shadow-sm border">
            <Send className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No DBT disbursement records found.</p>
            <p className="text-xs text-slate-400 mt-1">Once your scholarship is sanctioned by the District Welfare Officer, disbursement batches will appear here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {dbtRecords.map((record) => (
              <div key={record.transaction_id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        {record.component_type === 'TUITION_INSTITUTION' ? 'Institution Tuition Credit' : 'Student Maintenance DBT'}
                      </span>
                      <span className="text-xs font-mono text-slate-500">Tranche {record.tranche_number} ({record.tranche_percentage}%)</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">
                      {record.beneficiary_name}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      Sanction Order: {record.sanction_order_number || 'ST/SANCTION/2026'} | Bank: {record.bank_name} ({record.account_number_masked})
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</span>
                    <p className="text-2xl font-bold text-emerald-600">
                      ₹{record.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                    {record.utr_number && (
                      <p className="text-xs font-mono text-slate-700 font-semibold mt-0.5">
                        UTR: {record.utr_number}
                      </p>
                    )}
                  </div>
                </div>

                {/* UMANG-Style Vertical Milestone Timeline */}
                <div className="p-6">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
                    Disbursement Progress & Milestones
                  </h4>

                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {record.milestones?.map((step, idx) => {
                      const isDone = step.status === 'COMPLETED';
                      const isFail = step.status === 'FAILED';
                      return (
                        <div key={idx} className="relative flex items-start space-x-3">
                          <div className={`absolute -left-6 mt-0.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                            isDone ? 'border-emerald-600 bg-emerald-600 text-white' : (isFail ? 'border-red-600 bg-red-600 text-white' : 'border-slate-300')
                          }`}>
                            {isDone && <CheckCircle2 className="w-3 h-3 text-white" />}
                            {isFail && <AlertTriangle className="w-3 h-3 text-white" />}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className={`text-sm font-semibold ${isDone ? 'text-slate-900' : 'text-slate-500'}`}>
                                {step.title}
                              </p>
                              {step.timestamp && (
                                <span className="text-xs text-slate-400">
                                  {new Date(step.timestamp).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5">
                              {step.details}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Penny Drop Verification Modal */}
        {showPennyModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-base font-bold text-slate-900 flex items-center">
                  <CreditCard className="w-5 h-5 text-emerald-600 mr-2" />
                  Bank Account Penny Drop Validation
                </h3>
                <button onClick={() => setShowPennyModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <form onSubmit={handlePennyDropTest} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Account Holder Full Name</label>
                  <input
                    type="text"
                    value={enteredName}
                    onChange={(e) => setEnteredName(e.target.value)}
                    placeholder="Enter name as on Aadhaar card"
                    className="w-full text-sm border-slate-300 rounded-lg p-2 border"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Account Number</label>
                  <input
                    type="text"
                    value={accNum}
                    onChange={(e) => setAccNum(e.target.value)}
                    placeholder="Enter account number"
                    className="w-full text-sm border-slate-300 rounded-lg p-2 border"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value)}
                    placeholder="e.g. SBIN0000001"
                    className="w-full text-sm border-slate-300 rounded-lg p-2 border uppercase"
                    required
                  />
                </div>

                {pennyResult && (
                  <div className={`p-3 rounded-lg text-xs border ${
                    pennyResult.status === 'MATCHED' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}>
                    <p className="font-bold flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" />
                      Status: {pennyResult.status} (Match Confidence: {(pennyResult.similarity_score * 100).toFixed(1)}%)
                    </p>
                    <p className="mt-1 font-mono">Bank: {pennyResult.bank_name} | Ref: {pennyResult.reference_ref}</p>
                    <p className="mt-0.5 text-slate-500">Core Banking Name: {pennyResult.returned_name}</p>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setShowPennyModal(false)}
                    className="px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-700 hover:bg-slate-50"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={pennyLoading}
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700 transition"
                  >
                    {pennyLoading ? 'Executing Drop...' : 'Run Penny Drop (₹1.00)'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* UPI Mock Modal */}
        {upiModalOpen && upiData && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-6 text-center space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center justify-center">
                <QrCode className="w-5 h-5 text-emerald-600 mr-2" />
                Bharat QR / UPI Payment Gateway
              </h3>
              <p className="text-xs text-slate-600">
                Scan with any UPI app (BHIM, Google Pay, PhonePe) to process fee recovery of ₹{upiData.amount}.
              </p>

              <div className="p-4 bg-slate-100 rounded-lg inline-block mx-auto border-2 border-dashed border-slate-300">
                {/* Visual mock QR placeholder */}
                <div className="w-40 h-40 bg-white p-2 rounded flex flex-col items-center justify-center border font-mono text-[10px] text-slate-500">
                  <QrCode className="w-24 h-24 text-slate-800 mb-1" />
                  <span>Scan to Pay UPI</span>
                </div>
              </div>

              <div className="text-xs text-left bg-slate-50 p-2.5 rounded font-mono space-y-1">
                <p><span className="text-slate-500">VPA:</span> {upiData.payee_vpa}</p>
                <p><span className="text-slate-500">Txn Ref:</span> {upiData.transaction_reference}</p>
                <p><span className="text-slate-500">Amount:</span> ₹{upiData.amount}</p>
              </div>

              <div className="pt-2 border-t">
                <button
                  onClick={() => setUpiModalOpen(false)}
                  className="w-full py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default StudentDbtTrackingPage;
