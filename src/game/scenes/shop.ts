import { Scene } from "phaser";
import { playOneShot, SOUND_KEYS } from "../audio";
import { MAX_DAYS } from "../email-content";

type ShopItem = "food" | "utilities" | "rent" | "hint" | "shield" | "reveal";

interface ShopSceneData {
    day?: number;
    totalPoints?: number;
    money?: number;
    daysWithoutRent?: number;
    hintCount?: number;
    revealCount?: number;
    plotEmailsAccepted?: number;
    plotEmailsRejected?: number;
    tutorialMode?: boolean;
}

interface LevelStartData extends ShopSceneData {
    shieldActive?: boolean;
    shopOutcome?: "continue" | "dead" | "win";
    outcomeMessage?: string;
    forcedEvent?: "lostWallet";
}

export class Shop extends Scene {
    private day = 1;
    private totalPoints = 0;
    private money = 0;
    private daysWithoutRent = 0;
    private hintCount = 0;
    private revealCount = 0;
    private plotEmailsAccepted = 0;
    private plotEmailsRejected = 0;

    private foodPaid = false;
    private utilitiesPaid = false;
    private rentPaid = false;
    private shieldPurchased = false;
    private tutorialMode = false;

    private moneyText!: Phaser.GameObjects.Text;
    private statusText!: Phaser.GameObjects.Text;

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

    constructor() {
        super("Shop");
    }

    init(data: ShopSceneData) {
        this.day = data.day ?? 1;
        this.totalPoints = data.totalPoints ?? 0;
        this.money = data.money ?? 0;
        this.daysWithoutRent = data.daysWithoutRent ?? 0;
        this.hintCount = data.hintCount ?? 0;
        this.revealCount = data.revealCount ?? 0;
        this.plotEmailsAccepted = data.plotEmailsAccepted ?? 0;
        this.plotEmailsRejected = data.plotEmailsRejected ?? 0;
        this.tutorialMode = data.tutorialMode ?? false;
        this.foodPaid = this.day === 1 || this.tutorialMode;
        this.utilitiesPaid = this.day === 1 || this.tutorialMode;
        this.rentPaid = this.day === 1 || this.tutorialMode;
        this.shieldPurchased = false;
    }

