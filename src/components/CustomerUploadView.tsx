import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  Image, 
  Trash2, 
  Check, 
  AlertCircle, 
  Printer, 
  Shield, 
  Clock, 
  FileCheck2,
  ChevronRight,
  Phone,
  MapPin,
  RefreshCw,
  Plus,
  Minus
} from 'lucide-react';
import type { Shop, DocumentType, PrintSettings, PrintJob } from '../types/index.ts';

interface CustomerUploadViewProps {
  shop: Shop;
  onJobSubmitted?: (job: PrintJob) => void;
}

export const CustomerUploadView: React.FC<CustomerUploadViewProps> = ({ shop, onJobSubmitted }) => {
  const [docType, setDocType] = useState<DocumentType>('document');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [notes, setNotes] = useState('');

  // Selected files
  const [selectedFiles, setSelectedFiles] = useState<{
    file: File;
    id: string;
    pageCount: number;
    previewUrl?: string;
  }[]>([]);

  // Print settings
  const [settings, setSettings] = useState<PrintSettings>({
    copies: 1,
    paperSize: 'A4',
    colorMode: 'bw',
    orientation: 'portrait',
    duplex: 'single',
    pageRange: 'all'
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submittedJob, setSubmittedJob] = useState<PrintJob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setErrorMsg(null);
    const newItems: typeof selectedFiles = [];

    Array.from(files).forEach((file) => {
      // Validate file extension
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
      if (!validExtensions.includes(ext)) {
        setErrorMsg(`Format ${ext} is not supported. Please upload PDF, JPG, or PNG files.`);
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        setErrorMsg(`File ${file.name} exceeds 50MB limit.`);
        return;
      }

      // Estimate page count (1 for images, estimate for PDF)
      const isPdf = file.type.includes('pdf') || ext === '.pdf';
      const estPages = isPdf ? Math.max(1, Math.ceil(file.size / (220 * 1024))) : 1;

      let previewUrl: string | undefined = undefined;
      if (file.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file);
      }

      newItems.push({
        file,
        id: 'f_' + Math.random().toString(36).substring(2, 9),
        pageCount: estPages,
        previewUrl
      });
    });

    setSelectedFiles((prev) => [...prev, ...newItems]);
  };

  const removeFile = (id: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Calculation of billable pages & total price
  const singleFilePages = selectedFiles.reduce((acc, f) => acc + f.pageCount, 0);
  const totalBillablePages = singleFilePages * settings.copies;

  const calculateEstimate = () => {
    if (totalBillablePages === 0) return 0;
    const isColor = settings.colorMode === 'color';
    const isDuplex = settings.duplex === 'double';
    const isPhoto = docType === 'photo';

    let rate = shop.pricing.bwSingle;
    if (isPhoto) {
      rate = shop.pricing.photoGlossyRate;
    } else if (isColor) {
      rate = isDuplex ? shop.pricing.colorDuplex : shop.pricing.colorSingle;
    } else {
      rate = isDuplex ? shop.pricing.bwDuplex : shop.pricing.bwSingle;
    }

    if (settings.paperSize === 'Legal') {
      rate += 1.0;
    }
    return Math.round(totalBillablePages * rate);
  };

  const estimatedCost = calculateEstimate();

  // Submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setErrorMsg('Please upload at least one document or photo to print.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);
    setErrorMsg(null);

    try {
      // 1. Upload files via multipart form
      const formData = new FormData();
      selectedFiles.forEach((f) => {
        formData.append('files', f.file);
      });

      setUploadProgress(45);
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload files to server.');
      }
      const uploadJson = await uploadRes.json();
      setUploadProgress(75);

      // 2. Submit print job request
      const jobPayload = {
        shopId: shop.id,
        customerName: customerName || 'Walk-in Customer',
        customerMobile,
        docType,
        files: uploadJson.files,
        settings,
        notes
      };

      const jobRes = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobPayload)
      });

      if (!jobRes.ok) {
        throw new Error('Failed to create print job.');
      }

      const jobData = await jobRes.json();
      setUploadProgress(100);
      setSubmittedJob(jobData.job);
      if (onJobSubmitted) {
        onJobSubmitted(jobData.job);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during submission.');
    } finally {
      setIsUploading(false);
    }
  };

  // Poll for live status changes on the submitted job
  useEffect(() => {
    if (!submittedJob || submittedJob.status === 'completed' || submittedJob.status === 'rejected') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${submittedJob.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.job) {
            setSubmittedJob(data.job);
          }
        }
      } catch (e) {}
    }, 2500);

    return () => clearInterval(interval);
  }, [submittedJob]);

  // If already submitted, display the Live Job Tracking screen
  if (submittedJob) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        
        {/* Job Header */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 text-center space-y-3">
          <div className="w-14 h-14 bg-cyan-950 border border-cyan-800 text-cyan-400 rounded-2xl mx-auto flex items-center justify-center">
            <Printer className="w-7 h-7" />
          </div>
          <div className="text-xs uppercase tracking-wider text-cyan-400 font-semibold">
            Print Request Submitted
          </div>
          <h2 className="text-2xl font-bold text-white font-mono tabular-nums">
            Job ID #{submittedJob.id}
          </h2>
          <p className="text-xs text-slate-400">
            Show this reference number to the shopkeeper at the counter.
          </p>
        </div>

        {/* Live Status Stepper */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 space-y-6">
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Live Job Status</span>
            <span className="flex items-center gap-1.5 text-cyan-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Real-time sync</span>
            </span>
          </div>

          <div className="space-y-4">
            
            {/* Step 1: Uploaded */}
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-white">Document Uploaded &amp; Validated</div>
                <div className="text-xs text-slate-400">Files received securely on {shop.name} workstation.</div>
              </div>
            </div>

            {/* Step 2: Shop Approval */}
            <div className="flex items-start gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                submittedJob.status !== 'pending'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-cyan-500 text-slate-950 animate-pulse-subtle'
              }`}>
                {submittedJob.status !== 'pending' ? <Check className="w-4 h-4" /> : '2'}
              </div>
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-white">Shop Owner Review</div>
                <div className="text-xs text-slate-400">
                  {submittedJob.status === 'pending'
                    ? 'Operator inspecting preview on counter computer. Awaiting approval...'
                    : 'Approved by shop operator.'}
                </div>
              </div>
            </div>

            {/* Step 3: Windows Spooler Printing */}
            <div className="flex items-start gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                submittedJob.status === 'completed'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : submittedJob.status === 'printing'
                  ? 'bg-cyan-500 text-slate-950 animate-pulse-subtle'
                  : 'bg-slate-700 text-slate-400'
              }`}>
                {submittedJob.status === 'completed' ? <Check className="w-4 h-4" /> : '3'}
              </div>
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-white">Sending to Windows Printer</div>
                <div className="text-xs text-slate-400">
                  {submittedJob.status === 'printing'
                    ? 'Paper feeding through printer spooler now...'
                    : submittedJob.status === 'completed'
                    ? 'Print pages discharged in printer tray.'
                    : 'Pending operator approval.'}
                </div>
              </div>
            </div>

            {/* Step 4: Ready at counter */}
            <div className="flex items-start gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                submittedJob.status === 'completed'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-700 text-slate-400'
              }`}>
                {submittedJob.status === 'completed' ? <Check className="w-4 h-4" /> : '4'}
              </div>
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-white">Collect from Counter</div>
                <div className="text-xs text-slate-400">
                  {submittedJob.status === 'completed'
                    ? 'Your prints are ready! Please pay at the counter.'
                    : 'Waiting for print completion.'}
                </div>
              </div>
            </div>

          </div>

          {/* If rejected */}
          {submittedJob.status === 'rejected' && (
            <div className="p-4 bg-rose-950/60 border border-rose-800 text-rose-200 rounded-xl space-y-1 text-xs">
              <div className="font-bold flex items-center gap-1.5 text-sm">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>Job Declined by Operator</span>
              </div>
              <p>{submittedJob.rejectReason || 'Document could not be processed.'}</p>
            </div>
          )}
        </div>

        {/* Order Summary & Pricing */}
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 space-y-3 text-xs text-slate-300">
          <div className="flex justify-between pb-2 border-b border-slate-700 text-sm font-semibold text-white">
            <span>Bill Estimate</span>
            <span className="text-cyan-400 font-mono tabular-nums text-base">₹{submittedJob.estimatedPrice}.00</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Total Pages (with copies):</span>
            <span className="font-mono tabular-nums">{submittedJob.totalPages} pages</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Print Mode:</span>
            <span className="capitalize">{submittedJob.settings.colorMode === 'bw' ? 'Black & White' : 'Color'} · {submittedJob.settings.duplex === 'single' ? 'Single Sided' : 'Both Sides'}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Paper:</span>
            <span>{submittedJob.settings.paperSize}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Files:</span>
            <span>{submittedJob.files.length} document(s)</span>
          </div>
        </div>

        {/* Shop Info & Action */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs text-slate-400">
          <div className="text-white font-medium">{shop.name}</div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <span>{shop.address}, {shop.city}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-slate-500" />
            <span>+91 {shop.mobile}</span>
          </div>
        </div>

        <button
          onClick={() => {
            setSubmittedJob(null);
            setSelectedFiles([]);
          }}
          className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-xl transition-colors"
        >
          Submit Another Document
        </button>

      </div>
    );
  }

  // Upload Form View
  return (
    <div className="max-w-xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      
      {/* Shop Header Banner */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {shop.name}
              </h1>
              <span className="text-emerald-400 text-xs flex items-center gap-0.5">
                <Check className="w-3.5 h-3.5" />
                <span>Verified Shop</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-500" />
              <span>{shop.address}, {shop.city}</span>
            </p>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase font-mono">B&amp;W Xerox</div>
            <div className="text-sm font-bold text-cyan-400 font-mono tabular-nums">
              ₹{shop.pricing.bwSingle}/pg
            </div>
          </div>
        </div>

        {/* Rate Pills */}
        <div className="pt-2 border-t border-slate-700/60 grid grid-cols-3 gap-2 text-center text-xs text-slate-300">
          <div className="bg-slate-900/60 p-1.5 rounded-lg">
            <div className="text-[10px] text-slate-400">B&amp;W Duplex</div>
            <div className="font-mono font-semibold">₹{shop.pricing.bwDuplex}</div>
          </div>
          <div className="bg-slate-900/60 p-1.5 rounded-lg">
            <div className="text-[10px] text-slate-400">Color Single</div>
            <div className="font-mono font-semibold">₹{shop.pricing.colorSingle}</div>
          </div>
          <div className="bg-slate-900/60 p-1.5 rounded-lg">
            <div className="text-[10px] text-slate-400">Photo Glossy</div>
            <div className="font-mono font-semibold">₹{shop.pricing.photoGlossyRate}</div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Document Classification */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Select Document Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'document', label: 'Documents / Assignment', icon: FileText },
              { id: 'aadhaar_id', label: 'Aadhaar / ID Card', icon: Shield },
              { id: 'photo', label: 'Photo / Certificate', icon: Image },
              { id: 'bill', label: 'Bill / Ticket', icon: FileCheck2 }
            ].map((cat) => {
              const Icon = cat.icon;
              const isSelected = docType === cat.id;
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setDocType(cat.id as DocumentType)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'bg-cyan-950/80 border-cyan-500 text-white shadow-sm'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span className="text-xs font-medium leading-tight">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Upload Dropzone */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-slate-300 uppercase tracking-wider">
              Upload Files (PDF, JPG, PNG)
            </label>
            <span className="text-slate-400">Max 50MB per file</span>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-800/40 hover:bg-slate-800/60 transition-all space-y-2"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFiles(e.target.files)}
              multiple
              accept=".pdf,image/jpeg,image/png,image/jpg"
              className="hidden"
            />
            <div className="w-10 h-10 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 mx-auto flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div className="text-sm font-medium text-white">
              Tap to browse or drop your files here
            </div>
            <div className="text-xs text-slate-400">
              Select one or multiple documents from your phone or device
            </div>
          </div>
        </div>

        {/* Selected Files List */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-400">
              Attached Documents ({selectedFiles.length})
            </div>
            <div className="space-y-2">
              {selectedFiles.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {item.previewUrl ? (
                      <img
                        src={item.previewUrl}
                        alt="Preview"
                        className="w-10 h-10 object-cover rounded-lg border border-slate-600 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-cyan-400 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <div className="text-white font-medium truncate max-w-[180px] sm:max-w-[260px]">
                        {item.file.name}
                      </div>
                      <div className="text-slate-400 text-[11px] font-mono tabular-nums">
                        {(item.file.size / 1024 / 1024).toFixed(2)} MB · ~{item.pageCount} page(s)
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFile(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-700/60 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Print Configuration Box */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
            Print Configuration
          </h3>

          {/* Copies Stepper */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-white">Number of Copies</div>
              <div className="text-xs text-slate-400">Sets of each uploaded file</div>
            </div>
            <div className="flex items-center gap-3 bg-slate-900 border border-slate-700 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSettings((s) => ({ ...s, copies: Math.max(1, s.copies - 1) }))}
                className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-sm font-bold text-white tabular-nums px-1">
                {settings.copies}
              </span>
              <button
                type="button"
                onClick={() => setSettings((s) => ({ ...s, copies: s.copies + 1 }))}
                className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Color vs B&W */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300">Color Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSettings((s) => ({ ...s, colorMode: 'bw' }))}
                className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all ${
                  settings.colorMode === 'bw'
                    ? 'bg-slate-700 border-cyan-400 text-white'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                Black &amp; White (₹{shop.pricing.bwSingle}/pg)
              </button>
              <button
                type="button"
                onClick={() => setSettings((s) => ({ ...s, colorMode: 'color' }))}
                className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all ${
                  settings.colorMode === 'color'
                    ? 'bg-cyan-950 border-cyan-400 text-cyan-200'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                Color Print (₹{shop.pricing.colorSingle}/pg)
              </button>
            </div>
          </div>

          {/* Paper Size & Sides */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-300">Paper Size</label>
              <select
                value={settings.paperSize}
                onChange={(e) => setSettings((s) => ({ ...s, paperSize: e.target.value as any }))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="A4">A4 (Standard)</option>
                <option value="A5">A5 (Half Sheet)</option>
                <option value="Legal">Legal (Deed Paper)</option>
                <option value="Letter">Letter</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300">Print Sides</label>
              <select
                value={settings.duplex}
                onChange={(e) => setSettings((s) => ({ ...s, duplex: e.target.value as any }))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="single">Single Sided</option>
                <option value="double">Double Sided (Back-to-Back)</option>
              </select>
            </div>
          </div>

          {/* Page Range & Orientation */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-300">Page Range</label>
              <input
                type="text"
                placeholder="all or 1-3, 5"
                value={settings.pageRange}
                onChange={(e) => setSettings((s) => ({ ...s, pageRange: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
              </input>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300">Orientation</label>
              <select
                value={settings.orientation}
                onChange={(e) => setSettings((s) => ({ ...s, orientation: e.target.value as any }))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
                <option value="auto">Auto Detect</option>
              </select>
            </div>
          </div>

          {/* Customer info & instructions */}
          <div className="space-y-3 pt-2 border-t border-slate-700/60">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-300">Your Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300">Mobile (Optional)</label>
                <input
                  type="tel"
                  placeholder="10-digit mobile"
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300">Special Notes for Operator</label>
              <input
                type="text"
                placeholder="e.g. Please staple top left corner, use thick paper"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

        </div>

        {/* Live Bill Breakdown & Submit */}
        <div className="p-4 bg-slate-800/90 border border-slate-700 rounded-2xl space-y-4">
          <div className="flex items-center justify-between text-sm">
            <div>
              <div className="font-semibold text-white">Estimated Cost</div>
              <div className="text-xs text-slate-400">
                {singleFilePages} page(s) × {settings.copies} cop{settings.copies > 1 ? 'ies' : 'y'} = {totalBillablePages} total
              </div>
            </div>
            <div className="text-xl font-bold text-cyan-400 font-mono tabular-nums">
              ₹{estimatedCost}.00
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-200 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isUploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Sending files securely to {shop.name}...</span>
                <span className="font-mono tabular-nums">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-500 h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isUploading || selectedFiles.length === 0}
            className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Submit Print Request (₹{estimatedCost})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Privacy & Aadhaar Security Pledge */}
        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-start gap-2.5 text-[11px] text-slate-400">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-slate-300">Document Privacy Guarantee:</strong> Your files are transmitted over HTTPS directly to the shop's computer and are never shared. All temporary documents are cryptographically wiped within 30 minutes.
          </p>
        </div>

      </form>
    </div>
  );
};
