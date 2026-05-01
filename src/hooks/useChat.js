import { useState, useCallback, useRef, useEffect } from "react";

const API_BASE = "http://localhost:8000/api";

function getFallback(msg) {
  const m = msg.toLowerCase().trim();
  if (/^(hi|hello|hey|namaste)/i.test(m))
    return "👋 Hello! Welcome to MedCare.\n\n⚠️ Server offline.";
  if (/sharma|cardio|heart doctor/i.test(m))
    return "👨‍⚕️ Dr. Priya Sharma (Cardiologist)\n📅 Mon, Wed, Fri\n🕐 9:00 AM – 2:00 PM\n🚪 Room: 301-A\n\n⚠️ Start backend for live data.";
  if (/mehta|pediatric|child/i.test(m))
    return "👩‍⚕️ Dr. Anjali Mehta (Pediatrician)\n📅 Mon–Fri\n🕐 8:00 AM – 1:00 PM\n🚪 Room: 105-C\n\n⚠️ Start backend for live data.";
  if (/kumar|ortho|bone/i.test(m))
    return "👨‍⚕️ Dr. Rajesh Kumar (Orthopedic)\n📅 Tue, Thu, Sat\n🕐 10:00 AM – 4:00 PM\n🚪 Room: 202-B\n\n⚠️ Start backend for live data.";
  if (/patel|neuro|brain/i.test(m))
    return "👨‍⚕️ Dr. Vikram Patel (Neurologist)\n📅 Wed, Fri\n🕐 2:00 PM – 6:00 PM\n🚪 Room: 410-D\n\n⚠️ Start backend for live data.";
  if (/verma|derma|skin/i.test(m))
    return "👩‍⚕️ Dr. Sunita Verma (Dermatologist)\n📅 Mon, Thu\n🕐 11:00 AM – 3:00 PM\n🚪 Room: 206-A\n\n⚠️ Start backend for live data.";
  if (/singh|general physician/i.test(m))
    return "👨‍⚕️ Dr. Arjun Singh (General Physician)\n📅 Mon–Sat\n🕐 8:00 AM – 8:00 PM\n🚪 Room: 101-A\n\n⚠️ Start backend for live data.";
  if (/visit/i.test(m))
    return "🕐 Visiting Hours:\n10:00 AM – 12:00 PM\n4:00 PM – 7:00 PM\n\n⚠️ Start backend for live data.";
  if (/park/i.test(m))
    return "🅿️ Free parking — Basement B1 & B2.\nValet at main entrance.\n\n⚠️ Start backend for live data.";
  if (/address|location|where|direction/i.test(m))
    return "📍 MedCare General Hospital\n42 Health Avenue, New Delhi – 110001\n\n⚠️ Start backend for live data.";
  if (/emergency|urgent|accident/i.test(m))
    return "🚨 Emergency open 24/7!\n📞 +91-11-9999-0000\nGround Floor.\n\n⚠️ Start backend for live data.";
  if (/hour|open|close|timing/i.test(m))
    return "🏥 Hospital Hours: 8:00 AM – 10:00 PM\n🚨 Emergency: 24/7\n\n⚠️ Start backend for live data.";
  if (/contact|phone|number/i.test(m))
    return "📞 Main: +91-11-8888-1111\n🚨 Emergency: +91-11-9999-0000\n\n⚠️ Start backend for live data.";
  if (/thank/i.test(m)) return "You're welcome! 😊";
  if (/bye|goodbye/i.test(m)) return "Goodbye! 👋 Stay healthy!";
  return "⚠️ Unable to connect to MedCare server.";
}

