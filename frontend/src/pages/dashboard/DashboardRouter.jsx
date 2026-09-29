import React from 'react';
import { useAuth } from '../../context/AuthContext';
import StudentProfilePage from '../profile/StudentProfilePage';
import OfficerProfilePage from '../profile/OfficerProfilePage';
import AdminProfilePage from '../profile/AdminProfilePage';
import InstitutionDashboardPage from '../institutions/InstitutionDashboardPage';

const DashboardRouter = () => {
  const { user } = useAuth();

  if (!user) return null;

  if (user.role === 'institution') {
    return <InstitutionDashboardPage />;
  }
  if (user.role === 'officer') {
    return <OfficerProfilePage />;
  }
  if (user.role === 'admin' || user.role === 'super_admin') {
    return <AdminProfilePage />;
  }
  return <StudentProfilePage />;
};

export default DashboardRouter;
