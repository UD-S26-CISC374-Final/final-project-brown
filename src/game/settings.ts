const SETTINGS_KEY = "emailsPlease.settings.v1";

export interface GameSettings {
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
    muted: boolean;
    reducedDistractions: boolean;
}

export const DEFAULT_SETTINGS: GameSettings = {
    masterVolume: 1,
    musicVolume: 1,
    sfxVolume: 1,
    muted: false,
    reducedDistractions: false,
};

function storageAvailable() {
    return typeof localStorage !== "undefined";
}

function clampVolume(value: unknown, fallback: number) {
    return typeof value === "number" && Number.isFinite(value) ?
            Phaser.Math.Clamp(value, 0, 1)
        :   fallback;
}

function parseSettings(raw: string | null): GameSettings {
    if (!raw) {
        return { ...DEFAULT_SETTINGS };
    }

    try {
        const parsed = JSON.parse(raw) as Partial<GameSettings>;
        return {
            masterVolume: clampVolume(
                parsed.masterVolume,
                DEFAULT_SETTINGS.masterVolume,
            ),
            musicVolume: clampVolume(
                parsed.musicVolume,
                DEFAULT_SETTINGS.musicVolume,
            ),
            sfxVolume: clampVolume(
                parsed.sfxVolume,
                DEFAULT_SETTINGS.sfxVolume,
            ),
            muted: parsed.muted === true,
            reducedDistractions: parsed.reducedDistractions === true,
        };
    } catch {
        return { ...DEFAULT_SETTINGS };
    }
}

export function getGameSettings() {
    if (!storageAvailable()) {
        return { ...DEFAULT_SETTINGS };
    }

    return parseSettings(localStorage.getItem(SETTINGS_KEY));
}

export function saveGameSettings(settings: GameSettings) {
    if (!storageAvailable()) {
        return;
    }

    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function updateGameSettings(changes: Partial<GameSettings>) {
    const settings = {
        ...getGameSettings(),
        ...changes,
    };

    settings.masterVolume = clampVolume(
        settings.masterVolume,
        DEFAULT_SETTINGS.masterVolume,
    );
    settings.musicVolume = clampVolume(
        settings.musicVolume,
        DEFAULT_SETTINGS.musicVolume,
    );
    settings.sfxVolume = clampVolume(
        settings.sfxVolume,
        DEFAULT_SETTINGS.sfxVolume,
    );

    saveGameSettings(settings);
    return settings;
}

export function resetGameSettings() {
    saveGameSettings(DEFAULT_SETTINGS);
    return { ...DEFAULT_SETTINGS };
}
