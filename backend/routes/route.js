import express from "express";
import { userNavigate } from "../controllers/controller.js";

const router = express.Router();

router.get("/", userNavigate);
// // Catch-all for any subpath to avoid path-to-regexp errors
// router.get("*", (req, res) => {
//   res.status(404).json({ success: false, message: "User route not found" });
// });

export default router;
