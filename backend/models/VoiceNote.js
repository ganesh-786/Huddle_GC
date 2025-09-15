import mongoose from "mongoose";

const voiceNoteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
    maxlength: 100,
  },
  audioUrl: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  transcription: {
    type: String,
    default: "",
  },
  tags: [{
    type: String,
    trim: true,
  }],
  visibility: {
    type: String,
    enum: ["private", "friends", "public"],
    default: "friends",
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    text: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const VoiceNote = mongoose.model("VoiceNote", voiceNoteSchema);