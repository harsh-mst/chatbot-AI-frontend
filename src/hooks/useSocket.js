import { useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";

// Single socket instance shared across the app
let socketInstance = null;

function getSocket() {
  if (!socketInstance) {
    socketInstance = io("http://localhost:8000", {
      autoConnect: true,
      reconnectionAttempts: 5,
      transports: ["websocket", "polling"],
    });
  }
  return socketInstance;
}

/**
 * useSocket(sessionId, callbacks)
 *
 * callbacks:
 *   onAgentJoined(agentName)
 *   onAgentMessage(message)
 *   onAgentDisconnected()
 */
export function useSocket(sessionId, callbacks = {}) {
  const cbRef = useRef(callbacks);
  useEffect(() => { cbRef.current = callbacks; });

  // Join the session room once sessionId is available
  useEffect(() => {
    if (!sessionId) return;
    const socket = getSocket();
    socket.emit("user:join", { sessionId });
  }, [sessionId]);

  // Attach persistent event listeners
  useEffect(() => {
    const socket = getSocket();

    const onAgentJoined = ({ agentName }) => {
      cbRef.current.onAgentJoined?.(agentName);
    };

    const onAgentMessage = ({ message }) => {
      cbRef.current.onAgentMessage?.(message);
    };

    const onAgentDisconnected = () => {
      cbRef.current.onAgentDisconnected?.();
    };

    socket.on("agent:joined", onAgentJoined);
    socket.on("agent:message", onAgentMessage);
    socket.on("agent:disconnected", onAgentDisconnected);

    return () => {
      socket.off("agent:joined", onAgentJoined);
      socket.off("agent:message", onAgentMessage);
      socket.off("agent:disconnected", onAgentDisconnected);
    };
  }, []);

  // Emit a user message via socket (agent mode)
  const emitUserMessage = useCallback((sessionId, message) => {
    getSocket().emit("user:message", { sessionId, message });
  }, []);

  // Agent-side: join a session
  const emitAgentJoin = useCallback((sessionId, agentId) => {
    getSocket().emit("agent:join", { sessionId, agentId });
  }, []);

  // Agent-side: send a message to a user
  const emitAgentMessage = useCallback((sessionId, message) => {
    getSocket().emit("agent:message", { sessionId, message });
  }, []);

  // Agent-side: explicitly end a session
  const emitAgentEnd = useCallback((sessionId) => {
    getSocket().emit("agent:end", { sessionId });
  }, []);

  // User-side: explicitly end a session
  const emitUserEnd = useCallback((sessionId) => {
    getSocket().emit("user:end", { sessionId });
  }, []);

  return { emitUserMessage, emitAgentJoin, emitAgentMessage, emitAgentEnd, emitUserEnd, getSocket };
}
