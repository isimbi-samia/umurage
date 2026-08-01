import React from 'react';
import { Heart, Loader2, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const Marketplace: React.FC = () => {
  const { t } = useLanguage();
  const { isAuthenticated, openAuth } = useAuth();
  const [wishlist, setWishlist] = React.useState<Set<string>>(new Set());

  const { data: products = [], isLoading, isError } = useQuery({
    queryKey: ['marketplace-products'],
    queryFn: async () => {
      const { data, error } = await supabase
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
          seller:user_profiles!marketplace_products_seller_fkey(id, username, avatar_url, verified),
          created_at,
          rating,
          review_count,
          stock_count
        `)
        .order('created_at', { ascending: false })
        .limit(12);
      if (error) throw error;
      return (data || []).map((product: any) => ({
        id: product.id,
        name: product.title || product.name || 'Untitled product',
        description: product.description || '',
        price: product.price ?? 0,
        currency: product.currency || 'RWF',
        category: product.category || 'Craft',
        image: product.image_url || 'https://images.unsplash.com/photo-1516307365426-bea591f05011?w=300&h=250&fit=crop',
        badge: product.is_featured ? 'Featured' : null,
        rating: product.rating ?? 4.8,
        reviews: product.review_count ?? 0,
        creator: product.seller?.username || 'Umurage Creator',
        seller: product.seller || null,
      }));
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

  const formatPrice = (value: number, currency: string) => {
    if (!Number.isFinite(value)) return `${currency} 0`;
    return `${currency} ${value.toLocaleString()}`;
  };

  const handleBuy = () => {
    if (!isAuthenticated) { openAuth('login'); return; }
    toast.success('Checkout is ready. Please contact the seller to complete your order.');
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="font-cinzel text-3xl text-umurage-gold font-bold mb-2">{t('marketplace.title')}</h1>
        <p className="text-umurage-muted text-base">Support Rwandan cultural creators — authentic crafts, art, books, and performances.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-umurage-muted">
          <Loader2 size={20} className="mr-2 animate-spin" />
          Loading marketplace listings…
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-umurage-border bg-umurage-card/70 p-8 text-center text-umurage-muted">
          Marketplace listings are temporarily unavailable. Please try again shortly.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((product: any) => (
            <div key={product.id} className="umurage-card rounded-2xl overflow-hidden group cursor-pointer">
              <div className="relative h-44 overflow-hidden">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                {product.badge && (
                  <span className="absolute top-3 left-3 bg-umurage-gold text-umurage-bg text-[10px] font-bold px-2 py-1 rounded-lg">{product.badge}</span>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-umurage-bg/70 flex items-center justify-center hover:bg-umurage-bg transition-colors"
                >
                  <Heart size={14} className={wishlist.has(product.id) ? 'text-red-400 fill-current' : 'text-umurage-muted'} />
                </button>
                <div className="absolute bottom-0 inset-x-0 h-12 bg-dark-gradient" />
              </div>
              <div className="p-4">
                <span className="text-umurage-subtle text-[10px] font-semibold uppercase tracking-wider">{product.category}</span>
                <h3 className="text-umurage-cream font-semibold text-sm leading-snug mt-1 mb-1 group-hover:text-umurage-gold transition-colors">{product.name}</h3>
                <p className="text-umurage-muted text-xs mb-3">By {product.creator}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1 mb-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={10} className={i < Math.floor(product.rating) ? 'text-umurage-gold fill-current' : 'text-umurage-border'} />
                      ))}
                      <span className="text-umurage-subtle text-[10px] ml-0.5">({product.reviews})</span>
                    </div>
                    <p className="text-umurage-gold font-bold text-base">{formatPrice(product.price, product.currency)}</p>
                  </div>
                  <button
                    onClick={handleBuy}
                    className="btn-gold text-xs py-2 px-4"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Marketplace;
