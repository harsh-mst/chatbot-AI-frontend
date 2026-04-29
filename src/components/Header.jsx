import React from "react";
import { motion } from "framer-motion";
import { Sun, Moon, Plus } from "lucide-react";
import "./Header.css";

export default function Header({ theme, onToggleTheme }) {
  return (
    <motion.header 
      className="site-header"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
      <div className="header-inner">
        <motion.a 
          href="/" 
          className="logo" 
          aria-label="MedCare Home"
          whileHover={{ scale: 1.05 }}
        >
          <div className="logo-icon">
            <Plus size={20} />
          </div>
          <span>MedCare</span>
        </motion.a>
        
        <nav className="nav-links" aria-label="Main navigation">
          {["Articles", "Doctors", "Departments", "About"].map((item, i) => (
            <motion.a 
              key={item} 
              href="/"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              whileHover={{ color: "var(--color-primary)" }}
            >
              {item}
            </motion.a>
          ))}
        </nav>

        <div className="header-actions">
          <motion.button 
            className="btn-theme" 
            onClick={onToggleTheme} 
            aria-label="Toggle theme"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </motion.button>
          <motion.button 
            className="btn-subscribe"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Subscribe
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}
