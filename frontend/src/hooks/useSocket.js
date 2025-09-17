// src/hooks/useSocket.js
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export const useSocket = (token, onNewMessage, onNewVoiceMessage) => {
  const socketRef = useRef(null);
  const [socketReady, setSocketReady] = useState(false);

  useEffect(() => {
    if (!token) return;

    const socket = io("http://localhost:8080", {
      auth: { token },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Connected to server:", socket.id);
      setSocketReady(true);
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected from server");
      setSocketReady(false);
    });

    // Incoming text messages
    socket.on("message", (msg) => {
      onNewMessage?.(msg);
    });

    // Incoming voice messages
    socket.on("voice-message", (msg) => {
      onNewVoiceMessage?.(msg);
    });

    // Optional logs
    socket.on("message-sent", (msg) => console.log("Message delivered:", msg));
    socket.on("message-error", (err) => console.error("Message error:", err));

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [token, onNewMessage, onNewVoiceMessage]);

  // Emitters
  const sendMessage = (payload) => {
    socketRef.current?.emit("message", payload);
  };

  const sendVoiceMessage = (payload) => {
    socketRef.current?.emit("voice-message", payload);
  };

  const sendTyping = (data) => {
    socketRef.current?.emit("typing", data);
  };

  return {
    socket: socketRef.current,
    socketReady,
    sendMessage,
    sendVoiceMessage,
    sendTyping,
  };
};
