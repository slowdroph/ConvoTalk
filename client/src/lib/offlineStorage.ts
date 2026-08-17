const DB_NAME = "convo-talk-offline";
const DB_VERSION = 1;
const STORE_PENDING = "pendingMessages";

export interface PendingMessage {
    id: string;
    roomId: string;
    content: string;
    createdAt: string;
}

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_PENDING)) {
                db.createObjectStore(STORE_PENDING, { keyPath: "id" });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function queuePendingMessage(
    roomId: string,
    content: string,
): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PENDING, "readwrite");
        const store = tx.objectStore(STORE_PENDING);
        store.put({
            id: crypto.randomUUID(),
            roomId,
            content,
            createdAt: new Date().toISOString(),
        });
        tx.oncomplete = () => {
            db.close();
            resolve();
        };
        tx.onerror = () => {
            db.close();
            reject(tx.error);
        };
    });
}

export async function getPendingMessages(): Promise<PendingMessage[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PENDING, "readonly");
        const req = tx.objectStore(STORE_PENDING).getAll();
        req.onsuccess = () => {
            db.close();
            resolve((req.result ?? []) as PendingMessage[]);
        };
        req.onerror = () => {
            db.close();
            reject(req.error);
        };
    });
}

export async function removePendingMessage(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PENDING, "readwrite");
        tx.objectStore(STORE_PENDING).delete(id);
        tx.oncomplete = () => {
            db.close();
            resolve();
        };
        tx.onerror = () => {
            db.close();
            reject(tx.error);
        };
    });
}
