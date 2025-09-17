import { Message } from "../models/Message.js";
import { User } from "../models/User.js";

// Send text message
export const sendTextMessage = async (req, res) => {
  try {
    const { recipient, groupId, content } = req.body;
    const senderId = req.user.id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Message content is required",
      });
    }

    // Verify recipient exists if it's a direct message
    if (recipient && !groupId) {
      const recipientUser = await User.findById(recipient);
      if (!recipientUser) {
        return res.status(404).json({
          success: false,
          message: "Recipient not found",
        });
      }
    }

    const message = new Message({
      sender: senderId,
      recipient: recipient || null,
      groupId: groupId || null,
      content: content.trim(),
      messageType: "text",
    });

    await message.save();
    await message.populate("sender", "username profilePic");

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    console.error("Send text message error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get conversation history
export const getConversationHistory = async (req, res) => {
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
      .populate("recipient", "username profilePic")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments(query);

    // Mark messages as read if they're for the current user
    if (recipientId) {
      await Message.updateMany(
        { sender: recipientId, recipient: userId, isRead: false },
        { isRead: true }
      );
    }

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
    console.error("Get conversation history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch conversation history",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get all conversations for a user
export const getUserConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all messages where user is sender or recipient
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { recipient: userId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ["$sender", userId] }, "$recipient", "$sender"],
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$recipient", userId] },
                    { $eq: ["$isRead", false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "otherUser",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "lastMessage.sender",
          foreignField: "_id",
          as: "lastMessage.sender",
        },
      },
      {
        $addFields: {
          "lastMessage.sender": { $arrayElemAt: ["$lastMessage.sender", 0] },
        },
      },
      {
        $sort: { "lastMessage.createdAt": -1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    console.error("Get user conversations error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch conversations",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Delete message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Only sender can delete their message
    if (message.sender.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own messages",
      });
    }

    await Message.findByIdAndDelete(messageId);

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Delete message error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete message",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
