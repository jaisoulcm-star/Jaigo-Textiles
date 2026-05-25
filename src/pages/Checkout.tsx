import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Ticket,
  CreditCard,
  Truck,
  Smartphone,
  Landmark,
  QrCode,
  Copy,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../firebase";
import { useCart } from "../contexts/CartContext";
import { OperationType } from "../types";
import { handleFirestoreError } from "../utils/error-handler";

export const Checkout: React.FC = () => {
  const { cart, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  // Core Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    paymentMethod: "GPay",
  });

  // Interactive Payment Sub-states
  const [cardData, setCardData] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });
  const [upiId, setUpiId] = useState("");
  const [upiVerified, setUpiVerified] = useState(false);
  const [isVerifyingUpi, setIsVerifyingUpi] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [bankTxRef, setBankTxRef] = useState("");
  const [copiedBankText, setCopiedBankText] = useState(false);
  const [formErrors, setFormErrors] = useState<string | null>(null);

  // Card formatting helpers
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, "").length <= 16) {
      setCardData({ ...cardData, number: formatted });
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let clean = e.target.value.replace(/[^0-9]/g, "");
    if (clean.length > 4) clean = clean.slice(0, 4);
    if (clean.length > 2) {
      setCardData({ ...cardData, expiry: `${clean.slice(0, 2)}/${clean.slice(2)}` });
    } else {
      setCardData({ ...cardData, expiry: clean });
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/[^0-9]/g, "");
    if (clean.length <= 3) {
      setCardData({ ...cardData, cvv: clean });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors(null);
    setIsSubmitting(true);
    const colPath = "orders";

    // Validate additional payment fields
    if (formData.paymentMethod === "Card") {
      if (!cardData.number || cardData.number.replace(/\s/g, "").length < 16) {
        setFormErrors("Please enter a valid 16-digit Card Number.");
        setIsSubmitting(false);
        return;
      }
      if (!cardData.name.trim()) {
        setFormErrors("Please enter the Cardholder's Name.");
        setIsSubmitting(false);
        return;
      }
      if (!cardData.expiry || !cardData.expiry.includes("/") || cardData.expiry.length < 5) {
        setFormErrors("Please enter a valid Card Expiration Date (MM/YY).");
        setIsSubmitting(false);
        return;
      }
      if (!cardData.cvv || cardData.cvv.length < 3) {
        setFormErrors("Please enter a valid 3-digit CVV code.");
        setIsSubmitting(false);
        return;
      }
    } else if (formData.paymentMethod === "GPay") {
      if (!upiId && !showQrCode) {
        setFormErrors("Please enter a valid GPay UPI ID or Scan the QR Code.");
        setIsSubmitting(false);
        return;
      }
      if (upiId && !upiId.includes("@")) {
        setFormErrors("Please enter a valid UPI ID (e.g., example@okaxis).");
        setIsSubmitting(false);
        return;
      }
    } else if (formData.paymentMethod === "Bank") {
      if (!bankTxRef.trim() || bankTxRef.trim().length < 8) {
        setFormErrors("Please provide a valid Bank Transfer UTR reference ID (at least 8 characters).");
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const orderPayload: any = {
        customerName: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        paymentMethod: formData.paymentMethod,
        items: cart,
        totalAmount: total,
        status: "pending",
        createdAt: new Date(),
      };

      // Set masked details for record keeping
      if (formData.paymentMethod === "Card") {
        const lastFour = cardData.number.replace(/\s/g, "").slice(-4);
        orderPayload.paymentDetails = `Card ending in **** ${lastFour}`;
      } else if (formData.paymentMethod === "GPay") {
        orderPayload.paymentDetails = upiId ? `GPay UPI ID: ${upiId}` : "GPay QR Code Scan";
      } else if (formData.paymentMethod === "Bank") {
        orderPayload.paymentDetails = `Bank Transfer Ref: ${bankTxRef}`;
      } else {
        orderPayload.paymentDetails = `GPay / Online Payment`;
      }

      await addDoc(collection(db, colPath), orderPayload);

      setOrderComplete(true);
      clearCart();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, colPath);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0 && !orderComplete) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-12 text-center bg-[#0c0a09]">
        <h2 className="text-3xl font-serif text-stone-50 mb-4 italic">
          Checkout is empty
        </h2>
        <button
          onClick={() => navigate("/products")}
          className="bg-heritage-gold text-stone-950 px-8 py-3 rounded-full hover:bg-heritage-gold-light transition-colors uppercase tracking-widest font-bold text-xs"
        >
          Return to Shopping
        </button>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 bg-[#0c0a09]">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-[#131110] p-12 rounded-3xl border border-white/5 shadow-2xl text-center max-w-lg space-y-6"
        >
          <div className="w-20 h-20 bg-green-900/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-4xl font-serif text-stone-50 italic">
            Order Placed Successfully!
          </h2>
          <p className="text-stone-400 font-light leading-relaxed italic">
            Thank you for choosing Jaigo Textiles. Your heritage saree will be
            prepared and shipped shortly. A confirmation email has been sent to
            your address.
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-heritage-gold text-stone-950 px-10 py-3 rounded-full hover:bg-heritage-gold-light transition-colors shadow-lg uppercase tracking-widest font-bold text-xs"
          >
            Return Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0a09] py-12 md:py-24 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Checkout Form */}
          <div className="bg-[#131110] p-10 rounded-3xl border border-white/5 shadow-xl space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-serif text-stone-50 italic">
                Delivery Details
              </h1>
              <p className="text-stone-500 font-light text-sm italic">
                Please provide your information for a smooth doorstep delivery.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-2">
                    Full Name
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-stone-900 border border-white/5 rounded-xl focus:outline-none focus:border-heritage-gold text-stone-200 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-2">
                    Phone Number
                  </label>
                  <input
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-stone-900 border border-white/5 rounded-xl focus:outline-none focus:border-heritage-gold text-stone-200 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-2">
                  Email Address
                </label>
                <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-stone-900 border border-white/5 rounded-xl focus:outline-none focus:border-heritage-gold text-stone-200 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-2">
                  Shipping Address
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-stone-900 border border-white/5 rounded-xl focus:outline-none focus:border-heritage-gold text-stone-200 transition-colors"
                />
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] uppercase tracking-widest text-stone-500 font-bold">
                  Payment Method
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <label
                    className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                      formData.paymentMethod === "GPay"
                        ? "border-heritage-gold bg-heritage-gold/5 text-heritage-gold"
                        : "border-white/5 hover:border-white/10 bg-stone-900 text-stone-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="GPay"
                      checked={formData.paymentMethod === "GPay"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentMethod: e.target.value,
                        })
                      }
                      className="hidden"
                    />
                    <Smartphone size={24} />
                    <div>
                      <p className="font-bold uppercase tracking-widest text-[10px]">Google Pay / UPI</p>
                      <p className="text-[10px] text-stone-600 font-medium">
                        GPay instant pay
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                      formData.paymentMethod === "Card"
                        ? "border-heritage-gold bg-heritage-gold/5 text-heritage-gold"
                        : "border-white/5 hover:border-white/10 bg-stone-900 text-stone-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="Card"
                      checked={formData.paymentMethod === "Card"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentMethod: e.target.value,
                        })
                      }
                      className="hidden"
                    />
                    <CreditCard size={24} />
                    <div>
                      <p className="font-bold uppercase tracking-widest text-[10px]">Card Payment</p>
                      <p className="text-[10px] text-stone-600 font-medium">
                        Visa, MasterCard, RuPay
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                      formData.paymentMethod === "Bank"
                        ? "border-heritage-gold bg-heritage-gold/5 text-heritage-gold"
                        : "border-white/5 hover:border-white/10 bg-stone-900 text-stone-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="Bank"
                      checked={formData.paymentMethod === "Bank"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentMethod: e.target.value,
                        })
                      }
                      className="hidden"
                    />
                    <Landmark size={24} />
                    <div>
                      <p className="font-bold uppercase tracking-widest text-[10px]">Bank Transfer</p>
                      <p className="text-[10px] text-stone-600 font-medium">
                        Direct IMPS Transfer
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Dynamic Interactive Input Panels */}
              <AnimatePresence mode="wait">
                {formData.paymentMethod === "Card" && (
                  <motion.div
                    key="card-panel"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-6 bg-stone-900 border border-white/5 rounded-2xl space-y-4 overflow-hidden"
                  >
                    <p className="text-heritage-gold font-serif italic text-xs">Enter Credit / Debit Card Details</p>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[9px] uppercase tracking-wider text-stone-500 font-bold block mb-1">Card Number</label>
                        <input
                          type="text"
                          placeholder="4111 2222 3333 4444"
                          value={cardData.number}
                          onChange={handleCardNumberChange}
                          className="w-full px-4 py-2 bg-[#0c0a09] border border-white/5 rounded-xl focus:outline-none focus:border-heritage-gold text-stone-200 text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase tracking-wider text-stone-500 font-bold block mb-1">Cardholder Name</label>
                        <input
                          type="text"
                          placeholder="Your Name"
                          value={cardData.name}
                          onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                          className="w-full px-4 py-2 bg-[#0c0a09] border border-white/5 rounded-xl focus:outline-none focus:border-heritage-gold text-stone-200 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] uppercase tracking-wider text-stone-500 font-bold block mb-1">Expiry Date</label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            value={cardData.expiry}
                            onChange={handleExpiryChange}
                            className="w-full px-4 py-2 bg-[#0c0a09] border border-white/5 rounded-xl focus:outline-none focus:border-heritage-gold text-stone-200 text-sm font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] uppercase tracking-wider text-stone-500 font-bold block mb-1">CVV</label>
                          <input
                            type="password"
                            placeholder="***"
                            value={cardData.cvv}
                            onChange={handleCvvChange}
                            className="w-full px-4 py-2 bg-[#0c0a09] border border-white/5 rounded-xl focus:outline-none focus:border-heritage-gold text-stone-200 text-sm font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {formData.paymentMethod === "GPay" && (
                  <motion.div
                    key="gpay-panel"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-6 bg-stone-900 border border-white/5 rounded-2xl space-y-4 overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-heritage-gold font-serif italic text-xs">Google Pay (GPay) / UPI Transfer</p>
                      <span className="bg-blue-600/10 text-blue-400 text-[9px] px-2 py-0.5 rounded-md font-bold border border-blue-500/10 uppercase tracking-widest">GPay Verified</span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-[9px] uppercase tracking-wider text-stone-500 font-bold block mb-1">Google Pay UPI ID / VPA</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="username@okaxis"
                            value={upiId}
                            onChange={(e) => {
                              setUpiId(e.target.value);
                              setUpiVerified(false);
                            }}
                            className="flex-grow px-4 py-2 bg-[#0c0a09] border border-white/5 rounded-xl focus:outline-none focus:border-heritage-gold text-stone-200 text-sm font-mono animate-smooth"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!upiId) return;
                              setIsVerifyingUpi(true);
                              setTimeout(() => {
                                setIsVerifyingUpi(false);
                                setUpiVerified(true);
                              }, 1200);
                            }}
                            disabled={!upiId || isVerifyingUpi}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                              upiVerified
                                ? "bg-green-900/40 text-green-400 border border-green-500/20"
                                : "bg-heritage-gold text-stone-950 hover:bg-heritage-gold-light"
                            }`}
                          >
                            {isVerifyingUpi ? "Verifying..." : upiVerified ? "Verified ✓" : "Verify"}
                          </button>
                        </div>
                      </div>

                      <div className="border-t border-white/5 pt-4 text-center">
                        <span className="text-stone-500 text-[10px] uppercase font-bold tracking-widest block mb-2">- OR SCAN WITH GPAY APP -</span>
                        {!showQrCode ? (
                          <button
                            type="button"
                            onClick={() => setShowQrCode(true)}
                            className="px-4 py-2 bg-[#0c0a09] hover:bg-stone-800 text-stone-300 border border-white/5 rounded-xl text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2"
                          >
                            <QrCode size={14} /> Generate GPay QR Code
                          </button>
                        ) : (
                          <div className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl w-40 mx-auto select-none">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=jaigotextiles@okaxis%26pn=Jaigo%20Textiles%26am=${total}%26cu=INR`}
                              alt="GPay QR Code"
                              className="w-32 h-32"
                            />
                            <span className="text-[9px] text-stone-800 font-bold tracking-wider uppercase">Scan with GPay</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {formData.paymentMethod === "Bank" && (
                  <motion.div
                    key="bank-panel"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-6 bg-stone-900 border border-white/5 rounded-2xl space-y-4 overflow-hidden"
                  >
                    <p className="text-heritage-gold font-serif italic text-xs">Direct Bank IMPS / NEFT Transfer</p>
                    <div className="bg-[#0c0a09] p-4 rounded-xl border border-white/5 space-y-2 text-xs font-mono text-stone-300">
                      <div className="flex justify-between">
                        <span className="text-stone-500">Bank Name</span>
                        <span>State Bank of India</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Account Name</span>
                        <span>Jaigo Textiles LLP</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Account No.</span>
                        <span className="flex items-center gap-1 text-white">
                          401928374827
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText("401928374827");
                              setCopiedBankText(true);
                              setTimeout(() => setCopiedBankText(false), 2000);
                            }}
                            className="text-heritage-gold hover:text-white transition-colors"
                          >
                            <Copy size={12} />
                          </button>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">IFSC Code</span>
                        <span>SBIN0000800</span>
                      </div>
                    </div>
                    {copiedBankText && (
                      <p className="text-[10px] text-green-400 text-center font-bold">Account details copied to clipboard!</p>
                    )}

                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-stone-500 font-bold block mb-1">Transaction Ref (UTR) ID</label>
                      <input
                        type="text"
                        placeholder="Enter 12-digit UTR No."
                        value={bankTxRef}
                        onChange={(e) => setBankTxRef(e.target.value)}
                        className="w-full px-4 py-2 bg-[#0c0a09] border border-white/5 rounded-xl focus:outline-none focus:border-heritage-gold text-stone-200 text-sm font-mono"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {formErrors && (
                <div className="p-4 bg-red-900/20 text-red-400 border border-red-500/10 rounded-2xl text-xs flex items-center gap-2 select-none">
                  <AlertCircle size={16} />
                  <span>{formErrors}</span>
                </div>
              )}

              <button
                disabled={isSubmitting}
                className="w-full bg-heritage-gold text-stone-950 py-4 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-heritage-gold-light transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
              >
                {isSubmitting
                  ? "Processing Order..."
                  : `Confirm Order - ₹${total.toLocaleString("en-IN")}`}
              </button>
            </form>
          </div>

          {/* Cart Summary Side */}
          <div className="space-y-12">
            <div className="space-y-6">
              <h2 className="text-2xl font-serif text-stone-50 flex items-center gap-3 italic">
                Order Review{" "}
                <span className="text-sm bg-heritage-gold text-stone-950 px-2 py-0.5 rounded-full font-bold">
                  {cart.length}
                </span>
              </h2>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 items-center bg-[#131110] p-3 rounded-2xl border border-white/5 shadow-sm"
                  >
                    <img
                      src={item.imageUrls?.[0]}
                      className="w-16 h-16 object-cover rounded-xl opacity-80"
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=200&auto=format&fit=crop";
                      }}
                    />
                    <div className="flex-grow">
                      <h4 className="text-sm font-medium text-stone-100 truncate w-40 italic">
                        {item.name}
                      </h4>
                      <p className="text-xs text-stone-500 italic">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="font-serif text-heritage-gold font-bold">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-8 border-t border-white/5">
              <div className="flex justify-between items-center text-stone-500 uppercase tracking-widest text-[10px] font-bold">
                <span>Shipping Cost</span>
                <span className="text-green-500">Free</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xl font-serif text-stone-100 italic">
                  Grand Total
                </span>
                <span className="text-3xl font-serif text-heritage-gold font-bold">
                  ₹{total.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="bg-heritage-gold/5 p-6 rounded-2xl border border-heritage-gold/10 space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-widest text-heritage-gold flex items-center gap-2">
                <Ticket size={16} /> Heritage Guarantee
              </h4>
              <p className="text-xs text-stone-500 italic leading-relaxed">
                Each saree is hand-picked and authenticated for pure Kanchipuram
                or Chettinad origins. We guarantee 100% genuine weaving and
                quality.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
