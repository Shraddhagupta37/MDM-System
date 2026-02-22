const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

exports.apiLimiter = rateLimit({
  store: new RedisStore({
    client: global.redis,
    prefix: 'rl:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { success: false, error: 'Too many requests, please try again later.' }
});

exports.deviceLimiter = rateLimit({
  store: new RedisStore({
    client: global.redis,
    prefix: 'device-rl:'
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each device to 10 requests per minute
  keyGenerator: (req) => req.body.imei || req.ip
});