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
        this.cameras.main.setBackgroundColor(0x182217);

        this.add
            .text(512, 120, `Shop - End of Day ${this.day}`, {
                fontSize: "44px",
                color: "#ffffff",
                fontStyle: "bold",
            })
            .setOrigin(0.5);

        this.moneyText = this.add
            .text(
                512,
                190,
                `Money: $${this.money} | Points: ${this.totalPoints}`,
                {
                    fontSize: "26px",
                    color: "#a9f2b1",
                },
            )
            .setOrigin(0.5);

        this.add
            .text(
                512,
                260,
                "Food and utilities are required every day.\nPay rent at least once every other day.\nEach item costs $3.",
                {
                    fontSize: "24px",
                    color: "#ffffff",
                    align: "center",
                    lineSpacing: 8,
                },
            )
            .setOrigin(0.5);

        this.createButton(300, 380, "Buy Food ($3)", "#245e2b", () => {
            this.buyItem("food");
        });

        this.createButton(512, 380, "Pay Utilities ($3)", "#245e2b", () => {
            this.buyItem("utilities");
        });

        this.createButton(724, 380, "Pay Rent ($3)", "#245e2b", () => {
            this.buyItem("rent");
        });

        this.createButton(512, 520, "Continue", "#2c4a77", () => {
            this.leaveShop();
        });

        this.statusText = this.add
            .text(512, 620, "", {
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
                fontSize: "22px",
                color: "#ffffff",
                backgroundColor,
                fixedWidth: 190,
                align: "center",
                padding: { left: 8, right: 8, top: 10, bottom: 10 },
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        button.on("pointerdown", onClick);
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
