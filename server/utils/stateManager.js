const { getRedisClient } = require('./redis');

// In-memory fallback if Redis is not available
const memoryQueues = { text: [], voice: [], video: [] };
const memoryPairs = { text: {}, voice: {}, video: {} };
const memoryRpsGames = {};
let memoryOnlineUsers = 0;

const PREFIX = 'chat:';
const QUEUE_PREFIX = `${PREFIX}queue:`;
const PAIR_PREFIX = `${PREFIX}pair:`;
const USER_COUNT_KEY = `${PREFIX}users:count`;
const MAX_QUEUE_SIZE = Number(process.env.MAX_QUEUE_SIZE || 5000);

function pairKey(mode, socketId) {
    return `${PAIR_PREFIX}${mode}:${socketId}`;
}

const StateManager = {
    // --- Queue Management ---
    addToQueue: async (mode, socketId) => {
        const redis = getRedisClient();
        if (!redis) {
            // Fallback
            if (!memoryQueues[mode]) return false;
            StateManager.removeFromAllQueues(socketId); // defined below, handles memory fallback internally
            if (memoryQueues[mode].length >= MAX_QUEUE_SIZE) {
                return { ok: false, error: 'queue_full' };
            }
            memoryQueues[mode].push(socketId);
            return true;
        }

        try {
            await StateManager.removeFromAllQueues(socketId);
            const qKey = `${QUEUE_PREFIX}${mode}`;
            const len = await redis.lLen(qKey);
            if (len >= MAX_QUEUE_SIZE) {
                return { ok: false, error: 'queue_full' };
            }
            await redis.rPush(qKey, socketId);
            return true;
        } catch (e) {
            console.error('Redis addToQueue error:', e);
            return false;
        }
    },

    removeFromAllQueues: async (socketId) => {
        const redis = getRedisClient();
        const modes = ['text', 'voice', 'video'];

        if (!redis) {
            modes.forEach(mode => {
                memoryQueues[mode] = memoryQueues[mode].filter(id => id !== socketId);
            });
            return;
        }

        // This is O(N) where N is queue length, but since we usually pop from head, it might be safer to just LREM
        // LREM count 0 element -> removes all occurrences
        const multi = redis.multi();
        modes.forEach(mode => {
            multi.lRem(`${QUEUE_PREFIX}${mode}`, 0, socketId);
        });
        await multi.exec();
    },

    popFromQueue: async (mode) => {
        const redis = getRedisClient();
        if (!redis) {
            return memoryQueues[mode]?.shift() || null;
        }
        return await redis.lPop(`${QUEUE_PREFIX}${mode}`);
    },

    matchUsers: async (mode) => {
        const redis = getRedisClient();
        if (!redis) {
            if (memoryQueues[mode] && memoryQueues[mode].length >= 2) {
                const user1 = memoryQueues[mode].shift();
                const user2 = memoryQueues[mode].shift();
                const initiator = Math.random() < 0.5 ? user1 : user2;
                const receiver = initiator === user1 ? user2 : user1;
                await StateManager.setPair(mode, initiator, receiver);
                return { initiator, receiver };
            }
            return null;
        }

        // Atomic Match Script: Pops 2 users and sets their pairing in one go
        // KEYS[1] = queue
        // ARGV[1] = pairKeyPrefix
        // ARGV[2] = TTL
        const LUA_MATCH = `
            local u1 = redis.call('LPOP', KEYS[1])
            if not u1 then return nil end
            local u2 = redis.call('LPOP', KEYS[1])
            if not u2 then 
                redis.call('LPUSH', KEYS[1], u1)
                return nil 
            end
            local k1 = ARGV[1] .. u1
            local k2 = ARGV[1] .. u2
            redis.call('SETEX', k1, ARGV[2], u2)
            redis.call('SETEX', k2, ARGV[2], u1)
            return {u1, u2}
        `;

        try {
            const result = await redis.eval(LUA_MATCH, {
                keys: [`${QUEUE_PREFIX}${mode}`],
                arguments: [`${PAIR_PREFIX}${mode}:`, '3600'] // 1 hour TTL
            });

            if (result && result.length === 2) {
                const initiator = Math.random() < 0.5 ? result[0] : result[1];
                const receiver = initiator === result[0] ? result[1] : result[0];
                return { initiator, receiver };
            }
        } catch (e) {
            console.error('Lua Match Error:', e);
        }
        return null;
    },

    directMatch: async (mode, socketId, partnerId) => {
        const redis = getRedisClient();
        if (!redis) {
            const idx = memoryQueues[mode].indexOf(partnerId);
            if (idx !== -1) {
                memoryQueues[mode].splice(idx, 1);
                const myIdx = memoryQueues[mode].indexOf(socketId);
                if (myIdx !== -1) memoryQueues[mode].splice(myIdx, 1);
                await StateManager.setPair(mode, socketId, partnerId);
                return true;
            }
            return false;
        }

        const LUA_DIRECT = `
            local removed = redis.call('LREM', KEYS[1], 0, ARGV[1])
            if removed > 0 then
                redis.call('LREM', KEYS[1], 0, ARGV[2])
                local k1 = ARGV[4] .. ARGV[1]
                local k2 = ARGV[4] .. ARGV[2]
                redis.call('SETEX', k1, ARGV[3], ARGV[2])
                redis.call('SETEX', k2, ARGV[3], ARGV[1])
                return 1
            end
            return 0
        `;

        const matched = await redis.eval(LUA_DIRECT, {
            keys: [`${QUEUE_PREFIX}${mode}`],
            arguments: [partnerId, socketId, '3600', `${PAIR_PREFIX}${mode}:`]
        });

        return matched === 1;
    },

    // --- Partner Management ---
    setPair: async (mode, user1, user2) => {
        const redis = getRedisClient();
        if (!redis) {
            memoryPairs[mode][user1] = user2;
            memoryPairs[mode][user2] = user1;
            return;
        }
        const ttl = 3600;
        const multi = redis.multi();
        multi.setEx(pairKey(mode, user1), ttl, user2);
        multi.setEx(pairKey(mode, user2), ttl, user1);
        await multi.exec();
    },

    getPartner: async (mode, socketId) => {
        const redis = getRedisClient();
        if (!redis) {
            return memoryPairs[mode]?.[socketId] || null;
        }
        return await redis.get(pairKey(mode, socketId));
    },

    removePair: async (mode, socketId) => {
        const redis = getRedisClient();
        if (!redis) {
            const partner = memoryPairs[mode]?.[socketId];
            if (partner) {
                delete memoryPairs[mode][socketId];
                delete memoryPairs[mode][partner];
            }
            return partner;
        }
        const k1 = pairKey(mode, socketId);
        const partnerId = await redis.get(k1);
        if (!partnerId) return null;

        const multi = redis.multi();
        multi.del(k1);
        multi.del(pairKey(mode, partnerId));
        await multi.exec();
        return partnerId;
    },

    // Helper to remove user from all pairs across all modes
    removeAllPairs: async (socketId) => {
        const redis = getRedisClient();
        const modes = ['text', 'voice', 'video'];
        const results = [];

        if (!redis) {
            for (const mode of modes) {
                const partner = await StateManager.removePair(mode, socketId);
                if (partner) results.push({ mode, partner });
            }
            return results;
        }

        const keys = modes.map(m => pairKey(m, socketId));
        const partners = await redis.mGet(keys);

        const multi = redis.multi();
        for (let i = 0; i < modes.length; i++) {
            const partner = partners?.[i];
            if (partner) {
                results.push({ mode: modes[i], partner });
                multi.del(pairKey(modes[i], socketId));
                multi.del(pairKey(modes[i], partner));
            }
        }
        await multi.exec();
        return results;
    },

    getAnyPartner: async (socketId) => {
        const redis = getRedisClient();
        const modes = ['text', 'voice', 'video'];
        if (!redis) {
            for (const mode of modes) {
                const partner = await StateManager.getPartner(mode, socketId);
                if (partner) return { mode, partner };
            }
            return null;
        }

        const partners = await redis.mGet(modes.map(m => pairKey(m, socketId)));
        for (let i = 0; i < modes.length; i++) {
            if (partners?.[i]) return { mode: modes[i], partner: partners[i] };
        }
        return null;
    },

    isVoiceOrVideoPartner: async (socketId, otherId) => {
        const redis = getRedisClient();
        if (!redis) {
            const voiceP = await StateManager.getPartner('voice', socketId);
            if (voiceP === otherId) return true;
            const videoP = await StateManager.getPartner('video', socketId);
            return videoP === otherId;
        }

        const [voiceP, videoP] = await redis.mGet([pairKey('voice', socketId), pairKey('video', socketId)]);
        return voiceP === otherId || videoP === otherId;
    },

    isAnyPartner: async (socketId, otherId) => {
        const redis = getRedisClient();
        if (!redis) {
            const result = await StateManager.getAnyPartner(socketId);
            return result && result.partner === otherId;
        }

        const partners = await redis.mGet([
            pairKey('text', socketId),
            pairKey('voice', socketId),
            pairKey('video', socketId)
        ]);
        return partners?.some(p => p === otherId) || false;
    },

    // --- User Count ---
    incrementUserCount: async () => {
        const redis = getRedisClient();
        if (!redis) {
            memoryOnlineUsers++;
            return memoryOnlineUsers;
        }
        const count = await redis.incr(USER_COUNT_KEY);
        return count;
    },

    decrementUserCount: async () => {
        const redis = getRedisClient();
        if (!redis) {
            memoryOnlineUsers = Math.max(0, memoryOnlineUsers - 1);
            return memoryOnlineUsers;
        }
        const count = await redis.decr(USER_COUNT_KEY);
        // Ensure we don't go below 0 (though incr/decr shouldn't unless logic error elsewhere)
        if (count < 0) {
            await redis.set(USER_COUNT_KEY, 0);
            return 0;
        }
        return count;
    },

    resetUserCount: async (val = 0) => {
        const redis = getRedisClient();
        if (!redis) {
            memoryOnlineUsers = val;
            return;
        }
        await redis.set(USER_COUNT_KEY, val);
    },

    // --- RPS Game State ---
    // Store each game as a Redis Hash: chat:game:rps:{gameKey}
    // Fields: {socketId} -> {choice}
    setRpsMove: async (gameKey, socketId, choice) => {
        const redis = getRedisClient();
        if (!redis) {
            if (!memoryRpsGames[gameKey]) memoryRpsGames[gameKey] = {};
            memoryRpsGames[gameKey][socketId] = choice;
            return memoryRpsGames[gameKey];
        }
        const key = `${PREFIX}game:rps:${gameKey}`;
        await redis.hSet(key, socketId, choice);
        // Set expiry for abandoned games (e.g. 1 hour)
        await redis.expire(key, 3600);

        return await redis.hGetAll(key);
    },

    deleteRpsGame: async (gameKey) => {
        const redis = getRedisClient();
        if (!redis) {
            delete memoryRpsGames[gameKey];
            return;
        }
        await redis.del(`${PREFIX}game:rps:${gameKey}`);
    }
};

module.exports = StateManager;
