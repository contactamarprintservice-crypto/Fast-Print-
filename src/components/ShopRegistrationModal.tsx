import React, { useState } from 'react';
import { 
  Building2, 
  X, 
  Check, 
  AlertCircle, 
  Printer, 
  MapPin, 
  Phone, 
  User, 
  Mail,
  IndianRupee
} from 'lucide-react';
import type { Shop } from '../types/index.ts';

interface ShopRegistrationModalProps {
  onClose: () => void;
  onRegistered: (shop: Shop) => void;
}

export const ShopRegistrationModal: React.FC<ShopRegistrationModalProps> = ({
  onClose,
  onRegistered
}) => {
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [pincode, setPincode] = useState('');

  // Pricing setup
  const [bwSingle, setBwSingle] = useState(2.0);
  const [bwDuplex, setBwDuplex] = useState(3.0);
  const [colorSingle, setColorSingle] = useState(10.0);
  const [photoRate, setPhotoRate] = useState(25.0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName || !ownerName || !mobile) {
      setErrorMsg('Please enter Shop Name, Owner Name, and 10-digit Mobile Number.');
      return;
    }

    if (mobile.replace(/\D/g, '').length < 10) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName,
          ownerName,
          mobile,
          email,
          address,
          city,
          pincode,
          pricing: {
            bwSingle: Number(bwSingle),
            bwDuplex: Number(bwDuplex),
            colorSingle: Number(colorSingle),
            colorDuplex: Number(colorSingle) * 1.5,
            legalRate: Number(bwSingle) + 1,
            photoGlossyRate: Number(photoRate)
          }
        })
      });

      if (!res.ok) {
        throw new Error('Registration failed.');
      }

      const data = await res.json();
      if (data.shop) {
        onRegistered(data.shop);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
        
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="text-xs uppercase font-mono text-cyan-400">Onboarding New Shop</div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Register Your Indian Print &amp; Xerox Shop</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {errorMsg && (
            <div className="p-3 bg-rose-950 border border-rose-800 text-rose-200 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Shop & Owner Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Shop Name *</label>
              <input
                type="text"
                placeholder="e.g. Om Sai Xerox &amp; Prints"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Owner / Operator Name *</label>
              <input
                type="text"
                placeholder="e.g. Ramesh Sharma"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Mobile & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-300 font-medium">10-Digit Mobile Number *</label>
              <input
                type="tel"
                placeholder="9820123456"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Email Address (Optional)</label>
              <input
                type="email"
                placeholder="shop@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Address & City */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-slate-300 font-medium">Shop Address / Landmark</label>
              <input
                type="text"
                placeholder="Shop No. 4, Station Road, Opp Platform 1"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-medium">City</label>
              <input
                type="text"
                placeholder="e.g. Mumbai"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Initial Rate Card */}
          <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-2xl space-y-3">
            <div className="text-cyan-400 font-semibold uppercase tracking-wider">
              Set Your Print Rates (₹ Per Page)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-slate-400">B&amp;W Single</label>
                <div className="relative mt-1">
                  <span className="absolute left-2.5 top-2 text-slate-500">₹</span>
                  <input
                    type="number"
                    step="0.5"
                    value={bwSingle}
                    onChange={(e) => setBwSingle(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 pl-6 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400">B&amp;W Duplex</label>
                <div className="relative mt-1">
                  <span className="absolute left-2.5 top-2 text-slate-500">₹</span>
                  <input
                    type="number"
                    step="0.5"
                    value={bwDuplex}
                    onChange={(e) => setBwDuplex(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 pl-6 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400">Color Single</label>
                <div className="relative mt-1">
                  <span className="absolute left-2.5 top-2 text-slate-500">₹</span>
                  <input
                    type="number"
                    step="1"
                    value={colorSingle}
                    onChange={(e) => setColorSingle(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 pl-6 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400">Photo Glossy</label>
                <div className="relative mt-1">
                  <span className="absolute left-2.5 top-2 text-slate-500">₹</span>
                  <input
                    type="number"
                    step="5"
                    value={photoRate}
                    onChange={(e) => setPhotoRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 pl-6 text-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg transition-all"
            >
              {isSubmitting ? 'Registering...' : 'Complete Registration & Generate QR'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
