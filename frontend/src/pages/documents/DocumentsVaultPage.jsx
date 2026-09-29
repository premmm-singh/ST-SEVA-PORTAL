import React, { useState, useEffect } from 'react';
import documentService from '../../services/documentService';
import DocumentUploader from '../../components/documents/DocumentUploader';
import DocumentViewerModal from '../../components/documents/DocumentViewerModal';
import { useAuth } from '../../context/AuthContext';

const CATEGORY_TABS = [
  { key: 'ALL', label: 'All Documents' },
  { key: 'CASTE_CERTIFICATE', label: 'ST Caste Certificate' },
  { key: 'INCOME_CERTIFICATE', label: 'Income Certificate' },
  { key: 'MARKSHEET', label: 'Marksheets' },
  { key: 'DOMICILE_CERTIFICATE', label: 'Domicile' },
  { key: 'BANK_PASSBOOK', label: 'Bank Passbook' },
  { key: 'FEE_RECEIPT', label: 'Fee Receipts' }
];

export default function DocumentsVaultPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [expiringDocs, setExpiringDocs] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [viewerDoc, setViewerDoc] = useState(null);
  const [showUploader, setShowUploader] = useState(false);
  const [integrityChecking, setIntegrityChecking] = useState({});
  const [digiLockerLoading, setDigiLockerLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [docs, expiring] = await Promise.all([
        documentService.getDocuments({ include_history: false }),
        documentService.getExpiringDocuments(30)
      ]);
      setDocuments(docs);
      setExpiringDocs(expiring.expiring_documents || []);
    } catch (err) {
      console.error("Error loading document vault:", err);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleVerifyIntegrity = async (docId) => {
    try {
      setIntegrityChecking(prev => ({ ...prev, [docId]: true }));
      const res = await documentService.verifyIntegrity(docId);
      if (res.is_valid) {
        showNotification(`Cryptographic Check Passed: SHA-256 integrity verified (${res.stored_sha256.slice(0, 16)}...)`);
      } else {
        showNotification(`Integrity Failure! File on disk does not match recorded hash.`, 'error');
      }
    } catch (err) {
      showNotification('Integrity verification failed.', 'error');
    } finally {
      setIntegrityChecking(prev => ({ ...prev, [docId]: false }));
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Are you sure you want to remove ${doc.original_filename}?`)) return;
    try {
      await documentService.deleteDocument(doc.id);
      showNotification(`Document ${doc.original_filename} removed from your vault.`);
      loadData();
    } catch (err) {
      showNotification('Failed to remove document.', 'error');
    }
  };

  const handleDigiLockerPull = async (category) => {
    try {
      setDigiLockerLoading(true);
      const doc = await documentService.pullFromDigiLocker(category);
      showNotification(`Successfully pulled verified ${doc.document_category} from DigiLocker!`);
      loadData();
    } catch (err) {
      showNotification(err.response?.data?.detail || 'Failed to fetch from DigiLocker gateway.', 'error');
    } finally {
      setDigiLockerLoading(false);
    }
  };

  const filteredDocs = documents.filter(doc => {
    if (activeTab === 'ALL') return true;
    return doc.document_category === activeTab;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Top Header Card */}
        <div className="bg-white border-t-4 border-[#ff6600] rounded-lg shadow-sm p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#ff6600]">
              <span>Government of India</span>
              <span>•</span>
              <span>MeitY Digital Locker & Document Vault</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              Encrypted Document Vault
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Store, verify, and manage your certificates. Protected with AES-256 encryption at rest, SHA-256 integrity, and ClamAV scanning.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => handleDigiLockerPull('CASTE_CERTIFICATE')}
              disabled={digiLockerLoading}
              className="inline-flex items-center px-4 py-2 border border-[#005696] text-xs font-bold rounded-md text-[#005696] bg-blue-50 hover:bg-blue-100 transition shadow-sm disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {digiLockerLoading ? 'Fetching from DigiLocker...' : 'Pull from DigiLocker'}
            </button>
            <button
              onClick={() => setShowUploader(!showUploader)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-xs font-bold rounded-md text-white bg-[#ff6600] hover:bg-[#e05a00] transition shadow-sm"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {showUploader ? 'Close Upload Form' : 'Upload New Document'}
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {notification && (
          <div className={`p-4 rounded-md text-xs font-bold border flex items-center justify-between ${
            notification.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-green-50 text-green-800 border-green-200'
          }`}>
            <span>{notification.msg}</span>
            <button onClick={() => setNotification(null)} className="text-xs font-bold ml-4">✕</button>
          </div>
        )}

        {/* Feature 34: Document Expiry Alert Banner */}
        {expiringDocs.length > 0 && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="text-xs font-bold text-amber-900 uppercase">
                  Validity Notice: Certificates Expiring Soon
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  You have {expiringDocs.length} certificate(s) expiring within the next 30 days. Welfare regulations require an updated annual income certificate for scholarship disbursement.
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => handleDigiLockerPull('INCOME_CERTIFICATE')}
                    className="text-xs font-bold text-amber-900 underline hover:text-black"
                  >
                    Pull Latest Income Certificate from DigiLocker →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Uploader Section */}
        {showUploader && (
          <DocumentUploader
            onUploadSuccess={(newDoc) => {
              showNotification(`Document ${newDoc.original_filename} uploaded and encrypted!`);
              setShowUploader(false);
              loadData();
            }}
          />
        )}

        {/* Category Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-2 flex overflow-x-auto gap-2">
          {CATEGORY_TABS.map(tab => {
            const count = tab.key === 'ALL' 
              ? documents.length 
              : documents.filter(d => d.document_category === tab.key).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md whitespace-nowrap transition ${
                  activeTab === tab.key 
                    ? 'bg-[#0d3b66] text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.label}
                <span className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Document Cards Grid */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#ff6600] mx-auto"></div>
            <p className="mt-3 text-xs text-slate-500 font-medium">Fetching verified vault records...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-bold text-slate-900">No documents in this category</h3>
            <p className="mt-1 text-xs text-slate-500">Upload your proof or pull it directly from your DigiLocker account.</p>
            <div className="mt-4 flex justify-center gap-3">
              <button
                onClick={() => setShowUploader(true)}
                className="px-4 py-2 bg-[#ff6600] text-white text-xs font-bold rounded shadow-sm hover:bg-[#e05a00]"
              >
                Upload File
              </button>
              <button
                onClick={() => handleDigiLockerPull(activeTab === 'ALL' ? 'CASTE_CERTIFICATE' : activeTab)}
                className="px-4 py-2 border border-[#0d3b66] text-[#0d3b66] text-xs font-bold rounded hover:bg-blue-50"
              >
                Pull from DigiLocker
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map(doc => {
              const isChecking = integrityChecking[doc.id];
              return (
                <div 
                  key={doc.id}
                  className="bg-white rounded-lg shadow-sm border border-slate-200 hover:border-[#0d3b66] transition p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-[#0d3b66] px-2 py-0.5 rounded border border-blue-200 truncate max-w-[180px]">
                        {doc.document_category}
                      </span>
                      <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                        v{doc.version}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 truncate" title={doc.original_filename}>
                      {doc.original_filename}
                    </h3>

                    <div className="text-[11px] text-slate-500 space-y-0.5">
                      <div>Size: {(doc.file_size_bytes / 1024).toFixed(1)} KB • {doc.mime_type}</div>
                      <div>Uploaded: {new Date(doc.created_at).toLocaleDateString('en-IN')}</div>
                      {doc.expiry_date && (
                        <div className={doc.is_expired ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                          Validity: {doc.is_expired ? 'Expired on ' : 'Valid until '} {doc.expiry_date}
                        </div>
                      )}
                      {doc.source === 'DIGILOCKER_FETCH' && (
                        <div className="text-emerald-700 font-semibold flex items-center gap-1">
                          <span>✔ DigiLocker Verified Issuer</span>
                        </div>
                      )}
                    </div>

                    {/* Security Seals */}
                    <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-bold">
                      <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200">
                        AES-256 Encrypted
                      </span>
                      <span className="bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded border border-blue-200">
                        ClamAV Clean
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setViewerDoc(doc)}
                        className="px-3 py-1.5 text-xs font-bold text-[#0d3b66] bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition"
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => handleVerifyIntegrity(doc.id)}
                        disabled={isChecking}
                        className="px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition"
                        title="Run cryptographic SHA-256 integrity verification"
                      >
                        {isChecking ? 'Checking...' : 'SHA-256 Check'}
                      </button>
                    </div>

                    <button
                      onClick={() => handleDelete(doc)}
                      className="text-xs font-bold text-rose-600 hover:text-rose-800 p-1"
                      title="Soft delete document"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* In-Browser Document Viewer Modal (Feature 33 & 36) */}
        {viewerDoc && (
          <DocumentViewerModal
            document={viewerDoc}
            isOpen={!!viewerDoc}
            onClose={() => setViewerDoc(null)}
          />
        )}

      </div>
    </div>
  );
}
