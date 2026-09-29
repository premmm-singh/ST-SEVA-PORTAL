import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Award, FileCheck2, ShieldCheck, LayoutDashboard, Search, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const GovNavbar = () => {
  const { user } = useAuth();

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-semibold transition border-b-2 ${
      isActive
        ? 'border-[#0B4D9C] text-[#0B4D9C] bg-blue-50/50'
        : 'border-transparent text-slate-700 hover:text-[#0B4D9C] hover:bg-slate-50'
    }`;

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between overflow-x-auto">
        <div className="flex items-center space-x-1 sm:space-x-2 whitespace-nowrap">
          <NavLink to="/" className={navLinkClass} end>
            <Home className="w-4 h-4" />
            <span>Home</span>
          </NavLink>

          {user && (
            <NavLink to="/dashboard" className={navLinkClass}>
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </NavLink>
          )}

          <NavLink to="/schemes" className={navLinkClass}>
            <Award className="w-4 h-4" />
            <span>ST Schemes</span>
          </NavLink>

          <NavLink to="/digilocker-services" className={navLinkClass}>
            <FileCheck2 className="w-4 h-4" />
            <span>DigiLocker Services</span>
          </NavLink>

          {user && (
            <>
              <NavLink to="/security/sessions" className={navLinkClass}>
                <ShieldCheck className="w-4 h-4" />
                <span>Active Sessions</span>
              </NavLink>

              <NavLink to="/security/mfa" className={navLinkClass}>
                <KeyRound className="w-4 h-4" />
                <span>Two-Factor Auth (MFA)</span>
              </NavLink>
            </>
          )}
        </div>

        {/* Global Search shortcut */}
        <div className="hidden md:flex items-center text-slate-400 pl-4">
          <Search className="w-4 h-4 hover:text-[#0B4D9C] cursor-pointer transition" />
        </div>
      </div>
    </nav>
  );
};

export default GovNavbar;
