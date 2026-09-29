import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import TopLoadingBar from './components/common/TopLoadingBar';
import { AuthProvider } from './context/AuthContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { VernacularProvider } from './context/VernacularContext';
import TopAccessibilityBar from './components/layout/TopAccessibilityBar';
import GovHeader from './components/layout/GovHeader';
import GovFooter from './components/layout/GovFooter';
import ProtectedRoute from './components/layout/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import DashboardRouter from './pages/dashboard/DashboardRouter';
import StudentProfilePage from './pages/profile/StudentProfilePage';
import OfficerProfilePage from './pages/profile/OfficerProfilePage';
import AdminProfilePage from './pages/profile/AdminProfilePage';
import ActiveSessionsPage from './pages/security/ActiveSessionsPage';
import MfaSetupPage from './pages/security/MfaSetupPage';
import SchemesPage from './pages/SchemesPage';
import DigiLockerServicesPage from './pages/DigiLockerServicesPage';
import ApplicationsListPage from './pages/applications/ApplicationsListPage';
import NewApplicationWizard from './pages/applications/NewApplicationWizard';
import StatusTrackingPage from './pages/applications/StatusTrackingPage';
import CertificateVerificationPage from './pages/documents/CertificateVerificationPage';
import ApplicationPreviewPage from './pages/applications/ApplicationPreviewPage';
import ApplicationTimelinePage from './pages/applications/ApplicationTimelinePage';
import DocumentsVaultPage from './pages/documents/DocumentsVaultPage';
import InstitutionDashboardPage from './pages/institutions/InstitutionDashboardPage';
import StudentVerificationDetailPage from './pages/institutions/StudentVerificationDetailPage';
import InstitutionGrievancesPage from './pages/institutions/InstitutionGrievancesPage';
import OfficerScrutinyDashboardPage from './pages/scrutiny/OfficerScrutinyDashboardPage';
import ScrutinyDossierPage from './pages/scrutiny/ScrutinyDossierPage';
import OfficerAllocationSimulatorPage from './pages/allocation/OfficerAllocationSimulatorPage';
import OfficerMeritListPage from './pages/allocation/OfficerMeritListPage';
import StudentMeritStatusPage from './pages/allocation/StudentMeritStatusPage';
import OfficerDbtWorkbenchPage from './pages/dbt/OfficerDbtWorkbenchPage';
import OfficerBatchDetailPage from './pages/dbt/OfficerBatchDetailPage';
import StudentDbtTrackingPage from './pages/dbt/StudentDbtTrackingPage';
import NotificationCenterPage from './pages/notifications/NotificationCenterPage';
import NotificationPreferencesPage from './pages/notifications/NotificationPreferencesPage';
import OfficerBroadcastPage from './pages/notifications/OfficerBroadcastPage';
import FileGrievancePage from './pages/grievance/FileGrievancePage';
import GrievanceTrackerPage from './pages/grievance/GrievanceTrackerPage';
import OfficerGrievanceDeskPage from './pages/grievance/OfficerGrievanceDeskPage';
import HelpdeskFaqPage from './pages/grievance/HelpdeskFaqPage';
import ExecutiveBiDashboardPage from './pages/analytics/ExecutiveBiDashboardPage';
import AdminPortalPage from './pages/admin/AdminPortalPage';
import GatewayWorkbenchPage from './pages/gateways/GatewayWorkbenchPage';
import MobilePwaHubPage from './pages/mobile/MobilePwaHubPage';
import VaptSecurityDeskPage from './pages/security/VaptSecurityDeskPage';
import ProductionGoLivePage from './pages/production/ProductionGoLivePage';
import OfficialPortalPage from './pages/admin/OfficialPortalPage';
import ScholarshipAssistantPage from './pages/assistant/ScholarshipAssistantPage';
import ScholarshipChatbot from './components/chat/ScholarshipChatbot';

