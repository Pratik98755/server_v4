// ===============================
// server.js — Render-ready version
// ===============================

import express from "express";
import cors from "cors";
import YouTubeMusic from "youtube-music-api";
import youtubedl from "youtube-dl-exec";

// ======================
// CONFIG
// ======================
const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const ytmusic = new YouTubeMusic();
let ytMusicInitialized = false;

const log = (...args) => console.log(new Date().toISOString(), ...args);

// ======================
// INIT YT MUSIC
// ======================
(async () => {
  try {
    log("Initializing YouTube Music API...");
    await ytmusic.initialize();
    ytMusicInitialized = true;
    log("✅ YouTube Music API initialized");
  } catch (err) {
    log("❌ Failed to initialize YouTube Music API:", err.message);
    log("⚠️ Continuing without YouTube Music API — artwork fetching disabled");
  }
})();

// ======================
// Helper: Get audio URL using youtube-dl-exec
// ======================
async function getAudioUrl(videoUrl, songName = "") {
  try {
    const data = await youtubedl(videoUrl, {
      dumpSingleJson: true,
      format: "bestaudio[ext=m4a]/bestaudio",
      noCheckCertificates: true,
      preferFreeFormats: true,
      addHeader: ["referer:youtube.com", "user-agent:googlebot"],
    });

    const m4a = data.formats?.find(f => f.ext === "m4a" && f.protocol === "https");
    if (!m4a) throw new Error("No direct m4a format found");

    return m4a.url;
  } catch (err) {
    log(`❌ yt-dlp error for "${songName}" (${videoUrl}):`, err.message);
    throw new Error("Failed to fetch audio info");
  }
}

// ======================
// HEALTH CHECK
// ======================
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    ytMusicInitialized,
    timestamp: new Date().toISOString(),
  });
});

// ======================
// /songs route
// ======================
app.post("/songs", async (req, res) => {
  log("POST /songs called with body:", req.body);
  const songNames = req.body.songs;
  if (!songNames || !Array.isArray(songNames)) {
    log("❌ Invalid songs array");
    return res.status(400).json({ error: "Missing or invalid songs array" });
  }

  const results = [];

  const fetchSong = async (name, index) => {
    log(`🎵 Fetching: "${name}"`);
    try {
      let tracks = [];

      if (ytMusicInitialized) {
        try {
          const searchRes = await ytmusic.search(name, "song");
          tracks = searchRes.content || [];
        } catch (err) {
          log(`⚠️ YouTube Music search failed for "${name}":`, err.message);
        }
      }

      if (!tracks.length) {
        tracks = [
          { name, artist: { name: "Unknown" }, videoId: null, thumbnails: [] },
        ];
      }

      let track = null;
      let url = null;
      let youtube_url = null;

      for (let i = 0; i < Math.min(3, tracks.length); i++) {
        track = tracks[i];
        if (!track) continue;

        youtube_url = track.videoId
          ? `https://www.youtube.com/watch?v=${track.videoId}`
          : `ytsearch:"${name}"`;

        try {
          const audioUrl = await getAudioUrl(youtube_url, name);
          if (audioUrl) {
            url = audioUrl;
            break;
          }
        } catch (err) {
          log(`⚠️ Attempt ${i + 1} failed for "${name}":`, err.message);
        }
      }

      const artwork = track?.thumbnails?.length
        ? track.thumbnails[track.thumbnails.length - 1].url
            .replace(/w\d+-h\d+/, "w400-h400")
            .replace(/\/\d+$/, "/400")
        : "";

      return {
        id: index + 1,
        title: track?.name || name,
        artist: track?.artist?.name || "Unknown",
        artwork,
        youtube_url:
          youtube_url ||
          `https://www.youtube.com/results?search_query=${encodeURIComponent(
            name
          )}`,
        url,
      };
    } catch (err) {
      log(`❌ Error fetching "${name}":`, err);
      return null;
    }
  };

  try {
    const batchSize = 2;
    for (let i = 0; i < songNames.length; i += batchSize) {
      const batch = songNames
        .slice(i, i + batchSize)
        .map((name, idx) => fetchSong(name, i + idx));
      const batchResults = await Promise.all(batch);
      results.push(...batchResults.filter(Boolean));
      if (i + batchSize < songNames.length)
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    log(`✅ Finished fetching ${results.length} songs`);
    res.json(results);
  } catch (err) {
    log("❌ Unexpected error in /songs:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ======================
// /yt_link_metadata route
// ======================
app.post("/yt_link_metadata", async (req, res) => {
  log("POST /yt_link_metadata called with body:", req.body);
  const items = req.body.items;
  if (!items || !Array.isArray(items)) {
    log("❌ Invalid items array");
    return res.status(400).json({ error: "Missing or invalid items array" });
  }

  const results = [];

  const fetchLinkMeta = async (item, index) => {
    const { yt_link, query } = item;
    log(`Fetching metadata for link: ${yt_link} (query: "${query}")`);

    try {
      const info = await youtubedl(yt_link, {
        dumpSingleJson: true,
        format: "bestaudio[ext=m4a]/bestaudio",
        noCheckCertificates: true,
      });

      const m4a = info.formats?.find(f => f.ext === "m4a" && f.protocol === "https");
      const url = m4a?.url || info.url;
      if (!url) throw new Error("No playable URL found");

      let artwork = info.thumbnail || "";

      if (query && ytMusicInitialized) {
        try {
          const searchRes = await ytmusic.search(query, "song");
          const track = searchRes.content?.[0];
          if (track?.thumbnails?.length) {
            artwork = track.thumbnails[track.thumbnails.length - 1].url
              .replace(/w\d+-h\d+/, "w400-h400")
              .replace(/\/\d+$/, "/400");
          }
        } catch (err) {
          log(`⚠️ Failed to fetch artwork for query "${query}":`, err.message);
        }
      }

      return {
        id: index + 1,
        title: info.title || query || "Unknown Title",
        artist: info.uploader || "Unknown Artist",
        artwork,
        youtube_url: yt_link,
        url,
      };
    } catch (err) {
      log(`❌ Error processing ${yt_link}:`, err.message);
      return {
        id: index + 1,
        title: query || "Unknown Title",
        artist: "Unknown Artist",
        artwork: "",
        youtube_url: yt_link,
        url: "",
        error: true,
      };
    }
  };

  try {
    const batchSize = 2;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items
        .slice(i, i + batchSize)
        .map((item, idx) => fetchLinkMeta(item, i + idx));
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);
      if (i + batchSize < items.length)
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    log(`✅ Finished fetching metadata for ${results.length} items`);
    res.json(results);
  } catch (err) {
    log("❌ Unexpected error in /yt_link_metadata:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ======================
// START SERVER
// ======================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
