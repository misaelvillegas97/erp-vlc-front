import { MemoizeDecorator } from './models/decorator.model';
import { MemoizePayload }   from './models/memoize-payload.model';

export function memoize(args: Omit<MemoizePayload, 'doUseWeakMap'>): MemoizeDecorator;
export function memoize(args: Omit<MemoizePayload, 'clearCacheTimeout'>): MemoizeDecorator;

export function memoize({extractUniqueId, clearCacheTimeout, doUseWeakMap, debugReporter}: MemoizePayload): MemoizeDecorator {
    return (target: unknown, propertyKey: string, descriptor: PropertyDescriptor): void => {
        let cacheTeardownTimer: ReturnType<typeof setTimeout>;

        let cache = initCache(doUseWeakMap);

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
                    debugReporter?.('Cache cleared: ', cache);
                }, clearCacheTimeout);
            };

        const originalMethod = descriptor.value;

        descriptor.value = function(...args: unknown[]) {
            startTeardownTimeout?.();

            const uniqueId: any = extractUniqueId(...args);
            debugReporter?.('Looking for a value with unique id of ', uniqueId);

            if (cache.has(uniqueId)) {
                const cachedResult = cache.get(uniqueId);
                debugReporter?.('Returning cached result', cachedResult);
                return cachedResult;
            }

            debugReporter?.('No cached result found');
            const result = originalMethod.apply(this, args);

            debugReporter?.('Storing a new entry in cache: ', {uniqueId, result});
            cache.set(uniqueId, result);
            debugReporter?.('Cache updated', cache);

            return result;
        };
    };
}

function initCache(doUseWeakMap?: boolean) {
    return doUseWeakMap ? new WeakMap<object, unknown>() : new Map<any, unknown>();
}
