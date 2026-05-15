import { Scene } from "phaser";
import {
    applySoundSettings,
    ensureLoopingSound,
    playOneShot,
    SOUND_KEYS,
} from "../audio";
import {
    getGameSettings,
    resetGameSettings,
    type GameSettings,
    updateGameSettings,
} from "../settings";

const W = 1024;
const H = 768;

type VolumeSetting = "masterVolume" | "musicVolume" | "sfxVolume";

export class Options extends Scene {
    private settings: GameSettings = getGameSettings();
    private valueTexts: Partial<
        Record<VolumeSetting, Phaser.GameObjects.Text>
    > = {};
    private muteButton!: Phaser.GameObjects.Text;
    private reducedButton!: Phaser.GameObjects.Text;

    constructor() {
        super("Options");
    }

    create() {
        applySoundSettings(this);
        ensureLoopingSound(this, SOUND_KEYS.menuTheme, { volume: 0.075 });

        if (this.textures.exists("desk-background")) {
            this.add
                .image(W / 2, H / 2, "desk-background")
                .setDisplaySize(W, H);
        } else {
            this.cameras.main.setBackgroundColor(0x1a2018);
        }

        this.add.rectangle(W / 2, H / 2, W, H, 0x090d09, 0.72);

        const cardX = W / 2;
        const cardY = H / 2 + 10;
        const cardW = 760;
        const cardH = 520;

        this.add.rectangle(cardX + 8, cardY + 8, cardW, cardH, 0x000000, 0.45);
        this.add
            .rectangle(cardX, cardY, cardW, cardH, 0xf0e4c4, 1)
            .setStrokeStyle(3, 0x7a6030);
        this.add
            .rectangle(cardX, cardY, cardW - 16, cardH - 16, 0x000000, 0)
            .setStrokeStyle(1, 0xb5953a);

        const headerY = cardY - cardH / 2 + 42;
        this.add
            .rectangle(cardX, headerY, cardW, 84, 0x1b3022, 1)
            .setStrokeStyle(2, 0xb5953a);
        this.add.rectangle(cardX, headerY + 43, cardW, 3, 0xd4a830, 1);
        this.add
            .text(cardX, headerY, "Options", {
                fontFamily: "Dotemp-8bit",
                fontSize: 58,
                color: "#f2e8d0",
                stroke: "#0d180d",
                strokeThickness: 2,
                align: "center",
            })
            .setOrigin(0.5);

        this.createVolumeRow(260, "Master", "masterVolume");
        this.createVolumeRow(330, "Music", "musicVolume");
        this.createVolumeRow(400, "SFX", "sfxVolume");

        this.muteButton = this.createButton(
            382,
            486,
            this.getMuteLabel(),
            "#5a4a32",
            () => {
                this.settings = updateGameSettings({
                    muted: !this.settings.muted,
                });
                this.refreshControls();
            },
            240,
        );

        this.reducedButton = this.createButton(
            642,
            486,
            this.getReducedLabel(),
            "#5a4a32",
            () => {
                this.settings = updateGameSettings({
                    reducedDistractions: !this.settings.reducedDistractions,
                });
                this.refreshControls();
            },
            260,
        );

        this.createButton(372, 590, "Reset", "#66563b", () => {
            this.settings = resetGameSettings();
            this.refreshControls();
        });

        this.createButton(652, 590, "Back", "#3a5c42", () => {
            this.scene.start("MainMenu");
        });

        this.refreshControls();
    }

    private createVolumeRow(y: number, label: string, setting: VolumeSetting) {
        this.add
            .text(270, y, label, {
                fontFamily: "Dotemp-8bit",
                fontSize: 28,
                color: "#2f4b36",
                align: "left",
                fixedWidth: 150,
            })
            .setOrigin(0, 0.5);

        this.createButton(
            470,
            y,
            "-",
            "#66563b",
            () => {
                this.adjustVolume(setting, -0.1);
            },
            58,
        );

        this.valueTexts[setting] = this.add
            .text(560, y, "", {
                fontFamily: "Dotemp-8bit",
                fontSize: 24,
                color: "#2a251c",
                align: "center",
                backgroundColor: "#e8d9a8",
                fixedWidth: 132,
                padding: { left: 8, right: 8, top: 8, bottom: 8 },
            })
            .setOrigin(0.5);

        this.createButton(
            650,
            y,
            "+",
            "#66563b",
            () => {
                this.adjustVolume(setting, 0.1);
            },
            58,
        );
    }

    private adjustVolume(setting: VolumeSetting, delta: number) {
        const nextValue = Phaser.Math.Clamp(
            this.settings[setting] + delta,
            0,
            1,
        );
        this.settings = updateGameSettings({
            [setting]: Number(nextValue.toFixed(1)),
        });
        this.refreshControls();
    }

    private createButton(
        x: number,
        y: number,
        label: string,
        backgroundColor: string,
        onClick: () => void,
        fixedWidth = 220,
    ) {
        const button = this.add
            .text(x, y, label, {
                fontFamily: "Dotemp-8bit",
                fontSize: 24,
                color: "#f8f0dc",
                stroke: "#211d17",
                strokeThickness: 1,
                backgroundColor,
                fixedWidth,
                align: "center",
                padding: { left: 8, right: 8, top: 11, bottom: 11 },
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        const hoverColor = this.brightenColor(backgroundColor, 18);
        button.on("pointerover", () => {
            button.setStyle({ backgroundColor: hoverColor });
            button.setScale(1.03);
        });
        button.on("pointerout", () => {
            button.setStyle({ backgroundColor });
            button.setScale(1);
        });
        button.on("pointerdown", () => {
            playOneShot(this, SOUND_KEYS.mouseClick, { volume: 0.45 });
            onClick();
        });

        return button;
    }

    private refreshControls() {
        applySoundSettings(this);

        this.valueTexts.masterVolume?.setText(
            this.formatVolume(this.settings.masterVolume),
        );
        this.valueTexts.musicVolume?.setText(
            this.formatVolume(this.settings.musicVolume),
        );
        this.valueTexts.sfxVolume?.setText(
            this.formatVolume(this.settings.sfxVolume),
        );
        this.muteButton.setText(this.getMuteLabel());
        this.reducedButton.setText(this.getReducedLabel());
    }

    private formatVolume(value: number) {
        return `${Math.round(value * 100)}%`;
    }

    private getMuteLabel() {
        return `Mute: ${this.settings.muted ? "On" : "Off"}`;
    }

    private getReducedLabel() {
        return `Distractions: ${
            this.settings.reducedDistractions ? "Low" : "Normal"
        }`;
    }

    private brightenColor(color: string, amount: number) {
        const normalized = color.replace("#", "");
        const value = Number.parseInt(normalized, 16);
        const r = Math.min(255, Math.max(0, ((value >> 16) & 0xff) + amount));
        const g = Math.min(255, Math.max(0, ((value >> 8) & 0xff) + amount));
        const b = Math.min(255, Math.max(0, (value & 0xff) + amount));
        return `#${r.toString(16).padStart(2, "0")}${g
            .toString(16)
            .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    }
}
