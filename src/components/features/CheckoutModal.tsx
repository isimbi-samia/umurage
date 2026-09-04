import React, { useState } from 'react';
import { ShoppingBag, X, Loader2, CheckCircle2, ShieldCheck, CreditCard, Smartphone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    price: number;
    currency: string;
    seller_id?: string;
    seller?: any;
  };
  onSuccess: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, product, onSuccess }) => {
  const { user } = useAuth();
  const [buyerName, setBuyerName] = useState(user?.user_metadata?.full_name || '');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [district, setDistrict] = useState('Gasabo');
  const [city, setCity] = useState('Kigali');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to complete your order.');
      return;
    }
    if (!buyerName.trim() || !phone.trim() || !deliveryAddress.trim()) {
      toast.error('Please provide all required delivery information.');
      return;
    }

    setIsProcessing(true);
    try {
      // Execute authoritative server-side RPC
      const { data: orderId, error } = await supabase.rpc('create_marketplace_order', {
        p_product_id: product.id,
        p_quantity: 1,
        p_buyer_name: buyerName.trim(),
        p_phone: phone.trim(),
        p_email: email.trim() || null,
        p_delivery_address: deliveryAddress.trim(),
        p_district: district.trim(),
        p_city: city.trim(),
        p_delivery_instructions: deliveryInstructions.trim() || null,
      });

      if (error) throw error;

      toast.success('Order placed successfully! Pay on delivery upon inspection.');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error(err.message || 'Order placement failed. Please try again.');
    } finally {
      setIsProcessing(false);
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
            <ShoppingBag size={20} className="text-amber-400" />
          </div>
          <div>
            <h2 className="font-cinzel text-xl text-amber-400 font-bold">Order Made-in-Rwanda Item</h2>
            <p className="text-xs text-amber-200/60">Pay on Delivery after receiving & inspecting your items.</p>
          </div>
        </div>

        {/* Order Summary Box */}
        <div className="mb-4 p-3 rounded-xl bg-[#24170e] border border-[#4a2e16] flex items-center justify-between text-xs">
          <div>
            <p className="font-semibold text-amber-50">{product.name}</p>
            <p className="text-[11px] text-amber-200/60">Direct artisan delivery in Rwanda</p>
          </div>
          <div className="text-right">
            <p className="text-amber-400 font-bold text-sm">
              {product.currency} {product.price.toLocaleString()}
            </p>
          </div>
        </div>

        <form onSubmit={handleCheckout} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-amber-200/80 block mb-1">Buyer Full Name *</label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Full name"
                className="w-full bg-[#24170e] border border-[#4a2e16] rounded-xl px-3 py-2 text-amber-50 placeholder:text-amber-200/40 focus:outline-none focus:border-amber-400/60"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-amber-200/80 block mb-1">Phone Number *</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+250 788 000 000"
                className="w-full bg-[#24170e] border border-[#4a2e16] rounded-xl px-3 py-2 text-amber-50 placeholder:text-amber-200/40 focus:outline-none focus:border-amber-400/60"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-amber-200/80 block mb-1">Delivery Address *</label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Street address or location landmark"
                className="w-full bg-[#24170e] border border-[#4a2e16] rounded-xl px-3 py-2 text-amber-50 placeholder:text-amber-200/40 focus:outline-none focus:border-amber-400/60"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-amber-200/80 block mb-1">District / City</label>
              <input
                type="text"
                value={`${district}, ${city}`}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full bg-[#24170e] border border-[#4a2e16] rounded-xl px-3 py-2 text-amber-50"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-amber-200/80 block mb-1">Delivery Instructions (Optional)</label>
            <input
              type="text"
              value={deliveryInstructions}
              onChange={(e) => setDeliveryInstructions(e.target.value)}
              placeholder="e.g. Near Kimironko market, call before delivery"
              className="w-full bg-[#24170e] border border-[#4a2e16] rounded-xl px-3 py-2 text-amber-50 placeholder:text-amber-200/40 focus:outline-none focus:border-amber-400/60"
            />
          </div>

          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-200/80 flex items-start gap-2.5">
            <ShieldCheck size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-300 block mb-0.5">Pay on Delivery Guaranteed</span>
              Pay Cash or Mobile Money to the artisan/courier after receiving and verifying your product quality.
            </div>
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
              disabled={isProcessing}
              className="flex-1 btn-gold py-2.5 text-xs flex items-center justify-center gap-2 font-bold"
            >
              {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Place Order ({product.currency} {product.price.toLocaleString()})
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
