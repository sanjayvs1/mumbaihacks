import express from 'express';
import multer from 'multer';
import { exec } from 'child_process';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name from the current module URL
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.static("public"));
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Specify the folder to store uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to the original file name
  },
});

const upload = multer({ storage });

const apiKey = "AIzaSyB10nBDi5qt-_vMxAvoQ4QpR0VZeOayFOk";
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

app.use(express.json());

const outputDir = path.join(__dirname, "output");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}
app.get("/", (req, res) => {
  res.send(`
        <h2>Upload Video File</h2>
        <form action="/upload" method="POST" enctype="multipart/form-data">
            <input type="file" name="video" accept="video/*" required>
            <button type="submit">Upload</button>
        </form>
    `);
});

app.get("/video/:filename", (req, res) => {
  const filePath = path.join(__dirname, "uploads", req.params.filename);
  res.sendFile(filePath);
});

app.post("/summary", async (req, res) => {
  const { mId } = req.body;
  const filePath = path.join(__dirname, "output", `${mId}.csv`);

  let content;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    console.error("Error reading the file:", err);
  }
  const finalPrompt = `give me a summary of the meeting in the JSON format mentioned below
  {summary:"", topItems:""}
  topItems should be a list of top 5 actions items mentioned in the meeting transcript
  ${content}`;
  try {
    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });
    let result = await chatSession.sendMessage(finalPrompt);
    result = result.response.text().trim();
    if (result.startsWith("```json")) {
      result = result.slice(7, -3);
    }
    res.json(JSON.parse(result));
  } catch (error) {
    console.log(error);
  }
});

app.post("/video_search", async (req, res) => {
  const { mId, query } = req.body;
  const filePath = path.join(__dirname, "output", `${mId}.csv`);

  let content;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    console.error("Error reading the file:", err);
  }
  const finalPrompt = `Make sense of the transcript and find where the query "${query}" in talked about in the meeting transcript and return the result in the json format mentioned below and nothing else
  return startTime as 0 if the query is not found
  {startTime:""}
  Transcript: ${content}`;
  try {
    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });
    let result = await chatSession.sendMessage(finalPrompt);
    result = result.response.text().trim();
    if (result.startsWith("```json")) {
      result = result.slice(7, -3);
    }
    res.json(JSON.parse(result));
  } catch (error) {
    console.log(error);
  }
});

app.post("/video_summary", async (req, res) => {
  const { mId } = req.body;
  const filePath = path.join(__dirname, "output", `${mId}.csv`);

  let content;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    console.error("Error reading the file:", err);
  }
  const finalPrompt = `Generate the most important parts of the meeting in the json format mentioned below and nothing else
  JSON: [{id:1,start_time:"",end_time:""},{id:2,start_time:"",end_time:""},{id:3,start_time:"",end_time:""}]
  Transcript: ${content}`;
  try {
    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });
    let result = await chatSession.sendMessage(finalPrompt);
    result = result.response.text().trim();
    if (result.startsWith("```json")) {
      result = result.slice(7, -3);
    }
    console.log(result);
    res.json(JSON.parse(result));
  } catch (error) {
    console.log(error);
  }
});

app.get("/videos", (req, res) => {
  const uploads = path.join(__dirname, "uploads");
  const files = fs.readdirSync(uploads);
  const videoFiles = files.filter((file) => file.endsWith(".mp4"));
  res.json(videoFiles);
});

app.post("/upload", upload.single("video"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const inputPath = path.join(__dirname, req.file.path);
  const mId = path.parse(inputPath).name;
  const outputFilePath = path.join(outputDir, `${mId}.wav`);
  console.log("Output Path:", outputFilePath);
  // Ensure the output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  exec(
    `ffmpeg -i ${inputPath} -ar 16000 -ac 1 ${outputFilePath}`,
    (err, stdout, stderr) => {
      if (err) {
        // node couldn't execute the command
        return;
      }
      // the *entire* stdout and stderr (buffered)
      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);
    }
  );
  console.log("File uploaded successfully");
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
