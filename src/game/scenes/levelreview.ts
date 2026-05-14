import { Scene } from "phaser";
import { playOneShot, SOUND_KEYS } from "../audio";
import { type EmailCase } from "../email-content";

interface LevelReviewSceneData {
    day?: number;
    totalPoints?: number;
    money?: number;
    daysWithoutRent?: number;
    hintCount?: number;
    revealCount?: number;
    plotEmailsAccepted?: number;
    plotEmailsRejected?: number;
    missedEmailsText?: EmailCase[];
    missedEmailsFeedback?: string[];
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
    private missedEmailsArray: EmailCase[] = [];
    private missedEmailsFeedback: string[] = [];
    private selectedEmailIndex = 0;

    // Panel UI elements
    private computerPanelBg!: Phaser.GameObjects.Rectangle;
    private emailPanelTitle!: Phaser.GameObjects.Text;
    private fromText!: Phaser.GameObjects.Text;
    private subjectText!: Phaser.GameObjects.Text;
    private domainText!: Phaser.GameObjects.Text;
    private contentLabelText!: Phaser.GameObjects.Text;
    private contentText!: Phaser.GameObjects.Text;
    private attachmentText!: Phaser.GameObjects.Text;
    private feedbackReasonText!: Phaser.GameObjects.Text;
    private emailSwitchText!: Phaser.GameObjects.Text;
    private previousEmailButton!: Phaser.GameObjects.Text;
    private nextEmailButton!: Phaser.GameObjects.Text;

    constructor() {
        super("LevelReview");
    }

    init(data: LevelReviewSceneData) {
        this.day = data.day ?? 1;
        this.totalPoints = data.totalPoints ?? 0;
        this.money = data.money ?? 0;
        this.daysWithoutRent = data.daysWithoutRent ?? 0;
        this.hintCount = data.hintCount ?? 0;
        this.revealCount = data.revealCount ?? 0;
        this.plotEmailsAccepted = data.plotEmailsAccepted ?? 0;
        this.plotEmailsRejected = data.plotEmailsRejected ?? 0;
        this.missedEmailsArray = data.missedEmailsText ?? [];
        this.missedEmailsFeedback = data.missedEmailsFeedback ?? [];
    }

    create() {
        const W = 1024;
        const H = 768;
        const hasMissed = this.missedEmailsArray.length > 0;

        // Background
        this.cameras.main.setBackgroundColor(0x1a2018);
        this.add.rectangle(W / 2, H / 2, W, H, 0x090d09, 0.72).setDepth(1);

        // Header bar
        this.add
            .rectangle(W / 2, 40, W, 80, 0x1b3022, 0.97)
            .setStrokeStyle(2, 0xb5953a)
            .setDepth(10);
        this.add.rectangle(W / 2, 82, W, 4, 0xb5a36a, 0.9).setDepth(10);
        this.add
            .text(W / 2, 40, `Day ${this.day} Review`, {
                fontFamily: "Pix32",
                fontSize: "28px",
                color: "#f4ecd8",
                fontStyle: "bold",
            })
            .setOrigin(0.5)
            .setDepth(11);

        // Nav buttons (top bar)
        this.createButton(100, 40, "Main Menu", "#66563b", () => {
            this.scene.start("MainMenu", {
                day: this.day,
                totalPoints: this.totalPoints,
                money: this.money,
                daysWithoutRent: this.daysWithoutRent,
                hintCount: this.hintCount,
                revealCount: this.revealCount,
                plotEmailsAccepted: this.plotEmailsAccepted,
                plotEmailsRejected: this.plotEmailsRejected,
            });
        }, 130).setDepth(12);

        this.createButton(920, 40, "Enter Shop", "#44624c", () => {
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
        }, 130).setDepth(12);

        if (!hasMissed) {
            // No missed emails — show a congratulatory card
            this.add
                .rectangle(W / 2, H / 2 + 20, 600, 300, 0xf0e4c4, 1)
                .setStrokeStyle(3, 0x7a6030)
                .setDepth(3);
            this.add
                .text(W / 2, H / 2 - 30, "No missed emails!", {
                    fontFamily: "Pix32",
                    fontSize: "36px",
                    color: "#1f5c35",
                    fontStyle: "bold",
                })
                .setOrigin(0.5)
                .setDepth(4);
            this.add
                .text(W / 2, H / 2 + 30, "Perfect shift. Head to the shop.", {
                    fontFamily: "Pix32",
                    fontSize: "20px",
                    color: "#5a4a32",
                })
                .setOrigin(0.5)
                .setDepth(4);
            return;
        }

        // Email panel background
        this.computerPanelBg = this.add
            .rectangle(W / 2, H / 2 + 30, 860, 560, 0xf0e4c4, 1)
            .setStrokeStyle(3, 0x7a6030)
            .setDepth(5);

        // Panel header bar
        this.add
            .rectangle(W / 2, 120, 860, 46, 0x1b3022, 1)
            .setStrokeStyle(2, 0xb5953a)
            .setDepth(6);
        this.add
            .rectangle(W / 2, 144, 860, 3, 0xd4a830, 0.9)
            .setDepth(6);

        this.emailPanelTitle = this.add
            .text(W / 2, 120, "Missed Emails — Review", {
                fontFamily: "Pix32",
                fontSize: "22px",
                color: "#f4ecd8",
                fontStyle: "bold",
            })
            .setOrigin(0.5)
            .setDepth(7);

        // Email counter + nav
        this.emailSwitchText = this.add
            .text(200, 158, "", {
                fontFamily: "Pix32",
                fontSize: "16px",
                color: "#5b4f3e",
            })
            .setDepth(7);

        this.previousEmailButton = this.createButton(790, 158, "< Prev", "#5f6359", () => {
            playOneShot(this, SOUND_KEYS.mouseClick, { volume: 0.4 });
            this.showPreviousEmail();
        }, 90).setDepth(7);

        this.nextEmailButton = this.createButton(900, 158, "Next >", "#5f6359", () => {
            playOneShot(this, SOUND_KEYS.mouseClick, { volume: 0.4 });
            this.showNextEmail();
        }, 90).setDepth(7);

        // Email fields
        const leftX = 110;
        const startY = 185;
        const lineH = 36;

        this.fromText = this.add
            .text(leftX, startY, "", {
                fontFamily: "Pix32",
                fontSize: "17px",
                color: "#2a251c",
                wordWrap: { width: 800 },
            })
            .setDepth(7);

        this.domainText = this.add
            .text(leftX, startY + lineH, "", {
                fontFamily: "Pix32",
                fontSize: "17px",
                color: "#2a251c",
                wordWrap: { width: 800 },
            })
            .setDepth(7);

        this.subjectText = this.add
            .text(leftX, startY + lineH * 2, "", {
                fontFamily: "Pix32",
                fontSize: "17px",
                color: "#2a251c",
                wordWrap: { width: 800 },
            })
            .setDepth(7);

        this.contentLabelText = this.add
            .text(leftX, startY + lineH * 3, "Content:", {
                fontFamily: "Pix32",
                fontSize: "17px",
                color: "#2a251c",
            })
            .setDepth(7);

        this.contentText = this.add
            .text(leftX, startY + lineH * 3 + 26, "", {
                fontFamily: "Pix32",
                fontSize: "15px",
                color: "#2a251c",
                wordWrap: { width: 800 },
                lineSpacing: 4,
            })
            .setDepth(7);

        this.attachmentText = this.add
            .text(leftX, startY + lineH * 3 + 26 + 130, "", {
                fontFamily: "Pix32",
                fontSize: "15px",
                color: "#2a251c",
                wordWrap: { width: 800 },
            })
            .setDepth(7);

        // Why it was wrong — shown in red
        this.feedbackReasonText = this.add
            .text(leftX, startY + lineH * 3 + 26 + 165, "", {
                fontFamily: "Pix32",
                fontSize: "15px",
                color: "#7a2d25",
                wordWrap: { width: 800 },
                lineSpacing: 4,
            })
            .setDepth(7);

        this.selectedEmailIndex = 0;
        this.refreshEmailPanel();
    }

