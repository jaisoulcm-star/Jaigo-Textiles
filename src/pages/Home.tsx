import React, { useRef, useState, useEffect } from "react";
import { motion } from "motion/react";
import { collection, query, getDocs, limit, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import {
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Star,
  MessageCircle,
  ChevronDown,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ProductCard } from "../components/ProductCard";
import { Product } from "../types";
import { HERITAGE_IMAGES } from "../constants";
import { DecorativeBorder } from "../components/DecorativeBorder";

export const Home: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Animation variants for "Distinctive Weaves" title letters
  const titleContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
        delayChildren: 0.2,
      },
    },
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [accessoryProducts, setAccessoryProducts] = useState<Product[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      setLoading(true);
      try {
        const isDemo = sessionStorage.getItem("jaigo_demo_user")
          ? JSON.parse(sessionStorage.getItem("jaigo_demo_user") || "{}")?.uid?.startsWith("demo-")
          : false;

        let allProducts: Product[] = [];
        if (isDemo) {
          const storedProducts = localStorage.getItem("jaigo_demo_products");
          if (storedProducts) {
            try { allProducts = JSON.parse(storedProducts); } catch {}
          }
        }

        if (allProducts.length === 0) {
          const q = query(
            collection(db, "products"),
            orderBy("createdAt", "desc"),
          );
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            allProducts = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as Product[];
            localStorage.setItem("jaigo_demo_products", JSON.stringify(allProducts));
          } else {
            const { MOCK_PRODUCTS } = await import("../constants");
            allProducts = JSON.parse(JSON.stringify(MOCK_PRODUCTS));
            localStorage.setItem("jaigo_demo_products", JSON.stringify(allProducts));
          }
        }

        const featured = allProducts.filter((p) => p.isFeatured).slice(0, 4);
        setFeaturedProducts(featured.length > 0 ? featured : allProducts.slice(0, 4));
        setAccessoryProducts(
          allProducts.filter((p) => p.category === "Accessories").slice(0, 3),
        );

        // Load recently viewed
        const { getRecentlyViewedIds } = await import("../utils/recentViews");
        const recentIds = getRecentlyViewedIds();
        if (recentIds.length > 0) {
          const matched = recentIds
            .map((id) => allProducts.find((p) => p.id === id))
            .filter((p): p is Product => !!p);
          setRecentProducts(matched);
        }
      } catch (error) {
        console.error("Error fetching home data:", error);
        // Fallback on error too
        try {
          let allProducts: Product[] = [];
          const storedProducts = localStorage.getItem("jaigo_demo_products");
          if (storedProducts) {
            try { allProducts = JSON.parse(storedProducts); } catch {}
          }
          if (allProducts.length === 0) {
            const { MOCK_PRODUCTS } = await import("../constants");
            allProducts = JSON.parse(JSON.stringify(MOCK_PRODUCTS));
            localStorage.setItem("jaigo_demo_products", JSON.stringify(allProducts));
          }
          
          const featured = allProducts.filter((p) => p.isFeatured).slice(0, 4);
          setFeaturedProducts(featured.length > 0 ? featured : allProducts.slice(0, 4));
          setAccessoryProducts(
            allProducts.filter((p) => p.category === "Accessories").slice(0, 3),
          );

          // Load recently viewed
          const { getRecentlyViewedIds } = await import("../utils/recentViews");
          const recentIds = getRecentlyViewedIds();
          if (recentIds.length > 0) {
            const matched = recentIds
              .map((id) => allProducts.find((p) => p.id === id))
              .filter((p): p is Product => !!p);
            setRecentProducts(matched);
          }
        } catch (e) {}
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo =
        direction === "left"
          ? scrollLeft - clientWidth * 0.8
          : scrollLeft + clientWidth * 0.8;

      scrollRef.current.scrollTo({
        left: scrollTo,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="space-y-32 pb-32">
      {/* Hero Section - Editorial Style */}
      <section className="relative h-screen flex flex-col justify-center items-center overflow-hidden">
        {/* Vertical Text - Left Sidebar Style */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center gap-12 z-20">
          <div className="h-24 w-px bg-stone-300/30" />
          <span className="text-[10px] uppercase tracking-[0.8em] text-stone-400 font-bold [writing-mode:vertical-lr] rotate-180">
            TAMIL NADU • HANDLOOM • TRADITION
          </span>
          <div className="h-24 w-px bg-stone-300/30" />
        </div>

        <motion.img
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 2 }}
          src={HERITAGE_IMAGES.HERO}
          alt="Tamil Nadu Saree Craftsmanship"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.src =
              "https://images.unsplash.com/photo-1610030469668-8096333908f9?q=80&w=2600&auto=format&fit=crop";
          }}
          className="absolute inset-0 z-0 w-full h-full object-cover"
        />
        {/* Subtle overlay to enhance text readability */}
        <div className="absolute inset-0 bg-stone-900/30 mix-blend-multiply z-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/50 via-transparent to-stone-950/10 z-0" />

        <div className="relative z-10 text-center px-4 max-w-7xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="flex flex-col items-center"
          >
            <span className="text-white uppercase tracking-[0.8em] text-[10px] md:text-[12px] font-black block mb-8 drop-shadow-sm">
              THE SOUL OF TAMIL NADU
            </span>
            <h1 className="text-[14vw] md:text-[11vw] font-serif font-black text-white leading-[0.85] tracking-tighter mb-12 flex flex-col items-center">
              <span className="block">LOOMED</span>
              <span className="text-heritage-gold italic block py-4 text-[13vw] md:text-[10vw]">HERITAGE</span>
              <span className="block">ETERNITY</span>
            </h1>

            <div className="flex flex-col items-center gap-8 mt-4">
              <p className="text-stone-200 font-bold max-w-lg text-[10px] md:text-xs uppercase tracking-[0.4em] leading-relaxed drop-shadow-md">
                FROM THE LOOMS OF KANCHIPURAM TO THE BREEZE OF MADURAI—DISCOVER
                SAREES THAT BREATHE HISTORY.
              </p>
              
              <Link
                to="/products"
                className="group relative inline-flex items-center gap-6 text-white uppercase tracking-[0.4em] text-[10px] font-black bg-heritage-maroon px-12 py-6 rounded-full overflow-hidden transition-all hover:bg-stone-900 shadow-2xl ring-1 ring-white/10"
              >
                <div className="absolute inset-0 silk-gradient opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <span className="relative z-10">Discover the Weaves</span>
                <ArrowRight
                  size={16}
                  className="relative z-10 group-hover:translate-x-2 transition-transform"
                />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Extra text at bottom of hero in image */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-7xl px-4 flex justify-between items-end z-20 pointer-events-none opacity-0 lg:opacity-100">
           {/* Left placeholder for symmetry if needed, or more text */}
           <div />
           <div className="text-stone-300 text-[10px] uppercase tracking-[0.5em] font-bold">
             Since 1982 • Authentic Weaves
           </div>
        </div>

        {/* Scroll Down Indicator - "That Icon" + "Down" */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex md:hidden flex-col items-center gap-2 cursor-pointer z-20 group"
          onClick={() =>
            window.scrollTo({ top: window.innerHeight, behavior: "smooth" })
          }
        >
          <span className="text-[9px] uppercase tracking-[0.5em] text-stone-400 mb-2 font-bold group-hover:text-heritage-gold transition-colors">
            Down
          </span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center"
          >
            <ChevronDown
              className="text-heritage-gold group-hover:scale-110 transition-transform"
              size={40}
              strokeWidth={1.5}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Decorative Divider */}
      <DecorativeBorder className="my-12" />

      {/* Narrative Section */}
      <section className="bg-heritage-cream py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-3 text-heritage-gold uppercase tracking-widest text-[10px] font-bold">
              <div className="w-12 h-px bg-heritage-gold" />
              A Timeless Art
            </div>
            <h2 className="text-5xl md:text-7xl font-serif zari-text leading-tight">
              Grace of the <br /> <span className="italic">Southern</span> Earth
            </h2>
            <p className="text-lg text-stone-600 font-light leading-relaxed max-w-md">
              Tamil Nadu’s sarees are not just garments; they are the
              architectural blueprints of our shrines, the vibrant colors of our
              festivals, and the gentle touch of our landscape.
            </p>
            <div className="pt-4">
              <Link
                to="/about"
                className="text-heritage-gold font-serif italic text-xl border-b border-heritage-gold pb-1 hover:text-heritage-maroon hover:border-heritage-maroon transition-colors"
              >
                Our Weaving Roots
              </Link>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="relative"
          >
            <div className="aspect-[4/5] rounded-t-[100px] rounded-b-[20px] overflow-hidden boutique-frame shadow-2xl">
              <img
                src={HERITAGE_IMAGES.STORY}
                alt="Traditional Saree Detail"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1600&auto=format&fit=crop";
                }}
                className="w-full h-full object-cover object-top scale-110 hover:scale-125 transition-transform duration-1000"
              />
            </div>
            {/* Abstract Element */}
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-heritage-gold/5 rounded-full border border-heritage-gold/10 -z-10" />
          </motion.div>
        </div>
      </section>

      {/* Types of Sarees Section - NEW */}
      <section className="bg-white py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 space-y-24">
          <div className="text-center space-y-4">
            <motion.span 
              initial={{ opacity: 0, letterSpacing: "0.2em" }}
              whileInView={{ opacity: 1, letterSpacing: "0.4em" }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="text-heritage-gold uppercase text-[10px] font-bold block"
            >
              Southern Classics
            </motion.span>
            
            <motion.h2 
              variants={titleContainerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-5xl md:text-7xl font-serif zari-text italic flex justify-center flex-wrap gap-x-4"
            >
              {"Distinctive Weaves".split(" ").map((word, wordIdx) => (
                <span key={wordIdx} className="inline-flex">
                  {word.split("").map((letter, letterIdx) => (
                    <motion.span
                      key={letterIdx}
                      variants={letterVariants}
                      className="inline-block"
                    >
                      {letter}
                    </motion.span>
                  ))}
                </span>
              ))}
            </motion.h2>

            <motion.div 
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
              className="h-[1px] w-28 bg-gradient-to-r from-transparent via-heritage-gold to-transparent mx-auto mt-6 origin-center"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
            {[
              {
                title: "Kanchipuram Silk",
                desc: 'The "Queen of Sarees," distinguished by its heavy silk and pure gold zari temple borders.',
                origin: "Temple City",
                image: HERITAGE_IMAGES.KANCHIPURAM_SILK,
              },
              {
                title: "Chettinad Cotton",
                desc: "Also known as Kandaangi, famous for its earthy checkered patterns and vibrant borders.",
                origin: "Karaikudi",
                image: HERITAGE_IMAGES.CHETTINAD_COTTON,
              },
              {
                title: "Madurai Sungudi",
                desc: "Lightweight hand-dyed sarees featuring exquisite tie-dye circular patterns.",
                origin: "Madurai",
                image: HERITAGE_IMAGES.MADURAI_SUNGUDI,
              },
              {
                title: "Coimbatore Silk",
                desc: "Soft silks that blend traditional weight with modern airy textures and floral aesthetics.",
                origin: "Kongu Nadu",
                image: HERITAGE_IMAGES.COIMBATORE_SILK,
              },
              {
                title: "Kerala Style",
                desc: "Simple and elegant off-white sarees with gold zari borders, perfect for traditional ceremonies.",
                origin: "God's Own Country",
                image: HERITAGE_IMAGES.KERALA_KASAVU,
              },
            ].map((type, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 50, scale: 0.98 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ 
                  duration: 0.8, 
                  delay: idx * 0.1,
                  ease: [0.16, 1, 0.3, 1] 
                }}
                whileHover={{ y: -8, scale: 1.01 }}
                className="group space-y-6 cursor-pointer"
              >
                <div className="aspect-[3/5] relative overflow-hidden rounded-t-[60px] rounded-b-[10px] boutique-frame bg-stone-100 shadow-sm group-hover:shadow-lg transition-all duration-500">
                  <img
                    src={type.image}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop";
                    }}
                    className="w-full h-full object-cover object-center scale-105 group-hover:scale-115 transition-transform duration-[1500ms] ease-out"
                    alt={type.title}
                  />
                  <div className="absolute inset-0 bg-stone-100/10 opacity-25 group-hover:opacity-0 transition-opacity duration-500" />
                  <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/40 via-black/10 to-transparent text-white translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-heritage-gold">
                      {type.origin}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-serif text-heritage-gold group-hover:text-heritage-maroon transition-colors duration-300">
                      {type.title}
                    </h3>
                    <div className="h-[1px] w-0 bg-heritage-maroon/40 group-hover:w-8 transition-all duration-500" />
                  </div>
                  <p className="text-sm text-stone-600 font-light leading-relaxed">
                    {type.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase Grid - Boutique Style */}
      <section className="bg-heritage-cream py-32 space-y-24">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col md:flex-row justify-between items-end gap-12 mb-12">
          <div className="space-y-6">
            <h3 className="text-6xl font-serif text-stone-950 leading-none">
              Season's <br />{" "}
              <span className="italic zari-text">Curations</span>
            </h3>
          </div>
          <p className="max-w-xs text-stone-600 font-light text-sm uppercase tracking-widest leading-relaxed text-right">
            Selected by our heritage experts for their exceptional weave density
            and zari purity.
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-4 lg:px-8 relative group/showcase">
          {/* Navigation Arrows - Visible on mobile, tablet and desktop */}
          <button
            onClick={() => scroll("left")}
            className="absolute left-2 lg:left-0 top-1/2 -translate-y-1/2 lg:-translate-x-1/2 z-20 w-10 h-10 md:w-14 md:h-14 rounded-full bg-white/95 shadow-xl border border-stone-200 flex items-center justify-center hover:bg-heritage-gold hover:text-white transition-all group pointer-events-auto opacity-100 lg:opacity-0 lg:group-hover/showcase:opacity-100"
            aria-label="Scroll left"
          >
            <ArrowLeft
              size={20}
              className="md:w-6 md:h-6 group-hover:-translate-x-1 transition-transform"
            />
          </button>

          <button
            onClick={() => scroll("right")}
            className="absolute right-2 lg:right-0 top-1/2 -translate-y-1/2 lg:translate-x-1/2 z-20 w-10 h-10 md:w-14 md:h-14 rounded-full bg-white/95 shadow-xl border border-stone-200 flex items-center justify-center hover:bg-heritage-gold hover:text-white transition-all group pointer-events-auto opacity-100 lg:opacity-0 lg:group-hover/showcase:opacity-100"
            aria-label="Scroll right"
          >
            <ArrowRight
              size={20}
              className="md:w-6 md:h-6 group-hover:translate-x-1 transition-transform"
            />
          </button>

          <div
            ref={scrollRef}
            className="overflow-x-auto pb-12 scrollbar-hide snap-x snap-mandatory touch-pan-x"
          >
            <div className="flex gap-12">
              {featuredProducts.map((product) => (
                <div
                  key={product.id}
                  className="min-w-[320px] md:min-w-[400px] snap-start"
                >
                  <ProductCard product={product} />
                </div>
              ))}
              {featuredProducts.length === 0 && !loading && (
                <p className="text-stone-400 italic py-10 w-full text-center">
                  More pieces arriving soon...
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* WhatsApp Community Section - "Between the website" */}
      <section className="py-24 bg-heritage-cream border-y border-stone-100">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3 text-[#25D366] uppercase tracking-widest text-[10px] font-bold">
                <div className="w-12 h-px bg-[#25D366]" />
                Join our community
              </div>
              <h2 className="text-4xl md:text-5xl font-serif text-stone-950">
                Loomed heritage, <br />{" "}
                <span className="italic">delivered</span> to your chat.
              </h2>
              <p className="text-stone-600 font-light max-w-sm">
                Get exclusive early access to our rarest silk drops and
                community-only weaving stories via WhatsApp.
              </p>
            </div>

            <a
              href="https://chat.whatsapp.com/Km6ogIZvAn6BkhVvCG6C93"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] text-white px-12 py-5 rounded-full inline-flex items-center gap-4 hover:bg-[#128C7E] transition-all shadow-xl shadow-green-500/20 font-bold uppercase tracking-widest text-xs"
            >
              <MessageCircle size={20} fill="currentColor" />
              Join WhatsApp Community
            </a>
          </div>
        </div>
      </section>

      {/* Finishing Touches - Accessories - NEW */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 text-center space-y-16">
          <div className="space-y-4">
            <span className="text-heritage-gold uppercase tracking-[0.4em] text-[10px] font-bold">
              The Curation
            </span>
            <h2 className="text-5xl font-serif zari-text italic leading-tight">
              Finishing Touches
            </h2>
            <p className="text-stone-600 font-light max-w-sm mx-auto">
              Handcrafted accessories to complete your heritage ensemble.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {accessoryProducts.map((p) => (
              <Link
                to={`/product/${p.id}`}
                key={p.id}
                className="group space-y-6"
              >
                <div className="aspect-square overflow-hidden boutique-frame bg-stone-100">
                  <img
                    src={p.imageUrls?.[0] || "https://images.unsplash.com/photo-1590156221122-c748e7892b07?auto=format&fit=crop&q=80&w=800"}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-all duration-1000 scale-100 group-hover:scale-110"
                    alt={p.name}
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1590156221122-c748e7892b07?auto=format&fit=crop&q=80&w=800";
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <h4 className="font-serif text-2xl group-hover:text-heritage-maroon transition-colors">
                    {p.name}
                  </h4>
                  <p className="text-[10px] uppercase tracking-widest text-heritage-gold font-bold">
                    Explore Piece
                  </p>
                </div>
              </Link>
            ))}
            {accessoryProducts.length === 0 && !loading && (
              <div className="col-span-full py-12 text-stone-500 italic">
                Exploring new craftsmanship...
              </div>
            )}
          </div>

          <div className="pt-8">
            <Link
              to="/products?cat=Accessories"
              className="bg-heritage-maroon text-white px-12 py-4 rounded-full inline-flex items-center gap-3 hover:bg-stone-900 transition-all shadow-xl font-bold uppercase tracking-widest text-xs"
            >
              View accessories collection
            </Link>
          </div>
        </div>
      </section>

      {/* Full Width Pattern Section */}
      <section className="relative py-48 bg-heritage-maroon overflow-hidden">
        <div className="saree-pattern absolute inset-0 opacity-20 scale-150 rotate-12" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10 space-y-12">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h4 className="text-heritage-gold uppercase tracking-[0.6em] text-[10px] font-bold">
              The Promise
            </h4>
            <h2 className="text-5xl md:text-6xl font-serif text-white italic leading-tight">
              "We don't sell sarees. We pass on a legacy."
            </h2>
            <p className="text-white/60 font-light mx-auto max-w-sm pt-8 text-sm uppercase tracking-[0.2em]">
              Verified Authenticity • Hand-crafted Livelihoods
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
