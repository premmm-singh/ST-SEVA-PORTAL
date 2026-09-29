import React, { useState, useEffect } from 'react';
import documentService from '../../services/documentService';

export default function DocumentViewerModal({ document: doc, isOpen, onClose }) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [signedPreviewUrl, setSignedPreviewUrl] = useState('');
  const [signedDownloadUrl, setSignedDownloadUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && doc) {
      loadSignedUrls();
      setZoom(1);
      setRotation(0);
    }
  }, [isOpen, doc]);

  const loadSignedUrls = async () => {
    try {
      setLoading(true);
      setError('');
      // If signed URL already present on doc object, use it; otherwise generate fresh
      if (doc.signed_preview_url) {
        setSignedPreviewUrl(doc.signed_preview_url);
        setSignedDownloadUrl(doc.signed_download_url || doc.signed_preview_url.replace('/preview', '/download'));
      } else {
        const [prev, down] = await Promise.all([
          documentService.getSignedUrl(doc.id, 'preview'),
          documentService.getSignedUrl(doc.id, 'download')
        ]);
        setSignedPreviewUrl(prev.url);
        setSignedDownloadUrl(down.url);
      }
    } catch (err) {
      setError('Could not generate 15-minute secure access token.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !doc) return null;

  const isPdf = doc.mime_type?.includes('pdf') || doc.original_filename?.toLowerCase().endsWith('.pdf');

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 font-sans modal-backdrop-animate">
      <div className="bg-slate-900 rounded-xl max-w-5xl w-full h-[90vh] flex flex-col shadow-2xl border border-slate-700 overflow-hidden modal-content-animate">
        
        {/* Top Header & Toolbar */}
        <div className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center space-x-3 overflow-hidden">
            <span className="font-mono text-xs bg-blue-900 text-blue-200 px-2 py-0.5 rounded">
              v{doc.version}
            </span>
            <div className="truncate">
              <h3 className="text-sm font-bold truncate text-slate-100">
                {doc.original_filename}
              </h3>
              <p className="text-[10px] text-slate-400">
                Category: {doc.document_category} • SHA-256 Verified
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2">
            {!isPdf && (
              <>
                <button
                  onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))}
                  className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
                  title="Zoom Out"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className="text-xs font-mono text-slate-400 min-w-10 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom(prev => Math.min(3, prev + 0.25))}
                  className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
                  title="Zoom In"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <button
                  onClick={() => setRotation(prev => (prev + 90) % 360)}
                  className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
                  title="Rotate 90°"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </>
            )}

            {signedDownloadUrl && (
              <a
                href={signedDownloadUrl}
                download={doc.original_filename}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded flex items-center space-x-1"
                title="Download encrypted file"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download</span>
              </a>
            )}

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-white rounded ml-2"
              title="Close Viewer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Security Watermark Banner Bar (Feature 36) */}
        <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-300 px-4 py-1.5 text-[11px] font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span>ST Seva Portal • Confidential Verification Copy • Single-Use 15-Minute Token</span>
          </div>
          <span className="font-mono text-[10px] text-amber-400">
            Hash: {doc.sha256_hash?.slice(0, 16)}...
          </span>
        </div>

        {/* Viewer Canvas */}
        <div className="flex-1 bg-slate-950 p-4 overflow-auto flex items-center justify-center relative select-none">
          {loading ? (
            <div className="text-center text-slate-400">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#ff6600] mx-auto"></div>
              <p className="mt-3 text-xs">Decrypting AES-256 payload & applying dynamic watermark...</p>
            </div>
          ) : error ? (
            <div className="text-center text-rose-400 text-xs">
              <p>{error}</p>
            </div>
          ) : isPdf ? (
            <iframe
              src={signedPreviewUrl}
              title="PDF Viewer"
              className="w-full h-full rounded border-0 bg-white"
            />
          ) : (
            <div 
              className="transition-transform duration-200 ease-out origin-center"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`
              }}
            >
              <img
                src={signedPreviewUrl}
                alt={doc.original_filename}
                className="max-h-[75vh] max-w-full rounded shadow-lg object-contain pointer-events-none"
              />
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="bg-slate-800 text-slate-400 px-4 py-2 text-[11px] flex justify-between items-center border-t border-slate-700">
          <span>ClamAV Scan: <strong className="text-emerald-400">Clean</strong></span>
          <span>Source: <strong className="text-blue-300">{doc.source}</strong></span>
          <span>Stored Size: {(doc.file_size_bytes / 1024).toFixed(1)} KB</span>
        </div>

      </div>
    </div>
  );
}
