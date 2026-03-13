const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const cluster = require('cluster');
const os = require('os');
require('dotenv').config();
const iceConfigRoutes = require('./routes/iceConfig');

const app = express();

// Behind Cloud Run/Proxies
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Allowed origins (comma-separated list). If empty, allow all origins without credentials.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// Security and performance middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  permissionsPolicy: {
    features: {
      "camera": ["self"],
      "microphone": ["self"],
      "display-capture": ["self"],
      "fullscreen": ["self"]
    }
  },
  frameguard: false
}));
app.use(compression());

// Configure CORS for Express
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true
}));

// Cache static assets aggressively (hashed filenames), but not HTML
app.use(express.static(path.join(__dirname, 'client/build'), {
  index: false,
  etag: true,
  maxAge: '1y',
  setHeaders: (res, filePath) => {
    if (path.extname(filePath) === '.html') {
      res.setHeader('Cache-Control', 'no-store');
    }
  }
}));
app.use(express.json({ limit: '1mb' }));

const server = http.createServer(app);

// Configure Socket.IO CORS
const socketCorsOrigin = allowedOrigins.length > 0 ? allowedOrigins : '*';
const io = new Server(server, {
  cors: {
    origin: socketCorsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  perMessageDeflate: false, // Performance: Disable compression to save CPU/RAM at scale
  transports: ['websocket'], // CRITICAL: avoid polling (no sticky sessions)
  allowUpgrades: false,
  allowEIO3: false,
  pingTimeout: 90000,        // Resilience: Longer timeout for event loop lag under load
  pingInterval: 25000,
  connectTimeout: 45000,
  maxHttpBufferSize: 100 * 1024, // 100KB: reduce OOM risk
  backlog: 2048             // Increase system listen backlog for connection bursts
});

// Import utilities
const { initRedis, getRedisClient, closeRedis, isRedisHealthy } = require('./utils/redis');
const StateManager = require('./utils/stateManager');

// --- Global guards / timers (per worker) ---
let matcherInterval = null;
let userCountBroadcastTimer = null;
let pendingUserCount = null;
let reconcileInterval = null;

function scheduleUserCountBroadcast(count) {
  pendingUserCount = count;
  if (userCountBroadcastTimer) return;
  userCountBroadcastTimer = setTimeout(() => {
    userCountBroadcastTimer = null;
    io.emit('userCount', pendingUserCount);
  }, 1000);
}

function startBatchMatcher() {
  if (matcherInterval) return;
  matcherInterval = setInterval(async () => {
    const modes = ['text', 'voice', 'video'];
    for (const mode of modes) {
      for (let i = 0; i < 20; i++) {
        const match = await StateManager.matchUsers(mode);
        if (!match) break;

        io.to(match.initiator).emit('match', { mode, partnerId: match.receiver, initiator: true });
        io.to(match.receiver).emit('match', { mode, partnerId: match.initiator, initiator: false });

        const s1 = io.sockets.sockets.get(match.initiator);
        if (s1) s1._p = match.receiver;
        const s2 = io.sockets.sockets.get(match.receiver);
        if (s2) s2._p = match.initiator;
      }
    }
  }, 250);
}

async function reconcileUserCountIfLeader() {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const lockKey = 'chat:users:reconcile:lock';
    const gotLock = await redis.set(lockKey, String(process.pid), { NX: true, EX: 55 });
    if (!gotLock) return;

    const workerSetKey = 'chat:users:workers:set';
    const workers = await redis.sMembers(workerSetKey);
    if (!workers || workers.length === 0) return;

    const keys = workers.map(pid => `chat:users:worker:${pid}`);
    const values = await redis.mGet(keys);
    const total = (values || []).reduce((sum, v) => sum + (v ? Number(v) : 0), 0);
    await StateManager.resetUserCount(Number.isFinite(total) ? total : 0);
  } catch (_) {
    // best-effort reconciliation only
  }
}

