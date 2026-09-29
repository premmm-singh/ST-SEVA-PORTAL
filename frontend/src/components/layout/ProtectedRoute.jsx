import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0B4D9C]" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-lg border border-red-200 text-center shadow-sm">
        <h2 className="text-xl font-bold text-red-700">Access Restricted</h2>
        <p className="mt-2 text-slate-600 text-sm">
          Your account role (<span className="font-semibold uppercase">{user.role}</span>) does not have authorization to view this government resource.
        </p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
