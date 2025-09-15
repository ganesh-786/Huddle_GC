import express from "express";
import dotenv from "dotenv";
import { createServer } from "http";
import path from "path";
import router from "./routes/route.js";
import voiceRoutes from "./routes/voiceRoutes.js";
import friendRoutes from "./routes/friendRoutes.js";
import { Database } from "./config/db.js";
import cors from "cors";
import { login, register } from "./controllers/authController.js";
import { initializeSocket } from "./socket/socketHandler.js";
dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();
const server = createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors());

// Serve static files for audio uploads
app.use('/uploads', express.static('uploads'));

// Routes
app.use("/api/users", router);
app.use("/api/voice", voiceRoutes);
app.use("/api/friends", friendRoutes);
app.post("/register", register);
app.post("/login", login);

Database()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`app running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to database:", err);
    process.exit(1);
  });