// Initialize Redis and Socket.IO Adapter
(async () => {
  const result = await initRedis();
  if (result && result.adapter) {
    io.adapter(result.adapter);
    console.log('Socket.IO Redis Adapter configured');
  } else {
    // If Redis fails, StateManager falls back to memory, so app still works but won't scale
    console.log('Running with in-memory state (single instance mode)');
  }
})();

// Connection limit guard (protect against OOM)
io.use((socket, next) => {
  const max = Number(process.env.MAX_CONNECTIONS || 10000);
  if (io.engine && io.engine.clientsCount >= max) {
    return next(new Error('Server at capacity. Please try again later.'));
  }
  return next();
});

// Start single matcher interval per worker (NOT per connection)
startBatchMatcher();

// Periodic reconciliation (best-effort) to avoid drift
reconcileInterval = setInterval(async () => {
  const redis = getRedisClient();
  if (redis) {
    const workerSetKey = 'chat:users:workers:set';
    await redis.sAdd(workerSetKey, String(process.pid));
    await redis.expire(workerSetKey, 120);
    await redis.set(`chat:users:worker:${process.pid}`, String(io.engine?.clientsCount || 0), { EX: 120 });
    await reconcileUserCountIfLeader();
  }
}, 60_000);

// Rate limit for support submissions
const supportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

// Health check
app.get('/healthz', (req, res) => {
  res.status(200).json({ ok: true, timestamp: new Date().toISOString() });
});

