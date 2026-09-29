import React from 'react';
import { Link } from 'react-router-dom';

const GovFooter = () => {
  return (
    <footer id="contact" className="bg-[#EAEFF5] text-slate-800 text-xs mt-auto border-t border-[#CBD5E1] font-sans">
      {/* Top 5-Column Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 border-b border-[#CBD5E1] pb-8">
          {/* Column 1: Get to Know */}
          <div>
            <h4 className="font-serif font-bold text-slate-900 text-sm mb-3 border-b border-[#CBD5E1] pb-1">
              Get to Know
            </h4>
            <ul className="space-y-1.5 text-slate-700">
              <li><a href="#about" className="hover:text-[#003366] hover:underline">About Us</a></li>
              <li><a href="#privacy" className="hover:text-[#003366] hover:underline">Privacy Policy</a></li>
              <li><a href="#terms" className="hover:text-[#003366] hover:underline">Terms of Service</a></li>
              <li><Link to="/helpdesk/faq" className="hover:text-[#003366] hover:underline">FAQ</Link></li>
              <li><a href="#casestudy" className="hover:text-[#003366] hover:underline">Case Study & Reports</a></li>
            </ul>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="font-serif font-bold text-slate-900 text-sm mb-3 border-b border-[#CBD5E1] pb-1">
              Quick Links
            </h4>
            <ul className="space-y-1.5 text-slate-700">
              <li><Link to="/dashboard" className="hover:text-[#003366] hover:underline">Dashboard</Link></li>
              <li><Link to="/schemes" className="hover:text-[#003366] hover:underline">Schemes</Link></li>
              <li><a href="#partners" className="hover:text-[#003366] hover:underline">Partners</a></li>
              <li><a href="#contact" className="hover:text-[#003366] hover:underline">Contact Us</a></li>
              <li><a href="#videoguide" className="hover:text-[#003366] hover:underline">Video Guide</a></li>
              <li><a href="#ebook" className="hover:text-[#003366] hover:underline">eBook</a></li>
              <li><a href="#manual" className="hover:text-[#003366] hover:underline">User Manual</a></li>
              <li><a href="#accessibility" className="hover:text-[#003366] hover:underline">Accessibility</a></li>
            </ul>
          </div>

          {/* Column 3: Useful Links */}
          <div>
            <h4 className="font-serif font-bold text-slate-900 text-sm mb-3 border-b border-[#CBD5E1] pb-1">
              Useful Links
            </h4>
            <ul className="space-y-1.5 text-slate-700">
              <li>
                <a href="https://negd.gov.in" target="_blank" rel="noreferrer" className="hover:text-[#003366] hover:underline flex items-center gap-1">
                  <span>NeGD (National e-Governance)</span>
                </a>
              </li>
              <li>
                <a href="https://digitalindia.gov.in" target="_blank" rel="noreferrer" className="hover:text-[#003366] hover:underline">
                  Digital India
                </a>
              </li>
              <li>
                <a href="https://mygov.in" target="_blank" rel="noreferrer" className="hover:text-[#003366] hover:underline">
                  myGov (मेरी सरकार)
                </a>
              </li>
              <li>
                <a href="https://india.gov.in" target="_blank" rel="noreferrer" className="hover:text-[#003366] hover:underline">
                  india.gov.in (National Portal)
                </a>
              </li>
              <li>
                <a href="https://tribal.nic.in" target="_blank" rel="noreferrer" className="hover:text-[#003366] hover:underline">
                  Ministry of Tribal Affairs (tribal.nic.in)
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Grievance */}
          <div>
            <h4 className="font-serif font-bold text-slate-900 text-sm mb-3 border-b border-[#CBD5E1] pb-1">
              Grievance Redressal
            </h4>
            <ul className="space-y-1.5 text-slate-700">
              <li>
                <a href="https://pgportal.gov.in" target="_blank" rel="noreferrer" className="hover:text-[#003366] hover:underline">
                  CPGRAMS Portal
                </a>
              </li>
              <li>
                <a href="https://consumerhelpline.gov.in" target="_blank" rel="noreferrer" className="hover:text-[#003366] hover:underline">
                  National Consumer Helpline
                </a>
              </li>
              <li>
                <Link to="/grievance/file" className="hover:text-[#003366] hover:underline">
                  NSP & ST Seva Grievance
                </Link>
              </li>
              <li>
                <span className="text-slate-600 block text-[11px] mt-1">
                  Central Helpdesk: 0120-6619540
                </span>
              </li>
            </ul>
          </div>

          {/* Column 5: Visitors Counter */}
          <div>
            <h4 className="font-serif font-bold text-slate-900 text-sm mb-3 border-b border-[#CBD5E1] pb-1">
              Visitor Statistics
            </h4>
            <div className="space-y-3">
              <div>
                <span className="text-slate-600 text-[11px] block">Total Portal Hits:</span>
                <div className="bg-white px-3 py-1.5 border border-[#CBD5E1] font-mono font-bold text-[#003366] text-base tracking-wider inline-block mt-1">
                  196,623,074
                </div>
              </div>
              <div className="text-[11px] text-slate-600 space-y-0.5">
                <div><span>Unique Visitors Today:</span> <span className="font-mono font-semibold text-slate-800">142,890</span></div>
                <div><span>Applications Ingested:</span> <span className="font-mono font-semibold text-slate-800">4,412,506</span></div>
              </div>
              <div className="pt-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                  Secured by STQC & NIC Cert-In
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Strip: Copyright, Last Updated, Version, Made in India */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-600">
          <div className="space-y-1 text-center md:text-left">
            <p>
              Website designed, developed and hosted by <strong className="text-slate-800">National Informatics Centre (NIC)</strong> &amp; <strong className="text-slate-800">National e-Governance Division (NeGD)</strong>.
            </p>
            <p>
              Content Owned and Maintained by <strong className="text-slate-800">Ministry of Tribal Affairs, Government of India</strong>.
            </p>
          </div>

          {/* Right metadata badge */}
          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <span className="border border-slate-300 bg-white px-2 py-0.5 font-medium">
              Last Updated: <strong>28 September 2026</strong>
            </span>
            <span className="border border-slate-300 bg-white px-2 py-0.5 font-mono">
              v-26.4.12
            </span>
            {/* Made in India Emblem */}
            <div className="flex items-center gap-1 border border-slate-300 bg-white px-2 py-0.5 font-semibold text-slate-700" title="Make in India / Made in India">
              <span className="text-[#FF9933] font-bold">Made in</span>
              <span className="text-[#003366] font-bold">India</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default GovFooter;
