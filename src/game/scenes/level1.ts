import { Scene } from "phaser";

type EmailType = "valid" | "phishing" | "spam";
type InspectPart = "domain" | "subject" | "content";
type RuleId = 1 | 2 | 3;

interface LevelSceneData {
    day?: number;
    totalPoints?: number;
    money?: number;
    daysWithoutRent?: number;
    shopOutcome?: "continue" | "dead" | "win";
    outcomeMessage?: string;
}

interface EmailCase {
    from: string;
    domain: string;
    subject: string;
    body: string;
    type: EmailType;
    suspiciousParts: InspectPart[];
}

export class Level1 extends Scene {
    private readonly dayEmailCounts = [3, 4, 5];
    private readonly dayDurationTargetsMs = [60000, 75000, 90000];

    private readonly emailPool: EmailCase[] = [
        {
            from: "Registrar Office",
            domain: "campus.edu",
            subject: "Course registration opens Monday",
            body: "Registration for summer classes opens Monday at 8:00 AM. Use the official student portal.",
            type: "valid",
            suspiciousParts: [],
        },
        {
            from: "Payroll Desk",
            domain: "company.com",
            subject: "Timesheet approved for this week",
            body: "Your manager approved your hours. Payment will post on Friday.",
            type: "valid",
            suspiciousParts: [],
        },
        {
            from: "City Clinic",
            domain: "cityhealth.org",
            subject: "Appointment reminder",
            body: "Your appointment is tomorrow at 10:30 AM. Bring your ID and insurance card.",
            type: "valid",
            suspiciousParts: [],
        },
        {
            from: "Security Team",
            domain: "compaany-support.com",
            subject: "Urgent: verify password now",
            body: "We detected unusual login activity. Enter your password and SSN in this form or your account will be locked.",
            type: "phishing",
            suspiciousParts: ["domain"],
        },
        {
            from: "Benefits Update",
            domain: "campus-payroll.net",
            subject: "Action required to keep benefits",
            body: "Click this external link and confirm your bank details immediately to avoid cancellation.",
            type: "phishing",
            suspiciousParts: ["domain"],
        },
        {
            from: "Cloud Admin",
            domain: "secure-company.co",
            subject: "Mailbox almost full",
            body: "Download the attachment and sign in with your full credentials to prevent email deletion.",
            type: "phishing",
            suspiciousParts: ["content"],
        },
        {
            from: "Mega Deals Blast",
            domain: "zzpromo-lucky.biz",
            subject: "BUY NOW BUY NOW limited wow",
            body: "vouchers rocket pizza crypto socks random random random click click click",
            type: "spam",
            suspiciousParts: ["subject", "content"],
        },
        {
            from: "Ultra Offers",
            domain: "hotrandommail.xyz",
            subject: "1000% FREE winner combo",
            body: "banana cash moon shoes! get 19 gifts if you forward this to 20 friends today",
            type: "spam",
            suspiciousParts: ["subject", "content"],
        },
        {
            from: "Noise Mailer",
            domain: "bulk-bargain-mail.info",
            subject: "Crazy coins tea lamp deal",
            body: "coupon storm dragon chair reward reward reward weird text no context",
            type: "spam",
            suspiciousParts: ["subject", "content"],
        },
    ];

    private day = 1;
    private dayPoints = 0;
    private totalPoints = 0;
    private money = 0;
    private emailsProcessed = 0;
    private totalEmailsForDay = 0;
    private daysWithoutRent = 0;

    private incomingShopOutcome: LevelSceneData["shopOutcome"];
    private incomingOutcomeMessage = "";

    private inboxEmails: EmailCase[] = [];
    private pendingArrivalEmails: EmailCase[] = [];
    private selectedInboxIndex = -1;
    private arrivalTimers: Phaser.Time.TimerEvent[] = [];
    private dayEmailIntervalMs = 0;
    private interruptTimer: Phaser.Time.TimerEvent | null = null;
    private interruptActive = false;
    private interruptProgress = 0;
    private interruptTick: Phaser.Time.TimerEvent | null = null;

