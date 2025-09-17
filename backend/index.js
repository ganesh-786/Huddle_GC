import express from "express";
import dotenv from "dotenv";
import { createServer } from "http";
import path from "path";
import usersRouter from "./routes/route.js";
import voiceRoutes from "./routes/voiceRoutes.js";
import friendRoutes from "./routes/friendRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import { Database } from "./config/db.js";
import cors from "cors";
import { login, register } from "./controllers/authController.js";
import { initializeSocket } from "./socket/socketHandler.js";
dotenv.config();

const PORT = process.env.PORT || 8080;
const app = express();
const server = createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

// Middleware to parse JSON bodies
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  })
);

// Serve static files for audio uploads
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/users", usersRouter);
app.use("/api/voice", voiceRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/messages", messageRoutes);
app.post("/register", register);
app.post("/login", login);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// // // 404 handler
// app.use("*", (req, res) => {
//   res.status(404).json({
//     success: false,
//     message: "Route not found",
//   });
// });

Database()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`📁 Uploads directory: ${path.resolve("uploads")}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to database:", err);
    process.exit(1);
  });
