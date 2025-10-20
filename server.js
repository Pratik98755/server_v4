// // server.js
// import express from "express";
// import cors from "cors";
// import { exec } from "child_process";
// import YouTubeMusic from "youtube-music-api";

// const app = express();
// app.use(cors({ origin: "*" }));
// app.use(express.json());

// const ytmusic = new YouTubeMusic();

// // Initialize once on startup
// (async () => {
//   await ytmusic.initalize();
//   console.log("YouTube Music API initialized");
// })();

// /**
//  * Helper: Get audio URL from YouTube using yt-dlp
//  */
// // function getAudioUrl(videoUrl) {
// //   return new Promise((resolve, reject) => {
// //     exec(`yt-dlp -f bestaudio[ext=m4a] -g "${videoUrl}"`, (error, stdout, stderr) => {
// //       if (error) {
// //         console.error("yt-dlp error:", stderr);
// //         return reject("Failed to fetch audio URL");
// //       }
// //       resolve(stdout.trim());
// //     });
// //   });
// // }

// function getAudioUrl(videoUrl, songName = "") {
//   return new Promise((resolve, reject) => {
//     exec(
//       `yt-dlp -f bestaudio[ext=m4a]/bestaudio --dump-single-json "${videoUrl}"`,
//       (error, stdout, stderr) => {
//         if (error || !stdout) {
//           console.error(`❌ yt-dlp error for "${songName}":`, stderr);
//           return reject("Failed to fetch audio info");
//         }

//         try {
//           const data = JSON.parse(stdout);
//           const format = data.requested_formats
//             ? data.requested_formats[0]
//             : data.formats?.find((f) => f.url === data.url) || data.formats?.[0];

//           const chosenFormat = format || {};
//           console.log("\n🎵 Song:", songName);
//           console.log("🎧 yt-dlp FORMAT INFO:");
//           console.log({
//             id: chosenFormat.format_id,
//             ext: chosenFormat.ext,
//             acodec: chosenFormat.acodec,
//             abr: chosenFormat.abr,
//             protocol: chosenFormat.protocol,
//             url: chosenFormat.url?.slice(0, 80) + "...",
//           });

//           // Prefer direct HTTPS m4a only
//           const m4a = data.formats?.find(
//             (f) => f.ext === "m4a" && f.protocol === "https"
//           );
//           if (!m4a) return reject("No direct m4a format found");

//           resolve(m4a.url);
//         } catch (e) {
//           console.error(`⚠️ JSON parse error for "${songName}":`, e);
//           reject("Failed to parse yt-dlp output");
//         }
//       }
//     );
//   });
// }






// /**
//  * POST /songs
//  * Body: { songs: ["khairiyat", "ishq mein sachet tandon", "tera mera pyar"] }
//  * Returns: [{ id, title, artist, cover, youtube_url, mp3_link }]
//  */
// app.post("/songs", async (req, res) => {
//   const songNames = req.body.songs;
//   if (!songNames || !Array.isArray(songNames)) {
//     return res.status(400).json({ error: "Missing or invalid songs array" });
//   }

//   const results = [];

//   // Helper to fetch a single song
//   const fetchSong = async (name, index) => {
//     try {
//       const searchRes = await ytmusic.search(name, "song");
//       const tracks = searchRes.content || [];
//       if (!tracks.length) return null;

//       let track = null;
//       let url = null;
//       let youtube_url = null;

//       // Try top 3 YouTube results for reliability
//       for (let i = 0; i < Math.min(3, tracks.length); i++) {
//         track = tracks[i];
//         youtube_url = `https://www.youtube.com/watch?v=${track.videoId}`;
//         try {
//           const audioUrl = await getAudioUrl(youtube_url,name);
//           if (audioUrl) {
//             url = audioUrl;
//             break;
//           }
//         } catch (err) {
//           console.warn(`Attempt ${i + 1} failed for "${name}": ${err}`);
//         }
//       }

//       if (!track) return null;

//       const artwork =
//         track.thumbnails?.length > 0
//           ? track.thumbnails[track.thumbnails.length - 1].url
//               .replace(/w\d+-h\d+/, "w400-h400")
//               .replace(/\/\d+$/, "/400")
//           : "";

//       return {
//         id: index + 1,
//         title: track.name,
//         artist: track.artist?.name || "Unknown",
//         artwork,
//         youtube_url,
//         url,
//       };
//     } catch (err) {
//       console.error(`Error fetching "${name}":`, err.message);
//       return null;
//     }
//   };

