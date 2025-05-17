import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.warn('REDIS_URL is not defined. Redis client will not be created.');
  // You might want to throw an error here in production or have a fallback strategy
}

// Conditional client creation to avoid errors during build if REDIS_URL is not yet available
// or if running in an environment where Redis is not intended to be used.
const redis = redisUrl ? new Redis(redisUrl) : null;

export default redis; 