import { VoiceNote } from "../models/VoiceNote.js";
import { Message } from "../models/Message.js";
import { User } from "../models/User.js";
import path from "path";
import fs from "fs";

// Create a new voice note
export const createVoiceNote = async (req, res) => {
  try {
    const { title, duration, transcription, tags, visibility } = req.body;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Audio file is required",
      });
    }

    const audioUrl = `/uploads/audio/${req.file.filename}`;

    const voiceNote = new VoiceNote({
      userId,
      title,
      audioUrl,
      duration: parseFloat(duration),
      transcription: transcription || "",
      tags: tags ? tags.split(",").map(tag => tag.trim()) : [],
      visibility: visibility || "friends",
    });

    await voiceNote.save();
    await voiceNote.populate("userId", "username profilePic");

    res.status(201).json({
      success: true,
      message: "Voice note created successfully",
      data: voiceNote,
    });
  } catch (error) {
    console.error("Create voice note error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create voice note",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get user's voice notes
export const getUserVoiceNotes = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const voiceNotes = await VoiceNote.find({ userId })
      .populate("userId", "username profilePic")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await VoiceNote.countDocuments({ userId });

    res.status(200).json({
      success: true,
      data: {
        voiceNotes,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get voice notes error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch voice notes",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get feed of voice notes from friends
export const getVoiceNoteFeed = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findById(userId);
    const friendIds = user.friends || [];
    friendIds.push(userId); // Include user's own notes

    const voiceNotes = await VoiceNote.find({
      userId: { $in: friendIds },
      visibility: { $in: ["friends", "public"] },
    })
      .populate("userId", "username profilePic")
      .populate("comments.user", "username profilePic")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await VoiceNote.countDocuments({
      userId: { $in: friendIds },
      visibility: { $in: ["friends", "public"] },
    });

    res.status(200).json({
      success: true,
      data: {
        voiceNotes,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get voice note feed error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch voice note feed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Send voice message
export const sendVoiceMessage = async (req, res) => {
  try {
    const { recipient, groupId, duration } = req.body;
    const senderId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Audio file is required",
      });
    }

    const voiceUrl = `/uploads/audio/${req.file.filename}`;

    const message = new Message({
      sender: senderId,
      recipient: recipient || null,
      groupId: groupId || null,
      messageType: "voice",
      voiceUrl,
      voiceDuration: parseFloat(duration),
    });

    await message.save();
    await message.populate("sender", "username profilePic");

    res.status(201).json({
      success: true,
      message: "Voice message sent successfully",
      data: message,
    });
  } catch (error) {
    console.error("Send voice message error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send voice message",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get messages for a conversation
export const getMessages = async (req, res) => {
  try {
    const { recipientId, groupId } = req.query;
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    let query = {};

    if (groupId) {
      query.groupId = groupId;
    } else if (recipientId) {
      query.$or = [
        { sender: userId, recipient: recipientId },
        { sender: recipientId, recipient: userId },
      ];
    } else {
      return res.status(400).json({
        success: false,
        message: "Either recipientId or groupId is required",
      });
    }

    const messages = await Message.find(query)
      .populate("sender", "username profilePic")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        messages: messages.reverse(),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};