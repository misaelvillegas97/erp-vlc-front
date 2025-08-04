import { MemoizeDecorator } from './models/decorator.model';
import { MemoizePayload }   from './models/memoize-payload.model';

export function memoize(args: Omit<MemoizePayload, 'doUseWeakMap'>): MemoizeDecorator;
export function memoize(args: Omit<MemoizePayload, 'clearCacheTimeout'>): MemoizeDecorator;

export function memoize({extractUniqueId, clearCacheTimeout, doUseWeakMap, maxCacheSize = 100, debugReporter}: MemoizePayload): MemoizeDecorator {
    return (target: unknown, propertyKey: string, descriptor: PropertyDescriptor): void => {
        let cacheTeardownTimer: ReturnType<typeof setTimeout>;
        let cache = initCache(doUseWeakMap);
        let cacheKeys: any[] = []; // For LRU eviction (only used with Map)

        const evictOldestEntry = () => {
            if (!doUseWeakMap && cacheKeys.length >= maxCacheSize!) {
                const oldestKey = cacheKeys.shift();
                (cache as Map<any, unknown>).delete(oldestKey);
                debugReporter?.(`Evicted oldest cache entry: ${ oldestKey }`);
            }
        };

        const startTeardownTimeout = !clearCacheTimeout
            ? null
            : () => {
                if (cacheTeardownTimer) {
                    debugReporter?.('Clearing the cache timeout timer');
                    clearTimeout(cacheTeardownTimer);
                }
                debugReporter?.(`Cache to be cleared in ${ clearCacheTimeout }ms`);
                cacheTeardownTimer = setTimeout(() => {
                    debugReporter?.('Clearing the current cache of', cache);
                    cache = initCache(doUseWeakMap);
                    cacheKeys = [];
                    debugReporter?.('Cache cleared: ', cache);
                }, clearCacheTimeout);
            };

        // Cache invalidation method
        const invalidateCache = (keyPattern?: RegExp) => {
            if (keyPattern && !doUseWeakMap) {
                const mapCache = cache as Map<any, unknown>;
                for (const key of mapCache.keys()) {
                    if (keyPattern.test(String(key))) {
                        mapCache.delete(key);
                        const keyIndex = cacheKeys.indexOf(key);
                        if (keyIndex > -1) {
                            cacheKeys.splice(keyIndex, 1);
                        }
                        debugReporter?.(`Invalidated cache entry: ${ key }`);
                    }
                }
            } else {
                cache = initCache(doUseWeakMap);
                cacheKeys = [];
                debugReporter?.('Cache completely invalidated');
            }
        };

        const originalMethod = descriptor.value;

        descriptor.value = function(...args: unknown[]) {
            startTeardownTimeout?.();

            const uniqueId: any = extractUniqueId(...args);
            debugReporter?.('Looking for a value with unique id of ', uniqueId);

            if (cache.has(uniqueId)) {
                const cachedResult = cache.get(uniqueId);
                debugReporter?.('Returning cached result', cachedResult);

                // Move to end for LRU (only for Map)
                if (!doUseWeakMap) {
                    const keyIndex = cacheKeys.indexOf(uniqueId);
                    if (keyIndex > -1) {
                        cacheKeys.splice(keyIndex, 1);
                        cacheKeys.push(uniqueId);
                    }
                }
                
                return cachedResult;
            }

            debugReporter?.('No cached result found');
            const result = originalMethod.apply(this, args);

            // Handle Promises
            if (result instanceof Promise) {
                const promiseResult = result.catch(error => {
                    cache.delete(uniqueId);
                    if (!doUseWeakMap) {
                        const keyIndex = cacheKeys.indexOf(uniqueId);
                        if (keyIndex > -1) {
                            cacheKeys.splice(keyIndex, 1);
                        }
                    }
                    debugReporter?.(`Promise rejected, removed from cache: ${ uniqueId }`);
                    throw error;
                });

                evictOldestEntry();
                cache.set(uniqueId, promiseResult);
                if (!doUseWeakMap) {
                    cacheKeys.push(uniqueId);
                }
                debugReporter?.('Storing promise in cache: ', {uniqueId, result: promiseResult});
                return promiseResult;
            }

            evictOldestEntry();
            debugReporter?.('Storing a new entry in cache: ', {uniqueId, result});
            cache.set(uniqueId, result);
            if (!doUseWeakMap) {
                cacheKeys.push(uniqueId);
            }
            debugReporter?.('Cache updated', cache);

            return result;
        };

        // Expose invalidation method
        (descriptor.value as any).invalidateCache = invalidateCache;
    };
}

function initCache(doUseWeakMap?: boolean) {
    return doUseWeakMap ? new WeakMap<object, unknown>() : new Map<any, unknown>();
}