function AnimatedAppContent() {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen">
      <TopLoadingBar />
      <TopAccessibilityBar />
      <GovHeader />

      <main id="main-content" className="flex-1 flex flex-col overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex-1 flex flex-col w-full"
          >
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/schemes" element={<SchemesPage />} />
                <Route path="/track-status" element={<StatusTrackingPage />} />
                <Route path="/status" element={<StatusTrackingPage />} />
                <Route path="/verify-certificate" element={<CertificateVerificationPage />} />
                <Route path="/apply" element={<NewApplicationWizard />} />
                <Route path="/applications/new" element={<NewApplicationWizard />} />
                <Route path="/assistant" element={<ScholarshipAssistantPage />} />
                <Route path="/digilocker-services" element={<DigiLockerServicesPage />} />
                <Route path="/official-portal" element={<OfficialPortalPage />} />
                <Route path="/authority/portal" element={<OfficialPortalPage />} />
                <Route path="/welfare-admin" element={<OfficialPortalPage />} />

                {/* Protected Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardRouter />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/applications"
                  element={
                    <ProtectedRoute allowedRoles={['student', 'admin', 'super_admin']}>
                      <ApplicationsListPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/applications/new"
                  element={
                    <ProtectedRoute allowedRoles={['student', 'admin', 'super_admin']}>
                      <NewApplicationWizard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/applications/:id"
                  element={
                    <ProtectedRoute allowedRoles={['student', 'officer', 'admin', 'super_admin']}>
                      <ApplicationPreviewPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/applications/:id/timeline"
                  element={
                    <ProtectedRoute allowedRoles={['student', 'officer', 'admin', 'super_admin']}>
                      <ApplicationTimelinePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/documents"
                  element={
                    <ProtectedRoute allowedRoles={['student', 'officer', 'admin', 'super_admin']}>
                      <DocumentsVaultPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/institution/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['institution', 'officer', 'admin', 'super_admin']}>
                      <InstitutionDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/institution/verify/:id"
                  element={
                    <ProtectedRoute allowedRoles={['institution', 'officer', 'admin', 'super_admin']}>
                      <StudentVerificationDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/institution/grievances"
                  element={
                    <ProtectedRoute allowedRoles={['institution', 'officer', 'admin', 'super_admin']}>
                      <InstitutionGrievancesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/officer/scrutiny"
                  element={
                    <ProtectedRoute allowedRoles={['officer', 'admin', 'super_admin']}>
                      <OfficerScrutinyDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/officer/scrutiny/:id"
                  element={
                    <ProtectedRoute allowedRoles={['officer', 'admin', 'super_admin']}>
                      <ScrutinyDossierPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/officer/allocations"
                  element={
                    <ProtectedRoute allowedRoles={['officer', 'admin', 'super_admin']}>
                      <OfficerAllocationSimulatorPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/officer/allocations/:id/merit-list"
                  element={
                    <ProtectedRoute allowedRoles={['officer', 'admin', 'super_admin']}>
                      <OfficerMeritListPage />
                    </ProtectedRoute>
                  }
                />
                  <Route
                    path="/student/merit-status"
                    element={
                      <ProtectedRoute allowedRoles={['student', 'admin', 'super_admin']}>
                        <StudentMeritStatusPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/officer/dbt"
                    element={
                      <ProtectedRoute allowedRoles={['officer', 'admin', 'super_admin']}>
                        <OfficerDbtWorkbenchPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/officer/dbt/batches/:id"
                    element={
                      <ProtectedRoute allowedRoles={['officer', 'admin', 'super_admin']}>
                        <OfficerBatchDetailPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/student/dbt-tracking"
                    element={
                      <ProtectedRoute allowedRoles={['student', 'admin', 'super_admin']}>
                        <StudentDbtTrackingPage />
                      </ProtectedRoute>
                    }
                  />
                <Route
                  path="/student/profile"
                  element={
                    <ProtectedRoute allowedRoles={['student', 'admin', 'super_admin']}>
                      <StudentProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/officer/profile"
                  element={
                    <ProtectedRoute allowedRoles={['officer', 'admin', 'super_admin']}>
                      <OfficerProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/profile"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                      <AdminProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/security/sessions"
                  element={
                    <ProtectedRoute>
                      <ActiveSessionsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/security/mfa"
                  element={
                    <ProtectedRoute>
                      <MfaSetupPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <NotificationCenterPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notifications/preferences"
                  element={
                    <ProtectedRoute>
                      <NotificationPreferencesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/officer/broadcasts"
                  element={
                    <ProtectedRoute allowedRoles={['officer', 'admin', 'super_admin']}>
                      <OfficerBroadcastPage />
                    </ProtectedRoute>
                  }
                />

                {/* Phase 9: Grievance Redressal & Helpdesk System */}
                <Route path="/helpdesk/faq" element={<HelpdeskFaqPage />} />
                <Route path="/grievance/track" element={<GrievanceTrackerPage />} />
                <Route path="/grievance/track/:ticketNumber" element={<GrievanceTrackerPage />} />
                <Route
                  path="/grievance/file"
                  element={
                    <ProtectedRoute>
                      <FileGrievancePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/officer/grievances"
                  element={
                    <ProtectedRoute allowedRoles={['officer', 'admin', 'super_admin']}>
                      <OfficerGrievanceDeskPage />
                    </ProtectedRoute>
                  }
                />

                {/* Phase 10: Reports, Analytics & Executive BI Dashboard */}
                <Route
                  path="/officer/analytics"
                  element={
                    <ProtectedRoute allowedRoles={['officer', 'admin', 'super_admin']}>
                      <ExecutiveBiDashboardPage />
                    </ProtectedRoute>
                  }
                />

                {/* Phase 11: System Administration, Multi-Tenancy & RBAC */}
                <Route
                  path="/admin/portal"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'super_admin', 'officer']}>
                      <AdminPortalPage />
                    </ProtectedRoute>
                  }
                />

                {/* Phase 12: External Gateway Integrations & API Interoperability */}
                <Route
                  path="/officer/gateways"
                  element={
                    <ProtectedRoute allowedRoles={['officer', 'admin', 'super_admin']}>
                      <GatewayWorkbenchPage />
                    </ProtectedRoute>
                  }
                />

                {/* Phase 13: Mobile Readiness, Offline PWA & Vernacular Support */}
                <Route path="/mobile/pwa-hub" element={<MobilePwaHubPage />} />

                {/* Phase 14: Security Hardening, Cryptographic Integrity & VAPT Compliance */}
                <Route
                  path="/security/vapt-desk"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'super_admin', 'officer']}>
                      <VaptSecurityDeskPage />
                    </ProtectedRoute>
                  }
                />

                {/* Phase 15: Production Readiness, DR & Go-Live Final Journey */}
                <Route
                  path="/production/go-live"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'super_admin', 'officer']}>
                      <ProductionGoLivePage />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>

        <GovFooter />
        <ScholarshipChatbot />
      </div>
  );
}

function App() {
  return (
    <AccessibilityProvider>
      <VernacularProvider>
        <AuthProvider>
          <BrowserRouter>
            <AnimatedAppContent />
          </BrowserRouter>
        </AuthProvider>
      </VernacularProvider>
    </AccessibilityProvider>
  );
}

export default App;
