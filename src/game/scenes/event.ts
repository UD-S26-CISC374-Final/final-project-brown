import { Scene } from "phaser";
import { playOneShot, SOUND_KEYS } from "../audio";

interface EventSceneData {
    day?: number;
    totalPoints?: number;
    money?: number;
    daysWithoutRent?: number;
    hintCount?: number;
    revealCount?: number;
    shieldActive?: boolean;
    shopOutcome?: "continue" | "dead" | "win";
    outcomeMessage?: string;
    plotEmailsAccepted?: number;
    plotEmailsRejected?: number;
    tutorialMode?: boolean;
    forcedEvent?: "lostWallet";
}

interface RandomEvent {
    message: string;
    apply: () => void;
}

export class EventScene extends Scene {
    private day = 1;
    private totalPoints = 0;
    private money = 0;
    private daysWithoutRent = 0;
    private hintCount = 0;
    private revealCount = 0;
    private shieldActive = false;
    private shopOutcome: EventSceneData["shopOutcome"] = "continue";
    private outcomeMessage = "";
    private plotEmailsAccepted = 0;
    private plotEmailsRejected = 0;
    private tutorialMode = false;
    private forcedEvent?: EventSceneData["forcedEvent"];
    private titleText!: Phaser.GameObjects.Text;
    private eventText!: Phaser.GameObjects.Text;
    private totalsText!: Phaser.GameObjects.Text;
    private continueButton!: Phaser.GameObjects.Text;

    constructor() {
        super("EventScene");
    }

    init(data: EventSceneData) {
        this.day = data.day ?? 1;
        this.totalPoints = data.totalPoints ?? 0;
        this.money = data.money ?? 0;
        this.daysWithoutRent = data.daysWithoutRent ?? 0;
        this.hintCount = data.hintCount ?? 0;
        this.revealCount = data.revealCount ?? 0;
        this.shieldActive = data.shieldActive ?? false;
        this.shopOutcome = data.shopOutcome ?? "continue";
        this.outcomeMessage = data.outcomeMessage ?? "";
        this.plotEmailsAccepted = data.plotEmailsAccepted ?? 0;
        this.plotEmailsRejected = data.plotEmailsRejected ?? 0;
        this.tutorialMode = data.tutorialMode ?? false;
        this.forcedEvent = data.forcedEvent;
    }

    create() {
        this.cameras.main.setBackgroundColor(0x090d09);
        this.cameras.main.fadeIn(250, 0, 0, 0);

        this.add.rectangle(512, 384, 1024, 768, 0x090d09, 1);
        this.add
            .rectangle(512, 384, 720, 430, 0xf0e4c4, 0.98)
            .setStrokeStyle(3, 0x7a6030);
        this.add
            .rectangle(512, 226, 720, 72, 0x1b3022, 1)
            .setStrokeStyle(2, 0xb5953a);
        this.add.rectangle(512, 264, 720, 3, 0xd4a830, 1);

        this.titleText = this.add
            .text(512, 226, "Between Shifts", {
                fontFamily: "Dotemp-8bit",
                fontSize: "40px",
                color: "#f4ecd8",
                fontStyle: "bold",
            })
            .setOrigin(0.5);

        const eventMessage = this.applyRandomEvent();

        this.eventText = this.add
            .text(512, 362, eventMessage, {
                fontFamily: "Dotemp-8bit",
                fontSize: "24px",
                color: "#2a251c",
                align: "center",
                lineSpacing: 8,
                wordWrap: { width: 620 },
            })
            .setOrigin(0.5);

        this.totalsText = this.add
            .text(
                512,
                482,
                `Money: $${this.money} | Hints: ${this.hintCount}`,
                {
                    fontFamily: "Dotemp-8bit",
                    fontSize: "22px",
                    color: "#2f4b36",
                    backgroundColor: "#ece1c4",
                    padding: { left: 10, right: 10, top: 8, bottom: 8 },
                },
            )
            .setOrigin(0.5);

        this.continueButton = this.createButton(
            512,
            568,
            this.tutorialMode ? "Continue" : `Start Day ${this.day}`,
            () => {
                if (this.tutorialMode) {
                    this.showTutorialCompleteMessage();
                    return;
                }

                this.startLevelAfterFade();
            },
        );
    }

