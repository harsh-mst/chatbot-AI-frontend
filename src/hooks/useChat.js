import { useState, useCallback } from "react";

const API_BASE = "https://chatbot-ai-backend-0rnc.onrender.com/api";

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
  const [allMessages, setAllMessages] = useState({ nlp: [], kimi: [] });
  const [isTyping, setIsTyping] = useState(false);
  const [sessions, setSessions] = useState({ nlp: null, kimi: null });

  const messages = allMessages[mode];
  const currentSessionId = sessions[mode];

  const setMessages = useCallback((updater) => {
    setAllMessages(prev => ({
      ...prev,
      [mode]: typeof updater === 'function' ? updater(prev[mode]) : updater
    }));
  }, [mode]);

  const updateSession = useCallback((engine, id) => {
    setSessions(prev => ({ ...prev, [engine]: id }));
  }, []);

  const sendNlp = async (text) => {
    const body = { message: text };
    if (currentSessionId) body.sessionId = currentSessionId;

    const res = await fetch(`${API_BASE}/chat`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
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
  };

  const sendKimiStream = async (text) => {
    const body = { message: text };
    if (currentSessionId) body.sessionId = currentSessionId;

    const res = await fetch(`${API_BASE}/kimi/stream`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Kimi error ${res.status}`);
    }

    const botMsgId = Date.now() + 1;
    // Keep isTyping true until first token
    setMessages(prev => [
      ...prev,
      {
        id: botMsgId,
        role: "bot",
        text: "",
        time: new Date(),
        engine: "kimi",
        streaming: true,
      },
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
          setIsTyping(false); // First token arrived, stop global typing indicator
          setMessages(prev => prev.map(m =>
            m.id === botMsgId ? { ...m, text: m.text + parsed.token } : m
          ));
        }

        if (parsed.done) {
          if (parsed.sessionId) updateSession("kimi", parsed.sessionId);
          setMessages(prev => prev.map(m =>
            m.id === botMsgId ? { ...m, streaming: false } : m
          ));
        }
      }
    }
  };

  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return;

    setMessages(prev => [
      ...prev,
      { id: Date.now(), role: "user", text, time: new Date() },
    ]);
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
  }, [currentSessionId, mode, updateSession, setMessages]);

  const initGreeting = useCallback(() => {
    if (allMessages[mode].length > 0) return; // Don't re-greet if history exists

    const greeting = mode === "kimi"
      ? "✨ Hi! You're now chatting with **Kimi K2 AI**.\n\nAsk me anything about MedCare Hospital — doctor schedules, departments, procedures, and more.\n\nHow can I help?"
      : "👋 Hi! I'm the MedCare chatbot.\n\nAsk me about:\n• Doctor availability & schedules\n• Department timings\n• Visiting hours, parking, address\n\nHow can I help you today?";

    setMessages([{ id: 0, role: "bot", time: new Date(), text: greeting, engine: mode }]);
  }, [mode, allMessages, setMessages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, [setMessages]);

  const resetAll = useCallback(() => {
    setAllMessages({ nlp: [], kimi: [] });
    setSessions({ nlp: null, kimi: null });
  }, []);

  return { messages, isTyping, sendMessage, initGreeting, clearMessages, resetAll };
}


// import { useState, useCallback } from "react";

// const API_BASE = "http://localhost:8000/api";

// function getFallback(msg, mode) {
//   const m = msg.toLowerCase().trim();
//   if (mode === "kimi") {
//     return "⚠️ Unable to connect to Kimi AI.\n\nMake sure:\n1. Backend is running: npm run dev\n2. KIMI_API_KEY is set in .env";
//   }
//   if (/^(hi|hello|hey|namaste)/i.test(m))
//     return "👋 Hello! Welcome to MedCare.\n\n⚠️ Server offline. Start backend:\n\n  cd medcare-backend-v2\n  npm run dev";
//   if (/sharma|cardio|heart doctor/i.test(m))
//     return "👨‍⚕️ Dr. Priya Sharma (Cardiologist)\n📅 Mon, Wed, Fri\n🕐 9:00 AM – 2:00 PM\n🚪 Room: 301-A\n\n⚠️ Start backend for live data.";
//   if (/mehta|pediatric|child/i.test(m))
//     return "👩‍⚕️ Dr. Anjali Mehta (Pediatrician)\n📅 Mon–Fri\n🕐 8:00 AM – 1:00 PM\n🚪 Room: 105-C\n\n⚠️ Start backend for live data.";
//   if (/kumar|ortho|bone/i.test(m))
//     return "👨‍⚕️ Dr. Rajesh Kumar (Orthopedic)\n📅 Tue, Thu, Sat\n🕐 10:00 AM – 4:00 PM\n🚪 Room: 202-B\n\n⚠️ Start backend for live data.";
//   if (/patel|neuro|brain/i.test(m))
//     return "👨‍⚕️ Dr. Vikram Patel (Neurologist)\n📅 Wed, Fri\n🕐 2:00 PM – 6:00 PM\n🚪 Room: 410-D\n\n⚠️ Start backend for live data.";
//   if (/verma|derma|skin/i.test(m))
//     return "👩‍⚕️ Dr. Sunita Verma (Dermatologist)\n📅 Mon, Thu\n🕐 11:00 AM – 3:00 PM\n🚪 Room: 206-A\n\n⚠️ Start backend for live data.";
//   if (/singh|general physician/i.test(m))
//     return "👨‍⚕️ Dr. Arjun Singh (General Physician)\n📅 Mon–Sat\n🕐 8:00 AM – 8:00 PM\n🚪 Room: 101-A\n\n⚠️ Start backend for live data.";
//   if (/visit/i.test(m))
//     return "🕐 Visiting Hours:\n10:00 AM – 12:00 PM\n4:00 PM – 7:00 PM\n\n⚠️ Start backend for live data.";
//   if (/park/i.test(m))
//     return "🅿️ Free parking — Basement B1 & B2.\nValet at main entrance.\n\n⚠️ Start backend for live data.";
//   if (/address|location|where|direction/i.test(m))
//     return "📍 MedCare General Hospital\n42 Health Avenue, New Delhi – 110001\n\n⚠️ Start backend for live data.";
//   if (/emergency|urgent|accident/i.test(m))
//     return "🚨 Emergency open 24/7!\n📞 +91-11-9999-0000\nGround Floor.\n\n⚠️ Start backend for live data.";
//   if (/hour|open|close|timing/i.test(m))
//     return "🏥 Hospital Hours: 8:00 AM – 10:00 PM\n🚨 Emergency: 24/7\n\n⚠️ Start backend for live data.";
//   if (/contact|phone|number/i.test(m))
//     return "📞 Main: +91-11-8888-1111\n🚨 Emergency: +91-11-9999-0000\n\n⚠️ Start backend for live data.";
//   if (/thank/i.test(m)) return "You're welcome! 😊";
//   if (/bye|goodbye/i.test(m)) return "Goodbye! 👋 Stay healthy!";
//   return "⚠️ Unable to connect to MedCare server.\n\nStart the backend:\n\n  cd medcare-backend-v2\n  npm run dev";
// }

// export function useChat(mode = "nlp") {
//   const [messages, setMessages]   = useState([]);
//   const [isTyping, setIsTyping]   = useState(false);

//   // ── Separate sessionId per engine so switching never destroys either session
//   const [sessions, setSessions] = useState({ nlp: null, kimi: null });
//   const sessionId = sessions[mode]; // always use current mode's session

//   const sendMessage = useCallback(async (text) => {
//     if (!text.trim()) return;

//     setMessages(prev => [
//       ...prev,
//       { id: Date.now(), role: "user", text, time: new Date() },
//     ]);
//     setIsTyping(true);

//     try {
//       const endpoint = mode === "kimi"
//         ? `${API_BASE}/kimi/chat`
//         : `${API_BASE}/chat`;

//       const body = { message: text };
//       if (sessionId) body.sessionId = sessionId;

//       const res = await fetch(endpoint, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(body),
//       });

//       if (!res.ok) {
//         const errData = await res.json().catch(() => ({}));
//         throw new Error(errData.error || `Server error ${res.status}`);
//       }

//       const data = await res.json();

//       // Save sessionId under the correct mode key only
//       if (data.sessionId) {
//         setSessions(prev => ({ ...prev, [mode]: data.sessionId }));
//       }

//       const replyText = data.correctedInput
//         ? `🔍 Searched for: "${data.correctedInput}"\n\n${data.reply}`
//         : data.reply;

//       setIsTyping(false);
//       setMessages(prev => [
//         ...prev,
//         {
//           id:         Date.now() + 1,
//           role:       "bot",
//           text:       replyText,
//           time:       new Date(),
//           engine:     mode,
//           intent:     data.intent,
//           confidence: data.confidence,
//         },
//       ]);

//     } catch (err) {
//       console.warn("[MedCare] Backend unreachable:", err.message);
//       await new Promise(r => setTimeout(r, 700));
//       setIsTyping(false);
//       setMessages(prev => [
//         ...prev,
//         {
//           id:      Date.now() + 1,
//           role:    "bot",
//           text:    getFallback(text, mode),
//           time:    new Date(),
//           offline: true,
//           engine:  mode,
//         },
//       ]);
//     }
//   }, [sessionId, mode]);

//   const initGreeting = useCallback(() => {
//     const greeting = mode === "kimi"
//       ? "✨ You're now chatting with Kimi K2 AI.\n\nAsk me anything — symptoms, conditions, or questions about MedCare Hospital.\n\nHow can I help?"
//       : "👋 Hi! I'm the MedCare assistant.\n\nAsk me about:\n• Doctor availability & schedules\n• Department timings\n• Visiting hours, parking, address\n\nHow can I help you today?";

//     setMessages([{ id: 0, role: "bot", time: new Date(), text: greeting, engine: mode }]);
//   }, [mode]);

//   // Only clears displayed messages — does NOT reset sessionIds
//   const clearMessages = useCallback(() => {
//     setMessages([]);
//   }, []);

//   return { messages, isTyping, sendMessage, initGreeting, clearMessages };
// }