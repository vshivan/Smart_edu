/**
 * Shared Redis client singleton.
 * Connects once on startup, reconnects automatically on failure.
 * All services import getRedis() from here instead of creating their own clients.
 */
const { createClient } = require('redis');
const logger = require('../utils/logger');

let client = null;
let connectPromise = null;

const getRedis = async () => {
  // Already connected
  if (client && client.isReady) return client;

  // Connection in progress — wait for it
  if (connectPromise) return connectPromise;

  connectPromise = (async () => {
    client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout:    5000,   // 5s to establish connection
        reconnectStrategy: (retries) => {
          if (retries > 5) {
            logger.warn('Redis: max reconnect attempts reached');
            return false;           // stop retrying
          }
          return Math.min(retries * 200, 2000); // exponential backoff
        },
      },
    });

    client.on('error',        (err) => logger.warn('Redis error:', err.message));
    client.on('connect',      ()    => logger.info('✅ Redis connected'));
    client.on('reconnecting', ()    => logger.info('Redis reconnecting...'));
    client.on('end',          ()    => { client = null; connectPromise = null; });

    try {
      await client.connect();
    } catch (err) {
      logger.warn('⚠ Redis connection failed — sessions will not persist:', err.message);
      client = null;
      connectPromise = null;
      throw err;
    }

    return client;
  })();

  return connectPromise;
};

// Connect eagerly on startup (non-blocking — errors are caught)
getRedis().catch(() => {});

module.exports = { getRedis };
