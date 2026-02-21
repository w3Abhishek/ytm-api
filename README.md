<p align="center">
  <img src="https://img.shields.io/badge/YouTube_Music-API-FF0000?style=for-the-badge&logo=youtube-music&logoColor=white" alt="YouTube Music API">
</p>

<h1 align="center">YouTube Music API</h1>

<p align="center">
  A lightweight, serverless YouTube Music API that serves clean, standardized JSON.<br>
  Search songs, videos, artists, albums, podcasts — and get lyrics.
</p>

<p align="center">
  <a href="https://deploy.workers.cloudflare.com/?url=https://github.com/w3Abhishek/ytm-api"><img src="https://deploy.workers.cloudflare.com/button" alt="Deploy to Cloudflare Workers"></a>
  &nbsp;
  <a href="https://vercel.com/new/clone?repository-url=https://github.com/w3Abhishek/ytm-api"><img src="https://vercel.com/button" alt="Deploy with Vercel"></a>
  &nbsp;
  <a href="https://app.netlify.com/start/deploy?repository=https://github.com/w3Abhishek/ytm-api"><img src="https://www.netlify.com/img/deploy/button.svg" alt="Deploy to Netlify"></a>
</p>

---

## ✨ Features

- **9 Search Types** — Songs, videos, artists, albums, podcasts, episodes, profiles, community playlists
- **Lyrics** — Full song lyrics by video ID
- **Standardized Schema** — Consistent field names, empty strings for missing data
- **CORS Enabled** — Use from any frontend
- **Zero Config** — No API keys, no authentication
- **Interactive Playground** — Built-in web UI to test the API live
- **Swagger UI** — Themed API documentation included

## 🚀 Quick Start

```bash
git clone https://github.com/w3Abhishek/ytm-api.git
cd ytm-api
npm install
npm run dev
# → http://localhost:8787
```

## 📡 Endpoints

### `GET /search`

| Param | Required | Description |
|-------|----------|-------------|
| `q` | ✅ | Search query |
| `type` | ❌ | `all` `songs` `videos` `artists` `albums` `podcasts` `podcast_episodes` `profiles` `community_playlists` |

```bash
curl "https://your-api.dev/search?q=espresso+sabrina+carpenter&type=songs"
```

<details>
<summary><b>Response — Songs</b></summary>

```json
{
  "success": true,
  "query": "espresso sabrina carpenter",
  "type": "songs",
  "results": [
    {
      "type": "song",
      "title": "Espresso",
      "videoId": "kIft-LUHHVA",
      "artist": "Sabrina Carpenter",
      "artistId": "UCz51ZodJbYUNfkdPHOjJKKw",
      "album": "Short n' Sweet",
      "albumId": "MPREb_FN2r5jrFXVm",
      "duration": "2:56",
      "plays": "1.3B plays",
      "thumbnails": [
        { "url": "https://...", "width": 60, "height": 60 },
        { "url": "https://...", "width": 120, "height": 120 }
      ]
    }
  ]
}
```
</details>

<details>
<summary><b>Response — Videos</b></summary>

```json
{
  "type": "video",
  "title": "Espresso",
  "videoId": "eVli-tstM5E",
  "channel": "Sabrina Carpenter",
  "channelId": "UCz51ZodJbYUNfkdPHOjJKKw",
  "views": "552M views",
  "duration": "3:21",
  "thumbnails": [...]
}
```
</details>

<details>
<summary><b>Response — Artists</b></summary>

```json
{
  "type": "artist",
  "name": "Sabrina Carpenter",
  "browseId": "UCz51ZodJbYUNfkdPHOjJKKw",
  "subscribers": "253M monthly audience",
  "thumbnails": [...]
}
```
</details>

<details>
<summary><b>Response — Albums</b></summary>

```json
{
  "type": "album",
  "title": "Short n' Sweet",
  "browseId": "MPREb_FN2r5jrFXVm",
  "albumType": "Album",
  "artist": "Sabrina Carpenter",
  "artistId": "UCz51ZodJbYUNfkdPHOjJKKw",
  "year": "2024",
  "playlistId": "OLAK5uy_mClbGHSx...",
  "thumbnails": [...]
}
```
</details>

### `GET /lyrics/:videoId`

```bash
curl "https://your-api.dev/lyrics/kIft-LUHHVA"
```

```json
{
  "success": true,
  "videoId": "kIft-LUHHVA",
  "browseId": "MPLYt_FN2r5jrFXVm-7",
  "lyrics": "Now he's thinkin' 'bout me\nEvery night, oh\n..."
}
```

## 🏗️ Deploy

### Cloudflare Workers

```bash
npm run deploy:cf
```

### Vercel

```bash
npx vercel
```

### Netlify

```bash
npx netlify deploy
```

## 👤 Author

**Abhishek Verma**

- [𝕏 @pyvrma](https://x.com/pyvrma)
- [GitHub @w3Abhishek](https://github.com/w3Abhishek)
- [☕ Buy me a coffee](https://ko-fi.com/vrma)

## 📄 License

MIT
