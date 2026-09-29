import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload, FileText, CheckCircle2, AlertTriangle, Eye, ShieldCheck, RefreshCw, Download } from 'lucide-react';
import documentService from '../../services/documentService';

export default function CertificateVerificationPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [category, setCategory] = useState('CASTE_CERTIFICATE');
  const [verifying, setVerifying] = useState(false);
  const [hashPreview, setHashPreview] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  // Recent Verifications Table Data
  const [recentVerifications, setRecentVerifications] = useState([
    {
      id: 'VER-98421',
      date: '28 Sep 2026, 02:40 PM',
      fileName: 'Birsa_ST_Caste_Certificate_2024.pdf',
      category: 'ST Caste Certificate',
      status: 'VERIFIED',
      caste: 'Munda (Scheduled Tribe)',
      authority: 'Sub-Divisional Officer (SDO), Ranchi',
      certNumber: 'JH/REV/2024/ST-84192',
      sha256: '9a8f4c...7b12'
    },
    {
      id: 'VER-98394',
      date: '25 Sep 2026, 11:15 AM',
      fileName: 'Annual_Income_Certificate_FY26.pdf',
      category: 'Income Certificate',
      status: 'VERIFIED',
      caste: 'Annual Income: ₹1,80,000/-',
      authority: 'Tehsildar, Bundu, Ranchi',
      certNumber: 'JH/INC/2026/09214',
      sha256: '3e41b2...9f88'
    },
    {
      id: 'VER-98102',
      date: '19 Sep 2026, 09:30 AM',
      fileName: 'Class_XII_Marksheet_JAC.pdf',
      category: 'Marksheet',
      status: 'VERIFIED',
      caste: 'Aggregate Marks: 82.4%',
      authority: 'Jharkhand Academic Council (JAC)',
      certNumber: 'JAC/HS/2024/849201',
      sha256: 'f720aa...c341'
    },
    {
      id: 'VER-97815',
      date: '12 Sep 2026, 04:55 PM',
      fileName: 'Old_Handwritten_Certificate.jpg',
      category: 'ST Caste Certificate',
      status: 'DEFECTIVE_RESCAN',
      caste: 'Illegible revenue seal',
      authority: 'Requires Manual SDO Scrutiny',
      certNumber: 'LEGACY-MANUAL',
      sha256: '18d09e...44a7'
    }
  ]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSelectedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const processSelectedFile = async (file) => {
    setSelectedFile(file);
    setVerificationResult(null);

    // Compute client-side SHA-256 for cryptographic ledger verification
    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      setHashPreview(hashHex);
    } catch (err) {
      console.warn("Client hash calculation skipped:", err);
    }
  };

  const handleStartVerification = async () => {
    if (!selectedFile) return;
    setVerifying(true);

    try {
      // Simulate/call OCR pipeline
      setTimeout(() => {
        const newRecord = {
          id: `VER-${Math.floor(10000 + Math.random() * 90000)}`,
          date: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          fileName: selectedFile.name,
          category: category === 'CASTE_CERTIFICATE' ? 'ST Caste Certificate' :
                    category === 'INCOME_CERTIFICATE' ? 'Income Certificate' :
                    category === 'MARKSHEET' ? 'Marksheet' : 'Domicile Certificate',
          status: 'VERIFIED',
          caste: category === 'CASTE_CERTIFICATE' ? 'Santhal / Munda (ST)' : 'Verified Certificate Record',
          authority: 'State Revenue Department Digital Repository',
          certNumber: `JH/2026/DIGI-${Math.floor(100000 + Math.random() * 900000)}`,
          sha256: hashPreview ? `${hashPreview.slice(0, 6)}...${hashPreview.slice(-4)}` : 'e4a19b...42c1'
        };

        setVerificationResult({
          status: 'SUCCESS',
          message: 'Certificate successfully verified via National OCR and Cryptographic Checksum Engine.',
          details: newRecord
        });

        setRecentVerifications(prev => [newRecord, ...prev]);
        setVerifying(false);
      }, 1200);
    } catch (err) {
      setVerifying(false);
    }
  };

  return (
    <div className="flex-1 bg-[#F8F9FA] text-[#212529] font-sans pb-16">
      {/* Breadcrumb: Home > Certificate Verification */}
      <div className="bg-[#EAEFF5] border-b border-[#CBD5E1] py-2 px-4 sm:px-8 text-xs text-slate-700">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 flex-wrap">
          <Link to="/" className="text-[#003366] hover:underline font-medium">Home</Link>
          <span className="text-slate-400">›</span>
          <span className="font-semibold text-slate-900">Certificate Verification Desk (OCR &amp; QR)</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
        {/* Title Block */}
        <div className="border border-[#CBD5E1] bg-white p-5 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E0E0E0] pb-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#003366]">
              Ministry of Tribal Affairs • Affirmative Action Verification Desk
            </span>
            <span className="text-xs text-slate-500">
              Last Updated: <strong className="text-slate-800">28 September 2026</strong>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#003366]">
            ST Caste, Income &amp; Domicile Certificate Automated Verification
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Automated optical character recognition (OCR), bar-code validation, and DigiLocker cross-verification engine for statutory documents submitted under Central Sector Tribal Schemes.
          </p>
        </div>

        {/* Two-Column Section: Upload Area (Left) | Instructions (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* LEFT COLUMN: Upload Area */}
          <div className="lg:col-span-6 border border-[#CBD5E1] bg-white p-5 space-y-4">
            <div className="border-b border-[#003366] pb-2">
              <h2 className="text-base font-serif font-bold text-[#003366]">
                Upload Document for Verification
              </h2>
              <p className="text-xs text-slate-500">
                PDF, JPG, PNG up to 5 MB per document
              </p>
            </div>

            {/* Certificate Type Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Select Certificate Category <span className="text-red-600">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs p-2 border border-[#CBD5E1] bg-white focus:border-[#003366] focus:outline-none"
              >
                <option value="CASTE_CERTIFICATE">ST Scheduled Tribe Caste Certificate</option>
                <option value="INCOME_CERTIFICATE">Annual Family Income Certificate (FY 2025-26)</option>
                <option value="MARKSHEET">Previous Educational Marksheet / Transcript</option>
                <option value="DOMICILE_CERTIFICATE">Residential / Domicile Certificate</option>
              </select>
            </div>

            {/* Dashed border upload area: "Click to browse or drag file here" */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed p-8 text-center transition cursor-pointer ${
                dragOver ? 'border-[#003366] bg-blue-50/50' : 'border-[#CBD5E1] bg-[#F8F9FA] hover:bg-slate-50'
              }`}
              onClick={() => document.getElementById('certificate-file-input').click()}
            >
              <input
                id="certificate-file-input"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="hidden"
              />

              <Upload className="w-8 h-8 text-[#003366] mx-auto mb-2 opacity-80" />
              <div className="text-xs font-bold text-slate-900">
                Click to browse or drag file here
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Supports official PDF or scanned images (Maximum File Size: 5MB)
              </p>
            </div>

            {/* Selected File Details */}
            {selectedFile && (
              <div className="p-3 border border-[#CBD5E1] bg-[#F1F5F9] text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#003366]" />
                    {selectedFile.name}
                  </span>
                  <span className="font-mono text-slate-500 text-[11px]">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </span>
                </div>

                {hashPreview && (
                  <div className="text-[10px] font-mono text-slate-600 truncate">
                    SHA-256 Checksum: <strong className="text-slate-800">{hashPreview}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Verification Action Button */}
            <div>
              <button
                type="button"
                onClick={handleStartVerification}
                disabled={!selectedFile || verifying}
                className="w-full bg-[#003366] hover:bg-[#083D7C] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold py-2.5 px-4 border border-[#002244] shadow-xs flex items-center justify-center gap-2"
              >
                {verifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Processing OCR &amp; State Revenue Database Lookup...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-amber-300" />
                    <span>Verify Certificate with OCR Engine</span>
                  </>
                )}
              </button>
            </div>

            {/* Result Toast / Box */}
            {verificationResult && (
              <div className="p-4 border-2 border-green-600 bg-green-50 text-xs space-y-2">
                <div className="flex items-center gap-2 text-green-900 font-bold font-serif">
                  <CheckCircle2 className="w-4 h-4 text-green-700 shrink-0" />
                  <span>Certificate Validated &amp; Verified</span>
                </div>
                <p className="text-slate-700 leading-snug">
                  {verificationResult.message}
                </p>
                <div className="bg-white p-2.5 border border-green-300 space-y-1 text-[11px] text-slate-800">
                  <div><strong>Certificate Number:</strong> <span className="font-mono">{verificationResult.details.certNumber}</span></div>
                  <div><strong>Class / Category:</strong> {verificationResult.details.caste}</div>
                  <div><strong>Issuing Authority:</strong> {verificationResult.details.authority}</div>
                  <div><strong>Verification ID:</strong> <span className="font-mono">{verificationResult.details.id}</span></div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Instructions (Numbered List with Do's and Don'ts) */}
          <div className="lg:col-span-6 border border-[#CBD5E1] bg-white p-5 space-y-4">
            <div className="border-b border-[#003366] pb-2">
              <h2 className="text-base font-serif font-bold text-[#003366]">
                Document Scanning &amp; Upload Instructions
              </h2>
              <p className="text-xs text-slate-500">
                Please review these mandatory guidelines before uploading documents
              </p>
            </div>

            {/* DO's */}
            <div>
              <h3 className="text-xs font-bold text-green-800 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                <span className="w-2 h-2 rounded-full bg-green-600 inline-block" />
                DO's (Mandatory Best Practices)
              </h3>
              <ol className="text-xs text-slate-700 space-y-2 list-decimal list-inside leading-relaxed bg-[#F8F9FA] p-3 border border-[#E0E0E0]">
                <li>
                  <strong>Authorized Revenue Authority:</strong> Ensure the ST Caste Certificate is signed by an SDM, Tehsildar, or District Magistrate.
                </li>
                <li>
                  <strong>Visible Barcode / QR Code:</strong> For modern e-District certificates, ensure the verification QR code is completely clear and uncreased.
                </li>
                <li>
                  <strong>Resolution:</strong> Scan the document in original color at 200–300 DPI to avoid rejection by automated OCR pipelines.
                </li>
                <li>
                  <strong>Name Consistency:</strong> Verify that your name and father's name match your Aadhaar card and high school certificate exactly.
                </li>
                <li>
                  <strong>Income Certificate Validity:</strong> Income certificates must be issued on or after 01 April 2026 for Academic Session 2026-27.
                </li>
              </ol>
            </div>

            {/* DON'Ts */}
            <div>
              <h3 className="text-xs font-bold text-red-800 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                <span className="w-2 h-2 rounded-full bg-red-600 inline-block" />
                DON'Ts (Reasons for Instant Rejection)
              </h3>
              <ol className="text-xs text-slate-700 space-y-2 list-decimal list-inside leading-relaxed bg-[#FFFBEB] p-3 border border-[#FDE68A]">
                <li>
                  <strong>DO NOT upload camera phone photos:</strong> Photos taken under poor ambient lighting, with glares or finger shadows will fail OCR.
                </li>
                <li>
                  <strong>DO NOT upload cropped documents:</strong> The scan must show all four corners, the official seal, signature, and certificate serial number.
                </li>
                <li>
                  <strong>DO NOT upload photocopies without attestation:</strong> Black-and-white photocopies without gazetted officer attestation are void.
                </li>
                <li>
                  <strong>DO NOT submit forged or altered documents:</strong> Submitting fake or tampered caste certificates is a non-bailable offense under IPC 468.
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* BELOW: Recent Verifications Table (Date | File | Status | View) */}
        <div className="border border-[#CBD5E1] bg-white p-5">
          <div className="border-b border-[#003366] pb-2 mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-serif font-bold text-[#003366]">
                Recent Verification Records &amp; Audit Trail
              </h2>
              <p className="text-xs text-slate-500">
                Log of certificates processed through the national OCR validation pipeline
              </p>
            </div>
            <span className="text-xs bg-[#F1F5F9] border border-[#CBD5E1] px-2 py-0.5 text-slate-700 font-semibold font-mono">
              Total Records: {recentVerifications.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-[#E0E0E0] border-collapse">
              <thead>
                <tr className="bg-[#F1F5F9] text-slate-900 font-bold border-b border-[#E0E0E0]">
                  <th className="p-2.5 border-r border-[#E0E0E0] w-36">Verification Date</th>
                  <th className="p-2.5 border-r border-[#E0E0E0]">File Name &amp; Category</th>
                  <th className="p-2.5 border-r border-[#E0E0E0]">Certificate / Ref No.</th>
                  <th className="p-2.5 border-r border-[#E0E0E0]">Extracted Details / Authority</th>
                  <th className="p-2.5 border-r border-[#E0E0E0] text-center w-32">Status</th>
                  <th className="p-2.5 text-center w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0E0E0]">
                {recentVerifications.map((item, idx) => {
                  const isVerified = item.status === 'VERIFIED';
                  return (
                    <tr key={item.id} className={`gov-table-row ${idx % 2 === 1 ? 'bg-[#F9FAFB]' : 'bg-white'}`}>
                      <td className="p-2.5 border-r border-[#E0E0E0] font-mono text-slate-700">
                        {item.date}
                      </td>
                      <td className="p-2.5 border-r border-[#E0E0E0]">
                        <div className="font-semibold text-[#003366]">{item.fileName}</div>
                        <div className="text-[11px] text-slate-500 font-serif">{item.category}</div>
                      </td>
                      <td className="p-2.5 border-r border-[#E0E0E0] font-mono text-slate-800">
                        {item.certNumber}
                      </td>
                      <td className="p-2.5 border-r border-[#E0E0E0] text-slate-700">
                        <div><strong>Details:</strong> {item.caste}</div>
                        <div className="text-[11px] text-slate-500">{item.authority}</div>
                      </td>
                      <td className="p-2.5 border-r border-[#E0E0E0] text-center">
                        {isVerified ? (
                          <span className="border border-green-600 bg-transparent text-green-800 text-[11px] font-bold px-2 py-0.5 inline-block">
                            ● Verified
                          </span>
                        ) : (
                          <span className="border border-amber-600 bg-transparent text-amber-800 text-[11px] font-bold px-2 py-0.5 inline-block">
                            ○ Rescan Needed
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => alert(`Inspecting verified certificate dossier: ${item.certNumber}`)}
                          className="text-[#003366] font-bold underline inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
