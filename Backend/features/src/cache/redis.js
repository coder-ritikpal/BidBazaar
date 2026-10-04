import { createClient } from 'redis';
import config from '../config/config.js';

let redisClient = null;

export const connectRedis = async () => {
  if (!config.REDIS_URL) {
    console.warn('[Features Service] REDIS_URL not found. Caching will be disabled.');
    return;
  }

  try {
    redisClient = createClient({ url: config.REDIS_URL });
    
    redisClient.on('error', (err) => console.error('[Features Service] Redis Client Error', err));
    
    await redisClient.connect();
    console.log('[Features Service] Connected to Redis Cache');
  } catch (error) {
    console.error('[Features Service] Failed to connect to Redis, caching disabled:', error.message);
    redisClient = null; // Ensure client is null if connection fails
  }
};

export const getCache = async (key) => {
  if (!redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('[Features Service] Redis GET Error:', err.message);
    return null;
  }
};

export const setCache = async (key, value, expirationInSeconds = 30) => {
  if (!redisClient) return;
  try {
    await redisClient.setEx(key, expirationInSeconds, JSON.stringify(value));
  } catch (err) {
    console.error('[Features Service] Redis SET Error:', err.message);
  }
};

export const setNxCache = async (key, value, expirationInSeconds = 60) => {
  if (!redisClient) return false;
  try {
    const result = await redisClient.set(key, JSON.stringify(value), {
      NX: true,
      EX: expirationInSeconds
    });
    return result === 'OK';
  } catch (err) {
    console.error('[Features Service] Redis SETNX Error:', err.message);
    return false;
  }
};

export const clearCache = async (key) => {
  if (!redisClient) return;
  try {
    await redisClient.del(key);
  } catch (err) {
    console.error('[Features Service] Redis DEL Error:', err.message);
  }
};
