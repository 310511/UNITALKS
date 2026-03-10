# 📡 UniTalks — Random Chat Web App

A full-stack, real-time random chat application built with **React** (frontend) and **Node.js + Socket.IO** (backend). Users can connect anonymously with strangers via **text**, **voice**, or **video** — similar to Omegle.

---

## 📁 Project Structure

```
omegle_clone-main/
├── client/                  # React Frontend (port 3006)
│   ├── public/
│   ├── src/
│   │   ├── App.js           # Root router & app shell
│   │   ├── index.js         # ReactDOM entry point
│   │   ├── theme.js         # Global theme tokens
│   │   ├── webrtcConfig.js  # WebRTC / ICE config logic
│   │   ├── polyfills.js     # Browser polyfills
│   │   ├── components/      # Page-level and shared components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── constants/       # App-wide constants
│   │   └── lib/             # Utility libraries
│   ├── .env                 # Frontend environment variables
│   └── package.json
│
├── server/                  # Node.js Backend (port 5006)
│   ├── server.js            # Main Express + Socket.IO server
│   ├── routes/              # API route modules
│   ├── utils/               # redis.js, stateManager.js
│   └── .env                 # Backend environment variables
│
├── nginx/                   # Nginx config (for production)
├── coturn/                  # TURN server scripts
├── docker-compose.yml       # Docker orchestration
├── Dockerfile
└── package.json             # Root scripts (dev, build, etc.)
```

---

## 🚀 How to Run (Development)

