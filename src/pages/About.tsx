import React from "react";
import { motion } from "motion/react";
import { Star, Shield, Users, Heart } from "lucide-react";
import { HERITAGE_IMAGES } from "../constants";

export const About: React.FC = () => {
  return (
    <div className="bg-heritage-cream">
      {/* Hero */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        <img
          src={HERITAGE_IMAGES.STORY_HERO}
          className="absolute inset-0 w-full h-full object-cover"
          alt="Tamil Nadu Heritage Landscape"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.src =
              "https://images.unsplash.com/photo-1610030469668-8096333908f9?q=80&w=2600&auto=format&fit=crop";
          }}
        />
        <div className="absolute inset-0 bg-stone-900/35 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-heritage-cream via-transparent to-stone-900/20" />
        
        <div className="relative z-10 text-center text-white px-4">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-7xl md:text-9xl font-serif mb-6 italic drop-shadow-2xl"
          >
            Our Story
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="uppercase tracking-[0.6em] text-xs md:text-sm text-heritage-gold-light font-black drop-shadow-md"
          >
            A Legacy of Tamil Nadu Heritage
          </motion.p>
        </div>
      </section>

      {/* Story Content */}
      <section className="max-w-4xl mx-auto px-4 py-24 space-y-16">
        <div className="space-y-6 text-center">
          <h2 className="text-4xl font-serif text-stone-900 italic">
            The Threads of Time
          </h2>
          <div className="w-16 h-1 bg-heritage-gold mx-auto" />
          <p className="text-xl text-stone-600 font-light leading-relaxed first-letter:text-5xl first-letter:font-serif first-letter:float-left first-letter:mr-3 first-letter:text-heritage-gold italic">
            Jaigo Textiles began with a simple vision: to bring the authentic,
            hand-woven grace of Tamil Nadu's heritage sarees to women across the
            globe. Our roots are deeply embedded in the sacred temple town of
            Kanchipuram and the vibrant communities of Chettinad, where weaving
            is not just a profession, but a sacred art passed down through
            generations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl boutique-frame bg-stone-100">
            <img
              src={HERITAGE_IMAGES.STORY}
              alt="Master Artisan"
              className="w-full h-full object-cover opacity-90 scale-110"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.src =
                  "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop";
              }}
            />
          </div>
          <div className="space-y-8">
            <div className="space-y-2">
              <h3 className="text-2xl font-serif text-heritage-maroon italic font-bold">
                Artisanal Craftsmanship
              </h3>
              <p className="text-stone-600 font-light leading-relaxed italic">
                We work directly with master weavers who possess decades of
                expertise. Each saree is a masterpiece of patient craftsmanship,
                often taking weeks to complete by hand on traditional looms.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-serif text-heritage-maroon italic font-bold">
                Sustainable Roots
              </h3>
              <p className="text-stone-600 font-light leading-relaxed italic">
                By supporting handloom, we ensure sustainable livelihoods for
                our weaving clusters and promote eco-friendly production methods
                that respect the earth as much as our culture.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-white py-24 text-stone-600 border-t border-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto text-heritage-gold border border-stone-100">
                <Star size={32} />
              </div>
              <h4 className="text-xl font-serif text-heritage-maroon italic font-bold">Authenticity</h4>
              <p className="text-sm font-light leading-relaxed text-stone-500">
                100% genuine silk and cotton sourced from regional clusters.
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto text-heritage-gold border border-stone-100">
                <Shield size={32} />
              </div>
              <h4 className="text-xl font-serif text-heritage-maroon italic font-bold">Quality</h4>
              <p className="text-sm font-light leading-relaxed text-stone-500">
                Rigorous quality checks for every thread and zari weave.
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto text-heritage-gold border border-stone-100">
                <Users size={32} />
              </div>
              <h4 className="text-xl font-serif text-heritage-maroon italic font-bold">Community</h4>
              <p className="text-sm font-light leading-relaxed text-stone-500">
                Supporting livelihoods of over 500 weaving families.
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto text-heritage-gold border border-stone-100">
                <Heart size={32} />
              </div>
              <h4 className="text-xl font-serif text-heritage-maroon italic font-bold">Preservation</h4>
              <p className="text-sm font-light leading-relaxed text-stone-500">
                Keeping ancient temple motifs and patterns alive.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
