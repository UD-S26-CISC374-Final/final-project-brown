import { Scene } from "phaser";
import {
    DAYS,
    type DayPlan,
    type EmailCase,
    type EmailType,
    getRulebookPages,
    MAX_DAYS,
} from "../email-content";

interface LevelSceneData {
    day?: number;
    totalPoints?: number;
    money?: number;
    daysWithoutRent?: number;
    hintCount?: number;
    revealCount?: number;
    shieldActive?: boolean;
    shopOutcome?: "continue" | "dead" | "win";
    outcomeMessage?: string;
}

interface RulebookPage {
    title: string;
    body: string;
    companyIndex?: number;
}

export class Level1 extends Scene {
    private readonly dayDurationTargetsMs = [
        60000, 70000, 80000, 90000, 100000, 110000, 120000, 130000, 140000,
        150000,
    ];

    private day = 1;
    private dayPoints = 0;
    private totalPoints = 0;
    private money = 0;
    private emailsProcessed = 0;
    private totalEmailsForDay = 0;
    private daysWithoutRent = 0;
    private hintCount = 0;
    private revealCount = 0;
    private shieldActive = false;

    private incomingShopOutcome: LevelSceneData["shopOutcome"];
    private incomingOutcomeMessage = "";

    private inboxEmails: EmailCase[] = [];
    private pendingArrivalEmails: EmailCase[] = [];
    private selectedInboxIndex = -1;
    private arrivalTimers: Phaser.Time.TimerEvent[] = [];
    private dayEmailIntervalMs = 0;
    private interruptRollTimer: Phaser.Time.TimerEvent | null = null;
    private interruptActive = false;
    private interruptProgress = 0;
    private interruptTick: Phaser.Time.TimerEvent | null = null;

    private triageVisible = true;
    private computerPanelOpen = false;
    private filesPanelOpen = false;
    private hasUnreadNotification = false;
    private computerHovered = false;
    private filesHovered = false;

    private rulebookPages: RulebookPage[] = [];
    private rulebookPageIndex = 0;

    private deskBackgroundImage!: Phaser.GameObjects.Image;
    private computerObject!: Phaser.GameObjects.Image;
    private filesObject!: Phaser.GameObjects.Image;
    private computerZone!: Phaser.GameObjects.Zone;
    private filesZone!: Phaser.GameObjects.Zone;
    private computerPanelChrome: Phaser.GameObjects.Rectangle[] = [];
    private filesPanelChrome: Phaser.GameObjects.Rectangle[] = [];

    private headerText!: Phaser.GameObjects.Text;
    private scoreText!: Phaser.GameObjects.Text;
    private moneyText!: Phaser.GameObjects.Text;
    private progressText!: Phaser.GameObjects.Text;
    private feedbackBar!: Phaser.GameObjects.Rectangle;
    private feedbackText!: Phaser.GameObjects.Text;
    private readonly classificationFeedbackHoldMs = 3000;
    private feedbackHoldUntilMs = 0;
    private deferredFeedbackTimer: Phaser.Time.TimerEvent | null = null;
    private dayFinishTimer: Phaser.Time.TimerEvent | null = null;

    private endScreenBg!: Phaser.GameObjects.Rectangle;
    private computerPanelBg!: Phaser.GameObjects.Rectangle;
    private filesPanelBg!: Phaser.GameObjects.Rectangle;

    private emailPanelTitle!: Phaser.GameObjects.Text;
    private fromText!: Phaser.GameObjects.Text;
    private domainText!: Phaser.GameObjects.Text;
    private subjectText!: Phaser.GameObjects.Text;
    private contentLabelText!: Phaser.GameObjects.Text;
    private contentText!: Phaser.GameObjects.Text;
    private attachmentText!: Phaser.GameObjects.Text;
    private emailSwitchText!: Phaser.GameObjects.Text;
    private previousEmailButton!: Phaser.GameObjects.Text;
    private nextEmailButton!: Phaser.GameObjects.Text;
    private powerupStatusText!: Phaser.GameObjects.Text;
    private hintButton!: Phaser.GameObjects.Text;
    private revealButton!: Phaser.GameObjects.Text;

    private rulebookTitleText!: Phaser.GameObjects.Text;
    private rulebookPageText!: Phaser.GameObjects.Text;
    private rulebookBodyText!: Phaser.GameObjects.Text;
    private previousRulePageButton!: Phaser.GameObjects.Text;
    private nextRulePageButton!: Phaser.GameObjects.Text;
    private rulebookCoreButton!: Phaser.GameObjects.Text;
    private rulebookRosterButton!: Phaser.GameObjects.Text;
    private rulebookTodayButton!: Phaser.GameObjects.Text;
    private companyRuleButtons: Phaser.GameObjects.Text[] = [];

    private validButton!: Phaser.GameObjects.Text;
    private phishingButton!: Phaser.GameObjects.Text;
    private revealedEmails = new WeakSet<EmailCase>();

    private endDayTitle!: Phaser.GameObjects.Text;
    private endDaySummary!: Phaser.GameObjects.Text;
    private toShopButton!: Phaser.GameObjects.Text;

    private finalTitle!: Phaser.GameObjects.Text;
    private finalSummary!: Phaser.GameObjects.Text;
    private restartButton!: Phaser.GameObjects.Text;
    private selectButton!: Phaser.GameObjects.Text;
    private mainmenuButton!: Phaser.GameObjects.Text;

    private dudeSprite!: Phaser.GameObjects.Image;
    private interruptBarBg!: Phaser.GameObjects.Rectangle;
    private interruptBarFill!: Phaser.GameObjects.Rectangle;
    private interruptText!: Phaser.GameObjects.Text;

    //timer setup
    private timerValue = 300;
    private timerText!: Phaser.GameObjects.Text;

    constructor() {
        super("Level1");
    }

