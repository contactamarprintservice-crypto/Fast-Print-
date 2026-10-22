import React from 'react';
import { Printer, ShieldCheck, QrCode, MonitorDown, LayoutDashboard, Building2 } from 'lucide-react';
import type { Shop } from '../types/index.ts';

interface NavbarProps {
  currentView: 'home' | 'dashboard' | 'upload' | 'admin' | 'poster';
  setCurrentView: (view: 'home' | 'dashboard' | 'upload' | 'admin' | 'poster') => void;
  activeShop: Shop;
  shops: Shop[];
  onSelectShop: (shop: Shop) => void;
  onOpenRegister: () => void;
  onOpenAgentModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  activeShop,
  shops,
  onSelectShop,
  onOpenRegister,
  onOpenAgentModal
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Single-element Brand Wordmark */}
        <button
          onClick={() => setCurrentView('home')}
          className="flex items-center gap-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-md"
        >
          <div className="w-9 h-9 rounded-lg bg-cyan-600 flex items-center justify-center text-white shadow-sm">
            <Printer className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0">
            Fast Print Service
          </span>
        </button>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => setCurrentView('home')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              currentView === 'home' ? 'text-cyan-400 font-semibold' : 'hover:text-white'
            }`}
          >
            Overview
          </button>

          <button
            onClick={() => setCurrentView('dashboard')}
            className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              currentView === 'dashboard' ? 'text-cyan-400 font-semibold' : 'hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-cyan-500" />
            <span>Shop Dashboard</span>
          </button>

          <button
            onClick={() => setCurrentView('upload')}
            className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              currentView === 'upload' ? 'text-cyan-400 font-semibold' : 'hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4 text-cyan-500" />
            <span>Customer Upload</span>
          </button>

          <button
            onClick={onOpenAgentModal}
            className="flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 hover:text-white"
          >
            <MonitorDown className="w-4 h-4 text-cyan-500" />
            <span>Windows Agent</span>
          </button>

          <button
            onClick={() => setCurrentView('poster')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              currentView === 'poster' ? 'text-cyan-400 font-semibold' : 'hover:text-white'
            }`}
          >
            Counter Poster
          </button>

          <button
            onClick={() => setCurrentView('admin')}
            className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              currentView === 'admin' ? 'text-cyan-400 font-semibold' : 'hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span>Super Admin</span>
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action Area */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Shop Switcher Dropdown */}
          <div className="relative hidden sm:block">
            <select
              value={activeShop.id}
              onChange={(e) => {
                const s = shops.find(item => item.id === e.target.value);
                if (s) onSelectShop(s);
              }}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-cyan-500 focus:outline-none max-w-[160px] truncate"
            >
              {shops.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onOpenRegister}
            className="px-3.5 py-2 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm flex items-center gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Register Shop</span>
          </button>
        </div>

      </div>
    </header>
  );
};
