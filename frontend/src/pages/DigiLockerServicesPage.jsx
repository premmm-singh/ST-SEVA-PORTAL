import React from 'react';
import { ShieldCheck, FileCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const DigiLockerServicesPage = () => {
  return (
    <div className="flex-1 py-8 px-4 sm:px-8 max-w-7xl mx-auto w-full space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">DigiLocker Ecosystem Integration</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              National Paperless Document Verification under Digital India & Ministry of Tribal Affairs
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 rounded-lg bg-emerald-50/50 border border-emerald-200 space-y-2">
          <FileCheck className="w-6 h-6 text-emerald-700" />
          <h2 className="text-sm font-bold text-slate-800">1. Instant Caste Verification</h2>
          <p className="text-xs text-slate-600">
            Digitally signed ST caste certificates issued by State Revenue authorities (e-District / JharSewa / Odisha e-District) are imported without manual document scrutiny.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-emerald-50/50 border border-emerald-200 space-y-2">
          <FileCheck className="w-6 h-6 text-emerald-700" />
          <h2 className="text-sm font-bold text-slate-800">2. Income & Domicile Sync</h2>
          <p className="text-xs text-slate-600">
            Current year income certificates automatically fetched from DigiLocker repository with electronic seals, ensuring zero document tampering.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-emerald-50/50 border border-emerald-200 space-y-2">
          <FileCheck className="w-6 h-6 text-emerald-700" />
          <h2 className="text-sm font-bold text-slate-800">3. Board & AISHE Marksheets</h2>
          <p className="text-xs text-slate-600">
            CBSE, ICSE, and State Board secondary/higher secondary marksheets instantly verified against National Academic Depository (NAD).
          </p>
        </div>
      </div>

      <div className="text-center pt-4">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-3 rounded-lg shadow-sm transition text-sm"
        >
          <span>Connect with DigiLocker SSO</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default DigiLockerServicesPage;
