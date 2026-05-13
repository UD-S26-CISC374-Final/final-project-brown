import { GameObjects, Scene } from "phaser";

import {
    ensureLoopingSound,
    playOneShot,
    SOUND_KEYS,
    stopSound,
} from "../audio";
import { EventBus } from "../event-bus";
import type { ChangeableScene } from "../reactable-scene";

const W = 1024;
const H = 768;

export class MainMenu extends Scene implements ChangeableScene {
    background: GameObjects.Image;
    logo: GameObjects.Image;
    title: GameObjects.Text;
    logoTween: Phaser.Tweens.Tween | null;

    constructor() {
        super("MainMenu");
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

        // Dark night overlay
        this.add.rectangle(W / 2, H / 2, W, H, 0x090d09, 0.72).setDepth(1);

        // --- Main card ---
        const cardX = W / 2;
        const cardY = H / 2 + 10;
        const cardW = 700;
        const cardH = 430;

        // Drop shadow
        this.add
            .rectangle(cardX + 8, cardY + 8, cardW, cardH, 0x000000, 0.45)
            .setDepth(2);

        // Parchment body
        this.add
            .rectangle(cardX, cardY, cardW, cardH, 0xf0e4c4, 1)
            .setStrokeStyle(3, 0x7a6030)
            .setDepth(3);

        // Thin inner border
        this.add
            .rectangle(cardX, cardY, cardW - 16, cardH - 16, 0x000000, 0)
            .setStrokeStyle(1, 0xb5953a)
            .setDepth(3);

        // --- Header bar ---
        const headerH = 82;
        const headerY = cardY - cardH / 2 + headerH / 2;

        this.add
            .rectangle(cardX, headerY, cardW, headerH, 0x1b3022, 1)
            .setStrokeStyle(2, 0xb5953a)
            .setDepth(4);

        // Gold accent line below header
        this.add
            .rectangle(cardX, headerY + headerH / 2 + 1, cardW, 3, 0xd4a830, 1)
            .setDepth(4);

        // Title
        this.title = this.add
            .text(cardX, headerY, "Emails, Please", {
                fontFamily: "Pix32",
                fontSize: 70,
                color: "#f2e8d0",
                stroke: "#0d180d",
                strokeThickness: 3,
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(10);

        // Gentle title float
        this.tweens.add({
            targets: this.title,
            y: headerY - 4,
            duration: 2200,
            ease: "Sine.easeInOut",
            yoyo: true,
            repeat: -1,
        });

        // --- Ruled lines on parchment ---
        const gfx = this.add.graphics().setDepth(3);
        gfx.lineStyle(1, 0xc8a96e, 0.35);
        const lineTop = headerY + headerH / 2 + 28;
        for (let i = 0; i < 7; i++) {
            gfx.moveTo(cardX - cardW / 2 + 28, lineTop + i * 34);
            gfx.lineTo(cardX + cardW / 2 - 28, lineTop + i * 34);
        }
        gfx.strokePath();

        // Red margin line
        gfx.lineStyle(1, 0xc06050, 0.45);
        gfx.moveTo(cardX - cardW / 2 + 68, lineTop);
        gfx.lineTo(cardX - cardW / 2 + 68, cardY + cardH / 2 - 20);
        gfx.strokePath();

        // --- Subtitle area ---
        const bodyTopY = headerY + headerH / 2 + 16;

        this.add
            .text(cardX, bodyTopY + 25, " SECURITY MAILROOM  —  NIGHT SHIFT ", {
                fontFamily: "Pix32",
                fontSize: "18px",
                color: "#f2e8d0",
                align: "center",
                fontStyle: "bold",
            })
            .setBackgroundColor("#1b3022")
            .setOrigin(0.5)
            .setDepth(10);

        // Blinking night badge
        const nightBadge = this.add
            .text(cardX + 238, bodyTopY + 20, "●", {
                fontFamily: "Pix32",
                fontSize: "16px",
                color: "#c05030",
            })
            .setOrigin(0.5)
            .setDepth(10);

        this.tweens.add({
            targets: nightBadge,
            alpha: 0,
            duration: 700,
            ease: "Stepped",
            easeParams: [1],
            yoyo: true,
            repeat: -1,
        });

        // Separator
        const sepGfx = this.add.graphics().setDepth(5);
        sepGfx.lineStyle(1, 0xb5953a, 0.8);
        sepGfx.moveTo(cardX - 270, bodyTopY + 38);
        sepGfx.lineTo(cardX + 270, bodyTopY + 38);
        sepGfx.strokePath();

        // Tagline
        this.add
            .text(cardX, bodyTopY + 68, " Sort the inbox.  Survive 10 days. ", {
                fontFamily: "Pix32",
                fontSize: "22px",
                color: "#3a4e3e",
                align: "center",
                fontStyle: "bold",
            })
            .setOrigin(0.5)
            .setDepth(10);

        // Flavor line
        this.add
            .text(cardX, bodyTopY + 105, "Night shift has just begun...", {
                fontFamily: "Pix32",
                fontSize: "16px",
                color: "#7a6848",
                align: "center",
                fontStyle: "italic",
            })
            .setOrigin(0.5)
            .setDepth(10);

        // --- Buttons ---
        const btnY = cardY + cardH / 2 - 54;

        const tutorialButton = this.add
            .text(cardX - 220, btnY, "Tutorial", {
                fontFamily: "Pix32",
                fontSize: 28,
                color: "#f0e8d4",
                stroke: "#1a2a1a",
                strokeThickness: 1,
                backgroundColor: "#3a5c42",
                padding: { left: 24, right: 24, top: 10, bottom: 10 },
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(10)
            .setInteractive({ useHandCursor: true })
            .on("pointerover", () => {
                tutorialButton.setStyle({ backgroundColor: "#4e7a56" });
                tutorialButton.setScale(1.05);
            })
            .on("pointerout", () => {
                tutorialButton.setStyle({ backgroundColor: "#3a5c42" });
                tutorialButton.setScale(1);
            })
            .on("pointerdown", () => {
                playOneShot(this, SOUND_KEYS.mouseClick, { volume: 0.45 });
                this.scene.start("Tutorial");
            });

        const startButton = this.add
            .text(cardX, btnY, "Start Shift", {
                fontFamily: "Pix32",
                fontSize: 32,
                color: "#2a3a2a",
                stroke: "#f0e8d4",
                strokeThickness: 1,
                backgroundColor: "#d4a830",
                padding: { left: 28, right: 28, top: 11, bottom: 11 },
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(10)
            .setInteractive({ useHandCursor: true })
            .on("pointerover", () => {
                startButton.setStyle({ backgroundColor: "#e0bc50" });
                startButton.setScale(1.05);
            })
            .on("pointerout", () => {
                startButton.setStyle({ backgroundColor: "#d4a830" });
                startButton.setScale(1);
            })
            .on("pointerdown", () => {
                playOneShot(this, SOUND_KEYS.mouseClick, { volume: 0.45 });
                stopSound(this, SOUND_KEYS.menuTheme);
                this.scene.start("Level1", { day: 1 });
            });

        const levelSelectButton = this.add
            .text(cardX + 220, btnY, "Level Select", {
                fontFamily: "Pix32",
                fontSize: 22,
                color: "#f0e8d4",
                stroke: "#1a2a1a",
                strokeThickness: 1,
                backgroundColor: "#3a5c42",
                padding: { left: 18, right: 18, top: 10, bottom: 10 },
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(10)
            .setInteractive({ useHandCursor: true })
            .on("pointerover", () => {
                levelSelectButton.setStyle({ backgroundColor: "#4e7a56" });
                levelSelectButton.setScale(1.05);
            })
            .on("pointerout", () => {
                levelSelectButton.setStyle({ backgroundColor: "#3a5c42" });
                levelSelectButton.setScale(1);
            })
            .on("pointerdown", () => {
                playOneShot(this, SOUND_KEYS.mouseClick, { volume: 0.45 });
                this.scene.start("LevelSelect");
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
