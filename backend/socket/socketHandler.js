import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { Message } from "../models/Message.js";

const connectedUsers = new Map();

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  // Authentication middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error("User not found"));
      }

      socket.userId = user._id.toString();
      socket.username = user.username;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User ${socket.username} connected`);
    connectedUsers.set(socket.userId, socket.id);

    // Join user to their personal room
    socket.join(socket.userId);

    // Handle joining group rooms
    socket.on("join-group", (groupId) => {
      socket.join(groupId);
      console.log(`User ${socket.username} joined group ${groupId}`);
    });

    // Handle leaving group rooms
    socket.on("leave-group", (groupId) => {
      socket.leave(groupId);
      console.log(`User ${socket.username} left group ${groupId}`);
    });

    // Handle text messages
    socket.on("send-message", async (data) => {
      try {
        const { recipientId, groupId, content, messageType } = data;

        const message = new Message({
          sender: socket.userId,
          recipient: recipientId || null,
          groupId: groupId || null,
          content,
          messageType: messageType || "text",
        });

        await message.save();
        await message.populate("sender", "username profilePic");

        // Send to recipient or group
        if (groupId) {
          socket.to(groupId).emit("new-message", message);
        } else if (recipientId) {
          socket.to(recipientId).emit("new-message", message);
        }

        // Send back to sender for confirmation
        socket.emit("message-sent", message);
      } catch (error) {
        console.error("Send message error:", error);
        socket.emit("message-error", { error: "Failed to send message" });
      }
    });

    // Handle voice message notifications
    socket.on("voice-message-sent", (data) => {
      const { recipientId, groupId, message } = data;

      if (groupId) {
        socket.to(groupId).emit("new-voice-message", message);
      } else if (recipientId) {
        socket.to(recipientId).emit("new-voice-message", message);
      }
    });

    // Handle typing indicators
    socket.on("typing", (data) => {
      const { recipientId, groupId, isTyping } = data;

      if (groupId) {
        socket.to(groupId).emit("user-typing", {
          userId: socket.userId,
          username: socket.username,
          isTyping,
        });
      } else if (recipientId) {
        socket.to(recipientId).emit("user-typing", {
          userId: socket.userId,
          username: socket.username,
          isTyping,
        });
      }
    });

    // Handle friend request notifications
    socket.on("friend-request-sent", (data) => {
      const { recipientId } = data;
      socket.to(recipientId).emit("new-friend-request", {
        from: {
          _id: socket.userId,
          username: socket.username,
        },
      });
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User ${socket.username} disconnected`);
      connectedUsers.delete(socket.userId);
    });
  });

  return io;
};

export const getConnectedUsers = () => {
  return Array.from(connectedUsers.keys());
};