//   // Run 4 searches in parallel (batched)
//   const batchSize = 4;
//   for (let i = 0; i < songNames.length; i += batchSize) {
//     const batch = songNames
//       .slice(i, i + batchSize)
//       .map((name, idx) => fetchSong(name, i + idx));
//     const batchResults = await Promise.all(batch);
//     results.push(...batchResults.filter(Boolean));
//   }

//   res.json(results);
// });

// const PORT = 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });














































































// // server.js
// import express from "express";
// import cors from "cors";
// import { exec } from "child_process";
// import YouTubeMusic from "youtube-music-api";

// const app = express();
// app.use(cors({ origin: "*" }));
// app.use(express.json());

// const ytmusic = new YouTubeMusic();

// // Initialize once on startup
// (async () => {
//   await ytmusic.initalize();
//   console.log("YouTube Music API initialized");
// })();

// /**
//  * Helper: Get audio URL from YouTube using yt-dlp
//  */
// function getAudioUrl(videoUrl, songName = "") {
//   return new Promise((resolve, reject) => {
//     exec(
//       `yt-dlp -f bestaudio[ext=m4a]/bestaudio --dump-single-json "${videoUrl}"`,
//       (error, stdout, stderr) => {
//         if (error || !stdout) {
//           console.error(`❌ yt-dlp error for "${songName}":`, stderr);
//           return reject("Failed to fetch audio info");
//         }

//         try {
//           const data = JSON.parse(stdout);
//           const m4a = data.formats?.find(
//             (f) => f.ext === "m4a" && f.protocol === "https"
//           );
//           if (!m4a) return reject("No direct m4a format found");
//           resolve(m4a.url);
//         } catch (e) {
//           console.error(`⚠️ JSON parse error for "${songName}":`, e);
//           reject("Failed to parse yt-dlp output");
//         }
//       }
//     );
//   });
// }

// /**
//  * POST /songs
//  * Body: { songs: ["khairiyat", "ishq mein sachet tandon", "tera mera pyar"] }
//  * Returns: [{ id, title, artist, artwork, youtube_url, url }]
//  */
// app.post("/songs", async (req, res) => {
//   const songNames = req.body.songs;
//   if (!songNames || !Array.isArray(songNames)) {
//     return res.status(400).json({ error: "Missing or invalid songs array" });
//   }

//   const results = [];

//   const fetchSong = async (name, index) => {
//     try {
//       const searchRes = await ytmusic.search(name, "song");
//       const tracks = searchRes.content || [];
//       if (!tracks.length) return null;

//       let track = null;
//       let url = null;
//       let youtube_url = null;

//       for (let i = 0; i < Math.min(3, tracks.length); i++) {
//         track = tracks[i];
//         youtube_url = `https://www.youtube.com/watch?v=${track.videoId}`;
//         try {
//           const audioUrl = await getAudioUrl(youtube_url, name);
//           if (audioUrl) {
//             url = audioUrl;
//             break;
//           }
//         } catch (err) {
//           console.warn(`Attempt ${i + 1} failed for "${name}": ${err}`);
//         }
//       }

//       if (!track) return null;

//       const artwork =
//         track.thumbnails?.length > 0
//           ? track.thumbnails[track.thumbnails.length - 1].url
//               .replace(/w\d+-h\d+/, "w400-h400")
//               .replace(/\/\d+$/, "/400")
//           : "";

//       return {
//         id: index + 1,
//         title: track.name,
//         artist: track.artist?.name || "Unknown",
//         artwork,
//         youtube_url,
//         url,
//       };
//     } catch (err) {
//       console.error(`Error fetching "${name}":`, err.message);
//       return null;
//     }
//   };

//   const batchSize = 4;
//   for (let i = 0; i < songNames.length; i += batchSize) {
//     const batch = songNames
//       .slice(i, i + batchSize)
//       .map((name, idx) => fetchSong(name, i + idx));
//     const batchResults = await Promise.all(batch);
//     results.push(...batchResults.filter(Boolean));
//   }

//   res.json(results);
// });




// /**
//  * POST /yt_link_metadata
//  * Body: { links: ["https://www.youtube.com/watch?v=xxxx", "https://youtu.be/yyyy"] }
//  * Returns: [{ id, title, artist, artwork, youtube_url, url }]
//  */

