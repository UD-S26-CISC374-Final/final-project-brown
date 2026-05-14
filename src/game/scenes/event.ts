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
    private messageBox!: Phaser.GameObjects.Rectangle;
    private eventText!: Phaser.GameObjects.Text;
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

        const eventMessage = this.applyRandomEvent();

        this.messageBox = this.add
            .rectangle(512, 392, 800, 120, 0xc8c0aa, 1)
            .setStrokeStyle(1, 0x8f8876);

        this.eventText = this.add
            .text(512, 392, eventMessage, {
                fontFamily: "Dotemp-8bit",
                fontSize: "25px",
                color: "#38352f",
                align: "left",
                lineSpacing: 6,
                wordWrap: { width: 740 },
            })
            .setOrigin(0.5);

        this.continueButton = this.createButton(
            512,
            520,
            "Continue",
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
                fontSize: "25px",
                color: "#38352f",
                backgroundColor: "#c8c0aa",
                fixedWidth: 170,
                align: "center",
                padding: { left: 10, right: 10, top: 10, bottom: 10 },
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        button.on("pointerdown", () => {
            playOneShot(this, SOUND_KEYS.mouseClick, { volume: 0.45 });
            onClick();
        });
        button.on("pointerover", () => {
            button.setStyle({ backgroundColor: "#ded7c5" });
            button.setScale(1.02);
        });
        button.on("pointerout", () => {
            button.setStyle({ backgroundColor: "#c8c0aa" });
            button.setScale(1);
        });

        return button;
    }

    private showTutorialCompleteMessage() {
        this.messageBox.setDisplaySize(800, 150);
        this.eventText.setText(
            "The example round is over.\n\nYou are about to begin the actual game.",
        );
        this.continueButton.setText("Begin Actual Game");
        this.continueButton.setFixedSize(280, 0);
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
