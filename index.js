// server.js
import express from "express";
import cors from "cors";
import { exec } from "child_process";

const app = express();
app.use(cors({ origin: '*' }));

                                                                                     
app.get("/audio", (req, res) => {
  const videoUrl = req.query.url;
  console.log("Received request with video URL:", videoUrl);  // Log the incoming request

  if (!videoUrl) {
    return res.status(400).json({ error: "Missing url parameter" });
  }

  // yt-dlp command to extract best audio stream URL
  exec(`yt-dlp -f bestaudio -g "${videoUrl}"`, (error, stdout, stderr) => {
    if (error) {
      console.error("yt-dlp error:", stderr);
      return res.status(500).json({ error: "Failed to fetch audio URL" });
    }

    const audioUrl = stdout.trim();
    res.json({ audioUrl });
    console.log("Audio URL sent:", audioUrl);  // Log the audio URL sent
    console.log("done:");  // Log the audio URL sent
  });
});


const PORT = 4000;                                                    
app.listen(PORT, () => {            
  console.log(`Server running on http://localhost:${PORT}`);
});
