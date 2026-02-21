/**
 * YouTube Music API Response Parsers
 *
 * Transforms the deeply nested YouTube Music internal API responses
 * into clean, standardized JSON objects. Every schema field is always
 * present — set to "" or null when unavailable.
 */

// ─── Helpers ────────────────────────────────────────────────────────

/**
 * Extract text runs from a flex column
 */
function getColumnRuns(item, colIndex) {
    return (
        item?.flexColumns?.[colIndex]
            ?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || []
    );
}

/**
 * Join all run texts in a column
 */
function getColumnText(item, colIndex) {
    return getColumnRuns(item, colIndex)
        .map((r) => r.text)
        .join("");
}

/**
 * Find a run that has a browseEndpoint matching a specific pageType
 */
function findRunByPageType(runs, pageType) {
    return runs.find(
        (r) =>
            r.navigationEndpoint?.browseEndpoint
                ?.browseEndpointContextSupportedConfigs
                ?.browseEndpointContextMusicConfig?.pageType === pageType
    );
}

/**
 * Find a run with any browseEndpoint
 */
function findRunWithBrowse(runs) {
    return runs.find((r) => r.navigationEndpoint?.browseEndpoint);
}

/**
 * Get plain text runs (no navigation) from a list of runs, filtering separators
 */
function getPlainTexts(runs) {
    return runs.filter(
        (r) =>
            !r.navigationEndpoint &&
            r.text.trim() !== "•" &&
            r.text.trim() !== ""
    );
}

/**
 * Extract thumbnail array
 */
function getThumbnails(item) {
    return (
        item?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.map(
            (t) => ({
                url: t.url,
                width: t.width,
                height: t.height,
            })
        ) || []
    );
}

/**
 * Get videoId from multiple possible locations
 */
function getVideoId(item) {
    return (
        item?.playlistItemData?.videoId ||
        item?.overlay?.musicItemThumbnailOverlayRenderer?.content
            ?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint
            ?.videoId ||
        getColumnRuns(item, 0)?.[0]?.navigationEndpoint?.watchEndpoint?.videoId ||
        null
    );
}

/**
 * Get playlistId from overlay
 */
function getPlaylistId(item) {
    const overlay = item?.overlay?.musicItemThumbnailOverlayRenderer?.content
        ?.musicPlayButtonRenderer?.playNavigationEndpoint;
    return (
        overlay?.watchPlaylistEndpoint?.playlistId ||
        overlay?.watchEndpoint?.playlistId ||
        null
    );
}

/**
 * Get browseId from item-level navigation endpoint
 */
function getItemBrowseId(item) {
    return item?.navigationEndpoint?.browseEndpoint?.browseId || null;
}

// ─── Type-specific Parsers ──────────────────────────────────────────

function parseSong(item) {
    const col1Runs = getColumnRuns(item, 1);
    const artistRun = findRunByPageType(col1Runs, "MUSIC_PAGE_TYPE_ARTIST");
    const albumRun = findRunByPageType(col1Runs, "MUSIC_PAGE_TYPE_ALBUM");
    const plainTexts = getPlainTexts(col1Runs);

    // Duration is the last plain text that looks like a time (contains ":")
    const durationRun = [...plainTexts].reverse().find((r) => r.text.includes(":"));
    // Plays is in column 2
    const playsText = getColumnText(item, 2);

    return {
        type: "song",
        title: getColumnRuns(item, 0)?.[0]?.text || "",
        videoId: getVideoId(item) || "",
        artist: artistRun?.text || "",
        artistId:
            artistRun?.navigationEndpoint?.browseEndpoint?.browseId || "",
        album: albumRun?.text || "",
        albumId:
            albumRun?.navigationEndpoint?.browseEndpoint?.browseId || "",
        duration: durationRun?.text || "",
        plays: playsText || "",
        thumbnails: getThumbnails(item),
    };
}

function parseVideo(item) {
    const col1Runs = getColumnRuns(item, 1);
    const channelRun = findRunByPageType(
        col1Runs,
        "MUSIC_PAGE_TYPE_USER_CHANNEL"
    ) || findRunByPageType(col1Runs, "MUSIC_PAGE_TYPE_ARTIST");
    const plainTexts = getPlainTexts(col1Runs);

    const durationRun = [...plainTexts].reverse().find((r) => r.text.includes(":"));
    const viewsRun = plainTexts.find(
        (r) => r.text.toLowerCase().includes("view") || r.text.toLowerCase().includes("play")
    );

    return {
        type: "video",
        title: getColumnRuns(item, 0)?.[0]?.text || "",
        videoId: getVideoId(item) || "",
        channel: channelRun?.text || "",
        channelId:
            channelRun?.navigationEndpoint?.browseEndpoint?.browseId || "",
        views: viewsRun?.text || "",
        duration: durationRun?.text || "",
        thumbnails: getThumbnails(item),
    };
}

