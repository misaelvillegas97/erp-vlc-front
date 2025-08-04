import { UniqueIdExtractor } from './unique-id-extractor.model';

export interface MemoizePayload {
    extractUniqueId: UniqueIdExtractor;
    doUseWeakMap?: boolean;
    clearCacheTimeout?: number;
    maxCacheSize?: number;
    debugReporter?: (message: string, state?: Map<any, unknown> | WeakMap<object, unknown> | unknown) => void;
}