// app.post("/yt_link_metadata", async (req, res) => {
//   const links = req.body.links;
//   if (!links || !Array.isArray(links)) {
//     return res.status(400).json({ error: "Missing or invalid links array" });
//   }

//   const results = [];

//   const fetchLinkMeta = async (link, index) => {
//     try {
//       // 1️⃣ Extract info using yt-dlp (title, artist/uploader, playable URL)
//       const info = await new Promise((resolve, reject) => {
//         exec(
//           `yt-dlp -f bestaudio[ext=m4a]/bestaudio --dump-single-json "${link}"`,
//           (error, stdout, stderr) => {
//             if (error || !stdout) {
//               console.error(`❌ yt-dlp error for ${link}:`, stderr);
//               return reject("Failed to fetch metadata");
//             }
//             try {
//               const data = JSON.parse(stdout);
//               const title = data.title || "Unknown Title";
//               const artist = data.uploader || "Unknown Artist";

//               const m4a = data.formats?.find(
//                 (f) => f.ext === "m4a" && f.protocol === "https"
//               );
//               const url = m4a?.url || data.url;

//               resolve({ title, artist, url });
//             } catch (err) {
//               reject("Failed to parse yt-dlp output");
//             }
//           }
//         );
//       });

//       // 2️⃣ Fetch artwork using YouTube Music API via yt-dlp title
//       let artwork = "";
//       try {
//         const searchRes = await ytmusic.search(info.title, "song");
//         const tracks = searchRes.content || [];
//         const track = tracks[0]; // top result
//         if (track?.thumbnails?.length > 0) {
//           artwork = track.thumbnails[track.thumbnails.length - 1].url
//             .replace(/w\d+-h\d+/, "w400-h400")
//             .replace(/\/\d+$/, "/400");
//         }
//       } catch (err) {
//         console.warn(`⚠️ Failed to fetch artwork for "${info.title}": ${err.message}`);
//       }

//       return {
//         id: index + 1,
//         title: info.title,
//         artist: info.artist,
//         artwork,
//         youtube_url: link,
//         url: info.url,
//       };
//     } catch (err) {
//       console.error(`Error processing ${link}:`, err);
//       return null;
//     }
//   };

//   // Run in batches for efficiency
//   const batchSize = 4;
//   for (let i = 0; i < links.length; i += batchSize) {
//     const batch = links
//       .slice(i, i + batchSize)
//       .map((link, idx) => fetchLinkMeta(link, i + idx));
//     const batchResults = await Promise.all(batch);
//     results.push(...batchResults.filter(Boolean));
//   }

//   res.json(results);
// });


























































// // server.js
// import express from "express";
// import cors from "cors";
// import { exec } from "child_process";
// import YouTubeMusic from "youtube-music-api";

// const app = express();
// app.use(cors({ origin: "*" }));
// app.use(express.json());

// const ytmusic = new YouTubeMusic();

// // Debug: helper to log with timestamp
// const log = (...args) => console.log(new Date().toISOString(), ...args);

// // Initialize YouTube Music API
// (async () => {
//   try {
//     log("Initializing YouTube Music API...");
//     await ytmusic.initalize();
//     log("YouTube Music API initialized ✅");
//   } catch (err) {
//     log("❌ Failed to initialize YouTube Music API:", err);
//   }
// })();

// // Helper: Get audio URL from YouTube using yt-dlp
// function getAudioUrl(videoUrl, songName = "") {
//   return new Promise((resolve, reject) => {
//     exec(
//       `yt-dlp -f bestaudio[ext=m4a]/bestaudio --dump-single-json "${videoUrl}"`,
//       (error, stdout, stderr) => {
//         if (error || !stdout) {
//           log(`❌ yt-dlp error for "${songName}" (${videoUrl}):`, stderr);
//           return reject("Failed to fetch audio info");
//         }
//         try {
//           const data = JSON.parse(stdout);
//           const m4a = data.formats?.find(f => f.ext === "m4a" && f.protocol === "https");
//           if (!m4a) return reject("No direct m4a format found");
//           resolve(m4a.url);
//         } catch (e) {
//           log(`⚠️ JSON parse error for "${songName}" (${videoUrl}):`, e);
//           reject("Failed to parse yt-dlp output");
//         }
//       }
//     );
//   });
// }