function parseArtist(item) {
    const col1Runs = getColumnRuns(item, 1);
    const plainTexts = getPlainTexts(col1Runs);
    // Subscribers/audience is the last plain text after "Artist"
    const subscribersRun = plainTexts.find(
        (r) => r.text !== "Artist"
    );

    return {
        type: "artist",
        name: getColumnRuns(item, 0)?.[0]?.text || "",
        browseId: getItemBrowseId(item) || "",
        subscribers: subscribersRun?.text || "",
        thumbnails: getThumbnails(item),
    };
}

function parseAlbum(item) {
    const col1Runs = getColumnRuns(item, 1);
    const artistRun = findRunByPageType(col1Runs, "MUSIC_PAGE_TYPE_ARTIST");
    const plainTexts = getPlainTexts(col1Runs);

    // First plain text is the album type (Album, EP, Single)
    const albumType = plainTexts[0]?.text || "";
    // Last plain text is the year
    const year = plainTexts[plainTexts.length - 1]?.text || "";

    return {
        type: "album",
        title: getColumnRuns(item, 0)?.[0]?.text || "",
        browseId: getItemBrowseId(item) || "",
        albumType: albumType,
        artist: artistRun?.text || "",
        artistId:
            artistRun?.navigationEndpoint?.browseEndpoint?.browseId || "",
        year: year,
        playlistId: getPlaylistId(item) || "",
        thumbnails: getThumbnails(item),
    };
}

function parsePodcast(item) {
    const col1Runs = getColumnRuns(item, 1);
    const publisherRun = findRunWithBrowse(col1Runs);

    return {
        type: "podcast",
        title: getColumnRuns(item, 0)?.[0]?.text || "",
        browseId: getItemBrowseId(item) || "",
        publisher: publisherRun?.text || "",
        publisherId:
            publisherRun?.navigationEndpoint?.browseEndpoint?.browseId || "",
        playlistId: getPlaylistId(item) || "",
        thumbnails: getThumbnails(item),
    };
}

function parsePodcastEpisode(item) {
    const col0Runs = getColumnRuns(item, 0);
    const col1Runs = getColumnRuns(item, 1);
    const plainTexts = getPlainTexts(col1Runs);
    const showRun = findRunByPageType(
        col1Runs,
        "MUSIC_PAGE_TYPE_PODCAST_SHOW_DETAIL_PAGE"
    );

    return {
        type: "podcast_episode",
        title: col0Runs?.[0]?.text || "",
        browseId:
            col0Runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || "",
        videoId: getVideoId(item) || "",
        date: plainTexts[0]?.text || "",
        show: showRun?.text || "",
        showId:
            showRun?.navigationEndpoint?.browseEndpoint?.browseId || "",
        thumbnails: getThumbnails(item),
    };
}

function parseProfile(item) {
    const col1Runs = getColumnRuns(item, 1);
    const plainTexts = getPlainTexts(col1Runs);
    // Handle is the last plain text (e.g. @username)
    const handleRun = plainTexts.find((r) => r.text.startsWith("@"));

    return {
        type: "profile",
        name: getColumnRuns(item, 0)?.[0]?.text || "",
        browseId: getItemBrowseId(item) || "",
        handle: handleRun?.text || "",
        thumbnails: getThumbnails(item),
    };
}

function parseCommunityPlaylist(item) {
    const col1Runs = getColumnRuns(item, 1);
    const creatorRun = findRunWithBrowse(col1Runs);
    const plainTexts = getPlainTexts(col1Runs);
    const viewsRun = plainTexts.find(
        (r) => r.text.toLowerCase().includes("view")
    );

    return {
        type: "community_playlist",
        title: getColumnRuns(item, 0)?.[0]?.text || "",
        browseId: getItemBrowseId(item) || "",
        creator: creatorRun?.text || "",
        creatorId:
            creatorRun?.navigationEndpoint?.browseEndpoint?.browseId || "",
        views: viewsRun?.text || "",
        playlistId: getPlaylistId(item) || "",
        thumbnails: getThumbnails(item),
    };
}

// ─── Parser Selection ───────────────────────────────────────────────

const PARSERS_BY_TYPE = {
    songs: parseSong,
    videos: parseVideo,
    artists: parseArtist,
    albums: parseAlbum,
    podcasts: parsePodcast,
    podcast_episodes: parsePodcastEpisode,
    profiles: parseProfile,
    community_playlists: parseCommunityPlaylist,
};

/**
 * Detect the result type from the shelf title or item content
 */
function detectTypeFromShelfTitle(title) {
    const map = {
        Songs: "songs",
        Videos: "videos",
        Artists: "artists",
        Albums: "albums",
        Podcasts: "podcasts",
        Episodes: "podcast_episodes",
        Profiles: "profiles",
        "Community playlists": "community_playlists",
    };
    return map[title] || null;
}

