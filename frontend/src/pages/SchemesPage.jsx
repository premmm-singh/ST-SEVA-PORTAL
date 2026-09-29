import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Download,
  Phone,
  Mail,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  CheckCircle,
  HelpCircle,
  AlertCircle
} from 'lucide-react';

const SCHEMES_DATABASE = {
  'post-matric': {
    id: 'post-matric',
    title: 'Post-Matric Scholarship Scheme for Scheduled Tribe Students',
    hindi: 'अनुसूचित जनजाति के छात्रों के लिए पोस्ट-मैट्रिक छात्रवृत्ति योजना',
    code: 'MTA-POST-MATRIC-2026',
    ministry: 'Ministry of Tribal Affairs, Government of India',
    financialYear: '2026-27',
    lastUpdated: '15 January 2026',
    about: 'The Post-Matric Scholarship Scheme for Scheduled Tribe Students is a Centrally Sponsored Scheme implemented through State Governments and UT Administrations. The primary objective is to provide financial assistance to Scheduled Tribe students studying at post-matriculation or post-secondary stage across India to enable them to complete their higher education, reduce dropout rates, and empower tribal youth for public and private sector leadership.',
    eligibility: [
      'The applicant must belong to a notified Scheduled Tribe (ST) community recognized by the President of India under Article 342 of the Constitution for the respective State/UT.',
      'Must have passed the Matriculation / Higher Secondary Examination or any higher examination from a recognized University or Board of Secondary Education.',
      'Total annual family income from all sources must not exceed ₹2,50,000/- (Rupees Two Lakh Fifty Thousand only) per annum.',
      'Students pursuing studies through correspondence, distance, or open universities are also eligible for non-refundable course fees and book grants subject to norms.',
      'Candidates must not be in receipt of any other Centrally Sponsored or State scholarship for the same course of study.'
    ],
    benefits: [
      { item: 'Compulsory Non-Refundable Course Fees', rate: '100% reimbursed as fixed by State Fee Regulatory Committee (tuition, library, exam, lab)' },
      { item: 'Monthly Maintenance Allowance (Degree / PG / Professional)', rate: 'Day Scholars: ₹550 - ₹750 / mo | Hostellers: ₹1,200 / mo' },
      { item: 'Monthly Maintenance Allowance (Class XI & XII / ITI / Poly)', rate: 'Day Scholars: ₹380 / mo | Hostellers: ₹570 / mo' },
      { item: 'Book Grant & Study Tour Charges', rate: 'Up to ₹1,600 / annum for professional and technical courses' },
      { item: 'Thesis Typing & Printing Allowance', rate: 'One-time grant of ₹1,600 for research scholars' },
      { item: 'Disability Allowance (for PwD ST scholars)', rate: 'Reader allowance ₹240/mo, escort allowance ₹160/mo, transport grant ₹160/mo' }
    ],
    documents: [
      'Valid ST Caste Certificate issued by competent Revenue Authority (SDM/Tehsildar/District Magistrate) with QR verification code or DigiLocker URI.',
      'Annual Income Certificate for FY 2025-26 issued by an Executive Magistrate or authorized State Revenue Officer (valid for current fiscal year).',
      'Self-attested copies of previous educational qualification marksheets and passing certificates.',
      'Institutional Bonafide Certificate confirming current academic year admission, course name, AISHE code, and day-scholar/hosteller status.',
      'Fee receipt issued by the institution showing break-up of tuition fees and other non-refundable statutory heads.',
      'First page of active Savings Bank Passbook showing Account Number, IFSC code, and proof of Aadhaar-NPCI mapping.'
    ],
    howToApply: [
      'Step 1: Obtain your Scholar One-Time Registration (OTR) ID on the ST Seva Portal / National Scholarship Portal using Aadhaar OTP verification.',
      'Step 2: Log in using your Application ID and system-generated credentials.',
      'Step 3: Fill up personal particulars, domicile state, district, academic particulars, and verify your institute’s AISHE / DISE code.',
      'Step 4: Upload digitally signed scanned copies of the mandatory documents (PDF/JPEG up to 2MB).',
      'Step 5: Review the preview form, check all fields, and press "Final Submit". Download and print the acknowledgment slip.',
      'Step 6: Submit a printed copy of the application along with original document photocopies to your Institution Nodal Officer (INO) for level-1 scrutiny.'
    ],
    dates: [
      { event: 'Online Application Portal Opening Date', date: '01 July 2026' },
      { event: 'Last Date for Student Application Submission', date: '31 October 2026' },
      { event: 'Last Date for Institute Level Verification (INO)', date: '15 November 2026' },
      { event: 'Last Date for District Welfare Officer (DWO) Verification', date: '30 November 2026' },
      { event: 'First DBT Disbursal Tranche via PFMS/NPCI', date: '15 December 2026' }
    ],
    grievance: {
      officer: 'Shri R. K. Soren, Deputy Secretary (Scholarships)',
      address: 'Ministry of Tribal Affairs, Room 412, A-Wing, Shastri Bhawan, New Delhi - 110001',
      phone: '011-23381662 / 0120-6619540',
      email: 'dir-scholarship-mota@gov.in'
    },
    related: [
      { id: 'pre-matric', name: 'Pre-Matric Scholarship for ST Students (Class IX & X)' },
      { id: 'nfst-fellowship', name: 'National Fellowship for Higher Education of ST Students (NFST)' },
      { id: 'top-class-education', name: 'Top Class Education Scheme for ST Students in Premier Institutes' }
    ]
  },
  'pre-matric': {
    id: 'pre-matric',
    title: 'Pre-Matric Scholarship Scheme for Scheduled Tribe Students (Class IX & X)',
    hindi: 'अनुसूचित जनजाति के छात्रों के लिए प्री-मैट्रिक छात्रवृत्ति योजना (कक्षा 9 और 10)',
    code: 'MTA-PRE-MATRIC-2026',
    ministry: 'Ministry of Tribal Affairs, Government of India',
    financialYear: '2026-27',
    lastUpdated: '15 January 2026',
    about: 'The Pre-Matric Scholarship Scheme for ST Students is formulated to support parents of ST children for education of their wards studying in classes IX and X, so that the incidence of drop-out, especially in the transition from elementary to secondary stage, is minimized, and performance of ST children is substantially improved.',
    eligibility: [
      'Student should belong to Scheduled Tribe community recognized in the State/UT of domicile.',
      'Student should be studying in Class IX or X in a Government School or schools recognized by the State Government or Central Board of Secondary Education.',
      'Parental annual income from all sources must not exceed ₹2,50,000/- per annum.',
      'Scholarship is available for the studies in India only.'
    ],
    benefits: [
      { item: 'Scholarship Allowance for Day Scholars', rate: '₹3,500 per annum (10 months @ ₹350/mo)' },
      { item: 'Scholarship Allowance for Hostellers', rate: '₹7,000 per annum (10 months @ ₹700/mo)' },
      { item: 'Books and Stationery Grant', rate: '₹1,000 per annum included in scholarship' },
      { item: 'Additional Disability Allowance', rate: '₹1,000 per annum for visually or orthopedically impaired ST scholars' }
    ],
    documents: [
      'Valid ST Caste Certificate issued by competent Revenue Officer.',
      'Income Certificate issued by Tehsildar / authorized executive authority.',
      'Previous class passing marksheet / grade card from recognized school.',
      'Bonafide Certificate from school Headmaster / Principal.',
      'Bank Account details of student or joint account with parent.'
    ],
    howToApply: [
      'Step 1: Register on ST Seva Portal with School U-DISE Code.',
      'Step 2: Enter Student and Parent Details.',
      'Step 3: Upload Caste Certificate and Income Certificate.',
      'Step 4: School Headmaster validates online enrollment on portal.',
      'Step 5: District Welfare Officer sanctions direct payment.'
    ],
    dates: [
      { event: 'Online Application Start Date', date: '01 July 2026' },
      { event: 'Closing Date for Student Application', date: '31 October 2026' },
      { event: 'School Level Verification Deadline', date: '15 November 2026' },
      { event: 'DBT Payment Disbursal Tranche', date: '10 December 2026' }
    ],
    grievance: {
      officer: 'Smt. Anjali Marandi, Under Secretary (Pre-Matric Cell)',
      address: 'Ministry of Tribal Affairs, Shastri Bhawan, New Delhi',
      phone: '011-23387541',
      email: 'us-prematric@tribal.gov.in'
    },
    related: [
      { id: 'post-matric', name: 'Post-Matric Scholarship Scheme for Scheduled Tribe Students' },
      { id: 'top-class-education', name: 'Top Class Education Scheme for ST Students' },
      { id: 'nfst-fellowship', name: 'National Fellowship for Higher Education (NFST)' }
    ]
  },
  'nfst-fellowship': {
    id: 'nfst-fellowship',
    title: 'National Fellowship for Higher Education of ST Students (NFST - M.Phil / Ph.D)',
    hindi: 'अनुसूचित जनजाति के छात्रों के लिए राष्ट्रीय उच्च शिक्षा फैलोशिप (एम.फिल / पीएच.डी)',
    code: 'MTA-NFST-RESEARCH-2026',
    ministry: 'Ministry of Tribal Affairs, Government of India',
    financialYear: '2026-27',
    lastUpdated: '15 January 2026',
    about: 'National Fellowship for Higher Education of ST Students is a 100% Central Sector Scheme. Under this scheme, 750 fresh fellowships are awarded annually to ST scholars pursuing regular, full-time M.Phil and Ph.D degrees in Sciences, Humanities, Social Sciences, Engineering & Technology in Indian Universities and Institutes.',
    eligibility: [
      'The candidate must belong to Scheduled Tribe and should have secured admission to regular full-time M.Phil / Ph.D.',
      'Must have qualified UGC-NET / CSIR-NET national entrance examination.',
      'No income ceiling applies for selection under NFST Fellowship merit list.',
      'Candidate cannot hold any other scholarship/fellowship during tenure.'
    ],
    benefits: [
      { item: 'Junior Research Fellow (JRF) Fellowship', rate: '₹37,000 / month for initial two years' },
      { item: 'Senior Research Fellow (SRF) Fellowship', rate: '₹42,000 / month for remaining tenure up to 3 years' },
      { item: 'House Rent Allowance (HRA)', rate: 'As per Central Govt rates (8%, 16%, 27% based on city tier)' },
      { item: 'Contingency Grant (Humanities & Social Sciences)', rate: '₹12,000 / annum for JRF, ₹20,500 / annum for SRF' },
      { item: 'Contingency Grant (Sciences, Engineering & Tech)', rate: '₹28,000 / annum for JRF, ₹35,000 / annum for SRF' }
    ],
    documents: [
      'ST Caste Certificate.',
      'UGC-NET / CSIR-NET Scorecard & Qualification Certificate.',
      'Post-Graduate Degree Marksheet and Convocation / Provisional Certificate.',
      'Ph.D / M.Phil Admission Letter / Registration Certificate from University Registrar.',
      'Research Guide / Supervisor Joining Report.'
    ],
    howToApply: [
      'Step 1: Online registration on NFST Portal portal under Ministry of Tribal Affairs.',
      'Step 2: Enter UGC-NET Roll Number and University Enrollment ID.',
      'Step 3: Upload research proposal synopsis and supervisor certificate.',
      'Step 4: University Nodal Officer verifies candidature online.',
      'Step 5: Ministry publishes All-India Merit List and slot awards.'
    ],
    dates: [
      { event: 'Call for NFST Applications', date: '15 August 2026' },
      { event: 'Last Date for Online Submission', date: '15 November 2026' },
      { event: 'University Verification Deadline', date: '30 November 2026' },
      { event: 'All India Merit List Publication', date: '15 December 2026' }
    ],
    grievance: {
      officer: 'Dr. P. T. Minz, Director (Higher Education & Research)',
      address: 'Ministry of Tribal Affairs, August Kranti Bhawan, New Delhi',
      phone: '011-26182902',
      email: 'nfst-fellowship@tribal.gov.in'
    },
    related: [
      { id: 'nos-scholarship', name: 'National Overseas Scholarship for ST Candidates (Abroad)' },
      { id: 'post-matric', name: 'Post-Matric Scholarship Scheme for Scheduled Tribe Students' },
      { id: 'top-class-education', name: 'Top Class Education Scheme for ST Students' }
    ]
  },
  'nos-scholarship': {
    id: 'nos-scholarship',
    title: 'National Overseas Scholarship for Scheduled Tribe Candidates (NOS)',
    hindi: 'अनुसूचित जनजाति के उम्मीदवारों के लिए राष्ट्रीय विदेशी छात्रवृत्ति योजना',
    code: 'MTA-NOS-ABROAD-2026',
    ministry: 'Ministry of Tribal Affairs, Government of India',
    financialYear: '2026-27',
    lastUpdated: '15 January 2026',
    about: 'The National Overseas Scholarship Scheme provides financial assistance to meritorious ST students for pursuing Master level courses, Ph.D. and Post-Doctoral research programmes in accredited overseas universities in USA, UK, Germany, Canada, Australia, etc., within top 500 QS World University Rankings.',
    eligibility: [
      'Candidate must be a member of Scheduled Tribe.',
      'Minimum 60% marks or equivalent grade in qualifying Master degree (for Ph.D) or Bachelor degree (for Master).',
      'Total family income from all sources must not exceed ₹6,00,000/- per annum.',
      'Age limit: Not more than 35 years as on first day of July of the selection year.',
      'Unconditional offer letter of admission from a university ranked within top 500 in latest QS World Rankings.'
    ],
    benefits: [
      { item: 'Tuition Fees Reimbursed', rate: '100% of actual tuition fee charged by foreign institution' },
      { item: 'Annual Maintenance Allowance (USA & other countries)', rate: 'US $15,400 per annum' },
      { item: 'Annual Maintenance Allowance (United Kingdom)', rate: '£9,900 per annum' },
      { item: 'International Air Passage', rate: 'Economy class return airfare from India to destination' },
      { item: 'Compulsory Health Insurance & Visa Fees', rate: 'Actual costs borne by Government of India' },
      { item: 'Contingency Grant & Equipment Allowance', rate: 'US $1,500 / £1,100 per annum' }
    ],
    documents: [
      'ST Certificate verified by State Welfare Commissioner.',
      'Unconditional Admission Offer from Foreign University with course duration.',
      'Income Certificate and last 3 years ITR of family members.',
      'GRE / GMAT / IELTS / TOEFL scorecard where applicable.',
      'Valid Indian Passport copy with minimum 2 years validity.'
    ],
    howToApply: [
      'Step 1: Fill NOS online application portal on ST Seva / MoTA portal.',
      'Step 2: Upload QS Ranking certificate of the institution and admission offer.',
      'Step 3: Verification by National Selection Committee constituted by MoTA.',
      'Step 4: Award of Provisional Letter and issuance of guarantee letter for Visa.',
      'Step 5: Direct remittance through Indian Embassy / High Commission in host country.'
    ],
    dates: [
      { event: 'NOS Selection Portal Opening', date: '01 September 2026' },
      { event: 'Application Submission Deadline', date: '30 November 2026' },
      { event: 'National Selection Committee Scrutiny', date: '20 December 2026' },
      { event: 'Sanction and Embassy Remittance', date: '15 January 2027' }
    ],
    grievance: {
      officer: 'Shri B. K. Dungdung, Joint Secretary (Overseas Division)',
      address: 'Ministry of Tribal Affairs, Shastri Bhawan, New Delhi - 110001',
      phone: '011-23383344',
      email: 'nos-tribal@gov.in'
    },
    related: [
      { id: 'nfst-fellowship', name: 'National Fellowship for Higher Education of ST Students' },
      { id: 'post-matric', name: 'Post-Matric Scholarship Scheme for Scheduled Tribe Students' },
      { id: 'top-class-education', name: 'Top Class Education Scheme for ST Students' }
    ]
  },
  'top-class-education': {
    id: 'top-class-education',
    title: 'Top Class Education Scheme for Scheduled Tribe Students',
    hindi: 'अनुसूचित जनजाति के छात्रों के लिए शीर्ष श्रेणी शिक्षा योजना',
    code: 'MTA-TOP-CLASS-2026',
    ministry: 'Ministry of Tribal Affairs, Government of India',
    financialYear: '2026-27',
    lastUpdated: '15 January 2026',
    about: 'The Top Class Education Scheme encourages meritorious ST students to pursue higher education in premier institutions of national importance across India including IITs, IIMs, NITs, AIIMS, IIITs, National Law Universities (NLUs), and other Central Government notified institutions of excellence.',
    eligibility: [
      'ST students who have secured admission in 250+ notified institutions of excellence on open competition.',
      'Parental annual income from all sources should not exceed ₹6,00,000/- per annum.',
      'Scholarship continues till the completion of the course subject to satisfactory academic performance.'
    ],
    benefits: [
      { item: 'Full Tuition Fees & Non-Refundable Statutory Charges', rate: 'Full reimbursement up to ₹2.00 Lakh/yr in private and actuals in Govt IIT/IIM' },
      { item: 'Living Expenses Grant', rate: '₹3,000 per month (₹36,000 per annum) credited via DBT' },
      { item: 'Books and Stationery Allowance', rate: '₹5,000 per annum' },
      { item: 'Computer / Laptop Grant', rate: 'One-time grant of ₹45,000 for computer hardware' }
    ],
    documents: [
      'ST Caste Certificate.',
      'Income Certificate (ceiling ₹6.00 Lakh).',
      'JEE / CAT / NEET / CLAT scorecard and rank letter.',
      'Admission Letter and Institute Identity Card issued by IIT/IIM/NIT/AIIMS.',
      'Fee receipt showing fee details deposited at institute.'
    ],
    howToApply: [
      'Step 1: Register on portal selecting "Top Class Scheme".',
      'Step 2: Choose Institute from notified IIT/IIM/NIT list.',
      'Step 3: Upload Admission Confirmation memo and bank details.',
      'Step 4: Institute Registrar verifies student record on portal.',
      'Step 5: 100% Central funding disbursed via PFMS to institute & student.'
    ],
    dates: [
      { event: 'Portal Opens for Top Class Applications', date: '15 July 2026' },
      { event: 'Closing Date for Student Application', date: '31 October 2026' },
      { event: 'Institute Registrar Verification Cut-off', date: '15 November 2026' },
      { event: 'Direct Central DBT Disbursal', date: '05 December 2026' }
    ],
    grievance: {
      officer: 'Dr. Mukul Hansda, Director (Top Class Scheme Cell)',
      address: 'Ministry of Tribal Affairs, Room 302, Shastri Bhawan, New Delhi',
      phone: '011-23386221',
      email: 'topclass-st@gov.in'
    },
    related: [
      { id: 'post-matric', name: 'Post-Matric Scholarship Scheme for Scheduled Tribe Students' },
      { id: 'nfst-fellowship', name: 'National Fellowship for Higher Education of ST Students' },
      { id: 'nos-scholarship', name: 'National Overseas Scholarship for ST Candidates' }
    ]
  }
};

const SchemesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentSchemeKey = searchParams.get('scheme') || 'post-matric';
  const scheme = SCHEMES_DATABASE[currentSchemeKey] || SCHEMES_DATABASE['post-matric'];

  const selectScheme = (key) => {
    setSearchParams({ scheme: key });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex-1 bg-[#F8F9FA] text-[#212529] font-sans pb-12">
      {/* Breadcrumb: Home > Schemes > Scheme Name */}
      <div className="bg-[#EAEFF5] border-b border-[#CBD5E1] py-2 px-4 sm:px-8 text-xs text-slate-700">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 flex-wrap">
          <Link to="/" className="text-[#003366] hover:underline font-medium">Home</Link>
          <span className="text-slate-400">›</span>
          <Link to="/schemes" className="text-[#003366] hover:underline font-medium">Schemes</Link>
          <span className="text-slate-400">›</span>
          <span className="font-semibold text-slate-900">{scheme.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
        {/* Page Title + Scheme Code */}
        <div className="border border-[#CBD5E1] bg-white p-5 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E0E0E0] pb-3 mb-3">
            <div>
              <span className="text-[11px] font-mono font-bold bg-[#E2E8F0] border border-[#CBD5E1] px-2 py-0.5 text-[#003366]">
                {scheme.code}
              </span>
              <span className="ml-2 text-xs font-bold text-[#138808] bg-green-50 border border-green-300 px-2 py-0.5">
                ● Status: Open for AY {scheme.financialYear}
              </span>
            </div>
            <div className="text-xs text-slate-500 font-sans">
              Last Updated: <strong className="text-slate-800">{scheme.lastUpdated}</strong>
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#003366] leading-snug">
            {scheme.title}
          </h1>
          <div className="text-xs font-serif text-slate-600 mt-1">
            {scheme.hindi}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {scheme.ministry}
          </div>

          {/* Scheme Switcher Tabs (Govt portal tabs, sharp borders, no pills) */}
          <div className="mt-4 pt-3 border-t border-[#E0E0E0] flex flex-wrap gap-1 text-xs">
            <span className="font-bold text-slate-700 py-1 mr-2 self-center">Switch Scheme:</span>
            {Object.keys(SCHEMES_DATABASE).map((key) => {
              const s = SCHEMES_DATABASE[key];
              const isSelected = key === currentSchemeKey;
              return (
                <button
                  key={key}
                  onClick={() => selectScheme(key)}
                  className={`px-3 py-1 border transition text-xs font-medium ${
                    isSelected
                      ? 'bg-[#003366] text-white border-[#002244] font-bold'
                      : 'bg-[#F8F9FA] text-[#003366] border-[#CBD5E1] hover:bg-slate-200'
                  }`}
                >
                  {s.id === 'post-matric' ? 'Post-Matric ST' :
                   s.id === 'pre-matric' ? 'Pre-Matric ST' :
                   s.id === 'nfst-fellowship' ? 'NFST Research' :
                   s.id === 'nos-scholarship' ? 'NOS Abroad' : 'Top Class'}
                </button>
              );
            })}
          </div>
        </div>

        {/* 75% Main Content & 25% Right Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content (75% / 9 cols) */}
          <div className="lg:col-span-9 space-y-6">
            {/* 1. About the scheme */}
            <div className="border border-[#E0E0E0] bg-white p-5">
              <h2 className="text-base font-serif font-bold text-[#003366] border-b border-[#003366] pb-1.5 mb-3 flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#FF9933] inline-block" />
                1. About the Scheme & Objectives
              </h2>
              <p className="text-xs text-slate-700 leading-relaxed text-justify">
                {scheme.about}
              </p>
            </div>

            {/* 2. Eligibility */}
            <div className="border border-[#E0E0E0] bg-white p-5">
              <h2 className="text-base font-serif font-bold text-[#003366] border-b border-[#003366] pb-1.5 mb-3 flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#003366] inline-block" />
                2. Eligibility Criteria & Conditions of Award
              </h2>
              <ul className="text-xs text-slate-700 space-y-2 list-disc list-inside leading-relaxed">
                {scheme.eligibility.map((el, idx) => (
                  <li key={idx} className="pl-1">
                    <span className="text-slate-800">{el}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 3. Benefits (Table with amounts) */}
            <div className="border border-[#E0E0E0] bg-white p-5">
              <h2 className="text-base font-serif font-bold text-[#003366] border-b border-[#003366] pb-1.5 mb-3 flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#138808] inline-block" />
                3. Financial Assistance & Value of Scholarship
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-[#E0E0E0] border-collapse">
                  <thead>
                    <tr className="bg-[#F1F5F9] text-slate-900 font-bold border-b border-[#E0E0E0]">
                      <th className="p-2.5 border-r border-[#E0E0E0] w-2/5">Component / Grant Item</th>
                      <th className="p-2.5">Rate of Financial Assistance (100% DBT)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E0E0E0]">
                    {scheme.benefits.map((b, idx) => (
                      <tr key={idx} className={`gov-table-row ${idx % 2 === 1 ? 'bg-[#F9FAFB]' : 'bg-white'}`}>
                        <td className="p-2.5 border-r border-[#E0E0E0] font-semibold text-slate-800">
                          {b.item}
                        </td>
                        <td className="p-2.5 text-slate-700 font-medium">
                          {b.rate}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Documents Required (Numbered List) */}
            <div className="border border-[#E0E0E0] bg-white p-5">
              <h2 className="text-base font-serif font-bold text-[#003366] border-b border-[#003366] pb-1.5 mb-3 flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#D97706] inline-block" />
                4. Mandatory Documents Required for Verification
              </h2>
              <ol className="text-xs text-slate-700 space-y-2 list-decimal list-inside leading-relaxed">
                {scheme.documents.map((doc, idx) => (
                  <li key={idx} className="pl-1">
                    <span className="text-slate-800">{doc}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-3 p-2 bg-[#FFFBEB] border border-[#FDE68A] text-[11px] text-[#78350F]">
                <strong>Note:</strong> All documents must be verified through DigiLocker or scanned in original color. Black-and-white photocopies without attestation will be rejected by the scrutiny desk.
              </div>
            </div>

            {/* 5. How to Apply (Numbered steps) */}
            <div className="border border-[#E0E0E0] bg-white p-5">
              <h2 className="text-base font-serif font-bold text-[#003366] border-b border-[#003366] pb-1.5 mb-3 flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#003366] inline-block" />
                5. How to Apply Online
              </h2>
              <div className="space-y-2 text-xs">
                {scheme.howToApply.map((step, idx) => (
                  <div key={idx} className="p-2 border border-[#E0E0E0] bg-[#F8F9FA] text-slate-800">
                    {step}
                  </div>
                ))}
              </div>
            </div>

            {/* 6. Important Dates (Table) */}
            <div className="border border-[#E0E0E0] bg-white p-5">
              <h2 className="text-base font-serif font-bold text-[#003366] border-b border-[#003366] pb-1.5 mb-3 flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#B84D00] inline-block" />
                6. Statutory Timelines & Important Dates
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-[#E0E0E0] border-collapse">
                  <thead>
                    <tr className="bg-[#F1F5F9] text-slate-900 font-bold border-b border-[#E0E0E0]">
                      <th className="p-2.5 border-r border-[#E0E0E0] w-3/5">Stage / Activity</th>
                      <th className="p-2.5 font-bold text-[#003366]">Prescribed Cut-off Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E0E0E0]">
                    {scheme.dates.map((d, idx) => (
                      <tr key={idx} className={`gov-table-row ${idx % 2 === 1 ? 'bg-[#F9FAFB]' : 'bg-white'}`}>
                        <td className="p-2.5 border-r border-[#E0E0E0] text-slate-800 font-medium">
                          {d.event}
                        </td>
                        <td className="p-2.5 font-mono font-bold text-[#B84D00]">
                          {d.date}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 7. Grievance Contact */}
            <div className="border border-[#E0E0E0] bg-white p-5 text-xs text-slate-700">
              <h2 className="text-base font-serif font-bold text-[#003366] border-b border-[#003366] pb-1.5 mb-3 flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#991B1B] inline-block" />
                7. Scheme Nodal Officer & Grievance Contact
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#F8F9FA] p-3 border border-[#E0E0E0]">
                <div>
                  <div className="text-[11px] text-slate-500 font-semibold uppercase">Designated Officer:</div>
                  <div className="font-bold text-slate-900">{scheme.grievance.officer}</div>
                  <div className="text-slate-600 mt-1">{scheme.grievance.address}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 font-semibold uppercase">Communication Coordinates:</div>
                  <div className="font-mono text-slate-800">Phone: {scheme.grievance.phone}</div>
                  <div className="text-slate-800 mt-0.5">Email: {scheme.grievance.email}</div>
                  <div className="mt-2">
                    <Link to="/grievance/file" className="text-[#003366] font-bold underline">
                      Lodge Online Grievance on ST Seva Desk →
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom: Related Schemes (3 links, not cards) */}
            <div className="border border-[#CBD5E1] bg-white p-4 text-xs">
              <h3 className="font-serif font-bold text-[#003366] text-sm mb-2 border-b border-[#E0E0E0] pb-1">
                Related Tribal Scholarship Schemes
              </h3>
              <ul className="space-y-1.5 text-slate-700">
                {scheme.related.map((rel) => (
                  <li key={rel.id}>
                    <button
                      onClick={() => selectScheme(rel.id)}
                      className="text-[#003366] hover:underline font-semibold text-left"
                    >
                      ▶ {rel.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Sidebar (25% / 3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            {/* Quick Actions Panel */}
            <div className="border border-[#003366] bg-white p-4">
              <h3 className="font-serif font-bold text-white bg-[#003366] -m-4 mb-3 p-3 text-sm uppercase tracking-wide">
                Quick Actions
              </h3>
              <div className="space-y-2 text-xs pt-1">
                <Link
                  to="/applications/new"
                  className="block w-full text-center bg-[#FF9933] hover:bg-amber-500 text-black font-bold p-2 text-xs border border-amber-600 shadow-2xs"
                  style={{ textDecoration: 'none' }}
                >
                  Apply Online (Fresh/Renewal)
                </Link>

                <a
                  href="#download-form"
                  onClick={(e) => {
                    e.preventDefault();
                    alert(`Downloading Offline Physical Verification Form for ${scheme.code}`);
                  }}
                  className="block w-full text-center bg-[#F1F5F9] hover:bg-slate-200 text-[#003366] font-bold p-2 text-xs border border-[#CBD5E1]"
                  style={{ textDecoration: 'none' }}
                >
                  Download Application Form (PDF)
                </a>

                <a
                  href="#guidelines-pdf"
                  onClick={(e) => {
                    e.preventDefault();
                    alert(`Downloading Official Gazette Guidelines for ${scheme.code}`);
                  }}
                  className="block w-full text-center bg-[#F1F5F9] hover:bg-slate-200 text-[#003366] font-bold p-2 text-xs border border-[#CBD5E1]"
                  style={{ textDecoration: 'none' }}
                >
                  Download Guidelines (PDF)
                </a>

                <Link
                  to="/track-status"
                  className="block w-full text-center bg-[#F1F5F9] hover:bg-slate-200 text-[#003366] font-bold p-2 text-xs border border-[#CBD5E1]"
                  style={{ textDecoration: 'none' }}
                >
                  Check Application Status
                </Link>

                <Link
                  to="/verify-certificate"
                  className="block w-full text-center bg-[#F1F5F9] hover:bg-slate-200 text-[#003366] font-bold p-2 text-xs border border-[#CBD5E1]"
                  style={{ textDecoration: 'none' }}
                >
                  Certificate Verification Desk
                </Link>
              </div>
            </div>

            {/* Important Contact Officer */}
            <div className="border border-[#CBD5E1] bg-white p-4 text-xs">
              <h3 className="font-serif font-bold text-[#003366] text-sm border-b border-[#E0E0E0] pb-2 mb-2">
                Contact Officer
              </h3>
              <div className="space-y-1 text-slate-700">
                <div className="font-semibold text-slate-900">{scheme.grievance.officer}</div>
                <div className="text-[11px] text-slate-600">{scheme.grievance.address}</div>
                <div className="font-mono text-[11px] pt-1 text-[#003366]">Tel: {scheme.grievance.phone}</div>
                <div className="text-[11px] text-slate-600">Email: {scheme.grievance.email}</div>
              </div>
            </div>

            {/* Helpline Summary */}
            <div className="border border-[#FDE68A] bg-[#FFFBEB] p-4 text-xs">
              <h3 className="font-serif font-bold text-[#92400E] text-sm mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                <span>Central Helpline</span>
              </h3>
              <p className="text-[11px] text-[#78350F] leading-snug">
                For scholarship technical inquiries or payment failures:
              </p>
              <div className="mt-2 font-mono font-bold text-sm text-[#003366]">
                0120-6619540
              </div>
              <div className="text-[10px] text-slate-600 mt-1">
                Open Mon-Sat, 9:00 AM - 6:00 PM
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchemesPage;
