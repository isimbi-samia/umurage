import React, { useState } from 'react';
import { Heart, Loader2, Star, Store, PlusCircle, Search, ShoppingBag } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { SellerOnboardingModal } from '@/components/features/SellerOnboardingModal';
import { AddProductModal } from '@/components/features/AddProductModal';
import { CheckoutModal } from '@/components/features/CheckoutModal';
import { MarketplaceProduct } from '@/types';

const CATEGORIES = ['All', 'Craft', 'Imigongo', 'Attire', 'Music', 'Books'];

export const Marketplace: React.FC = () => {
  const { t } = useLanguage();
  const { isAuthenticated, user, openAuth } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());

  // Modals
  const [isSellerModalOpen, setIsSellerModalOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [selectedProductForBuy, setSelectedProductForBuy] = useState<MarketplaceProduct | null>(null);

  // Check if current user is an approved seller
  const { data: sellerProfile, refetch: refetchSeller } = useQuery({
    queryKey: ['seller-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('Error fetching seller profile:', error);
      }
      return data;
    },
    enabled: !!user?.id,
  });

  // Query marketplace products
  const { data: products = [], isLoading, isError, refetch: refetchProducts } = useQuery({
    queryKey: ['marketplace-products', selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from('marketplace_products')
        .select(`
          id,
          title,
          name,
          description,
          price,
          currency,
          category,
          image_url,
          is_featured,
          stock_count,
          rating,
          review_count,
          seller_id,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (selectedCategory !== 'All') {
        query = query.ilike('category', selectedCategory);
      }

      const { data, error } = await query;
      if (error && error.code !== 'PGRST116') {
        console.warn('Error fetching marketplace products:', error);
      }

      const rawItems = data || [];
      const sellerIds = [...new Set(rawItems.map((p: any) => p.seller_id).filter(Boolean))];
      const sellerMap = new Map<string, any>();

      if (sellerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('public_profiles')
          .select('id, username, avatar_url, verified')
          .in('id', sellerIds);
        (profiles || []).forEach((pr: any) => sellerMap.set(pr.id, pr));
      }

      const mapped = rawItems.map((p: any) => ({
        id: p.id,
        title: p.title || p.name || 'Made-in-Rwanda Product',
        name: p.title || p.name || 'Made-in-Rwanda Product',
        description: p.description || '',
        price: p.price ?? 12000,
        currency: p.currency || 'RWF',
        category: p.category || 'Craft',
        image_url: p.image_url || 'https://images.unsplash.com/photo-1516307365426-bea591f05011?w=400&h=300&fit=crop',
        is_featured: p.is_featured ?? true,
        rating: p.rating ?? 4.9,
        review_count: p.review_count ?? 12,
        seller_id: p.seller_id,
        seller: sellerMap.get(p.seller_id) || { username: 'Artisan Creator' },
      }));

      return mapped as MarketplaceProduct[];
    },
    staleTime: 30000,
  });

  const toggleWishlist = (id: string) => {
    if (!isAuthenticated) { openAuth('login'); return; }
    setWishlist(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const formatPrice = (value: number, currency: string) => {
    if (!Number.isFinite(value)) return `${currency} 0`;
    return `${currency} ${value.toLocaleString()}`;
  };

  const handleBuyClick = (product: MarketplaceProduct) => {
    if (!isAuthenticated) {
      openAuth('login');
      return;
    }
    setSelectedProductForBuy(product);
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-cinzel text-3xl text-umurage-gold font-bold mb-2">{t('marketplace.title')}</h1>
          <p className="text-umurage-muted text-base">
            Authentic Made-in-Rwanda marketplace — support verified cultural artisans, Imigongo painters, and traditional weavers.
          </p>
        </div>

        <div className="flex gap-2">
          {sellerProfile ? (
            <button
              onClick={() => setIsAddProductOpen(true)}
              className="btn-gold text-xs px-4 py-2.5 flex items-center gap-1.5 font-bold shadow-md"
            >
              <PlusCircle size={16} /> List Product
            </button>
          ) : (
            <button
              onClick={() => isAuthenticated ? setIsSellerModalOpen(true) : openAuth('login')}
              className="btn-outline-gold text-xs px-4 py-2.5 flex items-center gap-1.5 font-bold"
            >
              <Store size={16} /> Become a Seller
            </button>
          )}
        </div>
      </div>

      {/* Category & Search Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-umurage-subtle" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Agaseke baskets, Imigongo art, traditional attire..."
            className="w-full bg-umurage-card border border-umurage-border rounded-xl pl-11 pr-4 py-3 text-sm text-umurage-cream placeholder-umurage-subtle focus:outline-none focus:border-umurage-gold/50"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                selectedCategory === cat
                  ? 'bg-umurage-gold text-umurage-bg border-umurage-gold font-bold shadow-sm'
                  : 'bg-umurage-card border-umurage-border text-umurage-muted hover:border-umurage-gold/40 hover:text-umurage-cream'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-umurage-muted">
          <Loader2 size={24} className="mr-3 animate-spin text-umurage-gold" />
          Loading Made-in-Rwanda listings…
        </div>
      ) : isError ? (
        <div className="umurage-card rounded-2xl p-8 text-center text-umurage-muted border border-umurage-border">
          Marketplace listings are temporarily unavailable. Please try again shortly.
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="umurage-card rounded-2xl p-12 text-center border border-dashed border-umurage-border">
          <ShoppingBag size={40} className="text-umurage-gold/30 mx-auto mb-3" />
          <h3 className="text-umurage-cream font-semibold text-lg mb-1">No products found</h3>
          <p className="text-umurage-muted text-sm mb-4">No listings match category "{selectedCategory}" with query "{search}".</p>
          {sellerProfile && (
            <button onClick={() => setIsAddProductOpen(true)} className="btn-gold text-xs px-5 py-2.5">
              Add First Listing
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product) => (
            <div key={product.id} className="umurage-card rounded-2xl overflow-hidden group cursor-pointer border border-umurage-border flex flex-col justify-between">
              <div>
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={product.image_url}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.is_featured && (
                    <span className="absolute top-3 left-3 bg-umurage-gold text-umurage-bg text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm">
                      Made-in-Rwanda
                    </span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-umurage-bg/70 flex items-center justify-center hover:bg-umurage-bg transition-colors"
                  >
                    <Heart size={14} className={wishlist.has(product.id) ? 'text-red-400 fill-current' : 'text-umurage-muted'} />
                  </button>
                </div>

                <div className="p-4">
                  <span className="text-umurage-subtle text-[10px] font-semibold uppercase tracking-wider">{product.category}</span>
                  <h3 className="text-umurage-cream font-semibold text-sm leading-snug mt-1 mb-1 group-hover:text-umurage-gold transition-colors line-clamp-1">
                    {product.title}
                  </h3>
                  <p className="text-umurage-muted text-xs line-clamp-2 mb-3 leading-relaxed">{product.description}</p>
                  <p className="text-umurage-subtle text-[11px] mb-3">Artisan: {product.seller?.username || 'Verified Rwandan Seller'}</p>
                </div>
              </div>

              <div className="p-4 pt-0 flex items-center justify-between border-t border-umurage-border/40 mt-auto">
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={10} className={i < Math.floor(product.rating || 5) ? 'text-umurage-gold fill-current' : 'text-umurage-border'} />
                    ))}
                    <span className="text-umurage-subtle text-[10px] ml-0.5">({product.review_count})</span>
                  </div>
                  <p className="text-umurage-gold font-bold text-base">{formatPrice(product.price, product.currency)}</p>
                </div>
                <button
                  onClick={() => handleBuyClick(product)}
                  className="btn-gold text-xs py-2 px-4 font-bold shadow-md"
                >
                  Buy Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Seller Registration Modal */}
      <SellerOnboardingModal
        isOpen={isSellerModalOpen}
        onClose={() => setIsSellerModalOpen(false)}
        onSuccess={() => refetchSeller()}
      />

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onSuccess={() => refetchProducts()}
      />

      {/* Checkout Modal */}
      {selectedProductForBuy && (
        <CheckoutModal
          isOpen={!!selectedProductForBuy}
          onClose={() => setSelectedProductForBuy(null)}
          product={selectedProductForBuy}
          onSuccess={() => refetchProducts()}
        />
      )}
    </div>
  );
};

export default Marketplace;
