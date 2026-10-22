import React from 'react';
import { 
  QrCode, 
  Printer, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  Lock, 
  FileCheck,
  MonitorCheck,
  Building,
  Smartphone
} from 'lucide-react';
import type { Shop } from '../types/index.ts';

interface HomeLandingViewProps {
  activeShop: Shop;
  onNavigate: (view: 'dashboard' | 'upload' | 'poster' | 'admin') => void;
  onOpenRegister: () => void;
  onOpenAgentModal: () => void;
}

export const HomeLandingView: React.FC<HomeLandingViewProps> = ({
  activeShop,
  onNavigate,
  onOpenRegister,
  onOpenAgentModal
}) => {
  return (
    <div className="space-y-20 pb-20">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 sm:pt-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-medium text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 rounded-full px-3 py-1">
                <Zap className="w-3.5 h-3.5" />
                <span>Made for Indian Xerox, Print & Cyber Shops</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight [text-wrap:balance]">
                Smart QR Document Printing for Modern Indian Print Shops
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed [text-wrap:balance]">
                Customers scan your shop's QR code from their phone, upload PDFs or Aadhaar cards, and select copies. You inspect the document on your computer and click Accept &amp; Print. Zero WhatsApp clutter, zero customer app downloads.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => onNavigate('upload')}
                  className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg transition-all flex items-center gap-2"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Try Customer Upload (Phone View)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onNavigate('dashboard')}
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm rounded-xl border border-slate-700 transition-colors flex items-center gap-2"
                >
                  <Printer className="w-4 h-4 text-cyan-400" />
                  <span>Open Shop Owner Dashboard</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 grid grid-cols-3 gap-4 border-t border-slate-800 text-xs text-slate-400">
                <div className="space-y-1">
                  <div className="text-white font-bold text-lg font-mono tabular-nums">100%</div>
                  <div>Explicit Owner Approval</div>
                </div>
                <div className="space-y-1">
                  <div className="text-white font-bold text-lg font-mono tabular-nums">30 Min</div>
                  <div>Auto Privacy Purge</div>
                </div>
                <div className="space-y-1">
                  <div className="text-white font-bold text-lg font-mono tabular-nums">Win 10/11</div>
                  <div>USB &amp; LAN Spooling</div>
                </div>
              </div>
            </div>

            {/* Hero Image Showcase */}
            <div className="lg:col-span-6 relative">
              <div className="rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-800">
                <img
                  src="/src/assets/images/fast_print_hero_1792691227237.jpg"
                  alt="Modern Indian print shop counter with Fast Print Service"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto object-cover aspect-video"
                />
                <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>Live Counter: <strong className="text-white">{activeShop.name}</strong></span>
                  </div>
                  <span className="font-mono tabular-nums text-cyan-400">Pairing Code: {activeShop.pairingCode}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3-Step Mechanism Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            How Fast Print Service Eliminates the Daily Shop Chaos
          </h2>
          <p className="text-sm text-slate-400">
            Engineered specifically to solve the biggest headache of Indian print shop owners: WhatsApp message flooding and missing print settings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center font-bold text-lg">
              1
            </div>
            <h3 className="text-lg font-semibold text-white">Customer Scans Counter QR</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Customer points their camera at the acrylic counter stand. The mobile upload page opens instantly without requiring any login or app install.
            </p>
            <div className="text-xs text-slate-400 font-mono">
              Supports: PDF, Aadhaar cards, JPGs, assignments up to 50MB
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center font-bold text-lg">
              2
            </div>
            <h3 className="text-lg font-semibold text-white">Owner Reviews &amp; Approves</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Your computer rings with a pleasant notification chime. Inspect the document preview, verify pages &amp; copies, and click Accept &amp; Print.
            </p>
            <div className="text-xs text-slate-400 font-mono">
              Strict Rule: Zero printing occurs without owner sign-off
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center font-bold text-lg">
              3
            </div>
            <h3 className="text-lg font-semibold text-white">Windows Agent Spools &amp; Scrubs</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              The local Fast Print Agent transmits the file straight into your Windows printer spooler. Sensitive files are cryptographically wiped after 30 minutes.
            </p>
            <div className="text-xs text-slate-400 font-mono">
              Canon, HP, Epson, Brother &amp; heavy Xerox copiers supported
            </div>
          </div>

        </div>
      </section>

      {/* Dual Showcase: Counter Poster & Windows Agent */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Card 1: Counter Poster */}
          <div className="p-6 sm:p-8 rounded-2xl bg-slate-800/50 border border-slate-700 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Hardware Asset</span>
                <span className="text-xs text-slate-400">A4 Printable Poster</span>
              </div>
              <h3 className="text-xl font-bold text-white">Ready-to-Print Counter Stand</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Generate and print an authentic shop counter stand with your shop name, phone number, current pricing rate card, and QR code ready for lamination.
              </p>
              <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
                <img
                  src="/src/assets/images/counter_poster_mockup_1792691227696.jpg"
                  alt="Print shop acrylic counter stand with Fast Print QR code"
                  referrerPolicy="no-referrer"
                  className="w-full h-48 object-cover"
                />
              </div>
            </div>

            <button
              onClick={() => onNavigate('poster')}
              className="w-full py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <QrCode className="w-4 h-4 text-cyan-400" />
              <span>Customize &amp; Download Counter Poster</span>
            </button>
          </div>

          {/* Card 2: Windows Print Agent */}
          <div className="p-6 sm:p-8 rounded-2xl bg-slate-800/50 border border-slate-700 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Desktop Integration</span>
                <span className="text-xs text-slate-400">Windows 10 / 11 Native</span>
              </div>
              <h3 className="text-xl font-bold text-white">Local Windows Print Agent</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                A lightweight client running on your shop PC that connects directly to your Windows print spooler via standard drivers. No manual file downloads needed.
              </p>
              <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
                <img
                  src="/src/assets/images/windows_agent_setup_1792691227413.jpg"
                  alt="Windows 11 workstation connected to local printers"
                  referrerPolicy="no-referrer"
                  className="w-full h-48 object-cover"
                />
              </div>
            </div>

            <button
              onClick={onOpenAgentModal}
              className="w-full py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <MonitorCheck className="w-4 h-4 text-cyan-400" />
              <span>View Pairing Code &amp; Download Agent Kit</span>
            </button>
          </div>

        </div>
      </section>

      {/* Security & Document Privacy Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Government &amp; Aadhaar Privacy Standards</span>
              </div>
              <h2 className="text-2xl font-bold text-white">
                Zero Document Storing. Strict 30-Minute Cryptographic Purge.
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Indian citizens frequently print sensitive documents such as Aadhaar cards, PAN cards, marks cards, and property deeds. Fast Print Service strictly enforces isolated shop storage, short-lived signed links, and automated file purging after printing.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>No customer documents saved on personal phones</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Short-lived memory spooling in Windows temp directory</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Manual "Purge Now" button for instant post-print wipe</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Never used for AI training or external indexing</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-slate-800/80 rounded-2xl border border-slate-700 text-center space-y-3">
              <Lock className="w-10 h-10 text-cyan-400" />
              <div className="text-white font-bold text-sm">Privacy Compliance Engine</div>
              <div className="text-xs text-slate-400">
                Active shop: <span className="text-white font-medium">{activeShop.name}</span>
              </div>
              <button
                onClick={() => onNavigate('dashboard')}
                className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold text-xs rounded-lg transition-colors"
              >
                Go to Shop Workspace
              </button>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
};
