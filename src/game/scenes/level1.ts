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
}

export class Level1 extends Scene {
    private readonly allowedDomains = [
        "campus.edu",
        "company.com",
        "cityhealth.org",
    ];

    private readonly dayEmailCounts = [3, 4, 5];

    private readonly emailPool: EmailCase[] = [
        {
            from: "Registrar Office",
            domain: "campus.edu",
            subject: "Course registration opens Monday",
            body: "Registration for summer classes opens Monday at 8:00 AM. Use the official student portal.",
            type: "valid",
        },
        {
            from: "Payroll Desk",
            domain: "company.com",
            subject: "Timesheet approved for this week",
            body: "Your manager approved your hours. Payment will post on Friday.",
            type: "valid",
        },
        {
            from: "City Clinic",
            domain: "cityhealth.org",
            subject: "Appointment reminder",
            body: "Your appointment is tomorrow at 10:30 AM. Bring your ID and insurance card.",
            type: "valid",
        },
        {
            from: "Security Team",
            domain: "compaany-support.com",
            subject: "Urgent: verify password now",
            body: "We detected unusual login activity. Enter your password and SSN in this form or your account will be locked.",
            type: "phishing",
        },
        {
            from: "Benefits Update",
            domain: "campus-payroll.net",
            subject: "Action required to keep benefits",
            body: "Click this external link and confirm your bank details immediately to avoid cancellation.",
            type: "phishing",
        },
        {
            from: "Cloud Admin",
            domain: "secure-company.co",
            subject: "Mailbox almost full",
            body: "Download the attachment and sign in with your full credentials to prevent email deletion.",
            type: "phishing",
        },
        {
            from: "Mega Deals Blast",
            domain: "zzpromo-lucky.biz",
            subject: "BUY NOW BUY NOW limited wow",
            body: "vouchers rocket pizza crypto socks random random random click click click",
            type: "spam",
        },
        {
            from: "Ultra Offers",
            domain: "hotrandommail.xyz",
            subject: "1000% FREE winner combo",
            body: "banana cash moon shoes! get 19 gifts if you forward this to 20 friends today",
            type: "spam",
        },
        {
            from: "Noise Mailer",
            domain: "bulk-bargain-mail.info",
            subject: "Crazy coins tea lamp deal",
            body: "coupon storm dragon chair reward reward reward weird text no context",
            type: "spam",
        },
    ];

    private day = 1;
    private dayPoints = 0;
    private totalPoints = 0;
    private money = 0;
    private emailsProcessed = 0;
    private daysWithoutRent = 0;
    private currentEmail!: EmailCase;
    private activeDayEmails: EmailCase[] = [];
    private incomingShopOutcome: LevelSceneData["shopOutcome"];
    private incomingOutcomeMessage = "";
    private searchMode = false;
    private selectedRule: RuleId | null = null;
    private selectedPart: InspectPart | null = null;

    private headerText!: Phaser.GameObjects.Text;
    private scoreText!: Phaser.GameObjects.Text;
    private moneyText!: Phaser.GameObjects.Text;
    private progressText!: Phaser.GameObjects.Text;
    private feedbackText!: Phaser.GameObjects.Text;

    private emailPanelTitle!: Phaser.GameObjects.Text;
    private fromText!: Phaser.GameObjects.Text;
    private domainText!: Phaser.GameObjects.Text;
    private subjectText!: Phaser.GameObjects.Text;
    private contentLabelText!: Phaser.GameObjects.Text;
    private contentText!: Phaser.GameObjects.Text;
    private inspectText!: Phaser.GameObjects.Text;
    private rulebookTitleText!: Phaser.GameObjects.Text;
    private rulebookHelpText!: Phaser.GameObjects.Text;
    private rule1Text!: Phaser.GameObjects.Text;
    private rule2Text!: Phaser.GameObjects.Text;
    private rule3Text!: Phaser.GameObjects.Text;

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
        this.cameras.main.setBackgroundColor(0x1b1f2a);
        this.buildUI();
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