/**
 * Detect type from item structure (fallback for 'all' search results)
 */
function detectTypeFromItem(item) {
    const col1Runs = getColumnRuns(item, 1);
    const firstText = col1Runs[0]?.text?.toLowerCase() || "";

    if (firstText === "song" || firstText.includes("song")) return "songs";
    if (firstText === "video" || firstText.includes("video")) return "videos";
    if (firstText === "artist") return "artists";
    if (firstText === "album" || firstText === "ep" || firstText === "single") return "albums";
    if (firstText === "podcast") return "podcasts";
    if (firstText === "profile") return "profiles";

    // Check for community playlist by pageType
    const itemPageType =
        item?.navigationEndpoint?.browseEndpoint
            ?.browseEndpointContextSupportedConfigs
            ?.browseEndpointContextMusicConfig?.pageType;
    if (itemPageType === "MUSIC_PAGE_TYPE_PLAYLIST") return "community_playlists";
    if (itemPageType === "MUSIC_PAGE_TYPE_PODCAST_SHOW_DETAIL_PAGE") return "podcasts";

    // Songs often have 3 flex columns and a videoId
    if (item.flexColumns?.length === 3 && getVideoId(item)) return "songs";
    // Videos have watchEndpoint in col 0 and 2 columns
    if (item.flexColumns?.length === 2 && getVideoId(item)) return "videos";

    return null;
}

// ─── Top Result Parser (musicCardShelfRenderer) ─────────────────────

function parseTopResult(card) {
    const title = card.title?.runs?.map((r) => r.text).join("") || "";
    const subtitleRuns = card.subtitle?.runs || [];
    const subtitleText = subtitleRuns.map((r) => r.text).join("");

    // Determine type from subtitle
    const firstSubtitleWord = subtitleRuns[0]?.text?.toLowerCase() || "";
    let resultType = "unknown";
    if (firstSubtitleWord.includes("song")) resultType = "song";
    else if (firstSubtitleWord.includes("video")) resultType = "video";
    else if (firstSubtitleWord.includes("artist")) resultType = "artist";
    else if (firstSubtitleWord.includes("album")) resultType = "album";
    else if (firstSubtitleWord.includes("playlist")) resultType = "community_playlist";

    const result = {
        type: resultType,
        title,
        subtitle: subtitleText,
        videoId:
            card.onTap?.watchEndpoint?.videoId || "",
        browseId:
            card.onTap?.browseEndpoint?.browseId || "",
        thumbnails: (
            card.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || []
        ).map((t) => ({ url: t.url, width: t.width, height: t.height })),
    };

    // Parse sub-items within the top result card
    const subItems = [];
    for (const content of card.contents || []) {
        const subItem = content?.musicResponsiveListItemRenderer;
        if (subItem) {
            const itemType = detectTypeFromItem(subItem);
            const parser = PARSERS_BY_TYPE[itemType];
            if (parser) {
                subItems.push(parser(subItem));
            }
        }
    }
    if (subItems.length > 0) {
        result.more = subItems;
    }

    return result;
}

// ─── Main Parser Entry Point ────────────────────────────────────────

/**
 * Parse a YouTube Music search API response
 * @param {object} rawResponse - Raw API response
 * @param {string} searchType - The search type used (all, songs, videos, etc.)
 * @returns {{ results: Array, topResult?: object }}
 */
export function parseSearchResponse(rawResponse, searchType) {
    const tabs =
        rawResponse?.contents?.tabbedSearchResultsRenderer?.tabs;
    if (!tabs || tabs.length === 0) {
        return { results: [] };
    }

    const contents =
        tabs[0]?.tabRenderer?.content?.sectionListRenderer?.contents;
    if (!contents || contents.length === 0) {
        return { results: [] };
    }

    const output = { results: [] };

    for (const section of contents) {
        // Handle top result card (only in 'all' type)
        if (section.musicCardShelfRenderer) {
            output.topResult = parseTopResult(section.musicCardShelfRenderer);
            continue;
        }

        // Handle regular shelf
        if (section.musicShelfRenderer) {
            const shelf = section.musicShelfRenderer;
            const shelfTitle =
                shelf.title?.runs?.map((r) => r.text).join("") || "";
            const items = shelf.contents || [];

            for (const content of items) {
                const item = content?.musicResponsiveListItemRenderer;
                if (!item) continue;

                // Determine the type of this item
                let itemType;
                if (searchType !== "all") {
                    // For filtered searches, use the search type directly
                    itemType = searchType;
                } else {
                    // For 'all' search, detect from shelf title or item content
                    itemType =
                        detectTypeFromShelfTitle(shelfTitle) ||
                        detectTypeFromItem(item);
                }

                const parser = PARSERS_BY_TYPE[itemType];
                if (parser) {
                    output.results.push(parser(item));
                }
            }
        }
    }

    return output;
}
