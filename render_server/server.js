


// server.js
import express from "express";
import cors from "cors";
import youtubedl from "youtube-dl-exec";
import YouTubeMusic from "youtube-music-api";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const ytmusic = new YouTubeMusic();
const log = (...args) => console.log(new Date().toISOString(), ...args);

let ytMusicInitialized = false;

// Initialize YouTube Music API
(async () => {
  try {
    log("Initializing YouTube Music API...");
    await ytmusic.initalize();
    ytMusicInitialized = true;
    log("✅ YouTube Music API initialized");
  } catch (err) {
    log("❌ Failed to initialize YouTube Music API:", err.message);
    log("⚠️ Continuing without YT Music API — artwork may be missing");
  }
})();

// ======================
// Enhanced Helpers
// ======================

// Resolve first YouTube video URL from search
async function getFirstVideoUrl(query) {
  try {
    const result = await youtubedl(`ytsearch1:${query}`, {
      getUrl: true,
      skipDownload: true,
      noWarnings: true,
    });
    return result;
  } catch (err) {
    throw new Error("No video found");
  }
}

// Enhanced audio URL extraction with multiple fallbacks
async function getAudioUrl(videoUrl, songName = "") {
  try {
    log(`🎵 Extracting audio for: "${songName}"`);
    
    const result = await youtubedl(videoUrl, {
      dumpSingleJson: true,
      skipDownload: true,
      noWarnings: true,
    });

    // Get all audio formats
    const audioFormats = result.formats?.filter(f => 
      f.acodec && f.acodec !== 'none' && f.url
    );

    log(`📊 Found ${audioFormats?.length || 0} audio formats for "${songName}"`);

    // Strategy 1: Prefer m4a audio-only
    let bestFormat = audioFormats?.find(f => 
      f.ext === 'm4a' && 
      f.vcodec === 'none' && 
      f.protocol === 'https'
    );

    // Strategy 2: Any audio-only format
    if (!bestFormat) {
      bestFormat = audioFormats?.find(f => 
        f.vcodec === 'none' && 
        f.protocol === 'https'
      );
    }

    // Strategy 3: Any audio format with https
    if (!bestFormat) {
      bestFormat = audioFormats?.find(f => 
        f.protocol === 'https' &&
        f.acodec !== 'none'
      );
    }

    // Strategy 4: First available audio format
    if (!bestFormat) {
      bestFormat = audioFormats?.[0];
    }

    if (bestFormat) {
      log(`✅ Successfully extracted audio for "${songName}": ${bestFormat.ext} format`);
      return bestFormat.url;
    }

    throw new Error("No suitable audio format found");

  } catch (err) {
    log(`❌ Audio extraction failed for "${songName}":`, err.message);
    
    // Final fallback attempt with simpler method
    try {
      const fallbackUrl = await youtubedl(videoUrl, {
        format: 'bestaudio[ext=m4a]/bestaudio',
        getUrl: true,
        skipDownload: true,
        noWarnings: true,
      });
      
      if (fallbackUrl) {
        log(`✅ Fallback method worked for "${songName}"`);
        return fallbackUrl;
      }
    } catch (fallbackErr) {
      log(`❌ Fallback also failed for "${songName}"`);
    }
    
    throw new Error("All audio extraction methods failed");
  }
}

// Get video metadata
async function getVideoMetadata(videoUrl) {
  try {
    const result = await youtubedl(videoUrl, {
      dumpSingleJson: true,
      skipDownload: true,
      noWarnings: true,
    });
    
    return {
      title: result.title || "Unknown",
      artist: result.uploader || "Unknown",
      thumbnail: result.thumbnail || "",
      duration: result.duration || 0,
      view_count: result.view_count || 0,
    };
  } catch (err) {
    return {
      title: "Unknown",
      artist: "Unknown", 
      thumbnail: "",
      duration: 0,
      view_count: 0,
    };
  }
}

