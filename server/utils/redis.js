const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');

let dataClient;
let pubClient;
let subClient;

async function initRedis() {
  const redisUrl = process.env.REDIS_URL;
  const redisHost = process.env.REDIS_HOST;
  const redisPort = process.env.REDIS_PORT;
  
  // Only init if configured or default to localhost if inside docker-compose with service name 'redis'
  if (!redisUrl && !redisHost) {
      console.log('Redis not configured, skipping initialization.');
      return null;
  }

  const config = redisUrl
    ? { url: redisUrl }
    : {
        socket: { host: redisHost, port: Number(redisPort || 6379) },
        password: process.env.REDIS_PASSWORD || undefined,
      };

  try {
    // Client for data operations (queues, pairs, etc.)
    dataClient = createClient(config);
    dataClient.on('error', (err) => console.error('Redis Client Error', err));
    await dataClient.connect();

    // Clients for Socket.IO Adapter (Pub/Sub)
    pubClient = dataClient.duplicate();
    subClient = dataClient.duplicate();
    
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

module.exports = {
  initRedis,
  getRedisClient
};
