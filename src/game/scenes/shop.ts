import { Scene } from "phaser";
import { MAX_DAYS } from "../email-content";

type ShopItem = "food" | "utilities" | "rent" | "hint" | "shield" | "reveal";

interface ShopSceneData {
    day?: number;
    totalPoints?: number;
    money?: number;
    daysWithoutRent?: number;
    hintCount?: number;
    revealCount?: number;
}

export class Shop extends Scene {
    private day = 1;
    private totalPoints = 0;
    private money = 0;
    private daysWithoutRent = 0;
    private hintCount = 0;
    private revealCount = 0;

    private foodPaid = false;
    private utilitiesPaid = false;
    private rentPaid = false;
    private shieldPurchased = false;

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
        this.rentPaid = false;
        this.foodPaid = false;
        this.utilitiesPaid = false;
    }

    create() {
        this.cameras.main.setBackgroundColor(0x74736d);

        this.add.rectangle(512, 384, 1024, 768, 0x74736d, 1);
        this.add
            .rectangle(512, 392, 700, 590, 0xefe4c7, 0.97)
            .setStrokeStyle(4, 0x5d5747);
        this.add
            .rectangle(512, 148, 700, 74, 0x2f3f34, 1)
            .setStrokeStyle(2, 0xb5a36a);

        this.add
            .text(512, 148, `Supply Window - Day ${this.day}`, {
                fontFamily: "Pix32",
                fontSize: "40px",
                color: "#f4ecd8",
                fontStyle: "bold",
            })
            .setOrigin(0.5);

        this.moneyText = this.add
            .text(
                512,
                224,
                `Money: $${this.money} | Points: ${this.totalPoints}`,
                {
                    fontFamily: "Pix32",
                    fontSize: "26px",
                    color: "#2f4b36",
                    backgroundColor: "#ece1c4",
                },
            )
            .setOrigin(0.5);

        this.add
            .text(
                512,
                296,
                "Food and utilities are required every day.\nPay rent at least once every other day.\nEssentials cost $3.",
                {
                    fontFamily: "Pix32",
                    fontSize: "22px",
                    color: "#433927",
                    align: "center",
                    lineSpacing: 8,
                },
            )
            .setOrigin(0.5);

        this.add
            .text(
                512,
                352,
                "Powerups: hint $5, shield $10, eliminate $15. Shield expires after one shift.",
                {
                    fontFamily: "Pix32",
                    fontSize: "16px",
                    color: "#5a4a32",
                    align: "center",
                },
            )
            .setOrigin(0.5);

        this.createButton(300, 410, "Buy Food ($3)", "#44624c", () => {
            this.buyItem("food");
        });

        this.createButton(512, 410, "Pay Utilities ($3)", "#44624c", () => {
            this.buyItem("utilities");
        });

        this.createButton(724, 410, "Pay Rent ($3)", "#44624c", () => {
            this.buyItem("rent");
        });

        this.createButton(300, 490, "Hint ($5)", "#66563b", () => {
            this.buyItem("hint");
        });

        this.createButton(512, 490, "Shield ($10)", "#66563b", () => {
            this.buyItem("shield");
        });

        this.createButton(724, 490, "Eliminate ($15)", "#66563b", () => {
            this.buyItem("reveal");
        });

        this.createButton(512, 560, "Continue", "#4d5f55", () => {
            this.leaveShop();
        });

        this.add
            .rectangle(512, 666, 650, 160, 0xf5edd7, 0.97)
            .setStrokeStyle(2, 0x8a784d);

        this.statusText = this.add
            .text(512, 666, "", {
                fontFamily: "Pix32",
                fontSize: "16px",
                color: "#2f4b36",
                align: "center",
                lineSpacing: 4,
                wordWrap: { width: 610 },
            })
            .setOrigin(0.5);

        this.updateStatus("Make your purchases.", "#2f4b36");
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
                fontSize: "22px",
                color: "#f8f0dc",
                stroke: "#211d17",
                strokeThickness: 1,
                backgroundColor,
                fixedWidth: 220,
                align: "center",
                padding: { left: 8, right: 8, top: 12, bottom: 12 },
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .setShadow(0, 2, "#000000", 6, true, true);

        const hoverColor = this.brightenColor(backgroundColor, 18);

        button.on("pointerdown", onClick);
        button.on("pointerover", () => {
            button.setStyle({ backgroundColor: hoverColor });
            button.setScale(1.02);
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
        if (!this.foodPaid || !this.utilitiesPaid) {
            this.scene.start("Level1", {
                day: this.day,
                totalPoints: this.totalPoints,
                money: this.money,
                daysWithoutRent: this.daysWithoutRent,
                hintCount: this.hintCount,
                revealCount: this.revealCount,
                shopOutcome: "dead",
                outcomeMessage:
                    "Your family was not fed or utilities were shut off.",
            });
            return;
        }

        const updatedDaysWithoutRent =
            this.rentPaid ? 0 : this.daysWithoutRent + 1;

        if (updatedDaysWithoutRent > 1) {
            this.scene.start("Level1", {
                day: this.day,
                totalPoints: this.totalPoints,
                money: this.money,
                daysWithoutRent: updatedDaysWithoutRent,
                hintCount: this.hintCount,
                revealCount: this.revealCount,
                shopOutcome: "dead",
                outcomeMessage:
                    "Rent went unpaid too long. You must pay rent at least once every other day.",
            });
            return;
        }

        if (this.day >= MAX_DAYS) {
            this.scene.start("Level1", {
                day: this.day,
                totalPoints: this.totalPoints,
                money: this.money,
                daysWithoutRent: updatedDaysWithoutRent,
                hintCount: this.hintCount,
                revealCount: this.revealCount,
                shopOutcome: "win",
                outcomeMessage: `Final points: ${this.totalPoints}\nFinal money: $${this.money}`,
            });
            return;
        }

        this.scene.start("Level1", {
            day: this.day + 1,
            totalPoints: this.totalPoints,
            money: this.money,
            daysWithoutRent: updatedDaysWithoutRent,
            hintCount: this.hintCount,
            revealCount: this.revealCount,
            shieldActive: this.shieldPurchased,
            shopOutcome: "continue",
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