    private triageVisible = true;
    private computerPanelOpen = false;
    private filesPanelOpen = false;
    private hasUnreadNotification = false;
    private computerHovered = false;
    private filesHovered = false;

    private searchMode = false;
    private selectedRule: RuleId | null = null;
    private selectedPart: InspectPart | null = null;
    private inspectButtonHovered = false;

    private deskBackgroundImage!: Phaser.GameObjects.Image;
    private computerObject!: Phaser.GameObjects.Image;
    private filesObject!: Phaser.GameObjects.Image;
    private computerZone!: Phaser.GameObjects.Zone;
    private filesZone!: Phaser.GameObjects.Zone;

    private headerText!: Phaser.GameObjects.Text;
    private scoreText!: Phaser.GameObjects.Text;
    private moneyText!: Phaser.GameObjects.Text;
    private progressText!: Phaser.GameObjects.Text;
    private feedbackText!: Phaser.GameObjects.Text;

    private computerPanelBg!: Phaser.GameObjects.Rectangle;
    private filesPanelBg!: Phaser.GameObjects.Rectangle;

    private emailPanelTitle!: Phaser.GameObjects.Text;
    private fromText!: Phaser.GameObjects.Text;
    private domainText!: Phaser.GameObjects.Text;
    private subjectText!: Phaser.GameObjects.Text;
    private contentLabelText!: Phaser.GameObjects.Text;
    private contentText!: Phaser.GameObjects.Text;
    private emailSwitchText!: Phaser.GameObjects.Text;
    private previousEmailButton!: Phaser.GameObjects.Text;
    private nextEmailButton!: Phaser.GameObjects.Text;

    private rulebookTitleText!: Phaser.GameObjects.Text;
    private rulebookHelpText!: Phaser.GameObjects.Text;
    private rule1Text!: Phaser.GameObjects.Text;
    private rule2Text!: Phaser.GameObjects.Text;
    private rule3Text!: Phaser.GameObjects.Text;
    private inspectText!: Phaser.GameObjects.Text;

    private validButton!: Phaser.GameObjects.Text;
    private phishingButton!: Phaser.GameObjects.Text;
    private spamButton!: Phaser.GameObjects.Text;
    private toggleSearchButton!: Phaser.GameObjects.Text;

    private endDayTitle!: Phaser.GameObjects.Text;
    private endDaySummary!: Phaser.GameObjects.Text;
    private toShopButton!: Phaser.GameObjects.Text;

    private finalTitle!: Phaser.GameObjects.Text;
    private finalSummary!: Phaser.GameObjects.Text;
    private restartButton!: Phaser.GameObjects.Text;

    private dudeSprite!: Phaser.GameObjects.Image;
    private interruptBarBg!: Phaser.GameObjects.Rectangle;
    private interruptBarFill!: Phaser.GameObjects.Rectangle;
    private interruptText!: Phaser.GameObjects.Text;

    constructor() {
        super("Level1");
    }

    init(data: LevelSceneData) {
        this.day = data.day ?? 1;
        this.totalPoints = data.totalPoints ?? 0;
        this.money = data.money ?? 0;
        this.daysWithoutRent = data.daysWithoutRent ?? 0;
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
            this.showEnding("You Survived 3 Days", this.incomingOutcomeMessage);
            return;
        }

