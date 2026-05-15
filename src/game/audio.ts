import { Scene } from "phaser";
import { getGameSettings } from "./settings";

export const SOUND_KEYS = {
    fanAudio: "fan-audio",
    dudeNoise: "dude-noise",
    correctDing: "correct-ding",
    wrongBuzzer: "wrong-buzzer",
    pageTurn: "page-turn",
    mouseClick: "mouse-click",
    emailNoti: "email-noti",
    hey: "hey",
    menuTheme: "menu-theme",
    carStop: "car-stop",
    openClose: "open-close",
    footsteps: "footsteps",
    doorKnock: "door-knock",
    zombie: "zombie-sound",
    shot: "shot",
    policeSiren: "police-siren",
    elevator: "elevator",
    gunshot: "gunshot",
    keyHit1: "key-hit-1",
    keyHit2: "key-hit-2",
    keyHit3: "key-hit-3",
} as const;

export const CAPTCHA_KEY_HIT_SOUND_KEYS = [
    SOUND_KEYS.keyHit1,
    SOUND_KEYS.keyHit2,
    SOUND_KEYS.keyHit3,
] as string[];

const MUSIC_SOUND_KEYS = new Set<string>([
    SOUND_KEYS.fanAudio,
    SOUND_KEYS.dudeNoise,
    SOUND_KEYS.menuTheme,
]);

const BASE_SOUND_VOLUMES: Record<string, number> = {
    [SOUND_KEYS.fanAudio]: 0.0625,
    [SOUND_KEYS.dudeNoise]: 0.32,
    [SOUND_KEYS.menuTheme]: 0.075,
};

type AdjustableSound = Phaser.Sound.BaseSound & {
    setVolume?: (value: number) => Phaser.Sound.BaseSound;
    volume?: number;
};

function setSoundVolume(sound: Phaser.Sound.BaseSound, volume: number) {
    const adjustableSound = sound as AdjustableSound;

    if (typeof adjustableSound.setVolume === "function") {
        adjustableSound.setVolume(volume);
    } else {
        adjustableSound.volume = volume;
    }
}

export function getConfiguredVolume(key: string, baseVolume = 1) {
    const settings = getGameSettings();
    const categoryVolume =
        MUSIC_SOUND_KEYS.has(key) ? settings.musicVolume : settings.sfxVolume;

    return Phaser.Math.Clamp(baseVolume * categoryVolume, 0, 1);
}

export function applySoundSettings(scene: Scene) {
    const settings = getGameSettings();
    scene.sound.mute = settings.muted;
    scene.sound.volume = settings.masterVolume;

    for (const key of Object.keys(BASE_SOUND_VOLUMES)) {
        for (const sound of scene.sound.getAll(key)) {
            setSoundVolume(
                sound,
                getConfiguredVolume(key, BASE_SOUND_VOLUMES[key]),
            );
        }
    }
}

export function ensureLoopingSound(
    scene: Scene,
    key: string,
    config: Phaser.Types.Sound.SoundConfig = {},
) {
    applySoundSettings(scene);
    const volume = getConfiguredVolume(key, config.volume ?? 1);
    const existing = scene.sound.get(key) as Phaser.Sound.BaseSound | null;
    if (existing !== null) {
        setSoundVolume(existing, volume);
        if (!existing.isPlaying) {
            existing.play();
        }
        return existing;
    }

    const sound = scene.sound.add(key, { loop: true, ...config, volume });
    sound.play();
    return sound;
}

export function stopSound(scene: Scene, key: string) {
    const sound = scene.sound.get(key) as Phaser.Sound.BaseSound | null;
    if (sound !== null && sound.isPlaying) {
        sound.stop();
    }
}

export function playOneShot(
    scene: Scene,
    key: string,
    config: Phaser.Types.Sound.SoundConfig = {},
) {
    applySoundSettings(scene);
    scene.sound.play(key, {
        ...config,
        volume: getConfiguredVolume(key, config.volume ?? 1),
    });
}