// ======================
// fetchSong function (MUST BE DEFINED)
// ======================
const fetchSong = async (name, index) => {
  try {
    let track = { name, artist: { name: "Unknown" }, thumbnails: [], videoId: null };
    let youtube_url = null;
    let url = null;
    let metadata = {};

    // Try YT Music API for artwork and videoId
    if (ytMusicInitialized) {
      try {
        const searchRes = await ytmusic.search(name, "song");
        if (searchRes.content?.length) {
          track = searchRes.content[0];
          if (track.videoId) {
            youtube_url = `https://www.youtube.com/watch?v=${track.videoId}`;
            log(`🎯 Found YT Music match for "${name}": ${youtube_url}`);
          }
        }
      } catch (err) {
        log(`⚠️ YT Music search failed for "${name}":`, err.message);
      }
    }

    // If no YouTube URL from YT Music, search using yt-dlp
    if (!youtube_url) {
      try {
        youtube_url = await getFirstVideoUrl(name);
        log(`🔍 YT-DLP found video for "${name}": ${youtube_url}`);
      } catch (err) {
        log(`⚠️ Failed to get first video for "${name}":`, err.message);
      }
    }

    // Get direct audio URL and metadata
    if (youtube_url) {
      try {
        // Get metadata first
        metadata = await getVideoMetadata(youtube_url);
        
        // Then try to get audio URL
        url = await getAudioUrl(youtube_url, name);
      } catch (err) {
        log(`⚠️ Audio extraction failed for "${name}", but keeping metadata`);
        // Don't throw - we still have metadata
      }
    }

    // Artwork - priority: YT Music > video thumbnail
    let artwork = "";
    if (track.thumbnails?.length) {
      artwork = track.thumbnails[track.thumbnails.length - 1].url
        .replace(/w\d+-h\d+/, "w400-h400")
        .replace(/\/\d+$/, "/400");
    } else if (metadata.thumbnail) {
      artwork = metadata.thumbnail;
    }

    // Use metadata title/artist if YT Music didn't provide good data
    const finalTitle = track.name && track.name !== name ? track.name : (metadata.title || name);
    const finalArtist = track.artist?.name && track.artist.name !== "Unknown" ? track.artist.name : metadata.artist;

    return {
      id: index + 1,
      title: finalTitle,
      artist: finalArtist,
      artwork,
      youtube_url: youtube_url || `https://www.youtube.com/results?search_query=${encodeURIComponent(name)}`,
      url, // direct audio URL (might be null if extraction failed)
      duration: metadata.duration,
      has_audio: !!url,
      views: metadata.view_count,
    };
  } catch (err) {
    log(`❌ Error processing song "${name}":`, err.message);
    return { 
      id: index + 1, 
      title: name, 
      artist: "Unknown", 
      artwork: "", 
      youtube_url: "", 
      url: "", 
      error: true,
      error_message: err.message
    };
  }
};

// ======================
// Health Check
// ======================
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    ytMusicInitialized, 
    timestamp: new Date().toISOString() 
  });
});

