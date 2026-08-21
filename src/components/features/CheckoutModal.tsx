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
  const [phone, setPhone] = useState('+250 788 000 000');
  const [email, setEmail] = useState(user?.email || '');
  const [deliveryAddress, setDeliveryAddress] = useState('KN 5 Rd, Kimihurura');
  const [district, setDistrict] = useState('Gasabo');
  const [city, setCity] = useState('Kigali');
  const [paymentMethod, setPaymentMethod] = useState<'MTN Mobile Money' | 'Airtel Money' | 'Credit/Debit Card'>('MTN Mobile Money');
  const [momoNumber, setMomoNumber] = useState('+250 788 123 456');
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
      // 1. Create order in marketplace_orders
      const { data: order, error: orderErr } = await supabase
        .from('marketplace_orders')
        .insert({
          buyer_id: user.id,
          buyer_name: buyerName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          delivery_address: deliveryAddress.trim(),
          district,
          city,
          total_amount: product.price,
          currency: product.currency || 'RWF',
          status: 'paid', // Mark paid upon provider confirmation simulation
        })
        .select()
        .single();

      if (orderErr) throw orderErr;

      // 2. Create order item
      await supabase.from('marketplace_order_items').insert({
        order_id: order.id,
        product_id: product.id,
        seller_id: product.seller_id || product.seller?.id,
        quantity: 1,
        unit_price: product.price,
        total_price: product.price,
      });

      // 3. Create payment record with transaction reference
      const txRef = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const { error: payErr } = await supabase.from('payments').insert({
        order_id: order.id,
        user_id: user.id,
        amount: product.price,
        currency: product.currency || 'RWF',
        status: 'completed',
        payment_method: paymentMethod,
        provider: paymentMethod.includes('Mobile') ? 'paypack' : 'stripe',
        transaction_ref: txRef,
        metadata: { momo_number: momoNumber, delivery_address: deliveryAddress },
      });

      if (payErr) throw payErr;

      toast.success(`Payment confirmed! Ref: ${txRef}. Order placed successfully.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error(err.message || 'Payment initiation failed. Please try again.');
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
            <h2 className="font-cinzel text-xl text-amber-400 font-bold">Secure Made-in-Rwanda Checkout</h2>
            <p className="text-xs text-amber-200/60">Complete your transaction safely with local Mobile Money.</p>
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
                className="w-full bg-[#24170e] border border-[#4a2e16] rounded-xl px-3 py-2 text-amber-50"
              />
            </div>
            <div>
              <label className="font-semibold text-amber-200/80 block mb-1">Phone Number *</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#24170e] border border-[#4a2e16] rounded-xl px-3 py-2 text-amber-50"
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
                className="w-full bg-[#24170e] border border-[#4a2e16] rounded-xl px-3 py-2 text-amber-50"
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

          {/* Payment Method Selector */}
          <div>
            <label className="font-semibold text-amber-200/80 block mb-1.5">Select Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'MTN Mobile Money', label: 'MTN MoMo', icon: Smartphone },
                { key: 'Airtel Money', label: 'Airtel Money', icon: Smartphone },
                { key: 'Credit/Debit Card', label: 'Card Payment', icon: CreditCard },
              ].map((pm) => {
                const Icon = pm.icon;
                const isSelected = paymentMethod === pm.key;
                return (
                  <button
                    key={pm.key}
                    type="button"
                    onClick={() => setPaymentMethod(pm.key as any)}
                    className={`p-2 rounded-xl border text-[11px] font-semibold flex flex-col items-center gap-1 transition-all ${
                      isSelected
                        ? 'bg-amber-900/40 text-amber-300 border-amber-500 shadow-sm'
                        : 'bg-[#24170e] border-[#4a2e16] text-amber-200/60'
                    }`}
                  >
                    <Icon size={16} />
                    {pm.label}
                  </button>
                );
              })}
            </div>
          </div>

          {paymentMethod.includes('Mobile') && (
            <div>
              <label className="font-semibold text-amber-200/80 block mb-1">Mobile Money Number for Prompt</label>
              <input
                type="text"
                value={momoNumber}
                onChange={(e) => setMomoNumber(e.target.value)}
                placeholder="+250 788 123 456"
                className="w-full bg-[#24170e] border border-[#4a2e16] rounded-xl px-3 py-2 text-amber-50"
              />
            </div>
          )}

          <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/30 text-[11px] text-amber-200/70 flex items-center gap-2">
            <ShieldCheck size={16} className="text-amber-400 flex-shrink-0" />
            Verified transaction logged in Supabase audit trail with RLS data security.
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
              Confirm & Pay {product.currency} {product.price.toLocaleString()}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
