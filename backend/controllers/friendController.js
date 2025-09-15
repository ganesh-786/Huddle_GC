import { User } from "../models/User.js";

// Send friend request
export const sendFriendRequest = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const senderId = req.user.id;

    if (senderId === recipientId) {
      return res.status(400).json({
        success: false,
        message: "Cannot send friend request to yourself",
      });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if already friends
    if (recipient.friends.includes(senderId)) {
      return res.status(400).json({
        success: false,
        message: "Already friends with this user",
      });
    }

    // Check if request already exists
    const existingRequest = recipient.friendRequests.find(
      (req) => req.from.toString() === senderId
    );

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "Friend request already sent",
      });
    }

    // Add friend request
    recipient.friendRequests.push({
      from: senderId,
      status: "pending",
    });

    await recipient.save();

    res.status(200).json({
      success: true,
      message: "Friend request sent successfully",
    });
  } catch (error) {
    console.error("Send friend request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send friend request",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Accept friend request
export const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    const friendRequest = user.friendRequests.id(requestId);

    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        message: "Friend request not found",
      });
    }

    const friendId = friendRequest.from;

    // Add each other as friends
    user.friends.push(friendId);
    user.friendRequests.pull(requestId);

    const friend = await User.findById(friendId);
    friend.friends.push(userId);

    await Promise.all([user.save(), friend.save()]);

    res.status(200).json({
      success: true,
      message: "Friend request accepted",
    });
  } catch (error) {
    console.error("Accept friend request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to accept friend request",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Reject friend request
export const rejectFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    user.friendRequests.pull(requestId);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Friend request rejected",
    });
  } catch (error) {
    console.error("Reject friend request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject friend request",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get friend requests
export const getFriendRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).populate(
      "friendRequests.from",
      "username email profilePic"
    );

    res.status(200).json({
      success: true,
      data: user.friendRequests,
    });
  } catch (error) {
    console.error("Get friend requests error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch friend requests",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get friends list
export const getFriends = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).populate(
      "friends",
      "username email profilePic bio"
    );

    res.status(200).json({
      success: true,
      data: user.friends,
    });
  } catch (error) {
    console.error("Get friends error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch friends",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Search users
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user.id;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters",
      });
    }

    const users = await User.find({
      _id: { $ne: userId },
      $or: [
        { username: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    })
      .select("username email profilePic bio")
      .limit(20);

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search users",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};