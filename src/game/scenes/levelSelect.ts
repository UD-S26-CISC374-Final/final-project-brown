import { GameObjects, Scene } from "phaser";

import { playOneShot, SOUND_KEYS } from "../audio";
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
        this.cameras.main.setBackgroundColor(0x74736d);

        this.add
            .rectangle(520, 340, 860, 570, 0xefe4c7, 0.96)
            .setStrokeStyle(4, 0x5d5747)
            .setDepth(3);

        const mainMenuButton = this.add
            .text(512, 548, "Main Menu", {
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
            .on("pointerover", () => {
                mainMenuButton.setStyle({ backgroundColor: "#53755b" });
                mainMenuButton.setScale(1.03);
            })
            .on("pointerout", () => {
                mainMenuButton.setStyle({ backgroundColor: "#44624c" });
                mainMenuButton.setScale(1);
            })
            .on("pointerdown", () => {
                playOneShot(this, SOUND_KEYS.mouseClick, { volume: 0.45 });
                this.scene.start("MainMenu");
            });

        const day1 = this.add
            .text(162, 148, "Day 1", {
                fontFamily: "Pix32",
                fontSize: 28,
                color: "#334339",
                stroke: "#efe4c7",
                strokeThickness: 1,
                backgroundColor: "#d9c783",
                padding: { left: 24, right: 24, top: 10, bottom: 10 },
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100)
            .setInteractive({ useHandCursor: true })
            .on("pointerover", () => {
                day1.setStyle({ backgroundColor: "#e2d39e" });
                day1.setScale(1.03);
            })
            .on("pointerout", () => {
                day1.setStyle({ backgroundColor: "#d9c783" });
                day1.setScale(1);
            })
            .on("pointerdown", () => {
                playOneShot(this, SOUND_KEYS.mouseClick, { volume: 0.45 });
                this.scene.start("Level1");
            });

        const day2 = this.add
            .text(312, 148, "Day 2", {
                fontFamily: "Pix32",
                fontSize: 28,
                color: "#334339",
                stroke: "#efe4c7",
                strokeThickness: 1,
                backgroundColor: "#d9c783",
                padding: { left: 24, right: 24, top: 10, bottom: 10 },
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100)
            .setInteractive({ useHandCursor: true })
            .on("pointerover", () => {
                day2.setStyle({ backgroundColor: "#e2d39e" });
                day2.setScale(1.03);
            })
            .on("pointerout", () => {
                day2.setStyle({ backgroundColor: "#d9c783" });
                day2.setScale(1);
            })
            .on("pointerdown", () => {
                playOneShot(this, SOUND_KEYS.mouseClick, { volume: 0.45 });
                this.scene.start("Level1", { day: 2 });
            });

        const day3 = this.add
            .text(462, 148, "Day 3", {
                fontFamily: "Pix32",
                fontSize: 28,
                color: "#334339",
                stroke: "#efe4c7",
                strokeThickness: 1,
                backgroundColor: "#d9c783",
                padding: { left: 24, right: 24, top: 10, bottom: 10 },
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100)
            .setInteractive({ useHandCursor: true })
            .on("pointerover", () => {
                day3.setStyle({ backgroundColor: "#e2d39e" });
                day3.setScale(1.03);
            })
            .on("pointerout", () => {
                day3.setStyle({ backgroundColor: "#d9c783" });
                day3.setScale(1);
            })
            .on("pointerdown", () => {
                playOneShot(this, SOUND_KEYS.mouseClick, { volume: 0.45 });
                this.scene.start("Level1", { day: 3 });
            });

        const day4 = this.add
            .text(612, 148, "Day 4", {
                fontFamily: "Pix32",
                fontSize: 28,
                color: "#334339",
                stroke: "#efe4c7",
                strokeThickness: 1,
                backgroundColor: "#d9c783",
                padding: { left: 24, right: 24, top: 10, bottom: 10 },
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100)
            .setInteractive({ useHandCursor: true })
            .on("pointerover", () => {
                day4.setStyle({ backgroundColor: "#e2d39e" });
                day4.setScale(1.03);
            })
            .on("pointerout", () => {
                day4.setStyle({ backgroundColor: "#d9c783" });
                day4.setScale(1);
            })
            .on("pointerdown", () => {
                playOneShot(this, SOUND_KEYS.mouseClick, { volume: 0.45 });
                this.scene.start("Level1", { day: 4 });
            });

        const day5 = this.add
            .text(762, 148, "Day 5", {
                fontFamily: "Pix32",
                fontSize: 28,
                color: "#334339",
                stroke: "#efe4c7",
                strokeThickness: 1,
                backgroundColor: "#d9c783",
                padding: { left: 24, right: 24, top: 10, bottom: 10 },
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100)
            .setInteractive({ useHandCursor: true })
            .on("pointerover", () => {
                day5.setStyle({ backgroundColor: "#e2d39e" });
                day5.setScale(1.03);
            })
            .on("pointerout", () => {
                day5.setStyle({ backgroundColor: "#d9c783" });
                day5.setScale(1);
            })
            .on("pointerdown", () => {
                playOneShot(this, SOUND_KEYS.mouseClick, { volume: 0.45 });
                this.scene.start("Level1", { day: 5 });
            });

        const day6 = this.add
            .text(162, 248, "Day 6", {
                fontFamily: "Pix32",
                fontSize: 28,
                color: "#334339",
                stroke: "#efe4c7",
                strokeThickness: 1,
                backgroundColor: "#d9c783",
                padding: { left: 24, right: 24, top: 10, bottom: 10 },
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100)
            .setInteractive({ useHandCursor: true })
            .on("pointerover", () => {
                day6.setStyle({ backgroundColor: "#e2d39e" });
                day6.setScale(1.03);
            })
            .on("pointerout", () => {
                day6.setStyle({ backgroundColor: "#d9c783" });
                day6.setScale(1);
            })
            .on("pointerdown", () => {
                playOneShot(this, SOUND_KEYS.mouseClick, { volume: 0.45 });
                this.scene.start("Level1", { day: 6 });
            });

        const day7 = this.add
            .text(312, 248, "Day 7", {
                fontFamily: "Pix32",
                fontSize: 28,
                color: "#334339",
                stroke: "#efe4c7",
                strokeThickness: 1,
                backgroundColor: "#d9c783",
                padding: { left: 24, right: 24, top: 10, bottom: 10 },
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100)
            .setInteractive({ useHandCursor: true })
            .on("pointerover", () => {
                day7.setStyle({ backgroundColor: "#e2d39e" });
                day7.setScale(1.03);
            })
            .on("pointerout", () => {
                day7.setStyle({ backgroundColor: "#d9c783" });
                day7.setScale(1);
            })
            .on("pointerdown", () => {
                playOneShot(this, SOUND_KEYS.mouseClick, { volume: 0.45 });
                this.scene.start("Level1", { day: 7 });
            });

        const day8 = this.add
            .text(462, 248, "Day 8", {
                fontFamily: "Pix32",
                fontSize: 28,
                color: "#334339",
                stroke: "#efe4c7",
                strokeThickness: 1,
                backgroundColor: "#d9c783",
                padding: { left: 24, right: 24, top: 10, bottom: 10 },
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100)
            .setInteractive({ useHandCursor: true })
            .on("pointerover", () => {
                day8.setStyle({ backgroundColor: "#e2d39e" });
                day8.setScale(1.03);
            })
            .on("pointerout", () => {
                day8.setStyle({ backgroundColor: "#d9c783" });
                day8.setScale(1);
            })
            .on("pointerdown", () => {
                playOneShot(this, SOUND_KEYS.mouseClick, { volume: 0.45 });
                this.scene.start("Level1", { day: 8 });
            });

        const day9 = this.add
            .text(612, 248, "Day 9", {
                fontFamily: "Pix32",
                fontSize: 28,
                color: "#334339",
                stroke: "#efe4c7",
                strokeThickness: 1,
                backgroundColor: "#d9c783",
                padding: { left: 24, right: 24, top: 10, bottom: 10 },
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100)
            .setInteractive({ useHandCursor: true })
            .on("pointerover", () => {
                day9.setStyle({ backgroundColor: "#e2d39e" });
                day9.setScale(1.03);
            })
            .on("pointerout", () => {
                day9.setStyle({ backgroundColor: "#d9c783" });
                day9.setScale(1);
            })
            .on("pointerdown", () => {
                playOneShot(this, SOUND_KEYS.mouseClick, { volume: 0.45 });
                this.scene.start("Level1", { day: 9 });
            });

        const day10 = this.add
            .text(762, 248, "Day 10", {
                fontFamily: "Pix32",
                fontSize: 28,
                color: "#334339",
                stroke: "#efe4c7",
                strokeThickness: 1,
                backgroundColor: "#d9c783",
                padding: { left: 24, right: 24, top: 10, bottom: 10 },
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100)
            .setInteractive({ useHandCursor: true })
            .on("pointerover", () => {
                day10.setStyle({ backgroundColor: "#e2d39e" });
                day10.setScale(1.03);
            })
            .on("pointerout", () => {
                day10.setStyle({ backgroundColor: "#d9c783" });
                day10.setScale(1);
            })
            .on("pointerdown", () => {
                playOneShot(this, SOUND_KEYS.mouseClick, { volume: 0.45 });
                this.scene.start("Level1", { day: 10 });
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
