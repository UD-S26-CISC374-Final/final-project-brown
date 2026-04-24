import { Scene } from "phaser";

export const SOUND_KEYS = {
    fanAudio: "fan-audio",
    dudeNoise: "dude-noise",
    correctDing: "correct-ding",
    wrongBuzzer: "wrong-buzzer",
    pageTurn: "page-turn",
    mouseClick: "mouse-click",
    emailNoti: "email-noti",
} as const;

export function ensureLoopingSound(
    scene: Scene,
    key: string,
    config: Phaser.Types.Sound.SoundConfig = {},
) {
    const existing = scene.sound.get(key) as Phaser.Sound.BaseSound | null;
    if (existing !== null) {
        if (!existing.isPlaying) {
            existing.play();
        }
        return existing;
    }

    const sound = scene.sound.add(key, { loop: true, ...config });
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
    scene.sound.play(key, config);
}