    private refreshEmailPanel() {
        const count = this.missedEmailsArray.length;
        if (count === 0) return;

        if (this.selectedEmailIndex < 0 || this.selectedEmailIndex >= count) {
            this.selectedEmailIndex = 0;
        }

        const current = this.missedEmailsArray[this.selectedEmailIndex];
        const reason = this.missedEmailsFeedback[this.selectedEmailIndex] ?? "";

        this.emailSwitchText.setText(
            `Showing ${this.selectedEmailIndex + 1} of ${count} missed`,
        );
        this.fromText.setText(`From: ${current.from}`);
        this.domainText.setText(`Domain: ${current.domain}`);
        this.subjectText.setText(`Subject: ${current.subject}`);
        this.contentText.setText(current.body);
        this.attachmentText.setText(
            `Attachments: ${current.attachments.length > 0 ? current.attachments.join(", ") : "none"}`,
        );
        this.feedbackReasonText.setText(
            reason ? `Why it was wrong${reason}` : "",
        );
    }

    private showPreviousEmail() {
        if (this.missedEmailsArray.length <= 1) return;
        this.selectedEmailIndex =
            (this.selectedEmailIndex - 1 + this.missedEmailsArray.length) %
            this.missedEmailsArray.length;
        this.refreshEmailPanel();
    }

    private showNextEmail() {
        if (this.missedEmailsArray.length <= 1) return;
        this.selectedEmailIndex =
            (this.selectedEmailIndex + 1) % this.missedEmailsArray.length;
        this.refreshEmailPanel();
    }

    private createButton(
        x: number,
        y: number,
        label: string,
        backgroundColor: string,
        onClick: () => void,
        fixedWidth = 180,
    ) {
        const hoverColor = this.brightenColor(backgroundColor, 20);
        const button = this.add
            .text(x, y, label, {
                fontFamily: "Pix32",
                fontSize: "16px",
                color: "#f8f0dc",
                stroke: "#211d17",
                strokeThickness: 1,
                backgroundColor,
                fixedWidth,
                align: "center",
                padding: { left: 8, right: 8, top: 10, bottom: 10 },
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .setShadow(0, 2, "#000000", 6, true, true);

        button.on("pointerdown", onClick);
        button.on("pointerover", () => {
            button.setStyle({ backgroundColor: hoverColor });
            button.setScale(1.02);
        });
        button.on("pointerout", () => {
            button.setStyle({ backgroundColor });
            button.setScale(1);
        });
        return button;
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