// // Debug version: /songs route
// app.post("/songs", async (req, res) => {
//   log("POST /songs called with body:", req.body);
//   const songNames = req.body.songs;
//   if (!songNames || !Array.isArray(songNames)) {
//     log("❌ Invalid songs array");
//     return res.status(400).json({ error: "Missing or invalid songs array" });
//   }

//   const results = [];

//   const fetchSong = async (name, index) => {
//     log(`Fetching song: "${name}"`);
//     try {
//       const searchRes = await ytmusic.search(name, "song");
//       const tracks = searchRes.content || [];
//       if (!tracks.length) {
//         log(`❌ No tracks found for "${name}"`);
//         return null;
//       }

//       let track = null;
//       let url = null;
//       let youtube_url = null;

//       for (let i = 0; i < Math.min(3, tracks.length); i++) {
//         track = tracks[i];
//         youtube_url = `https://www.youtube.com/watch?v=${track.videoId}`;
//         try {
//           const audioUrl = await getAudioUrl(youtube_url, name);
//           if (audioUrl) {
//             url = audioUrl;
//             break;
//           }
//         } catch (err) {
//           log(`⚠️ Attempt ${i + 1} failed for "${name}": ${err}`);
//         }
//       }

//       if (!track) return null;

//       const artwork =
//         track.thumbnails?.length > 0
//           ? track.thumbnails[track.thumbnails.length - 1].url
//               .replace(/w\d+-h\d+/, "w400-h400")
//               .replace(/\/\d+$/, "/400")
//           : "";

//       return {
//         id: index + 1,
//         title: track.name,
//         artist: track.artist?.name || "Unknown",
//         artwork,
//         youtube_url,
//         url,
//       };
//     } catch (err) {
//       log(`❌ Error fetching "${name}":`, err);
//       return null;
//     }
//   };

//   try {
//     const batchSize = 4;
//     for (let i = 0; i < songNames.length; i += batchSize) {
//       const batch = songNames.slice(i, i + batchSize).map((name, idx) => fetchSong(name, i + idx));
//       const batchResults = await Promise.all(batch);
//       results.push(...batchResults.filter(Boolean));
//     }
//     log("Finished fetching songs. Returning results.");
//     res.json(results);
//   } catch (err) {
//     log("❌ Unexpected error in /songs:", err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// // Debug version: /yt_link_metadata route with query field
// app.post("/yt_link_metadata", async (req, res) => {
//   log("POST /yt_link_metadata called with body:", req.body);
//   const items = req.body.items;
//   if (!items || !Array.isArray(items)) {
//     log("❌ Invalid items array");
//     return res.status(400).json({ error: "Missing or invalid items array" });
//   }

//   const results = [];

//   const fetchLinkMeta = async (item, index) => {
//     const { yt_link, query } = item;
//     log(`Fetching metadata for link: ${yt_link} with query: "${query}"`);
//     try {
//       // yt-dlp metadata
//       const info = await new Promise((resolve, reject) => {
//         exec(
//           `yt-dlp -f bestaudio[ext=m4a]/bestaudio --dump-single-json "${yt_link}"`,
//           (error, stdout, stderr) => {
//             if (error || !stdout) {
//               log(`❌ yt-dlp error for ${yt_link}:`, stderr);
//               return reject("Failed to fetch metadata");
//             }
//             try {
//               const data = JSON.parse(stdout);
//               const title = data.title || "Unknown Title";
//               const artist = data.uploader || "Unknown Artist";
//               const m4a = data.formats?.find(f => f.ext === "m4a" && f.protocol === "https");
//               const url = m4a?.url || data.url;
//               resolve({ title, artist, url });
//             } catch (err) {
//               reject("Failed to parse yt-dlp output");
//             }
//           }
//         );
//       });

//       // Artwork via YouTube Music using query
//       let artwork = "";
//       if (query) {
//         try {
//           const searchRes = await ytmusic.search(query, "song");
//           const tracks = searchRes.content || [];
//           const track = tracks[0]; // top result
//           if (track?.thumbnails?.length > 0) {
//             artwork = track.thumbnails[track.thumbnails.length - 1].url
//               .replace(/w\d+-h\d+/, "w400-h400")
//               .replace(/\/\d+$/, "/400");
//           }
//         } catch (err) {
//           log(`⚠️ Failed to fetch artwork for query "${query}":`, err);
//         }
//       }

