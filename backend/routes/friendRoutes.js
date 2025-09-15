import express from "express";
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendRequests,
  getFriends,
  searchUsers,
} from "../controllers/friendController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/request", authenticateToken, sendFriendRequest);
router.post("/accept", authenticateToken, acceptFriendRequest);
router.post("/reject", authenticateToken, rejectFriendRequest);
router.get("/requests", authenticateToken, getFriendRequests);
router.get("/", authenticateToken, getFriends);
router.get("/search", authenticateToken, searchUsers);

export default router;