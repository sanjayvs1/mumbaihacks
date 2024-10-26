import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Schema Definitions
const recordingSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  status: { type: String, enum: ["active", "completed"], default: "active" },
  chunks: [
    {
      timestamp: { type: Date, required: true },
      path: { type: String, required: true },
      size: { type: Number }, // Size in bytes
    },
  ],
});

const RecordingSession = mongoose.model(
  "RecordingSession",
  recordingSessionSchema
);

// Express setup
const app = express();
app.use(express.json());
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// MongoDB connection
mongoose
  .connect(
    "mongodb+srv://mavinash422:BQxMw3c2SDG2tJLh@cluster0.ohvzw.mongodb.net/Mumbaihacks"
  )
  .then(() => console.log("MongoDB Connected Successfully"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const sessionId = req.body.sessionId;
    const sessionDir = path.join(__dirname, "recordings", sessionId);

    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }
    cb(null, sessionDir);
  },
  filename: (req, file, cb) => {
    const timestamp = new Date().toISOString().replace(/:/g, "-");
    cb(null, `chunk-${timestamp}.webm`);
  },
});

const upload = multer({ storage });

// API Routes
app.get("/", (req, res) => {
  res.send("Mumbai hacks is hacked...");
});

// Store the entire recording
app.post("/api/recordings/upload", upload.single("video"), async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No video data provided" });
    }

    // Initialize or update the recording session
    const session = await RecordingSession.findOneAndUpdate(
      { sessionId },
      {
        $set: {
          endTime: new Date(), // Set end time
          status: "completed", // Mark as completed
        },
        $push: {
          chunks: {
            timestamp: new Date(),
            path: req.file.path,
            size: req.file.size, // Size in bytes
          },
        },
      },
      { new: true, upsert: true } // Create if it doesn't exist
    );

    res.status(200).json({ message: "Video uploaded successfully", session });
  } catch (error) {
    console.error("Failed to upload video:", error);
    res.status(500).json({ error: "Failed to upload video" });
  }
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("signal", (data) => {
    console.log("Signaling data received from", socket.id);
    socket.broadcast.emit("signal", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });

  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
