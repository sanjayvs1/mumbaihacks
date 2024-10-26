import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import multer from "multer";
import Recording from "./models/Recording.js"; // Ensure this model has appropriate fields for your needs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

mongoose
  .connect(
    "mongodb+srv://mavinash422:BQxMw3c2SDG2tJLh@cluster0.ohvzw.mongodb.net/Mumbaihacks"
  )
  .then(() => console.log("MongoDB Connected Successfully"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

const upload = multer();
const recordingsDir = path.join(__dirname, "recordings");

if (!fs.existsSync(recordingsDir)) {
  fs.mkdirSync(recordingsDir);
}

app.get("/", (req, res) => {
  res.send("Mumbai hacks is hacked...");
});

app.post("/storeRecording", upload.single("recording"), async (req, res) => {
  try {
    const { timestamp } = req.body;
    const recordingData = req.file?.buffer;

    if (!recordingData) {
      return res.status(400).json({ error: "No recording data provided" });
    }

    const newRecording = new Recording({
      timestamp: new Date(timestamp),
      data: recordingData,
    });

    await newRecording.save();
    res.status(200).json({ message: "Recording saved successfully" });
  } catch (error) {
    console.error("Error saving recording:", error);
    res.status(500).json({ error: "Failed to save recording" });
  }
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("audio-visual-data", (data) => {
    const { timestamp, audioChunk, videoChunk } = data;

    // Create filenames based on timestamp
    const audioFileName = `audio-${timestamp}.webm`;
    const videoFileName = `video-${timestamp}.webm`;

    // Paths for the audio and video files
    const audioFilePath = path.join(recordingsDir, audioFileName);
    const videoFilePath = path.join(recordingsDir, videoFileName);

    // Append audio data to file
    fs.appendFile(audioFilePath, Buffer.from(audioChunk), (err) => {
      if (err) {
        console.error("Failed to save audio data:", err);
      } else {
        console.log(`Saved audio chunk at ${timestamp}`);
      }
    });

    // Append video data to file
    fs.appendFile(videoFilePath, Buffer.from(videoChunk), (err) => {
      if (err) {
        console.error("Failed to save video data:", err);
      } else {
        console.log(`Saved video chunk at ${timestamp}`);
      }
    });
  });

  // Handle signaling
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
