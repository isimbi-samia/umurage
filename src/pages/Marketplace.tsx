import React from 'react';
import { ShoppingBag, Heart, Star, Tag } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

const PRODUCTS = [
  { id: 1, name: 'Authentic Imigongo Wall Art', creator: 'Imigongo Masters', price: 'RWF 45,000', category: 'Art', rating: 4.9, reviews: 34, image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=250&fit=crop', badge: 'Bestseller' },
  { id: 2, name: 'Traditional Agaseke Basket', creator: 'Women Weavers Coop', price: 'RWF 28,000', category: 'Crafts', rating: 5.0, reviews: 67, image: 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=300&h=250&fit=crop', badge: 'Top Rated' },
  { id: 3, name: 'Rwanda Cultural History Book', creator: 'RCHA Press', price: 'RWF 15,000', category: 'Books', rating: 4.8, reviews: 89, image: 'https://images.unsplash.com/photo-1516307365426-bea591f05011?w=300&h=250&fit=crop', badge: null },
  { id: 4, name: 'Intore Dancer Performance Booking', creator: 'Massamba Cultural Group', price: 'RWF 250,000', category: 'Performances', rating: 4.9, reviews: 21, image: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=300&h=250&fit=crop', badge: 'Premium' },
  { id: 5, name: 'Traditional Umushanana Fabric', creator: 'Kigali Textiles', price: 'RWF 35,000', category: 'Clothing', rating: 4.7, reviews: 45, image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=300&h=250&fit=crop', badge: null },
  { id: 6, name: 'Rwandan Cultural Music Album', creator: 'Traditional Sounds RW', price: 'RWF 8,000', category: 'Music', rating: 4.6, reviews: 112, image: 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=300&h=250&fit=crop', badge: null },
];

const Marketplace: React.FC = () => {
  const { t } = useLanguage();
  const { isAuthenticated, openAuth } = useAuth();
  const [wishlist, setWishlist] = React.useState<Set<number>>(new Set());

  const toggleWishlist = (id: number) => {
    if (!isAuthenticated) { openAuth('login'); return; }
    setWishlist(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="font-cinzel text-3xl text-umurage-gold font-bold mb-2">{t('marketplace.title')}</h1>
        <p className="text-umurage-muted text-base">Support Rwandan cultural creators — authentic crafts, art, books, and performances.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {PRODUCTS.map(product => (
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
                  <p className="text-umurage-gold font-bold text-base">{product.price}</p>
                </div>
                <button
                  onClick={() => !isAuthenticated && openAuth('login')}
                  className="btn-gold text-xs py-2 px-4"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Marketplace;
