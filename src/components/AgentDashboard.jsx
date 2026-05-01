import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, MessageSquare, UserCheck, Clock, RefreshCw,
  Send, LogOut, Wifi, WifiOff, ChevronRight, X,
} from "lucide-react";
import { useSocket } from "../hooks/useSocket";
import "./AgentDashboard.css";

const AGENT_KEY = "agent-secret-key"; // matches backend .env AGENT_SECRET_KEY
const AGENT_ID = "Agent Vinod";        // replace with auth system later

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatRelative(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function AgentDashboard() {
  const [queue, setQueue] = useState([]);
  const [activeSession, setActiveSession] = useState(null); // { sessionId, chatHistory }
  const [chatLog, setChatLog] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [connected, setConnected] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const intervalRef = useRef(null);

  // ── Incoming user messages (real-time)
  const handleUserMessage = useCallback(({ message, sessionId }) => {
    if (sessionId !== activeSession?.sessionId) return;
    setChatLog(prev => [
      ...prev,
      { role: "user", text: message, time: new Date() },
    ]);
  }, [activeSession]);

  const { emitAgentJoin, emitAgentMessage, emitAgentEnd, getSocket } = useSocket(null, {});

  // listen for user messages when we have an active session
  useEffect(() => {
    if (!activeSession) return;
    const socket = getSocket();
    const handler = ({ message, sessionId }) => {
      if (sessionId !== activeSession.sessionId) return;
      setChatLog(prev => [...prev, { role: "user", text: message, time: new Date() }]);
    };
    socket.on("user:message", handler);

    socket.on("agent:disconnected", () => {
      setChatLog(prev => [
        ...prev,
        { role: "system", text: "The user has ended the session or disconnected.", time: new Date() }
      ]);
      setActiveSession(prev => prev ? { ...prev, ended: true } : null);
    });

    return () => {
      socket.off("user:message", handler);
      socket.off("agent:disconnected");
    };
  }, [activeSession, getSocket]);

  // ── Fetch queue
  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch("/api/agent-queue", {
        headers: { "x-agent-key": AGENT_KEY },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setQueue(data.queue || []);
      setFetchError(null);
      setConnected(true);
      setLastRefresh(new Date());
    } catch (err) {
      setFetchError(err.message);
      setConnected(false);
    }
  }, []);

  // Auto-refresh queue every 5 s
  useEffect(() => {
    fetchQueue();
    intervalRef.current = setInterval(fetchQueue, 5000);
    return () => clearInterval(intervalRef.current);
  }, [fetchQueue]);

  // Scroll to bottom when chat changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLog]);

  // ── Claim a session
  const claimChat = async (sessionId) => {
    setLoading(true);
    try {
      const res = await fetch("/api/agent-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, agentId: AGENT_ID }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { chatHistory } = await res.json();

      setActiveSession({ sessionId });
      setChatLog(
        (chatHistory || []).map(m => ({
          role: m.role === "user" ? "user" : "bot",
          text: m.content || m.text || "",
          time: m.time || new Date(),
        }))
      );
      emitAgentJoin(sessionId, AGENT_ID);
      setQueue(prev => prev.filter(s => s.sessionId !== sessionId));
      setTimeout(() => inputRef.current?.focus(), 200);
    } catch (err) {
      alert(`Could not claim session: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ── Send message as agent
  const sendAgentMessage = () => {
    if (!input.trim() || !activeSession) return;
    const text = input.trim();
    emitAgentMessage(activeSession.sessionId, text);
    setChatLog(prev => [...prev, { role: "agent", text, time: new Date() }]);
    setInput("");
    inputRef.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAgentMessage(); }
  };

  // ── End session
  const endSession = () => {
    if (activeSession?.sessionId) {
      emitAgentEnd(activeSession.sessionId);
    }
    setActiveSession(null);
    setChatLog([]);
  };

  return (
    <div className="agent-dashboard">
      {/* ── Sidebar: Queue */}
      <aside className="agent-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title">
            <Users size={18} />
            <span>Agent Panel</span>
          </div>
          <div className={`conn-badge ${connected ? "conn-online" : "conn-offline"}`}>
            {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
            {connected ? "Live" : "Offline"}
          </div>
        </div>

        <div className="agent-info-bar">
          <div className="agent-avatar-sm">
            {AGENT_ID.split(" ").map(w => w[0]).join("")}
          </div>
          <div>
            <div className="agent-name-sm">{AGENT_ID}</div>
            <div className="agent-role-sm">Hospital Staff</div>
          </div>
        </div>

        <div className="queue-section-header">
          <span>Waiting Users ({queue.length})</span>
          <button
            className="refresh-btn"
            onClick={fetchQueue}
            title="Refresh queue"
          >
            <RefreshCw size={13} />
          </button>
        </div>

        {fetchError && (
          <div className="queue-error">
            ⚠️ Cannot reach backend.<br />
            <small>{fetchError}</small>
          </div>
        )}

        <div className="queue-list">
          <AnimatePresence>
            {queue.length === 0 && !fetchError && (
              <motion.div
                className="queue-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <MessageSquare size={28} />
                <p>No users waiting</p>
                <small>Queue will refresh automatically</small>
              </motion.div>
            )}

            {queue.map((item) => (
              <motion.div
                key={item.sessionId}
                className={`queue-item ${activeSession?.sessionId === item.sessionId ? "queue-item-active" : ""}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                layout
              >
                <div className="qi-info">
                  <div className="qi-id">Session #{item.sessionId?.slice(-6)}</div>
                  <div className="qi-meta">
                    <Clock size={11} />
                    {formatRelative(item.joinedAt || Date.now())}
                    {item.messageCount != null && (
                      <span className="qi-msgs">· {item.messageCount} msgs</span>
                    )}
                  </div>
                </div>
                <button
                  className="claim-btn"
                  onClick={() => claimChat(item.sessionId)}
                  disabled={loading || activeSession?.sessionId === item.sessionId}
                  id={`claim-${item.sessionId}`}
                >
                  {activeSession?.sessionId === item.sessionId
                    ? <UserCheck size={14} />
                    : <ChevronRight size={14} />
                  }
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {lastRefresh && (
          <div className="refresh-time">
            Last updated: {formatTime(lastRefresh)}
          </div>
        )}
      </aside>

      {/* ── Main: Chat Panel */}
      <main className="agent-chat-panel">
        {!activeSession ? (
          <div className="no-session">
            <motion.div
              className="no-session-icon"
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
            >
              <MessageSquare size={48} />
            </motion.div>
            <h2>Select a Session</h2>
            <p>Pick a waiting user from the queue on the left to start a live chat.</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="agent-chat-header">
              <div className="ach-info">
                <div className="ach-avatar">
                  {activeSession.sessionId?.slice(-2).toUpperCase()}
                </div>
                <div>
                  <div className="ach-title">
                    Session #{activeSession.sessionId?.slice(-6)}
                  </div>
                  <div className="ach-subtitle">
                    {activeSession.ended ? (
                      <span className="status-ended">Session Ended</span>
                    ) : (
                      <>
                        <span className="dot-green" /> Live — {AGENT_ID}
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button
                className="end-session-btn"
                onClick={endSession}
                title={activeSession.ended ? "Close chat" : "End session"}
              >
                {activeSession.ended ? <X size={16} /> : <X size={16} />}
                {activeSession.ended ? "Close Tab" : "End Session"}
              </button>
            </div>

            {/* Messages */}
            <div className="agent-messages">
              <AnimatePresence initial={false}>
                {chatLog.map((msg, i) => (
                  <motion.div
                    key={i}
                    className={`agent-msg ${msg.role} ${msg.role === "system" ? "system-msg-center" : ""}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="agent-msg-bubble">
                      {msg.role !== "system" && (
                        <div className="agent-msg-role">
                          {msg.role === "user" ? "👤 User" : msg.role === "agent" ? `🩺 ${AGENT_ID}` : "🤖 AI"}
                        </div>
                      )}
                      <div className="agent-msg-text">{msg.text}</div>
                      <div className="agent-msg-time">{formatTime(msg.time)}</div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className={`agent-input-area ${activeSession.ended ? "input-disabled" : ""}`}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={activeSession.ended ? "Session has ended" : `Reply as ${AGENT_ID}…`}
                rows={2}
                aria-label="Agent reply input"
                disabled={activeSession.ended}
              />
              <motion.button
                className="agent-send-btn"
                onClick={sendAgentMessage}
                disabled={!input.trim() || activeSession.ended}
                whileHover={activeSession.ended ? {} : { scale: 1.08 }}
                whileTap={activeSession.ended ? {} : { scale: 0.92 }}
                aria-label="Send reply"
              >
                <Send size={18} />
              </motion.button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
