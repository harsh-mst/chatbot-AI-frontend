import React from "react";
import { motion } from "framer-motion";
import "./ArticleCard.css";

export default function ArticleCard({ category, date, title, excerpt, authorInitials, authorName, readTime, imgSeed }) {
  return (
    <motion.article 
      className="article-card"
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="article-img">
        <img 
          src={`https://picsum.photos/seed/${imgSeed}/560/400`} 
          alt={title} 
          width="560" 
          height="400" 
          loading="lazy"
        />
        <div className="img-overlay" />
      </div>
      <div className="article-body">
        <div className="article-meta">
          <span className="article-category">{category}</span>
          <span className="article-date">{date}</span>
        </div>
        <h3>{title}</h3>
        <p>{excerpt}</p>
        <div className="article-author">
          <div className="author-avatar">{authorInitials}</div>
          <div className="author-info">
            <span className="author-name">{authorName}</span>
            <span className="read-time">{readTime}</span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