    private buildUI() {
        this.add
            .rectangle(512, 60, 980, 90, 0x101827)
            .setStrokeStyle(2, 0x365a8c);

        this.headerText = this.add.text(32, 20, "", {
            fontSize: "32px",
            color: "#ffffff",
            fontStyle: "bold",
        });

        this.scoreText = this.add.text(32, 62, "", {
            fontSize: "26px",
            color: "#ffe066",
        });

        this.moneyText = this.add.text(250, 62, "", {
            fontSize: "26px",
            color: "#9effa0",
        });

        this.progressText = this.add.text(460, 66, "", {
            fontSize: "22px",
            color: "#9cc3ff",
        });

        this.feedbackText = this.add.text(32, 108, "", {
            fontSize: "18px",
            color: "#ffffff",
            wordWrap: { width: 960 },
        });

        this.add
            .rectangle(315, 420, 570, 560, 0x0f1520)
            .setStrokeStyle(2, 0x365a8c);
        this.add
            .rectangle(815, 290, 370, 300, 0x0f1520)
            .setStrokeStyle(2, 0x365a8c);
        this.add
            .rectangle(815, 610, 370, 210, 0x0f1520)
            .setStrokeStyle(2, 0x365a8c);

        this.emailPanelTitle = this.add.text(45, 150, "Email Monitor", {
            fontSize: "26px",
            color: "#ffffff",
            fontStyle: "bold",
        });

        this.fromText = this.add.text(45, 190, "", {
            fontSize: "18px",
            color: "#ffffff",
            wordWrap: { width: 540 },
            lineSpacing: 6,
        });

        this.domainText = this.add
            .text(45, 234, "", {
                fontSize: "18px",
                color: "#ffffff",
                wordWrap: { width: 540 },
            })
            .setInteractive({ useHandCursor: true });
        this.domainText.on("pointerdown", () => {
            this.selectEmailPart("domain");
        });

        this.subjectText = this.add
            .text(45, 282, "", {
                fontSize: "18px",
                color: "#ffffff",
                wordWrap: { width: 540 },
                lineSpacing: 4,
            })
            .setInteractive({ useHandCursor: true });
        this.subjectText.on("pointerdown", () => {
            this.selectEmailPart("subject");
        });

        this.contentLabelText = this.add
            .text(45, 350, "Content:", {
                fontSize: "18px",
                color: "#ffffff",
            })
            .setInteractive({ useHandCursor: true });
        this.contentLabelText.on("pointerdown", () => {
            this.selectEmailPart("content");
        });

        this.contentText = this.add
            .text(45, 382, "", {
                fontSize: "18px",
                color: "#ffffff",
                wordWrap: { width: 540 },
                lineSpacing: 6,
            })
            .setInteractive({ useHandCursor: true });
        this.contentText.on("pointerdown", () => {
            this.selectEmailPart("content");
        });

        this.rulebookTitleText = this.add.text(
            640,
            150,
            "Rulebook (Valid Email Rules)",
            {
                fontSize: "16px",
                color: "#d6e8ff",
                fontStyle: "bold",
            },
        );

        this.rulebookHelpText = this.add.text(640, 186, "", {
            fontSize: "15px",
            color: "#d6e8ff",
            wordWrap: { width: 325 },
            lineSpacing: 2,
        });

        this.rule1Text = this.add
            .text(640, 334, "", {
                fontSize: "15px",
                color: "#ffffff",
                wordWrap: { width: 325 },
            })
            .setInteractive({ useHandCursor: true });
        this.rule1Text.on("pointerdown", () => {
            this.selectRule(1);
        });

        this.rule2Text = this.add
            .text(640, 372, "", {
                fontSize: "15px",
                color: "#ffffff",
                wordWrap: { width: 325 },
            })
            .setInteractive({ useHandCursor: true });
        this.rule2Text.on("pointerdown", () => {
            this.selectRule(2);
        });

        this.rule3Text = this.add
            .text(640, 410, "", {
                fontSize: "15px",
                color: "#ffffff",
                wordWrap: { width: 325 },
            })
            .setInteractive({ useHandCursor: true });
        this.rule3Text.on("pointerdown", () => {
            this.selectRule(3);
        });

        this.inspectText = this.add.text(640, 570, "", {
            fontSize: "15px",
            color: "#ffffff",
            wordWrap: { width: 340 },
            lineSpacing: 4,
        });

        this.validButton = this.createButton(
            130,
            640,
            "Valid",
            "#1f7a1f",
            () => {
                this.classifyEmail("valid");
            },
            180,
        );

        this.spamButton = this.createButton(
            315,
            640,
            "Spam",
            "#8a7a1f",
            () => {
                this.classifyEmail("spam");
            },
            180,
        );

        this.phishingButton = this.createButton(
            500,
            640,
            "Phishing",
            "#7a1f1f",
            () => {
                this.classifyEmail("phishing");
            },
            180,
        );

        this.toggleSearchButton = this.createButton(
            815,
            468,
            "Search Mode: OFF",
            "#4f4f4f",
            () => {
                this.toggleSearchMode();
            },
            320,
        );

        this.endDayTitle = this.add
            .text(512, 260, "", {
                fontSize: "42px",
                color: "#ffffff",
                fontStyle: "bold",
            })
            .setOrigin(0.5)
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
            .setVisible(false);

        this.toShopButton = this.createButton(
            512,
            460,
            "Enter Shop",
            "#245e2b",
            () => {
                this.enterShop();
            },
        ).setVisible(false);

        this.finalTitle = this.add
            .text(512, 250, "", {
                fontSize: "48px",
                color: "#ffffff",
                fontStyle: "bold",
                align: "center",
            })
            .setOrigin(0.5)
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
            .setVisible(false);

        this.restartButton = this.createButton(
            512,
            500,
            "Restart Game",
            "#2c4a77",
            () => {
                this.scene.restart();
            },
        ).setVisible(false);

        this.rulebookHelpText.setText(
            "Search mode: click a rule, then click\n" +
                "the matching email part.\n\n" +
                "Allowed: campus.edu, company.com,\n" +
                "cityhealth.org",
        );

        this.rule1Text.setText("Rule 1: Domain must be approved.");
        this.rule2Text.setText("Rule 2: Subject should look normal.");
        this.rule3Text.setText("Rule 3: Content cannot ask for credentials.");
        this.layoutRulebookEntries();

        this.inspectText.setText(
            "Inspect Panel\n\nToggle Search Mode, then select a rule and an email part.",
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
        const button = this.add
            .text(x, y, label, {
                fontSize: "16px",
                color: "#ffffff",
                backgroundColor,
                fixedWidth,
                align: "center",
                padding: { left: 8, right: 8, top: 10, bottom: 10 },
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        button.on("pointerdown", onClick);
        return button;
    }

    private startDay(day: number) {
        this.day = day;
        this.dayPoints = 0;
        this.emailsProcessed = 0;

        const amount = this.dayEmailCounts[this.day - 1];
        const shuffled = Phaser.Utils.Array.Shuffle([...this.emailPool]);
        this.activeDayEmails = shuffled.slice(0, amount);

        this.showTriageUI(true);
        this.showEndDayUI(false);
        this.showFinalUI(false);

        this.feedbackText.setText(
            `Day ${this.day} begins. Classify ${amount} emails correctly to maximize your pay.`,
        );
        this.resetSearchState();
        this.loadNextEmail();
        this.refreshTopBar();
    }

    private loadNextEmail() {
        this.currentEmail = this.activeDayEmails[this.emailsProcessed];
        this.fromText.setText(`From: ${this.currentEmail.from}`);
        this.domainText.setText(`Domain: ${this.currentEmail.domain}`);
        this.subjectText.setText(`Subject: ${this.currentEmail.subject}`);
        this.contentText.setText(this.currentEmail.body);
        this.inspectText.setText(
            "Inspect Panel\n\nToggle Search Mode, then select a rule and an email part.",
        );
        this.selectedRule = null;
        this.selectedPart = null;
        this.updateSearchButtonStyles();
        this.progressText.setText(
            `Email ${this.emailsProcessed + 1}/${this.activeDayEmails.length}`,
        );
    }

    private classifyEmail(choice: EmailType) {
        if (choice === this.currentEmail.type) {
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
                    `Incorrect. This email was ${this.currentEmail.type}. -1 point.`,
                )
                .setColor("#ff9f9f");
        }

        this.emailsProcessed += 1;
        this.refreshTopBar();

        if (this.emailsProcessed >= this.activeDayEmails.length) {
            this.finishDay();
            return;
        }

        this.loadNextEmail();
    }

    private toggleSearchMode() {
        this.searchMode = !this.searchMode;

        if (!this.searchMode) {
            this.selectedRule = null;
            this.selectedPart = null;
            this.inspectText.setText(
                "Inspect Panel\n\nSearch Mode OFF. Toggle it ON to inspect.",
            );
        } else {
            this.inspectText.setText(
                "Inspect Panel\n\nSearch Mode ON. Select a rule and a related email part.",
            );
        }

        this.updateSearchButtonStyles();
    }

    private selectRule(rule: RuleId) {
        if (!this.searchMode) {
            this.inspectText.setText(
                "Inspect Panel\n\nEnable Search Mode first.",
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
                "Inspect Panel\n\nEnable Search Mode first.",
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

        const expectedPartByRule: Record<RuleId, InspectPart> = {
            1: "domain",
            2: "subject",
            3: "content",
        };

        const selectedMatchesRule =
            expectedPartByRule[this.selectedRule] === this.selectedPart;

        if (!selectedMatchesRule) {
            this.inspectText.setText(
                "Inspect Result\n\nDiscrepancy detected.\nSelected email part does not correlate with that rule.",
            );
            return;
        }

        const domainIsAllowed = this.allowedDomains.includes(
            this.currentEmail.domain,
        );
        const subjectLooksSafe =
            !/(urgent|free|winner|buy now|verify|action required)/i.test(
                this.currentEmail.subject,
            );
        const contentLooksSafe =
            !/(password|ssn|social security|bank|click|attachment|credentials)/i.test(
                this.currentEmail.body,
            );

        let passed = false;
        let observed = "";

        if (this.selectedPart === "domain") {
            passed = domainIsAllowed;
            observed = `Observed domain: ${this.currentEmail.domain}`;
        } else if (this.selectedPart === "subject") {
            passed = subjectLooksSafe;
            observed = `Observed subject: ${this.currentEmail.subject}`;
        } else {
            passed = contentLooksSafe;
            observed =
                "Observed content reviewed against credential/link request rule.";
        }

        const verdict = passed ? "Expected activity" : "Discrepancy detected";

        this.inspectText.setText(`Inspect Result\n\n${verdict}\n${observed}`);
    }

    private updateSearchButtonStyles() {
        this.toggleSearchButton.setText(
            `Search Mode: ${this.searchMode ? "ON" : "OFF"}`,
        );
        this.toggleSearchButton.setStyle({
            backgroundColor: this.searchMode ? "#1e6c4d" : "#4f4f4f",
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

        const selectedColor = connectionValid ? "#9effa0" : "#ffd27f";

        this.rule1Text.setStyle({
            fontStyle: this.selectedRule === 1 ? "bold" : "normal",
            color: this.selectedRule === 1 ? selectedColor : "#ffffff",
        });
        this.rule2Text.setStyle({
            fontStyle: this.selectedRule === 2 ? "bold" : "normal",
            color: this.selectedRule === 2 ? selectedColor : "#ffffff",
        });
        this.rule3Text.setStyle({
            fontStyle: this.selectedRule === 3 ? "bold" : "normal",
            color: this.selectedRule === 3 ? selectedColor : "#ffffff",
        });

        this.domainText.setStyle({
            fontStyle: this.selectedPart === "domain" ? "bold" : "normal",
            color: this.selectedPart === "domain" ? selectedColor : "#ffffff",
        });
        this.subjectText.setStyle({
            fontStyle: this.selectedPart === "subject" ? "bold" : "normal",
            color: this.selectedPart === "subject" ? selectedColor : "#ffffff",
        });
        const contentSelectedStyle = {
            fontStyle: this.selectedPart === "content" ? "bold" : "normal",
            color: this.selectedPart === "content" ? selectedColor : "#ffffff",
        };
        this.contentLabelText.setStyle(contentSelectedStyle);
        this.contentText.setStyle(contentSelectedStyle);
    }

    private layoutRulebookEntries() {
        const gap = 6;
        const firstY =
            this.rulebookHelpText.y + this.rulebookHelpText.height + 10;

        this.rule1Text.setY(firstY);
        this.rule2Text.setY(this.rule1Text.y + this.rule1Text.height + gap);
        this.rule3Text.setY(this.rule2Text.y + this.rule2Text.height + gap);
    }

    private resetSearchState() {
        this.searchMode = false;
        this.selectedRule = null;
        this.selectedPart = null;
        this.updateSearchButtonStyles();
    }

    private finishDay() {
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
        this.emailPanelTitle.setVisible(visible);
        this.fromText.setVisible(visible);
        this.domainText.setVisible(visible);
        this.subjectText.setVisible(visible);
        this.contentLabelText.setVisible(visible);
        this.contentText.setVisible(visible);
        this.rulebookTitleText.setVisible(visible);
        this.rulebookHelpText.setVisible(visible);
        this.rule1Text.setVisible(visible);
        this.rule2Text.setVisible(visible);
        this.rule3Text.setVisible(visible);
        this.inspectText.setVisible(visible);
        this.validButton.setVisible(visible);
        this.phishingButton.setVisible(visible);
        this.spamButton.setVisible(visible);
        this.toggleSearchButton.setVisible(visible);
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
