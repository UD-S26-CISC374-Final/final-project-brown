import { GameObjects, Scene } from "phaser";

import { ensureLoopingSound, playOneShot, SOUND_KEYS, stopSound } from "../audio";
import { EventBus } from "../event-bus";
import type { ChangeableScene } from "../reactable-scene";

export class LevelSelect extends Scene implements ChangeableScene {
    background: GameObjects.Image;
    logo: GameObjects.Image;
    title: GameObjects.Text;
    logoTween: Phaser.Tweens.Tween | null;

    constructor() {
        super("LevelSelect");
    }

    create() {
        ensureLoopingSound(this, SOUND_KEYS.menuTheme, { volume: 0.075 });
        this.cameras.main.setBackgroundColor(0x74736d);

        // Panel centered on 512x384
        this.add
            .rectangle(512, 330, 860, 560, 0xefe4c7, 0.96)
            .setStrokeStyle(4, 0x5d5747)
            .setDepth(3);

        this.add
            .text(512, 75, "Select a Day", {
                fontFamily: "Pix32",
                fontSize: 34,
                color: "#2c271f",
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100);

        // Day buttons: 5 per row, centered on x=512, spacing=150
        // x positions: 212, 362, 512, 662, 812
        const dayStyle = {
            fontFamily: "Pix32",
            fontSize: 28,
            color: "#334339",
            stroke: "#efe4c7",
            strokeThickness: 1,
            backgroundColor: "#d9c783",
            padding: { left: 24, right: 24, top: 10, bottom: 10 },
            align: "center",
        };

        const makeDayButton = (x: number, y: number, label: string, day: number) => {
            const btn = this.add
                .text(x, y, label, dayStyle)
                .setOrigin(0.5)
                .setDepth(100)
                .setInteractive({ useHandCursor: true })
                .on("pointerover", () => { btn.setStyle({ backgroundColor: "#e2d39e" }); btn.setScale(1.03); })
                .on("pointerout",  () => { btn.setStyle({ backgroundColor: "#d9c783" }); btn.setScale(1); })
                .on("pointerdown", () => {
                    playOneShot(this, SOUND_KEYS.mouseClick, { volume: 0.45 });
                    stopSound(this, SOUND_KEYS.menuTheme);
                    this.scene.start("Level1", { day });
                });
            return btn;
        };

        // Row 1: Days 1–5  (y=165)
        makeDayButton(212, 165, "Day 1",  1);
        makeDayButton(362, 165, "Day 2",  2);
        makeDayButton(512, 165, "Day 3",  3);
        makeDayButton(662, 165, "Day 4",  4);
        makeDayButton(812, 165, "Day 5",  5);

        // Row 2: Days 6–10 (y=245)
        makeDayButton(212, 245, "Day 6",  6);
        makeDayButton(362, 245, "Day 7",  7);
        makeDayButton(512, 245, "Day 8",  8);
        makeDayButton(662, 245, "Day 9",  9);
        makeDayButton(812, 245, "Day 10", 10);

        // Endings divider
        this.add
            .text(512, 325, "— View Endings —", {
                fontFamily: "Pix32",
                fontSize: 22,
                color: "#7a6840",
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100);

        // Ending buttons: 3 centered on x=512, spacing=200
        // x positions: 312, 512, 712
        const endingStyle = {
            fontFamily: "Pix32",
            fontSize: 24,
            color: "#f4edd8",
            stroke: "#211d17",
            strokeThickness: 1,
            backgroundColor: "#8c7b52",
            padding: { left: 20, right: 20, top: 10, bottom: 10 },
            align: "center",
        };

        const makeEndingButton = (x: number, label: string, preview: number) => {
            const btn = this.add
                .text(x, 405, label, endingStyle)
                .setOrigin(0.5)
                .setDepth(100)
                .setInteractive({ useHandCursor: true })
                .on("pointerover", () => { btn.setStyle({ backgroundColor: "#a89566" }); btn.setScale(1.03); })
                .on("pointerout",  () => { btn.setStyle({ backgroundColor: "#8c7b52" }); btn.setScale(1); })
                .on("pointerdown", () => {
                    playOneShot(this, SOUND_KEYS.mouseClick, { volume: 0.45 });
                    stopSound(this, SOUND_KEYS.menuTheme);
                    this.scene.start("Level1", { endingPreview: preview });
                });
            return btn;
        };

        makeEndingButton(312, "Ending 1", 1);
        makeEndingButton(512, "Ending 2", 2);
        makeEndingButton(712, "Ending 3", 3);

        // Main Menu button centered at bottom
        const mainMenuButton = this.add
            .text(512, 515, "Main Menu", {
                fontFamily: "Pix32",
                fontSize: 32,
                color: "#f8f0dc",
                stroke: "#211d17",
                strokeThickness: 1,
                backgroundColor: "#44624c",
                padding: { left: 30, right: 30, top: 12, bottom: 12 },
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100)
            .setInteractive({ useHandCursor: true })
            .on("pointerover", () => { mainMenuButton.setStyle({ backgroundColor: "#53755b" }); mainMenuButton.setScale(1.03); })
            .on("pointerout",  () => { mainMenuButton.setStyle({ backgroundColor: "#44624c" }); mainMenuButton.setScale(1); })
            .on("pointerdown", () => {
                playOneShot(this, SOUND_KEYS.mouseClick, { volume: 0.45 });
                this.scene.start("MainMenu");
            });

        EventBus.emit("current-scene-ready", this);
    }

    changeScene() {
        if (this.logoTween) {
            this.logoTween.stop();
            this.logoTween = null;
        }

        this.scene.start("Tutorial");
    }

    moveSprite(callback: ({ x, y }: { x: number; y: number }) => void) {
        if (this.logoTween) {
            if (this.logoTween.isPlaying()) {
                this.logoTween.pause();
            } else {
                this.logoTween.play();
            }
        } else {
            this.logoTween = this.tweens.add({
                targets: this.logo,
                x: { value: 750, duration: 3000, ease: "Back.easeInOut" },
                y: { value: 80, duration: 1500, ease: "Sine.easeOut" },
                yoyo: true,
                repeat: -1,
                onUpdate: () => {
                    callback({
                        x: Math.floor(this.logo.x),
                        y: Math.floor(this.logo.y),
                    });
                },
            });
        }
    }
}
