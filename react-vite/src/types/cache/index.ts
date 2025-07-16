export interface CacheEntry {
	data: unknown;
	timestamp: number;
}

// Cache item interface
export interface CacheItem<T> {
	data: T;
	timestamp: number;
}
