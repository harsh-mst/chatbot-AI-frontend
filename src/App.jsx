import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./hooks/useTheme";
import Header from "./components/Header";
import Hero from "./components/Hero";
import ArticleCard from "./components/ArticleCard";
import Sidebar from "./components/Sidebar";
import ChatWidget from "./components/ChatWidget";
import AgentDashboard from "./components/AgentDashboard";
import "./App.css";

const ARTICLES = [
  {
    category: "Cardiology", date: "Apr 25, 2026", imgSeed: "heart-health", readTime: "6 min read",
    title: "Heart health at 40: what every adult should know",
    excerpt: "Cardiovascular risk doesn't wait until retirement. We break down the key biomarkers, lifestyle factors, and screening timelines that make a decisive difference.",
    authorInitials: "PS", authorName: "Dr. Priya Sharma",
  },
  {
    category: "Pediatrics", date: "Apr 22, 2026", imgSeed: "children-health", readTime: "8 min read",
    title: "Vaccination schedules: a parent's complete guide for 2026",
    excerpt: "With updated immunization guidelines from WHO and national health bodies, this overview covers every shot from birth through adolescence.",
    authorInitials: "AM", authorName: "Dr. Anjali Mehta",
  },
  {
    category: "Neurology", date: "Apr 18, 2026", imgSeed: "neuro-brain", readTime: "5 min read",
    title: "Migraine vs. headache: how to tell the difference",
    excerpt: "Millions misidentify migraines as ordinary headaches, delaying effective treatment. Dr. Vikram Patel explains the clinical distinctions and treatment paths.",
    authorInitials: "VP", authorName: "Dr. Vikram Patel",
  },
  {
    category: "Nutrition", date: "Apr 14, 2026", imgSeed: "nutrition-food", readTime: "7 min read",
    title: "The role of gut microbiome in immune function",
    excerpt: "Emerging research continues to reveal the profound influence the gut flora has on immunity, mood, and long-term disease prevention.",
    authorInitials: "SV", authorName: "Dr. Sunita Verma",
  },
];

const TOPICS = ["Cardiology", "Pediatrics", "Nutrition", "Mental Health", "Orthopedics", "Dermatology", "Neurology", "Women's Health"];

function MainPage({ theme, toggle }) {
  return (
    <div className="app">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Header theme={theme} onToggleTheme={toggle} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Hero />

        <div className="topic-strip">
          <div className="strip-inner">
            <span className="strip-label">Topics</span>
            {TOPICS.map((t, i) => (
              <motion.button
                key={t}
                className="strip-tag"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                {t}
              </motion.button>
            ))}
          </div>
        </div>

        <main className="main-layout" id="main-content">
          <section>
            <div className="section-heading">
              <h2>Latest Articles</h2>
              <a href="/">View all →</a>
            </div>
            <div className="articles-grid">
              <AnimatePresence>
                {ARTICLES.map((a, i) => (
                  <motion.div
                    key={a.title}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <ArticleCard {...a} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
          <Sidebar />
        </main>

        <section className="quote-banner" aria-label="Inspirational quote">
          <motion.blockquote
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            "The greatest medicine of all is to teach people how not to need it."
          </motion.blockquote>
          <cite>— Hippocrates</cite>
        </section>

        <footer className="site-footer">
          <div className="footer-inner">
            <span className="footer-brand">MedCare</span>
            <nav className="footer-links" aria-label="Footer links">
              <a href="/">Privacy</a><a href="/">Terms</a><a href="/">Contact</a>
            </nav>
            <span className="footer-copy">© 2026 MedCare General Hospital</span>
          </div>
        </footer>
      </motion.div>
    </div>
  );
}

function AppContent() {
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const isAgentPage = location.pathname === "/agent";

  return (
    <>
      <Routes>
        <Route path="/" element={<MainPage theme={theme} toggle={toggle} />} />
        <Route path="/agent" element={<AgentDashboard />} />
      </Routes>
      {!isAgentPage && <ChatWidget />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