// Readiness probe
app.get('/readyz', (req, res) => {
  res.status(200).json({ ready: true, timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', iceConfigRoutes);

// Optional HTTPS redirect
if (process.env.FORCE_HTTPS === 'true') {
  app.use((req, res, next) => {
    const proto = req.get('x-forwarded-proto');
    if (proto && proto !== 'https') {
      const host = req.get('host');
      return res.redirect(301, `https://${host}${req.originalUrl}`);
    }
    next();
  });
}

// POST /api/support to file help-center submissions via email without exposing address on client
app.post('/api/support', supportLimiter, async (req, res) => {
  try {
    const { type, subject, message, contact } = req.body || {};
    if (!type || !message) {
      return res.status(400).json({ ok: false, error: 'Missing required fields' });
    }

    const supportTo = process.env.SUPPORT_TO || '';
    if (!supportTo) {
      return res.status(500).json({ ok: false, error: 'Support address not configured' });
    }

    const mailTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      } : undefined,
      jsonTransport: (!process.env.SMTP_HOST || !process.env.SMTP_USER) ? true : undefined,
      pool: true,
      maxConnections: 5,
    });

    const mail = {
      from: process.env.SMTP_FROM || 'no-reply@unitalks.local',
      to: supportTo,
      subject: `[Unitalks Support] ${type}${subject ? ` - ${subject}` : ''}`,
      text: `Type: ${type}\nSubject: ${subject || '-'}\nContact: ${contact || '-'}\n\nMessage:\n${message}`,
    };

    await mailTransport.sendMail(mail);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Failed to submit' });
  }
});

// --- State Management ---
// StateManager handles Queues, Partners, User Count, and Game logic using Redis (or memory fallback)

// Simple per-socket token bucket rate limiter for event spam prevention
function allowSocketEvent(socket, cost = 1) {
  const now = Date.now();
  const bucket = socket._rl || { tokens: 250, last: now }; // Higher initial burst capacity
  const capacity = Number(process.env.SOCKET_RATE_LIMIT_CAPACITY) || 500; // Configurable capacity
  const refillWindowMs = 15_000; // Refill over 15s
  const elapsed = now - bucket.last;
  if (elapsed > 0) {
    const refill = (elapsed / refillWindowMs) * capacity;
    bucket.tokens = Math.min(capacity, bucket.tokens + refill);
    bucket.last = now;
  }
  if (bucket.tokens >= cost) {
    bucket.tokens -= cost;
    socket._rl = bucket;
    return true;
  }
  // Optional: silently drop or temporarily disconnect on abuse
  return false;
}

// Validation utilities
const Validation = {
  sanitizeString: (value, maxLen = 1024) => {
    if (typeof value !== 'string') return null;
    return value.slice(0, maxLen).trim();
  },

  isValidMode: (mode) => {
    return ['text', 'voice', 'video'].includes(mode);
  },

  isValidSocketId: (socketId) => {
    return typeof socketId === 'string' && socketId.length > 0;
  },

  validateMessage: (message) => {
    if (!message || typeof message !== 'string') return false;
    return message.length <= 1000 && message.length > 0;
  },

  validateGameMove: (move) => {
    return move && typeof move === 'object' && Object.keys(move).length > 0;
  }
};

// Error handling utilities
const ErrorHandler = {
  logError: (error, context = {}) => {
    console.error(`[Error] ${context.action || 'Unknown'}:`, error, context);
  },

  sendError: (socket, event, error, context = {}) => {
    socket.emit(event, {
      error: error.message || 'Unknown error',
      context,
      timestamp: Date.now()
    });
  },

  handleAsyncError: (fn, context = {}) => {
    return (...args) => {
      try {
        const result = fn(...args);
        if (result && typeof result.catch === 'function') {
          result.catch(error => {
            ErrorHandler.logError(error, context);
          });
        }
      } catch (error) {
        ErrorHandler.logError(error, context);
      }
    };
  }
};

// Helper function for simple event forwarding
function createForwardHandler(socket, eventName) {
  return ({ to, ...data }) => {
    if (!to) return;
    io.to(to).emit(eventName, { from: socket.id, ...data });
  };
}

// Helper function for simple request/response patterns
function setupRequestHandlers(socket, configs) {
  configs.forEach(({ requestEvent, responseEvent, acceptEvent, declineEvent }) => {
    socket.on(requestEvent, ({ to }) => {
      if (!to) return;
      io.to(to).emit(responseEvent, { from: socket.id });
    });

    socket.on(acceptEvent, ({ to }) => {
      if (!to) return;
      io.to(to).emit(acceptEvent, { from: socket.id });
    });

    socket.on(declineEvent, ({ to }) => {
      if (!to) return;
      io.to(to).emit(declineEvent);
    });
  });
}

io.on('connection', async (socket) => {
  const onlineUsers = await StateManager.incrementUserCount();
  scheduleUserCountBroadcast(onlineUsers);

  // Handle joining different chat modes
  socket.on('joinQueue', async (data) => {
    let mode, partnerId;
    if (typeof data === 'string') {
      mode = data;
    } else {
      mode = data.mode;
      partnerId = data.partnerId;
    }

    if (!Validation.isValidMode(mode)) {
      ErrorHandler.sendError(socket, 'joinQueueError', new Error('Invalid chat mode'), { mode });
      return;
    }

    // Handle direct partner matching
    if (partnerId) {
      const isAllowed = {
        voice: async () => await StateManager.getPartner('text', socket.id) === partnerId,
        text: async () => await StateManager.getPartner('voice', socket.id) === partnerId || await StateManager.getPartner('video', socket.id) === partnerId,
        video: async () => await StateManager.getPartner('text', socket.id) === partnerId || await StateManager.getPartner('voice', socket.id) === partnerId
      };

      const allowed = isAllowed[mode] ? await isAllowed[mode]() : false;
      if (allowed && await StateManager.directMatch(mode, socket.id, partnerId)) {
        return;
      }
    }

    // Add to queue (with queue-size cap)
    const added = await StateManager.addToQueue(mode, socket.id);
    if (!added || added === false) return;
    if (added && added.ok === false && added.error === 'queue_full') {
      ErrorHandler.sendError(socket, 'joinQueueError', new Error('Queue is full, please retry shortly'), { mode });
      return;
    }

    // Random matching is now handled by the background batch matcher
  });

  // Simple forwarding events with validation
  const forwardEvents = [
    'signal', 'webrtc-restart', 'feature-switch',
    'musicEvent', 'gameInvitation', 'gameAccepted', 'gameDeclined',
    'game-exit', 'tictactoe-move', 'tictactoe-rematch', 'chess-move', 'chess-rematch',
    'chess-undo-request', 'chess-undo-apply', 'chess-undo-decline', 'chess-undo-cancel',
    'chess-resign', 'chess-react', 'tod-target', 'tod-choice', 'tod-result', 'tod-verify',
    'tod-reset', 'gameScore', 'todCategory', 'bottleResult',
    'todChoice', 'todPrompt', 'todVerify', 'todCategoryReset'
  ];

  forwardEvents.forEach(eventName => {
    socket.on(eventName, async ({ to, ...data }) => {
      if (!allowSocketEvent(socket, 0.5)) return;

      // 2. High-Performance Security Check: 
      // Use local variable cache (_p) first, fallback to Redis only if cache missing
      let isPartner = socket._p === to;
      if (!isPartner) {
        isPartner = await StateManager.isAnyPartner(socket.id, to);
        if (isPartner) socket._p = to; // Populate cache for next packet
      }

      if (!isPartner) return;

      if (!Validation.isValidSocketId(to)) {
        ErrorHandler.sendError(socket, `${eventName}Error`, new Error('Invalid recipient'), { to });
        return;
      }
      io.to(to).emit(eventName, { from: socket.id, ...data });
    });
  });

  // Handle text messages with validation
  socket.on('message', async ({ to, message }) => {
    if (!allowSocketEvent(socket, 1)) return;

    if (!Validation.isValidSocketId(to)) {
      ErrorHandler.sendError(socket, 'messageError', new Error('Invalid recipient'), { to });
      return;
    }

    let isPartner = socket._p === to;
    if (!isPartner) {
      isPartner = await StateManager.isAnyPartner(socket.id, to);
      if (isPartner) socket._p = to;
    }
    if (!isPartner) return;

    if (!Validation.validateMessage(message)) {
      ErrorHandler.sendError(socket, 'messageError', new Error('Invalid message'), { message });
      return;
    }

    const sanitizedMessage = Validation.sanitizeString(message, 1000);
    io.to(to).emit('message', { from: socket.id, message: sanitizedMessage });
  });

  // Event forwarding logic handles 'signal' and other Peer events automatically.
  // Manual handler removed to prevent duplicate messaging.


  // Handle leaving text chat
  socket.on('leaveChat', async () => {
    await StateManager.removeFromAllQueues(socket.id);
    const partnerId = await StateManager.removePair('text', socket.id);
    if (partnerId) {
      io.to(partnerId).emit('partnerDisconnected');
    }
  });

  // Handle partner skipped event
  socket.on('partnerSkipped', async ({ to }) => {
    if (!to) return;

    await StateManager.removeFromAllQueues(socket.id);
    await StateManager.removeFromAllQueues(to);

    // Clean up all pairs for both users
    await StateManager.removeAllPairs(socket.id);
    await StateManager.removeAllPairs(to);

    io.to(to).emit('partnerSkipped');
    console.log(`User ${socket.id} skipped partner ${to}`);
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    const count = await StateManager.decrementUserCount();
    scheduleUserCountBroadcast(count);

    await StateManager.removeFromAllQueues(socket.id);

    // Notify all partners and clean up pairs
    const partners = await StateManager.removeAllPairs(socket.id);
    partners.forEach(({ partner }) => {
      io.to(partner).emit('partnerDisconnected');
    });

    // Clean up RPS games - we need to iterate locally if we don't have a way to query by user
    // Ideally StateManager should handle "remove player from all games"
    // For now, let's assume game state expires or handled by rematch/timeouts
    // But to be consistent with previous logic, we should probably add a cleanup method to StateManager if possible
    // or just leave it for the expiry time since we moved to Redis with expiry.
    // The previous logic iterated all games. Use Redis SCAN? 
    // Actually, for scalability, scanning all games on every disconnect is bad.
    // Better to let them expire or handle disconnection when the other player tries to move.

    // However, if we want to notify the other player immediately:
    // We would need to know which game the user is in. 
    // Since we don't track "socket -> game" mapping, we skip explicit game deletion here.
    // The other player will realize when they send a move or we could enhance StateManager to track active game per user.
    // For this refactor, let's skip the O(N) scan.
  });

  // Setup request/response handlers
  setupRequestHandlers(socket, [
    { requestEvent: 'voiceCallRequest', responseEvent: 'voiceCallRequestReceived', acceptEvent: 'voiceCallAccepted', declineEvent: 'voiceCallDeclined' },
    { requestEvent: 'textChatRequest', responseEvent: 'textChatRequestReceived', acceptEvent: 'textChatAccepted', declineEvent: 'textChatDeclined' },
    { requestEvent: 'videoCallRequest', responseEvent: 'videoCallRequestReceived', acceptEvent: 'videoCallAccepted', declineEvent: 'videoCallDeclined' }
  ]);

  // Rock Paper Scissors game logic with validation
  socket.on('rps-move', async ({ to, choice }) => {
    if (!Validation.isValidSocketId(to)) {
      ErrorHandler.sendError(socket, 'rpsError', new Error('Invalid opponent'), { to });
      return;
    }

    if (!choice || !['rock', 'paper', 'scissors'].includes(choice)) {
      ErrorHandler.sendError(socket, 'rpsError', new Error('Invalid choice'), { choice });
      return;
    }

    const gameKey = [socket.id, to].sort().join('-');
    const game = await StateManager.setRpsMove(gameKey, socket.id, choice);

    const player1 = socket.id;
    const player2 = to;

    if (game[player1] && game[player2]) {
      io.to(player1).emit('rps-move', { choice: game[player2] });
      io.to(player2).emit('rps-move', { choice: game[player1] });
      await StateManager.deleteRpsGame(gameKey);
    } else {
      io.to(socket.id).emit('rps-move-confirmed');
    }
  });

  socket.on('rps-rematch', async ({ to }) => {
    if (!Validation.isValidSocketId(to)) {
      ErrorHandler.sendError(socket, 'rpsError', new Error('Invalid opponent'), { to });
      return;
    }

    const gameKey = [socket.id, to].sort().join('-');
    await StateManager.deleteRpsGame(gameKey);
    io.to(to).emit('rps-rematch');
  });
});

// Add catch-all route for client-side routing (must be last)
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'client/build', 'index.html');
  const fs = require('fs');
  if (fs.existsSync(indexPath)) {
    res.set('Cache-Control', 'no-store');
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Backend API is running. If you are in development, please access the frontend via the React dev server.');
  }
});

