import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Sparkles, Bot, User, HelpCircle } from "lucide-react";
import { useChat } from "../hooks/useChat";
import "./ChatWidget.css";

function formatText(text, isStreaming) {
  const lines = text.split("\n");
  return lines.map((line, i) => (
    <p key={i}>
      {line}
      {isStreaming && i === lines.length - 1 && <span className="chat-cursor" />}
      {!line && i < lines.length - 1 && <br />}
    </p>
  ));
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const NLP_SUGGESTIONS = [
  "When is Dr. Sharma available?",
  "What are visiting hours?",
  "Is there parking available?",
];

const KIMI_SUGGESTIONS = [
  "What does a cardiologist do?",
  "What should I bring to my appointment?",
  "Explain the neurology department",
];

export default function ChatWidget() {
  const [open, setOpen]   = useState(false);
  const [input, setInput] = useState("");
  const [mode, setMode]   = useState("nlp"); 
  const { messages, isTyping, sendMessage, initGreeting, clearMessages } = useChat(mode);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    if (open && messages.length === 0) initGreeting();
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open, mode]); // Run on open or mode switch

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput("");
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleToggle = (newMode) => {
    if (newMode === mode) return;
    setMode(newMode);
  };

  const SUGGESTIONS = mode === "kimi" ? KIMI_SUGGESTIONS : NLP_SUGGESTIONS;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="chat-overlay"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            className="chat-window"
            initial={{ opacity: 0, y: 50, scale: 0.9, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            role="dialog"
            aria-label="MedCare Assistant"
            aria-modal="true"
          >
            <div className="chat-header">
              <div className="chat-header-info">
                <div className={`chat-avatar ${mode === "kimi" ? "avatar-kimi" : ""}`}>
                  {mode === "kimi" ? <Sparkles size={18} /> : <Bot size={18} />}
                </div>
                <div>
                  <div className="chat-name">MedCare Assistant</div>
                  <div className="chat-status">
                    <span className="status-dot"/>
                    {mode === "kimi" ? "Kimi K2 AI" : "Online"}
                  </div>
                </div>
              </div>
              <button
                className="chat-close"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
              >
                <X size={18} />
              </button>
            </div>

            <div className="engine-toggle" role="group" aria-label="Select assistant mode">
              <button
                className={`toggle-btn ${mode === "nlp" ? "active" : ""}`}
                onClick={() => handleToggle("nlp")}
                aria-pressed={mode === "nlp"}
              >
                <Bot size={14} />
                Chatbot
              </button>
              <button
                className={`toggle-btn ${mode === "kimi" ? "active" : ""}`}
                onClick={() => handleToggle("kimi")}
                aria-pressed={mode === "kimi"}
              >
                <Sparkles size={14} />
                Ask AI
              </button>
            </div>

            <div className="chat-messages" role="log" aria-live="polite">
              <AnimatePresence initial={false}>
                {messages.map(msg => (
                  <motion.div 
                    key={msg.id} 
                    className={`message ${msg.role}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {msg.role === "bot" && (
                      <div className={`msg-avatar ${msg.engine === "kimi" ? "avatar-kimi" : ""} ${(msg.streaming || !msg.text) ? "pulse" : ""}`}>
                        {msg.engine === "kimi" ? <Sparkles size={12} /> : <Bot size={12} />}
                      </div>
                    )}
                    <div className={`msg-bubble ${msg.streaming ? "streaming" : ""}`}>
                      {msg.role === "bot" && msg.engine && (
                        <div className={`engine-badge ${msg.engine === "kimi" ? "badge-kimi" : "badge-nlp"}`}>
                          {msg.engine === "kimi" ? "✨ Kimi K2" : "🤖 Chatbot"}
                        </div>
                      )}
                      <div className="msg-text">
                        {msg.text ? formatText(msg.text, msg.streaming) : (
                          <div className="thinking-dots">
                            <span /><span /><span />
                          </div>
                        )}
                      </div>
                      <div className="msg-meta">
                        <span className="msg-time">{formatTime(msg.time)}</span>
                        {msg.offline && (
                          <span className="offline-badge" title="Server offline — showing cached response">⚡ Offline</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isTyping && !messages.some(m => m.streaming) && (
                <motion.div 
                  className="message bot"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className={`msg-avatar ${mode === "kimi" ? "avatar-kimi" : ""}`}>
                    {mode === "kimi" ? "AI" : "MC"}
                  </div>
                  <div className="msg-bubble typing-indicator">
                    <span/><span/><span/>
                  </div>
                </motion.div>
              )}

              {messages.length === 1 && (
                <motion.div 
                  className="suggestions"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="suggestion-label"><HelpCircle size={12} /> Suggested questions</div>
                  {SUGGESTIONS.map(s => (
                    <motion.button
                      key={s}
                      className="suggestion-chip"
                      onClick={() => sendMessage(s)}
                      whileHover={{ x: 5, backgroundColor: "var(--color-primary-highlight)" }}
                    >
                      {s}
                    </motion.button>
                  ))}
                </motion.div>
              )}

              <div ref={bottomRef}/>
            </div>

            <div className="chat-input-area">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={
                  mode === "kimi"
                    ? "Ask Kimi anything about MedCare..."
                    : "Ask about doctors, timings..."
                }
                rows={1}
                aria-label="Chat input"
              />
              <motion.button
                className="send-btn"
                onClick={handleSend}
                disabled={!input.trim()}
                aria-label="Send message"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Send size={18} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        className={`chat-fab ${open ? "active" : ""}`}
        onClick={() => setOpen(o => !o)}
        aria-label={open ? "Close chat" : "Open chat assistant"}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {open ? <X size={24} /> : <MessageSquare size={24} />}
        {!open && <span className="fab-pulse"/>}
      </motion.button>
    </>
  );
}