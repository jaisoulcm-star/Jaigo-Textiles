import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Ticket, CreditCard, Truck } from "lucide-react";
import { motion } from "motion/react";
import { db } from "../firebase";
import { useCart } from "../contexts/CartContext";
import { OperationType } from "../types";
import { handleFirestoreError } from "../utils/error-handler";

export const Checkout: React.FC = () => {
  const { cart, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    paymentMethod: "COD",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const colPath = "orders";

    try {
      await addDoc(collection(db, colPath), {
        customerName: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        paymentMethod: formData.paymentMethod,
        items: cart,
        totalAmount: total,
        status: "pending",
        createdAt: new Date(),
      });

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label
                    className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                      formData.paymentMethod === "COD"
                        ? "border-heritage-gold bg-heritage-gold/5 text-heritage-gold"
                        : "border-white/5 hover:border-white/10 bg-stone-900 text-stone-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="COD"
                      checked={formData.paymentMethod === "COD"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentMethod: e.target.value,
                        })
                      }
                      className="hidden"
                    />
                    <Truck size={24} />
                    <div>
                      <p className="font-bold uppercase tracking-widest text-[10px]">Cash on Delivery</p>
                      <p className="text-[10px] text-stone-600 font-medium">
                        Pay when you receive
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
                      <p className="font-bold uppercase tracking-widest text-[10px]">Online Payment</p>
                      <p className="text-[10px] text-stone-600 font-medium">
                        UPI, Card, Net Banking
                      </p>
                    </div>
                  </label>
                </div>
              </div>

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
