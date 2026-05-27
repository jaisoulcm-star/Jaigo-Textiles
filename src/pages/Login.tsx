import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { User, ShieldCheck, ArrowRight, LogIn, AlertCircle, Sparkles } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

export const Login: React.FC = () => {
  const { user, isAdmin, login, loginAsDemoUser, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      const target = isAdmin && from === "/" ? "/admin" : from;
      navigate(target, { replace: true });
    }
  }, [user, loading, isAdmin, navigate, from]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-heritage-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const loginAndRedirect = async (targetRole: "admin" | "customer") => {
    setErrorMessage(null);
    setIsLoggingIn(true);
    try {
      const token = await login();
      if (!token) {
        setErrorMessage(
          "Popup closed or blocked by the browser. If you are inside a high-security sandbox/iframe preview, please use the direct 'Demo Partner Bypass' buttons below to preview standard customer and administrator features."
        );
      }
    } catch (error: any) {
      console.error("Login failed", error);
      setErrorMessage(
        "Popup closed or blocked by the browser. If you are inside a high-security sandbox/iframe preview, please use the direct 'Demo Partner Bypass' buttons below to preview standard customer and administrator features."
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDemoLogin = async (role: "admin" | "customer") => {
    setErrorMessage(null);
    setIsLoggingIn(true);
    try {
      await loginAsDemoUser(role);
    } catch (error: any) {
      console.error("Demo login failed", error);
      setErrorMessage("Demo login failed to initialize. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-heritage-cream px-4 py-16">
      <div className="max-w-4xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
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

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-5 rounded-2xl bg-amber-50 border border-amber-200 text-stone-800 text-sm flex gap-3 shadow-sm italic leading-relaxed"
          >
            <AlertCircle className="text-amber-600 flex-shrink-0" size={20} />
            <div>
              <p className="font-semibold text-stone-950 not-italic mb-1">Authentication Notice:</p>
              {errorMessage}
            </div>
          </motion.div>
        )}

        <div className="grid md:grid-cols-2 gap-8 h-full">
          {/* Customer Login Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="group relative bg-white p-10 rounded-3xl border border-stone-100 hover:border-heritage-gold transition-all duration-500 overflow-hidden shadow-xl flex flex-col justify-between"
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
                disabled={isLoggingIn}
                className="mt-auto w-full group/btn flex items-center justify-between bg-heritage-maroon text-white px-8 py-5 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-stone-900 transition-all hover:shadow-lg disabled:opacity-50"
              >
                <span>{isLoggingIn ? "Please Wait..." : "Continue with Google"}</span>
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
            className="group relative bg-[#fafaf9] p-10 rounded-3xl border border-stone-100 hover:border-heritage-gold/50 transition-all duration-500 overflow-hidden shadow-xl flex flex-col justify-between"
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
                disabled={isLoggingIn}
                className="mt-auto w-full group/btn flex items-center justify-between bg-stone-900 text-white hover:bg-black px-8 py-5 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all hover:shadow-lg disabled:opacity-50"
              >
                <span>{isLoggingIn ? "Please Wait..." : "Staff Google Login"}</span>
                <ArrowRight
                  size={18}
                  className="group-hover/btn:translate-x-1 transition-transform"
                />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Demo Partner Bypass Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 bg-white rounded-3xl border border-stone-200/60 p-8 shadow-md text-center max-w-2xl mx-auto"
        >
          <div className="flex items-center justify-center gap-2 text-heritage-gold mb-3">
            <Sparkles size={18} className="animate-pulse" />
            <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-stone-600">
              Demo Partner Bypass
            </span>
          </div>
          <p className="text-xs text-stone-500 italic mb-6">
            If Google authentication is blocked in this preview sandbox, use the bypass options below to instantly access administrative panel or standard customer views.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => handleDemoLogin("customer")}
              disabled={isLoggingIn}
              className="flex-1 bg-stone-50 hover:bg-heritage-maroon hover:text-white border border-stone-200 text-stone-700 font-bold uppercase tracking-wider text-[10px] py-4 px-6 rounded-xl transition-all hover:shadow-md"
            >
              🚀 Bypass as Customer
            </button>
            <button
              onClick={() => handleDemoLogin("admin")}
              disabled={isLoggingIn}
              className="flex-1 bg-mineral-gold/10 hover:bg-stone-900 hover:text-white border border-heritage-gold/30 text-heritage-gold font-bold uppercase tracking-wider text-[10px] py-4 px-6 rounded-xl transition-all hover:shadow-md"
            >
              👑 Bypass as Staff / Admin
            </button>
          </div>
        </motion.div>

        <p className="text-center mt-12 text-stone-400 text-[10px] uppercase tracking-widest font-bold">
          Secured by Jaigo Heritage Authentication Systems
        </p>
      </div>
    </div>
  );
};
