import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Globe } from "lucide-react";
import "./Hero.css";

export default function Hero() {
  return (
    <section className="hero" aria-label="Featured article">
      <motion.div 
        className="hero-content"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="hero-badge">
          <Globe size={14} />
          <span>Featured this week</span>
        </div>
        <h1>Understanding <em>preventive care</em> in modern medicine</h1>
        <p className="hero-desc">How regular screenings, lifestyle adjustments, and early interventions are reshaping patient outcomes across every age group.</p>
        <div className="hero-cta">
          <motion.button 
            className="btn-primary"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Read article <ArrowRight size={18} />
          </motion.button>
          <motion.button 
            className="btn-ghost"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Browse topics
          </motion.button>
        </div>
      </motion.div>
      <motion.div 
        className="hero-image-wrap"
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2 }}
      >
        <img 
          src="https://picsum.photos/seed/medcare-hero/720/540" 
          alt="Doctor consulting patient" 
          width="720" 
          height="540" 
          loading="eager"
        />
        <div className="hero-image-overlay" />
      </motion.div>
    </section>
  );
}
