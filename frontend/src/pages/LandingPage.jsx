import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Download,
  Phone,
  Mail,
  Clock,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  CheckCircle,
  HelpCircle,
  Award,
  Globe2,
  FileCheck
} from 'lucide-react';
import aadiVikasBanner from '../assets/aadi_vikas_banner.png';

const LandingPage = () => {
  const [activeTab, setActiveTab] = useState('ALL');

  const updates = [
    {
      date: '28 Sep 2026',
      title: 'MoTA extends Post-Matric ST Scholarship online application submission deadline up to 31st October 2026.',
      link: '/schemes?scheme=post-matric'
    },
    {
      date: '24 Sep 2026',
      title: 'National Fellowship for ST Students (NFST 2026-27): Merit list publication and JRF verification guidelines notified.',
      link: '/schemes?scheme=nfst-fellowship'
    },
    {
      date: '19 Sep 2026',
      title: 'Aadhaar-based biometric e-KYC mandate instituted for all tribal scholarship beneficiaries across states.',
      link: '/track-status'
    },
    {
      date: '12 Sep 2026',
      title: 'Direct Benefit Transfer (DBT) batch processing schedule released for Q3 FY 2026-27 through PFMS/NPCI gateway.',
      link: '/track-status'
    },
    {
      date: '05 Sep 2026',
      title: 'Notice regarding relaxation in parental income proof submission for students hailing from notified PVTG habitations.',
      link: '/schemes?scheme=pre-matric'
    }
  ];

  const schemesGlance = [
    {
      name: 'Pre-Matric Scholarship for ST',
      classes: 'Class IX & X',
      amount: '₹3,500 - ₹7,000 / yr',
      deadline: '31 Oct 2026',
      id: 'pre-matric'
    },
    {
      name: 'Post-Matric Scholarship for ST',
      classes: 'Class XI to PG / Professional',
      amount: 'Compulsory Fees + Maint.',
      deadline: '31 Oct 2026',
      id: 'post-matric'
    },
    {
      name: 'National Fellowship (NFST)',
      classes: 'M.Phil / Ph.D Scholars',
      amount: '₹37,000 - ₹42,000 / mo',
      deadline: '15 Nov 2026',
      id: 'nfst-fellowship'
    },
    {
      name: 'National Overseas Scholarship (NOS)',
      classes: 'Masters / Ph.D Overseas',
      amount: 'Full Fees + Living Allowance',
      deadline: '30 Nov 2026',
      id: 'nos-scholarship'
    },
    {
      name: 'Top Class Education Scheme',
      classes: 'IITs, IIMs, AIIMS, NLUs',
      amount: 'Full Fees + Living Grant',
      deadline: '31 Oct 2026',
      id: 'top-class-education'
    }
  ];

  const detailedSchemes = [
    {
      id: 'pre-matric',
      name: 'Pre-Matric Scholarship for ST Students (Class IX & X)',
      code: 'MTA-PRE-MATRIC-2026',
      description: 'Centrally Sponsored Scheme implemented through State Governments/UT Administrations to minimize dropout rates among tribal students at transition to secondary stage.',
      eligibility: 'ST students enrolled in Class IX & X in Government or recognized schools; Parental annual income not exceeding ₹2.50 Lakh.'
    },
    {
      id: 'post-matric',
      name: 'Post-Matric Scholarship Scheme for Scheduled Tribe Students',
      code: 'MTA-POST-MATRIC-2026',
      description: 'Provides comprehensive financial assistance to ST students pursuing post-matriculation or post-secondary courses in recognized universities and colleges.',
      eligibility: 'All ST students enrolled in recognized higher secondary, graduation, post-graduation, and professional technical diplomas/degrees; Income ≤ ₹2.50 Lakh/annum.'
    },
    {
      id: 'nfst-fellowship',
      name: 'National Fellowship for Higher Education of ST Students (NFST)',
      code: 'MTA-NFST-RESEARCH-2026',
      description: '100% Central Sector Scheme providing 750 fresh fellowships annually to ST scholars pursuing regular and full-time M.Phil. and Ph.D. degrees in Indian Universities.',
      eligibility: 'ST candidates admitted to M.Phil / Ph.D. degree programmes; Selection purely based on UGC-NET / CSIR-NET national scores.'
    },
    {
      id: 'nos-scholarship',
      name: 'National Overseas Scholarship for ST Candidates (NOS)',
      code: 'MTA-NOS-ABROAD-2026',
      description: 'Assists meritorious tribal students in acquiring higher education (Master’s, Ph.D.) in top 500 QS World Ranked universities abroad across engineering, science, medicine, and social sciences.',
      eligibility: 'ST candidates possessing minimum 60% marks in qualifying degree; Family income not exceeding ₹6.00 Lakh/annum; Age below 35 years.'
    },
    {
      id: 'top-class-education',
      name: 'Top Class Education Scheme for ST Students',
      code: 'MTA-TOP-CLASS-2026',
      description: 'Direct funding scheme supporting ST students who secure admission in notified premier institutes of national importance such as IITs, NITs, IIMs, AIIMS, and NLUs.',
      eligibility: 'ST students securing admission in 250+ notified premier institutes on open competition; Family income up to ₹6.00 Lakh per annum.'
    }
  ];

  const circulars = [
    {
      ref: 'MTA/2026/SCH-01/982',
      date: '28-09-2026',
      title: 'Extension of timeline for online application submission for Post-Matric Scholarship for ST Students for Academic Session 2026-27.',
      size: '245 KB'
    },
    {
      ref: 'MTA/2026/NFST/REV-04',
      date: '22-09-2026',
      title: 'Publication of Provisional Merit List and Slot Allocation for National Fellowship for Higher Education (NFST 2026-27).',
      size: '1.4 MB'
    },
    {
      ref: 'MTA/2026/KYC-CIR-11',
      date: '17-09-2026',
      title: 'Advisory on Mandatory Biometric Aadhaar-Based Verification (e-KYC) at Institution Nodal Officer (INO) and District Nodal Officer (DNO) level.',
      size: '312 KB'
    },
    {
      ref: 'MTA/2026/DBT/PFMS-87',
      date: '10-09-2026',
      title: 'Operational Protocol for Direct Benefit Transfer (DBT) through PFMS and Aadhaar Payment Bridge (APB) for FY 2026-27 disbursements.',
      size: '520 KB'
    },
    {
      ref: 'MTA/2026/PVTG-INC-03',
      date: '02-09-2026',
      title: 'Relaxation of income certification procedures for particularly vulnerable tribal groups (PVTGs) under PM-JANMAN mission.',
      size: '188 KB'
    },
    {
      ref: 'MTA/2026/INST-AUD-19',
      date: '25-08-2026',
      title: 'Standard Operating Procedure (SOP) for AISHE code de-duplication and fake institute verification on National Scholarship Registry.',
      size: '640 KB'
    },
    {
      ref: 'MTA/2026/NOS-SELEC-08',
      date: '18-08-2026',
      title: 'List of provisionally selected candidates for National Overseas Scholarship (NOS) - 2nd Selection Cycle 2026.',
      size: '890 KB'
    },
    {
      ref: 'MTA/2026/DIS-BANK-02',
      date: '11-08-2026',
      title: 'Instruction to State Welfare Departments regarding resolution of rejected DBT transaction batches due to inactive bank accounts.',
      size: '410 KB'
    },
    {
      ref: 'MTA/2026/GRIEV-PRG-01',
      date: '04-08-2026',
      title: 'Establishment of 24x7 Multi-lingual Tribal Scholarship Grievance Redressal Cell and Toll-Free Helpline integration with CPGRAMS.',
      size: '275 KB'
    },
    {
      ref: 'MTA/2026/GUIDE-VER-21',
      date: '28-07-2026',
      title: 'Comprehensive Scheme Guidelines for Implementation of Centrally Sponsored Pre-Matric and Post-Matric Schemes for STs (Revised 2026).',
      size: '2.8 MB'
    }
  ];

  return (
    <div className="flex-1 bg-[#F8F9FA] text-[#212529] font-sans pb-10">
      {/* A. BREAKING NEWS TICKER (Thin yellow bar) */}
      <section className="bg-[#FFF9C4] border-b border-[#FBC02D] text-slate-900 py-1.5 px-4 text-xs font-medium" aria-label="Latest Announcements">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <span className="bg-[#D32F2F] text-white font-bold px-2 py-0.5 text-[11px] uppercase tracking-wide shrink-0">
            Latest News
          </span>
          <div className="overflow-hidden whitespace-nowrap flex-1">
            <span className="inline-block animate-pulse font-semibold text-slate-900">
              📢 Last date for submission of online application under Post-Matric Scholarship Scheme for ST Students is extended up to 31st October 2026.
              <span className="mx-4 text-slate-400">|</span>
              New: National Fellowship (NFST) & National Overseas (NOS) applications for 2026-27 are now open.
            </span>
          </div>
          <Link to="/schemes" className="text-[#003366] font-bold underline shrink-0 hidden sm:inline">
            View All Updates →
          </Link>
        </div>
      </section>

      {/* B. HERO BANNER (Container layout with 1px border, not full-width stretched) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-4 pb-3">
        <div className="border border-[#D1D5DB] bg-white p-1 shadow-2xs">
          <div className="relative overflow-hidden bg-[#0A3860]">
            <img
              src={aadiVikasBanner}
              alt="ST Seva Portal - Ministry of Tribal Affairs, Government of India. Official National Tribal Scholarship Portal."
              className="w-full h-auto max-h-[380px] object-cover sm:object-fill block"
            />
            {/* Direct Official Action Ribbon */}
            <div className="bg-[#002244] border-t border-[#001830] text-white py-2 px-4 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-amber-300">Academic Year 2026-27:</span>
                <span className="text-slate-200">Central & State Tribal Welfare Portals Interconnected via DigiLocker & PFMS</span>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  to="/applications/new"
                  className="bg-[#FF9933] hover:bg-amber-500 text-black font-bold px-3 py-1 text-xs"
                  style={{ textDecoration: 'none' }}
                >
                  Apply Online (New Registration)
                </Link>
                <Link
                  to="/track-status"
                  className="bg-white hover:bg-slate-100 text-[#003366] font-bold px-3 py-1 text-xs"
                  style={{ textDecoration: 'none' }}
                >
                  Track Application Status
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* C. THREE-COLUMN INFO BLOCK (Left 60%, Right 40%) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (60% / 7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Latest Updates Heading with 5 items */}
            <div className="border border-[#E0E0E0] bg-white p-4">
              <div className="border-b border-[#003366] pb-2 mb-3 flex items-center justify-between">
                <h2 className="text-base font-serif font-bold text-[#003366] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-[#FF9933] inline-block" />
                  Latest Updates & Announcements
                </h2>
                <span className="text-[11px] text-slate-500 font-sans">Updated: 28 Sep 2026</span>
              </div>

              <div className="divide-y divide-[#E0E0E0]">
                {updates.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-start gap-3 text-xs">
                    <span className="bg-[#F1F5F9] border border-[#CBD5E1] text-[#003366] text-[10px] font-bold px-2 py-0.5 shrink-0 mt-0.5 font-mono">
                      {item.date}
                    </span>
                    <div className="flex-1">
                      <p className="text-slate-800 leading-snug">{item.title}</p>
                      <Link to={item.link} className="text-[#003366] font-semibold text-[11px] underline mt-0.5 inline-block">
                        Read more →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scholarship Schemes at a Glance Table */}
            <div className="border border-[#E0E0E0] bg-white p-4">
              <div className="border-b border-[#003366] pb-2 mb-3 flex items-center justify-between">
                <h2 className="text-base font-serif font-bold text-[#003366] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-[#138808] inline-block" />
                  Scholarship Schemes at a Glance
                </h2>
                <Link to="/schemes" className="text-xs font-bold text-[#003366] underline">
                  All Schemes →
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-[#E0E0E0] border-collapse">
                  <thead>
                    <tr className="bg-[#F1F5F9] text-slate-800 font-bold border-b border-[#E0E0E0]">
                      <th className="p-2 border-r border-[#E0E0E0]">Scheme Name</th>
                      <th className="p-2 border-r border-[#E0E0E0]">Eligibility</th>
                      <th className="p-2 border-r border-[#E0E0E0]">Amount / Support</th>
                      <th className="p-2 border-r border-[#E0E0E0]">Deadline</th>
                      <th className="p-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schemesGlance.map((sg, idx) => (
                      <tr key={idx} className={`gov-table-row ${idx % 2 === 1 ? 'bg-[#F9FAFB]' : 'bg-white'}`}>
                        <td className="p-2 border-r border-[#E0E0E0] font-semibold text-[#003366]">
                          <Link to={`/schemes?scheme=${sg.id}`} className="hover:underline">
                            {sg.name}
                          </Link>
                        </td>
                        <td className="p-2 border-r border-[#E0E0E0] text-slate-700">{sg.classes}</td>
                        <td className="p-2 border-r border-[#E0E0E0] text-slate-700 font-medium">{sg.amount}</td>
                        <td className="p-2 border-r border-[#E0E0E0] text-[#B84D00] font-bold">{sg.deadline}</td>
                        <td className="p-2 text-center">
                          <Link
                            to="/applications/new"
                            className="bg-[#003366] hover:bg-[#083D7C] text-white text-[11px] font-bold px-2 py-1"
                            style={{ textDecoration: 'none' }}
                          >
                            Apply
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column (40% / 5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Quick Links Box (Bordered) */}
            <div className="border border-[#E0E0E0] bg-white p-4">
              <h2 className="text-sm font-serif font-bold text-[#003366] border-b border-[#E0E0E0] pb-2 mb-3 uppercase tracking-wide">
                Quick Links
              </h2>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link
                    to="/applications/new"
                    className="flex items-center justify-between p-2 border border-[#E0E0E0] bg-[#F8F9FA] hover:bg-[#EFF6FF] text-[#003366] font-semibold"
                    style={{ textDecoration: 'none' }}
                  >
                    <span>▶ Apply Online (Student Registration 2026-27)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </li>
                <li>
                  <Link
                    to="/track-status"
                    className="flex items-center justify-between p-2 border border-[#E0E0E0] bg-[#F8F9FA] hover:bg-[#EFF6FF] text-[#003366] font-semibold"
                    style={{ textDecoration: 'none' }}
                  >
                    <span>▶ Check Application Status & Beneficiary Ledger</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </li>
                <li>
                  <Link
                    to="/verify-certificate"
                    className="flex items-center justify-between p-2 border border-[#E0E0E0] bg-[#F8F9FA] hover:bg-[#EFF6FF] text-[#003366] font-semibold"
                    style={{ textDecoration: 'none' }}
                  >
                    <span>▶ Verify Caste & Domicile Certificate (OCR/QR)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </li>
                <li>
                  <a
                    href="#manual"
                    className="flex items-center justify-between p-2 border border-[#E0E0E0] bg-[#F8F9FA] hover:bg-[#EFF6FF] text-slate-700 font-semibold"
                    style={{ textDecoration: 'none' }}
                  >
                    <span>▶ Download User Manual & Standard Operating Procedures</span>
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </li>
                <li>
                  <Link
                    to="/helpdesk/faq"
                    className="flex items-center justify-between p-2 border border-[#E0E0E0] bg-[#F8F9FA] hover:bg-[#EFF6FF] text-slate-700 font-semibold"
                    style={{ textDecoration: 'none' }}
                  >
                    <span>▶ Frequently Asked Questions (FAQs) & Income Formats</span>
                    <HelpCircle className="w-3.5 h-3.5" />
                  </Link>
                </li>
                <li>
                  <Link
                    to="/official-portal"
                    className="flex items-center justify-between p-2 border border-slate-300 bg-[#F1F5F9] hover:bg-slate-200 text-[#003366] font-bold"
                    style={{ textDecoration: 'none' }}
                  >
                    <span>▶ Institute / District Officer Scrutiny Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </li>
              </ul>
            </div>

            {/* Important Notices Box (Bordered, Yellow Background) */}
            <div className="border border-[#FDE68A] bg-[#FFFBEB] p-4 text-xs">
              <div className="flex items-center gap-2 text-[#92400E] font-bold font-serif mb-2">
                <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                <span className="text-sm">Important Statutory Notices</span>
              </div>
              <ul className="space-y-2 text-[#78350F] list-disc list-inside">
                <li>
                  <span className="font-semibold">New Parental Income Cap:</span> Family income ceiling for Pre-Matric and Post-Matric schemes stands at ₹2,50,000/- per annum as verified through State Revenue APIs or valid income certificates.
                </li>
                <li>
                  <span className="font-semibold">Aadhaar Seeded Bank Accounts:</span> Beneficiaries must ensure that their savings bank account is seeded with NPCI mapped Aadhaar number to receive 100% DBT transfers directly.
                </li>
                <li>
                  <span className="font-semibold">Institution Verification Deadline:</span> Institutions must verify all applications before 10th November 2026. Unverified forms cannot be approved by State Nodal Officers.
                </li>
              </ul>
            </div>

            {/* Helpline Box */}
            <div className="border border-[#CBD5E1] bg-white p-4 text-xs">
              <h3 className="font-serif font-bold text-[#003366] text-sm border-b border-[#E0E0E0] pb-2 mb-2.5">
                Central Helpdesk & Grievance Contact
              </h3>
              <div className="space-y-2 text-slate-700">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#003366] shrink-0" />
                  <div>
                    <span className="font-semibold">Toll Free Helpline:</span> 0120-6619540 / 1800-11-7700
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#003366] shrink-0" />
                  <div>
                    <span className="font-semibold">Email:</span> helpdesk-stseva@tribal.gov.in / helpdesk@nsp.gov.in
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#003366] shrink-0" />
                  <div>
                    <span className="font-semibold">Working Hours:</span> 09:00 AM to 06:00 PM (Monday to Saturday)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* D. SCHEMES SECTION (Not cards. A real table / structured list layout with alternating row backgrounds) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-4">
        <div className="border border-[#E0E0E0] bg-white p-4 sm:p-6">
          <div className="border-b border-[#003366] pb-2 mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-serif font-bold text-[#003366]">
                Centrally Sponsored & Central Sector ST Scholarship Schemes
              </h2>
              <p className="text-xs text-slate-600 font-sans mt-0.5">
                Administered by Ministry of Tribal Affairs, Government of India
              </p>
            </div>
            <Link to="/schemes" className="text-xs font-bold text-[#003366] underline">
              View Detailed Operational Guidelines →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-[#E0E0E0] border-collapse">
              <thead>
                <tr className="bg-[#EAEFF5] text-slate-900 font-bold border-b border-[#CBD5E1]">
                  <th className="p-3 border-r border-[#E0E0E0] w-12 text-center">#</th>
                  <th className="p-3 border-r border-[#E0E0E0] w-1/4">Scheme Name & Code</th>
                  <th className="p-3 border-r border-[#E0E0E0] w-2/5">Scheme Scope & Objective</th>
                  <th className="p-3 border-r border-[#E0E0E0]">Target Eligibility</th>
                  <th className="p-3 text-center w-28">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0E0E0]">
                {detailedSchemes.map((s, idx) => (
                  <tr
                    key={s.id}
                    className={`gov-table-row ${idx % 2 === 1 ? 'bg-[#F9FAFB]' : 'bg-white'}`}
                  >
                    <td className="p-3 border-r border-[#E0E0E0] text-center font-bold text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="p-3 border-r border-[#E0E0E0]">
                      <div className="font-serif font-bold text-[#003366] text-sm">
                        {s.name}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                        Code: {s.code}
                      </div>
                    </td>
                    <td className="p-3 border-r border-[#E0E0E0] text-slate-700 leading-relaxed">
                      {s.description}
                    </td>
                    <td className="p-3 border-r border-[#E0E0E0] text-slate-700 leading-relaxed">
                      {s.eligibility}
                    </td>
                    <td className="p-3 text-center align-middle">
                      <div className="flex flex-col gap-1.5 items-center">
                        <Link
                          to={`/schemes?scheme=${s.id}`}
                          className="text-[#003366] font-bold underline text-xs"
                        >
                          View Details
                        </Link>
                        <Link
                          to="/applications/new"
                          className="bg-[#003366] hover:bg-[#083D7C] text-white text-[11px] font-bold px-3 py-1 border border-[#002244]"
                          style={{ textDecoration: 'none' }}
                        >
                          Apply Online
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* E. STATISTICS BAND (Single row, NO cards, numbers in large bold, labels below in small caps) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-4">
        <div className="bg-[#003366] text-white border border-[#002244] py-6 px-4 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-blue-800">
            <div className="pt-2 md:pt-0">
              <div className="text-3xl sm:text-4xl font-black font-serif text-white tracking-tight">
                44,00,000+
              </div>
              <div className="text-[11px] uppercase tracking-wider text-slate-300 font-semibold mt-1">
                Students Benefited
              </div>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="text-3xl sm:text-4xl font-black font-serif text-white tracking-tight">
                5
              </div>
              <div className="text-[11px] uppercase tracking-wider text-slate-300 font-semibold mt-1">
                Scholarship Schemes
              </div>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="text-3xl sm:text-4xl font-black font-serif text-white tracking-tight">
                22
              </div>
              <div className="text-[11px] uppercase tracking-wider text-slate-300 font-semibold mt-1">
                Official Languages
              </div>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="text-3xl sm:text-4xl font-black font-serif text-white tracking-tight">
                24x7
              </div>
              <div className="text-[11px] uppercase tracking-wider text-slate-300 font-semibold mt-1">
                Helpline & Grievance Desk
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* F. HOW TO APPLY (Numbered steps in simple circles, NOT icon cards) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-4">
        <div className="border border-[#E0E0E0] bg-white p-4 sm:p-6">
          <div className="border-b border-[#003366] pb-2 mb-4">
            <h2 className="text-base font-serif font-bold text-[#003366]">
              How to Apply for ST Scholarships — Step-by-Step Procedure
            </h2>
            <p className="text-xs text-slate-600 font-sans mt-0.5">
              Standard procedure for fresh and renewal scholarship registration for Academic Session 2026-27
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              {
                step: '1',
                title: 'Register on ST Seva Portal',
                desc: 'Generate Scholar One-Time Registration (OTR) ID using Aadhaar / DigiLocker verification.'
              },
              {
                step: '2',
                title: 'Fill Application Form',
                desc: 'Enter personal particulars, academic records, AISHE institute code, and course details.'
              },
              {
                step: '3',
                title: 'Upload Documents',
                desc: 'Attach ST caste certificate, annual income certificate, and marksheet copy.'
              },
              {
                step: '4',
                title: 'Institute Verification',
                desc: 'Your college / school Nodal Officer verifies the application dossier on the portal.'
              },
              {
                step: '5',
                title: 'Track Status & DBT',
                desc: 'Sanction by District Officer and direct disbursement to Aadhaar seeded bank account.'
              }
            ].map((item) => (
              <div key={item.step} className="border border-[#E0E0E0] p-3.5 bg-[#F8F9FA] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-[#003366] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {item.step}
                    </div>
                    <h3 className="font-serif font-bold text-[#003366] text-xs leading-tight">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* G. NOTIFICATIONS & CIRCULARS TABLE (10 rows visible, "View All" link at bottom) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-4">
        <div className="border border-[#E0E0E0] bg-white p-4 sm:p-6">
          <div className="border-b border-[#003366] pb-2 mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-serif font-bold text-[#003366]">
                Statutory Notifications, Orders & Official Circulars
              </h2>
              <p className="text-xs text-slate-600 font-sans mt-0.5">
                Official documents issued by Ministry of Tribal Affairs (Scholarship Division)
              </p>
            </div>
            <span className="text-xs bg-[#F1F5F9] border border-[#CBD5E1] px-2 py-0.5 text-slate-700 font-semibold">
              Showing 10 Latest Circulars
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-[#E0E0E0] border-collapse">
              <thead>
                <tr className="bg-[#F1F5F9] text-slate-900 font-bold border-b border-[#E0E0E0]">
                  <th className="p-2.5 border-r border-[#E0E0E0] w-28">Date</th>
                  <th className="p-2.5 border-r border-[#E0E0E0]">Notification / Circular Title & Reference</th>
                  <th className="p-2.5 border-r border-[#E0E0E0] w-28 text-center">File Size</th>
                  <th className="p-2.5 text-center w-36">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0E0E0]">
                {circulars.map((circ, idx) => (
                  <tr key={idx} className={`gov-table-row ${idx % 2 === 1 ? 'bg-[#F9FAFB]' : 'bg-white'}`}>
                    <td className="p-2.5 border-r border-[#E0E0E0] font-mono text-slate-700 font-medium">
                      {circ.date}
                    </td>
                    <td className="p-2.5 border-r border-[#E0E0E0]">
                      <div className="text-slate-900 font-medium leading-snug">
                        {circ.title}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Ref No: {circ.ref}
                      </div>
                    </td>
                    <td className="p-2.5 border-r border-[#E0E0E0] text-center font-mono text-slate-500">
                      {circ.size}
                    </td>
                    <td className="p-2.5 text-center">
                      <a
                        href="#download-circular"
                        onClick={(e) => {
                          e.preventDefault();
                          alert(`Downloading official circular: ${circ.ref}`);
                        }}
                        className="inline-flex items-center gap-1 text-[#003366] font-bold text-xs hover:underline"
                      >
                        <FileText className="w-3.5 h-3.5 text-red-700" />
                        <span>Download (PDF)</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 pt-3 border-t border-[#E0E0E0] flex justify-between items-center text-xs">
            <span className="text-slate-500">Archive records available from Year 2014 onwards</span>
            <a href="#circulars-archive" className="text-[#003366] font-bold underline">
              View All Circulars & Gazettes →
            </a>
          </div>
        </div>
      </section>

      {/* About Us anchor target for navbar */}
      <div id="about" className="max-w-7xl mx-auto px-4 sm:px-8 pt-4">
        <div className="border border-[#E0E0E0] bg-white p-4 sm:p-6 text-xs text-slate-700 space-y-2">
          <h2 className="text-base font-serif font-bold text-[#003366] border-b border-[#003366] pb-1">
            About ST Seva Portal — Ministry of Tribal Affairs
          </h2>
          <p className="leading-relaxed">
            The ST Seva Portal is the dedicated National e-Governance platform established under the Ministry of Tribal Affairs, Government of India, in technical partnership with the National e-Governance Division (NeGD) and the National Informatics Centre (NIC). It serves as a unified digital lifecycle platform for the identification, verification, awarding, and Direct Benefit Transfer (DBT) of scholarships to students belonging to Scheduled Tribes across India.
          </p>
          <p className="leading-relaxed">
            By connecting state welfare departments, academic institutions, DigiLocker cryptographic document vaults, and the Public Financial Management System (PFMS), the portal guarantees leak-proof, timely, and transparent affirmative welfare delivery directly into students' Aadhaar-linked accounts.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
