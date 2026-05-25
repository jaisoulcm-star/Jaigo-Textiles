import React from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  ShoppingCart,
  User,
  Menu,
  X,
  Phone,
  Mail,
  Instagram,
  Facebook,
  Heart,
  MessageCircle,
  Home,
  Compass,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";
import { useAuth } from "../contexts/AuthContext";

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(true);
  const [lastScrollY, setLastScrollY] = React.useState(0);
  const { cart } = useCart();

  React.useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== "undefined") {
        if (window.scrollY > lastScrollY && window.scrollY > 100) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
        setLastScrollY(window.scrollY);
      }
    };

    window.addEventListener("scroll", controlNavbar);
    return () => window.removeEventListener("scroll", controlNavbar);
  }, [lastScrollY]);
  const { wishlist } = useWishlist();
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const navLinks = [
    { name: "Collection", path: "/products" },
    { name: "The Heritage", path: "/about" },
    { name: "Connect", path: "/contact" },
  ];

  if (isAdmin) {
    navLinks.push({ name: "Admin", path: "/admin" });
  }

  return (
    <>
      <motion.header
        initial={{ y: 0 }}
        animate={{ y: isVisible ? 0 : -100 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="sticky top-0 z-50 glass-nav"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 md:grid md:grid-cols-3">
            {/* Logo Left for Mobile / Discovery for Desktop */}
            <div className="flex items-center">
              <Link
                to="/"
                className="flex flex-col group md:hidden scale-90 origin-left"
              >
                <span className="text-2xl font-serif font-black text-heritage-maroon tracking-[0.1em] group-hover:zari-text transition-all duration-300 italic">
                  JAIGO
                </span>
                <span className="text-[8px] uppercase tracking-[0.2em] text-heritage-maroon -mt-1 font-semibold whitespace-nowrap">
                  Artisanal Textiles
                </span>
              </Link>
              <div className="hidden md:flex items-center text-stone-500">
                <Link
                  to="/products"
                  className="text-[10px] uppercase tracking-[0.4em] hover:text-heritage-maroon transition-colors font-black"
                >
                  Discovery
                </Link>
              </div>
            </div>

            <Link
              to="/"
              className="hidden md:flex flex-col items-center group justify-center"
            >
              <span className="text-4xl font-serif font-black text-heritage-maroon group-hover:text-heritage-maroon/80 transition-all duration-300 tracking-[0.2em] italic leading-none">
                JAIGO
              </span>
              <span className="text-[9px] uppercase tracking-[0.6em] text-heritage-gold font-bold whitespace-nowrap mt-1">
                Artisanal Textiles
              </span>
            </Link>

            {/* Icons Right */}
            <div className="flex items-center justify-end space-x-2 sm:space-x-4">
              {user && (
                <div className="hidden sm:flex items-center gap-2 mr-2 px-3 py-1 bg-stone-50 rounded-full border border-stone-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-stone-500">
                    {isAdmin ? "Admin" : "Artisan"}
                  </span>
                </div>
              )}
              <button
                onClick={() => {
                  if (!user) {
                    navigate("/login");
                  } else {
                    if (window.confirm("Do you want to logout?")) {
                      logout();
                    }
                  }
                }}
                className={`p-2 rounded-full transition-all ${user ? "bg-heritage-maroon/5 text-heritage-maroon" : "text-stone-500 hover:text-heritage-maroon"}`}
                title={
                  user
                    ? `Logged in as ${user.displayName || user.email}. Click to Logout`
                    : "Login"
                }
              >
                <User size={20} strokeWidth={1.5} />
              </button>
              <Link
                to="/cart"
                className="relative p-2 sm:p-2 text-stone-500 hover:text-heritage-maroon transition-colors pr-0"
              >
                <ShoppingCart size={20} strokeWidth={1.5} />
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    className="absolute top-0 right-[-4px] bg-heritage-maroon text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-sm"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </Link>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 pr-0 text-stone-500 hover:text-heritage-maroon transition-colors"
              >
                {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        <div className="hidden md:block py-4">
          <div className="max-w-7xl mx-auto px-4">
            <nav className="flex justify-center space-x-12">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-[10px] font-bold uppercase tracking-[0.4em] transition-all relative group ${
                    location.pathname === link.path
                      ? "text-heritage-maroon"
                      : "text-stone-500 hover:text-heritage-maroon"
                  }`}
                >
                  <span className={location.pathname === link.path ? "bg-heritage-gold/20 px-2 py-0.5 rounded" : ""}>
                    {link.name}
                  </span>
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-heritage-cream border-t border-heritage-gold/10 overflow-hidden"
            >
              <div className="px-4 py-6 space-y-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`block text-lg font-serif transition-colors italic ${
                      location.pathname === link.path
                        ? "text-heritage-gold underline decoration-heritage-maroon/20"
                        : "text-stone-600 hover:text-heritage-gold"
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="pt-4 mt-4 border-t border-heritage-gold/10 space-y-4">
                  <Link
                    to="/wishlist"
                    onClick={() => setIsMenuOpen(false)}
                    className="block text-lg font-serif text-stone-600 hover:text-heritage-gold flex items-center gap-2 italic"
                  >
                    Wishlist{" "}
                    {wishlist.length > 0 && (
                      <span className="bg-heritage-gold text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {wishlist.length}
                      </span>
                    )}
                  </Link>

                  {!user ? (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigate("/login");
                      }}
                      className="w-full flex items-center justify-between group bg-stone-900 text-white px-6 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px]"
                    >
                      <span>Sign In</span>
                      <User size={18} />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        if (
                          window.confirm("Are you sure you want to sign out?")
                        ) {
                          logout();
                        }
                      }}
                      className="w-full flex items-center justify-between group bg-red-50 text-red-600 px-6 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] border border-red-100"
                    >
                      <span>Logout ({user.displayName || "Artisan"})</span>
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* PERSISTENT MOBILE BOTTOM NAV - NOT A DOCK */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-stone-200 z-[40]">
        <div className="grid grid-cols-4 h-16">
          <Link
            to="/"
            className={`flex flex-col items-center justify-center space-y-1 ${location.pathname === "/" ? "text-heritage-gold" : "text-stone-400"}`}
          >
            <motion.div whileTap={{ scale: 0.9 }}>
              <Home size={20} strokeWidth={1.5} />
            </motion.div>
            <span className="text-[8px] font-bold uppercase tracking-tight">
              Home
            </span>
          </Link>
          <Link
            to="/products"
            className={`flex flex-col items-center justify-center space-y-1 ${location.pathname.startsWith("/product") ? "text-heritage-gold" : "text-stone-600"}`}
          >
            <motion.div whileTap={{ scale: 0.9 }}>
              <Compass size={20} strokeWidth={1.5} />
            </motion.div>
            <span className="text-[8px] font-bold uppercase tracking-tight">
              Shop
            </span>
          </Link>
          <Link
            to="/wishlist"
            className={`flex flex-col items-center justify-center space-y-1 ${location.pathname === "/wishlist" ? "text-heritage-gold" : "text-stone-600"}`}
          >
            <motion.div whileTap={{ scale: 0.9 }}>
              <Heart size={20} strokeWidth={1.5} />
            </motion.div>
            <span className="text-[8px] font-bold uppercase tracking-tight">
              Saved
            </span>
          </Link>
          <Link
            to="/cart"
            className={`flex flex-col items-center justify-center space-y-1 ${location.pathname === "/cart" ? "text-heritage-gold" : "text-stone-600"} relative`}
          >
            <motion.div whileTap={{ scale: 0.9 }}>
              <ShoppingCart size={20} strokeWidth={1.5} />
            </motion.div>
            {cartCount > 0 && (
              <span className="absolute top-3 right-5 bg-heritage-gold text-stone-950 text-[7px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold font-sans">
                {cartCount}
              </span>
            )}
            <span className="text-[8px] font-bold uppercase tracking-tight">
              Cart
            </span>
          </Link>
        </div>
      </div>
    </>
  );
};

  export const Footer: React.FC = () => {
  return (
    <footer className="bg-heritage-maroon text-stone-300 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex flex-col mb-6">
              <span className="text-3xl font-serif font-black text-heritage-cream tracking-wider italic">
                JAIGO
              </span>
              <span className="text-xs uppercase tracking-[0.3em] text-heritage-gold -mt-1 font-semibold">
                Textiles
              </span>
            </Link>
            <p className="max-w-md text-stone-400 leading-relaxed font-light italic">
              Celebrating the heritage of Tamil Nadu sarees since generations.
              Our mission is to preserve the artisanal craftsmanship of
              Kanchipuram and Chettinad weaving traditions.
            </p>
          </div>
          <div>
            <h4 className="text-heritage-gold uppercase tracking-widest text-sm font-bold mb-6">
              Explore
            </h4>
            <ul className="space-y-4 text-sm font-light italic">
              <li>
                <Link
                  to="/products?cat=Silk"
                  className="hover:text-heritage-gold transition-colors"
                >
                  Silk Sarees
                </Link>
              </li>
              <li>
                <Link
                  to="/products?cat=Cotton"
                  className="hover:text-heritage-gold transition-colors"
                >
                  Cotton Sarees
                </Link>
              </li>
              <li>
                <Link
                  to="/products?cat=Madurai"
                  className="hover:text-heritage-gold transition-colors"
                >
                  Madurai Collection
                </Link>
              </li>
              <li>
                <Link
                  to="/products?cat=Kerala"
                  className="hover:text-heritage-gold transition-colors"
                >
                  Kerala Collection
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="hover:text-heritage-gold transition-colors"
                >
                  Our Story
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-heritage-gold uppercase tracking-widest text-sm font-bold mb-6">
              Contact
            </h4>
            <div className="space-y-4 text-sm font-light italic">
              <p className="flex items-center gap-3">
                <Phone size={16} /> +91 9944763671
              </p>
              <p className="flex items-center gap-3">
                <Mail size={16} /> jaigogroups@gmail.com
              </p>
              <div className="flex gap-4 pt-4">
                <a
                  href="#"
                  className="hover:text-heritage-gold transition-colors"
                >
                  <Instagram size={20} />
                </a>
                <a
                  href="#"
                  className="hover:text-heritage-gold transition-colors"
                >
                  <Facebook size={20} />
                </a>
                <a
                  href="https://chat.whatsapp.com/Km6ogIZvAn6BkhVvCG6C93"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-heritage-gold transition-colors"
                >
                  <MessageCircle size={20} />
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-stone-500 font-light uppercase tracking-widest">
          <p>
            © 2026 Jaigo Textiles |{" "}
            <a
              href="https://jaigotextiles.in"
              className="hover:text-heritage-gold transition-colors"
            >
              jaigotextiles.in
            </a>
            . All rights reserved.
          </p>
          <p className="mt-4 md:mt-0 italic">Designed with tradition & elegance</p>
        </div>
      </div>
    </footer>

  );
};
