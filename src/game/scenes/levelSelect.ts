import { GameObjects, Scene } from "phaser";

import { ensureLoopingSound, playOneShot, SOUND_KEYS, stopSound } from "../audio";
import { EventBus } from "../event-bus";
import type { ChangeableScene } from "../reactable-scene";

const W = 1024;
const H = 768;

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

        // --- Background ---
        if (this.textures.exists("desk-background")) {
            this.add
                .image(W / 2, H / 2, "desk-background")
                .setDisplaySize(W, H)
                .setDepth(0);
        } else {
            this.cameras.main.setBackgroundColor(0x1a2018);
        }
        this.add.rectangle(W / 2, H / 2, W, H, 0x090d09, 0.72).setDepth(1);

        // --- Card ---
        const cardX = W / 2;
        const cardY = H / 2 + 10;
        const cardW = 880;
        const cardH = 530;

        this.add.rectangle(cardX + 8, cardY + 8, cardW, cardH, 0x000000, 0.45).setDepth(2);
        this.add
            .rectangle(cardX, cardY, cardW, cardH, 0xf0e4c4, 1)
            .setStrokeStyle(3, 0x7a6030)
            .setDepth(3);
        this.add
            .rectangle(cardX, cardY, cardW - 16, cardH - 16, 0x000000, 0)
            .setStrokeStyle(1, 0xb5953a)
            .setDepth(3);

        // --- Header ---
        const headerH = 72;
        const headerY = cardY - cardH / 2 + headerH / 2;

        this.add
            .rectangle(cardX, headerY, cardW, headerH, 0x1b3022, 1)
            .setStrokeStyle(2, 0xb5953a)
            .setDepth(4);
        this.add
            .rectangle(cardX, headerY + headerH / 2 + 1, cardW, 3, 0xd4a830, 1)
            .setDepth(4);

        this.add
            .text(cardX, headerY, "Select a Day", {
                fontFamily: "Pix32",
                fontSize: 52,
                color: "#f2e8d0",
                stroke: "#0d180d",
                strokeThickness: 2,
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(10);

        // --- Ruled lines ---
        const gfx = this.add.graphics().setDepth(3);
        gfx.lineStyle(1, 0xc8a96e, 0.3);
        const lineTop = headerY + headerH / 2 + 22;
        for (let i = 0; i < 9; i++) {
            gfx.moveTo(cardX - cardW / 2 + 28, lineTop + i * 34);
            gfx.lineTo(cardX + cardW / 2 - 28, lineTop + i * 34);
        }
        gfx.strokePath();

        // Red margin line
        gfx.lineStyle(1, 0xc06050, 0.4);
        gfx.moveTo(cardX - cardW / 2 + 68, lineTop);
        gfx.lineTo(cardX - cardW / 2 + 68, cardY + cardH / 2 - 20);
        gfx.strokePath();

        // --- Day buttons ---
        const bodyTopY = headerY + headerH / 2 + 16;
        const row1Y = bodyTopY + 44;
        const row2Y = row1Y + 78;
        const dayXPositions = [162, 337, 512, 687, 862];

        const dayStyle = {
            fontFamily: "Pix32",
            fontSize: 26,
            color: "#2a3a2a",
            stroke: "#f0e8d4",
            strokeThickness: 1,
            backgroundColor: "#d4a830",
            padding: { left: 18, right: 18, top: 9, bottom: 9 },
            align: "center",
        };

        const makeDayButton = (x: number, y: number, label: string, day: number) => {
            const btn = this.add
                .text(x, y, label, dayStyle)
                .setOrigin(0.5)
                .setDepth(10)
                .setInteractive({ useHandCursor: true })
                .on("pointerover", () => { btn.setStyle({ backgroundColor: "#e0bc50" }); btn.setScale(1.05); })
                .on("pointerout",  () => { btn.setStyle({ backgroundColor: "#d4a830" }); btn.setScale(1); })
                .on("pointerdown", () => {
                    playOneShot(this, SOUND_KEYS.mouseClick, { volume: 0.45 });
                    stopSound(this, SOUND_KEYS.menuTheme);
                    this.scene.start("Level1", { day });
                });
            return btn;
        };

        dayXPositions.forEach((x, i) => makeDayButton(x, row1Y, `Day ${i + 1}`, i + 1));
        dayXPositions.forEach((x, i) => makeDayButton(x, row2Y, `Day ${i + 6}`, i + 6));

        // --- Divider ---
        const dividerY = row2Y + 56;
        const divGfx = this.add.graphics().setDepth(5);
        divGfx.lineStyle(1, 0xb5953a, 0.7);
        divGfx.moveTo(cardX - 300, dividerY);
        divGfx.lineTo(cardX + 300, dividerY);
        divGfx.strokePath();

        this.add
            .text(cardX, dividerY, "— View Endings —", {
                fontFamily: "Pix32",
                fontSize: 20,
                color: "#7a6040",
                backgroundColor: "#f0e4c4",
                padding: { left: 10, right: 10, top: 0, bottom: 0 },
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(6);

        // --- Ending buttons ---
        const endingY = dividerY + 54;
        const endingStyle = {
            fontFamily: "Pix32",
            fontSize: 22,
            color: "#f4edd8",
            stroke: "#211d17",
            strokeThickness: 1,
            backgroundColor: "#5a4a32",
            padding: { left: 20, right: 20, top: 10, bottom: 10 },
            align: "center",
        };

        const makeEndingButton = (x: number, label: string, preview: number) => {
            const btn = this.add
                .text(x, endingY, label, endingStyle)
                .setOrigin(0.5)
                .setDepth(10)
                .setInteractive({ useHandCursor: true })
                .on("pointerover", () => { btn.setStyle({ backgroundColor: "#7a6848" }); btn.setScale(1.05); })
                .on("pointerout",  () => { btn.setStyle({ backgroundColor: "#5a4a32" }); btn.setScale(1); })
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

        // --- Main Menu button ---
        const btnY = cardY + cardH / 2 - 46;
        const mainMenuButton = this.add
            .text(cardX, btnY, "Main Menu", {
                fontFamily: "Pix32",
                fontSize: 28,
                color: "#f0e8d4",
                stroke: "#1a2a1a",
                strokeThickness: 1,
                backgroundColor: "#3a5c42",
                padding: { left: 28, right: 28, top: 10, bottom: 10 },
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(10)
            .setInteractive({ useHandCursor: true })
            .on("pointerover", () => { mainMenuButton.setStyle({ backgroundColor: "#4e7a56" }); mainMenuButton.setScale(1.05); })
            .on("pointerout",  () => { mainMenuButton.setStyle({ backgroundColor: "#3a5c42" }); mainMenuButton.setScale(1); })
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
