import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import documentService from '../../services/documentService';
import AnimatedCheckmark from '../common/AnimatedCheckmark';

const CATEGORIES = [
  { key: 'CASTE_CERTIFICATE', label: 'ST Caste Certificate (Mandatory)' },
  { key: 'INCOME_CERTIFICATE', label: 'Annual Income Certificate (1-Year Validity)' },
  { key: 'MARKSHEET', label: 'Marksheet / Educational Transcript' },
  { key: 'DOMICILE_CERTIFICATE', label: 'Domicile / Residential Certificate' },
  { key: 'BANK_PASSBOOK', label: 'Bank Passbook / Cancelled Cheque (DBT Linked)' },
  { key: 'FEE_RECEIPT', label: 'Institutional Fee Receipt / Bonafide' },
  { key: 'DISABILITY_CERTIFICATE', label: 'Disability Certificate (PwD, if applicable)' }
];

export default function DocumentUploader({ onUploadSuccess, initialCategory = 'CASTE_CERTIFICATE', applicationId = null }) {
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState(initialCategory);
  const [issuedDate, setIssuedDate] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [sha256Preview, setSha256Preview] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  // Client-side SHA-256 computation (Feature 30)
  const computeClientHash = async (fileObj) => {
    try {
      const buffer = await fileObj.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      setSha256Preview(hashHex);
    } catch (err) {
      console.warn("Client hash calculation skipped:", err);
    }
  };

  // Client-side Canvas Image Compression (Feature 27)
  const compressImage = (imageFile) => {
    return new Promise((resolve) => {
      if (!imageFile.type.startsWith('image/')) {
        resolve(imageFile);
        return;
      }
      setIsCompressing(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 1600;
          const MAX_HEIGHT = 1600;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            setIsCompressing(false);
            if (blob && blob.size < imageFile.size) {
              const compressedFile = new File([blob], imageFile.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(imageFile);
            }
          }, 'image/jpeg', 0.82); // 82% quality compression
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(imageFile);
    });
  };

  const handleFileSelect = async (selectedFile) => {
    if (!selectedFile) return;
    setErrorMsg('');

    // Permitted format check
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(selectedFile.type.toLowerCase())) {
      setErrorMsg('Invalid file format. Allowed formats: PDF, JPG, PNG, WEBP.');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setErrorMsg('File size exceeds the 10 MB maximum limit.');
      return;
    }

    let finalFile = selectedFile;
    if (selectedFile.type.startsWith('image/')) {
      finalFile = await compressImage(selectedFile);
    }

    setFile(finalFile);
    await computeClientHash(finalFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg('Please select or drop a document to upload.');
      return;
    }

    try {
      setUploading(true);
      setErrorMsg('');
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_category', category);
      if (applicationId) formData.append('application_id', applicationId);
      if (issuedDate) formData.append('issued_date', issuedDate);

      const uploadedDoc = await documentService.uploadDocument(formData, (percent) => {
        setUploadProgress(percent);
      });

      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);

      setFile(null);
      setSha256Preview('');
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';

      if (onUploadSuccess) {
        onUploadSuccess(uploadedDoc);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to upload document. Please retry.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Upload Verification Proof
          </h3>
          <p className="text-[11px] text-slate-500">
            Encrypted with AES-256 at rest • Scanned by ClamAV • SHA-256 verified
          </p>
        </div>
        <div className="flex items-center space-x-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
          <span>🔒 MeitY AES-256 Vault</span>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded">
          {errorMsg}
        </div>
      )}

      {/* Category selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Document Category <span className="text-red-500">*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full text-xs p-2.5 border border-slate-300 rounded focus:ring-1 focus:ring-[#0d3b66]"
          >
            {CATEGORIES.map(cat => (
              <option key={cat.key} value={cat.key}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Date of Issue (as per certificate)
          </label>
          <input
            type="date"
            value={issuedDate}
            onChange={(e) => setIssuedDate(e.target.value)}
            className="w-full text-xs p-2.5 border border-slate-300 rounded focus:ring-1 focus:ring-[#0d3b66]"
          />
        </div>
      </div>

      {/* Drag & Drop Zone (Specification #6) */}
      <motion.div
        animate={{ scale: dragOver ? 1.02 : 1 }}
        transition={{ duration: 0.2 }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
          dragOver 
            ? 'border-[#ff6600] bg-orange-50/50 shadow-md ring-2 ring-[#ff6600]/20' 
            : file 
            ? 'border-emerald-400 bg-emerald-50/30' 
            : 'border-slate-300 hover:border-[#0d3b66] bg-slate-50'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => handleFileSelect(e.target.files?.[0])}
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          className="hidden"
        />

        {uploadSuccess ? (
          <div className="space-y-2 py-2">
            <AnimatedCheckmark size={36} strokeColor="#059669" popIn={true} />
            <div className="text-xs font-bold text-emerald-800">
              Document Uploaded & Verified Successfully!
            </div>
          </div>
        ) : file ? (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="space-y-1"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-700 font-bold">
              ✓
            </div>
            <div className="text-xs font-bold text-slate-900">{file.name}</div>
            <div className="text-[11px] text-slate-500">
              {(file.size / 1024).toFixed(1)} KB • {file.type || 'Document'}
              {isCompressing && ' • Optimizing image resolution...'}
            </div>
            {sha256Preview && (
              <div className="text-[10px] font-mono text-slate-500 truncate max-w-sm mx-auto bg-white p-1 rounded border border-slate-200 mt-1">
                SHA-256: {sha256Preview.slice(0, 24)}...
              </div>
            )}
          </motion.div>
        ) : (
          <div className="space-y-1">
            <svg className="w-8 h-8 text-slate-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div className="text-xs font-bold text-slate-700">
              Drag and drop your document here, or <span className="text-[#0d3b66] underline">browse</span>
            </div>
            <p className="text-[10px] text-slate-400">
              Supported Formats: PDF, JPG, PNG, WEBP (Max: 10 MB per file)
            </p>
          </div>
        )}
      </motion.div>

      {/* Circular Progress Ring & Shimmer (Specification #6) */}
      {uploading && (
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-4">
          <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
            <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="18" stroke="#E2E8F0" strokeWidth="4" fill="transparent" />
              <circle
                cx="24"
                cy="24"
                r="18"
                stroke="#005696"
                strokeWidth="4"
                strokeDasharray={2 * Math.PI * 18}
                strokeDashoffset={2 * Math.PI * 18 * (1 - uploadProgress / 100)}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-300 ease-out"
              />
            </svg>
            <span className="absolute text-[10px] font-bold text-slate-800">
              {uploadProgress}%
            </span>
          </div>
          <div className="flex-1 space-y-1">
            <div className="text-xs font-bold text-slate-900">
              Encrypting & Uploading Proof...
            </div>
            <div className="text-[10px] text-slate-500">
              ClamAV stream inspection & SHA-256 integrity validation
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        {file && (
          <button
            type="button"
            onClick={() => {
              setFile(null);
              setSha256Preview('');
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
          >
            Clear
          </button>
        )}
        <button
          type="submit"
          disabled={!file || uploading}
          className="px-5 py-2 bg-[#ff6600] hover:bg-[#e05a00] text-white text-xs font-bold rounded shadow-sm disabled:opacity-50 transition"
        >
          {uploading ? 'Processing & Storing...' : 'Upload & Encrypt'}
        </button>
      </div>
    </form>
  );
}
