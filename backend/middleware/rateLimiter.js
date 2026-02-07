import redisClient from '../config/redisClient.js';

const rateLimiter = (limit = 100, windowSeconds = 60) => async (req, res, next) => {
    try {
        if (!redisClient.isReady) {
            // Redis not ready/connected, skip limiting to prevent hanging
            return next();
        }

        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        // Simple key based on IP. For authenticated routes, could use user ID.
        const key = `ratelimit:${ip}`;

        const requests = await redisClient.incr(key);

        if (requests === 1) {
            await redisClient.expire(key, windowSeconds);
        }

        if (requests > limit) {
            return res.status(429).json({ message: 'Too many requests, please try again later.' });
        }

        next();
    } catch (error) {
        // If Redis fails, allow traffic to prevent outage
        // console.error('Rate Limiter Redis Error:', error);
        next();
    }
};

export default rateLimiter;