    private applyRandomEvent() {
        if (this.forcedEvent === "lostWallet") {
            this.money += 10;
            return "You found a lost wallet on the street. You returned it, and the owner rewarded you. +$10.";
        }

        if (Math.random() < 0.001) {
            this.money += 50000;
            return "You found a winning lottery ticket on the ground! +$50000.";
        }

        const events: RandomEvent[] = [
            {
                message:
                    "You found a lost wallet on the street. You returned it, and the owner rewarded you. +$10.",
                apply: () => {
                    this.money += 10;
                },
            },
            {
                message:
                    "You helped someone cross the street. They thanked you with a useful tip. +1 hint.",
                apply: () => {
                    this.hintCount += 1;
                },
            },
            {
                message:
                    "You got mugged on your way home. Your wallet is lighter. -$10.",
                apply: () => {
                    this.money = Math.max(0, this.money - 10);
                },
            },
            {
                message:
                    "Someone tried to mug you, saw you were broke, and felt bad. +$5.",
                apply: () => {
                    this.money += 5;
                },
            },
        ];

        const affordableEvents =
            this.money > 0 ?
                events.slice(0, 3)
            :   [events[0], events[1], events[3]];
        const event =
            affordableEvents[
                Phaser.Math.Between(0, affordableEvents.length - 1)
            ];
        event.apply();
        return event.message;
    }

    private createButton(
        x: number,
        y: number,
        label: string,
        onClick: () => void,
    ) {
        const button = this.add
            .text(x, y, label, {
                fontFamily: "Dotemp-8bit",
                fontSize: "24px",
                color: "#f8f0dc",
                stroke: "#211d17",
                strokeThickness: 1,
                backgroundColor: "#4d5f55",
                fixedWidth: 250,
                align: "center",
                padding: { left: 8, right: 8, top: 12, bottom: 12 },
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        button.on("pointerdown", () => {
            playOneShot(this, SOUND_KEYS.mouseClick, { volume: 0.45 });
            onClick();
        });
        button.on("pointerover", () => {
            button.setStyle({ backgroundColor: "#5f7167" });
            button.setScale(1.02);
        });
        button.on("pointerout", () => {
            button.setStyle({ backgroundColor: "#4d5f55" });
            button.setScale(1);
        });

        return button;
    }

    private showTutorialCompleteMessage() {
        this.titleText.setText("Example Round Complete");
        this.eventText.setText(
            "The example round is over.\n\nYou are about to begin the actual game.",
        );
        this.totalsText.setVisible(false);
        this.continueButton.setText("Begin Actual Game");
        this.continueButton.removeAllListeners("pointerdown");
        this.continueButton.on("pointerdown", () => {
            playOneShot(this, SOUND_KEYS.mouseClick, { volume: 0.45 });
            this.startLevelAfterFade({
                day: 1,
                totalPoints: 0,
                money: 0,
                daysWithoutRent: 0,
                hintCount: 0,
                revealCount: 0,
                shieldActive: false,
                shopOutcome: "continue",
                outcomeMessage: "",
                plotEmailsAccepted: 0,
                plotEmailsRejected: 0,
            });
        });
    }

    private startLevelAfterFade(data = this.getLevelStartData()) {
        this.cameras.main.fadeOut(250, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
            this.scene.start("Level1", data);
        });
    }

    private getLevelStartData() {
        return {
            day: this.day,
            totalPoints: this.totalPoints,
            money: this.money,
            daysWithoutRent: this.daysWithoutRent,
            hintCount: this.hintCount,
            revealCount: this.revealCount,
            shieldActive: this.shieldActive,
            shopOutcome: this.shopOutcome,
            outcomeMessage: this.outcomeMessage,
            plotEmailsAccepted: this.plotEmailsAccepted,
            plotEmailsRejected: this.plotEmailsRejected,
        };
    }
}