//       return {
//         id: index + 1,
//         title: info.title,
//         artist: info.artist,
//         artwork,
//         youtube_url: yt_link,
//         url: info.url,
//       };
//     } catch (err) {
//       log(`❌ Error processing ${yt_link}:`, err);
//       return null;
//     }
//   };

//   try {
//     const batchSize = 4;
//     for (let i = 0; i < items.length; i += batchSize) {
//       const batch = items.slice(i, i + batchSize).map((item, idx) => fetchLinkMeta(item, i + idx));
//       const batchResults = await Promise.all(batch);
//       results.push(...batchResults.filter(Boolean));
//     }
//     log("Finished fetching metadata. Returning results.");
//     res.json(results);
//   } catch (err) {
//     log("❌ Unexpected error in /yt_link_metadata:", err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });








// server.js
import express from "express";
import cors from "cors";
import { exec } from "child_process";
import YouTubeMusic from "youtube-music-api";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const ytmusic = new YouTubeMusic();

// Debug: helper to log with timestamp
const log = (...args) => console.log(new Date().toISOString(), ...args);

// Initialize YouTube Music API with better error handling
let ytMusicInitialized = false;

(async () => {
  try {
    log("Initializing YouTube Music API...");
    await ytmusic.initalize(); // Note: there's a typo here - should be 'initialize'
    ytMusicInitialized = true;
    log("YouTube Music API initialized ✅");
  } catch (err) {
    log("❌ Failed to initialize YouTube Music API:", err.message);
    log("⚠️ Continuing without YouTube Music API - artwork fetching will be disabled");
  }
})();

// Helper: Get audio URL from YouTube using yt-dlp
function getAudioUrl(videoUrl, songName = "") {
  return new Promise((resolve, reject) => {
    exec(
      `yt-dlp -f bestaudio[ext=m4a]/bestaudio --dump-single-json "${videoUrl}"`,
      { timeout: 30000 }, // 30 second timeout
      (error, stdout, stderr) => {
        if (error || !stdout) {
          log(`❌ yt-dlp error for "${songName}" (${videoUrl}):`, stderr);
          return reject("Failed to fetch audio info");
        }
        try {
          const data = JSON.parse(stdout);
          const m4a = data.formats?.find(f => f.ext === "m4a" && f.protocol === "https");
          if (!m4a) return reject("No direct m4a format found");
          resolve(m4a.url);
        } catch (e) {
          log(`⚠️ JSON parse error for "${songName}" (${videoUrl}):`, e);
          reject("Failed to parse yt-dlp output");
        }
      }
    );
  });
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    ytMusicInitialized,
    timestamp: new Date().toISOString()
  });
});

