import { Scene } from "phaser";

type ShopItem = "food" | "utilities" | "rent";

interface ShopSceneData {
    day?: number;
    totalPoints?: number;
    money?: number;
    daysWithoutRent?: number;
}

export class Shop extends Scene {
    private day = 1;
    private totalPoints = 0;
    private money = 0;
    private daysWithoutRent = 0;

    private foodPaid = false;
    private utilitiesPaid = false;
    private rentPaid = false;

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
    }

    create() {
        this.cameras.main.setBackgroundColor(0x3a352b);

        this.add.rectangle(512, 384, 1024, 768, 0x2b2821, 0.25);
        this.add
            .rectangle(512, 392, 860, 620, 0xe9e1d2, 0.84)
            .setStrokeStyle(2, 0x80745e);

        this.add
            .text(512, 120, `Shop - End of Day ${this.day}`, {
                fontFamily: "Pix32",
                fontSize: "44px",
                color: "#2a261f",
                fontStyle: "bold",
            })
            .setOrigin(0.5);

        this.moneyText = this.add
            .text(
                512,
                190,
                `Money: $${this.money} | Points: ${this.totalPoints}`,
                {
                    fontFamily: "Pix32",
                    fontSize: "26px",
                    color: "#2f6434",
                },
            )
            .setOrigin(0.5);

        this.add
            .text(
                512,
                260,
                "Food and utilities are required every day.\nPay rent at least once every other day.\nEach item costs $3.",
                {
                    fontFamily: "Pix32",
                    fontSize: "24px",
                    color: "#433b2f",
                    align: "center",
                    lineSpacing: 8,
                },
            )
            .setOrigin(0.5);

        this.createButton(300, 380, "Buy Food ($3)", "#4c6f52", () => {
            this.buyItem("food");
        });

        this.createButton(512, 380, "Pay Utilities ($3)", "#4c6f52", () => {
            this.buyItem("utilities");
        });

        this.createButton(724, 380, "Pay Rent ($3)", "#4c6f52", () => {
            this.buyItem("rent");
        });

        this.createButton(512, 470, "Continue", "#4f667f", () => {
            this.leaveShop();
        });

        this.statusText = this.add
            .text(512, 620, "", {
                fontFamily: "Pix32",
                fontSize: "22px",
                color: "#9effa0",
                align: "center",
                lineSpacing: 6,
            })
            .setOrigin(0.5);

        this.updateStatus("Make your purchases.", "#9effa0");
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
                color: "#ffffff",
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
        if (this.money < 3) {
            this.updateStatus("Not enough money for that purchase.", "#ff9f9f");
            return;
        }

        if (item === "food" && this.foodPaid) {
            this.updateStatus("Food already purchased.", "#ffd27f");
            return;
        }

        if (item === "utilities" && this.utilitiesPaid) {
            this.updateStatus("Utilities already paid.", "#ffd27f");
            return;
        }

        if (item === "rent" && this.rentPaid) {
            this.updateStatus("Rent already paid today.", "#ffd27f");
            return;
        }

        this.money -= 3;

        if (item === "food") {
            this.foodPaid = true;
        } else if (item === "utilities") {
            this.utilitiesPaid = true;
        } else {
            this.rentPaid = true;
        }

        this.moneyText.setText(
            `Money: $${this.money} | Points: ${this.totalPoints}`,
        );
        this.updateStatus(`Purchased: ${item}.`, "#9effa0");
    }

    private leaveShop() {
        if (!this.foodPaid || !this.utilitiesPaid) {
            this.scene.start("Level1", {
                day: this.day,
                totalPoints: this.totalPoints,
                money: this.money,
                daysWithoutRent: this.daysWithoutRent,
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
                shopOutcome: "dead",
                outcomeMessage:
                    "Rent went unpaid too long. You must pay rent at least once every other day.",
            });
            return;
        }

        if (this.day >= 3) {
            this.scene.start("Level1", {
                day: this.day,
                totalPoints: this.totalPoints,
                money: this.money,
                daysWithoutRent: updatedDaysWithoutRent,
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
                    `Days since last rent payment: ${this.daysWithoutRent}`,
            );
    }
}
