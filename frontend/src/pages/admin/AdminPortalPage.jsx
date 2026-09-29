import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Settings,
  FileText,
  UserCheck,
  Palette,
  Activity,
  Trash2,
  Lock,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  Key,
  Globe,
  Sliders,
  Server,
  ArrowRight
} from 'lucide-react';
import adminService from '../../services/adminService';

export const AdminPortalPage = () => {
  const [activeTab, setActiveTab] = useState('rbac'); // 'rbac' | 'delegations' | 'configs' | 'audit' | 'impersonation' | 'tenant' | 'health' | 'retention'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  // Data states
  const [rbacMatrix, setRbacMatrix] = useState([]);
  const [delegations, setDelegations] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [configCategory, setConfigCategory] = useState('ALL');
  const [auditLogs, setAuditLogs] = useState({ total_records: 0, chain_verified: true, records: [] });
  const [tenantConfig, setTenantConfig] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);

  // Modals & form states
  const [showPermModal, setShowPermModal] = useState(false);
  const [permForm, setPermForm] = useState({ role: 'officer', resource: 'sanction_orders', permission: 'APPROVE', scope: 'DISTRICT', description: '' });

  const [showDelegationModal, setShowDelegationModal] = useState(false);
  const [delegationForm, setDelegationForm] = useState({ delegatee_id: '', district: 'Ranchi', role_delegated: 'DWO', valid_days: 14, reason: 'Official field inspection coverage' });

  const [editingConfigKey, setEditingConfigKey] = useState(null);
  const [configValueInput, setConfigValueInput] = useState('');

  // Shadow mode form
  const [shadowForm, setShadowForm] = useState({ target_user_id: '', justification: 'Resolution of DWO scrutiny backlog ticket', read_only: true });
  const [activeShadow, setActiveShadow] = useState(null);

  // Retention purge
  const [retentionResult, setRetentionResult] = useState(null);
  const [purging, setPurging] = useState(false);

  const fetchTabInitialData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setStatusMsg({ text: '', type: '' });

    try {
      const [rbacRes, delRes, cfgRes, audRes, tenRes, hltRes] = await Promise.all([
        adminService.getRbacMatrix(),
        adminService.getActiveDelegations(),
        adminService.getSystemConfigs(),
        adminService.getAuditTrail(25, 0),
        adminService.getTenantConfig('JH'),
        adminService.getSystemHealth()
      ]);

      setRbacMatrix(rbacRes || []);
      setDelegations(delRes || []);
      setConfigs(cfgRes || []);
      setAuditLogs(audRes || { total_records: 0, chain_verified: true, records: [] });
      setTenantConfig(tenRes || null);
      setSystemHealth(hltRes || null);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      setStatusMsg({ text: 'Unable to load administration data. Please check permissions.', type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTabInitialData();
  }, []);

  const handleSavePermission = async (e) => {
    e.preventDefault();
    try {
      await adminService.setRolePermission(permForm);
      setShowPermModal(false);
      setStatusMsg({ text: 'Role permission matrix successfully updated!', type: 'success' });
      const updated = await adminService.getRbacMatrix();
      setRbacMatrix(updated);
    } catch (err) {
      alert('Error updating permission: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleCreateDelegation = async (e) => {
    e.preventDefault();
    try {
      const validFrom = new Date();
      const validTo = new Date();
      validTo.setDate(validTo.getDate() + parseInt(delegationForm.valid_days || 14));

      await adminService.createDelegation({
        delegatee_id: delegationForm.delegatee_id,
        district: delegationForm.district,
        role_delegated: delegationForm.role_delegated,
        valid_from: validFrom.toISOString(),
        valid_to: validTo.toISOString(),
        reason: delegationForm.reason
      });

      setShowDelegationModal(false);
      setStatusMsg({ text: 'Officer delegation active and broadcast to district log!', type: 'success' });
      const updated = await adminService.getActiveDelegations();
      setDelegations(updated);
    } catch (err) {
      alert('Error creating delegation: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleRevokeDelegation = async (delId) => {
    if (!window.confirm('Are you sure you want to revoke this administrative delegation?')) return;
    try {
      await adminService.revokeDelegation(delId);
      setStatusMsg({ text: 'Delegation successfully revoked.', type: 'success' });
      const updated = await adminService.getActiveDelegations();
      setDelegations(updated);
    } catch (err) {
      alert('Error revoking delegation: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleUpdateConfig = async (key) => {
    try {
      await adminService.updateSystemConfig(key, { config_value: configValueInput });
      setEditingConfigKey(null);
      setStatusMsg({ text: `Configuration parameter '${key}' updated live!`, type: 'success' });
      const updated = await adminService.getSystemConfigs();
      setConfigs(updated);
    } catch (err) {
      alert('Error updating parameter: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleStartShadow = async (e) => {
    e.preventDefault();
    try {
      const res = await adminService.startImpersonation(shadowForm);
      setActiveShadow(res);
      setStatusMsg({ text: `Shadow session initiated for user ${res.target_user_email}!`, type: 'success' });
    } catch (err) {
      alert('Impersonation error: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleSaveTenant = async (e) => {
    e.preventDefault();
    try {
      const res = await adminService.updateTenantConfig({
        portal_title: tenantConfig.portal_title,
        helpline_phone: tenantConfig.helpline_phone,
        helpline_email: tenantConfig.helpline_email
      }, 'JH');
      setTenantConfig(res);
      setStatusMsg({ text: 'State portal branding & contact information updated!', type: 'success' });
    } catch (err) {
      alert('Error updating tenant config: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleRunPurge = async (dryRun) => {
    setPurging(true);
    try {
      const res = await adminService.executeRetentionPurge({ entity_type: 'APPLICATION', dry_run: dryRun });
      setRetentionResult(res);
    } catch (err) {
      alert('Data retention purge error: ' + (err.response?.data?.detail || err.message));
    } finally {
      setPurging(false);
    }
  };

  const filteredConfigs = configCategory === 'ALL'
    ? configs
    : configs.filter(c => c.category.toUpperCase() === configCategory.toUpperCase());

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#005696] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium">Loading Government Administration Console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans pb-16">
      {/* Top Banner / Govt Ribbon */}
      <div className="bg-slate-900 text-white px-6 py-2 text-xs flex justify-between items-center border-b border-slate-700">
        <div className="flex items-center space-x-2">
          <span className="bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">
            NIC ADMIN CORE v11.4
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-300">Department of Scheduled Tribe & SC Welfare, Govt. of Jharkhand</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="flex items-center text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
            DPDP Act 2023 Compliant
          </span>
          <span className="text-slate-400">Audit Hash-Chain: VERIFIED</span>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-[#005696]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                System Administration & Governance Command Center
              </h1>
              <p className="text-sm text-slate-500">
                Multi-Tier RBAC, Dynamic System Registry, Officer Delegation, Forensics & System Telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => fetchTabInitialData(true)}
              disabled={refreshing}
              className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition shadow-sm"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#005696]' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status banner */}
      {statusMsg.text && (
        <div className="max-w-7xl mx-auto px-6 pt-4">
          <div className={`p-3.5 rounded-lg flex items-center justify-between text-xs font-semibold ${
            statusMsg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}>
            <span>{statusMsg.text}</span>
            <button onClick={() => setStatusMsg({ text: '', type: '' })} className="text-sm font-bold">&times;</button>
          </div>
        </div>
      )}

      {/* Shadow Session Warning Alert */}
      {activeShadow && (
        <div className="max-w-7xl mx-auto px-6 pt-4">
          <div className="p-4 bg-amber-500 text-slate-900 rounded-xl font-medium text-xs flex justify-between items-center shadow-sm">
            <div className="flex items-center space-x-2">
              <Eye className="w-5 h-5 text-slate-900 animate-pulse" />
              <span>
                <b>SUPER-ADMIN SHADOW SESSION ACTIVE:</b> Impersonating {activeShadow.target_user_email} ({activeShadow.target_user_role}) [Read-Only: {String(activeShadow.read_only)}]
              </span>
            </div>
            <button
              onClick={() => setActiveShadow(null)}
              className="bg-slate-900 text-white px-3 py-1 rounded text-xs hover:bg-slate-800 transition"
            >
              Terminate Shadow Session
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 mt-4">
        <div className="max-w-7xl mx-auto px-6 flex space-x-6 overflow-x-auto text-sm font-medium">
          {[
            { id: 'rbac', label: 'RBAC Permission Matrix', icon: Users },
            { id: 'delegations', label: 'Officer Delegations', icon: UserCheck },
            { id: 'configs', label: 'System Configuration Registry', icon: Sliders },
            { id: 'audit', label: 'Forensics Audit Trail', icon: FileText },
            { id: 'impersonation', label: 'Shadow Impersonation', icon: Key },
            { id: 'tenant', label: 'State White-Labeling', icon: Palette },
            { id: 'health', label: 'System Telemetry & Probes', icon: Server },
            { id: 'retention', label: 'Data Retention & Purge', icon: Trash2 }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-3.5 border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? 'border-[#005696] text-[#005696] font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#005696]' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        {/* ================= TAB 1: RBAC MATRIX ================= */}
        {activeTab === 'rbac' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg flex items-center space-x-2">
                    <Users className="w-5 h-5 text-[#005696]" />
                    <span>Hierarchical Role-Based Access Control (RBAC) Matrix</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Fine-grained statutory access rules defined across MoTA National, State, District, and College boundaries.
                  </p>
                </div>
                <button
                  onClick={() => setShowPermModal(true)}
                  className="bg-[#005696] hover:bg-[#00477D] text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Assign Permission</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Target Resource</th>
                      <th className="py-2.5 px-3">Permission Granted</th>
                      <th className="py-2.5 px-3">Enforcement Scope</th>
                      <th className="py-2.5 px-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rbacMatrix.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 font-bold text-slate-800 capitalize">{item.role}</td>
                        <td className="py-3 px-3 font-mono font-medium text-[#005696]">{item.resource}</td>
                        <td className="py-3 px-3">
                          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono font-bold">
                            {item.permission}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                            {item.scope}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500">{item.description || 'Standard institutional role permission'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: OFFICER DELEGATIONS ================= */}
        {activeTab === 'delegations' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg flex items-center space-x-2">
                    <UserCheck className="w-5 h-5 text-[#005696]" />
                    <span>District & Taluk Officer Transfer / Delegation Log</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Temporary administrative charge handovers, acting appointments, and leave coverage.
                  </p>
                </div>
                <button
                  onClick={() => setShowDelegationModal(true)}
                  className="bg-[#005696] hover:bg-[#00477D] text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Delegation</span>
                </button>
              </div>

              {delegations.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No active temporary delegations registered in the system.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">District</th>
                        <th className="py-2.5 px-3">Delegated Role</th>
                        <th className="py-2.5 px-3">Delegator ID</th>
                        <th className="py-2.5 px-3">Delegatee ID</th>
                        <th className="py-2.5 px-3">Validity Window</th>
                        <th className="py-2.5 px-3">Reason</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {delegations.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-3 font-bold text-slate-800">{d.district}</td>
                          <td className="py-3 px-3 font-mono font-bold text-[#005696]">{d.role_delegated}</td>
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{d.delegator_id.slice(0, 8)}...</td>
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{d.delegatee_id.slice(0, 8)}...</td>
                          <td className="py-3 px-3 text-slate-600">
                            {new Date(d.valid_from).toLocaleDateString()} &rarr; {new Date(d.valid_to).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-3 text-slate-600">{d.reason}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              d.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {d.is_active ? 'ACTIVE' : 'REVOKED'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            {d.is_active && (
                              <button
                                onClick={() => handleRevokeDelegation(d.id)}
                                className="text-red-600 hover:text-red-800 font-semibold"
                              >
                                Revoke
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3: SYSTEM CONFIGS ================= */}
        {activeTab === 'configs' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg flex items-center space-x-2">
                    <Sliders className="w-5 h-5 text-[#005696]" />
                    <span>System Configuration Registry & Dynamic Parameter Tuning</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Hot-configurable portal rules and thresholds active in real-time without restarting services.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {['ALL', 'SLA', 'DBT', 'SECURITY'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setConfigCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        configCategory === cat
                          ? 'bg-[#005696] text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredConfigs.map((cfg) => {
                  const isEditing = editingConfigKey === cfg.config_key;
                  return (
                    <div key={cfg.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="font-mono text-xs font-bold text-slate-800">{cfg.config_key}</span>
                          <span className="bg-blue-100 text-[#005696] px-2 py-0.5 rounded text-[10px] font-bold">
                            {cfg.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{cfg.description}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                        {isEditing ? (
                          <div className="flex items-center space-x-2 w-full">
                            <input
                              type="text"
                              value={configValueInput}
                              onChange={(e) => setConfigValueInput(e.target.value)}
                              className="text-xs border border-slate-300 rounded px-2 py-1 flex-1 font-mono focus:outline-none"
                            />
                            <button
                              onClick={() => handleUpdateConfig(cfg.config_key)}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingConfigKey(null)}
                              className="px-2 py-1 text-slate-500 text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-slate-400">Value:</span>
                              <span className="font-mono text-sm font-bold text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-200">
                                {cfg.config_value}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                setEditingConfigKey(cfg.config_key);
                                setConfigValueInput(cfg.config_value);
                              }}
                              className="text-xs font-semibold text-[#005696] hover:underline"
                            >
                              Edit Parameter
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: AUDIT TRAIL ================= */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-[#005696]" />
                    <span>Forensics Audit Trail Explorer (SHA-256 Tamper-Evident)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Permanent immutable audit records cryptographically chained to prevent administrative alteration.
                  </p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Hash Chain Cryptographically Verified</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Timestamp (UTC)</th>
                      <th className="py-2.5 px-3">Action</th>
                      <th className="py-2.5 px-3">Resource Type</th>
                      <th className="py-2.5 px-3">User Role</th>
                      <th className="py-2.5 px-3">IP Address</th>
                      <th className="py-2.5 px-3">Cryptographic SHA-256 Seal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {auditLogs.records.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 text-slate-500">{new Date(rec.timestamp).toLocaleString()}</td>
                        <td className="py-3 px-3 font-bold text-slate-800">{rec.action}</td>
                        <td className="py-3 px-3 text-[#005696]">{rec.resource}</td>
                        <td className="py-3 px-3 font-sans font-semibold text-slate-600">{rec.user_role}</td>
                        <td className="py-3 px-3 text-slate-500">{rec.ip_address}</td>
                        <td className="py-3 px-3 text-[10px] text-slate-400 break-all">{rec.sha256_hash.slice(0, 24)}...</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: SHADOW IMPERSONATION ================= */}
        {activeTab === 'impersonation' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-2xl">
              <h3 className="font-bold text-slate-900 text-lg flex items-center space-x-2 mb-2">
                <Key className="w-5 h-5 text-amber-600" />
                <span>Super-Admin Officer Impersonation / Shadow Mode</span>
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Enables designated state administrators to inspect user sessions for troubleshooting with mandatory statutory audit logging.
              </p>

              <form onSubmit={handleStartShadow} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Target User ID (Officer / Student)</label>
                  <input
                    type="text"
                    value={shadowForm.target_user_id}
                    onChange={(e) => setShadowForm({ ...shadowForm, target_user_id: e.target.value })}
                    required
                    placeholder="e.g. 7e02b794-814a-466d-a602-4c22b109e51c"
                    className="w-full border border-slate-300 rounded px-3 py-2 font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#005696]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Mandatory Justification / Ticket Number</label>
                  <textarea
                    rows={2}
                    value={shadowForm.justification}
                    onChange={(e) => setShadowForm({ ...shadowForm, justification: e.target.value })}
                    required
                    className="w-full border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none"
                  ></textarea>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="readOnlyToggle"
                    checked={shadowForm.read_only}
                    onChange={(e) => setShadowForm({ ...shadowForm, read_only: e.target.checked })}
                    className="rounded accent-[#005696]"
                  />
                  <label htmlFor="readOnlyToggle" className="text-slate-700 font-medium">
                    Enforce Read-Only Shadow Session (Prevent Accidental Action Execution)
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-lg transition"
                  >
                    Initiate Shadow Session
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= TAB 6: MULTI-TENANT WHITE-LABELING ================= */}
        {activeTab === 'tenant' && tenantConfig && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-2xl">
              <h3 className="font-bold text-slate-900 text-lg flex items-center space-x-2 mb-2">
                <Palette className="w-5 h-5 text-[#005696]" />
                <span>Multi-Tenant Architecture & State White-Labeling</span>
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Customize state portal branding, official helplines, localized contact points, and domain settings.
              </p>

              <form onSubmit={handleSaveTenant} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">State Code</label>
                    <input
                      type="text"
                      disabled
                      value={tenantConfig.state_code}
                      className="w-full border border-slate-200 bg-slate-100 rounded px-3 py-2 text-slate-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">State Name</label>
                    <input
                      type="text"
                      disabled
                      value={tenantConfig.state_name}
                      className="w-full border border-slate-200 bg-slate-100 rounded px-3 py-2 text-slate-500 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Portal Display Title</label>
                  <input
                    type="text"
                    value={tenantConfig.portal_title}
                    onChange={(e) => setTenantConfig({ ...tenantConfig, portal_title: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Official Toll-Free Helpline</label>
                    <input
                      type="text"
                      value={tenantConfig.helpline_phone}
                      onChange={(e) => setTenantConfig({ ...tenantConfig, helpline_phone: e.target.value })}
                      className="w-full border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Official Support Email</label>
                    <input
                      type="email"
                      value={tenantConfig.helpline_email}
                      onChange={(e) => setTenantConfig({ ...tenantConfig, helpline_email: e.target.value })}
                      className="w-full border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="bg-[#005696] hover:bg-[#00477D] text-white font-bold px-4 py-2 rounded-lg transition"
                  >
                    Save Branding Configurations
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= TAB 7: SYSTEM TELEMETRY ================= */}
        {activeTab === 'health' && systemHealth && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-400 block font-semibold uppercase">Portal Availability</span>
                <span className="text-xl font-bold text-emerald-700 mt-1 block">{systemHealth.uptime_percentage}%</span>
                <span className="text-[10px] text-emerald-600 font-medium">99.98% SLA Guaranteed</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-400 block font-semibold uppercase">API p95 Latency</span>
                <span className="text-xl font-bold text-indigo-700 mt-1 block">{systemHealth.api_p95_latency_ms} ms</span>
                <span className="text-[10px] text-slate-500 font-medium">Sub-50ms target</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-400 block font-semibold uppercase">Cache Hit Ratio</span>
                <span className="text-xl font-bold text-slate-800 mt-1 block">{systemHealth.cache_hit_ratio_pct}%</span>
                <span className="text-[10px] text-slate-500 font-medium">Redis In-Memory</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-400 block font-semibold uppercase">DB Connection Pool</span>
                <span className="text-xl font-bold text-slate-800 mt-1 block">
                  {systemHealth.db_pool_active_connections} / {systemHealth.db_pool_available_connections}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Active / Available</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h4 className="font-bold text-slate-900 text-sm mb-4">Statutory External Gateway Probes</h4>
              <div className="space-y-3">
                {systemHealth.services.map((srv, i) => (
                  <div key={i} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{srv.service_name}</span>
                        <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          {srv.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{srv.details}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-700">{srv.latency_ms} ms</span>
                      <span className="text-[10px] text-slate-400 block">Round-trip response</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 8: RETENTION & DPDP PURGE ================= */}
        {activeTab === 'retention' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-2xl">
              <h3 className="font-bold text-slate-900 text-lg flex items-center space-x-2 mb-2">
                <Trash2 className="w-5 h-5 text-red-600" />
                <span>DPDP Act 2023 Statutory Data Retention & Purge</span>
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Complies with statutory data minimization mandates under the Digital Personal Data Protection Act 2023. Historical candidate files older than 7 years are securely expunged.
              </p>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs mb-6">
                <div className="flex justify-between">
                  <span className="text-slate-500">Statutory Retention Ceiling:</span>
                  <span className="font-bold text-slate-900">7 Academic Years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Applicable Mandate:</span>
                  <span className="font-bold text-[#005696]">DPDP Act 2023 & MoTA Archive Guidelines</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Purge Execution Mode:</span>
                  <span className="font-bold text-amber-700">Cryptographically Certified</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => handleRunPurge(true)}
                  disabled={purging}
                  className="px-4 py-2 bg-slate-800 text-white font-semibold text-xs rounded-lg hover:bg-slate-700 transition"
                >
                  Run Compliance Dry-Run Audit
                </button>
                <button
                  onClick={() => handleRunPurge(false)}
                  disabled={purging}
                  className="px-4 py-2 bg-red-700 text-white font-semibold text-xs rounded-lg hover:bg-red-800 transition"
                >
                  Execute Statutory Purge
                </button>
              </div>

              {retentionResult && (
                <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-800 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Statutory Retention Verification Complete!</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 text-slate-700">
                    <div>Dry Run: <b>{String(retentionResult.dry_run)}</b></div>
                    <div>Eligible Records: <b>{retentionResult.eligible_records_count}</b></div>
                    <div>Purged Records: <b>{retentionResult.purged_records_count}</b></div>
                    <div>Certificate ID: <b className="font-mono text-[#005696]">{retentionResult.certificate_id}</b></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: ASSIGN PERMISSION */}
      {showPermModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-sm text-slate-900">Assign / Override Role Permission</h3>
              <button onClick={() => setShowPermModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">&times;</button>
            </div>
            <form onSubmit={handleSavePermission} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Target Role</label>
                <select
                  value={permForm.role}
                  onChange={(e) => setPermForm({ ...permForm, role: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none"
                >
                  <option value="student">Student</option>
                  <option value="institution">Institution</option>
                  <option value="officer">Officer (DWO)</option>
                  <option value="auditor">Auditor</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Resource Name</label>
                <input
                  type="text"
                  value={permForm.resource}
                  onChange={(e) => setPermForm({ ...permForm, resource: e.target.value })}
                  required
                  placeholder="e.g. applications, sanction_orders, dbt"
                  className="w-full border border-slate-300 rounded px-3 py-2 text-slate-800 font-mono focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Permission</label>
                  <input
                    type="text"
                    value={permForm.permission}
                    onChange={(e) => setPermForm({ ...permForm, permission: e.target.value })}
                    required
                    placeholder="e.g. APPROVE, READ_WRITE"
                    className="w-full border border-slate-300 rounded px-3 py-2 text-slate-800 font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Scope</label>
                  <select
                    value={permForm.scope}
                    onChange={(e) => setPermForm({ ...permForm, scope: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none"
                  >
                    <option value="NATIONAL">NATIONAL</option>
                    <option value="STATE">STATE</option>
                    <option value="DISTRICT">DISTRICT</option>
                    <option value="INSTITUTION">INSTITUTION</option>
                    <option value="OWN">OWN</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Description / Justification</label>
                <input
                  type="text"
                  value={permForm.description}
                  onChange={(e) => setPermForm({ ...permForm, description: e.target.value })}
                  placeholder="Statutory delegation rule"
                  className="w-full border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPermModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#005696] text-white font-medium rounded hover:bg-[#00477D] transition"
                >
                  Save Permission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE DELEGATION */}
      {showDelegationModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-sm text-slate-900">Create Officer Delegation</h3>
              <button onClick={() => setShowDelegationModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">&times;</button>
            </div>
            <form onSubmit={handleCreateDelegation} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Delegatee Officer User ID</label>
                <input
                  type="text"
                  value={delegationForm.delegatee_id}
                  onChange={(e) => setDelegationForm({ ...delegationForm, delegatee_id: e.target.value })}
                  required
                  placeholder="UUID of acting officer"
                  className="w-full border border-slate-300 rounded px-3 py-2 font-mono text-slate-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">District</label>
                  <input
                    type="text"
                    value={delegationForm.district}
                    onChange={(e) => setDelegationForm({ ...delegationForm, district: e.target.value })}
                    required
                    className="w-full border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Validity (Days)</label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={delegationForm.valid_days}
                    onChange={(e) => setDelegationForm({ ...delegationForm, valid_days: e.target.value })}
                    required
                    className="w-full border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Statutory Reason</label>
                <input
                  type="text"
                  value={delegationForm.reason}
                  onChange={(e) => setDelegationForm({ ...delegationForm, reason: e.target.value })}
                  required
                  placeholder="e.g. Official tour, medical leave coverage"
                  className="w-full border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowDelegationModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#005696] text-white font-medium rounded hover:bg-[#00477D] transition"
                >
                  Authorize Delegation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPortalPage;
