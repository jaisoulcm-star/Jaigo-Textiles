import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingCart, Eye, Heart, Share2, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Product } from "../types";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const isFavorite = isInWishlist(product.id);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsAdding(true);
    addToCart(product);
    setTimeout(() => setIsAdding(false), 2000);
  };

  const shareUrl = `${window.location.origin}/product/${product.id}`;
  const shareText = `Discover this exquisite ${product.name} at JAIGO Artisanal Textiles.`;

  const shareLinks = [
    {
      name: "WhatsApp",
      url: `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`,
      color: "hover:text-green-600",
    },
    {
      name: "Facebook",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      color: "hover:text-blue-600",
    },
    {
      name: "Twitter",
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
      color: "hover:text-sky-500",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group"
    >
      <Link to={`/product/${product.id}`} className="block space-y-6">
        <div className="relative aspect-[3/4] overflow-hidden boutique-frame transition-all duration-700 group-hover:p-1.5 bg-stone-100/50 border border-stone-200">
          <img
            src={
              product.imageUrls?.[0] ||
              "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop"
            }
            alt={product.name}
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop";
            }}
            className="w-full h-full object-cover transition-transform duration-1000 scale-100 group-hover:scale-110 opacity-90 group-hover:opacity-100"
          />
          <div className="absolute inset-0 silk-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

          {/* Quick Add Overlay */}
          <div className="absolute inset-x-0 bottom-0 p-6 translate-y-full group-hover:translate-y-0 transition-all duration-700 ease-out z-30">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleQuickAdd}
              disabled={isAdding}
              className={`w-full py-4 text-[10px] uppercase tracking-[0.4em] font-bold transition-all duration-500 shadow-xl backdrop-blur-md relative overflow-hidden flex items-center justify-center border border-stone-200 ${
                isAdding
                  ? "bg-white text-heritage-maroon"
                  : "bg-white/90 text-stone-900 hover:bg-stone-900 hover:text-white"
              }`}
            >
              <AnimatePresence mode="wait">
                {isAdding ? (
                  <motion.div
                    key="added"
                    initial={{ y: 20, opacity: 0, scale: 0.8 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Check size={14} className="text-heritage-gold" />
                    <span>Reserved</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="reserve"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                  >
                    Reserve Collection
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          {/* Action Buttons - Corner */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 flex flex-col gap-3">
            <button
              onClick={(e) => {
                e.preventDefault();
                toggleWishlist(product);
              }}
              className={`p-3 rounded-full backdrop-blur-md transition-all duration-300 ${
                isFavorite
                  ? "bg-heritage-gold text-white scale-110 shadow-lg"
                  : "bg-white/60 text-stone-600 hover:bg-white shadow-sm"
              }`}
            >
              <Heart
                size={18}
                fill={isFavorite ? "currentColor" : "none"}
                strokeWidth={1.5}
              />
            </button>

            <div className="relative">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setIsShareOpen(!isShareOpen);
                }}
                className={`p-3 rounded-full backdrop-blur-md transition-all duration-300 ${
                  isShareOpen
                    ? "bg-heritage-gold text-white shadow-lg"
                    : "bg-white/60 text-stone-600 hover:bg-white shadow-sm"
                }`}
              >
                <Share2 size={18} strokeWidth={1.5} />
              </button>

              <AnimatePresence>
                {isShareOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, x: 10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: 10 }}
                    className="absolute right-full mr-3 top-0 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-stone-100 p-1.5 flex flex-col gap-1 z-50 overflow-hidden"
                  >
                    {shareLinks.map((link) => (
                      <a
                        key={link.name}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`px-4 py-2 rounded-xl text-[8px] uppercase tracking-widest font-bold transition-colors whitespace-nowrap ${link.color} hover:bg-stone-50 flex items-center justify-center`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsShareOpen(false);
                        }}
                      >
                        {link.name}
                      </a>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {(product.isNew || product.isFeatured) && (
            <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
              {product.isNew && (
                <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-stone-950 bg-heritage-gold/90 px-2 py-1 backdrop-blur-sm">
                  Nouveau
                </span>
              )}
            </div>
          )}
        </div>

        <div className="space-y-1 text-center">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[9px] uppercase tracking-[0.5em] text-heritage-maroon font-bold">
              {product.category}
            </span>
            <h3 className="text-xl md:text-2xl font-serif text-stone-900 group-hover:text-heritage-maroon transition-colors tracking-tight">
              {product.name}
            </h3>
            {product.subtitle && (
              <p className="text-[8px] uppercase tracking-[0.4em] text-heritage-gold font-bold italic line-clamp-1">
                {product.subtitle}
              </p>
            )}
          </div>
          <p className="text-heritage-maroon font-serif italic text-lg transition-colors">
            ₹{product.price.toLocaleString("en-IN")}
          </p>
        </div>
      </Link>
    </motion.div>
  );
};
