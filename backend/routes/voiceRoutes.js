import express from "express";
import {
  createVoiceNote,
  getUserVoiceNotes,
  getVoiceNoteFeed,
  sendVoiceMessage,
  getMessages,
} from "../controllers/voiceController.js";
import { authenticateToken } from "../middleware/auth.js";
import { uploadAudio } from "../middleware/upload.js";

const router = express.Router();

// Voice notes routes
router.post("/notes", authenticateToken, uploadAudio.single("audio"), createVoiceNote);
router.get("/notes", authenticateToken, getUserVoiceNotes);
router.get("/feed", authenticateToken, getVoiceNoteFeed);

// Voice messages routes
router.post("/messages", authenticateToken, uploadAudio.single("audio"), sendVoiceMessage);
router.get("/messages", authenticateToken, getMessages);

export default router;