const PORT = process.env.PORT || 5000;

if (cluster.isPrimary && process.env.NODE_ENV === 'production' && process.env.DISABLE_CLUSTER !== 'true') {
  // Limit workers to 3 to avoid RAM exhaustion on HF Free Tier (2GB)
  const numCPUs = Math.min(os.cpus().length, 3);
  console.log(`Primary ${process.pid} is running. Forking for ${numCPUs} CPUs...`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Forking replacement...`);
    cluster.fork();
  });
} else {
  server.listen(PORT, () => {
    console.log(`✅ Backend running on port ${PORT}`);
    if (allowedOrigins.length > 0) {
      console.log(`✅ Allowed origins: ${allowedOrigins.join(', ')}`);
    }
    console.log(`⚠️  Make sure client/.env REACT_APP_SOCKET_URL matches this port!`);

    // Diagnostic: Log system limits on startup
    if (process.env.NODE_ENV === 'production') {
      try {
        const { execSync } = require('child_process');
        const limit = execSync('ulimit -n').toString().trim();
        console.log(`🚀 System File Descriptor Limit: ${limit}`);
      } catch (e) {
        // Silent fail if ulimit not accessible
      }
    }
  });
}

// Graceful shutdown
const shutdown = (signal) => {
  try {
    if (matcherInterval) clearInterval(matcherInterval);
    if (reconcileInterval) clearInterval(reconcileInterval);
    if (userCountBroadcastTimer) clearTimeout(userCountBroadcastTimer);

    io.close(() => {
      server.close(async () => {
        try { await closeRedis(); } catch (_) {}
        process.exit(0);
      });
    });
    // Force exit if not closed in time
    setTimeout(() => process.exit(0), 10_000).unref();
  } catch (_) {
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));