### Prerequisites
- [Node.js](https://nodejs.org/) v16+
- npm

### Step 1 — Install All Dependencies
Run this once from the **root** of the project:
```bash
npm run install-all
```
This installs packages for the root, `client/`, and `server/` directories.

### Step 2 — Start Frontend + Backend Together
```bash
npm run dev
```
This uses `concurrently` to launch both servers at once:
| Service   | URL                       |
|-----------|--------------------------|
| Frontend  | http://localhost:3006     |
| Backend   | http://localhost:5006     |

---

## ⚙️ Environment Configuration

### `client/.env`
```env
PORT=3006
REACT_APP_SOCKET_URL=http://localhost:5006
REACT_APP_API_URL=http://localhost:5006/api
```
> `REACT_APP_SOCKET_URL` tells the frontend which backend server to connect its Socket.IO websocket to.
> `REACT_APP_API_URL` is used for HTTP API calls (ICE config, support form, etc.).

### `server/.env`
```env
NODE_ENV=development
PORT=5006
SOCKET_URL=http://localhost:5006
ALLOWED_ORIGINS=http://localhost:3006
```
> `PORT` sets which port the Express/Socket.IO server listens on.
> `ALLOWED_ORIGINS` configures CORS — must include your frontend URL.

---

## 🖥️ Frontend Deep Dive

### Entry Point — `App.js`

The root component wraps the entire app in a `BrowserRouter` and defines all client-side routes:

| Route          | Component     | Description                    |
|----------------|---------------|--------------------------------|
| `/`            | `Homepage`    | Landing page with chat options |
| `/start-chat`  | `StartChat`   | Mode selection (text/voice/video) |
| `/text`        | `TextChat`    | Anonymous text chat            |
| `/voice`       | `VoiceChat`   | Voice-only chat (WebRTC)       |
| `/video`       | `VideoChat`   | Full video + text chat (WebRTC)|
| `/privacy`     | `Privacy`     | Privacy policy page            |
| `/terms`       | `Terms`       | Terms of service               |
| `/about`       | `About`       | About page                     |
| `/help`        | `Help`        | Help center / FAQ              |

Styled via **styled-components** with a theme-aware `AppBackground` wrapper.

---

### Components

#### Page Components

| Component       | Purpose |
|----------------|---------|
| `Homepage.js`  | Landing page — shows online user count, mode selection, feature highlights |
| `StartChat.js` | Entry point before joining a chat mode |
| `TextChat.js`  | Full text chat UI — messaging, skip, partner matching via Socket.IO |
| `VoiceChat.js` | Voice chat — microphone streaming via WebRTC peer connection |
| `VideoChat.js` | Video chat — camera + mic streaming + text messaging side panel |

#### Chat Mode Breakdown

Each chat mode (`TextChat`, `VoiceChat`, `VideoChat`) contains its own sub-parts inside:

**`TextChatParts/`**
| File                    | Role |
|------------------------|------|
| `StyledComponents.js`  | All styled-components for the text chat layout |
| `MessageList.js`       | Renders the scrollable chat message history |
| `MessageInput.js`      | Text input box with emoji picker |
| `ConnectionButton.js`  | Connect / Next button |
| `SidebarControls.js`   | Sidebar with games, extras |
| `StatusArea.js`        | Shows partner status (connected, searching…) |
| `CallControls.js`      | Voice/video upgrade buttons |
| `WatchAlongContainer.js` | YouTube Watch Together container |

**`VideoChatParts/`**
| File                  | Role |
|----------------------|------|
| `VideoGrid.js`       | Dual video layout (local + remote streams) |
| `VideoControls.js`   | Mute / camera toggle controls |
| `SidebarControls.js` | Text sidebar for video mode |
| `StyledComponents.js`| All styled-components for video mode |
| `ConnectionButton.js`| Connect / Skip button |
| `StatusArea.js`      | Connection status indicator |

**`VoiceChatParts/`** — mirrors the above but for voice-only mode.

---

#### Common / Shared Components (`common-components/`)

These are reused across all chat modes:

| Component               | Description |
|------------------------|-------------|
| `Header.js`            | App top navigation bar |
| `Footer.js`            | Page footer with links |
| `ChatHeader.js`        | In-chat top bar with mode label |
| `NameHeader.js`        | Displays user's anonymous name |
| `Notification.js`      | Toast notification system |
| `SearchOverlay.js`     | Full-screen "Searching for partner…" overlay |
| `ConnectingPreview.js` | Preview while establishing connection |
| `StopButton.js`        | Large stop/disconnect button |
| `SidebarControls.js`   | Generic sidebar shell for games/extras |
| `CameraButton.js`      | Toggle camera on/off |
| `SpeakingButtonVideo.js` / `SpeakingButtonVoice.js` | Visual mic activity indicators |
| `ReportBugModal.js`    | In-app bug report form |
| `StickmanScene.js`     | Animated stickman illustration |
| `WatchAlong.js`        | YouTube Watch Together feature |
| `MusicTogether.js`     | Spotify-style music sync feature |
| **Games** | |
| `GameChess.js`         | Full in-chat chess game |
| `GameTicTacToe.js`     | Tic-Tac-Toe mini game |
| `GameRPS.js`           | Rock Paper Scissors game |
| `GameTruthOrDare.js`   | Truth or Dare game |
| `GameSidebarButton.js` | Button to open game sidebar |

---

### Custom Hooks (`hooks/`)

| Hook                        | Description |
|-----------------------------|-------------|
| `useWebRTC.js`              | Core WebRTC peer connection — manages offer/answer/ICE candidate exchange, media streams, connection state, and quality monitoring |
| `useChatQueue.js`           | Manages user join/leave from chat queue via Socket.IO |
| `useRandomOnlineCount.js`   | Subscribes to server's `userCount` event and displays live online user count |
| `useAdSense.js`             | Loads Google AdSense script (optional ad support) |

---

### WebRTC Configuration — `webrtcConfig.js`

The WebRTC layer is fully abstracted with multi-tier fallback strategy:

```
1. Dynamic ICE credentials fetched from server /api/ice-config   ← preferred
        ↓ (if fails)
2. Static STUN fallback (Google STUN servers)                    ← always works
        ↓ (optional extra)
3. TURN server with TCP + TLS fallback                           ← needed behind strict NATs
```

**Key exports:**
| Export                      | Use |
|----------------------------|-----|
| `getRtcConfig(options)`    | Main function — returns a complete `RTCConfiguration` object |
| `fetchIceConfig()`         | Fetches time-limited TURN credentials from the server |
| `refreshTurnCredentials()` | Refreshes credentials before they expire |
| `createConnectionMonitor()` | Attaches event listeners to track ICE state, connection state, and active candidate pair |

**WebRTC config options:**
```js
getRtcConfig({
  useDynamicCredentials: true,   // Fetch ICE config from server
  iceTransportPolicy: 'all',     // 'all' or 'relay'
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require',
  iceCandidatePoolSize: 4
})
```

---

### Constants — `constants/index.js`

Central store for all magic values used across the frontend, including:
- Socket reconnect delay timers
- Peer connection timeout durations
- Message max length limits
- Chat mode identifiers

---

## 🔌 Backend Summary

The `server/server.js` is a single-file **Express + Socket.IO** server with the following responsibilities:

| Feature                 | Implementation |
|------------------------|----------------|
| HTTP API               | Express.js     |
| Real-time signaling    | Socket.IO      |
| User matching          | Background batch matcher (every 250ms) |
| State management       | `utils/stateManager.js` — Redis-first, in-memory fallback |
| Security               | `helmet`, `cors`, `express-rate-limit`, socket event rate limiter |
| Clustering             | Node.js `cluster` module (production only) |
| Graceful shutdown      | `SIGTERM` / `SIGINT` handlers |

### Key Socket.IO Events

| Event              | Direction       | Description |
|-------------------|-----------------|-------------|
| `joinQueue`       | Client → Server | Join matching queue for a mode |
| `match`           | Server → Client | Partner found — includes `partnerId` and `initiator` flag |
| `signal`          | Client ↔ Server | WebRTC SDP/ICE signaling relay |
| `message`         | Client ↔ Server | Text message relay |
| `leaveChat`       | Client → Server | Leave current chat |
| `partnerSkipped`  | Client → Server | Skip current partner |
| `partnerDisconnected` | Server → Client | Partner left |
| `userCount`       | Server → Client | Live online user count broadcast |

---

## 🔧 Troubleshooting

### WebSocket connection errors in browser console
```
WebSocket connection to 'ws://localhost:3006/socket.io/...' failed
```
**Cause:** The frontend is trying to connect the socket to its own port (3006) instead of the backend (5006).  
**Fix:** Make sure `client/.env` has:
```env
REACT_APP_SOCKET_URL=http://localhost:5006
```
Then **restart** the dev server so React picks up the new environment variable.

---

### `EADDRINUSE` port already in use
```
Error: listen EADDRINUSE: address already in use :::5006
```
**Cause:** A previous Node.js process is still holding the port.  
**Fix (PowerShell):**
```powershell
Stop-Process -Name node -Force
```
Then run `npm run dev` again.

---

### Port 3000 / 3006 already in use (frontend)
The frontend port is set via `PORT=3006` in `client/.env` and hardcoded into `client/package.json`:
```json
"start": "set PORT=3006 && react-scripts start"
```
Change `3006` to any free port if needed. Make sure to update `ALLOWED_ORIGINS` in `server/.env` to match.

---

## 📦 NPM Scripts Reference

| Script              | What it does |
|--------------------|--------------|
| `npm run dev`      | Start backend (nodemon) + frontend (react-scripts) simultaneously |
| `npm run install-all` | Install all packages across root, client, and server |
| `npm run build`    | Build the React production bundle |
| `npm run start`    | Start backend only (production mode) |
| `npm run serve:prod` | Build + copy client build to server + start production server |

---

*Last updated: 2026-03-06*
