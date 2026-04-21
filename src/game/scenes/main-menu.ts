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
        this.background = this.add.image(512, 384, "background");

        this.add
            .rectangle(512, 370, 640, 360, 0xdde4ee, 0.8)
            .setStrokeStyle(2, 0x7d8a9a);

        this.title = this.add
            .text(512, 200, "Emails Please", {
                fontFamily: "Pix32",
                fontSize: 96,
                color: "#2b3340",
                stroke: "#edf2f8",
                strokeThickness: 2,
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100);

        this.add
            .text(512, 300, "Sort the inbox  -  Survive the week", {
                fontFamily: "Pix32",
                fontSize: "20px",
                color: "black",
                backgroundColor: "#b1dbf1",
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100);

        this.title = this.add
            .text(512, 470, "Start Shift", {
                fontFamily: "Pix32",
                fontSize: 34,
                color: "#ffffff",
                stroke: "#27435f",
                strokeThickness: 2,
                backgroundColor: "#3e6286",
                padding: { left: 30, right: 30, top: 12, bottom: 12 },
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100)
            .setInteractive({ useHandCursor: true })
            .on("pointerover", () => {
                this.title.setStyle({ backgroundColor: "#50759a" });
                this.title.setScale(1.03);
            })
            .on("pointerout", () => {
                this.title.setStyle({ backgroundColor: "#3e6286" });
                this.title.setScale(1);
            })
            .on("pointerdown", () => this.scene.start("Level1"));

        EventBus.emit("current-scene-ready", this);
    }

    changeScene() {
        if (this.logoTween) {
            this.logoTween.stop();
            this.logoTween = null;
        }

        this.scene.start("Level1");
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
