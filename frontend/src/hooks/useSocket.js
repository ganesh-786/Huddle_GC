import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export const useSocket = (token, onNewMessage, onNewVoiceMessage) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    // Initialize socket connection
    socketRef.current = io("http://localhost:8080", {
      auth: {
        token,
      },
    });

    const socket = socketRef.current;

    // Connection events
    socket.on("connect", () => {
      console.log("Connected to server");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    // Message events
    socket.on("new-message", (message) => {
      if (onNewMessage) {
        onNewMessage(message);
      }
    });

    socket.on("new-voice-message", (message) => {
      if (onNewVoiceMessage) {
        onNewVoiceMessage(message);
      }
    });

    socket.on("message-sent", (message) => {
      console.log("Message sent successfully:", message);
    });

    socket.on("message-error", (error) => {
      console.error("Message error:", error);
    });

    // Typing events
    socket.on("user-typing", (data) => {
      console.log("User typing:", data);
    });

    // Friend request events
    socket.on("new-friend-request", (data) => {
      console.log("New friend request:", data);
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [token, onNewMessage, onNewVoiceMessage]);

  const sendMessage = (data) => {
    if (socketRef.current) {
      socketRef.current.emit("send-message", data);
    }
  };

  const joinGroup = (groupId) => {
    if (socketRef.current) {
      socketRef.current.emit("join-group", groupId);
    }
  };

  const leaveGroup = (groupId) => {
    if (socketRef.current) {
      socketRef.current.emit("leave-group", groupId);
    }
  };

  const sendTyping = (data) => {
    if (socketRef.current) {
      socketRef.current.emit("typing", data);
    }
  };

  const notifyVoiceMessageSent = (data) => {
    if (socketRef.current) {
      socketRef.current.emit("voice-message-sent", data);
    }
  };

  return {
    socket: socketRef.current,
    sendMessage,
    joinGroup,
    leaveGroup,
    sendTyping,
    notifyVoiceMessageSent,
  };
};