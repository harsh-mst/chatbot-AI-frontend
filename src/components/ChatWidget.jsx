import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, X, Send, Sparkles, Bot, User,
  HelpCircle, UserCheck, Loader2, PhoneCall,
} from "lucide-react";
import { useChat } from "../hooks/useChat";
import { useSocket } from "../hooks/useSocket";
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
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("nlp");

  const {
    messages,
    isTyping,
    sendMessage,
    initGreeting,
    clearMessages,
    // Agent state
    chatMode,
    agentName,
    showAgentButton,
    queuePosition,
    isWaitingForAgent,
    requestAgent,
    endAgentSession,
    currentSessionId,
    handleAgentJoined,
    handleAgentMessage,
    handleAgentDisconnected,
  } = useChat(mode);

  // Wire up socket events
  const { emitUserMessage, emitUserEnd } = useSocket(currentSessionId, {
    onAgentJoined: handleAgentJoined,
    onAgentMessage: handleAgentMessage,
    onAgentDisconnected: handleAgentDisconnected,
  });

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && messages.length === 0) initGreeting();
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open, mode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim(), { emitUserMessage });
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

  // ── Header display
  const isAgentMode = chatMode === "agent";
  const headerTitle = isAgentMode ? `${agentName || "Live Agent"}` : "MedCare Assistant";
  const headerSubtitle = isAgentMode ? "Live Support" : (mode === "kimi" ? "Kimi K2 AI" : "Online");

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
            {/* ── Header */}
            <div className={`chat-header ${isAgentMode ? "header-agent" : ""}`}>
              <div className="chat-header-info">
                <div className={`chat-avatar ${mode === "kimi" && !isAgentMode ? "avatar-kimi" : ""} ${isAgentMode ? "avatar-agent" : ""}`}>
                  {isAgentMode
                    ? <UserCheck size={18} />
                    : mode === "kimi"
                      ? <Sparkles size={18} />
                      : <Bot size={18} />
                  }
                </div>
                <div>
                  <div className="chat-name">{headerTitle}</div>
                  <div className="chat-status">
                    <span className={`status-dot ${isAgentMode ? "dot-agent" : ""}`} />
                    {headerSubtitle}
                  </div>
                </div>
              </div>
              <div className="header-actions">
                {isAgentMode && (
                  <button
                    className="end-session-btn-user"
                    onClick={() => endAgentSession(emitUserEnd)}
                    title="End live chat"
                  >
                    End Chat
                  </button>
                )}
                <button
                  className="chat-close"
                  onClick={() => setOpen(false)}
                  aria-label="Close chat"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* ── Engine toggle (hidden when agent is live) */}
            {!isAgentMode && (
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
            )}

            {/* ── Messages */}
            <div className="chat-messages" role="log" aria-live="polite">
              <AnimatePresence initial={false}>
                {messages.map(msg => {
                  // System messages (agent join/leave)
                  if (msg.role === "system") {
                    return (
                      <motion.div
                        key={msg.id}
                        className="system-message"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        {msg.text}
                      </motion.div>
                    );
                  }

                  return (
                    <motion.div
                      key={msg.id}
                      className={`message ${msg.role}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {msg.role === "bot" && (
                        <div className={`msg-avatar
                          ${msg.engine === "kimi" ? "avatar-kimi" : ""}
                          ${msg.engine === "agent" ? "avatar-agent" : ""}
                          ${(msg.streaming || !msg.text) ? "pulse" : ""}
                        `}>
                          {msg.engine === "kimi"
                            ? <Sparkles size={12} />
                            : msg.engine === "agent"
                              ? <UserCheck size={12} />
                              : <Bot size={12} />
                          }
                        </div>
                      )}
                      <div className={`msg-bubble ${msg.streaming ? "streaming" : ""}`}>
                        {msg.role === "bot" && msg.engine && (
                          <div className={`engine-badge ${msg.engine === "kimi" ? "badge-kimi" : msg.engine === "agent" ? "badge-agent" : "badge-nlp"}`}>
                            {msg.engine === "kimi"
                              ? "✨ Kimi K2"
                              : msg.engine === "agent"
                                ? `👤 ${agentName || "Agent"}`
                                : "🤖 Chatbot"
                            }
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
                  );
                })}
              </AnimatePresence>

              {/* Typing indicator */}
              {isTyping && !messages.some(m => m.streaming) && (
                <motion.div
                  className="message bot"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className={`msg-avatar ${mode === "kimi" ? "avatar-kimi" : ""}`}>
                    {mode === "kimi" ? <Sparkles size={12} /> : <Bot size={12} />}
                  </div>
                  <div className="msg-bubble typing-indicator">
                    <span /><span /><span />
                  </div>
                </motion.div>
              )}

              {/* Suggestions */}
              {messages.length === 1 && !isAgentMode && (
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
                      onClick={() => sendMessage(s, { emitUserMessage })}
                      whileHover={{ x: 5, backgroundColor: "var(--color-primary-highlight)" }}
                    >
                      {s}
                    </motion.button>
                  ))}
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* ── Agent Nudge Banner */}
            <AnimatePresence>
              {showAgentButton && !isAgentMode && !isWaitingForAgent && (
                <motion.div
                  className="agent-nudge"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <PhoneCall size={15} />
                  <span>Need more help? Connect to an agent.</span>
                  <button
                    className="nudge-btn"
                    onClick={() => requestAgent(currentSessionId)}
                    id="connect-agent-btn"
                  >
                    Connect
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Queue Overlay */}
            <AnimatePresence>
              {isWaitingForAgent && (
                <motion.div
                  className="queue-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="queue-card">
                    <div className="queue-spinner">
                      <Loader2 size={28} className="spin" />
                    </div>
                    <div className="queue-title">Connecting to Live Agent</div>
                    {queuePosition != null && (
                      <div className="queue-position">
                        Position in queue: <strong>#{queuePosition}</strong>
                      </div>
                    )}
                    <div className="queue-subtitle">Please hold — an agent will join shortly</div>
                    <button
                      className="queue-cancel"
                      onClick={() => endAgentSession(emitUserEnd)}
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Input */}
            <div className="chat-input-area">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={
                  isAgentMode
                    ? `Message ${agentName || "agent"}…`
                    : mode === "kimi"
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

      {/* ── FAB */}
      <motion.button
        className={`chat-fab ${open ? "active" : ""} ${isAgentMode ? "fab-agent" : ""}`}
        onClick={() => setOpen(o => !o)}
        aria-label={open ? "Close chat" : "Open chat assistant"}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {open ? <X size={24} /> : isAgentMode ? <UserCheck size={24} /> : <MessageSquare size={24} />}
        {!open && <span className={`fab-pulse ${isAgentMode ? "pulse-agent" : ""}`} />}
      </motion.button>
    </>
  );
}