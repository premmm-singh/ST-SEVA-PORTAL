import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  GraduationCap,
  Home,
  Receipt,
  FileCheck,
  Loader2,
  Send,
  Eye,
  ExternalLink,
  Award
} from 'lucide-react';
import institutionService from '../../services/institutionService';
import DefectReturnModal from '../../components/institutions/DefectReturnModal';
import DocumentViewerModal from '../../components/documents/DocumentViewerModal';

export default function StudentVerificationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Verification Checklist Form State
  const [bonafideConfirmed, setBonafideConfirmed] = useState(true);
  const [rollNumber, setRollNumber] = useState('');
  const [admissionYear, setAdmissionYear] = useState(2023);
  const [attendancePercentage, setAttendancePercentage] = useState(82.5);
  const [attendanceRemarks, setAttendanceRemarks] = useState('');
  const [isHosteller, setIsHosteller] = useState(false);
  const [hostelName, setHostelName] = useState('');
  const [hostelRoomNo, setHostelRoomNo] = useState('');
  const [academicVerified, setAcademicVerified] = useState(true);
  const [previousYearPercentage, setPreviousYearPercentage] = useState(78.5);
  const [cgpa, setCgpa] = useState(8.2);
  const [hasBacklogs, setHasBacklogs] = useState(false);
  const [officialRemarks, setOfficialRemarks] = useState('Recommended for full ST scholarship benefit.');

  // Modals state
  const [isDefectModalOpen, setIsDefectModalOpen] = useState(false);
  const [isDefectSubmitting, setIsDefectSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [viewerDoc, setViewerDoc] = useState(null);
  const [successStamp, setSuccessStamp] = useState(null);

  useEffect(() => {
    async function fetchDetails() {
      setLoading(true);
      try {
        const data = await institutionService.getApplicationDetails(id);
        setDossier(data);
        if (data.academic_details?.roll_number) {
          setRollNumber(data.academic_details.roll_number);
        }
        if (data.existing_verification) {
          const ev = data.existing_verification;
          setBonafideConfirmed(ev.bonafide_confirmed);
          setAttendancePercentage(ev.attendance_percentage);
          setIsHosteller(ev.is_hosteller);
          setHostelName(ev.hostel_name || '');
          setSuccessStamp(ev.digital_stamp);
        }
      } catch (err) {
        setError(err.response?.data?.detail || err.message || 'Failed to load verification dossier.');
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [id]);

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setIsVerifying(true);
    try {
      const payload = {
        bonafide_confirmed: bonafideConfirmed,
        roll_number: rollNumber,
        admission_year: parseInt(admissionYear, 10),
        attendance_percentage: parseFloat(attendancePercentage),
        attendance_remarks: attendanceRemarks || undefined,
        is_hosteller: isHosteller,
        hostel_name: isHosteller ? hostelName : undefined,
        hostel_room_no: isHosteller ? hostelRoomNo : undefined,
        academic_verified: academicVerified,
        previous_year_percentage: previousYearPercentage ? parseFloat(previousYearPercentage) : undefined,
        cgpa: cgpa ? parseFloat(cgpa) : undefined,
        has_uncleared_backlogs: hasBacklogs,
        remarks: officialRemarks
      };

      const res = await institutionService.verifyApplication(id, payload);
      setSuccessStamp(res.digital_stamp);
      alert('Application successfully verified and digitally sealed!');
    } catch (err) {
      alert('Verification submission failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDefectConfirm = async (defectData) => {
    setIsDefectSubmitting(true);
    try {
      await institutionService.returnDefectiveApplication(id, defectData);
      setIsDefectModalOpen(false);
      alert('Defect notice issued to student successfully.');
      navigate('/institution/dashboard');
    } catch (err) {
      alert('Failed to return defective application: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsDefectSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-3 text-slate-600">
          <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
          <p className="text-sm font-semibold">Loading Student Verification Dossier...</p>
        </div>
      </div>
    );
  }

  if (error || !dossier) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl border border-red-200 max-w-md w-full text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-red-600 mx-auto" />
          <h3 className="font-bold text-slate-900">Access Denied or Not Found</h3>
          <p className="text-xs text-slate-600">{error || 'Could not find requested student record.'}</p>
          <Link
            to="/institution/dashboard"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const isAttendanceCompliant = parseFloat(attendancePercentage) >= 75.0;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Top Breadcrumb & Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/institution/dashboard"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-900 hover:text-blue-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Institution Roster</span>
          </Link>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-semibold">Application Number:</span>
            <span className="font-mono text-xs font-bold text-slate-900 bg-slate-200 px-2 py-1 rounded">
              {dossier.application_number}
            </span>
          </div>
        </div>

        {/* Active Digital Seal Notification (If already stamped) */}
        {successStamp && (
          <div className="p-4 bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-2xl shadow-lg border border-emerald-500 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md">
                <ShieldCheck className="w-7 h-7 text-emerald-300" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-sm">Official Institutional Verification Seal Applied</h4>
                  <span className="px-2 py-0.5 bg-emerald-500/30 text-emerald-200 text-[10px] font-bold rounded-full">
                    VERIFIED & FORWARDED
                  </span>
                </div>
                <p className="text-xs text-emerald-200 mt-0.5">
                  Forwarded to District Welfare Officer (DWO) for caste & income scrutiny.
                </p>
                <p className="text-[11px] font-mono text-emerald-300/80 mt-1 break-all">
                  SHA-256 Seal: {successStamp}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Student & Academic Summary Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Student Bio */}
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <User className="w-3.5 h-3.5" />
                <span>Student Bio</span>
              </div>
              <h2 className="text-lg font-black text-slate-900">{dossier.student_details?.full_name}</h2>
              <p className="text-xs text-slate-600 font-semibold">{dossier.student_details?.category} ({dossier.student_details?.sub_caste})</p>
              <p className="text-xs text-slate-500">DOB: {dossier.student_details?.dob} • Gender: {dossier.student_details?.gender}</p>
            </div>

            {/* Academic Program */}
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Enrolled Program</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">{dossier.academic_details?.course_name}</h3>
              <p className="text-xs text-slate-600">Year of Study: <span className="font-bold text-slate-800">{dossier.academic_details?.current_year_of_study}</span></p>
              <p className="text-xs text-slate-500">Roll No: <span className="font-mono font-semibold text-slate-800">{dossier.academic_details?.roll_number}</span></p>
            </div>

            {/* Scheme Applied */}
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <Award className="w-3.5 h-3.5" />
                <span>Target Scheme</span>
              </div>
              <h3 className="text-sm font-bold text-blue-900">{dossier.scheme?.name}</h3>
              <p className="text-xs text-slate-600">Academic Year: <span className="font-semibold text-slate-800">{dossier.academic_year}</span></p>
              <p className="text-xs text-emerald-700 font-semibold">Annual Family Income: ₹{dossier.student_details?.annual_family_income?.toLocaleString('en-IN')}</p>
            </div>

            {/* Institutional Ledger Status */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                <span>Claimed Course Fee:</span>
                <span className="font-bold text-slate-900">₹{dossier.fee_details?.claimed_annual_fee?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                <span>Approved Cap:</span>
                <span className="font-bold text-emerald-700">₹{dossier.fee_details?.approved_schedule?.total_annual_fee?.toLocaleString('en-IN') || '54,000'}</span>
              </div>
              <div className="pt-1 border-t border-slate-200 text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Within Approved Schedule</span>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Workbench Layout: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Column (7 cols): Nodal Officer Verification Checklist */}
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handleVerifySubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
              
              <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Institutional Verification Checklist
                  </h3>
                  <p className="text-xs text-slate-500">
                    Statutory check required before forwarding to District Welfare Officer (DWO).
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg text-xs font-bold">
                  Rule 14(a) MoTA Compliant
                </span>
              </div>

              {/* 1. Bonafide Confirmation (Feature 38) */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-bold text-slate-900">
                      1. Student Bonafide Status Confirmation
                    </label>
                    <p className="text-xs text-slate-500">
                      Confirm student is regular & actively enrolled in the institutional roll register.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={bonafideConfirmed}
                    onChange={(e) => setBonafideConfirmed(e.target.checked)}
                    className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Official Roll Number
                    </label>
                    <input
                      type="text"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Admission Year
                    </label>
                    <input
                      type="number"
                      value={admissionYear}
                      onChange={(e) => setAdmissionYear(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 2. Attendance Validation with 75% Rule Engine (Feature 40) */}
              <div className={`p-4 rounded-xl border space-y-3 ${
                isAttendanceCompliant ? 'bg-emerald-50/60 border-emerald-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-bold text-slate-900">
                      2. Academic Attendance Percentage (75% Rule Engine)
                    </label>
                    <p className="text-xs text-slate-600">
                      Ministry of Tribal Affairs strictly mandates a minimum 75% attendance.
                    </p>
                  </div>
                  {isAttendanceCompliant ? (
                    <span className="px-2.5 py-1 bg-emerald-200 text-emerald-900 rounded-full text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800" />
                      Compliant (≥ 75%)
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-red-200 text-red-900 rounded-full text-xs font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-800" />
                      Non-Compliant (&lt; 75%)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Official Recorded Attendance %
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={attendancePercentage}
                        onChange={(e) => setAttendancePercentage(e.target.value)}
                        className={`w-full px-3 py-1.5 text-sm font-bold border rounded-lg bg-white ${
                          isAttendanceCompliant
                            ? 'border-emerald-400 text-emerald-950 focus:ring-emerald-500'
                            : 'border-red-400 text-red-950 focus:ring-red-500'
                        }`}
                        required
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Remarks / Justification
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Regular laboratory & theory attendance"
                      value={attendanceRemarks}
                      onChange={(e) => setAttendanceRemarks(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Hostel Residency Confirmation (Feature 41) */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-bold text-slate-900">
                      3. Hostel Residency & Maintenance Allowance Check
                    </label>
                    <p className="text-xs text-slate-500">
                      Hostellers receive higher rate of maintenance allowance under Central Sector schemes.
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <label className="inline-flex items-center text-xs font-semibold text-slate-700">
                      <input
                        type="radio"
                        name="hostel_status"
                        checked={!isHosteller}
                        onChange={() => setIsHosteller(false)}
                        className="mr-1.5 text-blue-900"
                      />
                      Day Scholar
                    </label>
                    <label className="inline-flex items-center text-xs font-semibold text-slate-700">
                      <input
                        type="radio"
                        name="hostel_status"
                        checked={isHosteller}
                        onChange={() => setIsHosteller(true)}
                        className="mr-1.5 text-blue-900"
                      />
                      Hosteller
                    </label>
                  </div>
                </div>

                {isHosteller && (
                  <div className="grid grid-cols-2 gap-3 pt-2 animate-in fade-in">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Hostel Name / Block
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Hostel No. 7 (Birsa Munda Bhavan)"
                        value={hostelName}
                        onChange={(e) => setHostelName(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Room / Bed Allotment No.
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Room 204"
                        value={hostelRoomNo}
                        onChange={(e) => setHostelRoomNo(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Academic Performance & Marksheet Check (Feature 42) */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-bold text-slate-900">
                      4. Academic Marksheet & Passing Verification
                    </label>
                    <p className="text-xs text-slate-500">
                      Verify previous qualifying semester marksheet and progression eligibility.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={academicVerified}
                    onChange={(e) => setAcademicVerified(e.target.checked)}
                    className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Previous Year %
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={previousYearPercentage}
                      onChange={(e) => setPreviousYearPercentage(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      CGPA (10 pt scale)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={cgpa}
                      onChange={(e) => setCgpa(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Uncleared Backlogs?
                    </label>
                    <select
                      value={hasBacklogs ? 'yes' : 'no'}
                      onChange={(e) => setHasBacklogs(e.target.value === 'yes')}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="no">No (Clear Pass)</option>
                      <option value="yes">Yes (Has Backlogs)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Official Comments */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Official Nodal Officer Verification Recommendation
                </label>
                <textarea
                  rows={2}
                  value={officialRemarks}
                  onChange={(e) => setOfficialRemarks(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 resize-none"
                  placeholder="e.g. Candidate bonafide and credentials verified from institution ledger. Recommended for DWO approval."
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsDefectModalOpen(true)}
                  className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-xl transition-colors flex items-center justify-center space-x-1.5 border border-amber-300"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <span>Return with Defect Notice</span>
                </button>

                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 active:scale-95 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating Digital Seal...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-200" />
                      <span>Verify & Forward to DWO</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* Right Column (5 cols): Embedded Document Verification Drawer */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-900" />
                  <h3 className="font-extrabold text-sm text-slate-900">Uploaded Certificates</h3>
                </div>
                <span className="text-[11px] font-bold text-slate-500">
                  {dossier.documents?.length || 0} Files Attached
                </span>
              </div>

              <div className="space-y-3">
                {(!dossier.documents || dossier.documents.length === 0) ? (
                  <p className="text-xs text-slate-500 text-center py-6">
                    No documents uploaded by student yet.
                  </p>
                ) : (
                  dossier.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3.5 bg-slate-50 hover:bg-blue-50/50 rounded-xl border border-slate-200 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {doc.category?.replace(/_/g, ' ')}
                          </span>
                          {doc.is_digilocker && (
                            <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 text-[10px] font-bold rounded">
                              DigiLocker
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{doc.original_filename}</p>
                        <p className="text-[10px] text-emerald-700 font-semibold">
                          ClamAV Scan: Virus-Free • SHA-256 Verified
                        </p>
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
                  ))
                )}
              </div>

              {/* Watermark Security Banner */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  Government Dynamic Watermarking Active
                </p>
                <p className="text-amber-800">
                  Documents inspected through this workbench are dynamically overlaid with Nodal Officer ID and verification timestamp to prevent unauthorized reproduction.
                </p>
              </div>

            </div>

            {/* Approved Course Fee Schedule Card */}
            {dossier.fee_details?.approved_schedule && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-3">
                <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
                  <Receipt className="w-4 h-4 text-emerald-700" />
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                    Institutional Fee Schedule Breakdown
                  </h4>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Tuition Fee (Annual)</span>
                    <span className="font-semibold text-slate-800">₹{dossier.fee_details.approved_schedule.tuition_fee?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Admission & Reg. Fee</span>
                    <span className="font-semibold text-slate-800">₹{dossier.fee_details.approved_schedule.admission_fee?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Examination Fee</span>
                    <span className="font-semibold text-slate-800">₹{dossier.fee_details.approved_schedule.exam_fee?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Hostel / Mess Maintenance</span>
                    <span className="font-semibold text-slate-800">₹{dossier.fee_details.approved_schedule.hostel_fee?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                    <span>Total Standard Cap</span>
                    <span className="text-emerald-700">₹{dossier.fee_details.approved_schedule.total_annual_fee?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Defect Return Modal */}
      <DefectReturnModal
        isOpen={isDefectModalOpen}
        onClose={() => setIsDefectModalOpen(false)}
        applicationNumber={dossier.application_number}
        onConfirm={handleDefectConfirm}
        isProcessing={isDefectSubmitting}
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
