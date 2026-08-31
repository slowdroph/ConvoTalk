const SOUND_KEY = "notifications:sound";
const BROWSER_KEY = "notifications:browser";
const TITLE_BADGE_KEY = "notifications:title-badge";
const TITLE_BADGE_LEGACY_KEY = "notifications:titleBadge";

function readPref(key: string, fallback: boolean): boolean {
    try {
        const stored = localStorage.getItem(key);
        return stored === null ? fallback : stored === "true";
    } catch {
        return fallback;
    }
}

function writePref(key: string, value: boolean): void {
    try {
        localStorage.setItem(key, String(value));
    } catch {
        // ignore
    }
}

export function getSoundEnabled(): boolean {
    return readPref(SOUND_KEY, true);
}

export function setSoundEnabled(value: boolean): void {
    writePref(SOUND_KEY, value);
}

export function getBrowserNotificationsEnabled(): boolean {
    return readPref(BROWSER_KEY, true);
}

export function setBrowserNotificationsEnabled(value: boolean): void {
    writePref(BROWSER_KEY, value);
}

function hasPref(key: string): boolean {
    try {
        return localStorage.getItem(key) !== null;
    } catch {
        return false;
    }
}

export function getTitleBadgeEnabled(): boolean {
    // Compatibilidade com a antiga chave camelCase
    if (hasPref(TITLE_BADGE_LEGACY_KEY)) {
        return readPref(TITLE_BADGE_LEGACY_KEY, true);
    }
    return readPref(TITLE_BADGE_KEY, true);
}

export function setTitleBadgeEnabled(value: boolean): void {
    writePref(TITLE_BADGE_KEY, value);
    try {
        localStorage.removeItem(TITLE_BADGE_LEGACY_KEY);
    } catch {
        // ignore
    }
}