    create() {
        this.cameras.main.setBackgroundColor(0x1a2018);
        this.cameras.main.fadeIn(250, 0, 0, 0);

        this.add.rectangle(512, 384, 1024, 768, 0x090d09, 0.72);
        this.add
            .rectangle(512, 392, 700, 590, 0xf0e4c4, 0.97)
            .setStrokeStyle(3, 0x7a6030);
        this.add
            .rectangle(512, 148, 700, 74, 0x1b3022, 1)
            .setStrokeStyle(2, 0xb5953a);
        this.add.rectangle(512, 186, 700, 3, 0xd4a830, 1);

        this.add
            .text(
                512,
                148,
                this.tutorialMode ?
                    "Shop Walkthrough"
                :   `Supply Window - Day ${this.day}`,
                {
                    fontFamily: "Dotemp-8bit",
                    fontSize: "40px",
                    color: "#f4ecd8",
                    fontStyle: "bold",
                },
            )
            .setOrigin(0.5);

        this.moneyText = this.add
            .text(
                512,
                214,
                `Money: $${this.money} | Points: ${this.totalPoints}`,
                {
                    fontFamily: "Dotemp-8bit",
                    fontSize: "26px",
                    color: "#2f4b36",
                    backgroundColor: "#ece1c4",
                },
            )
            .setOrigin(0.5);

        this.add
            .text(
                512,
                286,
                "Buy food and utilities every day.\nPay rent at least once every other day.\nDay 1 essentials are already covered.\nEssentials cost $3 each.",
                {
                    fontFamily: "Dotemp-8bit",
                    fontSize: "19px",
                    color: "#433927",
                    align: "center",
                    lineSpacing: 6,
                    wordWrap: { width: 640 },
                },
            )
            .setOrigin(0.5);

        this.add
            .text(
                512,
                356,
                "Powerups: hint $5, shield $10, eliminate $15. Shield expires after one shift.",
                {
                    fontFamily: "Dotemp-8bit",
                    fontSize: "14px",
                    color: "#5a4a32",
                    align: "center",
                    wordWrap: { width: 640 },
                },
            )
            .setOrigin(0.5);

        this.createButton(300, 424, "Buy Food ($3)", "#44624c", () => {
            this.buyItem("food");
        });

        this.createButton(512, 424, "Pay Utilities ($3)", "#44624c", () => {
            this.buyItem("utilities");
        });

        this.createButton(724, 424, "Pay Rent ($3)", "#44624c", () => {
            this.buyItem("rent");
        });

        this.createButton(
            300,
            502,
            "Hint ($5)",
            "#66563b",
            () => {
                this.buyItem("hint");
            },
            "Hint reveals a clue about the selected email.",
        );

        this.createButton(
            512,
            502,
            "Shield ($10)",
            "#66563b",
            () => {
                this.buyItem("shield");
            },
            "Shield blocks one mistake during the next shift.",
        );

        this.createButton(
            724,
            502,
            "Eliminate ($15)",
            "#66563b",
            () => {
                this.buyItem("reveal");
            },
            "Eliminate removes one wrong answer for the selected email.",
        );

        this.createButton(
            512,
            574,
            this.tutorialMode ? "Start Day 1" : "Continue",
            "#4d5f55",
            () => {
                this.leaveShop();
            },
            undefined,
            260,
        );

        this.add
            .rectangle(512, 690, 650, 132, 0xe8d9a8, 0.97)
            .setStrokeStyle(2, 0xb5953a);

        this.statusText = this.add
            .text(512, 690, "", {
                fontFamily: "Dotemp-8bit",
                fontSize: "15px",
                color: "#2f4b36",
                align: "center",
                lineSpacing: 3,
                wordWrap: { width: 610 },
            })
            .setOrigin(0.5);

        const introMessage =
            this.tutorialMode ?
                "Hover any button to see what it does. Click Start Day 1 when you're ready."
            : this.day === 1 ?
                "Day 1 essentials are already paid. Buy powerups or continue."
            :   "Make your purchases.";
        this.updateStatus(introMessage, "#2f4b36");

        if (this.tutorialMode) {
            this.showWalkthroughPopup();
        }
    }

    private showWalkthroughPopup() {
        const bg = this.add
            .rectangle(512, 384, 1024, 768, 0x000000, 0.7)
            .setDepth(50)
            .setInteractive();

        const panel = this.add
            .rectangle(512, 384, 720, 460, 0xf0e4c4, 1)
            .setStrokeStyle(3, 0x7a6030)
            .setDepth(51);

        const titleBar = this.add
            .rectangle(512, 200, 720, 60, 0x1b3022, 1)
            .setStrokeStyle(2, 0xb5953a)
            .setDepth(51);

        const title = this.add
            .text(512, 200, "Shop Walkthrough", {
                fontFamily: "Dotemp-8bit",
                fontSize: "30px",
                color: "#f4ecd8",
                fontStyle: "bold",
            })
            .setOrigin(0.5)
            .setDepth(52);

        const body = this.add
            .text(
                512,
                370,
                "This is the supply window. After every shift, you stop here before the next day.\n\n" +
                    "Food and utilities ($3 each) must be paid every day. Rent ($3) must be paid at least once every other day. Day 1 essentials are covered for free.\n\n" +
                    "Powerups: Hint ($5) gives a clue on the selected email. Shield ($10) blocks one mistake next shift. Eliminate ($15) removes one wrong answer.\n\n" +
                    "Walkthrough only — no real purchases are needed. Your tutorial money and points will reset before Day 1 begins.",
                {
                    fontFamily: "Dotemp-8bit",
                    fontSize: "16px",
                    color: "#2a251c",
                    align: "center",
                    lineSpacing: 4,
                    wordWrap: { width: 660 },
                },
            )
            .setOrigin(0.5)
            .setDepth(52);

        const okButton = this.add
            .text(512, 562, "OK", {
                fontFamily: "Dotemp-8bit",
                fontSize: "22px",
                color: "#f8f0dc",
                stroke: "#211d17",
                strokeThickness: 1,
                backgroundColor: "#4d5f55",
                fixedWidth: 160,
                align: "center",
                padding: { left: 8, right: 8, top: 12, bottom: 12 },
            })
            .setOrigin(0.5)
            .setDepth(52)
            .setInteractive({ useHandCursor: true });

        const hoverColor = this.brightenColor("#4d5f55", 18);
        okButton.on("pointerover", () => {
            okButton.setStyle({ backgroundColor: hoverColor });
            okButton.setScale(1.02);
        });
        okButton.on("pointerout", () => {
            okButton.setStyle({ backgroundColor: "#4d5f55" });
            okButton.setScale(1);
        });
        okButton.on("pointerdown", () => {
            playOneShot(this, SOUND_KEYS.mouseClick, { volume: 0.45 });
            bg.destroy();
            panel.destroy();
            titleBar.destroy();
            title.destroy();
            body.destroy();
            okButton.destroy();
        });
    }