    init(data: LevelSceneData) {
        this.day = data.day ?? 1;
        this.totalPoints = data.totalPoints ?? 0;
        this.money = data.money ?? 0;
        this.daysWithoutRent = data.daysWithoutRent ?? 0;
        this.hintCount = data.hintCount ?? 0;
        this.revealCount = data.revealCount ?? 0;
        this.shieldActive = data.shieldActive ?? false;
        this.incomingShopOutcome = data.shopOutcome;
        this.incomingOutcomeMessage = data.outcomeMessage ?? "";
    }

    create() {
        this.buildDesk();
        this.buildUI();
        this.applyUIFont();
        this.buildInterruptUI();
        this.refreshTopBar();

        if (this.incomingShopOutcome === "dead") {
            this.showEnding("Game Over", this.incomingOutcomeMessage);
            return;
        }

        if (this.incomingShopOutcome === "win") {
            this.showEnding(
                "You Survived 10 Days",
                this.incomingOutcomeMessage,
            );
            return;
        }
        this.startDay(this.day);

        this.timerValue = 300 - (this.day - 1) * 10;
        this.timerText = this.add
            .text(860, 57, `Time: ${this.timerValue}s`, {
                fontFamily: "Pix32",
                fontSize: "22px",
                color: "#f4ecd8",
            })
            .setStyle({ backgroundColor: "#334339" })
            .setDepth(11);
        this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                this.timerValue--;
                this.timerText.setText(`Time: ${this.timerValue}s`);
                if (this.timerValue <= 0) {
                    this.showEnding(
                        "Time's Up!",
                        "You ran out of time to sort the emails.",
                    );
                }
            },
        });
    }

    private buildDesk() {
        if (this.textures.exists("desk-background")) {
            this.deskBackgroundImage = this.add
                .image(512, 384, "desk-background")
                .setDisplaySize(1024, 768)
                .setDepth(-8);
        } else {
            this.deskBackgroundImage = this.add
                .image(512, 384, "background")
                .setDisplaySize(1024, 768)
                .setDepth(-8);
        }

        const computerBaseKey =
            this.textures.exists("desk-computer") ? "desk-computer" : "logo";
        const filesBaseKey =
            this.textures.exists("desk-files") ? "desk-files" : "logo";

        this.computerObject = this.add
            .image(512, 384, computerBaseKey)
            .setDisplaySize(1024, 768)
            .setDepth(-7);

        this.filesObject = this.add
            .image(512, 384, filesBaseKey)
            .setDisplaySize(1024, 768)
            .setDepth(-6);

        this.computerZone = this.add
            .zone(760, 406, 430, 520)
            .setInteractive({ useHandCursor: true });

        this.filesZone = this.add
            .zone(260, 406, 430, 520)
            .setInteractive({ useHandCursor: true });

        this.computerZone.on("pointerover", () => {
            this.computerHovered = true;
            this.refreshDeskTextures();
        });
        this.computerZone.on("pointerout", () => {
            this.computerHovered = false;
            this.refreshDeskTextures();
        });
        this.computerZone.on("pointerdown", () => {
            if (!this.triageVisible || this.interruptActive) {
                return;
            }

            this.computerPanelOpen = !this.computerPanelOpen;
            if (this.computerPanelOpen) {
                this.hasUnreadNotification = false;
                if (
                    this.selectedInboxIndex < 0 &&
                    this.inboxEmails.length > 0
                ) {
                    this.selectedInboxIndex = 0;
                }
                this.refreshEmailPanel();
            }

            this.updatePanelVisibility();
            this.refreshDeskTextures();
        });

        this.filesZone.on("pointerover", () => {
            if (!this.triageVisible) {
                return;
            }

            this.filesHovered = true;
            this.refreshDeskTextures();
        });
        this.filesZone.on("pointerout", () => {
            this.filesHovered = false;
            this.refreshDeskTextures();
        });
        this.filesZone.on("pointerdown", () => {
            if (!this.triageVisible || this.interruptActive) {
                return;
            }

            this.filesPanelOpen = !this.filesPanelOpen;
            this.updatePanelVisibility();
        });

        this.refreshDeskTextures();
    }

    private buildUI() {
        this.add
            .rectangle(512, 58, 1024, 106, 0x26362c, 0.96)
            .setStrokeStyle(2, 0xb5a36a)
            .setDepth(10);
        this.add.rectangle(512, 116, 1024, 6, 0xb5a36a, 0.9).setDepth(10);

        this.mainmenuButton = this.createButton(
            780,
            70,
            "Main Menu",
            "#66563b",
            () => {
                this.scene.start("MainMenu");
            },
            120,
        ).setDepth(14);

        this.headerText = this.add
            .text(32, 18, "", {
                fontSize: "30px",
                color: "#f4ecd8",
                fontStyle: "bold",
            })
            .setDepth(11);

        this.scoreText = this.add
            .text(32, 57, "", {
                fontSize: "22px",
                color: "#f4ecd8",
            })
            .setStyle({ backgroundColor: "#334339" })
            .setDepth(11);

        this.moneyText = this.add
            .text(250, 57, "", {
                fontSize: "22px",
                color: "#e2d39e",
            })
            .setStyle({ backgroundColor: "transparent" })
            .setDepth(11);

        this.progressText = this.add
            .text(460, 59, "", {
                fontSize: "20px",
                color: "#e2d39e",
            })
            .setStyle({ backgroundColor: "transparent" })
            .setDepth(11);

        this.feedbackBar = this.add
            .rectangle(512, 144, 920, 42, 0xefe4c7, 0.95)
            .setStrokeStyle(2, 0x5d5747)
            .setDepth(29);

        this.feedbackText = this.add
            .text(74, 130, "", {
                fontSize: "20px",
                color: "#2c271f",
                wordWrap: { width: 860 },
            })
            .setDepth(30);

        this.endScreenBg = this.add
            .rectangle(512, 384, 1024, 768, 0x30342b, 0.96)
            .setDepth(18)
            .setVisible(false);

        this.computerPanelBg = this.add
            .rectangle(770, 466, 470, 590, 0xefe4c7, 0.97)
            .setStrokeStyle(3, 0x5d5747)
            .setDepth(15)
            .setVisible(false);

        this.filesPanelBg = this.add
            .rectangle(255, 466, 460, 590, 0xefe4c7, 0.97)
            .setStrokeStyle(3, 0x5d5747)
            .setDepth(15)
            .setVisible(false);

        this.computerPanelChrome = [
            this.add
                .rectangle(770, 202, 432, 46, 0x26362c, 1)
                .setStrokeStyle(2, 0xb5a36a)
                .setDepth(15)
                .setVisible(false),
            this.add
                .rectangle(770, 364, 432, 2, 0xb5a36a, 0.62)
                .setDepth(15)
                .setVisible(false),
            this.add
                .rectangle(770, 492, 432, 178, 0xf8f0dc, 0.7)
                .setStrokeStyle(1, 0xd0bd84)
                .setDepth(15)
                .setVisible(false),
            this.add
                .rectangle(770, 640, 432, 70, 0xe2d39e, 0.32)
                .setStrokeStyle(1, 0xd0bd84)
                .setDepth(15)
                .setVisible(false),
        ];

        this.filesPanelChrome = [
            this.add
                .rectangle(255, 202, 422, 46, 0x26362c, 1)
                .setStrokeStyle(2, 0xb5a36a)
                .setDepth(15)
                .setVisible(false),
            this.add
                .rectangle(255, 266, 422, 2, 0xb5a36a, 0.62)
                .setDepth(15)
                .setVisible(false),
            this.add
                .rectangle(255, 526, 422, 330, 0xf8f0dc, 0.72)
                .setStrokeStyle(1, 0xd0bd84)
                .setDepth(15)
                .setVisible(false),
        ];

        this.emailPanelTitle = this.add
            .text(560, 189, "Email Monitor", {
                fontSize: "24px",
                color: "#f4ecd8",
                fontStyle: "bold",
            })
            .setDepth(16)
            .setVisible(false);

        this.emailSwitchText = this.add
            .text(560, 236, "", {
                fontSize: "16px",
                color: "#5b4f3e",
            })
            .setDepth(16)
            .setVisible(false);

        this.previousEmailButton = this.createButton(
            790,
            236,
            "< Prev",
            "#5f6359",
            () => {
                this.showPreviousEmail();
            },
            90,
        )
            .setDepth(16)
            .setVisible(false);

        this.nextEmailButton = this.createButton(
            900,
            236,
            "Next >",
            "#5f6359",
            () => {
                this.showNextEmail();
            },
            90,
        )
            .setDepth(16)
            .setVisible(false);

        this.fromText = this.add
            .text(560, 276, "", {
                fontSize: "17px",
                color: "#2a251c",
                wordWrap: { width: 430 },
                lineSpacing: 4,
            })
            .setDepth(16)
            .setVisible(false);

        this.domainText = this.add
            .text(560, 312, "", {
                fontSize: "17px",
                color: "#2a251c",
                wordWrap: { width: 430 },
            })
            .setDepth(16)
            .setVisible(false);

        this.subjectText = this.add
            .text(560, 348, "", {
                fontSize: "17px",
                color: "#2a251c",
                wordWrap: { width: 430 },
                lineSpacing: 4,
            })
            .setDepth(16)
            .setVisible(false);

        this.contentLabelText = this.add
            .text(560, 392, "Content:", {
                fontSize: "17px",
                color: "#2a251c",
            })
            .setDepth(16)
            .setVisible(false);

        this.contentText = this.add
            .text(560, 422, "", {
                fontSize: "16px",
                color: "#2a251c",
                wordWrap: { width: 430 },
                lineSpacing: 6,
            })
            .setDepth(16)
            .setVisible(false);

        this.attachmentText = this.add
            .text(560, 594, "", {
                fontSize: "16px",
                color: "#2a251c",
                wordWrap: { width: 430 },
                lineSpacing: 4,
            })
            .setDepth(16)
            .setVisible(false);

        this.powerupStatusText = this.add
            .text(560, 632, "", {
                fontSize: "14px",
                color: "#5a4a32",
                wordWrap: { width: 430 },
                lineSpacing: 4,
            })
            .setDepth(16)
            .setVisible(false);

        this.hintButton = this.createButton(
            630,
            672,
            "Hint",
            "#66563b",
            () => {
                this.useHint();
            },
            130,
        )
            .setDepth(16)
            .setVisible(false);

        this.revealButton = this.createButton(
            810,
            672,
            "Eliminate",
            "#66563b",
            () => {
                this.useReveal();
            },
            150,
        )
            .setDepth(16)
            .setVisible(false);

        this.validButton = this.createButton(
            675,
            716,
            "Valid",
            "#44624c",
            () => {
                this.classifySelectedEmail("valid");
            },
            150,
        )
            .setDepth(16)
            .setVisible(false);

        this.phishingButton = this.createButton(
            865,
            716,
            "Phishing",
            "#7a3e36",
            () => {
                this.classifySelectedEmail("phishing");
            },
            150,
        )
            .setDepth(16)
            .setVisible(false);

        this.rulebookTitleText = this.add
            .text(44, 186, "Rulebook", {
                fontSize: "28px",
                color: "#f4ecd8",
                fontStyle: "bold",
            })
            .setDepth(16)
            .setVisible(false);

        this.rulebookCoreButton = this.createButton(
            82,
            244,
            "Core",
            "#66563b",
            () => {
                this.showRulebookPageByTitle("Core Rules");
            },
            78,
        )
            .setDepth(16)
            .setVisible(false);

        this.rulebookRosterButton = this.createButton(
            190,
            244,
            "Roster",
            "#66563b",
            () => {
                this.showRulebookPageByTitle("RedForge");
            },
            96,
        )
            .setDepth(16)
            .setVisible(false);

        this.rulebookTodayButton = this.createButton(
            312,
            244,
            "Today",
            "#66563b",
            () => {
                this.showRulebookPageByTitle(`Day ${this.day} Alerts`);
            },
            90,
        )
            .setDepth(16)
            .setVisible(false);

        const companyLabels = [
            { button: "Red", page: "RedForge" },
            { button: "Blue", page: "BluePeak" },
            { button: "North", page: "Northstar" },
            { button: "Stone", page: "StoneGate" },
            { button: "Clear", page: "ClearPath" },
            { button: "Iron", page: "IronClad" },
        ];
        this.companyRuleButtons = companyLabels.map((company, index) =>
            this.createButton(
                58 + index * 67,
                292,
                company.button,
                "#4d5f55",
                () => {
                    this.showRulebookPageByTitle(company.page);
                },
                62,
            )
                .setDepth(16)
                .setVisible(false),
        );

        this.rulebookPageText = this.add
            .text(44, 330, "", {
                fontSize: "20px",
                color: "#5a4a32",
                wordWrap: { width: 410 },
            })
            .setDepth(16)
            .setVisible(false);

        this.rulebookBodyText = this.add
            .text(44, 366, "", {
                fontSize: "15px",
                color: "#2a251c",
                wordWrap: { width: 410 },
                lineSpacing: 4,
            })
            .setDepth(16)
            .setVisible(false);

        this.previousRulePageButton = this.createButton(
            145,
            734,
            "< Page",
            "#66563b",
            () => {
                this.showPreviousRulePage();
            },
            130,
        )
            .setDepth(16)
            .setVisible(false);

        this.nextRulePageButton = this.createButton(
            365,
            734,
            "Page >",
            "#66563b",
            () => {
                this.showNextRulePage();
            },
            130,
        )
            .setDepth(16)
            .setVisible(false);

        this.endDayTitle = this.add
            .text(512, 260, "", {
                fontSize: "42px",
                color: "#f4ecd8",
                fontStyle: "bold",
            })
            .setOrigin(0.5)
            .setDepth(20)
            .setVisible(false);

        this.endDaySummary = this.add
            .text(512, 350, "", {
                fontSize: "26px",
                color: "#efe4c7",
                align: "center",
                wordWrap: { width: 700 },
                lineSpacing: 8,
            })
            .setOrigin(0.5)
            .setDepth(20)
            .setVisible(false);

        this.toShopButton = this.createButton(
            512,
            460,
            "Enter Shop",
            "#44624c",
            () => {
                this.enterShop();
            },
            240,
        )
            .setDepth(20)
            .setVisible(false);

        this.finalTitle = this.add
            .text(512, 250, "", {
                fontSize: "48px",
                color: "#f4ecd8",
                fontStyle: "bold",
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(20)
            .setVisible(false);

        this.finalSummary = this.add
            .text(512, 360, "", {
                fontSize: "28px",
                color: "#efe4c7",
                align: "center",
                wordWrap: { width: 760 },
                lineSpacing: 8,
            })
            .setOrigin(0.5)
            .setDepth(20)
            .setVisible(false);

        this.restartButton = this.createButton(
            512,
            500,
            "Restart Game",
            "#4d5f55",
            () => {
                this.timerValue = 300;
                this.scene.start("Level1", {
                    day: 1,
                    totalPoints: 0,
                    money: 0,
                    daysWithoutRent: 0,
                    hintCount: 0,
                    revealCount: 0,
                    shieldActive: false,
                });
            },
            240,
        )
            .setDepth(20)
            .setVisible(false);
        this.mainmenuButton = this.createButton(
            512,
            550,
            "Main Menu",
            "#66563b",
            () => {
                this.scene.start("MainMenu");
            },
            240,
        )
            .setDepth(20)
            .setVisible(false);
        this.selectButton = this.createButton(
            512,
            600,
            "Select Level",
            "#66563b",
            () => {
                this.scene.start("LevelSelect");
            },
            240,
        )
            .setDepth(20)
            .setVisible(false);
    }

    private buildInterruptUI() {
        this.dudeSprite = this.add
            .image(512, 384, "desk-dude")
            .setDisplaySize(1024, 768)
            .setDepth(25)
            .setVisible(false);

        this.interruptBarBg = this.add
            .rectangle(512, 640, 700, 36, 0x2a2a2a)
            .setStrokeStyle(2, 0xffffff)
            .setDepth(26)
            .setVisible(false);

        this.interruptBarFill = this.add
            .rectangle(512, 640, 700, 30, 0x7a1f1f)
            .setDepth(27)
            .setVisible(false);

        this.interruptText = this.add
            .text(512, 640, "Ignore conversation", {
                fontFamily: "Pix32",
                fontSize: "20px",
                color: "#ffffff",
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(28)
            .setVisible(false);

        this.input.keyboard?.on("keydown-SPACE", () => {
            if (!this.interruptActive) {
                return;
            }

            this.interruptProgress = Math.min(1, this.interruptProgress + 0.12);
            this.refreshInterruptBar();

            if (this.interruptProgress >= 1) {
                this.endInterrupt();
            }
        });
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

    private applyUIFont() {
        const uiText = [
            this.headerText,
            this.scoreText,
            this.moneyText,
            this.progressText,
            this.feedbackText,
            this.emailPanelTitle,
            this.fromText,
            this.domainText,
            this.subjectText,
            this.contentLabelText,
            this.contentText,
            this.attachmentText,
            this.emailSwitchText,
            this.previousEmailButton,
            this.nextEmailButton,
            this.powerupStatusText,
            this.hintButton,
            this.revealButton,
            this.rulebookTitleText,
            this.rulebookPageText,
            this.rulebookBodyText,
            this.previousRulePageButton,
            this.nextRulePageButton,
            this.rulebookCoreButton,
            this.rulebookRosterButton,
            this.rulebookTodayButton,
            ...this.companyRuleButtons,
            this.validButton,
            this.phishingButton,
            this.endDayTitle,
            this.endDaySummary,
            this.toShopButton,
            this.finalTitle,
            this.finalSummary,
            this.restartButton,
        ];

        for (const textObject of uiText) {
            textObject.setFontFamily("Pix32");
        }
    }

    private startDay(day: number) {
        this.clearArrivalTimers();
        this.clearInterrupt();
        this.clearStatusTimers();

        this.day = Math.min(day, MAX_DAYS);
        this.dayPoints = 0;
        this.emailsProcessed = 0;
        this.inboxEmails = [];
        this.pendingArrivalEmails = [];
        this.selectedInboxIndex = -1;
        this.hasUnreadNotification = false;
        this.computerPanelOpen = false;
        this.filesPanelOpen = false;
        this.revealedEmails = new WeakSet<EmailCase>();

        const dayPlan = this.getDayPlan();
        this.rulebookPages = getRulebookPages(dayPlan);
        this.rulebookPageIndex = 0;
        this.refreshRulebook();

        this.pendingArrivalEmails = Phaser.Utils.Array.Shuffle([
            ...dayPlan.emails,
        ]);
        this.totalEmailsForDay = this.pendingArrivalEmails.length;

        const targetDuration =
            this.dayDurationTargetsMs[this.day - 1] ??
            this.dayDurationTargetsMs[this.dayDurationTargetsMs.length - 1];
        this.dayEmailIntervalMs = targetDuration / this.totalEmailsForDay;

        this.showTriageUI(true);
        this.showEndDayUI(false);
        this.showFinalUI(false);
        this.updatePanelVisibility();

        this.feedbackText
            .setText(
                `Day ${this.day} begins. Review the rulebook and classify each email.`,
            )
            .setColor("#2c271f");

        this.refreshEmailPanel();
        this.refreshPowerupUI();
        this.refreshTopBar();
        this.refreshProgressText();

        this.scheduleNextEmailArrival();
        this.startInterruptRolls();
    }

    private getDayPlan(): DayPlan {
        return DAYS[this.day - 1] ?? DAYS[DAYS.length - 1];
    }

    private startInterruptRolls() {
        this.interruptRollTimer = this.time.addEvent({
            delay: 5000,
            loop: true,
            callback: () => {
                if (!this.triageVisible || this.interruptActive) {
                    return;
                }

                if (Phaser.Math.FloatBetween(0, 1) <= 1 / 12) {
                    this.startInterrupt();
                }
            },
        });
    }

    private startInterrupt() {
        if (!this.triageVisible || this.interruptActive) {
            return;
        }

        this.interruptActive = true;
        this.interruptProgress = 0.3;

        this.dudeSprite.setVisible(true);
        this.interruptBarBg.setVisible(true);
        this.interruptBarFill.setVisible(true);
        this.interruptText.setVisible(true);

        this.computerPanelOpen = false;
        this.filesPanelOpen = false;
        this.updatePanelVisibility();

        this.refreshInterruptBar();

        this.interruptTick = this.time.addEvent({
            delay: 120,
            loop: true,
            callback: () => {
                if (!this.interruptActive) {
                    return;
                }

                this.interruptProgress = Math.max(
                    0,
                    this.interruptProgress - 0.03,
                );
                this.refreshInterruptBar();
                if (this.interruptProgress <= 0) {
                    this.interruptProgress = 0;
                }
            },
        });
    }

    private refreshInterruptBar() {
        const maxWidth = 700;
        const width = Math.max(6, maxWidth * this.interruptProgress);
        this.interruptBarFill.setDisplaySize(width, 30);
    }

    private endInterrupt() {
        this.interruptActive = false;
        this.dudeSprite.setVisible(false);
        this.interruptBarBg.setVisible(false);
        this.interruptBarFill.setVisible(false);
        this.interruptText.setVisible(false);

        if (this.interruptTick) {
            this.interruptTick.remove(false);
            this.interruptTick = null;
        }
    }

    private clearInterrupt() {
        if (this.interruptRollTimer) {
            this.interruptRollTimer.remove(false);
            this.interruptRollTimer = null;
        }
        if (this.interruptTick) {
            this.interruptTick.remove(false);
            this.interruptTick = null;
        }
        this.interruptActive = false;

        this.dudeSprite.setVisible(false);
        this.interruptBarBg.setVisible(false);
        this.interruptBarFill.setVisible(false);
        this.interruptText.setVisible(false);
    }

    private scheduleNextEmailArrival() {
        if (this.pendingArrivalEmails.length === 0 || !this.triageVisible) {
            return;
        }

        const baseDelay = this.dayEmailIntervalMs;
        const minDelay = Math.max(2500, Math.floor(baseDelay * 0.7));
        const maxDelay = Math.max(minDelay + 500, Math.floor(baseDelay * 1.3));
        const delay = Phaser.Math.Between(minDelay, maxDelay);

        const timer = this.time.delayedCall(delay, () => {
            const nextEmail = this.pendingArrivalEmails.shift();
            if (!nextEmail || !this.triageVisible) {
                return;
            }

            this.inboxEmails.push(nextEmail);
            if (this.selectedInboxIndex < 0) {
                this.selectedInboxIndex = 0;
            }

            if (!this.computerPanelOpen) {
                this.hasUnreadNotification = true;
            }

            this.setStatusBar(
                `New email arrived. Inbox: ${this.inboxEmails.length}. Click the computer to review.`,
                "#7a2d25",
                { waitForHold: true },
            );

            this.refreshDeskTextures();
            this.refreshProgressText();
            if (this.computerPanelOpen) {
                this.refreshEmailPanel();
                this.refreshPowerupUI();
            }

            this.scheduleNextEmailArrival();
        });

        this.arrivalTimers.push(timer);
    }

    private clearArrivalTimers() {
        for (const timer of this.arrivalTimers) {
            timer.remove(false);
        }
        this.arrivalTimers = [];
    }

    private clearStatusTimers() {
        if (this.deferredFeedbackTimer) {
            this.deferredFeedbackTimer.remove(false);
            this.deferredFeedbackTimer = null;
        }

        if (this.dayFinishTimer) {
            this.dayFinishTimer.remove(false);
            this.dayFinishTimer = null;
        }

        this.feedbackHoldUntilMs = 0;
    }

    private setStatusBar(
        message: string,
        color: string,
        options: { holdMs?: number; waitForHold?: boolean } = {},
    ) {
        const remainingHoldMs = this.feedbackHoldUntilMs - this.time.now;

        if (options.waitForHold && remainingHoldMs > 0) {
            if (this.deferredFeedbackTimer) {
                this.deferredFeedbackTimer.remove(false);
            }

            this.deferredFeedbackTimer = this.time.delayedCall(
                remainingHoldMs,
                () => {
                    this.deferredFeedbackTimer = null;
                    this.setStatusBar(message, color);
                },
            );
            return;
        }

        if (this.deferredFeedbackTimer) {
            this.deferredFeedbackTimer.remove(false);
            this.deferredFeedbackTimer = null;
        }

        this.feedbackText.setText(message).setColor(color);
        this.feedbackHoldUntilMs =
            options.holdMs && options.holdMs > 0 ?
                this.time.now + options.holdMs
            :   0;
    }

    private scheduleFinishDayAfterStatusHold() {
        if (this.dayFinishTimer) {
            this.dayFinishTimer.remove(false);
        }

        const delay = Math.max(0, this.feedbackHoldUntilMs - this.time.now);
        this.dayFinishTimer = this.time.delayedCall(delay, () => {
            this.dayFinishTimer = null;
            this.finishDay();
        });
    }

    private refreshEmailPanel() {
        const inboxCount = this.inboxEmails.length;

        if (inboxCount === 0) {
            this.emailPanelTitle.setText("Email Monitor");
            this.emailSwitchText.setText("Inbox empty");
            this.fromText.setText("From: --");
            this.domainText.setText("Domain: --");
            this.subjectText.setText("Subject: --");
            this.contentText.setText(
                "No email selected. New emails will arrive during the day.",
            );
            this.attachmentText.setText("Attachments: --");
            this.refreshDecisionButtons(null);
            this.refreshPowerupUI();
            return;
        }

        if (
            this.selectedInboxIndex < 0 ||
            this.selectedInboxIndex >= inboxCount
        ) {
            this.selectedInboxIndex = 0;
        }

        const current = this.inboxEmails[this.selectedInboxIndex];
        this.emailPanelTitle.setText("Email Monitor");
        this.emailSwitchText.setText(
            `Showing ${this.selectedInboxIndex + 1}/${inboxCount} (Queued: ${inboxCount})`,
        );
        this.fromText.setText(`From: ${current.from}`);
        this.domainText.setText(`Domain: ${current.domain}`);
        this.subjectText.setText(`Subject: ${current.subject}`);
        this.contentText.setText(current.body);
        this.attachmentText.setText(
            `Attachments: ${
                current.attachments.length > 0 ?
                    current.attachments.join(", ")
                :   "none"
            }`,
        );
        this.refreshDecisionButtons(current);
        this.refreshPowerupUI();
    }

    private showPreviousEmail() {
        if (this.inboxEmails.length <= 1) {
            return;
        }

        this.selectedInboxIndex =
            (this.selectedInboxIndex - 1 + this.inboxEmails.length) %
            this.inboxEmails.length;

        this.refreshEmailPanel();
    }

    private showNextEmail() {
        if (this.inboxEmails.length <= 1) {
            return;
        }

        this.selectedInboxIndex =
            (this.selectedInboxIndex + 1) % this.inboxEmails.length;

        this.refreshEmailPanel();
    }

    private getCurrentEmail() {
        if (this.inboxEmails.length === 0 || this.selectedInboxIndex < 0) {
            return null;
        }

        return this.inboxEmails[this.selectedInboxIndex] ?? null;
    }

    private useHint() {
        const currentEmail = this.getCurrentEmail();
        if (!currentEmail) {
            this.feedbackText
                .setText("No email selected for a hint.")
                .setColor("#7a2d25");
            return;
        }

        if (this.hintCount <= 0) {
            this.feedbackText
                .setText("No hints available. Buy one at the shop.")
                .setColor("#7a2d25");
            return;
        }

        this.hintCount -= 1;
        const hint =
            currentEmail.violations[0] ??
            "No obvious rule conflict found. Check the roster, topic, and attachments.";

        this.feedbackText.setText(`Hint: ${hint}`).setColor("#5a4a32");
        this.refreshPowerupUI();
    }

    private useReveal() {
        const currentEmail = this.getCurrentEmail();
        if (!currentEmail) {
            this.feedbackText
                .setText("No email selected to eliminate an answer.")
                .setColor("#7a2d25");
            return;
        }

        if (this.revealCount <= 0) {
            this.feedbackText
                .setText("No eliminators available. Buy one at the shop.")
                .setColor("#7a2d25");
            return;
        }

        if (this.revealedEmails.has(currentEmail)) {
            this.feedbackText
                .setText("The wrong answer is already eliminated here.")
                .setColor("#5a4a32");
            return;
        }

        this.revealCount -= 1;
        this.revealedEmails.add(currentEmail);

        const eliminated = currentEmail.type === "valid" ? "Phishing" : "Valid";
        this.feedbackText
            .setText(`Eliminated: ${eliminated}.`)
            .setColor("#5a4a32");
        this.refreshDecisionButtons(currentEmail);
        this.refreshPowerupUI();
    }

    private classifySelectedEmail(choice: EmailType) {
        if (this.inboxEmails.length === 0 || this.selectedInboxIndex < 0) {
            this.feedbackText
                .setText(
                    "No email selected. Wait for arrivals or open the computer panel.",
                )
                .setColor("#7a2d25");
            return;
        }

        const currentEmail = this.inboxEmails[this.selectedInboxIndex];

        if (
            this.revealedEmails.has(currentEmail) &&
            choice !== currentEmail.type
        ) {
            this.feedbackText
                .setText(
                    "That answer was eliminated. Choose the remaining option.",
                )
                .setColor("#7a2d25");
            return;
        }

        if (choice === currentEmail.type) {
            this.totalPoints += 1;
            this.money += 5;
            this.dayPoints += 1;
            this.setStatusBar("Correct classification: +1 point.", "#1f5c35", {
                holdMs: this.classificationFeedbackHoldMs,
            });
        } else if (this.shieldActive) {
            this.shieldActive = false;
            this.setStatusBar(
                `Shield absorbed the mistake. This email was ${currentEmail.type}.`,
                "#5a4a32",
                { holdMs: this.classificationFeedbackHoldMs },
            );
        } else {
            const reasonText =
                currentEmail.violations.length > 0 ?
                    ` Watch for: ${currentEmail.violations.join("; ")}.`
                :   "";
            this.totalPoints -= 1;
            this.dayPoints -= 1;
            this.money -= 5;
            this.setStatusBar(
                `Incorrect. This email was ${currentEmail.type}.${reasonText} -1 point.`,
                "#7a2d25",
                { holdMs: this.classificationFeedbackHoldMs },
            );
        }

        this.inboxEmails.splice(this.selectedInboxIndex, 1);
        this.emailsProcessed += 1;

        if (this.inboxEmails.length === 0) {
            this.selectedInboxIndex = -1;
        } else if (this.selectedInboxIndex >= this.inboxEmails.length) {
            this.selectedInboxIndex = this.inboxEmails.length - 1;
        }

        this.refreshTopBar();
        this.refreshProgressText();
        this.refreshEmailPanel();
        this.refreshPowerupUI();

        if (this.emailsProcessed >= this.totalEmailsForDay) {
            this.scheduleFinishDayAfterStatusHold();
        }
    }

    private showPreviousRulePage() {
        if (this.rulebookPages.length === 0) {
            return;
        }

        this.rulebookPageIndex =
            (this.rulebookPageIndex - 1 + this.rulebookPages.length) %
            this.rulebookPages.length;
        this.refreshRulebook();
    }

    private showNextRulePage() {
        if (this.rulebookPages.length === 0) {
            return;
        }

        this.rulebookPageIndex =
            (this.rulebookPageIndex + 1) % this.rulebookPages.length;
        this.refreshRulebook();
    }

    private showRulebookPageByTitle(title: string) {
        const pageIndex = this.rulebookPages.findIndex(
            (page) => page.title === title,
        );

        if (pageIndex < 0) {
            return;
        }

        this.rulebookPageIndex = pageIndex;
        this.refreshRulebook();
    }

    private refreshRulebook() {
        const page = this.rulebookPages[this.rulebookPageIndex];
        this.rulebookPageText.setText(
            `${page.title} (${this.rulebookPageIndex + 1}/${this.rulebookPages.length})`,
        );
        this.rulebookBodyText.setText(page.body);
        this.refreshRulebookControls(page);
    }

    private refreshRulebookControls(page: RulebookPage) {
        const isCore = page.title.startsWith("Core Rules");
        const isToday = page.title === `Day ${this.day} Alerts`;
        const isRoster = page.companyIndex !== undefined;

        this.rulebookCoreButton.setAlpha(isCore ? 1 : 0.72);
        this.rulebookRosterButton.setAlpha(isRoster ? 1 : 0.72);
        this.rulebookTodayButton.setAlpha(isToday ? 1 : 0.72);

        this.companyRuleButtons.forEach((button, index) => {
            button
                .setVisible(this.filesPanelOpen)
                .setAlpha(page.companyIndex === index ? 1 : 0.72);
        });
    }

    private refreshProgressText() {
        this.progressText.setText(
            `Processed ${this.emailsProcessed}/${this.totalEmailsForDay} | Inbox ${this.inboxEmails.length}`,
        );
    }

    private refreshDecisionButtons(currentEmail: EmailCase | null) {
        this.validButton.setText("Valid").setAlpha(1);
        this.phishingButton.setText("Phishing").setAlpha(1);

        if (!currentEmail || !this.revealedEmails.has(currentEmail)) {
            return;
        }

        if (currentEmail.type === "valid") {
            this.phishingButton.setText("Phishing X").setAlpha(0.48);
        } else {
            this.validButton.setText("Valid X").setAlpha(0.48);
        }
    }

    private refreshPowerupUI() {
        const shieldText = this.shieldActive ? "Shield: armed" : "Shield: none";
        this.powerupStatusText.setText(
            `Hints: ${this.hintCount} | Eliminators: ${this.revealCount} | ${shieldText}`,
        );

        this.hintButton.setText(`Hint (${this.hintCount})`);
        this.revealButton.setText(`Eliminate (${this.revealCount})`);
        this.hintButton.setAlpha(this.hintCount > 0 ? 1 : 0.55);
        this.revealButton.setAlpha(this.revealCount > 0 ? 1 : 0.55);
    }

    private updatePanelVisibility() {
        const showComputerPanel = this.triageVisible && this.computerPanelOpen;
        const showFilesPanel = this.triageVisible && this.filesPanelOpen;

        this.computerPanelBg.setVisible(showComputerPanel);
        for (const item of this.computerPanelChrome) {
            item.setVisible(showComputerPanel);
        }
        this.emailPanelTitle.setVisible(showComputerPanel);
        this.emailSwitchText.setVisible(showComputerPanel);
        this.previousEmailButton.setVisible(showComputerPanel);
        this.nextEmailButton.setVisible(showComputerPanel);
        this.fromText.setVisible(showComputerPanel);
        this.domainText.setVisible(showComputerPanel);
        this.subjectText.setVisible(showComputerPanel);
        this.contentLabelText.setVisible(showComputerPanel);
        this.contentText.setVisible(showComputerPanel);
        this.attachmentText.setVisible(showComputerPanel);
        this.powerupStatusText.setVisible(showComputerPanel);
        this.hintButton.setVisible(showComputerPanel);
        this.revealButton.setVisible(showComputerPanel);
        this.validButton.setVisible(showComputerPanel);
        this.phishingButton.setVisible(showComputerPanel);

        this.filesPanelBg.setVisible(showFilesPanel);
        for (const item of this.filesPanelChrome) {
            item.setVisible(showFilesPanel);
        }
        this.rulebookTitleText.setVisible(showFilesPanel);
        this.rulebookPageText.setVisible(showFilesPanel);
        this.rulebookBodyText.setVisible(showFilesPanel);
        this.previousRulePageButton.setVisible(showFilesPanel);
        this.nextRulePageButton.setVisible(showFilesPanel);
        this.rulebookCoreButton.setVisible(showFilesPanel);
        this.rulebookRosterButton.setVisible(showFilesPanel);
        this.rulebookTodayButton.setVisible(showFilesPanel);
        for (const button of this.companyRuleButtons) {
            button.setVisible(showFilesPanel);
        }

        if (showFilesPanel && this.rulebookPages.length > 0) {
            this.refreshRulebookControls(
                this.rulebookPages[this.rulebookPageIndex],
            );
        }
    }

    private finishDay() {
        this.clearArrivalTimers();
        this.clearInterrupt();
        this.shieldActive = false;

        const dayPay = this.dayPoints * 5;
        this.refreshTopBar();

        this.showTriageUI(false);

        if (this.day >= MAX_DAYS) {
            this.showEnding(
                "Contract Complete",
                `Final points: ${this.totalPoints}\nFinal money: $${this.money}`,
            );
            return;
        }

        this.showEndDayUI(true);

        this.endDayTitle.setText(`Day ${this.day} Complete`);
        this.endDaySummary.setText(
            `Day points: ${this.dayPoints}\n` +
                `Daily pay: $${dayPay}\n` +
                `Current money: $${this.money}`,
        );

        this.feedbackText
            .setText("Shift ended. Enter the shop to survive the night.")
            .setColor("#f4ecd8");
    }

    private enterShop() {
        this.scene.start("Shop", {
            day: this.day,
            money: this.money,
            totalPoints: this.totalPoints,
            daysWithoutRent: this.daysWithoutRent,
            hintCount: this.hintCount,
            revealCount: this.revealCount,
        });
    }

    private showEnding(title: string, message: string) {
        this.showTriageUI(false);
        this.showEndDayUI(false);
        this.showFinalUI(true);

        this.finalTitle.setText(title);
        this.finalSummary.setText(`${message}\n\nPress Restart to play again.`);
        this.feedbackText.setText("");
    }

    private refreshTopBar() {
        this.headerText.setText(
            `Email Inspector - Day ${this.day}/${MAX_DAYS}`,
        );
        this.scoreText.setText(`Points: ${this.totalPoints}`);
        this.moneyText.setText(`Money: $${this.money}`);
    }

    private refreshDeskTextures() {
        const hasNotification =
            this.hasUnreadNotification && !this.computerPanelOpen;

        if (hasNotification && this.computerHovered) {
            const key =
                this.textures.exists("desk-computer-notification-hover") ?
                    "desk-computer-notification-hover"
                : this.textures.exists("desk-computer-hover") ?
                    "desk-computer-hover"
                :   "desk-computer";
            this.computerObject.setTexture(key);
        } else if (hasNotification) {
            const key =
                this.textures.exists("desk-computer-notification") ?
                    "desk-computer-notification"
                :   "desk-computer";
            this.computerObject.setTexture(key);
        } else if (this.computerHovered) {
            const key =
                this.textures.exists("desk-computer-hover") ?
                    "desk-computer-hover"
                :   "desk-computer";
            this.computerObject.setTexture(key);
        } else {
            this.computerObject.setTexture("desk-computer");
        }

        this.filesObject.setTexture(
            this.filesHovered && this.textures.exists("desk-files-hover") ?
                "desk-files-hover"
            :   "desk-files",
        );
    }

    private showTriageUI(visible: boolean) {
        this.triageVisible = visible;

        this.deskBackgroundImage.setVisible(visible);
        this.computerObject.setVisible(visible);
        this.filesObject.setVisible(visible);
        this.computerZone.setActive(visible).setVisible(visible);
        this.filesZone.setActive(visible).setVisible(visible);
        this.feedbackBar.setVisible(visible);
        this.feedbackText.setVisible(visible);

        if (!visible) {
            this.computerPanelOpen = false;
            this.filesPanelOpen = false;
        }

        this.updatePanelVisibility();
        this.refreshDeskTextures();

        if (!visible) {
            this.clearInterrupt();
        }
    }

    private showEndDayUI(visible: boolean) {
        this.endScreenBg.setVisible(visible);
        this.endDayTitle.setVisible(visible);
        this.endDaySummary.setVisible(visible);
        this.toShopButton.setVisible(visible);
    }

    private showFinalUI(visible: boolean) {
        this.endScreenBg.setVisible(visible);
        this.finalTitle.setVisible(visible);
        this.finalSummary.setVisible(visible);
        this.restartButton.setVisible(visible);
        this.mainmenuButton.setVisible(visible);
        this.selectButton.setVisible(visible);
    }
}