// ======================
// /songs Route - Parallel Processing
// ======================
app.post("/songs", async (req, res) => {
  const songNames = req.body.songs;
  if (!songNames || !Array.isArray(songNames))
    return res.status(400).json({ error: "Missing or invalid songs array" });

  try {
    log(`🎵 Processing ${songNames.length} songs in parallel...`);

    // Process songs in parallel with concurrency control
    const processInBatches = async (items, batchSize = 4, delayBetweenBatches = 500) => {
      const results = [];
      
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        log(`🚀 Processing batch ${Math.floor(i/batchSize) + 1}: ${batch.map(s => `"${s}"`).join(', ')}`);
        
        const batchPromises = batch.map((name, batchIndex) => 
          fetchSong(name, i + batchIndex)
        );
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        // Extract successful results and log errors
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            log(`❌ Failed to process "${batch[index]}":`, result.reason);
            results.push({
              id: i + index + 1,
              title: batch[index],
              artist: "Unknown",
              artwork: "",
              youtube_url: "",
              url: "",
              error: true,
              error_message: result.reason?.message || "Unknown error"
            });
          }
        });
        
        // Add delay between batches but not after the last batch
        if (i + batchSize < items.length) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }
      }
      
      return results;
    };

    const results = await processInBatches(songNames, 4, 500);
    
    // Log summary statistics
    const successful = results.filter(r => r.url && !r.error).length;
    const withYoutube = results.filter(r => r.youtube_url && !r.error).length;
    const failed = results.filter(r => r.error).length;
    
    log(`📈 Final Summary: ${results.length} total, ${successful} with audio, ${withYoutube} with YouTube links, ${failed} failed`);
    
    res.json(results);
  } catch (err) {
    log("❌ Unexpected error in /songs:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ======================
// /yt_link_metadata Route - Enhanced
// ======================
app.post("/yt_link_metadata", async (req, res) => {
  const items = req.body.items;
  if (!items || !Array.isArray(items)) 
    return res.status(400).json({ error: "Missing or invalid items array" });

  const results = [];

  const fetchLinkMeta = async (item, index) => {
    const { yt_link, query } = item;
    try {
      log(`🔗 Processing YouTube link: ${yt_link}`);

      // Get video metadata and audio URL in parallel
      const [metadata, audioUrl] = await Promise.all([
        getVideoMetadata(yt_link),
        getAudioUrl(yt_link, query || "Unknown").catch(err => {
          log(`⚠️ Audio extraction failed for link, but continuing with metadata`);
          return null; // Return null instead of throwing
        })
      ]);

      // Artwork via YT Music (optional)
      let artwork = "";
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
          // Silently fail - use thumbnail from video metadata
        }
      }

      // Fallback to video thumbnail
      if (!artwork && metadata.thumbnail) {
        artwork = metadata.thumbnail;
      }

      return { 
        id: index + 1, 
        title: metadata.title, 
        artist: metadata.artist, 
        artwork, 
        youtube_url: yt_link, 
        url: audioUrl, // might be null if extraction failed
        duration: metadata.duration,
        has_audio: !!audioUrl,
        views: metadata.view_count,
      };
    } catch (err) {
      log(`❌ Error processing YouTube link "${yt_link}":`, err.message);
      return { 
        id: index + 1, 
        title: query || "Unknown", 
        artist: "Unknown", 
        artwork: "", 
        youtube_url: yt_link, 
        url: "", 
        error: true,
        error_message: err.message
      };
    }
  };

  try {
    // Process sequentially for better reliability
    for (let i = 0; i < items.length; i++) {
      log(`🔗 Processing link ${i + 1}/${items.length}`);
      const result = await fetchLinkMeta(items[i], i);
      results.push(result);
      
      if (i < items.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    }
    
    const successful = results.filter(r => r.url).length;
    log(`📈 Link processing: ${results.length} total, ${successful} with audio URLs`);
    
    res.json(results);
  } catch (err) {
    log("❌ Unexpected error in /yt_link_metadata:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ======================
// New Route: /extract-audio (for direct YouTube URL extraction)
// ======================
app.post("/extract-audio", async (req, res) => {
  const { youtube_url, song_name = "Unknown" } = req.body;
  
  if (!youtube_url) {
    return res.status(400).json({ error: "Missing youtube_url" });
  }

  try {
    log(`🎵 Direct audio extraction request: ${youtube_url}`);
    
    const [audioUrl, metadata] = await Promise.all([
      getAudioUrl(youtube_url, song_name),
      getVideoMetadata(youtube_url)
    ]);

    res.json({
      success: true,
      title: metadata.title,
      artist: metadata.artist,
      thumbnail: metadata.thumbnail,
      duration: metadata.duration,
      audio_url: audioUrl,
      youtube_url: youtube_url,
      views: metadata.view_count,
    });

  } catch (err) {
    log(`❌ Direct audio extraction failed:`, err.message);
    res.status(500).json({
      success: false,
      error: "Failed to extract audio",
      error_message: err.message,
      youtube_url: youtube_url
    });
  }
});

// ======================
// Start Server
// ======================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => log(`🚀 Server running on http://localhost:${PORT}`));