    private createButton(
        x: number,
        y: number,
        label: string,
        backgroundColor: string,
        onClick: () => void,
        hoverMessage?: string,
        fixedWidth = 220,
    ) {
        const button = this.add
            .text(x, y, label, {
                fontFamily: "Dotemp-8bit",
                fontSize: "22px",
                color: "#f8f0dc",
                stroke: "#211d17",
                strokeThickness: 1,
                backgroundColor,
                fixedWidth,
                align: "center",
                padding: { left: 8, right: 8, top: 14, bottom: 16 },
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        const hoverColor = this.brightenColor(backgroundColor, 18);

        button.on("pointerdown", () => {
            playOneShot(this, SOUND_KEYS.mouseClick, { volume: 0.45 });
            onClick();
        });
        button.on("pointerover", () => {
            button.setStyle({ backgroundColor: hoverColor });
            button.setScale(1.02);
            if (hoverMessage) {
                this.updateStatus(hoverMessage, "#2f4b36");
            }
        });
        button.on("pointerout", () => {
            button.setStyle({ backgroundColor });
            button.setScale(1);
        });
    }

    private buyItem(item: ShopItem) {
        const costs: Record<ShopItem, number> = {
            food: 3,
            utilities: 3,
            rent: 3,
            hint: 5,
            shield: 10,
            reveal: 15,
        };
        const cost = costs[item];

        if (this.money < cost) {
            this.updateStatus("Not enough money for that purchase.", "#7a2d25");
            return;
        }

        if (item === "food" && this.foodPaid) {
            this.updateStatus("Food already purchased.", "#7b641f");
            return;
        }

        if (item === "utilities" && this.utilitiesPaid) {
            this.updateStatus("Utilities already paid.", "#7b641f");
            return;
        }

        if (item === "rent" && this.rentPaid) {
            this.updateStatus("Rent already paid today.", "#7b641f");
            return;
        }

        if (item === "shield" && this.shieldPurchased) {
            this.updateStatus(
                "Shield already armed for next shift.",
                "#7b641f",
            );
            return;
        }

        this.money -= cost;

        if (item === "food") {
            this.foodPaid = true;
        } else if (item === "utilities") {
            this.utilitiesPaid = true;
        } else if (item === "rent") {
            this.rentPaid = true;
        } else if (item === "hint") {
            this.hintCount += 1;
        } else if (item === "shield") {
            this.shieldPurchased = true;
        } else {
            this.revealCount += 1;
        }

        this.moneyText.setText(
            `Money: $${this.money} | Points: ${this.totalPoints}`,
        );
        this.updateStatus(`Purchased: ${item}.`, "#2f4b36");
    }

    private leaveShop() {
        if (this.tutorialMode) {
            localStorage.setItem("tutorialCompleted", "true");
            this.startSceneAfterFade("EventScene", {
                day: 1,
                totalPoints: 0,
                money: 0,
                daysWithoutRent: 0,
                hintCount: 0,
                revealCount: 0,
                plotEmailsAccepted: 0,
                plotEmailsRejected: 0,
                shieldActive: false,
                shopOutcome: "continue",
                tutorialMode: true,
                forcedEvent: "lostWallet",
            });
            return;
        }

        if (!this.foodPaid || !this.utilitiesPaid) {
            this.startSceneAfterFade("Level1", {
                day: this.day,
                totalPoints: this.totalPoints,
                money: this.money,
                daysWithoutRent: this.daysWithoutRent,
                hintCount: this.hintCount,
                revealCount: this.revealCount,
                plotEmailsAccepted: this.plotEmailsAccepted,
                plotEmailsRejected: this.plotEmailsRejected,
                shopOutcome: "dead",
                outcomeMessage:
                    "Your family was not fed or utilities were shut off.",
            });
            return;
        }

        const updatedDaysWithoutRent =
            this.rentPaid ? 0 : this.daysWithoutRent + 1;

        if (updatedDaysWithoutRent > 1) {
            this.startSceneAfterFade("Level1", {
                day: this.day,
                totalPoints: this.totalPoints,
                money: this.money,
                daysWithoutRent: updatedDaysWithoutRent,
                hintCount: this.hintCount,
                revealCount: this.revealCount,
                plotEmailsAccepted: this.plotEmailsAccepted,
                plotEmailsRejected: this.plotEmailsRejected,
                shopOutcome: "dead",
                outcomeMessage:
                    "Rent went unpaid too long. You must pay rent at least once every other day.",
            });
            return;
        }

        if (this.day >= MAX_DAYS) {
            this.startSceneAfterFade("Level1", {
                day: this.day,
                totalPoints: this.totalPoints,
                money: this.money,
                daysWithoutRent: updatedDaysWithoutRent,
                hintCount: this.hintCount,
                revealCount: this.revealCount,
                plotEmailsAccepted: this.plotEmailsAccepted,
                plotEmailsRejected: this.plotEmailsRejected,
                shopOutcome: "win",
                outcomeMessage: `Final points: ${this.totalPoints}\nFinal money: $${this.money}`,
            });
            return;
        }

        this.startSceneAfterFade("EventScene", {
            day: this.day + 1,
            totalPoints: this.totalPoints,
            money: this.money,
            daysWithoutRent: updatedDaysWithoutRent,
            hintCount: this.hintCount,
            revealCount: this.revealCount,
            plotEmailsAccepted: this.plotEmailsAccepted,
            plotEmailsRejected: this.plotEmailsRejected,
            shieldActive: this.shieldPurchased,
            shopOutcome: "continue",
        });
    }

    private startSceneAfterFade(sceneKey: string, data: LevelStartData) {
        this.cameras.main.fadeOut(250, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
            this.scene.start(sceneKey, data);
        });
    }

    private updateStatus(message: string, color: string) {
        this.statusText
            .setColor(color)
            .setText(
                `${message}\n\n` +
                    `Food: ${this.foodPaid ? "PAID" : "NOT PAID"}\n` +
                    `Utilities: ${this.utilitiesPaid ? "PAID" : "NOT PAID"}\n` +
                    `Rent: ${this.rentPaid ? "PAID" : "NOT PAID"}\n` +
                    `Hint ${this.hintCount}  |  Eliminate ${this.revealCount}  |  Shield ${
                        this.shieldPurchased ? "ARMED" : "NONE"
                    }`,
            );
    }
}
