import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, 
  Download, 
  X, 
  Smartphone, 
  ShieldCheck, 
  Sparkles,
  Edit2,
  FileText
} from 'lucide-react';
import type { Shop } from '../types/index.ts';
import { generateQrDataUrl } from '../utils/qr.ts';

interface CounterPosterModalProps {
  shop: Shop;
  onClose: () => void;
}

export const CounterPosterModal: React.FC<CounterPosterModalProps> = ({ shop, onClose }) => {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [headline, setHeadline] = useState('FAST PRINT SERVICE');
  const [subline, setSubline] = useState('Scan & Print Documents Directly From Your Phone');
  const [bullet1, setBullet1] = useState('No WhatsApp contact saving needed');
  const [bullet2, setBullet2] = useState('Full resolution PDF & Photo printing');
  const [bullet3, setBullet3] = useState('30-Minute automatic privacy wipe');
  const [isEditing, setIsEditing] = useState(false);

  const posterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate QR pointing to the customer upload page for this shop
    const uploadUrl = `${window.location.origin}/?view=upload&shop=${shop.id}`;
    generateQrDataUrl(uploadUrl, { width: 400, margin: 2 }).then(setQrUrl);
  }, [shop.id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPng = () => {
    if (!qrUrl) return;
    const link = document.createElement('a');
    link.download = `${shop.id}-counter-poster.png`;
    link.href = qrUrl;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full max-h-[95vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
        
        {/* Header Controls */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 no-print">
          <div>
            <div className="text-xs uppercase font-mono text-cyan-400">Shop Marketing Asset</div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Print-Ready Counter Stand Poster</span>
              <span className="text-xs bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded font-normal">
                Standard A4 / Acrylic Stand
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isEditing ? 'Done Editing' : 'Customize Text'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4 Poster</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Customization Drawer (if open) */}
        {isEditing && (
          <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl space-y-3 text-xs no-print">
            <div className="text-cyan-400 font-semibold uppercase tracking-wider">Customize Poster Copy</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400">Header Banner</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="text-slate-400">Tagline / Instruction</label>
                <input
                  type="text"
                  value={subline}
                  onChange={(e) => setSubline(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* A4 Poster Canvas (Visual Output) */}
        <div className="flex justify-center bg-slate-950 p-4 sm:p-8 rounded-2xl border border-slate-800">
          <div
            ref={posterRef}
            className="w-full max-w-md bg-white text-slate-950 rounded-2xl p-8 shadow-2xl flex flex-col justify-between items-center text-center space-y-6 border border-slate-200"
            style={{ minHeight: '620px' }}
          >
            {/* Poster Header */}
            <div className="space-y-2 w-full">
              <div className="bg-slate-950 text-white py-2 px-4 rounded-xl text-center shadow-sm">
                <span className="text-base font-extrabold tracking-widest uppercase">
                  {headline}
                </span>
              </div>
              
              <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                {shop.name}
              </h3>
              
              <p className="text-xs font-semibold text-cyan-700 max-w-xs mx-auto">
                {subline}
              </p>
            </div>

            {/* QR Code Container */}
            <div className="p-4 bg-slate-50 border-2 border-dashed border-cyan-600 rounded-2xl shadow-inner space-y-2">
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt="Shop QR Code"
                  className="w-48 h-48 object-contain mx-auto"
                />
              ) : (
                <div className="w-48 h-48 bg-slate-200 animate-pulse rounded-lg flex items-center justify-center text-slate-400 text-xs">
                  Generating QR...
                </div>
              )}
              <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                Point Phone Camera to Upload
              </div>
            </div>

            {/* Price Rate Card Banner */}
            <div className="w-full bg-slate-100 rounded-xl p-3 border border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <div className="text-[10px] text-slate-500 font-medium">B&amp;W Xerox</div>
                <div className="text-sm font-bold text-slate-900 font-mono">₹{shop.pricing.bwSingle}/pg</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-medium">Color Print</div>
                <div className="text-sm font-bold text-slate-900 font-mono">₹{shop.pricing.colorSingle}/pg</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-medium">Photo Print</div>
                <div className="text-sm font-bold text-slate-900 font-mono">₹{shop.pricing.photoGlossyRate}/pg</div>
              </div>
            </div>

            {/* Trust Points */}
            <div className="w-full space-y-1.5 text-left text-xs text-slate-700 bg-cyan-50/70 p-3.5 rounded-xl border border-cyan-200">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-600"></span>
                <span>{bullet1}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-600"></span>
                <span>{bullet2}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-600"></span>
                <span>{bullet3}</span>
              </div>
            </div>

            {/* Poster Footer */}
            <div className="pt-2 border-t border-slate-200 w-full flex items-center justify-between text-[11px] text-slate-500">
              <span>{shop.address}</span>
              <span className="font-mono font-semibold">+91 {shop.mobile}</span>
            </div>

          </div>
        </div>

        {/* Download & Usage Tips */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 no-print pt-2">
          <div>
            Tip: Print this in colour on 200 GSM glossy paper or place inside an A4 acrylic tabletop stand.
          </div>
          <button
            onClick={handleDownloadPng}
            className="text-cyan-400 hover:underline flex items-center gap-1 shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download High-Res QR Graphic</span>
          </button>
        </div>

      </div>
    </div>
  );
};
