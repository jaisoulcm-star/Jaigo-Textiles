import React, { useEffect } from "react";
import { motion } from "motion/react";
import { User, ShieldCheck, ArrowRight, LogIn } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

export const Login: React.FC = () => {
  const { user, login, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";

  useEffect(() => {
    if (user && !loading) {
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, from]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-heritage-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const loginAndRedirect = async (targetRole: "admin" | "customer") => {
    try {
      await login();
      // The useEffect will handle the generic redirect, but we can also handle it here
      // if we want specific landing pages based on what card they clicked
      if (targetRole === "admin") {
        // If they chose admin, we'll try to go to admin if they are indeed admin
        // Note: isAdmin state update might be slightly delayed, so the useEffect is usually better
        // but we can pass a hint through navigate if needed
      }
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-heritage-cream px-4 py-20">
      <div className="max-w-4xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <span className="text-[10px] uppercase tracking-[0.5em] text-heritage-gold font-bold">
            Authentication
          </span>
          <h1 className="text-4xl md:text-5xl font-serif mt-4 text-stone-900 italic">
            Welcome to JAIGO
          </h1>
          <p className="text-stone-600 mt-4 font-light italic">
            Join our artisanal heritage and explore the finest textiles.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 h-full">
          {/* Customer Login Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="group relative bg-white p-10 rounded-3xl border border-stone-100 hover:border-heritage-gold transition-all duration-500 overflow-hidden shadow-xl"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-heritage-gold/5 rounded-bl-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform" />

            <div className="relative z-10 flex flex-col h-full">
              <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center mb-8 text-heritage-gold">
                <User size={32} strokeWidth={1.5} />
              </div>

              <h2 className="text-2xl font-serif text-stone-900 mb-4 italic">
                Customer Login
              </h2>
              <p className="text-stone-600 text-sm font-light mb-10 leading-relaxed italic">
                Access your orders, track shipments, and manage your artisanal
                wishlist. Enjoy personalized recommendations and early previews.
              </p>

              <button
                onClick={() => loginAndRedirect("customer")}
                className="mt-auto w-full group/btn flex items-center justify-between bg-heritage-maroon text-white px-8 py-5 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-stone-900 transition-all"
              >
                <span>Continue as Customer</span>
                <LogIn
                  size={18}
                  className="group-hover/btn:translate-x-1 transition-transform"
                />
              </button>
            </div>
          </motion.div>

          {/* Admin Login Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="group relative bg-[#fafaf9] p-10 rounded-3xl border border-stone-100 hover:border-heritage-gold/50 transition-all duration-500 overflow-hidden shadow-xl"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-heritage-gold/5 rounded-bl-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform" />

            <div className="relative z-10 flex flex-col h-full text-stone-900">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 text-heritage-gold border border-stone-100">
                <ShieldCheck size={32} strokeWidth={1.5} />
              </div>

              <h2 className="text-2xl font-serif mb-4 italic">Admin Portal</h2>
              <p className="text-stone-600 text-sm font-light mb-10 leading-relaxed italic">
                Management gateway for artisans. Update inventory, manage
                collections, and oversee order fulfillment across the heritage
                network.
              </p>

              <button
                onClick={() => loginAndRedirect("admin")}
                className="mt-auto w-full group/btn flex items-center justify-between bg-stone-900 text-white hover:bg-black px-8 py-5 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all"
              >
                <span>Staff Login</span>
                <ArrowRight
                  size={18}
                  className="group-hover/btn:translate-x-1 transition-transform"
                />
              </button>
            </div>
          </motion.div>
        </div>

        <p className="text-center mt-12 text-stone-400 text-[10px] uppercase tracking-widest font-bold">
          Secured by Jaigo Heritage Authentication Systems
        </p>
      </div>
    </div>
  );
};
