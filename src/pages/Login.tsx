import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, ShieldCheck, ArrowRight, LogIn, AlertCircle, Sparkles, Lock, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

export const Login: React.FC = () => {
  const { user, isAdmin, login, loginAsDemoUser, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Verification dialog state
  const [showBypassModal, setShowBypassModal] = useState(false);
  const [bypassEmail, setBypassEmail] = useState("");
  const [bypassPassword, setBypassPassword] = useState("");
  const [bypassModalError, setBypassModalError] = useState<string | null>(null);

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
        console.warn("Google Sign-In returned null, falling back to demo user of role: " + targetRole);
        await loginAsDemoUser(targetRole);
      }
    } catch (error: any) {
      console.warn("Google Sign-In failed, falling back to demo user of role: " + targetRole, error);
      try {
        await loginAsDemoUser(targetRole);
      } catch (fallbackError) {
        setErrorMessage(
          "Authentication failed. Please use the direct Demo Partner Bypass buttons below to log in."
        );
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDemoLogin = async (role: "admin" | "customer") => {
    setErrorMessage(null);
    if (role === "admin") {
      setBypassEmail("");
      setBypassPassword("");
      setBypassModalError(null);
      setShowBypassModal(true);
      return;
    }

    setIsLoggingIn(true);
    try {
      await loginAsDemoUser("customer");
    } catch (error: any) {
      console.error("Demo login failed", error);
      setErrorMessage("Demo login failed to initialize. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleVerifyAdminBypass = async (e: React.FormEvent) => {
    e.preventDefault();
    setBypassModalError(null);

    const emailInput = bypassEmail.trim().toLowerCase();
    if (!emailInput) {
      setBypassModalError("Please enter your registered administrative email.");
      return;
    }

    if (emailInput !== "venimurugesh@gmail.com" && emailInput !== "jaisoulcm@gmail.com") {
      setBypassModalError(
        "Access Denied: The email " + bypassEmail + " is not authorized for administrative access."
      );
      return;
    }

    if (bypassPassword !== "jaigo@321") {
      setBypassModalError("Access Denied: Incorrect administrative bypass password.");
      return;
    }

    setIsLoggingIn(true);
    try {
      await loginAsDemoUser("admin", emailInput);
      setShowBypassModal(false);
    } catch (error: any) {
      console.error("Bypass login error", error);
      setBypassModalError("An error occurred during verification. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };



  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-heritage-cream px-4 py-16">
      <div className="max-w-4xl w-full">


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

      {/* Admin Bypass Security Dialog */}
      <AnimatePresence>
        {showBypassModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBypassModal(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs"
            />

            {/* Content Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white rounded-3xl border border-stone-100 shadow-2xl p-8 max-w-md w-full z-10 text-stone-950"
            >
              <button
                onClick={() => setShowBypassModal(false)}
                className="absolute top-6 right-6 text-stone-400 hover:text-stone-700 transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 text-heritage-gold mb-4">
                <div className="p-3 bg-mineral-gold/10 rounded-2xl">
                  <Lock size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-serif italic text-stone-900 leading-snug">
                    Security Verification
                  </h3>
                  <span className="text-[9px] tracking-widest font-bold text-stone-500 uppercase">
                    Admin Bypass Check
                  </span>
                </div>
              </div>

              <p className="text-xs text-stone-600 mb-6 font-light leading-relaxed">
                To bypass standard Google Authentication and gain full administrative privileges, please confirm the authorized admin email address:
              </p>

              <form onSubmit={handleVerifyAdminBypass} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-stone-600 mb-2">
                    Administrative Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={bypassEmail}
                    onChange={(e) => setBypassEmail(e.target.value)}
                    placeholder="Enter admin email address"
                    className="w-full bg-stone-50 border border-stone-200 text-stone-900 px-4 py-3.5 rounded-xl text-sm focus:outline-hidden focus:border-heritage-gold transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-stone-600 mb-2">
                    Bypass Password
                  </label>
                  <input
                    type="password"
                    required
                    value={bypassPassword}
                    onChange={(e) => setBypassPassword(e.target.value)}
                    placeholder="Enter bypass password"
                    className="w-full bg-stone-50 border border-stone-200 text-stone-900 px-4 py-3.5 rounded-xl text-sm focus:outline-hidden focus:border-heritage-gold transition-all"
                  />
                </div>

                {bypassModalError && (
                  <div className="p-4 bg-red-50/50 border border-red-100 rounded-xl text-xs text-red-600 italic leading-relaxed flex gap-2">
                    <AlertCircle size={16} className="shrink-0 text-red-500" />
                    <span>{bypassModalError}</span>
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBypassModal(false)}
                    className="flex-1 border border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px] py-4 rounded-xl hover:bg-stone-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="flex-1 bg-stone-900 hover:bg-black text-white font-bold uppercase tracking-wider text-[10px] py-4 rounded-xl transition-all shadow-md"
                  >
                    {isLoggingIn ? "Verifying..." : "Verify & Access"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
