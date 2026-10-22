import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { HomeLandingView } from './components/HomeLandingView.tsx';
import { ShopDashboardView } from './components/ShopDashboardView.tsx';
import { CustomerUploadView } from './components/CustomerUploadView.tsx';
import { SuperAdminView } from './components/SuperAdminView.tsx';
import { CounterPosterModal } from './components/CounterPosterModal.tsx';
import { WindowsAgentModal } from './components/WindowsAgentModal.tsx';
import { ShopRegistrationModal } from './components/ShopRegistrationModal.tsx';
import type { Shop } from './types/index.ts';

// Initial fallback shop
const initialDefaultShop: Shop = {
  id: 'sh-om-xerox',
  name: 'Om Sai Xerox & Cyber Cafe',
  ownerName: 'Ramesh Sharma',
  mobile: '9820123456',
  email: 'contact.amarprintservice@gmail.com',
  address: 'Shop No. 4, Station Road, Opp. Platform 1, Andheri West',
  city: 'Mumbai',
  pincode: '400058',
  pricing: {
    bwSingle: 2.0,
    bwDuplex: 3.0,
    colorSingle: 10.0,
    colorDuplex: 15.0,
    legalRate: 3.0,
    photoGlossyRate: 25.0
  },
  pairingCode: '829415',
  agentConnected: true,
  agentLastSeen: new Date().toISOString(),
  agentOs: 'Windows 11 Pro 64-bit (Build 22631)',
  defaultPrinter: 'Canon imageRUNNER 2006/2206 (Main Counter)',
  printers: [
    {
      name: 'Canon imageRUNNER 2006/2206 (Main Counter)',
      driver: 'Canon UFR II Laser Multi-function Driver',
      isDefault: true,
      status: 'ready',
      queueCount: 0,
      supportedPaper: ['A4', 'A5', 'Legal'],
      supportsColor: false,
      supportsDuplex: true,
      connectionType: 'usb',
      location: 'Counter 1'
    },
    {
      name: 'HP LaserJet Pro MFP M428fdw',
      driver: 'HP PCL-6 Universal Driver',
      isDefault: false,
      status: 'ready',
      queueCount: 0,
      supportedPaper: ['A4', 'Legal', 'Letter'],
      supportsColor: false,
      supportsDuplex: true,
      connectionType: 'network',
      location: 'Back Desk'
    },
    {
      name: 'Epson EcoTank L8050 Photo Series',
      driver: 'Epson ESC/P Standard V4',
      isDefault: false,
      status: 'ready',
      queueCount: 0,
      supportedPaper: ['A4', 'A5', 'Letter'],
      supportsColor: true,
      supportsDuplex: false,
      connectionType: 'usb',
      location: 'Photo Counter'
    }
  ],
  createdAt: new Date().toISOString(),
  isActive: true
};

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'dashboard' | 'upload' | 'poster' | 'admin'>('home');
  const [activeShop, setActiveShop] = useState<Shop>(initialDefaultShop);
  const [allShops, setAllShops] = useState<Shop[]>([initialDefaultShop]);

  // Modals
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isPosterModalOpen, setIsPosterModalOpen] = useState(false);

  // Parse URL query parameters on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const shopParam = params.get('shop');

    if (viewParam === 'upload') {
      setCurrentView('upload');
    } else if (viewParam === 'dashboard') {
      setCurrentView('dashboard');
    } else if (viewParam === 'admin') {
      setCurrentView('admin');
    }

    // Fetch live shops from server
    fetch('/api/admin/shops')
      .then(res => res.json())
      .then(data => {
        if (data.shops && data.shops.length > 0) {
          setAllShops(data.shops);
          if (shopParam) {
            const found = data.shops.find((s: Shop) => s.id === shopParam);
            if (found) {
              setActiveShop(found);
            }
          } else {
            setActiveShop(data.shops[0]);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleShopRegistered = (newShop: Shop) => {
    setAllShops(prev => [newShop, ...prev]);
    setActiveShop(newShop);
    setCurrentView('dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      
      {/* Top Bar Navigation */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        activeShop={activeShop}
        shops={allShops}
        onSelectShop={(s) => setActiveShop(s)}
        onOpenRegister={() => setIsRegisterOpen(true)}
        onOpenAgentModal={() => setIsAgentModalOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'home' && (
          <HomeLandingView
            activeShop={activeShop}
            onNavigate={(view) => {
              if (view === 'poster') {
                setIsPosterModalOpen(true);
              } else {
                setCurrentView(view);
              }
            }}
            onOpenRegister={() => setIsRegisterOpen(true)}
            onOpenAgentModal={() => setIsAgentModalOpen(true)}
          />
        )}

        {currentView === 'dashboard' && (
          <ShopDashboardView
            shop={activeShop}
            onOpenPosterModal={() => setIsPosterModalOpen(true)}
            onOpenAgentModal={() => setIsAgentModalOpen(true)}
            onUpdateShop={(s) => {
              setActiveShop(s);
              setAllShops(prev => prev.map(item => item.id === s.id ? s : item));
            }}
          />
        )}

        {currentView === 'upload' && (
          <CustomerUploadView
            shop={activeShop}
            onJobSubmitted={() => {
              // Optionally handled in view
            }}
          />
        )}

        {currentView === 'poster' && (
          <div className="py-8">
            <CounterPosterModal
              shop={activeShop}
              onClose={() => setCurrentView('dashboard')}
            />
          </div>
        )}

        {currentView === 'admin' && (
          <SuperAdminView />
        )}
      </main>

      {/* Persistent Modals */}
      {isRegisterOpen && (
        <ShopRegistrationModal
          onClose={() => setIsRegisterOpen(false)}
          onRegistered={handleShopRegistered}
        />
      )}

      {isAgentModalOpen && (
        <WindowsAgentModal
          shop={activeShop}
          onClose={() => setIsAgentModalOpen(false)}
          onUpdateShop={(s) => {
            setActiveShop(s);
            setAllShops(prev => prev.map(item => item.id === s.id ? s : item));
          }}
        />
      )}

      {isPosterModalOpen && (
        <CounterPosterModal
          shop={activeShop}
          onClose={() => setIsPosterModalOpen(false)}
        />
      )}

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-xs text-slate-400 py-8 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-cyan-600 flex items-center justify-center text-white text-[10px] font-bold">
              FP
            </div>
            <span className="font-semibold text-slate-200">Fast Print Service</span>
            <span>— Smart QR Document Printing for Indian Print Shops</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => setCurrentView('home')}
              className="hover:text-white transition-colors"
            >
              Overview
            </button>
            <button
              onClick={() => setCurrentView('dashboard')}
              className="hover:text-white transition-colors"
            >
              Shop Dashboard
            </button>
            <button
              onClick={() => setCurrentView('upload')}
              className="hover:text-white transition-colors"
            >
              Upload View
            </button>
            <button
              onClick={() => setIsAgentModalOpen(true)}
              className="hover:text-white transition-colors"
            >
              Windows Agent
            </button>
            <button
              onClick={() => setCurrentView('admin')}
              className="hover:text-white transition-colors"
            >
              Super Admin
            </button>
          </div>

          <div className="text-[11px] text-slate-500">
            Aadhaar &amp; Personal Data Compliant · Auto-Purged in 30 Mins
          </div>
        </div>
      </footer>

    </div>
  );
}
