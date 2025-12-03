interface CacheEntry<T> {
	data: T;
	timestamp: number;
}

export class Cache<T> {
	private store = new Map<string, CacheEntry<T>>();
	private cacheTTL: number;

	/**
	 * Creates a new Cache instance.
	 * @param cacheTTL - The time-to-live for cache entries in minutes.
	 */
	constructor(cacheTTL: number) {
		this.cacheTTL = cacheTTL * 60 * 1000;
	}

	/**
	 * Gets a cached entry by its key.
	 * @param key - The key of the cached entry.
	 * @returns The cached data if it exists and is valid, otherwise null.
	 */
	get(key: string): T | null {
		const entry = this.store.get(key);

		if (!entry)
			return null;

		if (Date.now() - entry.timestamp > this.cacheTTL) {
			this.store.delete(key);
			return null;
		}

		return entry.data;
	}

	/**
	 * Sets a cache entry.
	 * @param key - The key of the cache entry.
	 * @param data - The data to be cached.
	 */
	set(key: string, data: T): void {
		this.store.set(key, { data, timestamp: Date.now() });
	}

	/**
	 * Deletes a cache entry by its key.
	 * @param key - The key of the cache entry to delete.
	 */
	delete(key: string): void {
		this.store.delete(key);
	}

	/**
	 * Clears all cache entries.
	 */
	clear(): void {
		this.store.clear();
	}
}