// Debug version: /songs route
app.post("/songs", async (req, res) => {
  log("POST /songs called with body:", req.body);
  const songNames = req.body.songs;
  if (!songNames || !Array.isArray(songNames)) {
    log("❌ Invalid songs array");
    return res.status(400).json({ error: "Missing or invalid songs array" });
  }

  const results = [];

  const fetchSong = async (name, index) => {
    log(`Fetching song: "${name}"`);
    try {
      // Check if YouTube Music API is available
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
        log(`⚠️ No tracks found for "${name}" via YouTube Music, will try direct yt-dlp`);
        // Fallback: create a basic track object and try direct yt-dlp
        const fallbackTrack = {
          name: name,
          artist: { name: "Unknown" },
          videoId: null,
          thumbnails: []
        };
        tracks = [fallbackTrack];
      }

      let track = null;
      let url = null;
      let youtube_url = null;

      for (let i = 0; i < Math.min(3, tracks.length); i++) {
        track = tracks[i];
        
        // For fallback case where videoId is null, construct a search-based URL
        if (!track.videoId) {
          // Try to search for the video using yt-dlp search
          try {
            const searchUrl = `ytsearch:"${name}"`;
            const audioUrl = await getAudioUrl(searchUrl, name);
            if (audioUrl) {
              url = audioUrl;
              youtube_url = searchUrl;
              break;
            }
          } catch (err) {
            log(`⚠️ Direct search attempt failed for "${name}":`, err);
            continue;
          }
        } else {
          youtube_url = `https://www.youtube.com/watch?v=${track.videoId}`;
          try {
            const audioUrl = await getAudioUrl(youtube_url, name);
            if (audioUrl) {
              url = audioUrl;
              break;
            }
          } catch (err) {
            log(`⚠️ Attempt ${i + 1} failed for "${name}": ${err}`);
          }
        }
      }

      if (!track) return null;

      const artwork = track.thumbnails?.length > 0
        ? track.thumbnails[track.thumbnails.length - 1].url
            .replace(/w\d+-h\d+/, "w400-h400")
            .replace(/\/\d+$/, "/400")
        : "";

      return {
        id: index + 1,
        title: track.name || name,
        artist: track.artist?.name || "Unknown",
        artwork,
        youtube_url: youtube_url || `https://www.youtube.com/results?search_query=${encodeURIComponent(name)}`,
        url,
      };
    } catch (err) {
      log(`❌ Error fetching "${name}":`, err);
      return null;
    }
  };

  try {
    const batchSize = 2; // Reduced batch size for stability
    for (let i = 0; i < songNames.length; i += batchSize) {
      const batch = songNames.slice(i, i + batchSize).map((name, idx) => fetchSong(name, i + idx));
      const batchResults = await Promise.all(batch);
      results.push(...batchResults.filter(Boolean));
      // Small delay between batches
      if (i + batchSize < songNames.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    log(`✅ Finished fetching ${results.length} songs`);
    res.json(results);
  } catch (err) {
    log("❌ Unexpected error in /songs:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Debug version: /yt_link_metadata route with query field
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
    log(`Fetching metadata for link: ${yt_link} with query: "${query}"`);
    try {
      // yt-dlp metadata with timeout
      const info = await new Promise((resolve, reject) => {
        exec(
          `yt-dlp -f bestaudio[ext=m4a]/bestaudio --dump-single-json "${yt_link}"`,
          { timeout: 30000 },
          (error, stdout, stderr) => {
            if (error || !stdout) {
              log(`❌ yt-dlp error for ${yt_link}:`, error?.message || stderr);
              return reject("Failed to fetch metadata");
            }
            try {
              const data = JSON.parse(stdout);
              const title = data.title || "Unknown Title";
              const artist = data.uploader || "Unknown Artist";
              const m4a = data.formats?.find(f => f.ext === "m4a" && f.protocol === "https");
              const url = m4a?.url || data.url;

              // Thumbnail from yt-dlp as fallback
              const ytdlpThumbnail = data.thumbnail || "";

              if (!url) {
                return reject("No playable URL found");
              }

              resolve({ title, artist, url, ytdlpThumbnail });
            } catch (err) {
              reject("Failed to parse yt-dlp output");
            }
          }
        );
      });

      // Artwork via YouTube Music using query (only if API is initialized)
      let artwork = "";
      if (query && ytMusicInitialized) {
        try {
          const searchRes = await ytmusic.search(query, "song");
          const tracks = searchRes.content || [];
          const track = tracks[0]; // top result
          if (track?.thumbnails?.length > 0) {
            artwork = track.thumbnails[track.thumbnails.length - 1].url
              .replace(/w\d+-h\d+/, "w400-h400")
              .replace(/\/\d+$/, "/400");
          }
        } catch (err) {
          log(`⚠️ Failed to fetch artwork for query "${query}":`, err.message);
        }
      }

      // Fallback to yt-dlp thumbnail if no artwork from YT Music
      if (!artwork && info.ytdlpThumbnail) {
        artwork = info.ytdlpThumbnail;
      }

      const result = {
        id: index + 1,
        title: info.title,
        artist: info.artist,
        artwork,
        youtube_url: yt_link,
        url: info.url,
      };

      log(`✅ Successfully processed: ${info.title}`);
      return result;
    } catch (err) {
      log(`❌ Error processing ${yt_link}:`, err.message);
      // Return fallback instead of null
      return {
        id: index + 1,
        title: query || "Unknown Title",
        artist: "Unknown Artist",
        artwork: "",
        youtube_url: yt_link,
        url: "",
        error: true
      };
    }
  };

  try {
    const batchSize = 2; // Reduced batch size
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize).map((item, idx) => fetchLinkMeta(item, i + idx));
      const batchResults = await Promise.all(batch);
      results.push(...batchResults.filter(x => x !== null));
      
      // Delay between batches
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    log(`✅ Finished fetching metadata for ${results.length} items`);
    res.json(results);
  } catch (err) {
    log("❌ Unexpected error in /yt_link_metadata:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});





const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});