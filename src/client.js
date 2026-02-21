/**
 * YouTube Music API Client
 * Handles communication with YouTube Music's internal youtubei API
 */

const YTM_BASE = "https://music.youtube.com/youtubei/v1";

const CLIENT_CONTEXT = {
    client: {
        clientName: "WEB_REMIX",
        clientVersion: "1.20260209.03.00",
    },
};

const CLIENT_CONTEXT_FULL = {
    client: {
        clientName: "WEB_REMIX",
        clientVersion: "1.20260209.03.00",
        browserName: "Chrome",
        browserVersion: "144.0.0.0",
    },
};

/**
 * Make a POST request to a YouTube Music API endpoint
 */
async function ytmFetch(endpoint, body) {
    const res = await fetch(`${YTM_BASE}/${endpoint}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        throw new Error(`YouTube Music API error: ${res.status} ${res.statusText}`);
    }

    return res.json();
}

// Search param IDs for each filter type
const SEARCH_PARAMS = {
    all: null,
    songs: "EgWKAQIIAWoSEAMQBRAEEBAQCRAVEAoQDhAR",
    artists: "EgWKAQIgAWoSEAMQBRAEEBAQCRAVEAoQDhAR",
    videos: "EgWKAQIQAWoSEAMQBRAEEBAQCRAVEAoQDhAR",
    podcast_episodes: "EgWKAQJIAWoSEAMQBRAEEBAQCRAVEAoQDhAR",
    albums: "EgWKAQIYAWoSEAMQBRAEEBAQCRAVEAoQDhAR",
    profiles: "EgWKAQJYAWoSEAMQBRAEEBAQCRAVEAoQDhAR",
    community_playlists:
        "EgeKAQQoAEABahIQAxAFEAQQEBAJEBUQChAOEBE%3D",
    podcasts: "EgWKAQJQAWoSEAMQBRAEEBAQCRAVEAoQDhAR",
};

/**
 * Search YouTube Music
 * @param {string} query - Search query
 * @param {string} type - Search type (all, songs, videos, artists, albums, podcasts, podcast_episodes, profiles, community_playlists)
 * @returns {object} Raw API response
 */
export async function search(query, type = "all") {
    const body = {
        context: CLIENT_CONTEXT,
        query,
    };

    const params = SEARCH_PARAMS[type];
    if (params) {
        body.params = params;
    }

    return ytmFetch("search", body);
}

/**
 * Get the lyrics browseId for a video
 * @param {string} videoId
 * @returns {string|null} browseId for lyrics
 */
export async function getLyricsBrowseId(videoId) {
    const body = {
        videoId,
        context: CLIENT_CONTEXT_FULL,
    };

    const data = await ytmFetch("next?prettyPrint=false", body);

    const browseId =
        data?.contents?.singleColumnMusicWatchNextResultsRenderer?.tabbedRenderer
            ?.watchNextTabbedResultsRenderer?.tabs?.[1]?.tabRenderer?.endpoint
            ?.browseEndpoint?.browseId;

    return browseId || null;
}

/**
 * Get lyrics content by browseId
 * @param {string} browseId
 * @returns {string|null} Lyrics text
 */
export async function getLyricsContent(browseId) {
    const body = {
        context: CLIENT_CONTEXT_FULL,
        browseId,
    };

    const data = await ytmFetch("browse", body);

    const lyrics =
        data?.contents?.sectionListRenderer?.contents?.[0]
            ?.musicDescriptionShelfRenderer?.description?.runs?.[0]?.text;

    return lyrics || null;
}

/**
 * Get lyrics for a video (combines both steps)
 * @param {string} videoId
 * @returns {{ lyrics: string|null, browseId: string|null }}
 */
export async function getLyrics(videoId) {
    const browseId = await getLyricsBrowseId(videoId);

    if (!browseId) {
        return { lyrics: null, browseId: null };
    }

    const lyrics = await getLyricsContent(browseId);
    return { lyrics, browseId };
}

export { SEARCH_PARAMS };
