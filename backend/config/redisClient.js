import redis from 'redis';
import dotenv from 'dotenv';
dotenv.config();
console.log(process.env.REDIS_URL);
const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
    socket: {
        connectTimeout: 5000, // 5s timeout
        reconnectStrategy: (retries) => {
            if (retries > 10) return new Error('Redis Retry Exhausted');
            return Math.min(retries * 100, 3000);
        }
    }
});

client.on('error', (err) => {
    // Suppress heavy logs if redis is down to avoid clutter, or log once?
    // console.error('Redis Client Error', err);
});

client.on('connect', () => console.log('Redis Client Connected'));

// Manage connection
let isConnected = false;

const connectRedis = async () => {
    if (!isConnected) {
        try {
            await client.connect();
            isConnected = true;
        } catch (err) {
            console.log('Redis connection failed. Caching disabled.');
        }
    }
};

connectRedis();

export default client;
