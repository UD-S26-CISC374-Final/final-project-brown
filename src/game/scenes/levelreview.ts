import { GameObjects, Scene } from "phaser";

import { playOneShot, SOUND_KEYS } from "../audio";

interface LevelReviewSceneData {
    day?: number;
    totalPoints?: number;
    money?: number;
    daysWithoutRent?: number;
    hintCount?: number;
    revealCount?: number;
}

export class LevelReviewScene extends Scene {
    private levelText!: GameObjects.Text;
    private continueText!: GameObjects.Text;
    private day: number = 1;
    private totalPoints: number = 0;
    private money: number = 0;
    private daysWithoutRent: number = 0;
    private hintCount: number = 0;
    private revealCount: number = 0;
    private emailText!: GameObjects.Text;

    constructor() {
        super("LevelReviewScene");
    }

    init(data: LevelReviewSceneData) {
        this.day = data.day ?? 1;
        this.totalPoints = data.totalPoints ?? 0;
        this.money = data.money ?? 0;
        this.daysWithoutRent = data.daysWithoutRent ?? 0;
        this.hintCount = data.hintCount ?? 0;
        this.revealCount = data.revealCount ?? 0;
    }

    create() {
        this.cameras.main.setBackgroundColor("0x74736d");

        this.levelText = this.add
            .text(
                this.cameras.main.centerX,
                this.cameras.main.centerY - 50,
                "Level Complete!",
                {
                    fontSize: "32px",
                    color: "#ffffff",
                },
            )
            .setOrigin(0.5);
        this.continueText = this.add
            .text(
                this.cameras.main.centerX,
                this.cameras.main.centerY + 50,
                "Click to continue",
                {
                    fontSize: "24px",
                    color: "#ffffff",
                },
            )
            .setOrigin(0.5);
        this.input.once("pointerdown", () => {
            playOneShot(this, SOUND_KEYS.mouseClick, { volume: 0.45 });
            this.scene.start("Shop", {
                day: this.day,
                money: this.money,
                totalPoints: this.totalPoints,
                daysWithoutRent: this.daysWithoutRent,
                hintCount: this.hintCount,
                revealCount: this.revealCount,
            });
        });
    }
}
