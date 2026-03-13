const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');

let dataClient;
let pubClient;
let subClient;

function reconnectStrategy(retries) {
  const maxDelayMs = 30_000;
  const base = Math.min(maxDelayMs, 250 * (2 ** Math.min(retries, 10)));
  const jitter = Math.floor(Math.random() * 250);
  return base + jitter;
}

async function initRedis() {
  const redisUrl = process.env.REDIS_URL;
  const redisHost = process.env.REDIS_HOST;
  const redisPort = process.env.REDIS_PORT;
  
  // Only init if configured or default to localhost if inside docker-compose with service name 'redis'
  if (!redisUrl && !redisHost) {
      console.log('Redis not configured, skipping initialization.');
      return null;
  }

  const password = process.env.REDIS_PASSWORD || undefined;
  const config = redisUrl
    ? { url: redisUrl, password }
    : {
        socket: {
          host: redisHost,
          port: Number(redisPort || 6379),
          reconnectStrategy,
        },
        password,
      };

  try {
    // Client for data operations (queues, pairs, etc.)
    dataClient = createClient(config);
    dataClient.on('error', (err) => console.error('Redis Client Error', err));
    await dataClient.connect();

    // Clients for Socket.IO Adapter (Pub/Sub)
    pubClient = dataClient.duplicate({ socket: { reconnectStrategy }, password });
    subClient = dataClient.duplicate({ socket: { reconnectStrategy }, password });
    
    await pubClient.connect();
    await subClient.connect();

    console.log('Redis connected successfully');
    
    return {
      dataClient,
      adapter: createAdapter(pubClient, subClient)
    };
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
    return null;
  }
}

function getRedisClient() {
  return dataClient;
}

async function isRedisHealthy() {
  try {
    if (!dataClient || !dataClient.isOpen) return false;
    const pong = await dataClient.ping();
    return pong === 'PONG';
  } catch (_) {
    return false;
  }
}

async function closeRedis() {
  const clients = [subClient, pubClient, dataClient].filter(Boolean);
  await Promise.allSettled(clients.map(c => c.quit()));
  dataClient = undefined;
  pubClient = undefined;
  subClient = undefined;
}

module.exports = {
  initRedis,
  getRedisClient,
  isRedisHealthy,
  closeRedis
};