        this.startDay(this.day);
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
            this.refreshComputerTexture();
        });
        this.computerZone.on("pointerout", () => {
            this.computerHovered = false;
            this.refreshComputerTexture();
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
            this.refreshComputerTexture();
        });

        this.filesZone.on("pointerover", () => {
            if (!this.triageVisible) {
                return;
            }

            this.filesHovered = true;
            this.refreshComputerTexture();
        });
        this.filesZone.on("pointerout", () => {
            this.filesHovered = false;
            this.refreshComputerTexture();
        });
        this.filesZone.on("pointerdown", () => {
            if (!this.triageVisible || this.interruptActive) {
                return;
            }

            this.filesPanelOpen = !this.filesPanelOpen;
            this.updatePanelVisibility();
        });

        this.refreshComputerTexture();
    }

    private refreshComputerTexture() {
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

    private buildUI() {
        this.add
            .rectangle(512, 54, 980, 84, 0xd6dde7, 0.95)
            .setStrokeStyle(2, 0x7f8b9c)
            .setDepth(10);

        this.headerText = this.add
            .text(32, 17, "", {
                fontSize: "30px",
                color: "#221f1a",
                fontStyle: "bold",
            })
            .setDepth(11);

        this.scoreText = this.add
            .text(32, 57, "", {
                fontSize: "22px",
                color: "#000000",
            })
            .setStyle({ backgroundColor: "#d6dce4" })
            .setDepth(11);

        this.moneyText = this.add
            .text(250, 57, "", {
                fontSize: "22px",
                color: "#2d5d31",
            })
            .setStyle({ backgroundColor: "transparent" })
            .setDepth(11);

        this.progressText = this.add
            .text(460, 59, "", {
                fontSize: "20px",
                color: "#4b5563",
            })
            .setStyle({ backgroundColor: "transparent" })
            .setDepth(11);

        this.feedbackText = this.add
            .text(32, 100, "", {
                fontSize: "24px",
                color: "#ffffff",
                wordWrap: { width: 960 },
            })
            .setDepth(11);

        this.computerPanelBg = this.add
            .rectangle(770, 418, 470, 540, 0xe3e9f1, 0.93)
            .setStrokeStyle(2, 0x8896a9)
            .setDepth(15)
            .setVisible(false);

        this.filesPanelBg = this.add
            .rectangle(255, 418, 410, 540, 0xe3e9f1, 0.93)
            .setStrokeStyle(2, 0x8896a9)
            .setDepth(15)
            .setVisible(false);

        this.emailPanelTitle = this.add
            .text(560, 150, "Email Monitor", {
                fontSize: "24px",
                color: "#2a261f",
                fontStyle: "bold",
            })
            .setDepth(16)
            .setVisible(false);

        this.emailSwitchText = this.add
            .text(560, 186, "", {
                fontSize: "16px",
                color: "#4c4338",
            })
            .setDepth(16)
            .setVisible(false);

        this.previousEmailButton = this.createButton(
            790,
            188,
            "< Prev",
            "#6c7078",
            () => {
                this.showPreviousEmail();
            },
            90,
        )
            .setDepth(16)
            .setVisible(false);

        this.nextEmailButton = this.createButton(
            900,
            188,
            "Next >",
            "#6c7078",
            () => {
                this.showNextEmail();
            },
            90,
        )
            .setDepth(16)
            .setVisible(false);

        this.fromText = this.add
            .text(560, 230, "", {
                fontSize: "17px",
                color: "#22201a",
                wordWrap: { width: 430 },
                lineSpacing: 6,
            })
            .setDepth(16)
            .setVisible(false);

        this.domainText = this.add
            .text(560, 270, "", {
                fontSize: "17px",
                color: "#22201a",
                wordWrap: { width: 430 },
            })
            .setDepth(16)
            .setVisible(false)
            .setInteractive({ useHandCursor: true });
        this.domainText.on("pointerdown", () => {
            this.selectEmailPart("domain");
        });

        this.subjectText = this.add
            .text(560, 312, "", {
                fontSize: "17px",
                color: "#22201a",
                wordWrap: { width: 430 },
                lineSpacing: 4,
            })
            .setDepth(16)
            .setVisible(false)
            .setInteractive({ useHandCursor: true });
        this.subjectText.on("pointerdown", () => {
            this.selectEmailPart("subject");
        });

        this.contentLabelText = this.add
            .text(560, 372, "Content:", {
                fontSize: "17px",
                color: "#22201a",
            })
            .setDepth(16)
            .setVisible(false)
            .setInteractive({ useHandCursor: true });
        this.contentLabelText.on("pointerdown", () => {
            this.selectEmailPart("content");
        });

        this.contentText = this.add
            .text(560, 402, "", {
                fontSize: "17px",
                color: "#22201a",
                wordWrap: { width: 430 },
                lineSpacing: 6,
            })
            .setDepth(16)
            .setVisible(false)
            .setInteractive({ useHandCursor: true });
        this.contentText.on("pointerdown", () => {
            this.selectEmailPart("content");
        });

        this.validButton = this.createButton(
            615,
            690,
            "Valid",
            "#4b6a4f",
            () => {
                this.classifySelectedEmail("valid");
            },
            120,
        )
            .setDepth(16)
            .setVisible(false);

        this.spamButton = this.createButton(
            770,
            690,
            "Spam",
            "#7f7244",
            () => {
                this.classifySelectedEmail("spam");
            },
            120,
        )
            .setDepth(16)
            .setVisible(false);

        this.phishingButton = this.createButton(
            925,
            690,
            "Phishing",
            "#6a4444",
            () => {
                this.classifySelectedEmail("phishing");
            },
            120,
        )
            .setDepth(16)
            .setVisible(false);

        this.rulebookTitleText = this.add
            .text(70, 150, "Rulebook", {
                fontSize: "24px",
                color: "#2a261f",
                fontStyle: "bold",
            })
            .setDepth(16)
            .setVisible(false);

        this.rulebookHelpText = this.add
            .text(70, 186, "", {
                fontSize: "15px",
                color: "#41392d",
                wordWrap: { width: 370 },
                lineSpacing: 2,
            })
            .setDepth(16)
            .setVisible(false);

        this.rule1Text = this.add
            .text(70, 318, "", {
                fontSize: "16px",
                color: "#22201a",
                wordWrap: { width: 370 },
            })
            .setDepth(16)
            .setVisible(false)
            .setInteractive({ useHandCursor: true });
        this.rule1Text.on("pointerdown", () => {
            this.selectRule(1);
        });

        this.rule2Text = this.add
            .text(70, 357, "", {
                fontSize: "16px",
                color: "#22201a",
                wordWrap: { width: 370 },
            })
            .setDepth(16)
            .setVisible(false)
            .setInteractive({ useHandCursor: true });
        this.rule2Text.on("pointerdown", () => {
            this.selectRule(2);
        });

        this.rule3Text = this.add
            .text(70, 396, "", {
                fontSize: "16px",
                color: "#22201a",
                wordWrap: { width: 370 },
            })
            .setDepth(16)
            .setVisible(false)
            .setInteractive({ useHandCursor: true });
        this.rule3Text.on("pointerdown", () => {
            this.selectRule(3);
        });

        this.toggleSearchButton = this.createButton(
            255,
            464,
            "Inspect Tool",
            "#71757a",
            () => {
                this.toggleSearchMode();
            },
            320,
        )
            .setDepth(16)
            .setVisible(false);
        this.toggleSearchButton.on("pointerover", () => {
            this.inspectButtonHovered = true;
            this.updateSearchButtonStyles();
        });
        this.toggleSearchButton.on("pointerout", () => {
            this.inspectButtonHovered = false;
            this.updateSearchButtonStyles();
        });

        this.inspectText = this.add
            .text(70, 516, "", {
                fontSize: "15px",
                color: "#22201a",
                wordWrap: { width: 370 },
                lineSpacing: 5,
            })
            .setDepth(16)
            .setVisible(false);

        this.endDayTitle = this.add
            .text(512, 260, "", {
                fontSize: "42px",
                color: "#ffffff",
                fontStyle: "bold",
            })
            .setOrigin(0.5)
            .setDepth(20)
            .setVisible(false);

        this.endDaySummary = this.add
            .text(512, 350, "", {
                fontSize: "26px",
                color: "#ffffff",
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
            "#245e2b",
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
                color: "#ffffff",
                fontStyle: "bold",
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(20)
            .setVisible(false);

        this.finalSummary = this.add
            .text(512, 360, "", {
                fontSize: "28px",
                color: "#ffffff",
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
            "#2c4a77",
            () => {
                this.scene.restart();
            },
            240,
        )
            .setDepth(20)
            .setVisible(false);

        this.rulebookHelpText.setText(
            "Open the left files panel to inspect rules.\n" +
                "Open the right computer panel to inspect emails.\n\n" +
                "Allowed domains:\n" +
                "campus.edu, company.com, cityhealth.org",
        );

        this.rule1Text.setText("Rule 1: Domain must be approved.");
        this.rule2Text.setText("Rule 2: Subject should look normal.");
        this.rule3Text.setText("Rule 3: Content cannot ask for credentials.");

        this.inspectText.setText(
            "Inspect Panel\n\nToggle Inspect Tool, then select a rule and a matching email part.",
        );
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
                color: "#ffffff",
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
            this.emailSwitchText,
            this.previousEmailButton,
            this.nextEmailButton,
            this.rulebookTitleText,
            this.rulebookHelpText,
            this.rule1Text,
            this.rule2Text,
            this.rule3Text,
            this.inspectText,
            this.validButton,
            this.spamButton,
            this.phishingButton,
            this.toggleSearchButton,
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

        this.day = day;
        this.dayPoints = 0;
        this.emailsProcessed = 0;
        this.inboxEmails = [];
        this.pendingArrivalEmails = [];
        this.selectedInboxIndex = -1;
        this.hasUnreadNotification = false;
        this.computerPanelOpen = false;
        this.filesPanelOpen = false;

        const amount = this.dayEmailCounts[this.day - 1];
        const shuffled = Phaser.Utils.Array.Shuffle([...this.emailPool]);
        this.pendingArrivalEmails = shuffled.slice(0, amount);
        this.totalEmailsForDay = amount;

        const targetDuration = this.dayDurationTargetsMs[this.day - 1] ?? 90000;
        this.dayEmailIntervalMs = Math.max(2500, targetDuration / amount);

        this.showTriageUI(true);
        this.showEndDayUI(false);
        this.showFinalUI(false);
        this.updatePanelVisibility();

        this.feedbackText
            .setText(
                `Day ${this.day} begins. Emails now arrive randomly. Open Computer to process and Files to inspect rules.`,
            )
            .setColor("#000000");

        this.resetSearchState();
        this.refreshEmailPanel();
        this.refreshTopBar();
        this.refreshProgressText();

        this.scheduleNextEmailArrival();
        this.scheduleInterruptForDay();
    }

    private scheduleInterruptForDay() {
        const targetDuration = this.dayDurationTargetsMs[this.day - 1] ?? 90000;
        if (targetDuration < 8000) {
            return;
        }

        const delay = Phaser.Math.Between(5000, targetDuration - 3000);
        this.interruptTimer = this.time.delayedCall(delay, () => {
            this.startInterrupt();
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
                    // Keep it at zero and let player build it back up.
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
        if (this.interruptTimer) {
            this.interruptTimer.remove(false);
            this.interruptTimer = null;
        }
        if (this.interruptTick) {
            this.interruptTick.remove(false);
            this.interruptTick = null;
        }
        this.interruptActive = false;
        if (this.dudeSprite) {
            this.dudeSprite.setVisible(false);
            this.interruptBarBg.setVisible(false);
            this.interruptBarFill.setVisible(false);
            this.interruptText.setVisible(false);
        }
    }

    private scheduleNextEmailArrival() {
        if (this.pendingArrivalEmails.length === 0 || !this.triageVisible) {
            return;
        }

        const baseDelay = this.dayEmailIntervalMs;
        const minDelay = Math.max(1200, Math.floor(baseDelay * 0.85));
        const maxDelay = Math.max(minDelay + 200, Math.floor(baseDelay * 1.15));
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

            this.feedbackText
                .setText(
                    `New email arrived. Inbox: ${this.inboxEmails.length}. Click the computer to review.`,
                )
                .setColor("#b00020");

            this.refreshComputerTexture();
            this.refreshProgressText();
            if (this.computerPanelOpen) {
                this.refreshEmailPanel();
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
            this.applyEmailPartStyles(null);
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
        this.applyEmailPartStyles(current);
    }

    private applyEmailPartStyles(current: EmailCase | null) {
        const suspicious = current?.suspiciousParts ?? [];
        const isSuspicious = (part: InspectPart) => suspicious.includes(part);

        this.domainText.setText(
            current ?
                `Domain: ${current.domain}${isSuspicious("domain") ? " !!" : ""}`
            :   "Domain: --",
        );
        this.subjectText.setText(
            current ?
                `Subject: ${current.subject}${isSuspicious("subject") ? " !!" : ""}`
            :   "Subject: --",
        );
        this.contentText.setText(
            current ?
                `${isSuspicious("content") ? "!! " : ""}${current.body}`
            :   "No email selected. New emails will arrive during the day.",
        );

        // Keep email text dark by default unless Inspect selection styling changes it.
        this.domainText.setColor("#1f2430");
        this.subjectText.setColor("#1f2430");
        this.contentLabelText.setColor("#1f2430");
        this.contentText.setColor("#1f2430");
    }

    private showPreviousEmail() {
        if (this.inboxEmails.length <= 1) {
            return;
        }

        this.selectedInboxIndex =
            (this.selectedInboxIndex - 1 + this.inboxEmails.length) %
            this.inboxEmails.length;

        this.resetSearchState();
        this.refreshEmailPanel();
    }

    private showNextEmail() {
        if (this.inboxEmails.length <= 1) {
            return;
        }

        this.selectedInboxIndex =
            (this.selectedInboxIndex + 1) % this.inboxEmails.length;

        this.resetSearchState();
        this.refreshEmailPanel();
    }

    private classifySelectedEmail(choice: EmailType) {
        if (this.inboxEmails.length === 0 || this.selectedInboxIndex < 0) {
            this.feedbackText
                .setText(
                    "No email selected. Wait for arrivals or open the computer panel.",
                )
                .setColor("#ffb1b1");
            return;
        }

        const currentEmail = this.inboxEmails[this.selectedInboxIndex];

        if (choice === currentEmail.type) {
            this.totalPoints += 1;
            this.dayPoints += 1;
            this.feedbackText
                .setText("Correct classification: +1 point.")
                .setColor("#9effa0");
        } else {
            this.totalPoints -= 1;
            this.dayPoints -= 1;
            this.feedbackText
                .setText(
                    `Incorrect. This email was ${currentEmail.type}. -1 point.`,
                )
                .setColor("#ff9f9f");
        }

        this.inboxEmails.splice(this.selectedInboxIndex, 1);
        this.emailsProcessed += 1;

        if (this.inboxEmails.length === 0) {
            this.selectedInboxIndex = -1;
        } else if (this.selectedInboxIndex >= this.inboxEmails.length) {
            this.selectedInboxIndex = this.inboxEmails.length - 1;
        }

        this.resetSearchState();
        this.refreshTopBar();
        this.refreshProgressText();
        this.refreshEmailPanel();

        if (this.emailsProcessed >= this.totalEmailsForDay) {
            this.finishDay();
        }
    }

    private toggleSearchMode() {
        this.searchMode = !this.searchMode;

        if (!this.searchMode) {
            this.selectedRule = null;
            this.selectedPart = null;
            this.inspectText.setText(
                "Inspect Panel\n\nInspect Tool OFF. Toggle it ON to inspect.",
            );
        } else {
            this.inspectText.setText(
                "Inspect Panel\n\nInspect Tool ON. Select a rule and a related email part.",
            );
        }

        this.updateSearchButtonStyles();
    }

    private selectRule(rule: RuleId) {
        if (!this.searchMode) {
            this.inspectText.setText(
                "Inspect Panel\n\nEnable Inspect Tool first.",
            );
            return;
        }

        this.selectedRule = rule;
        this.updateSearchButtonStyles();
        this.evaluateSearchSelection();
    }

    private selectEmailPart(part: InspectPart) {
        if (!this.searchMode) {
            this.inspectText.setText(
                "Inspect Panel\n\nEnable Inspect Tool first.",
            );
            return;
        }

        if (this.inboxEmails.length === 0 || this.selectedInboxIndex < 0) {
            this.inspectText.setText(
                "Inspect Panel\n\nNo email selected. Pick an email in the computer panel.",
            );
            return;
        }

        this.selectedPart = part;
        this.updateSearchButtonStyles();
        this.evaluateSearchSelection();
    }

    private evaluateSearchSelection() {
        if (!this.selectedRule || !this.selectedPart) {
            return;
        }

        if (this.inboxEmails.length === 0 || this.selectedInboxIndex < 0) {
            return;
        }

        const currentEmail = this.inboxEmails[this.selectedInboxIndex];
        const expectedPartByRule: Record<RuleId, InspectPart> = {
            1: "domain",
            2: "subject",
            3: "content",
        };

        const selectedMatchesRule =
            expectedPartByRule[this.selectedRule] === this.selectedPart;

        if (!selectedMatchesRule) {
            this.inspectText
                .setColor("#ffd27f")
                .setText(
                    "Inspect Result\n\nRule/email mismatch.\nSelect the matching rule and email part.",
                );
            return;
        }

        const suspiciousParts = currentEmail.suspiciousParts;
        const selectedIsSuspicious = suspiciousParts.includes(
            this.selectedPart,
        );

        if (selectedMatchesRule && selectedIsSuspicious) {
            this.inspectText
                .setColor("#b00020")
                .setText(
                    `Inspect Result\n\nDiscrepancy detected.\nMatched suspicious ${this.selectedPart}.`,
                );
            return;
        }

        this.inspectText
            .setColor("#9effa0")
            .setText(
                "Inspect Result\n\nExpected activity.\nNo discrepancy detected.",
            );
    }

    private updateSearchButtonStyles() {
        const inspectButtonColor =
            this.inspectButtonHovered ? "#657184"
            : this.searchMode ? "#53657d"
            : "#71757a";

        this.toggleSearchButton.setStyle({
            backgroundColor: inspectButtonColor,
        });

        const expectedPartByRule: Record<RuleId, InspectPart> = {
            1: "domain",
            2: "subject",
            3: "content",
        };

        const connectionValid =
            this.selectedRule !== null &&
            this.selectedPart !== null &&
            expectedPartByRule[this.selectedRule] === this.selectedPart;

        const selectedColor = connectionValid ? "#1f4f8f" : "#8b5f00";
        const normalTextColor = "#1f2430";

        this.rule1Text.setStyle({
            fontStyle: this.selectedRule === 1 ? "bold" : "normal",
            color: this.selectedRule === 1 ? selectedColor : normalTextColor,
        });
        this.rule2Text.setStyle({
            fontStyle: this.selectedRule === 2 ? "bold" : "normal",
            color: this.selectedRule === 2 ? selectedColor : normalTextColor,
        });
        this.rule3Text.setStyle({
            fontStyle: this.selectedRule === 3 ? "bold" : "normal",
            color: this.selectedRule === 3 ? selectedColor : normalTextColor,
        });

        this.domainText.setStyle({
            fontStyle: this.selectedPart === "domain" ? "bold" : "normal",
            color:
                this.selectedPart === "domain" ?
                    selectedColor
                :   normalTextColor,
        });
        this.subjectText.setStyle({
            fontStyle: this.selectedPart === "subject" ? "bold" : "normal",
            color:
                this.selectedPart === "subject" ?
                    selectedColor
                :   normalTextColor,
        });

        const contentSelectedStyle = {
            fontStyle: this.selectedPart === "content" ? "bold" : "normal",
            color:
                this.selectedPart === "content" ?
                    selectedColor
                :   normalTextColor,
        };
        this.contentLabelText.setStyle(contentSelectedStyle);
        this.contentText.setStyle(contentSelectedStyle);
    }

    private resetSearchState() {
        this.searchMode = false;
        this.selectedRule = null;
        this.selectedPart = null;
        this.inspectButtonHovered = false;

        this.inspectText.setText(
            "Inspect Panel\n\nToggle Inspect Tool, then select a rule and a matching email part.",
        );
        this.updateSearchButtonStyles();
    }

    private refreshProgressText() {
        this.progressText.setText(
            `Processed ${this.emailsProcessed}/${this.totalEmailsForDay} | Inbox ${this.inboxEmails.length}`,
        );
    }

    private updatePanelVisibility() {
        const showComputerPanel = this.triageVisible && this.computerPanelOpen;
        const showFilesPanel = this.triageVisible && this.filesPanelOpen;

        this.computerPanelBg.setVisible(showComputerPanel);
        this.emailPanelTitle.setVisible(showComputerPanel);
        this.emailSwitchText.setVisible(showComputerPanel);
        this.previousEmailButton.setVisible(showComputerPanel);
        this.nextEmailButton.setVisible(showComputerPanel);
        this.fromText.setVisible(showComputerPanel);
        this.domainText.setVisible(showComputerPanel);
        this.subjectText.setVisible(showComputerPanel);
        this.contentLabelText.setVisible(showComputerPanel);
        this.contentText.setVisible(showComputerPanel);
        this.validButton.setVisible(showComputerPanel);
        this.spamButton.setVisible(showComputerPanel);
        this.phishingButton.setVisible(showComputerPanel);

        this.filesPanelBg.setVisible(showFilesPanel);
        this.rulebookTitleText.setVisible(showFilesPanel);
        this.rulebookHelpText.setVisible(showFilesPanel);
        this.rule1Text.setVisible(showFilesPanel);
        this.rule2Text.setVisible(showFilesPanel);
        this.rule3Text.setVisible(showFilesPanel);
        this.toggleSearchButton.setVisible(showFilesPanel);
        this.inspectText.setVisible(showFilesPanel);
    }

    private finishDay() {
        this.clearArrivalTimers();
        this.clearInterrupt();

        const dayPay = this.dayPoints * 5;
        this.money += dayPay;
        this.refreshTopBar();

        this.showTriageUI(false);
        this.showEndDayUI(true);

        this.endDayTitle.setText(`Day ${this.day} Complete`);
        this.endDaySummary.setText(
            `Day points: ${this.dayPoints}\n` +
                `Daily pay: $${dayPay}\n` +
                `Current money: $${this.money}`,
        );

        this.feedbackText
            .setText("Shift ended. Enter the shop to survive the night.")
            .setColor("#ffffff");
    }

    private enterShop() {
        this.scene.start("Shop", {
            day: this.day,
            money: this.money,
            totalPoints: this.totalPoints,
            daysWithoutRent: this.daysWithoutRent,
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
        this.headerText.setText(`Email Inspector - Day ${this.day}/3`);
        this.scoreText.setText(`Points: ${this.totalPoints}`);
        this.moneyText.setText(`Money: $${this.money}`);
    }

    private showTriageUI(visible: boolean) {
        this.triageVisible = visible;

        this.deskBackgroundImage.setVisible(visible);
        this.computerObject.setVisible(visible);
        this.filesObject.setVisible(visible);
        this.computerZone.setActive(visible).setVisible(visible);
        this.filesZone.setActive(visible).setVisible(visible);

        if (!visible) {
            this.computerPanelOpen = false;
            this.filesPanelOpen = false;
        }

        this.updatePanelVisibility();
        this.refreshComputerTexture();

        if (!visible) {
            this.clearInterrupt();
        }
    }

    private showEndDayUI(visible: boolean) {
        this.endDayTitle.setVisible(visible);
        this.endDaySummary.setVisible(visible);
        this.toShopButton.setVisible(visible);
    }

    private showFinalUI(visible: boolean) {
        this.finalTitle.setVisible(visible);
        this.finalSummary.setVisible(visible);
        this.restartButton.setVisible(visible);
    }
}
