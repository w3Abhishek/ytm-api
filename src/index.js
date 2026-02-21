/**
 * YouTube Music API — Main Entry Point
 *
 * Routes:
 *   GET  /                           Landing page (website)
 *   GET  /api/info                   API info (JSON)
 *   GET  /search?q=<query>&type=<t>  Search YTM
 *   GET  /lyrics/:videoId            Get lyrics
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { search, getLyrics, SEARCH_PARAMS } from "./client.js";
import { parseSearchResponse } from "./parsers.js";
import { PAGE_HTML } from "./page.js";

const app = new Hono();

// Enable CORS for all origins
app.use("*", cors());

// ─── Landing Page ────────────────────────────────────────────────────

app.get("/", (c) => {
    return c.html(PAGE_HTML);
});

// ─── OpenAPI Spec (for Swagger UI) ───────────────────────────────────

app.get("/public/openapi.json", (c) => {
    return c.json({
        openapi: "3.0.3",
        info: {
            title: "YouTube Music API",
            description: "Search YouTube Music and get lyrics — clean, standardized JSON.",
            version: "1.0.0",
            contact: { name: "Abhishek Verma", url: "https://github.com/w3Abhishek" },
        },
        servers: [{ url: "/" }],
        tags: [
            { name: "Search", description: "Search YouTube Music" },
            { name: "Lyrics", description: "Get song lyrics" },
        ],
        paths: {
            "/search": {
                get: {
                    tags: ["Search"],
                    summary: "Search YouTube Music",
                    description: "Search across songs, videos, artists, albums, podcasts, profiles and more.",
                    parameters: [
                        { name: "q", in: "query", required: true, description: "Search query", schema: { type: "string", example: "espresso sabrina carpenter" } },
                        { name: "type", in: "query", required: false, description: "Filter type", schema: { type: "string", enum: ["all", "songs", "videos", "artists", "albums", "podcasts", "podcast_episodes", "profiles", "community_playlists"], default: "all" } },
                    ],
                    responses: {
                        200: { description: "Search results", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, query: { type: "string" }, type: { type: "string" }, topResult: { type: "object" }, results: { type: "array", items: { type: "object" } } } } } } },
                        400: { description: "Missing or invalid parameters" },
                        500: { description: "Server error" },
                    },
                },
            },
            "/lyrics/{videoId}": {
                get: {
                    tags: ["Lyrics"],
                    summary: "Get song lyrics",
                    description: "Retrieve lyrics for a song using its YouTube video ID.",
                    parameters: [
                        { name: "videoId", in: "path", required: true, description: "YouTube video ID", schema: { type: "string", example: "kIft-LUHHVA" } },
                    ],
                    responses: {
                        200: { description: "Lyrics found", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, videoId: { type: "string" }, browseId: { type: "string" }, lyrics: { type: "string" } } } } } },
                        404: { description: "Lyrics not available" },
                        500: { description: "Server error" },
                    },
                },
            },
        },
    });
});

// ─── API Info ────────────────────────────────────────────────────────

app.get("/api/info", (c) => {
    return c.json({
        name: "YouTube Music API",
        version: "1.0.0",
        endpoints: {
            search: { method: "GET", path: "/search", params: { q: "Search query (required)", type: `Filter type (optional). Options: ${Object.keys(SEARCH_PARAMS).join(", ")}` }, example: "/search?q=espresso+sabrina+carpenter&type=songs" },
            lyrics: { method: "GET", path: "/lyrics/:videoId", params: { videoId: "YouTube video ID (required)" }, example: "/lyrics/kIft-LUHHVA" },
        },
    });
});

// ─── Search ──────────────────────────────────────────────────────────

app.get("/search", async (c) => {
    const query = c.req.query("q");
    const type = c.req.query("type") || "all";

    if (!query) return c.json({ success: false, error: "Missing required parameter: q" }, 400);
    if (!SEARCH_PARAMS.hasOwnProperty(type)) return c.json({ success: false, error: `Invalid type: "${type}". Valid types: ${Object.keys(SEARCH_PARAMS).join(", ")}` }, 400);

    try {
        const rawResponse = await search(query, type);
        const parsed = parseSearchResponse(rawResponse, type);
        return c.json({ success: true, query, type, ...parsed });
    } catch (err) {
        return c.json({ success: false, error: err.message }, 500);
    }
});

// ─── Lyrics ──────────────────────────────────────────────────────────

app.get("/lyrics/:videoId", async (c) => {
    const videoId = c.req.param("videoId");
    try {
        const { lyrics, browseId } = await getLyrics(videoId);
        if (!lyrics) return c.json({ success: false, error: "Lyrics not found for this video.", videoId }, 404);
        return c.json({ success: true, videoId, browseId, lyrics });
    } catch (err) {
        return c.json({ success: false, error: err.message }, 500);
    }
});

// ─── 404 & Error ─────────────────────────────────────────────────────

app.notFound((c) => c.json({ success: false, error: "Endpoint not found. Visit / for available endpoints." }, 404));
app.onError((err, c) => { console.error("Error:", err); return c.json({ success: false, error: "Internal server error" }, 500); });

export default app;
