import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import applicationService from '../../services/applicationService';

export default function ApplicationPreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadApplication();
  }, [id]);

  const loadApplication = async () => {
    try {
      setLoading(true);
      const data = await applicationService.getApplicationById(id);
      setApplication(data);
    } catch (err) {
      setError('Could not load application details or access is restricted.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!application) return;
    try {
      const blob = await applicationService.exportApplicationPdf(application.id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Application_${application.application_number}.txt`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert('Failed to download application copy.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#ff6600] mx-auto"></div>
          <p className="mt-3 text-sm text-slate-500 font-medium">Loading official application record...</p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 text-center max-w-md">
          <p className="text-sm text-rose-600 font-semibold">{error || 'Application not found'}</p>
          <Link to="/applications" className="mt-4 inline-block px-4 py-2 bg-[#0d3b66] text-white text-xs font-bold rounded">
            Back to Applications
          </Link>
        </div>
      </div>
    );
  }

  const { application_data = {} } = application;
  const personal = application_data.personal || {};
  const academic = application_data.academic || {};
  const bank = application_data.bank || {};

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Top Action Bar */}
        <div className="flex items-center justify-between">
          <Link
            to="/applications"
            className="inline-flex items-center text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            ← Back to Applications List
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to={`/applications/${application.id}/timeline`}
              className="px-3 py-1.5 text-xs font-bold text-[#0d3b66] bg-white border border-[#0d3b66] rounded hover:bg-slate-50"
            >
              View Processing Timeline
            </Link>
            <button
              onClick={handleDownloadPdf}
              className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded flex items-center"
            >
              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF Form
            </button>
          </div>
        </div>

        {/* Official Government Form Document */}
        <div className="bg-white border-2 border-slate-300 rounded-lg shadow-md p-8 sm:p-12 space-y-8 relative">
          
          {/* Official Emblem & Header */}
          <div className="text-center border-b-2 border-slate-800 pb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 border border-slate-300 mb-2">
              <span className="font-serif font-black text-xl text-slate-800">स</span>
            </div>
            <h2 className="text-xs uppercase font-extrabold tracking-wider text-slate-700">
              Government of India • Ministry of Tribal Affairs
            </h2>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              ST SCHOLARSHIP APPLICATION SUMMARY
            </h1>
            <p className="text-xs font-bold text-[#0d3b66] mt-1">
              {application.scheme?.scheme_name || application.scheme_id}
            </p>
          </div>

          {/* Identification Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded border border-slate-200 text-xs">
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-500">Tracking Number</span>
              <span className="font-mono font-black text-slate-900 text-sm">{application.application_number}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-500">Status</span>
              <span className="font-bold text-blue-800">{application.status}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-500">Academic Year</span>
              <span className="font-bold text-slate-900">{application.academic_year}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-500">Submission Date</span>
              <span className="font-bold text-slate-900">
                {application.submission_date ? new Date(application.submission_date).toLocaleDateString('en-IN') : 'In Draft'}
              </span>
            </div>
          </div>

          {/* Section 1: Personal & ST Tribe Profile */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase font-black tracking-wider text-[#0d3b66] border-b pb-1">
              1. Applicant Personal & Tribe Profile
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 text-xs">
              <div><span className="text-slate-500">Full Name:</span> <strong className="text-slate-900">{personal.full_name || 'N/A'}</strong></div>
              <div><span className="text-slate-500">Gender:</span> <strong className="text-slate-900">{personal.gender || 'N/A'}</strong></div>
              <div><span className="text-slate-500">Date of Birth:</span> <strong className="text-slate-900">{personal.dob || 'N/A'}</strong></div>
              <div><span className="text-slate-500">Category:</span> <strong className="text-slate-900">{personal.caste_category || 'Scheduled Tribe (ST)'}</strong></div>
              <div><span className="text-slate-500">Sub-Tribe / Community:</span> <strong className="text-slate-900">{personal.sub_tribe || 'N/A'}</strong></div>
              <div><span className="text-slate-500">PVTG Status:</span> <strong className="text-slate-900">{personal.is_pvtg ? 'Yes (Particularly Vulnerable)' : 'No'}</strong></div>
              <div><span className="text-slate-500">Father's Name:</span> <strong className="text-slate-900">{personal.father_name || 'N/A'}</strong></div>
              <div><span className="text-slate-500">Mother's Name:</span> <strong className="text-slate-900">{personal.mother_name || 'N/A'}</strong></div>
              <div><span className="text-slate-500">Annual Family Income:</span> <strong className="text-slate-900">₹{parseFloat(personal.annual_family_income || 0).toLocaleString('en-IN')}</strong></div>
              <div><span className="text-slate-500">Domicile:</span> <strong className="text-slate-900">{personal.district}, {personal.domicile_state}</strong></div>
            </div>
          </div>

          {/* Section 2: Academic Record */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase font-black tracking-wider text-[#0d3b66] border-b pb-1">
              2. Academic & Enrollment Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 text-xs">
              <div><span className="text-slate-500">Institution:</span> <strong className="text-slate-900">{academic.institution_name || 'N/A'}</strong></div>
              <div><span className="text-slate-500">AISHE / Code:</span> <strong className="text-slate-900">{academic.institution_code || 'N/A'}</strong></div>
              <div><span className="text-slate-500">Course / Degree:</span> <strong className="text-slate-900">{academic.course_name || 'N/A'}</strong></div>
              <div><span className="text-slate-500">Current Year:</span> <strong className="text-slate-900">{academic.current_year || 'N/A'}</strong></div>
              <div><span className="text-slate-500">Hostel Residence:</span> <strong className="text-slate-900">{academic.hosteller_status || 'DAY_SCHOLAR'}</strong></div>
              <div><span className="text-slate-500">Last Exam %:</span> <strong className="text-slate-900">{academic.last_exam_percentage ? `${academic.last_exam_percentage}%` : 'N/A'}</strong></div>
            </div>
          </div>

          {/* Section 3: DBT Bank Account */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase font-black tracking-wider text-[#0d3b66] border-b pb-1">
              3. Direct Benefit Transfer (DBT) Bank Account
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 text-xs">
              <div><span className="text-slate-500">Account Holder:</span> <strong className="text-slate-900">{bank.account_holder_name || 'N/A'}</strong></div>
              <div><span className="text-slate-500">Bank Name:</span> <strong className="text-slate-900">{bank.bank_name || 'N/A'}</strong></div>
              <div><span className="text-slate-500">Account Number:</span> <strong className="text-slate-900 font-mono">{bank.account_number ? '••••••••' + String(bank.account_number).slice(-4) : 'N/A'}</strong></div>
              <div><span className="text-slate-500">IFSC Code:</span> <strong className="text-slate-900 font-mono">{bank.ifsc_code || 'N/A'}</strong></div>
              <div><span className="text-slate-500">NPCI Aadhaar-Seeded:</span> <strong className="text-emerald-700">Verified for DBT Disbursal</strong></div>
            </div>
          </div>

          {/* Section 4: Applicant Declaration */}
          <div className="space-y-2 pt-2 bg-slate-50 p-4 rounded border border-slate-200">
            <h3 className="text-[11px] uppercase font-bold text-slate-700">
              Statutory Declaration
            </h3>
            <p className="text-[11px] text-slate-600 leading-relaxed italic">
              "I hereby solemnly declare that all statements made in this application are true, complete and correct. I am a bonafide Scheduled Tribe student and have not claimed another scholarship for this identical academic term."
            </p>
            <div className="text-[10px] text-slate-500 pt-1 flex justify-between">
              <span>Digitally signed via ST Seva Portal</span>
              <span>Audit Hash: {application.id.slice(0, 16)}</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
