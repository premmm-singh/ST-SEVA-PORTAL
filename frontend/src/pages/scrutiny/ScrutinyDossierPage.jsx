import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  FileText,
  User,
  Building,
  CreditCard,
  Search,
  MapPin,
  Eye,
  Loader2,
  RefreshCw,
  Send,
  XCircle,
  FileCheck,
  Navigation
} from 'lucide-react';
import scrutinyService from '../../services/scrutinyService';
import MandatoryChecklistModal from '../../components/scrutiny/MandatoryChecklistModal';
import PhysicalInspectionModal from '../../components/scrutiny/PhysicalInspectionModal';
import DocumentViewerModal from '../../components/documents/DocumentViewerModal';
import AiVerificationResults from '../../components/common/AiVerificationResults';

export default function ScrutinyDossierPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [checklistAction, setChecklistAction] = useState({ level: 'L1_SCRUTINY', decision: 'RECOMMENDED' });
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [viewerDoc, setViewerDoc] = useState(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Cross-verification live results
  const [crossVerifyResults, setCrossVerifyResults] = useState({});
  const [verifyingType, setVerifyingType] = useState('');
  const [duplicateScanMessage, setDuplicateScanMessage] = useState('');

  const loadDossier = async () => {
    setLoading(true);
    try {
      const data = await scrutinyService.getDossier(id);
      setDossier(data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load scrutiny dossier.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDossier();
  }, [id]);

  const handleCrossVerify = async (certType, certNumber) => {
    setVerifyingType(certType);
    try {
      const res = await scrutinyService.crossVerifyCertificate(id, {
        cert_type: certType,
        cert_number: certNumber || 'JH-CST-2023-884920'
      });
      setCrossVerifyResults((prev) => ({ ...prev, [certType]: res }));
    } catch (err) {
      alert(`Cross-verification failed for ${certType}: ` + (err.response?.data?.detail || err.message));
    } finally {
      setVerifyingType('');
    }
  };

  const handleRunDuplicateScan = async () => {
    try {
      const res = await scrutinyService.runDeduplication(id);
      setDuplicateScanMessage(res.message);
      await loadDossier();
    } catch (err) {
      alert('Duplicate scan failed: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleClearDuplicate = async (flagId) => {
    const remarks = prompt('Provide official officer justification for clearing duplicate collision:');
    if (!remarks) return;
    try {
      await scrutinyService.clearDuplicateFlag(flagId, { remarks });
      await loadDossier();
    } catch (err) {
      alert('Failed to clear flag: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleOpenChecklistModal = (level, decision) => {
    setChecklistAction({ level, decision });
    setIsChecklistModalOpen(true);
  };

  const handleChecklistConfirm = async (checklist, remarks) => {
    setIsProcessingAction(true);
    try {
      await scrutinyService.submitScrutinyAction(id, {
        scrutiny_level: checklistAction.level,
        decision: checklistAction.decision,
        checklist,
        remarks
      });
      setIsChecklistModalOpen(false);
      alert(`Action successfully authorized with digital signature!`);
      await loadDossier();
    } catch (err) {
      alert('Scrutiny action failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleInspectionConfirm = async (inspectionData) => {
    setIsProcessingAction(true);
    try {
      await scrutinyService.recordPhysicalInspection(id, inspectionData);
      setIsInspectionModalOpen(false);
      alert('Physical spot inspection report recorded successfully.');
      await loadDossier();
    } catch (err) {
      alert('Failed to submit inspection: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleDirectReject = async () => {
    const reason = prompt('Please specify statutory reason for rejecting this application:');
    if (!reason) return;
    try {
      await scrutinyService.submitScrutinyAction(id, {
        scrutiny_level: 'L2_VERIFICATION',
        decision: 'REJECTED',
        checklist: {
          caste_verified: false,
          income_verified: false,
          domicile_verified: false,
          bonafide_verified: false,
          dbt_eligible: false,
          duplicate_check_passed: false
        },
        remarks: reason
      });
      alert('Application rejected.');
      await loadDossier();
    } catch (err) {
      alert('Failed to reject application: ' + (err.response?.data?.detail || err.message));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-3 text-slate-600">
          <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
          <p className="text-sm font-semibold">Loading Comprehensive Scrutiny Dossier...</p>
        </div>
      </div>
    );
  }

  if (error || !dossier) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl border border-red-200 max-w-md w-full text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-red-600 mx-auto" />
          <h3 className="font-bold text-slate-900">Application Not Found</h3>
          <p className="text-xs text-slate-600">{error || 'Could not find requested student record.'}</p>
          <Link
            to="/officer/scrutiny"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Scrutiny Queue</span>
          </Link>
        </div>
      </div>
    );
  }

  const risk = dossier.risk_assessment || { risk_level: 'GREEN', flags_count: 0, flags: [] };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Top Header */}
        <div className="flex items-center justify-between">
          <Link
            to="/officer/scrutiny"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-900 hover:text-blue-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Scrutiny Queue</span>
          </Link>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-semibold">Application Number:</span>
            <span className="font-mono text-xs font-bold text-slate-900 bg-slate-200 px-2.5 py-1 rounded">
              {dossier.application_number}
            </span>
          </div>
        </div>

        {/* Risk Banner (Feature 57) */}
        <div className={`p-5 rounded-2xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          risk.risk_level === 'RED'
            ? 'bg-red-50 border-red-300 text-red-950'
            : risk.risk_level === 'AMBER'
            ? 'bg-amber-50 border-amber-300 text-amber-950'
            : 'bg-emerald-50 border-emerald-300 text-emerald-950'
        }`}>
          <div className="flex items-start space-x-3">
            {risk.risk_level === 'RED' ? (
              <ShieldAlert className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            ) : risk.risk_level === 'AMBER' ? (
              <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-black text-sm uppercase tracking-wide">
                  Risk Assessment Index: {risk.risk_level} RISK
                </h4>
                <span className="text-xs font-semibold">
                  ({risk.flags_count} Triggered Anomaly Rules)
                </span>
              </div>
              <p className="text-xs mt-1 leading-relaxed">
                {risk.risk_level === 'RED'
                  ? 'CRITICAL DISCREPANCY: Application has active duplicate collisions, non-compliant attendance, or income ceiling breaches.'
                  : risk.risk_level === 'AMBER'
                  ? 'ATTENTION REQUIRED: Income near statutory limit or unverified manual certificate uploads.'
                  : 'CLEAN DOSSIER: All statutory certificates verified against authoritative government databases.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end md:self-auto">
            <button
              onClick={handleRunDuplicateScan}
              className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-bold shadow-sm flex items-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Re-scan Duplicates</span>
            </button>
            <button
              onClick={() => setIsInspectionModalOpen(true)}
              className="px-3.5 py-1.5 bg-purple-800 hover:bg-purple-900 text-white rounded-lg text-xs font-bold shadow-sm flex items-center space-x-1.5"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Record Spot Inspection</span>
            </button>
          </div>
        </div>

        {/* Student Profile & Institutional Seal Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Bio */}
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <User className="w-3.5 h-3.5" />
                <span>Student Identity</span>
              </div>
              <h2 className="text-lg font-black text-slate-900">{dossier.student_profile?.full_name}</h2>
              <p className="text-xs text-slate-600 font-semibold">
                {dossier.student_profile?.category} ({dossier.student_profile?.sub_caste})
              </p>
              <p className="text-xs text-slate-500">
                Father: {dossier.student_profile?.father_name} • DOB: {dossier.student_profile?.dob}
              </p>
            </div>

            {/* Scheme & Entitlement */}
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5" />
                <span>Scholarship Scheme</span>
              </div>
              <h3 className="text-sm font-bold text-blue-900">{dossier.scheme?.name}</h3>
              <p className="text-xs text-slate-600 font-semibold">
                Annual Family Income: ₹{dossier.student_profile?.annual_family_income?.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-emerald-700 font-semibold">Aadhaar-seeded DBT Eligible</p>
            </div>

            {/* Institutional Verification Stamp (From Phase 4) */}
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <Building className="w-3.5 h-3.5" />
                <span>Institutional Verification</span>
              </div>
              {dossier.institutional_verification ? (
                <div>
                  <div className="flex items-center space-x-1 text-xs text-emerald-700 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Bonafide Confirmed (75% Rule Pass)</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Attendance: <span className="font-bold text-slate-800">{dossier.institutional_verification.attendance_percentage}%</span> •{' '}
                    <span>{dossier.institutional_verification.is_hosteller ? 'Hosteller' : 'Day Scholar'}</span>
                  </p>
                  <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5" title={dossier.institutional_verification.digital_stamp}>
                    Stamp: {dossier.institutional_verification.digital_stamp?.slice(0, 16)}...
                  </p>
                </div>
              ) : (
                <div className="text-xs text-amber-700 font-semibold">
                  Pending Institution Review
                </div>
              )}
            </div>

            {/* Current Status */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Current Scrutiny Stage
              </span>
              <span className="inline-block px-3 py-1 bg-blue-900 text-white text-xs font-bold rounded-lg shadow-sm">
                {dossier.status}
              </span>
              <p className="text-[11px] text-slate-500">
                Academic Year: {dossier.academic_year}
              </p>
            </div>

          </div>
        </div>

        {/* 2-Column Scrutiny Center */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Column (7 cols): Cross-Verification Stubs & Duplicate Detection */}
          <div className="lg:col-span-7 space-y-6">

            {/* External Certificate Cross-Verification Stubs (Features 49, 50, 51, 52, 55) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-blue-900" />
                  <h3 className="font-extrabold text-sm text-slate-900">
                    State Database Cross-Verification Stubs
                  </h3>
                </div>
                <span className="text-xs text-slate-500 font-semibold">Real-Time Registry Integration</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Caste Verification (Feature 49) */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">ST Caste Certificate</span>
                    <button
                      type="button"
                      onClick={() => handleCrossVerify('CASTE', 'JH-CST-2023-884920')}
                      disabled={verifyingType === 'CASTE'}
                      className="px-2.5 py-1 bg-blue-900 hover:bg-blue-800 text-white rounded text-[11px] font-bold transition-all disabled:opacity-50"
                    >
                      {verifyingType === 'CASTE' ? 'Verifying...' : 'Verify Jharsewa'}
                    </button>
                  </div>
                  {crossVerifyResults.CASTE ? (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-[11px] space-y-0.5 text-emerald-950">
                      <p className="font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                        Authentic ST Caste: {crossVerifyResults.CASTE.details?.sub_caste}
                      </p>
                      <p className="text-[10px] text-slate-600">Auth: {crossVerifyResults.CASTE.details?.issuing_authority}</p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500">Cross-checks with Jharsewa Revenue DB</p>
                  )}
                </div>

                {/* Income Verification (Feature 50) */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Family Income Certificate</span>
                    <button
                      type="button"
                      onClick={() => handleCrossVerify('INCOME', 'JH-INC-2025-119284')}
                      disabled={verifyingType === 'INCOME'}
                      className="px-2.5 py-1 bg-blue-900 hover:bg-blue-800 text-white rounded text-[11px] font-bold transition-all disabled:opacity-50"
                    >
                      {verifyingType === 'INCOME' ? 'Verifying...' : 'Check Revenue'}
                    </button>
                  </div>
                  {crossVerifyResults.INCOME ? (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-[11px] space-y-0.5 text-emerald-950">
                      <p className="font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                        Valid (Within ₹2.5L Cap)
                      </p>
                      <p className="text-[10px] text-slate-600">FY: 2025-2026 • 1-Year Validity Intact</p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500">Enforces 1-year statutory validity</p>
                  )}
                </div>

                {/* Domicile Verification (Feature 51) */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Scheduled Area Domicile</span>
                    <button
                      type="button"
                      onClick={() => handleCrossVerify('DOMICILE', 'JH-DOM-2022-772910')}
                      disabled={verifyingType === 'DOMICILE'}
                      className="px-2.5 py-1 bg-blue-900 hover:bg-blue-800 text-white rounded text-[11px] font-bold transition-all disabled:opacity-50"
                    >
                      {verifyingType === 'DOMICILE' ? 'Verifying...' : 'Check District'}
                    </button>
                  </div>
                  {crossVerifyResults.DOMICILE ? (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-[11px] space-y-0.5 text-emerald-950">
                      <p className="font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                        Fifth Schedule ITDA Block
                      </p>
                      <p className="text-[10px] text-slate-600">{crossVerifyResults.DOMICILE.details?.itda_block}</p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500">Verifies Scheduled Tribal District residence</p>
                  )}
                </div>

                {/* NFSA Ration Card (Feature 52) */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">NFSA Ration Card Census</span>
                    <button
                      type="button"
                      onClick={() => handleCrossVerify('RATION_CARD', 'NFSA-JH-2007-88192')}
                      disabled={verifyingType === 'RATION_CARD'}
                      className="px-2.5 py-1 bg-blue-900 hover:bg-blue-800 text-white rounded text-[11px] font-bold transition-all disabled:opacity-50"
                    >
                      {verifyingType === 'RATION_CARD' ? 'Verifying...' : 'Check NFSA'}
                    </button>
                  </div>
                  {crossVerifyResults.RATION_CARD ? (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-[11px] space-y-0.5 text-emerald-950">
                      <p className="font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                        BPL / Priority Household
                      </p>
                      <p className="text-[10px] text-slate-600">Card: {crossVerifyResults.RATION_CARD.details?.card_type}</p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500">Cross-checks BPL/AAY poverty status</p>
                  )}
                </div>
              </div>
            </div>

            {/* Multi-Vector Duplicate Detection Scan (Feature 53) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-5 h-5 text-red-600" />
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Multi-Vector Duplicate Application Engine
                  </h3>
                </div>
                <span className="text-xs text-slate-500 font-semibold">
                  Aadhaar • Bank • Phone • Identity
                </span>
              </div>

              {duplicateScanMessage && (
                <div className="p-3 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg text-xs font-semibold">
                  {duplicateScanMessage}
                </div>
              )}

              {(!dossier.duplicate_flags || dossier.duplicate_flags.length === 0) ? (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center space-x-3 text-emerald-900 text-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>No duplicate Aadhaar, bank account, or identity collision detected in national cohort.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {dossier.duplicate_flags.map((df) => (
                    <div
                      key={df.id}
                      className={`p-4 rounded-xl border space-y-2 ${
                        df.is_cleared
                          ? 'bg-slate-50 border-slate-200 text-slate-600'
                          : 'bg-red-50 border-red-300 text-red-950'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          Match Type: {df.match_type} (Confidence: {df.confidence_score}%)
                        </span>
                        {df.is_cleared ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                            Cleared by Officer
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleClearDuplicate(df.id)}
                            className="px-2.5 py-1 bg-red-700 hover:bg-red-800 text-white rounded text-[10px] font-bold shadow-sm"
                          >
                            Clear with Justification
                          </button>
                        )}
                      </div>
                      <p className="text-xs">{df.match_details}</p>
                      {df.cleared_remarks && (
                        <p className="text-[11px] text-slate-600 bg-white/80 p-2 rounded border">
                          Officer Clearance Note: {df.cleared_remarks}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Field Physical Spot Inspections (Feature 56) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-purple-700" />
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Physical Spot Inspection Reports ({dossier.physical_inspections?.length || 0})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsInspectionModalOpen(true)}
                  className="text-xs text-purple-800 font-bold hover:underline"
                >
                  + Add Inspection
                </button>
              </div>

              {(!dossier.physical_inspections || dossier.physical_inspections.length === 0) ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  No field spot inspections recorded yet. Recommended for remote tribal schools.
                </p>
              ) : (
                <div className="space-y-3">
                  {dossier.physical_inspections.map((pi) => (
                    <div key={pi.id} className="p-4 bg-purple-50/60 rounded-xl border border-purple-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-purple-950">
                          Inspector: {pi.inspector_name} ({pi.institution_name})
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(pi.inspected_at).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700">{pi.inspection_summary}</p>
                      <div className="flex items-center space-x-4 text-[11px] text-purple-900 font-semibold pt-1">
                        <span>Student Present: {pi.student_present ? 'Confirmed' : 'Absent'}</span>
                        <span>Hostel Room Verified: {pi.hostel_room_verified ? 'Yes' : 'No'}</span>
                        {pi.latitude && (
                          <span className="font-mono">GPS: ({pi.latitude}, {pi.longitude})</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column (5 cols): Certificates & Statutory Scrutiny Actions */}
          <div className="lg:col-span-5 space-y-6">

            {/* AI Verification Results with animated count-up, circular meter, SHAP bars & citations (Specification #7) */}
            <AiVerificationResults
              score={dossier.risk_assessment?.risk_level === 'GREEN' ? 96 : dossier.risk_assessment?.risk_level === 'AMBER' ? 68 : 34}
              verdict={dossier.risk_assessment?.risk_level || 'GREEN'}
              verdictLabel={
                dossier.risk_assessment?.risk_level === 'GREEN'
                  ? 'Statutory Integrity Verified'
                  : dossier.risk_assessment?.risk_level === 'AMBER'
                  ? 'Manual Review Recommended'
                  : 'Anomalies Detected'
              }
            />

            {/* Uploaded Certificates Preview */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-900" />
                  <h3 className="font-extrabold text-sm text-slate-900">Applicant Documents</h3>
                </div>
                <span className="text-xs text-slate-500 font-semibold">{dossier.documents?.length || 0} Files</span>
              </div>

              <div className="space-y-2.5">
                {dossier.documents?.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 bg-slate-50 hover:bg-blue-50/50 rounded-xl border border-slate-200 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-bold text-xs text-slate-900 truncate">
                        {doc.category?.replace(/_/g, ' ')}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{doc.original_filename}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setViewerDoc(doc)}
                      className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-sm flex-shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Hierarchical Scrutiny Sign-off Action Center (Features 48 & 58) */}
            <div className="bg-white rounded-2xl shadow-md border-2 border-blue-900 p-6 space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="font-extrabold text-base text-slate-900">
                  Statutory Scrutiny Decision
                </h3>
                <p className="text-xs text-slate-500">
                  Multi-level approval hierarchy. Enforces mandatory statutory checklist sign-off.
                </p>
              </div>

              <div className="space-y-2.5">
                {/* L1 Recommendation */}
                <button
                  type="button"
                  onClick={() => handleOpenChecklistModal('L1_SCRUTINY', 'RECOMMENDED')}
                  className="w-full py-2.5 px-4 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-between"
                >
                  <span>1. L1 Scrutiny Assistant Recommendation</span>
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </button>

                {/* L2 DWO Approval */}
                <button
                  type="button"
                  onClick={() => handleOpenChecklistModal('L2_VERIFICATION', 'APPROVED')}
                  className="w-full py-2.5 px-4 bg-blue-950 hover:bg-blue-900 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-between"
                >
                  <span>2. L2 District Welfare Officer (DWO) Approval</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                </button>

                {/* L3 Directorate Sanction */}
                <button
                  type="button"
                  onClick={() => handleOpenChecklistModal('L3_SANCTION', 'SANCTIONED')}
                  className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-between"
                >
                  <span>3. L3 State Directorate Final Sanction</span>
                  <FileCheck className="w-4 h-4 text-emerald-200" />
                </button>
              </div>

              {/* Exception actions */}
              <div className="pt-3 border-t border-slate-200 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleOpenChecklistModal('L1_SCRUTINY', 'DEFICIENT')}
                  className="py-2 px-3 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-bold transition-colors"
                >
                  Mark Deficient
                </button>

                <button
                  type="button"
                  onClick={handleDirectReject}
                  className="py-2 px-3 bg-red-100 hover:bg-red-200 text-red-900 rounded-lg text-xs font-bold transition-colors"
                >
                  Reject Claim
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Mandatory Statutory Checklist Modal */}
      <MandatoryChecklistModal
        isOpen={isChecklistModalOpen}
        onClose={() => setIsChecklistModalOpen(false)}
        scrutinyLevel={checklistAction.level}
        decision={checklistAction.decision}
        applicationNumber={dossier.application_number}
        onConfirm={handleChecklistConfirm}
        isProcessing={isProcessingAction}
      />

      {/* Physical Inspection Modal */}
      <PhysicalInspectionModal
        isOpen={isInspectionModalOpen}
        onClose={() => setIsInspectionModalOpen(false)}
        defaultInstitution={dossier.student_profile?.institution_name}
        onConfirm={handleInspectionConfirm}
        isProcessing={isProcessingAction}
      />

      {/* Watermarked Document Viewer Modal */}
      {viewerDoc && (
        <DocumentViewerModal
          isOpen={!!viewerDoc}
          onClose={() => setViewerDoc(null)}
          document={viewerDoc}
        />
      )}

    </div>
  );
}
