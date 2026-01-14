
import Redis from 'ioredis';

async function main() {
    const redis = new Redis('redis://localhost:6379');

    try {
        const keys = await redis.keys('student:*');
        if (keys.length > 0) {
            console.log(`Deleting ${keys.length} keys...`);
            await redis.del(...keys);
            console.log('✅ Student cache cleared');
        } else {
            console.log('No student keys found in cache');
        }
    } catch (error) {
        console.error('Failed to clear cache:', error);
    } finally {
        await redis.quit();
    }
}

main();
