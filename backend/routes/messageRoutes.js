import express from "express";
import {
  sendTextMessage,
  getConversationHistory,
  getUserConversations,
  deleteMessage,
} from "../controllers/messageController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Send text message
router.post("/text", authenticateToken, sendTextMessage);

// Get conversation history
router.get("/conversation", authenticateToken, getConversationHistory);

// Get all conversations for user
router.get("/conversations", authenticateToken, getUserConversations);

// Delete message
router.delete("/:messageId", authenticateToken, deleteMessage);

export default router;
