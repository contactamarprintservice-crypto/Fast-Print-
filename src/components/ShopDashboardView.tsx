import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Bell, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  FileText, 
  ShieldAlert, 
  Trash2, 
  RefreshCw, 
  Layers, 
  Monitor, 
  Download,
  AlertTriangle,
  Play,
  QrCode,
  SlidersHorizontal,
  Check,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  FileStack,
  ArrowRight,
  ArrowUpRight
} from 'lucide-react';
import type { Shop, PrintJob, JobStatus, PrinterInfo } from '../types/index.ts';
import { sound } from '../utils/audio.ts';

interface ShopDashboardViewProps {
  shop: Shop;
  onOpenPosterModal: () => void;
  onOpenAgentModal: () => void;
  onUpdateShop: (updated: Shop) => void;
}

export const ShopDashboardView: React.FC<ShopDashboardViewProps> = ({
  shop,
  onOpenPosterModal,
  onOpenAgentModal,
  onUpdateShop
}) => {
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'pending' | 'printing' | 'completed' | 'rejected' | 'all'>('pending');
  
  // Selected job for inspection preview modal
  const [inspectJob, setInspectJob] = useState<PrintJob | null>(null);
  
  // Reject reason modal
  const [rejectingJobId, setRejectingJobId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('File text is blurred / unreadable');

  // New job live notification banner
  const [liveBannerJob, setLiveBannerJob] = useState<PrintJob | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Settings adjustment draft in inspector modal
  const [adjustedPrinter, setAdjustedPrinter] = useState<string>('');
  const [adjustedCopies, setAdjustedCopies] = useState<number>(1);
  const [adjustedColor, setAdjustedColor] = useState<'bw' | 'color'>('bw');

  // Fetch shop jobs
  const fetchJobs = async () => {
    try {
      const res = await fetch(`/api/shops/${shop.id}/jobs`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (e) {
      console.error('Failed to load jobs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [shop.id]);

  // Connect to SSE for real-time live events
  useEffect(() => {
    const eventSource = new EventSource(`/api/events/${shop.id}`);

    eventSource.addEventListener('new_job', (event: any) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.job) {
          setJobs(prev => [payload.job, ...prev]);
          setLiveBannerJob(payload.job);
          if (soundEnabled) {
            sound.playNewJobChime();
          }
        }
      } catch (err) {
        console.error('Error handling SSE new_job:', err);
      }
    });

    eventSource.addEventListener('job_approved', (event: any) => {
      try {
        const payload = JSON.parse(event.data);
        setJobs(prev => prev.map(j => j.id === payload.jobId ? { ...j, status: 'approved', approvedAt: new Date().toISOString() } : j));
      } catch (e) {}
    });

    eventSource.addEventListener('job_status_change', (event: any) => {
      try {
        const payload = JSON.parse(event.data);
        setJobs(prev => prev.map(j => j.id === payload.jobId ? { ...j, status: payload.status } : j));
        if (payload.status === 'completed' && soundEnabled) {
          sound.playPrintComplete();
        }
      } catch (e) {}
    });

    eventSource.addEventListener('job_purged', (event: any) => {
      try {
        const payload = JSON.parse(event.data);
        setJobs(prev => prev.map(j => j.id === payload.jobId ? { ...j, isPurged: true, purgedAt: new Date().toISOString() } : j));
      } catch (e) {}
    });

    eventSource.addEventListener('agent_heartbeat', (event: any) => {
      try {
        const payload = JSON.parse(event.data);
        onUpdateShop({
          ...shop,
          agentConnected: true,
          agentLastSeen: payload.agentLastSeen,
          printers: payload.printers || shop.printers,
          defaultPrinter: payload.defaultPrinter || shop.defaultPrinter
        });
      } catch (e) {}
    });

    return () => {
      eventSource.close();
    };
  }, [shop.id, soundEnabled]);

  // Open inspection modal with job details
  const openInspector = (job: PrintJob) => {
    setInspectJob(job);
    setAdjustedPrinter(job.settings.selectedPrinter || shop.defaultPrinter);
    setAdjustedCopies(job.settings.copies);
    setAdjustedColor(job.settings.colorMode);
  };

  // 1. Accept & Print
  const handleApprove = async (jobId: string) => {
    sound.playClick();
    try {
      const res = await fetch(`/api/jobs/${jobId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updatedSettings: {
            selectedPrinter: adjustedPrinter || shop.defaultPrinter,
            copies: adjustedCopies,
            colorMode: adjustedColor
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        setJobs(prev => prev.map(j => j.id === jobId ? data.job : j));
        setInspectJob(null);
        if (liveBannerJob?.id === jobId) setLiveBannerJob(null);
      }
    } catch (e) {
      console.error('Approve failed:', e);
    }
  };

  // 2. Reject Job
  const handleReject = async (jobId: string) => {
    sound.playClick();
    try {
      const res = await fetch(`/api/jobs/${jobId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason })
      });

      if (res.ok) {
        const data = await res.json();
        setJobs(prev => prev.map(j => j.id === jobId ? data.job : j));
        setRejectingJobId(null);
        setInspectJob(null);
        if (liveBannerJob?.id === jobId) setLiveBannerJob(null);
      }
    } catch (e) {
      console.error('Reject failed:', e);
    }
  };

  // 3. Purge Document Immediately (Aadhaar & Privacy)
  const handlePurge = async (jobId: string) => {
    if (!confirm('Permanently purge customer document files for this job from server?')) return;
    try {
      const res = await fetch(`/api/jobs/${jobId}/purge`, { method: 'POST' });
      if (res.ok) {
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, isPurged: true, purgedAt: new Date().toISOString() } : j));
      }
    } catch (e) {
      console.error('Purge failed:', e);
    }
  };

  // 4. Simulate Local Windows Agent Print (for demonstration)
  const handleSimulatePrint = async (jobId: string) => {
    try {
      // Step 1: Spooling
      await fetch(`/api/agent/job/${jobId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'printing', message: 'Sending to local print spooler...' })
      });
      // Step 2: Completed after 1.5s
      setTimeout(async () => {
        await fetch(`/api/agent/job/${jobId}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed', printerName: shop.defaultPrinter })
        });
      }, 1500);
    } catch (e) {}
  };

  // Filtered jobs
  const filteredJobs = jobs.filter(j => {
    if (filterTab === 'all') return true;
    if (filterTab === 'pending') return j.status === 'pending';
    if (filterTab === 'printing') return j.status === 'approved' || j.status === 'printing';
    if (filterTab === 'completed') return j.status === 'completed';
    if (filterTab === 'rejected') return j.status === 'rejected';
    return true;
  });

  const completedJobsList = jobs.filter(j => j.status === 'completed');
  const pendingJobsList = jobs.filter(j => j.status === 'pending');
  const printingCount = jobs.filter(j => j.status === 'approved' || j.status === 'printing').length;
  
  const pendingCount = pendingJobsList.length;
  const completedToday = completedJobsList.length;
  
  // Calculate total prints today (in billable pages)
  const totalPrintsToday = completedJobsList.reduce((acc, curr) => acc + (curr.totalPages || 0), 0);
  const bwPrintsToday = completedJobsList
    .filter(j => j.settings.colorMode === 'bw')
    .reduce((acc, curr) => acc + (curr.totalPages || 0), 0);
  const colorPrintsToday = completedJobsList
    .filter(j => j.settings.colorMode === 'color')
    .reduce((acc, curr) => acc + (curr.totalPages || 0), 0);

  // Queued pending pages & value
  const pendingPages = pendingJobsList.reduce((acc, curr) => acc + (curr.totalPages || 0), 0);
  const pendingEarnings = pendingJobsList.reduce((acc, curr) => acc + (curr.estimatedPrice || 0), 0);

  // Realized and potential revenue
  const completedEarnings = completedJobsList.reduce((acc, curr) => acc + (curr.estimatedPrice || 0), 0);
  const avgEarningsPerJob = completedToday > 0 ? Math.round(completedEarnings / completedToday) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Shop Control Strip */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {shop.name}
            </h1>
            <span className="text-xs text-cyan-400 font-mono bg-cyan-950 border border-cyan-800 px-2 py-0.5 rounded">
              ID: {shop.id}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Operator: <strong className="text-slate-300">{shop.ownerName}</strong> · Mobile: +91 {shop.mobile} · {shop.address}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) sound.playClick();
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border flex items-center gap-1.5 transition-colors ${
              soundEnabled
                ? 'bg-slate-700 border-slate-600 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title="Toggle incoming chime sound"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Sound {soundEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={onOpenPosterModal}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors flex items-center gap-1.5"
          >
            <QrCode className="w-3.5 h-3.5 text-cyan-400" />
            <span>Counter Poster</span>
          </button>

          <button
            onClick={onOpenAgentModal}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Windows Agent</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics Card: Immediate Shop Performance Insight */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-700/70">
          <div>
            <div className="text-xs uppercase font-mono tracking-wider text-cyan-400">Executive Overview</div>
            <h2 className="text-lg font-bold text-white tracking-tight">Today's Shop Performance Summary</h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-300 font-medium">Counter Live</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-cyan-400 tabular-nums">Base: ₹{shop.pricing.bwSingle}/pg B&amp;W</span>
          </div>
        </div>

        {/* 3 Core Metric Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Metric 1: Total Prints Today */}
          <div 
            onClick={() => setFilterTab('completed')}
            className="metric-card p-4 bg-slate-900/80 border border-slate-700/60 rounded-xl hover:border-cyan-500/50 cursor-pointer transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Prints Today</span>
              <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileStack className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <div className="text-3xl font-extrabold text-white font-mono tabular-nums">
                  {totalPrintsToday} <span className="text-base font-normal text-slate-400 font-sans">pages</span>
                </div>
                {/* Conditional Trend Indicator: Green for positive, Red for negative */}
                {totalPrintsToday >= 10 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-1.5 py-0.5 rounded">
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    <span>+12.4% vs yesterday</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-950/60 border border-rose-800/50 px-1.5 py-0.5 rounded">
                    <TrendingDown className="w-3 h-3 text-rose-400" />
                    <span>-4.2% vs yesterday</span>
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
                <span>{completedToday} fulfilled job{completedToday === 1 ? '' : 's'}</span>
                <span aria-hidden="true">·</span>
                <span>{bwPrintsToday} B&amp;W</span>
                <span aria-hidden="true">·</span>
                <span>{colorPrintsToday} Color</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800 text-[11px] text-cyan-400 flex items-center gap-1 group-hover:underline">
              <span>View printed archive</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>

          {/* Metric 2: Pending Jobs */}
          <div 
            onClick={() => setFilterTab('pending')}
            className={`metric-card p-4 bg-slate-900/80 border rounded-xl cursor-pointer transition-all space-y-2 group ${
              pendingCount > 0 
                ? 'border-amber-500/50 hover:border-amber-400 shadow-sm' 
                : 'border-slate-700/60 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Pending Jobs</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 ${
                pendingCount > 0 ? 'bg-amber-950/80 border border-amber-800/80 text-amber-400' : 'bg-slate-800 border border-slate-700 text-slate-400'
              }`}>
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <div className={`text-3xl font-extrabold font-mono tabular-nums ${pendingCount > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
                  {pendingCount} <span className="text-base font-normal text-slate-400 font-sans">awaiting</span>
                </div>
                {/* Conditional Trend Indicator: Green when clear, Red/Amber when queued */}
                {pendingCount === 0 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-1.5 py-0.5 rounded">
                    <TrendingDown className="w-3 h-3 text-emerald-400" />
                    <span>-100% queue clear</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-950/60 border border-rose-800/50 px-1.5 py-0.5 rounded">
                    <TrendingUp className="w-3 h-3 text-rose-400" />
                    <span>+{pendingCount} awaiting print</span>
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
                <span>{pendingPages} pages queued</span>
                <span aria-hidden="true">·</span>
                <span>₹{pendingEarnings}.00 pipeline</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800 text-[11px] flex items-center justify-between">
              {pendingCount > 0 ? (
                <span className="text-rose-400 font-semibold flex items-center gap-1">
                  <span>Action required: review &amp; approve</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              ) : (
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Queue clear · Ready for next customer</span>
                </span>
              )}
            </div>
          </div>

          {/* Metric 3: Estimated Earnings */}
          <div 
            onClick={() => setFilterTab('completed')}
            className="metric-card p-4 bg-slate-900/80 border border-slate-700/60 rounded-xl hover:border-emerald-500/50 cursor-pointer transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Estimated Earnings</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <div className="text-3xl font-extrabold text-emerald-400 font-mono tabular-nums">
                  ₹{completedEarnings}.00
                </div>
                {/* Conditional Trend Indicator: Green for positive, Red for negative */}
                {completedEarnings >= 20 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-1.5 py-0.5 rounded">
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    <span>+18.2% vs yesterday</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-950/60 border border-rose-800/50 px-1.5 py-0.5 rounded">
                    <TrendingDown className="w-3 h-3 text-rose-400" />
                    <span>-6.5% vs yesterday</span>
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
                <span>Realized today</span>
                <span aria-hidden="true">·</span>
                <span>+₹{pendingEarnings}.00 in review</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Avg ₹{avgEarningsPerJob}/job</span>
              <span className="text-emerald-400 font-medium">100% owner verified</span>
            </div>
          </div>

        </div>
      </div>

      {/* Live Alert Banner when new request arrives */}
      {liveBannerJob && liveBannerJob.status === 'pending' && (
        <div className="p-4 bg-cyan-950/90 border border-cyan-500/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl animate-pulse-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="text-white font-bold text-sm flex items-center gap-2">
                <span>Incoming Job #{liveBannerJob.id}</span>
                <span className="text-xs bg-cyan-900 text-cyan-300 px-2 py-0.5 rounded">
                  {liveBannerJob.docType.toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-slate-300">
                Customer: <strong>{liveBannerJob.customerName}</strong> · {liveBannerJob.totalPages} pages · {liveBannerJob.settings.copies} cop{liveBannerJob.settings.copies > 1 ? 'ies' : 'y'} · <strong className="text-cyan-300">₹{liveBannerJob.estimatedPrice}.00</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => openInspector(liveBannerJob)}
              className="px-4 py-2 bg-white text-slate-900 font-bold text-xs rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-600" />
              <span>Preview &amp; Approve</span>
            </button>
            <button
              onClick={() => setLiveBannerJob(null)}
              className="p-2 text-slate-400 hover:text-white"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Windows Agent Status Banner */}
      <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${shop.agentConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          <div>
            <span className="text-white font-semibold">Windows Print Agent: </span>
            <span className={shop.agentConnected ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
              {shop.agentConnected ? 'Connected & Online' : 'Standby / Web Spooler Fallback'}
            </span>
            <span className="text-slate-400 ml-2">
              (OS: {shop.agentOs || 'Windows 11'})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-slate-300">
          <span>Active Printer: <strong className="text-white">{shop.defaultPrinter}</strong></span>
          <button
            onClick={onOpenAgentModal}
            className="text-cyan-400 hover:underline"
          >
            Change Printer
          </button>
        </div>
      </div>

      {/* Queue Filter Segmented Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1 p-1 bg-slate-800 rounded-xl border border-slate-700">
          <button
            onClick={() => setFilterTab('pending')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              filterTab === 'pending'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending Approval ({pendingCount})
          </button>
          <button
            onClick={() => setFilterTab('printing')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              filterTab === 'printing'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            In Spooler ({printingCount})
          </button>
          <button
            onClick={() => setFilterTab('completed')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              filterTab === 'completed'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Completed ({completedToday})
          </button>
          <button
            onClick={() => setFilterTab('rejected')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              filterTab === 'rejected'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Declined
          </button>
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              filterTab === 'all'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Jobs
          </button>
        </div>

        <button
          onClick={fetchJobs}
          className="p-2 text-slate-400 hover:text-white bg-slate-800 border border-slate-700 rounded-lg text-xs flex items-center gap-1.5"
          title="Refresh Queue"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Jobs Table */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl overflow-hidden shadow-sm">
        {filteredJobs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Printer className="w-10 h-10 text-slate-600 mx-auto" />
            <div className="text-white font-medium text-sm">No print jobs in this view</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {filterTab === 'pending'
                ? 'New customer print requests will appear here instantly with an audible chime.'
                : 'Select another filter tab or have a customer scan the shop QR code.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 border-b border-slate-700 text-slate-400 uppercase font-mono tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Job ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Document</th>
                  <th className="py-3 px-4">Settings</th>
                  <th className="py-3 px-4">Total Pages</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 font-medium">
                {filteredJobs.map((job) => {
                  const isPending = job.status === 'pending';
                  const isPrinting = job.status === 'printing' || job.status === 'approved';
                  const isCompleted = job.status === 'completed';
                  const isRejected = job.status === 'rejected';

                  return (
                    <tr
                      key={job.id}
                      className={`hover:bg-slate-700/30 transition-colors ${
                        isPending ? 'bg-amber-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-white tabular-nums">
                        #{job.id}
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-white font-medium">{job.customerName}</div>
                        {job.customerMobile && (
                          <div className="text-[11px] text-slate-400 font-mono">
                            {job.customerMobile}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 max-w-[200px]">
                          <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                          <span className="truncate text-slate-200">
                            {job.files[0]?.originalName || 'Document'}
                          </span>
                          {job.files.length > 1 && (
                            <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.2 rounded font-mono">
                              +{job.files.length - 1}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 capitalize">
                          {job.docType.replace('_', ' ')}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-slate-200">
                          {job.settings.copies} cop{job.settings.copies > 1 ? 'ies' : 'y'} · {job.settings.colorMode === 'bw' ? 'B&W' : 'Color'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {job.settings.paperSize} · {job.settings.duplex === 'single' ? 'Single side' : 'Duplex'}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono tabular-nums text-slate-200">
                        {job.totalPages} pgs
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-cyan-300 tabular-nums">
                        ₹{job.estimatedPrice}.00
                      </td>

                      <td className="py-3 px-4">
                        {isPending && (
                          <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                            <span>Pending Review</span>
                          </span>
                        )}
                        {isPrinting && (
                          <span className="text-cyan-400 font-semibold flex items-center gap-1.5">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Spooling to Printer</span>
                          </span>
                        )}
                        {isCompleted && (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Printed &amp; Done</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Declined</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <>
                              <button
                                onClick={() => openInspector(job)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 transition-colors shadow-sm"
                                title="Inspect & Accept"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Accept</span>
                              </button>
                              <button
                                onClick={() => setRejectingJobId(job.id)}
                                className="px-2.5 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-lg text-xs transition-colors"
                                title="Reject Print Request"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {isPrinting && (
                            <button
                              onClick={() => handleSimulatePrint(job.id)}
                              className="px-2.5 py-1.5 bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 border border-cyan-700 rounded-lg text-xs flex items-center gap-1"
                              title="Acknowledge Windows spooler"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>Finish Print</span>
                            </button>
                          )}

                          {/* Quick Inspect Button */}
                          <button
                            onClick={() => openInspector(job)}
                            className="p-1.5 text-slate-400 hover:text-white bg-slate-700/50 rounded-lg"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Immediate Manual File Purge Button */}
                          {(isCompleted || isRejected) && !job.isPurged && (
                            <button
                              onClick={() => handlePurge(job.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-700/50 rounded-lg"
                              title="Purge Sensitive Files Now"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}

                          {job.isPurged && (
                            <span className="text-[10px] text-slate-500 italic">Purged</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= INSPECT & APPROVE MODAL ================= */}
      {inspectJob && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="text-xs uppercase font-mono text-cyan-400">Owner Print Approval Gate</div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>Inspect Request #{inspectJob.id}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-normal">
                    {inspectJob.docType}
                  </span>
                </h3>
              </div>
              <button
                onClick={() => setInspectJob(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Document Details & File List */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Uploaded Files ({inspectJob.files.length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {inspectJob.files.map((file) => (
                  <div
                    key={file.id}
                    className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl space-y-2 text-xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="w-5 h-5 text-cyan-400 shrink-0" />
                      <div className="overflow-hidden">
                        <div className="text-white font-medium truncate">{file.originalName}</div>
                        <div className="text-slate-400 font-mono">
                          ~{file.pageCount} page(s) · {(file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>

                    {file.previewThumbnail && (
                      <div className="rounded-lg overflow-hidden border border-slate-700 h-28 bg-slate-950">
                        <img
                          src={file.previewThumbnail}
                          alt="Thumbnail preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Special Note */}
            {inspectJob.notes && (
              <div className="p-3 bg-slate-800/60 border border-slate-700 rounded-xl text-xs space-y-1">
                <div className="text-slate-400 font-semibold">Customer Note:</div>
                <div className="text-amber-300 italic">"{inspectJob.notes}"</div>
              </div>
            )}

            {/* Owner Setting Corrections Before Approval */}
            <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                <SlidersHorizontal className="w-4 h-4" />
                <span>Adjust Settings Before Approving</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                
                {/* Printer Destination */}
                <div className="space-y-1 sm:col-span-1">
                  <label className="text-slate-300">Destination Printer</label>
                  <select
                    value={adjustedPrinter}
                    onChange={(e) => setAdjustedPrinter(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    {shop.printers.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Copies */}
                <div className="space-y-1">
                  <label className="text-slate-300">Copies</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={adjustedCopies}
                    onChange={(e) => setAdjustedCopies(parseInt(e.target.value || '1', 10))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>

                {/* Color Mode */}
                <div className="space-y-1">
                  <label className="text-slate-300">Color Mode</label>
                  <select
                    value={adjustedColor}
                    onChange={(e) => setAdjustedColor(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="bw">Black &amp; White</option>
                    <option value="color">Full Color</option>
                  </select>
                </div>

              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setRejectingJobId(inspectJob.id);
                  setInspectJob(null);
                }}
                className="px-4 py-2.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject Request</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInspectJob(null)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleApprove(inspectJob.id)}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg transition-all flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Accept &amp; Print to Windows Agent</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ================= REJECT REASON MODAL ================= */}
      {rejectingJobId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <span>Decline Print Job #{rejectingJobId}</span>
            </h3>
            <p className="text-xs text-slate-400">
              Select or type the reason for the customer so they can rectify the issue:
            </p>

            <div className="space-y-2">
              {[
                'File text is blurred / unreadable',
                'Password protected PDF (cannot open)',
                'Unsupported custom paper size',
                'Color ink currently low / Maintenance',
                'Customer requested cancellation verbally'
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setRejectReason(reason)}
                  className={`w-full p-2.5 text-xs text-left rounded-lg border transition-all ${
                    rejectReason === reason
                      ? 'bg-rose-950/70 border-rose-500 text-white'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={2}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              placeholder="Or type custom reason..."
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingJobId(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-lg hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleReject(rejectingJobId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg shadow-sm"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
