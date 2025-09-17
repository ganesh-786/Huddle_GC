import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      "Please enter a valid email",
    ],
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  profilePic: {
    type: String,
    default: null,
  },
  bio: {
    type: String,
    maxlength: 200,
    default: "",
  },

  friends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],

  friendRequests: [
    {
      from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  subscription: {
    plan: {
      type: String,
      enum: ["free", "pro"],
      default: "free",
    },
    validUntil: {
      type: Date,
      default: null,
    },
  },

  // Additional user info
  isOnline: {
    type: Boolean,
    default: false,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
userSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ "friendRequests.from": 1 });

export const User = mongoose.model("User", userSchema);