export function useChat(mode = "nlp") {
  const [allMessages, setAllMessages] = useState(() => {
    const saved = localStorage.getItem("medcare_messages");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert ISO strings back to Date objects
        Object.keys(parsed).forEach(k => {
          parsed[k].forEach(m => { if (m.time) m.time = new Date(m.time); });
        });
        return parsed;
      } catch (e) {
        console.warn("Failed to parse saved messages", e);
      }
    }
    return { nlp: [], kimi: [] };
  });

  const [isTyping, setIsTyping] = useState(false);
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem("medcare_sessions");
    return saved ? JSON.parse(saved) : { nlp: null, kimi: null };
  });

  // ── Live-agent state
  const [chatMode, setChatMode] = useState(() => localStorage.getItem("medcare_chatMode") || "bot");
  const [agentName, setAgentName] = useState(() => localStorage.getItem("medcare_agentName") || null);
  const [showAgentButton, setShowAgentButton] = useState(false);
  const [queuePosition, setQueuePosition] = useState(null);
  const [isWaitingForAgent, setIsWaitingForAgent] = useState(false);

  const messages = allMessages[mode];
  const currentSessionId = sessions[mode];

  // keep a ref so socket callbacks always see latest sessionId
  const sessionRef = useRef(sessions);
  sessionRef.current = sessions;

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem("medcare_messages", JSON.stringify(allMessages));
  }, [allMessages]);

  useEffect(() => {
    localStorage.setItem("medcare_sessions", JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem("medcare_chatMode", chatMode);
  }, [chatMode]);

  useEffect(() => {
    if (agentName) localStorage.setItem("medcare_agentName", agentName);
    else localStorage.removeItem("medcare_agentName");
  }, [agentName]);

  const setMessages = useCallback((updater) => {
    setAllMessages(prev => ({
      ...prev,
      [mode]: typeof updater === "function" ? updater(prev[mode]) : updater,
    }));
  }, [mode]);

  const updateSession = useCallback((engine, id) => {
    setSessions(prev => ({ ...prev, [engine]: id }));
  }, []);

  // ── Called by useSocket when agent:joined fires
  const handleAgentJoined = useCallback((name) => {
    setChatMode("agent");
    setAgentName(name);
    setIsWaitingForAgent(false);
    setQueuePosition(null);
    setShowAgentButton(false);
    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        role: "system",
        text: `👤 ${name} has joined the chat`,
        time: new Date(),
        engine: "agent",
      },
    ]);
  }, [setMessages]);

  // ── Called by useSocket when agent:message fires
  const handleAgentMessage = useCallback((message) => {
    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        role: "bot",
        text: message,
        time: new Date(),
        engine: "agent",
      },
    ]);
  }, [setMessages]);

  // ── Called by useSocket when agent:disconnected fires
  const handleAgentDisconnected = useCallback(() => {
    setChatMode("bot");
    setAgentName(null);
    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        role: "system",
        text: "👤 Agent has left the chat. Reconnecting to AI assistant…",
        time: new Date(),
        engine: "system",
      },
    ]);
  }, [setMessages]);

  // ── User manually ends agent session
  const endAgentSession = useCallback((emitUserEnd) => {
    if (chatMode === "agent" && emitUserEnd && currentSessionId) {
      emitUserEnd(currentSessionId);
    }
    setChatMode("bot");
    setAgentName(null);
    setIsWaitingForAgent(false);
    setQueuePosition(null);
    setShowAgentButton(false);
    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        role: "system",
        text: "🔌 Session ended. You're back with the AI assistant.",
        time: new Date(),
        engine: "system",
      },
    ]);
  }, [chatMode, currentSessionId, setMessages]);

  // ── Request a live agent
  const requestAgent = useCallback(async (sid) => {
    const sessionId = sid || currentSessionId;
    if (!sessionId) return;
    setIsWaitingForAgent(true);
    try {
      const res = await fetch("/api/request-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (data.status === "queued") {
        setQueuePosition(data.position);
      }
    } catch (err) {
      console.warn("[MedCare] Could not request agent:", err.message);
      setIsWaitingForAgent(false);
    }
  }, [currentSessionId]);

  // ── NLP path
  const sendNlp = async (text) => {
    const body = { message: text };
    if (currentSessionId) body.sessionId = currentSessionId;

    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server error ${res.status}`);
    }

    const data = await res.json();
    if (data.sessionId) updateSession("nlp", data.sessionId);

    const replyText = data.correctedInput
      ? `🔍 Searched for: "${data.correctedInput}"\n\n${data.reply}`
      : data.reply;

    setIsTyping(false);
    setMessages(prev => [
      ...prev,
      {
        id: Date.now() + 1,
        role: "bot",
        text: replyText,
        time: new Date(),
        engine: "nlp",
        intent: data.intent,
        confidence: data.confidence,
      },
    ]);

    // Handle agent flags
    if (data.offerAgent) setShowAgentButton(true);
    if (data.urgent) requestAgent(data.sessionId);
  };

  // ── Kimi streaming path
  const sendKimiStream = async (text) => {
    const body = { message: text };
    if (currentSessionId) body.sessionId = currentSessionId;

    const res = await fetch(`${API_BASE}/kimi/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Kimi error ${res.status}`);
    }

    const botMsgId = Date.now() + 1;
    setMessages(prev => [
      ...prev,
      { id: botMsgId, role: "bot", text: "", time: new Date(), engine: "kimi", streaming: true },
    ]);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (!raw) continue;

        let parsed;
        try { parsed = JSON.parse(raw); } catch { continue; }

        if (parsed.error) {
          setMessages(prev => prev.map(m =>
            m.id === botMsgId ? { ...m, text: `⚠️ ${parsed.error}`, streaming: false } : m
          ));
          return;
        }

        if (parsed.token) {
          setIsTyping(false);
          setMessages(prev => prev.map(m =>
            m.id === botMsgId ? { ...m, text: m.text + parsed.token } : m
          ));
        }

        if (parsed.done) {
          if (parsed.sessionId) updateSession("kimi", parsed.sessionId);
          setMessages(prev => prev.map(m =>
            m.id === botMsgId ? { ...m, streaming: false } : m
          ));
          // Handle backend flags
          if (parsed.offerAgent) setShowAgentButton(true);
          if (parsed.urgent) requestAgent(parsed.sessionId);
        }
      }
    }
  };

  // ── Unified send (bot vs agent)
  const sendMessage = useCallback(async (text, { emitUserMessage } = {}) => {
    if (!text.trim()) return;

    setMessages(prev => [
      ...prev,
      { id: Date.now(), role: "user", text, time: new Date() },
    ]);

    // ── Agent mode: send via socket
    if (chatMode === "agent") {
      if (emitUserMessage && currentSessionId) {
        emitUserMessage(currentSessionId, text);
      }
      return;
    }

    // ── Bot mode: normal AI path
    setIsTyping(true);
    try {
      if (mode === "kimi") {
        await sendKimiStream(text);
      } else {
        await sendNlp(text);
      }
    } catch (err) {
      console.warn("[MedCare] Backend unreachable:", err.message);
      await new Promise(r => setTimeout(r, 700));
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "bot",
          text: getFallback(text),
          time: new Date(),
          offline: true,
          engine: mode,
        },
      ]);
    }
  }, [currentSessionId, mode, chatMode, updateSession, setMessages, requestAgent]);

  const initGreeting = useCallback(() => {
    if (allMessages[mode].length > 0) return;

    const greeting = mode === "kimi"
      ? "✨ Hi! You're now chatting with **Kimi K2 AI**.\n\nAsk me anything about MedCare Hospital — doctor schedules, departments, procedures, and more.\n\nHow can I help?"
      : "👋 Hi! I'm the MedCare chatbot.\n\nAsk me about:\n• Doctor availability & schedules\n• Department timings\n• Visiting hours, parking, address\n\nHow can I help you today?";

    setMessages([{ id: 0, role: "bot", time: new Date(), text: greeting, engine: mode }]);
  }, [mode, allMessages, setMessages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    localStorage.removeItem("medcare_messages");
  }, [setMessages]);

  const resetAll = useCallback(() => {
    setAllMessages({ nlp: [], kimi: [] });
    setSessions({ nlp: null, kimi: null });
    setChatMode("bot");
    setAgentName(null);
    setShowAgentButton(false);
    setQueuePosition(null);
    setIsWaitingForAgent(false);
    localStorage.removeItem("medcare_messages");
    localStorage.removeItem("medcare_sessions");
    localStorage.removeItem("medcare_chatMode");
    localStorage.removeItem("medcare_agentName");
  }, []);

  return {
    messages,
    isTyping,
    sendMessage,
    initGreeting,
    clearMessages,
    resetAll,
    // Agent state
    chatMode,
    agentName,
    showAgentButton,
    queuePosition,
    isWaitingForAgent,
    requestAgent,
    endAgentSession,
    currentSessionId,
    // Handlers exposed for useSocket wiring
    handleAgentJoined,
    handleAgentMessage,
    handleAgentDisconnected,
  };
}