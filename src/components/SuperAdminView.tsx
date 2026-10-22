import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Building2, 
  FileText, 
  Clock, 
  Trash2, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Database,
  Lock,
  Cpu
} from 'lucide-react';
import type { Shop, AuditLogItem, PlatformConfig } from '../types/index.ts';

export const SuperAdminView: React.FC = () => {
  const [metrics, setMetrics] = useState<any>({
    totalShops: 0,
    totalJobs: 0,
    completedJobs: 0,
    totalPagesPrinted: 0,
    activeAgents: 0
  });
  const [shops, setShops] = useState<Shop[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [retentionMinutes, setRetentionMinutes] = useState(30);
  const [savingConfig, setSavingConfig] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'shops' | 'retention' | 'audit'>('overview');

  const fetchData = async () => {
    try {
      const [mRes, sRes, lRes] = await Promise.all([
        fetch('/api/admin/metrics'),
        fetch('/api/admin/shops'),
        fetch('/api/admin/audit-logs')
      ]);

      if (mRes.ok) {
        const m = await mRes.json();
        setMetrics(m);
        if (m.platformConfig?.autoRetentionMinutes) {
          setRetentionMinutes(m.platformConfig.autoRetentionMinutes);
        }
      }
      if (sRes.ok) {
        const s = await sRes.json();
        setShops(s.shops || []);
      }
      if (lRes.ok) {
        const l = await lRes.json();
        setAuditLogs(l.auditLogs || []);
      }
    } catch (e) {
      console.error('Failed to load admin data:', e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleShop = async (shopId: string) => {
    try {
      const res = await fetch(`/api/admin/shops/${shopId}/toggle`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setShops(prev => prev.map(s => s.id === shopId ? { ...s, isActive: data.isActive } : s));
      }
    } catch (e) {}
  };

  const handleSaveRetention = async () => {
    setSavingConfig(true);
    try {
      await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoRetentionMinutes: retentionMinutes })
      });
      fetchData();
    } catch (e) {} finally {
      setSavingConfig(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Admin Header */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-800 mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Platform Governance Console</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Fast Print Service — Platform Super Admin
          </h1>
          <p className="text-xs text-slate-400">
            Monitor network shops, configure strict Aadhaar auto-retention purge windows, and audit cryptographic wipe events.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-xl space-y-1">
          <div className="text-xs text-slate-400">Registered Shops</div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {metrics.totalShops || shops.length}
          </div>
          <div className="text-[11px] text-slate-400">Indian Xerox &amp; DTP Centers</div>
        </div>

        <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-xl space-y-1">
          <div className="text-xs text-slate-400">Total Print Jobs</div>
          <div className="text-2xl font-bold text-cyan-400 font-mono tabular-nums">
            {metrics.totalJobs}
          </div>
          <div className="text-[11px] text-slate-400">Submitted by customers</div>
        </div>

        <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-xl space-y-1">
          <div className="text-xs text-slate-400">Completed Jobs</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            {metrics.completedJobs}
          </div>
          <div className="text-[11px] text-slate-400">Spool verified</div>
        </div>

        <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-xl space-y-1">
          <div className="text-xs text-slate-400">Total Pages Printed</div>
          <div className="text-2xl font-bold text-amber-400 font-mono tabular-nums">
            {metrics.totalPagesPrinted}
          </div>
          <div className="text-[11px] text-slate-400">Across all network printers</div>
        </div>

        <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-xl space-y-1">
          <div className="text-xs text-slate-400">Active Windows Agents</div>
          <div className="text-2xl font-bold text-cyan-300 font-mono tabular-nums">
            {metrics.activeAgents}
          </div>
          <div className="text-[11px] text-slate-400">Live desktop spoolers</div>
        </div>

      </div>

      {/* Admin Tab Controls */}
      <div className="flex items-center gap-1 p-1 bg-slate-800 rounded-xl border border-slate-700 w-fit">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'overview' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          Network Overview
        </button>
        <button
          onClick={() => setActiveTab('shops')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'shops' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          Shop Management ({shops.length})
        </button>
        <button
          onClick={() => setActiveTab('retention')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'retention' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          Privacy &amp; Retention Policy
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'audit' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          Audit &amp; Wipe Logs ({auditLogs.length})
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-slate-800/60 border border-slate-700 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan-400" />
              <span>Platform Health &amp; Subsystems</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-400">Multer Temporary Ingestion:</span>
                <span className="text-emerald-400 font-mono">ONLINE (/uploads)</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-400">Real-time SSE Notification Stream:</span>
                <span className="text-emerald-400 font-mono">ACTIVE (0ms delay)</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-400">Auto-Retention Garbage Collector:</span>
                <span className="text-emerald-400 font-mono">RUNNING (Every 60s)</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-400">Windows Printing Protocol:</span>
                <span className="text-cyan-400 font-mono">Win32 Spooler / PowerShell WMI</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-800/60 border border-slate-700 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-400" />
              <span>Customer Document Privacy Governance</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              In compliance with strict data protection guidelines:
            </p>
            <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
              <li>Super Admins have zero visibility into customer identity documents or file contents.</li>
              <li>Customer documents are mapped only to the specific shop ID that generated the counter QR code.</li>
              <li>Every print job undergoes mandatory cryptographic scrubbing once printed or when the retention period expires.</li>
              <li>No customer documents are retained for analytics, advertising, or machine learning.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 2: Shop Management */}
      {activeTab === 'shops' && (
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 border-b border-slate-700 text-slate-400 uppercase font-mono tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Shop Name</th>
                  <th className="py-3 px-4">Owner &amp; Contact</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Windows Agent</th>
                  <th className="py-3 px-4">Default Printer</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 font-medium">
                {shops.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="text-white font-bold">{s.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{s.id}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-200">{s.ownerName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">+91 {s.mobile}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-200">{s.city}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[150px]">{s.address}</div>
                    </td>
                    <td className="py-3 px-4">
                      {s.agentConnected ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-mono">
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                          <span>Online</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono">Offline / Standby</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">
                      {s.defaultPrinter}
                    </td>
                    <td className="py-3 px-4">
                      {s.isActive ? (
                        <span className="text-emerald-400 font-semibold">Active</span>
                      ) : (
                        <span className="text-rose-400 font-semibold">Suspended</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleShop(s.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          s.isActive
                            ? 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800'
                            : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {s.isActive ? 'Suspend' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Retention Policy */}
      {activeTab === 'retention' && (
        <div className="p-6 bg-slate-800/80 border border-slate-700 rounded-2xl max-w-xl space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Automated Privacy File Retention Window</h3>
            <p className="text-xs text-slate-400">
              Files uploaded by walk-in customers are automatically wiped from server disk after the selected duration.
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Retention Duration
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { min: 5, label: '5 Minutes (High Security)' },
                { min: 15, label: '15 Minutes' },
                { min: 30, label: '30 Minutes (Recommended)' },
                { min: 60, label: '1 Hour' }
              ].map((item) => (
                <button
                  key={item.min}
                  type="button"
                  onClick={() => setRetentionMinutes(item.min)}
                  className={`p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                    retentionMinutes === item.min
                      ? 'bg-cyan-950 border-cyan-500 text-white font-bold'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSaveRetention}
            disabled={savingConfig}
            className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-2"
          >
            {savingConfig ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            <span>Save Platform Retention Policy</span>
          </button>
        </div>
      )}

      {/* Tab 4: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-900 border-b border-slate-700 flex items-center justify-between text-xs text-slate-400">
            <span>Cryptographic File &amp; Spool Audit Trail</span>
            <span>Immutable Append-Only Log</span>
          </div>

          <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-700/60 font-mono text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 hover:bg-slate-700/30">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 text-[11px] tabular-nums">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                    log.action === 'file_purged'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : log.action === 'job_approved'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-slate-700 text-slate-200'
                  }`}>
                    {log.action}
                  </span>
                  <span className="text-slate-200">{log.details}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Shop: {log.shopId}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
