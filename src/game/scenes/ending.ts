import { Scene } from "phaser";
import { playOneShot, SOUND_KEYS, stopSound } from "../audio";

interface EndingSceneData {
    title?: string;
    message?: string;
}

export class Ending extends Scene {
    private title = "";
    private message = "";

    constructor() {
        super("Ending");
    }

    init(data: EndingSceneData) {
        this.title = data.title ?? "";
        this.message = data.message ?? "";
    }

    create() {
        stopSound(this, SOUND_KEYS.fanAudio);

        this.cameras.main.setBackgroundColor(0x2f3f34);

        this.add.rectangle(512, 384, 1024, 768, 0x2f3f34, 1).setDepth(0);

        this.add
            .rectangle(512, 390, 860, 700, 0x1e2b22, 1)
            .setStrokeStyle(3, 0xb5a36a)
            .setDepth(1);

        this.add
            .rectangle(512, 50, 860, 80, 0x1a1814, 1)
            .setStrokeStyle(2, 0xb5a36a)
            .setDepth(2);

        this.add
            .text(512, 50, this.title, {
                fontFamily: "Pix32",
                fontSize: "36px",
                color: "#f4ecd8",
                fontStyle: "bold",
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(3);

        this.add
            .text(512, 115, this.message, {
                fontFamily: "Pix32",
                fontSize: "26px",
                color: "#d4c9a8",
                align: "center",
                lineSpacing: 12,
                wordWrap: { width: 780 },
            })

            .setOrigin(0.5, 0)
            .setDepth(3);

        this.createButton(512, 575, "Restart Game", "#44624c", () => {
            this.scene.start("Level1", { day: 1 });
        });

        this.createButton(512, 638, "Main Menu", "#5a4a32", () => {
            this.scene.start("MainMenu");
        });

        this.createButton(512, 701, "Select Level", "#5a4a32", () => {
            this.scene.start("LevelSelect");
        });
    }

    private createButton(
        x: number,
        y: number,
        label: string,
        backgroundColor: string,
        onClick: () => void,
    ) {
        const button = this.add
            .text(x, y, label, {
                fontFamily: "Pix32",
                fontSize: "26px",
                color: "#f8f0dc",
                stroke: "#211d17",
                strokeThickness: 1,
                backgroundColor,
                fixedWidth: 320,
                align: "center",
                padding: { left: 8, right: 8, top: 12, bottom: 12 },
            })
            .setOrigin(0.5)
            .setDepth(4)
            .setInteractive({ useHandCursor: true });

        const hoverBg = this.brightenColor(backgroundColor, 20);

        button.on("pointerdown", () => {
            playOneShot(this, SOUND_KEYS.mouseClick, { volume: 0.45 });
            onClick();
        });
        button.on("pointerover", () => {
            button.setStyle({ backgroundColor: hoverBg });
            button.setScale(1.02);
        });
        button.on("pointerout", () => {
            button.setStyle({ backgroundColor });
            button.setScale(1);
        });
    }

    private brightenColor(color: string, amount: number) {
        const normalized = color.replace("#", "");
        const value = Number.parseInt(normalized, 16);
        const r = Math.min(255, Math.max(0, ((value >> 16) & 0xff) + amount));
        const g = Math.min(255, Math.max(0, ((value >> 8) & 0xff) + amount));
        const b = Math.min(255, Math.max(0, (value & 0xff) + amount));
        return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    }
}
