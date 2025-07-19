import { CacheEntry } from "../../types/cache";

// Cache for frequently accessed data
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getCachedData = (key: string): unknown | null => {
	const entry = cache.get(key) as CacheEntry | undefined;
	if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
		return entry.data;
	}
	cache.delete(key);
	return null;
};

export const setCachedData = (key: string, data: unknown): void => {
	cache.set(key, { data, timestamp: Date.now() });
};

// Clear cache function for when data updates
export const clearCache = (pattern?: string): void => {
	if (pattern) {
		for (const key of cache.keys()) {
			if (key.includes(pattern)) {
				cache.delete(key);
			}
		}
	} else {
		cache.clear();
	}
};