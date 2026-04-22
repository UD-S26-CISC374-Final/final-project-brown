import { GameObjects, Scene } from "phaser";

import { EventBus } from "../event-bus";
import type { ChangeableScene } from "../reactable-scene";

export class MainMenu extends Scene implements ChangeableScene {
    background: GameObjects.Image;
    logo: GameObjects.Image;
    title: GameObjects.Text;
    logoTween: Phaser.Tweens.Tween | null;

    constructor() {
        super("MainMenu");
    }

    create() {
        this.cameras.main.setBackgroundColor(0x74736d);

        this.add
            .rectangle(512, 370, 660, 370, 0xefe4c7, 0.96)
            .setStrokeStyle(4, 0x5d5747)
            .setDepth(3);
        this.add
            .rectangle(512, 182, 660, 72, 0x2f3f34, 1)
            .setStrokeStyle(2, 0xb5a36a)
            .setDepth(4);
        this.add
            .rectangle(252, 296, 96, 36, 0xb5a36a, 0.88)
            .setStrokeStyle(2, 0x66563b)
            .setDepth(4);
        this.add
            .rectangle(772, 296, 96, 36, 0xb5a36a, 0.88)
            .setStrokeStyle(2, 0x66563b)
            .setDepth(4);

        this.title = this.add
            .text(512, 182, "Emails Please", {
                fontFamily: "Pix32",
                fontSize: 74,
                color: "#f4ecd8",
                stroke: "#1f281f",
                strokeThickness: 2,
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100);

        this.add
            .text(512, 278, "SECURITY MAILROOM - NIGHT SHIFT", {
                fontFamily: "Pix32",
                fontSize: "20px",
                color: "#2c271f",
                backgroundColor: "#ede1c3",
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100);

        this.add
            .text(512, 336, "Sort the inbox  -  Survive 10 days", {
                fontFamily: "Pix32",
                fontSize: "22px",
                color: "#3f4e43",
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100);

        this.add
            .text(252, 296, "FILES", {
                fontFamily: "Pix32",
                fontSize: "16px",
                color: "#2c271f",
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100);

        this.add
            .text(772, 296, "INBOX", {
                fontFamily: "Pix32",
                fontSize: "16px",
                color: "#2c271f",
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100);

        const tutorialButton = this.add
            .text(512, 448, "Tutorial", {
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
                tutorialButton.setStyle({ backgroundColor: "#53755b" });
                tutorialButton.setScale(1.03);
            })
            .on("pointerout", () => {
                tutorialButton.setStyle({ backgroundColor: "#44624c" });
                tutorialButton.setScale(1);
            })
            .on("pointerdown", () => this.scene.start("Tutorial"));

        const startButton = this.add
            .text(512, 548, "Start Shift", {
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
                startButton.setStyle({ backgroundColor: "#e2d39e" });
                startButton.setScale(1.03);
            })
            .on("pointerout", () => {
                startButton.setStyle({ backgroundColor: "#d9c783" });
                startButton.setScale(1);
            })
            .on("pointerdown", () => this.scene.start("Level1"));

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
