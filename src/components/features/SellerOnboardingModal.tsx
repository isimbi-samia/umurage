import React, { useState } from 'react';
import { Store, X, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface SellerOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SellerOnboardingModal: React.FC<SellerOnboardingModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [district, setDistrict] = useState('Nyarugenge');
  const [city, setCity] = useState('Kigali');
  const [description, setDescription] = useState('');
  const [payoutInfo, setPayoutInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to register as a seller.');
      return;
    }
    if (!businessName.trim() || !phone.trim() || !email.trim()) {
      toast.error('Please complete all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('sellers').insert({
        user_id: user.id,
        business_name: businessName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        district,
        city,
        description: description.trim(),
        payout_info: payoutInfo.trim() || 'MTN Mobile Money',
        status: 'approved',
      });

      if (error) throw error;

      toast.success('Seller registration completed! You can now post Made-in-Rwanda products.');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Seller onboarding error:', err);
      toast.error(err.message || 'Failed to complete seller registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-[#1b120b] border border-[#5c3417] p-6 z-10 animate-fade-in text-amber-50">
        <button onClick={onClose} className="absolute top-4 right-4 text-amber-200/50 hover:text-amber-50">
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-900/40 border border-amber-700/50 flex items-center justify-center">
            <Store size={20} className="text-amber-400" />
          </div>
          <div>
            <h2 className="font-cinzel text-xl text-amber-400 font-bold">Become a Made-in-Rwanda Seller</h2>
            <p className="text-xs text-amber-200/60">Register your cultural artisan business to sell authentic products.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-amber-200/80 block mb-1">Business / Artisan Name *</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Gahaya Links Weavers / Nyamirambo Crafts"
              className="w-full bg-[#24170e] border border-[#4a2e16] rounded-xl px-3 py-2.5 text-amber-50 placeholder:text-amber-200/40 focus:outline-none focus:border-amber-400/60"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-amber-200/80 block mb-1">Phone Number *</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+250 788 000 000"
                className="w-full bg-[#24170e] border border-[#4a2e16] rounded-xl px-3 py-2 text-amber-50 placeholder:text-amber-200/40 focus:outline-none focus:border-amber-400/60"
              />
            </div>
            <div>
              <label className="font-semibold text-amber-200/80 block mb-1">Email Address *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seller@domain.rw"
                className="w-full bg-[#24170e] border border-[#4a2e16] rounded-xl px-3 py-2 text-amber-50 placeholder:text-amber-200/40 focus:outline-none focus:border-amber-400/60"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-amber-200/80 block mb-1">District</label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full bg-[#24170e] border border-[#4a2e16] rounded-xl px-3 py-2 text-amber-50"
              >
                <option value="Nyarugenge">Nyarugenge</option>
                <option value="Gasabo">Gasabo</option>
                <option value="Kicukiro">Kicukiro</option>
                <option value="Musanze">Musanze</option>
                <option value="Huye">Huye</option>
                <option value="Rubavu">Rubavu</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-amber-200/80 block mb-1">City / Town</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Kigali"
                className="w-full bg-[#24170e] border border-[#4a2e16] rounded-xl px-3 py-2 text-amber-50"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-amber-200/80 block mb-1">Business Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your handmade products, Imigongo art, traditional attire..."
              rows={2}
              className="w-full bg-[#24170e] border border-[#4a2e16] rounded-xl px-3 py-2 text-amber-50 placeholder:text-amber-200/40 focus:outline-none focus:border-amber-400/60 resize-none"
            />
          </div>

          <div>
            <label className="font-semibold text-amber-200/80 block mb-1">Payout Mobile Money Account</label>
            <input
              type="text"
              value={payoutInfo}
              onChange={(e) => setPayoutInfo(e.target.value)}
              placeholder="MTN Mobile Money (+250 788 123 456)"
              className="w-full bg-[#24170e] border border-[#4a2e16] rounded-xl px-3 py-2 text-amber-50 placeholder:text-amber-200/40 focus:outline-none focus:border-amber-400/60"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-[#4a2e16] rounded-xl text-xs text-amber-200/70 hover:text-amber-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 btn-gold py-2.5 text-xs flex items-center justify-center gap-2 font-bold"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Complete Registration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
