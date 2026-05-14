import { MAX_DAYS } from "./email-content";

const SAVE_KEY = "emailsPlease.savedRun.v1";

export interface SavedRunData {
    day: number;
    totalPoints: number;
    money: number;
    daysWithoutRent: number;
    hintCount: number;
    revealCount: number;
    shieldActive: boolean;
    plotEmailsAccepted: number;
    plotEmailsRejected: number;
}

function storageAvailable() {
    return typeof localStorage !== "undefined";
}

function toNumber(value: number | undefined, fallback: number) {
    return typeof value === "number" && Number.isFinite(value) ?
            value
        :   fallback;
}

function parseSavedRun(value: string | null): SavedRunData | null {
    if (!value) {
        return null;
    }

    try {
        const parsed = JSON.parse(value) as Partial<SavedRunData>;
        const day = Math.trunc(toNumber(parsed.day, 0));

        if (day < 1 || day > MAX_DAYS) {
            return null;
        }

        return {
            day,
            totalPoints: Math.trunc(toNumber(parsed.totalPoints, 0)),
            money: Math.trunc(toNumber(parsed.money, 0)),
            daysWithoutRent: Math.trunc(toNumber(parsed.daysWithoutRent, 0)),
            hintCount: Math.trunc(toNumber(parsed.hintCount, 0)),
            revealCount: Math.trunc(toNumber(parsed.revealCount, 0)),
            shieldActive: parsed.shieldActive === true,
            plotEmailsAccepted: Math.trunc(
                toNumber(parsed.plotEmailsAccepted, 0),
            ),
            plotEmailsRejected: Math.trunc(
                toNumber(parsed.plotEmailsRejected, 0),
            ),
        };
    } catch {
        return null;
    }
}

export function loadSavedRun() {
    if (!storageAvailable()) {
        return null;
    }

    const savedRun = parseSavedRun(localStorage.getItem(SAVE_KEY));

    if (!savedRun) {
        localStorage.removeItem(SAVE_KEY);
    }

    return savedRun;
}

export function hasSavedRun() {
    return loadSavedRun() !== null;
}

export function saveRun(data: SavedRunData) {
    if (!storageAvailable()) {
        return;
    }

    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

export function clearSavedRun() {
    if (!storageAvailable()) {
        return;
    }

    localStorage.removeItem(SAVE_KEY);
}
