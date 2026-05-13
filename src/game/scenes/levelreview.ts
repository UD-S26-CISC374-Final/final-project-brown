import { Scene } from "phaser";

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
    private day = 1;
    private totalPoints = 0;
    private money = 0;
    private daysWithoutRent = 0;
    private hintCount = 0;
    private revealCount = 0;
    private plotEmailsAccepted = 0;
    private plotEmailsRejected = 0;
    /*private nextEmailButton!: GameObjects.Text;
    private previousEmailButton!: GameObjects.Text;
    private missedEmailsText!: Set<string>;
    private missedEmailsFeedback!: Set<string>;*/

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
        this.cameras.main.setBackgroundColor(0x74736d);

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

        const continueToShopButton = this.add
            .text(512, 448, "Continue to Shop", {
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
                continueToShopButton.setStyle({ backgroundColor: "#53755b" });
                continueToShopButton.setScale(1.03);
            })
            .on("pointerout", () => {
                continueToShopButton.setStyle({ backgroundColor: "#44624c" });
                continueToShopButton.setScale(1);
            })
            .on("pointerdown", () => {
                playOneShot(this, SOUND_KEYS.mouseClick, { volume: 0.45 });
                this.scene.start("Shop", {
                    day: this.day,
                    totalPoints: this.totalPoints,
                    money: this.money,
                    daysWithoutRent: this.daysWithoutRent,
                    hintCount: this.hintCount,
                    revealCount: this.revealCount,
                    plotEmailsAccepted: this.plotEmailsAccepted,
                    plotEmailsRejected: this.plotEmailsRejected,
                });
            });
    }
}
