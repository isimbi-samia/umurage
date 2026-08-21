import React, { useState } from 'react';
import { PlusCircle, X, Loader2, Image as ImageIcon, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { uploadMediaToStorage } from '@/lib/uploadMedia';
import { toast } from 'sonner';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DEFAULT_PRODUCT_IMAGES = [
  'https://images.unsplash.com/photo-1516307365426-bea591f05011?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1547153760-18fc86324498?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
];

export const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Craft');
  const [price, setPrice] = useState('15000');
  const [currency, setCurrency] = useState('RWF');
  const [stockCount, setStockCount] = useState('10');
  const [location, setLocation] = useState('Kigali');
  const [selectedImage, setSelectedImage] = useState(DEFAULT_PRODUCT_IMAGES[0]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to list a product.');
      return;
    }
    if (!title.trim() || !price || Number(price) <= 0) {
      toast.error('Please provide a valid product title and price.');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalImageUrl = selectedImage;
      if (imageFile) {
        const uploadRes = await uploadMediaToStorage(imageFile, 'image', user.id, 'products');
        finalImageUrl = uploadRes.url;
      }

      const { error } = await supabase.from('marketplace_products').insert({
        seller_id: user.id,
        title: title.trim(),
        name: title.trim(),
        description: description.trim(),
        category,
        price: Number(price),
        currency,
        stock_count: Number(stockCount) || 1,
        image_url: finalImageUrl,
        is_featured: true,
      });

      if (error) throw error;

      toast.success('Product listed successfully on Umurage Marketplace!');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Add product error:', err);
      toast.error(err.message || 'Failed to list product');
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
            <ShoppingBag size={20} className="text-amber-400" />
          </div>
          <div>
            <h2 className="font-cinzel text-xl text-amber-400 font-bold">List Made-in-Rwanda Product</h2>
            <p className="text-xs text-amber-200/60">Add authentic traditional crafts, Imigongo art, or books.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-amber-200/80 block mb-1">Product Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Handwoven Peace Basket (Agaseke)"
              className="w-full bg-[#24170e] border border-[#4a2e16] rounded-xl px-3 py-2 text-amber-50 placeholder:text-amber-200/40 focus:outline-none focus:border-amber-400/60"
            />
          </div>

          <div>
            <label className="font-semibold text-amber-200/80 block mb-1">Description & Cultural Context</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the cultural craftsmanship, symbols, materials used..."
              rows={3}
              className="w-full bg-[#24170e] border border-[#4a2e16] rounded-xl px-3 py-2 text-amber-50 placeholder:text-amber-200/40 focus:outline-none focus:border-amber-400/60 resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-amber-200/80 block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#24170e] border border-[#4a2e16] rounded-xl px-3 py-2 text-amber-50"
              >
                <option value="Craft">Agaseke Baskets</option>
                <option value="Imigongo">Imigongo Art</option>
                <option value="Attire">Cultural Attire</option>
                <option value="Music">Traditional Drums</option>
                <option value="Books">Heritage Books</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-amber-200/80 block mb-1">Price (RWF) *</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-[#24170e] border border-[#4a2e16] rounded-xl px-3 py-2 text-amber-50"
              />
            </div>
            <div>
              <label className="font-semibold text-amber-200/80 block mb-1">Stock Quantity</label>
              <input
                type="number"
                value={stockCount}
                onChange={(e) => setStockCount(e.target.value)}
                className="w-full bg-[#24170e] border border-[#4a2e16] rounded-xl px-3 py-2 text-amber-50"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-amber-200/80 block mb-1">Upload Product Image</label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer bg-[#24170e] border border-[#4a2e16] hover:border-amber-400/60 text-amber-300 px-3 py-2 rounded-xl flex items-center gap-1.5 font-semibold">
                <ImageIcon size={14} /> Choose File
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              {imageFile && <span className="text-[11px] text-green-400 truncate">Selected: {imageFile.name}</span>}
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
              disabled={isSubmitting}
              className="flex-1 btn-gold py-2.5 text-xs flex items-center justify-center gap-2 font-bold"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <PlusCircle size={14} />}
              Publish Listing
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
