const TTL_MS = 5 * 60_000;
const MAX_ENTRIES = 200;

interface CacheEntry {
    value: unknown;
    expiresAt: number;
}

const store = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<unknown>>();

export interface CacheOptions {
    bypass?: boolean;
}

function evict(): void {
    if (store.size <= MAX_ENTRIES) return;
    const now = Date.now();
    for (const [key, entry] of store) {
        if (entry.expiresAt <= now) store.delete(key);
    }
    while (store.size > MAX_ENTRIES) {
        const oldest = store.keys().next().value;
        if (oldest === undefined) break;
        store.delete(oldest);
    }
}

export async function withCache<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {},
): Promise<T> {
    if (!options.bypass) {
        const cached = store.get(key);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.value as T;
        }

        const existing = inFlight.get(key);
        if (existing) return existing as Promise<T>;
    }

    const trackInFlight = !options.bypass;
    const promise = factory()
        .then((value) => {
            store.set(key, { value, expiresAt: Date.now() + TTL_MS });
            evict();
            return value;
        })
        .finally(() => {
            if (trackInFlight) inFlight.delete(key);
        });

    if (trackInFlight) inFlight.set(key, promise);
    return promise;
}
