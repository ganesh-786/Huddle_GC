import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  groupId: {
    type: String,
  },
  content: {
    type: String,
  },
  messageType: {
    type: String,
    enum: ["text", "voice", "image"],
    default: "text",
  },
  voiceUrl: {
    type: String,
  },
  voiceDuration: {
    type: Number,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Message = mongoose.model("Message", messageSchema);