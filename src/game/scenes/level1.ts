import { Scene } from "phaser";
import {
    CAPTCHA_KEY_HIT_SOUND_KEYS,
    ensureLoopingSound,
    playOneShot,
    SOUND_KEYS,
    stopSound,
} from "../audio";
import {
    DAYS,
    type DayPlan,
    type EmailCase,
    type EmailType,
    getRulebookPages,
    MAX_DAYS,
} from "../email-content";
import { clearSavedRun, saveRun } from "../save-game";
import { getGameSettings } from "../settings";

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
    plotEmailsAccepted?: number;
    plotEmailsRejected?: number;
    endingPreview?: 1 | 2 | 3;
    tutorialMode?: boolean;
}

type TutorialPhase =
    | "emails1"
    | "awaiting-coworker"
    | "awaiting-captcha"
    | "awaiting-zombie"
    | "emails2"
    | "done";

const TUTORIAL_EMAILS: EmailCase[] = [
    {
        from: "John Smith",
        domain: "john@redforge.com",
        subject: "Updated MFA Schedule",
        body: "Starting Friday, RedForge staff must use MFA when connecting to internal VPN resources. Please review the updated schedule.",
        attachments: ["mfa_schedule.pdf"],
        type: "valid",
        violations: [],
    },
    {
        from: "Sarah Chen",
        domain: "john@redforge.security",
        subject: "Password Reset Utility",
        body: "Use the attached tool to automatically reset your account password before end of day.",
        attachments: ["reset_tool.exe"],
        type: "phishing",
        violations: [
            "username does not match sender",
            ".exe attachments are always banned",
        ],
    },
    {
        from: "Olivia Reed",
        domain: "olivia@stonegate.xyz",
        subject: "Visitor Desk Instructions",
        body: "Reception needs all visitors logged at the front desk before temporary badges are issued.",
        attachments: [],
        type: "phishing",
        violations: ["stonegate.xyz is not an approved StoneGate domain"],
    },
];

interface TutorialPopup {
    title: string;
    body: string;
}

const TUTORIAL_POPUPS: Record<
    "email1" | "email2" | "email3" | "coworker" | "captcha" | "zombie",
    TutorialPopup
> = {
    email1: {
        title: "Example Round: Email 1",
        body:
            "Welcome to the example round. Your first email is from John Smith at RedForge.\n\n" +
            "Everything in this one passes the rulebook. Open the computer when it arrives and try classifying it Valid.",
    },
    email2: {
        title: "Example Round: Email 2",
        body:
            "Your next email has clear problems.\n\n" +
            "Look at the sender name versus the email address username, and check the attached file. This one should be marked Phishing.",
    },
    email3: {
        title: "Example Round: Email 3",
        body:
            "One more email before the shift wraps up. This time, clicking an answer will trigger a CAPTCHA first.\n\n" +
            "Complete the CAPTCHA, then click your answer again. Hint: Open the rulebook and check the StoneGate company page.",
    },
    coworker: {
        title: "Distraction Event: The Coworker",
        body:
            "A coworker is about to wander over and start talking. While he is here, your panels close and the distraction meter starts falling.\n\n" +
            "Mash the SPACE key to fill the bar and get him to leave.",
    },
    captcha: {
        title: "Email Check: CAPTCHA",
        body:
            "Sometimes clicking Valid or Phishing will trigger a human verification check before your answer goes through.\n\n" +
            "Read the distorted 6-character code, type it on your keyboard, then press Enter before time runs out. Backspace fixes mistakes.\n\n" +
            "After you pass it, click your answer again.",
    },
    zombie: {
        title: "Distraction Event: The Zombie",
        body:
            "A zombie is about to break through the door. You will have 20 seconds.\n\n" +
            "1. Note today's password at the top of the screen.\n" +
            "2. Click the gun cabinet to open the keypad.\n" +
            "3. Enter the 4-digit password and press Enter.\n" +
            "4. Grab the gun, then click the zombie.",
    },
};

interface RulebookPage {
    title: string;
    body: string;
    companyIndex?: number;
}

interface DayViolation {
    index: number;
    from: string;
    domain: string;
    subject: string;
    correctType: EmailType;
    reason: string;
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

    private plotEmailsAccepted = 0;
    private plotEmailsRejected = 0;
    private awaitingPlotInterruptEnd = false;
    private incomingEndingPreview = 0;

    private tutorialMode = false;
    private tutorialEmailIndex = 0;
    private tutorialPhase: TutorialPhase = "emails1";
    private pendingTutorialAction: (() => void) | null = null;
    private tutorialPopupBg!: Phaser.GameObjects.Rectangle;
    private tutorialPopupPanel!: Phaser.GameObjects.Rectangle;
    private tutorialPopupTitle!: Phaser.GameObjects.Text;
    private tutorialPopupBody!: Phaser.GameObjects.Text;
    private tutorialPopupBeginButton!: Phaser.GameObjects.Text;

    private inboxEmails: EmailCase[] = [];
    private pendingArrivalEmails: EmailCase[] = [];
    private selectedInboxIndex = -1;
    private arrivalTimers: Phaser.Time.TimerEvent[] = [];
    private dayEmailIntervalMs = 0;
    private interruptRollTimer: Phaser.Time.TimerEvent | null = null;
    private interruptActive = false;
    private interruptProgress = 0;
    private interruptTick: Phaser.Time.TimerEvent | null = null;
    private interruptChanceMultiplier = 1;
    private readonly captchaAnswerChance = 0.04;
    private countdownTimer: Phaser.Time.TimerEvent | null = null;
    private zombieCountdownTimer: Phaser.Time.TimerEvent | null = null;
    private zombieTimerText: Phaser.GameObjects.Text | null = null;
    private captchaActive = false;
    private captchaCode = "";
    private captchaInput = "";
    private captchaTimer: Phaser.Time.TimerEvent | null = null;
    private captchaTimeRemaining = 0;
    private captchaTriggeredEmails = new WeakSet<EmailCase>();
    private captchaStartedFromAnswer = false;

    private triageVisible = true;
    private computerPanelOpen = false;
    private filesPanelOpen = false;
    private hasUnreadNotification = false;
    private computerHovered = false;
    private filesHovered = false;

    private rulebookPages: RulebookPage[] = [];
    private rulebookPageIndex = 0;

    //private debugGraphics!: Phaser.GameObjects.Graphics;

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
    private feedbackAlertTween: Phaser.Tweens.Tween | null = null;
    private dayViolations: DayViolation[] = [];
    private violationNoticeHoldUntilMs = 0;
    private violationNoticeTimer: Phaser.Time.TimerEvent | null = null;
    private violationNoticeBg!: Phaser.GameObjects.Rectangle;
    private violationNoticePanel!: Phaser.GameObjects.Rectangle;
    private violationNoticeTitle!: Phaser.GameObjects.Text;
    private violationNoticeFromText!: Phaser.GameObjects.Text;
    private violationNoticeReasonText!: Phaser.GameObjects.Text;
    private violationLogButton!: Phaser.GameObjects.Text;
    private violationLogBg!: Phaser.GameObjects.Rectangle;
    private violationLogPanel!: Phaser.GameObjects.Rectangle;
    private violationLogTitle!: Phaser.GameObjects.Text;
    private violationLogBody!: Phaser.GameObjects.Text;
    private violationLogCloseButton!: Phaser.GameObjects.Text;

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
    private rulebookCompanyLabelText!: Phaser.GameObjects.Text;
    private companyRuleButtons: Phaser.GameObjects.Text[] = [];

    private validButton!: Phaser.GameObjects.Text;
    private phishingButton!: Phaser.GameObjects.Text;
    private revealedEmails = new WeakSet<EmailCase>();

    private endDayTitle!: Phaser.GameObjects.Text;
    private endDaySummary!: Phaser.GameObjects.Text;
    private endDayPromptText!: Phaser.GameObjects.Text;
    private endDayShopFrame: Phaser.GameObjects.Rectangle[] = [];
    private endDayViolationButton!: Phaser.GameObjects.Text;
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
    private captchaBg!: Phaser.GameObjects.Rectangle;
    private captchaPanel!: Phaser.GameObjects.Rectangle;
    private captchaTitleText!: Phaser.GameObjects.Text;
    private captchaPromptText!: Phaser.GameObjects.Text;
    private captchaInputText!: Phaser.GameObjects.Text;
    private captchaTimerText!: Phaser.GameObjects.Text;
    private captchaHintText!: Phaser.GameObjects.Text;
    private captchaNoise!: Phaser.GameObjects.Graphics;
    private captchaCodeTexts: Phaser.GameObjects.Text[] = [];

    private zombieSprite!: Phaser.GameObjects.Image;
    private gunDoorClosedSprite!: Phaser.GameObjects.Image;
    private gunDoorOpenSprite!: Phaser.GameObjects.Image;
    private gunTakenSprite!: Phaser.GameObjects.Image;
    private gunDoorPanelZone!: Phaser.GameObjects.Zone;
    private gunZone!: Phaser.GameObjects.Zone;
    private crosshair!: Phaser.GameObjects.Image;
    //private crosshairZone!: Phaser.GameObjects.Zone;
    private zombieZone!: Phaser.GameObjects.Zone;

    private panel!: Phaser.GameObjects.Rectangle;
    private panelDisplay!: Phaser.GameObjects.Text;
    private button1!: Phaser.GameObjects.Text;
    private button2!: Phaser.GameObjects.Text;
    private button3!: Phaser.GameObjects.Text;
    private button4!: Phaser.GameObjects.Text;
    private button5!: Phaser.GameObjects.Text;
    private button6!: Phaser.GameObjects.Text;
    private button7!: Phaser.GameObjects.Text;
    private button8!: Phaser.GameObjects.Text;
    private button9!: Phaser.GameObjects.Text;
    private buttonEnter!: Phaser.GameObjects.Text;
    private buttonBackspace!: Phaser.GameObjects.Text;
    private inputPassword = "";
    private todaysPassword = "";
    private passwordCorrect = 0;
    private readonly updateCrosshairPosition = (
        pointer: Phaser.Input.Pointer,
    ) => {
        this.crosshair.setPosition(pointer.worldX, pointer.worldY);
    };
    private readonly handleCaptchaKeyDown = (event: KeyboardEvent) => {
        if (!this.captchaActive) {
            return;
        }

        if (event.key === "Backspace") {
            event.preventDefault();
            this.captchaInput = this.captchaInput.slice(0, -1);
            this.playRandomCaptchaKeyHit();
            this.refreshCaptchaInput();
            return;
        }

        if (event.key === "Enter") {
            event.preventDefault();
            this.submitCaptcha();
            return;
        }

        if (/^[a-zA-Z0-9]$/.test(event.key) && this.captchaInput.length < 6) {
            event.preventDefault();
            this.captchaInput += event.key.toUpperCase();
            this.playRandomCaptchaKeyHit();
            this.refreshCaptchaInput();
        }
    };

    private playRandomCaptchaKeyHit() {
        const soundKey =
            CAPTCHA_KEY_HIT_SOUND_KEYS[
                Phaser.Math.Between(0, CAPTCHA_KEY_HIT_SOUND_KEYS.length - 1)
            ];
        playOneShot(this, soundKey, { volume: 0.45 });
    }

    private plotDialogPanel!: Phaser.GameObjects.Rectangle;
    private plotDialogAccent!: Phaser.GameObjects.Rectangle;
    private dudePlotText!: Phaser.GameObjects.Text;
    private plotDialogOkButton!: Phaser.GameObjects.Text;
    private isPlotInterrupt = false;

    //timer setup
    private timerValue = 300;
    private timerText!: Phaser.GameObjects.Text;

    private emailCloseXText!: Phaser.GameObjects.Text;
    private rulesCloseXText!: Phaser.GameObjects.Text;

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
        this.plotEmailsAccepted = data.plotEmailsAccepted ?? 0;
        this.plotEmailsRejected = data.plotEmailsRejected ?? 0;
        this.incomingEndingPreview = data.endingPreview ?? 0;
        this.tutorialMode = data.tutorialMode ?? false;
        if (data.endingPreview === 1) {
            this.plotEmailsAccepted = 7;
            this.plotEmailsRejected = 0;
        } else if (data.endingPreview === 2) {
            this.plotEmailsAccepted = 0;
            this.plotEmailsRejected = 7;
        } else if (data.endingPreview === 3) {
            this.plotEmailsAccepted = 3;
            this.plotEmailsRejected = 4;
        }
    }

    create() {
        this.cameras.main.fadeIn(250, 0, 0, 0);
        ensureLoopingSound(this, SOUND_KEYS.fanAudio, { volume: 0.0625 });
        this.events.once("shutdown", () => {
            stopSound(this, SOUND_KEYS.dudeNoise);
            stopSound(this, SOUND_KEYS.fanAudio);
            this.input.keyboard?.off("keydown", this.handleCaptchaKeyDown);
        });
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

        if (this.incomingEndingPreview > 0) {
            this.showPlotEnding();
            return;
        }

        if (this.tutorialMode) {
            this.startTutorial();
        } else {
            this.startDay(this.day);
        }

        this.timerValue = 300;
        this.timerText = this.add
            .text(765, 57, `Time: ${this.timerValue}s`, {
                fontFamily: "Dotemp-8bit",
                fontSize: "22px",
                color: "#f4ecd8",
            })
            .setStyle({ backgroundColor: "#213426" })
            .setDepth(11);

        if (this.tutorialMode) {
            this.timerText.setVisible(false);
            return;
        }

        this.countdownTimer = this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                if (this.timerValue <= 0) return;
                this.timerValue--;
                this.timerText.setText(`Time: ${this.timerValue}s`);
                if (this.timerValue <= 0) {
                    this.countdownTimer?.remove(false);
                    this.countdownTimer = null;
                    this.finishDay();
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
            .zone(305, 406, 500, 520)
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
                playOneShot(this, SOUND_KEYS.mouseClick, { volume: 0.45 });
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
            if (this.filesPanelOpen) {
                playOneShot(this, SOUND_KEYS.pageTurn, { volume: 0.5 });
            }
            this.updatePanelVisibility();
        });

        this.refreshDeskTextures();
    }

    private buildUI() {
        this.todaysPassword = "";
        for (let i = 0; i < 4; i++) {
            this.todaysPassword += Phaser.Math.Between(2, 9).toString();
            console.log(this.todaysPassword);
        }

        this.add
            .rectangle(512, 58, 1024, 106, 0x1b3022, 0.97)
            .setStrokeStyle(2, 0xb5953a)
            .setDepth(10);
        this.add.rectangle(512, 116, 1024, 4, 0xd4a830, 1).setDepth(10);
        this.add
            .text(
                700,
                20,
                "Today's Password: " + this.formatPassword(this.todaysPassword),
                {
                    fontFamily: "Dotemp-8bit",
                    fontSize: "20px",
                    color: "#f4ecd8",
                },
            )
            .setDepth(10);
        this.mainmenuButton = this.createButton(
            950,
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
            .setStyle({ backgroundColor: "#203426" })
            .setDepth(11);

        this.scoreText = this.add
            .text(32, 57, "", {
                fontSize: "22px",
                color: "#f4ecd8",
            })
            .setStyle({ backgroundColor: "#203426" })
            .setDepth(11);

        this.moneyText = this.add
            .text(175, 57, "", {
                fontSize: "22px",
                color: "#e2d39e",
            })
            .setStyle({ backgroundColor: "transparent" })
            .setDepth(11);

        this.progressText = this.add
            .text(350, 59, "", {
                fontSize: "20px",
                color: "#e2d39e",
            })
            .setStyle({ backgroundColor: "transparent" })
            .setDepth(11);

        this.feedbackBar = this.add
            .rectangle(512, 144, 920, 42, 0xf0e4c4, 0.97)
            .setStrokeStyle(2, 0x7a6030)
            .setDepth(29);

        this.feedbackText = this.add
            .text(74, 130, "", {
                fontSize: "20px",
                color: "#2c271f",
                wordWrap: { width: 860 },
                lineSpacing: 4,
            })
            .setDepth(30);

        this.violationLogButton = this.createButton(
            665,
            70,
            "Violations",
            "#5f6359",
            () => {
                this.showViolationLog(true);
            },
            130,
        )
            .setDepth(14)
            .setVisible(false);

        this.violationNoticeBg = this.add
            .rectangle(512, 384, 1024, 768, 0x090d09, 0.42)
            .setDepth(69)
            .setInteractive()
            .setVisible(false);

        this.violationNoticePanel = this.add
            .rectangle(512, 384, 650, 300, 0xf0e4c4, 0.98)
            .setStrokeStyle(4, 0xa83328)
            .setDepth(70)
            .setVisible(false);

        this.violationNoticeTitle = this.add
            .text(512, 280, "", {
                fontSize: "32px",
                color: "#7a2d25",
                fontStyle: "bold",
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(71)
            .setVisible(false);

        this.violationNoticeFromText = this.add
            .text(512, 338, "", {
                fontSize: "18px",
                color: "#2f4b36",
                align: "center",
                wordWrap: { width: 570 },
                lineSpacing: 4,
            })
            .setOrigin(0.5)
            .setDepth(71)
            .setVisible(false);

        this.violationNoticeReasonText = this.add
            .text(512, 420, "", {
                fontSize: "20px",
                color: "#433927",
                align: "center",
                wordWrap: { width: 570 },
                lineSpacing: 8,
            })
            .setOrigin(0.5)
            .setDepth(71)
            .setVisible(false);

        this.violationLogBg = this.add
            .rectangle(512, 384, 1024, 768, 0x090d09, 0.62)
            .setDepth(74)
            .setInteractive()
            .setVisible(false);

        this.violationLogPanel = this.add
            .rectangle(512, 384, 720, 480, 0xf0e4c4, 0.99)
            .setStrokeStyle(3, 0x7a6030)
            .setDepth(75)
            .setVisible(false);

        this.violationLogTitle = this.add
            .text(512, 198, "Today's Violations", {
                fontSize: "30px",
                color: "#7a2d25",
                fontStyle: "bold",
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(76)
            .setVisible(false);

        this.violationLogBody = this.add
            .text(190, 250, "", {
                fontSize: "17px",
                color: "#2a251c",
                wordWrap: { width: 645 },
                lineSpacing: 7,
            })
            .setDepth(76)
            .setVisible(false);

        this.violationLogCloseButton = this.createButton(
            512,
            596,
            "Close",
            "#66563b",
            () => {
                this.showViolationLog(false);
            },
            160,
        )
            .setDepth(76)
            .setVisible(false);

        this.endScreenBg = this.add
            .rectangle(512, 384, 1024, 768, 0x30342b, 0.96)
            .setDepth(50)
            .setVisible(false);

        this.computerPanelBg = this.add
            .rectangle(770, 466, 470, 590, 0x101913, 1)
            .setStrokeStyle(4, 0x324b38)
            .setDepth(15)
            .setVisible(false);

        this.filesPanelBg = this.add
            .rectangle(265, 466, 500, 590, 0xf0e4c4, 1)
            .setStrokeStyle(3, 0x7a6030)
            .setDepth(15)
            .setVisible(false);

        this.computerPanelChrome = [
            this.add
                .rectangle(770, 466, 432, 512, 0x0d1f17, 1)
                .setStrokeStyle(3, 0x4d6a50)
                .setDepth(15)
                .setVisible(false),
            this.add
                .rectangle(770, 202, 432, 46, 0x07120d, 1)
                .setStrokeStyle(2, 0x5b7a54)
                .setDepth(15)
                .setVisible(false),
            this.add
                .rectangle(770, 260, 400, 2, 0x6fb76b, 0.45)
                .setDepth(15)
                .setVisible(false),
            this.add
                .rectangle(770, 322, 400, 2, 0x6fb76b, 0.22)
                .setDepth(15)
                .setVisible(false),
            this.add
                .rectangle(770, 374, 400, 3, 0x6fb76b, 0.75)
                .setDepth(15)
                .setVisible(false),
            this.add
                .rectangle(770, 488, 400, 176, 0x10281d, 1)
                .setStrokeStyle(1, 0x4d6a50)
                .setDepth(15)
                .setVisible(false),
            this.add
                .rectangle(770, 640, 400, 76, 0x17251a, 1)
                .setStrokeStyle(1, 0x4d6a50)
                .setDepth(15)
                .setVisible(false),
            this.add
                .rectangle(770, 722, 400, 48, 0x08120d, 1)
                .setStrokeStyle(1, 0x5b7a54)
                .setDepth(15)
                .setVisible(false),
        ];

        this.filesPanelChrome = [
            this.add
                .rectangle(265, 202, 462, 46, 0x1b3022, 1)
                .setStrokeStyle(2, 0xb5953a)
                .setDepth(15)
                .setVisible(false),
            this.add
                .rectangle(265, 266, 462, 3, 0xd4a830, 0.9)
                .setDepth(15)
                .setVisible(false),
            this.add
                .rectangle(265, 365, 462, 2, 0xb5953a, 0.45)
                .setDepth(15)
                .setVisible(false),
            this.add
                .rectangle(265, 544, 462, 360, 0xf8f0dc, 0.72)
                .setStrokeStyle(1, 0xd0bd84)
                .setDepth(15)
                .setVisible(false),
            this.add
                .rectangle(50, 544, 3, 360, 0xb5953a, 0.42)
                .setDepth(15)
                .setVisible(false),
            this.add
                .rectangle(480, 544, 3, 360, 0xb5953a, 0.42)
                .setDepth(15)
                .setVisible(false),
        ];

        this.emailPanelTitle = this.add
            .text(560, 189, "EMAIL MONITOR", {
                fontSize: "24px",
                color: "#f4ecd8",
                fontStyle: "bold",
            })
            .setDepth(16)
            .setVisible(false);

        this.emailCloseXText = this.add
            .text(965, 202, " X", {
                fontFamily: "Dotemp-8bit",
                fontSize: "24px",
                color: "#ff2222",
                fontStyle: "bold",
            })
            .setOrigin(0.5)
            .setDepth(17)
            .setVisible(false);

        this.emailSwitchText = this.add
            .text(572, 238, "", {
                fontSize: "16px",
                color: "#8bcf7b",
            })
            .setDepth(16)
            .setVisible(false);

        this.previousEmailButton = this.createButton(
            815,
            250,
            "< Prev",
            "#5f6359",
            () => {
                playOneShot(this, SOUND_KEYS.mouseClick, { volume: 0.4 });
                this.showPreviousEmail();
            },
            90,
        )
            .setDepth(16)
            .setVisible(false);

        this.nextEmailButton = this.createButton(
            925,
            250,
            "Next >",
            "#5f6359",
            () => {
                playOneShot(this, SOUND_KEYS.mouseClick, { volume: 0.4 });
                this.showNextEmail();
            },
            90,
        )
            .setDepth(16)
            .setVisible(false);

        this.fromText = this.add
            .text(572, 268, "", {
                fontSize: "17px",
                color: "#d8f1c7",
                wordWrap: { width: 430 },
                lineSpacing: 4,
            })
            .setDepth(16)
            .setVisible(false);

        this.domainText = this.add
            .text(572, 294, "", {
                fontSize: "17px",
                color: "#b8d9a8",
                wordWrap: { width: 430 },
            })
            .setDepth(16)
            .setVisible(false);

        this.subjectText = this.add
            .text(572, 336, "", {
                fontSize: "17px",
                color: "#d8f1c7",
                wordWrap: { width: 430 },
                lineSpacing: 4,
            })
            .setDepth(16)
            .setVisible(false);

        this.contentLabelText = this.add
            .text(576, 405, "Content:", {
                fontSize: "17px",
                color: "#8bcf7b",
            })
            .setDepth(16)
            .setVisible(false);

        this.contentText = this.add
            .text(576, 434, "", {
                fontSize: "16px",
                color: "#d8f1c7",
                wordWrap: { width: 380 },
                fixedWidth: 380,
                fixedHeight: 126,
                lineSpacing: 6,
            })
            .setDepth(16)
            .setVisible(false);

        this.attachmentText = this.add
            .text(576, 579, "", {
                fontSize: "16px",
                color: "#f0d990",
                wordWrap: { width: 430 },
                lineSpacing: 4,
            })
            .setDepth(16)
            .setVisible(false);

        this.powerupStatusText = this.add
            .text(770, 612, "", {
                fontSize: "13px",
                color: "#b8d9a8",
                align: "center",
                wordWrap: { width: 380 },
                lineSpacing: 4,
            })
            .setOrigin(0.5)
            .setDepth(16)
            .setVisible(false);

        this.hintButton = this.createButton(
            670,
            650,
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
            870,
            650,
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
            724,
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
            724,
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
            .text(48, 186, "Rulebook", {
                fontSize: "28px",
                color: "#f4ecd8",
                fontStyle: "bold",
            })
            .setDepth(16)
            .setVisible(false);

        this.rulesCloseXText = this.add
            .text(475, 202, " X", {
                fontFamily: "Dotemp-8bit",
                fontSize: "24px",
                color: "#ff2222",
                fontStyle: "bold",
            })
            .setOrigin(0.5)
            .setDepth(17)
            .setVisible(false);

        this.rulebookCoreButton = this.createButton(
            112,
            244,
            "Basics",
            "#66563b",
            () => {
                this.showRulebookPageByTitle("Core Rules");
            },
            116,
        )
            .setDepth(16)
            .setVisible(false);

        this.rulebookRosterButton = this.createButton(
            256,
            244,
            "Content",
            "#66563b",
            () => {
                this.showRulebookPageByTitle("Core Rules: Content");
            },
            116,
        )
            .setDepth(16)
            .setVisible(false);

        this.rulebookTodayButton = this.createButton(
            400,
            244,
            "Today",
            "#66563b",
            () => {
                this.showRulebookPageByTitle(`Day ${this.day} Alerts`);
            },
            116,
        )
            .setDepth(16)
            .setVisible(false);

        this.rulebookCompanyLabelText = this.add
            .text(48, 270, "Company roster", {
                fontSize: "15px",
                color: "#5a4a32",
            })
            .setDepth(16)
            .setVisible(false);

        const companyLabels = [
            { button: "RedForge", page: "RedForge" },
            { button: "BluePeak", page: "BluePeak" },
            { button: "NorthStar", page: "NorthStar" },
            { button: "StoneGate", page: "StoneGate" },
            { button: "ClearPath", page: "ClearPath" },
            { button: "IronClad", page: "IronClad" },
        ];
        this.companyRuleButtons = companyLabels.map((company, index) =>
            this.createButton(
                120 + (index % 3) * 145,
                312 + Math.floor(index / 3) * 42,
                company.button,
                "#4d5f55",
                () => {
                    this.showRulebookPageByTitle(company.page);
                },
                128,
            )
                .setDepth(16)
                .setVisible(false),
        );

        this.rulebookPageText = this.add
            .text(58, 382, "", {
                fontSize: "19px",
                color: "#5a4a32",
                wordWrap: { width: 432 },
            })
            .setDepth(16)
            .setVisible(false);

        this.rulebookBodyText = this.add
            .text(58, 418, "", {
                fontSize: "16px",
                color: "#2a251c",
                wordWrap: { width: 432 },
                lineSpacing: 3,
            })
            .setDepth(16)
            .setVisible(false);

        this.previousRulePageButton = this.createButton(
            160,
            734,
            "< Prev",
            "#66563b",
            () => {
                this.showPreviousRulePage();
            },
            140,
        )
            .setDepth(16)
            .setVisible(false);

        this.nextRulePageButton = this.createButton(
            370,
            734,
            "Next >",
            "#66563b",
            () => {
                this.showNextRulePage();
            },
            140,
        )
            .setDepth(16)
            .setVisible(false);

        this.endDayShopFrame = [
            this.add
                .rectangle(512, 386, 710, 545, 0xf0e4c4, 0.98)
                .setStrokeStyle(3, 0x7a6030)
                .setDepth(51)
                .setVisible(false),
            this.add
                .rectangle(512, 174, 710, 88, 0x1b3022, 1)
                .setStrokeStyle(2, 0xb5953a)
                .setDepth(52)
                .setVisible(false),
            this.add
                .rectangle(512, 218, 710, 4, 0xd4a830, 1)
                .setDepth(52)
                .setVisible(false),
            this.add
                .rectangle(512, 398, 565, 210, 0xe8d9a8, 0.96)
                .setStrokeStyle(2, 0xb5953a)
                .setDepth(52)
                .setVisible(false),
            this.add
                .rectangle(512, 545, 710, 4, 0xd4a830, 0.8)
                .setDepth(52)
                .setVisible(false),
        ];

        this.endDayTitle = this.add
            .text(512, 174, "", {
                fontSize: "40px",
                color: "#f4ecd8",
                fontStyle: "bold",
            })
            .setOrigin(0.5)
            .setDepth(53)
            .setVisible(false);

        this.endDayPromptText = this.add
            .text(512, 254, "", {
                fontSize: "22px",
                color: "#2f4b36",
                align: "center",
                wordWrap: { width: 650 },
                lineSpacing: 6,
            })
            .setOrigin(0.5)
            .setDepth(53)
            .setVisible(false);

        this.endDaySummary = this.add
            .text(512, 398, "", {
                fontSize: "26px",
                color: "#433927",
                align: "center",
                wordWrap: { width: 520 },
                lineSpacing: 10,
            })
            .setOrigin(0.5)
            .setDepth(53)
            .setVisible(false);

        this.toShopButton = this.createButton(
            512,
            606,
            "Enter Shop",
            "#44624c",
            () => {
                this.enterShop();
            },
            270,
        )
            .setDepth(60)
            .setVisible(false);

        this.endDayViolationButton = this.createButton(
            512,
            548,
            "View Violations",
            "#7a3e36",
            () => {
                this.showViolationLog(true);
            },
            230,
        )
            .setDepth(60)
            .setVisible(false);

        this.finalTitle = this.add
            .text(512, 250, "", {
                fontSize: "48px",
                color: "#f4ecd8",
                fontStyle: "bold",
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(51)
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
            .setDepth(51)
            .setVisible(false);

        this.restartButton = this.createButton(
            512,
            500,
            "Restart Game",
            "#4d5f55",
            () => {
                this.timerValue = 300;
                clearSavedRun();
                this.startSceneAfterFade("Level1", {
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
            .setDepth(51)
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
            .setDepth(51)
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
            .setDepth(51)
            .setVisible(false);

        this.tutorialPopupBg = this.add
            .rectangle(512, 384, 1024, 768, 0x090d09, 0.62)
            .setDepth(80)
            .setInteractive()
            .setVisible(false);

        this.tutorialPopupPanel = this.add
            .rectangle(512, 384, 720, 400, 0xf0e4c4, 0.99)
            .setStrokeStyle(3, 0x7a6030)
            .setDepth(81)
            .setVisible(false);

        this.tutorialPopupTitle = this.add
            .text(512, 230, "", {
                fontFamily: "Dotemp-8bit",
                fontSize: "28px",
                color: "#2f4b36",
                fontStyle: "bold",
                align: "center",
                wordWrap: { width: 660 },
            })
            .setOrigin(0.5)
            .setDepth(82)
            .setVisible(false);

        this.tutorialPopupBody = this.add
            .text(512, 380, "", {
                fontFamily: "Dotemp-8bit",
                fontSize: "18px",
                color: "#2a251c",
                align: "center",
                wordWrap: { width: 640 },
                lineSpacing: 6,
            })
            .setOrigin(0.5)
            .setDepth(82)
            .setVisible(false);

        this.tutorialPopupBeginButton = this.createButton(
            512,
            540,
            "Begin",
            "#44624c",
            () => {
                this.acknowledgeTutorialPopup();
            },
            200,
        )
            .setDepth(83)
            .setVisible(false);
    }

    private showTutorialPopup(popup: TutorialPopup, onBegin: () => void) {
        this.pendingTutorialAction = onBegin;
        this.tutorialPopupTitle.setText(popup.title);
        this.tutorialPopupBody.setText(popup.body);
        this.tutorialPopupBg.setVisible(true);
        this.tutorialPopupPanel.setVisible(true);
        this.tutorialPopupTitle.setVisible(true);
        this.tutorialPopupBody.setVisible(true);
        this.tutorialPopupBeginButton.setVisible(true);
    }

    private acknowledgeTutorialPopup() {
        if (!this.tutorialPopupBg.visible) return;
        const action = this.pendingTutorialAction;
        this.pendingTutorialAction = null;
        this.tutorialPopupBg.setVisible(false);
        this.tutorialPopupPanel.setVisible(false);
        this.tutorialPopupTitle.setVisible(false);
        this.tutorialPopupBody.setVisible(false);
        this.tutorialPopupBeginButton.setVisible(false);
        action?.();
    }

    private buildInterruptUI() {
        this.dudeSprite = this.add
            .image(512, 384, "desk-dude")
            .setDisplaySize(1024, 768)
            .setDepth(25)
            .setVisible(false);

        this.zombieSprite = this.add
            .image(512, 384, "zombie")
            .setDisplaySize(1024, 768)
            .setDepth(25)
            .setVisible(false);
        this.gunDoorClosedSprite = this.add
            .image(-250, 540, "gun-door-closed")
            .setDisplaySize(1024, 768)
            .setDepth(49)
            .setVisible(false);
        this.gunDoorOpenSprite = this.add
            .image(512, 384, "gun-door-open")
            .setDisplaySize(1024, 768)
            .setDepth(49)
            .setVisible(false);
        this.gunTakenSprite = this.add
            .image(512, 384, "gun-taken")
            .setDisplaySize(1024, 768)
            .setDepth(49)
            .setVisible(false);
        this.gunDoorPanelZone = this.add
            .zone(512, 384, 1024, 768)
            .setDepth(49)
            .setVisible(false);
        this.gunZone = this.add
            .zone(512, 384, 1024, 768)
            .setDepth(49)
            .setVisible(false);
        this.crosshair = this.add
            .image(512, 384, "crosshair")
            .setOrigin(0.5)
            .setDepth(49)
            .setVisible(false);
        /*
        this.crosshairZone = this.add
            .zone(512, 384, 32, 32)
            .setDepth(49)
            .setVisible(false);
        */
        this.zombieZone = this.add
            .zone(512, 384, 260, 320)
            .setDepth(49)
            .setVisible(false);

        /*
        this.panel = this.add
            .rectangle(512, 348, 500, 500, 0xADA17F)
            .setStrokeStyle(2, 0xffffff)
            .setDepth(26)
            .setVisible(false)
            .setAlpha(.8);
        
        this.button1 = this.createButton(512,500,"1","#4d5f55",() => {this.inputPassword += "1";},50,).setDepth(27).setVisible(false);
        this.button2 = this.createButton(512,550,"2","#4d5f55",() => {this.inputPassword += "2";},50,).setDepth(27).setVisible(false);
        this.button3 = this.createButton(512,600,"3","#4d5f55",() => {this.inputPassword += "3";},50,).setDepth(27).setVisible(false);
        this.button4 = this.createButton(562,500,"4","#4d5f55",() => {this.inputPassword += "4";},50,).setDepth(27).setVisible(false);
        this.button5 = this.createButton(562,550,"5","#4d5f55",() => {this.inputPassword += "5";},50,).setDepth(27).setVisible(false);
        this.button6 = this.createButton(562,600,"6","#4d5f55",() => {this.inputPassword += "6";},50,).setDepth(27).setVisible(false);
        this.button7 = this.createButton(612,500,"7","#4d5f55",() => {this.inputPassword += "7";},50,).setDepth(27).setVisible(false);
        this.button8 = this.createButton(612,550,"8","#4d5f55",() => {this.inputPassword += "8";},50,).setDepth(27).setVisible(false);
        this.button9 = this.createButton(612,600,"9","#4d5f55",() => {this.inputPassword += "9";},50,).setDepth(27).setVisible(false);

        this.buttonEnter = this.createButton(462,500,"Enter","#4d5f55",() => {this.checkPassword();},70,).setDepth(27).setVisible(false);
        this.buttonBackspace = this.createButton(462,550,"Backspace","#4d5f55",() => {this.inputPassword = this.inputPassword.slice(0, -1);},70,).setDepth(27).setVisible(false);
        */

        const centerX = 512;
        const centerY = 348;

        this.panel = this.add
            .rectangle(centerX, centerY, 240, 280, 0xd8cfaf)
            .setStrokeStyle(2, 0x6e644a)
            .setDepth(26)
            .setVisible(false)
            .setAlpha(0.95);

        const startX = centerX - 50; // left column
        const startY = centerY - 40; // top row
        const spacing = 50;

        this.button1 = this.createButton(
            startX,
            startY,
            "1",
            "#4E6A57",
            () => {
                this.addPinDigit("1");
            },
            40,
        )
            .setDepth(27)
            .setVisible(false);
        this.button2 = this.createButton(
            startX + spacing,
            startY,
            "2",
            "#4E6A57",
            () => {
                this.addPinDigit("2");
            },
            40,
        )
            .setDepth(27)
            .setVisible(false);
        this.button3 = this.createButton(
            startX + spacing * 2,
            startY,
            "3",
            "#4E6A57",
            () => {
                this.addPinDigit("3");
            },
            40,
        )
            .setDepth(27)
            .setVisible(false);

        this.button4 = this.createButton(
            startX,
            startY + spacing,
            "4",
            "#4E6A57",
            () => {
                this.addPinDigit("4");
            },
            40,
        )
            .setDepth(27)
            .setVisible(false);
        this.button5 = this.createButton(
            startX + spacing,
            startY + spacing,
            "5",
            "#4E6A57",
            () => {
                this.addPinDigit("5");
            },
            40,
        )
            .setDepth(27)
            .setVisible(false);
        this.button6 = this.createButton(
            startX + spacing * 2,
            startY + spacing,
            "6",
            "#4E6A57",
            () => {
                this.addPinDigit("6");
            },
            40,
        )
            .setDepth(27)
            .setVisible(false);

        this.button7 = this.createButton(
            startX,
            startY + spacing * 2,
            "7",
            "#4E6A57",
            () => {
                this.addPinDigit("7");
            },
            40,
        )
            .setDepth(27)
            .setVisible(false);
        this.button8 = this.createButton(
            startX + spacing,
            startY + spacing * 2,
            "8",
            "#4E6A57",
            () => {
                this.addPinDigit("8");
            },
            40,
        )
            .setDepth(27)
            .setVisible(false);
        this.button9 = this.createButton(
            startX + spacing * 2,
            startY + spacing * 2,
            "9",
            "#4E6A57",
            () => {
                this.addPinDigit("9");
            },
            40,
        )
            .setDepth(27)
            .setVisible(false);

        this.buttonEnter = this.createButton(
            startX,
            startY + spacing * 3,
            "Enter",
            "#4E6A57",
            () => {
                this.submitPin();
            },
            70,
        )
            .setDepth(27)
            .setVisible(false);
        this.buttonBackspace = this.createButton(
            startX + spacing * 2,
            startY + spacing * 3,
            "Delete",
            "#4E6A57",
            () => {
                this.deletePinDigit();
            },
            70,
        )
            .setDepth(27)
            .setVisible(false);

        this.panelDisplay = this.add
            .text(centerX, startY - spacing, this.inputPassword, {
                fontFamily: "Dotemp-8bit",
                fontSize: "16px",
                color: "#f8f0dc",
                stroke: "#211d17",
                strokeThickness: 1,
                backgroundColor: "#4E6A57",
                fixedWidth: 200,
                align: "center",
                padding: { left: 8, right: 8, top: 10, bottom: 10 },
            })
            .setOrigin(0.5)
            .setDepth(27)
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
            .text(512, 640, "Ignore conversation. Spam Space!", {
                fontFamily: "Dotemp-8bit",
                fontSize: "20px",
                color: "#ffffff",
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(28)
            .setVisible(false);

        // Plot dialogue panel - themed box that replaces the distraction bar
        this.captchaBg = this.add
            .rectangle(512, 384, 1024, 768, 0x090d09, 0.62)
            .setDepth(60)
            .setInteractive()
            .setVisible(false);

        this.captchaPanel = this.add
            .rectangle(512, 384, 620, 390, 0x0d1f17, 0.99)
            .setStrokeStyle(3, 0x4d6a50)
            .setDepth(61)
            .setVisible(false);

        this.captchaTitleText = this.add
            .text(512, 236, "CAPTCHA TEST", {
                fontFamily: "Dotemp-8bit",
                fontSize: "34px",
                color: "#f4ecd8",
                fontStyle: "bold",
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(62)
            .setVisible(false);

        this.captchaPromptText = this.add
            .text(512, 282, "Verify you're still human.", {
                fontFamily: "Dotemp-8bit",
                fontSize: "20px",
                color: "#b8d9a8",
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(62)
            .setVisible(false);

        this.captchaNoise = this.add.graphics().setDepth(62).setVisible(false);

        this.captchaInputText = this.add
            .text(512, 452, "", {
                fontFamily: "Dotemp-8bit",
                fontSize: "28px",
                color: "#d8f1c7",
                backgroundColor: "#08120d",
                fixedWidth: 360,
                align: "center",
                padding: { left: 10, right: 10, top: 12, bottom: 12 },
            })
            .setOrigin(0.5)
            .setDepth(63)
            .setVisible(false);

        this.captchaTimerText = this.add
            .text(512, 514, "", {
                fontFamily: "Dotemp-8bit",
                fontSize: "18px",
                color: "#f0d990",
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(62)
            .setVisible(false);

        this.captchaHintText = this.add
            .text(512, 552, "Type the code, then press Enter.", {
                fontFamily: "Dotemp-8bit",
                fontSize: "16px",
                color: "#8bcf7b",
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(62)
            .setVisible(false);

        this.plotDialogPanel = this.add
            .rectangle(512, 643, 740, 116, 0x1b3022)
            .setStrokeStyle(2, 0xb5953a)
            .setDepth(28)
            .setVisible(false);

        this.plotDialogAccent = this.add
            .rectangle(512, 588, 740, 4, 0xd4a830)
            .setDepth(29)
            .setVisible(false);

        this.dudePlotText = this.add
            .text(512, 618, "", {
                fontFamily: "Dotemp-8bit",
                fontSize: "16px",
                color: "#f4ecd8",
                align: "center",
                wordWrap: { width: 700 },
            })
            .setOrigin(0.5, 0)
            .setDepth(29)
            .setVisible(false);

        this.plotDialogOkButton = this.add
            .text(512, 682, "  OK  ", {
                fontFamily: "Dotemp-8bit",
                fontSize: "16px",
                color: "#f4ecd8",
                backgroundColor: "#2f4b36",
                stroke: "#b5a36a",
                strokeThickness: 1,
                padding: { left: 18, right: 18, top: 8, bottom: 8 },
            })
            .setOrigin(0.5)
            .setDepth(30)
            .setInteractive({ useHandCursor: true })
            .setVisible(false);

        this.plotDialogOkButton.on("pointerdown", () => {
            this.endInterrupt();
        });
        this.plotDialogOkButton.on("pointerover", () => {
            this.plotDialogOkButton.setStyle({ backgroundColor: "#3d6347" });
        });
        this.plotDialogOkButton.on("pointerout", () => {
            this.plotDialogOkButton.setStyle({ backgroundColor: "#2f4b36" });
        });

        this.input.keyboard?.on("keydown", this.handleCaptchaKeyDown);

        this.input.keyboard?.on("keydown-SPACE", () => {
            if (
                !this.interruptActive ||
                this.isPlotInterrupt ||
                this.captchaActive
            ) {
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
                fontFamily: "Dotemp-8bit",
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
            .setInteractive({ useHandCursor: true });

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
            this.violationLogButton,
            this.violationNoticeTitle,
            this.violationNoticeFromText,
            this.violationNoticeReasonText,
            this.violationLogTitle,
            this.violationLogBody,
            this.violationLogCloseButton,
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
            this.rulebookCompanyLabelText,
            ...this.companyRuleButtons,
            this.validButton,
            this.phishingButton,
            this.endDayTitle,
            this.endDayPromptText,
            this.endDaySummary,
            this.endDayViolationButton,
            this.toShopButton,
            this.finalTitle,
            this.finalSummary,
            this.restartButton,
        ];

        for (const textObject of uiText) {
            textObject.setFontFamily("Dotemp-8bit");
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
        this.captchaTriggeredEmails = new WeakSet<EmailCase>();
        this.interruptChanceMultiplier = 1;
        this.dayViolations = [];
        saveRun({
            day: this.day,
            totalPoints: this.totalPoints,
            money: this.money,
            daysWithoutRent: this.daysWithoutRent,
            hintCount: this.hintCount,
            revealCount: this.revealCount,
            shieldActive: this.shieldActive,
            plotEmailsAccepted: this.plotEmailsAccepted,
            plotEmailsRejected: this.plotEmailsRejected,
        });
        this.hideViolationNotice();
        this.showViolationLog(false);
        this.refreshViolationLogButton();

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

        const dudeSaying = dayPlan.dudeSaying;
        if (dudeSaying) {
            this.awaitingPlotInterruptEnd = true;
            this.startPlotInterrupt(dudeSaying);
        } else {
            this.scheduleNextEmailArrival();
            this.startInterruptRolls();
        }
    }

    private getDayPlan(): DayPlan {
        return DAYS[this.day - 1] ?? DAYS[DAYS.length - 1];
    }

    private startTutorial() {
        this.clearArrivalTimers();
        this.clearInterrupt();
        this.clearStatusTimers();

        this.day = 1;
        this.dayPoints = 0;
        this.emailsProcessed = 0;
        this.inboxEmails = [];
        this.pendingArrivalEmails = [];
        this.selectedInboxIndex = -1;
        this.hasUnreadNotification = false;
        this.computerPanelOpen = false;
        this.filesPanelOpen = false;
        this.revealedEmails = new WeakSet<EmailCase>();
        this.captchaTriggeredEmails = new WeakSet<EmailCase>();
        this.interruptChanceMultiplier = 1;
        this.dayViolations = [];
        this.hideViolationNotice();
        this.showViolationLog(false);
        this.refreshViolationLogButton();

        const tutorialPlan: DayPlan = {
            day: 1,
            focus: "Example round. Sender, domain, topic, and attachment checks.",
            dailyRules: ["No special daily alerts during this example round."],
            emails: TUTORIAL_EMAILS,
        };
        this.rulebookPages = getRulebookPages(tutorialPlan);
        this.rulebookPageIndex = 0;
        this.refreshRulebook();

        this.tutorialEmailIndex = 0;
        this.tutorialPhase = "emails1";
        this.totalEmailsForDay = TUTORIAL_EMAILS.length;

        this.showTriageUI(true);
        this.showEndDayUI(false);
        this.showFinalUI(false);
        this.updatePanelVisibility();

        this.setStatusBar(
            "Example Round. Watch the prompts and follow each step.",
            "#2c271f",
        );

        this.refreshEmailPanel();
        this.refreshPowerupUI();
        this.refreshTopBar();
        this.refreshProgressText();

        this.time.delayedCall(400, () => {
            this.showTutorialPopup(TUTORIAL_POPUPS.email1, () =>
                this.deliverTutorialEmail(),
            );
        });
    }

    private deliverTutorialEmail() {
        if (
            !this.tutorialMode ||
            this.tutorialEmailIndex >= TUTORIAL_EMAILS.length
        ) {
            return;
        }

        const email = TUTORIAL_EMAILS[this.tutorialEmailIndex];
        this.inboxEmails.push(email);
        playOneShot(this, SOUND_KEYS.emailNoti, { volume: 0.2 });

        if (this.selectedInboxIndex < 0) {
            this.selectedInboxIndex = 0;
        }
        if (!this.computerPanelOpen) {
            this.hasUnreadNotification = true;
        }

        this.setStatusBar(
            `New email arrived. Inbox: ${this.inboxEmails.length}. Click the computer to review.`,
            "#7a2d25",
        );

        this.refreshDeskTextures();
        this.refreshProgressText();
        if (this.computerPanelOpen) {
            this.refreshEmailPanel();
            this.refreshPowerupUI();
        }
    }

    private advanceTutorialAfterClassification() {
        if (!this.tutorialMode) {
            return;
        }

        this.tutorialEmailIndex += 1;

        const queuePopup = (popup: TutorialPopup, onBegin: () => void) => {
            const statusDelay = Math.min(
                800,
                Math.max(0, this.feedbackHoldUntilMs - this.time.now),
            );
            const violationDelay = Math.max(
                0,
                this.violationNoticeHoldUntilMs - this.time.now,
            );
            const delay = Math.max(statusDelay, violationDelay, 600);
            this.time.delayedCall(delay, () => {
                if (!this.tutorialMode) return;
                this.showTutorialPopup(popup, onBegin);
            });
        };

        if (this.tutorialEmailIndex === 1) {
            queuePopup(TUTORIAL_POPUPS.email2, () =>
                this.deliverTutorialEmail(),
            );
            return;
        }

        if (this.tutorialEmailIndex === 2) {
            this.tutorialPhase = "awaiting-coworker";
            queuePopup(TUTORIAL_POPUPS.coworker, () => this.startInterrupt());
        }
    }

    private shouldForceZombieInterrupts() {
        return false;
    }

    private startInterruptRolls() {
        if (this.tutorialMode) {
            return;
        }

        this.interruptRollTimer = this.time.addEvent({
            delay: 5000,
            loop: true,
            callback: () => {
                if (!this.triageVisible || this.interruptActive) {
                    return;
                }
                if (this.shouldForceZombieInterrupts()) {
                    this.interruptChanceMultiplier *= 0.66;
                    this.startInterruptZombie();
                    return;
                }

                const f = Phaser.Math.FloatBetween(0, 1);
                const distractionScale =
                    getGameSettings().reducedDistractions ? 0.45 : 1;
                const zombieChance =
                    0.025 * this.interruptChanceMultiplier * distractionScale;
                const totalChance =
                    0.12 * this.interruptChanceMultiplier * distractionScale;
                if (f < zombieChance) {
                    this.interruptChanceMultiplier *= 0.66;
                    this.startInterruptZombie();
                } else if (f < totalChance) {
                    this.interruptChanceMultiplier *= 0.66;
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
        ensureLoopingSound(this, SOUND_KEYS.dudeNoise, { volume: 0.32 });

        this.dudeSprite.setTexture("desk-coworker");
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

    private startCaptchaInterrupt(startedFromAnswer = false) {
        if (!this.triageVisible || this.interruptActive) {
            return;
        }

        this.interruptActive = true;
        this.captchaActive = true;
        this.captchaStartedFromAnswer = startedFromAnswer;
        this.captchaCode = this.generateCaptchaCode();
        this.captchaInput = "";
        this.captchaTimeRemaining = 18;
        this.captchaPromptText.setText(
            startedFromAnswer ?
                "Verify before sending your answer."
            :   "Verify you're still human.",
        );

        if (startedFromAnswer) {
            this.filesPanelOpen = false;
        } else {
            this.computerPanelOpen = false;
            this.filesPanelOpen = false;
        }
        this.updatePanelVisibility();

        this.drawCaptchaCode();
        this.refreshCaptchaInput();
        this.refreshCaptchaTimer();
        this.setCaptchaVisible(true);
        playOneShot(this, SOUND_KEYS.emailNoti, { volume: 0.2 });
        if (startedFromAnswer) {
            this.setStatusBar(
                "Complete the CAPTCHA, then click your answer again.",
                "#5a4a32",
                { holdMs: 2200 },
            );
        }

        this.captchaTimer = this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                if (!this.captchaActive) {
                    return;
                }

                this.captchaTimeRemaining -= 1;
                this.refreshCaptchaTimer();

                if (this.captchaTimeRemaining <= 0) {
                    playOneShot(this, SOUND_KEYS.wrongBuzzer, {
                        volume: 0.55,
                    });
                    if (this.tutorialMode) {
                        this.setStatusBar(
                            "Out of time in the example. CAPTCHA will return during real shifts.",
                            "#7a2d25",
                            { holdMs: 2500 },
                        );
                        this.endCaptchaInterrupt();
                        return;
                    }
                    this.totalPoints -= 1;
                    this.dayPoints -= 1;
                    this.money -= 5;
                    this.refreshTopBar();
                    this.setStatusBar(
                        "CAPTCHA failed. Verification penalty: -1 point, -$5.",
                        "#7a2d25",
                        { holdMs: 2500 },
                    );
                    this.endCaptchaInterrupt();
                }
            },
        });
    }

    private generateCaptchaCode() {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let code = "";

        for (let i = 0; i < 6; i++) {
            code += chars[Phaser.Math.Between(0, chars.length - 1)];
        }

        return code;
    }

    private drawCaptchaCode() {
        this.clearCaptchaCodeText();
        this.captchaNoise.clear();

        this.captchaNoise.fillStyle(0x10281d, 1);
        this.captchaNoise.fillRect(306, 318, 412, 86);
        this.captchaNoise.lineStyle(2, 0x4d6a50, 0.9);
        this.captchaNoise.strokeRect(306, 318, 412, 86);

        for (let i = 0; i < 16; i++) {
            this.captchaNoise.lineStyle(
                Phaser.Math.Between(1, 3),
                Phaser.Utils.Array.GetRandom([0x6fb76b, 0x4d6a50, 0xf0d990]),
                Phaser.Math.FloatBetween(0.22, 0.5),
            );
            this.captchaNoise.beginPath();
            this.captchaNoise.moveTo(
                Phaser.Math.Between(320, 700),
                Phaser.Math.Between(326, 396),
            );
            this.captchaNoise.lineTo(
                Phaser.Math.Between(320, 700),
                Phaser.Math.Between(326, 396),
            );
            this.captchaNoise.strokePath();
        }

        const colors = ["#d8f1c7", "#8bcf7b", "#b8d9a8", "#f0d990"];
        for (let i = 0; i < this.captchaCode.length; i++) {
            const letter = this.add
                .text(
                    352 + i * 64,
                    Phaser.Math.Between(348, 368),
                    this.captchaCode[i],
                    {
                        fontFamily: "Dotemp-8bit",
                        fontSize: `${Phaser.Math.Between(34, 44)}px`,
                        color: Phaser.Utils.Array.GetRandom(colors),
                        stroke: "#07120d",
                        strokeThickness: 1,
                    },
                )
                .setOrigin(0.5)
                .setRotation(Phaser.Math.FloatBetween(-0.38, 0.38))
                .setScale(
                    Phaser.Math.FloatBetween(0.9, 1.15),
                    Phaser.Math.FloatBetween(0.85, 1.2),
                )
                .setDepth(63)
                .setVisible(this.captchaActive);
            this.captchaCodeTexts.push(letter);
        }
    }

    private clearCaptchaCodeText() {
        for (const textObject of this.captchaCodeTexts) {
            textObject.destroy();
        }
        this.captchaCodeTexts = [];
    }

    private refreshCaptchaInput() {
        const display = this.captchaInput.padEnd(6, "_").split("").join(" ");
        this.captchaInputText.setText(display);
    }

    private refreshCaptchaTimer() {
        this.captchaTimerText.setText(
            `Time remaining: ${this.captchaTimeRemaining}s`,
        );
    }

    private submitCaptcha() {
        if (!this.captchaActive) {
            return;
        }

        if (this.captchaInput === this.captchaCode) {
            this.setStatusBar("CAPTCHA passed. Back to work.", "#2f4b36", {
                holdMs: 1600,
            });
            this.endCaptchaInterrupt();
            return;
        }

        playOneShot(this, SOUND_KEYS.wrongBuzzer, { volume: 0.5 });
        this.captchaInput = "";
        this.refreshCaptchaInput();
        this.captchaHintText.setText("Incorrect. Type the code exactly.");
    }

    private setCaptchaVisible(visible: boolean) {
        this.captchaBg.setVisible(visible);
        this.captchaPanel.setVisible(visible);
        this.captchaTitleText.setVisible(visible);
        this.captchaPromptText.setVisible(visible);
        this.captchaNoise.setVisible(visible);
        this.captchaInputText.setVisible(visible);
        this.captchaTimerText.setVisible(visible);
        this.captchaHintText.setVisible(visible);
        for (const textObject of this.captchaCodeTexts) {
            textObject.setVisible(visible);
        }
    }

    private endCaptchaInterrupt() {
        const wasActive = this.captchaActive;
        const startedFromAnswer = this.captchaStartedFromAnswer;
        this.captchaActive = false;
        this.interruptActive = false;
        this.captchaStartedFromAnswer = false;
        this.captchaInput = "";
        this.captchaCode = "";
        this.captchaHintText.setText("Type the code, then press Enter.");
        this.captchaPromptText.setText("Verify you're still human.");

        if (this.captchaTimer) {
            this.captchaTimer.remove(false);
            this.captchaTimer = null;
        }

        this.setCaptchaVisible(false);
        this.captchaNoise.clear();
        this.clearCaptchaCodeText();

        if (wasActive && startedFromAnswer) {
            this.computerPanelOpen = true;
            this.filesPanelOpen = false;
            this.updatePanelVisibility();
            this.refreshEmailPanel();
            this.refreshPowerupUI();
        }

        if (wasActive && this.awaitingPlotInterruptEnd) {
            this.awaitingPlotInterruptEnd = false;
            this.scheduleNextEmailArrival();
            this.startInterruptRolls();
        }

        if (
            wasActive &&
            this.tutorialMode &&
            this.tutorialPhase === "awaiting-captcha"
        ) {
            this.tutorialPhase = "emails2";
            this.time.delayedCall(350, () => {
                if (!this.tutorialMode) return;
                this.setStatusBar(
                    "CAPTCHA complete. Now click your answer again.",
                    "#2f4b36",
                    { holdMs: 2200 },
                );
            });
        }
    }

    private playPinClick() {
        playOneShot(this, SOUND_KEYS.mouseClick, { volume: 0.45 });
    }

    private addPinDigit(digit: string) {
        this.playPinClick();
        if (this.inputPassword.length < 4) {
            this.inputPassword += digit;
            this.panelDisplay.setText(this.formatPassword(this.inputPassword));
        }
    }

    private deletePinDigit() {
        this.playPinClick();
        this.inputPassword = this.inputPassword.slice(0, -1);
        this.panelDisplay.setText(this.formatPassword(this.inputPassword));
    }

    private submitPin() {
        this.playPinClick();
        this.checkPassword();
    }

    private checkPassword() {
        console.log(this.inputPassword + " -> " + this.todaysPassword);
        if (this.inputPassword === this.todaysPassword) {
            this.inputPassword = "";
            this.panelDisplay.setVisible(false);
            this.panel.setVisible(false);
            this.button1.setVisible(false);
            this.button2.setVisible(false);
            this.button3.setVisible(false);
            this.button4.setVisible(false);
            this.button5.setVisible(false);
            this.button6.setVisible(false);
            this.button7.setVisible(false);
            this.button8.setVisible(false);
            this.button9.setVisible(false);
            this.buttonEnter.setVisible(false);
            this.buttonBackspace.setVisible(false);
            this.passwordCorrect = 1;
        } else {
            playOneShot(this, SOUND_KEYS.wrongBuzzer, { volume: 0.55 });
        }
    }

    private formatPassword(password: string) {
        return password.split("").join("-");
    }

    private startInterruptZombie() {
        console.log("Starting zombie interrupt");
        if (!this.triageVisible || this.interruptActive) {
            return;
        }
        console.log("Starting zombie interrupt2");

        this.interruptActive = true;
        this.clearZombieTimer();
        //ensureLoopingSound(this, SOUND_KEYS.zombieNoise, { volume: 0.32 });

        this.zombieSprite.setVisible(true);
        playOneShot(this, SOUND_KEYS.zombie, { volume: 0.6 });
        this.gunDoorClosedSprite.setVisible(true);
        this.gunDoorClosedSprite.setPosition(512, 384);
        this.computerPanelOpen = false;
        this.filesPanelOpen = false;
        this.updatePanelVisibility();
        this.gunDoorPanelZone.removeAllListeners("pointerdown");
        this.gunDoorPanelZone
            .setVisible(true)
            .setPosition(512, 384)
            .setInteractive();
        this.gunDoorPanelZone.once("pointerdown", () => {
            console.log("Gun door panel clicked");
            this.gunDoorPanelZone.disableInteractive();
            this.inputPassword = "";
            this.panelDisplay.setText("");
            this.panelDisplay.setVisible(true);
            this.panel.setVisible(true);
            this.button1.setVisible(true);
            this.button2.setVisible(true);
            this.button3.setVisible(true);
            this.button4.setVisible(true);
            this.button5.setVisible(true);
            this.button6.setVisible(true);
            this.button7.setVisible(true);
            this.button8.setVisible(true);
            this.button9.setVisible(true);
            this.buttonEnter.setVisible(true);
            this.buttonBackspace.setVisible(true);
        });

        let timeRemaining = 20;
        this.zombieTimerText = this.add
            .text(592, 30, `Time: ${timeRemaining}s`, {
                fontFamily: "Dotemp-8bit",
                fontSize: "24px",
                color: "#ff0000",
            })
            .setOrigin(0.5)
            .setDepth(100);

        this.zombieCountdownTimer = this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                if (!this.interruptActive) {
                    this.clearZombieTimer();
                    return;
                }
                timeRemaining--;
                this.zombieTimerText?.setText(`Time: ${timeRemaining}s`);
                if (timeRemaining <= 0) {
                    playOneShot(this, SOUND_KEYS.wrongBuzzer, { volume: 0.55 });
                    if (this.tutorialMode) {
                        this.setStatusBar(
                            "Out of time in the example. We'll skip ahead - remember the steps for the real shift.",
                            "#7a2d25",
                        );
                        this.endInterruptZombie();
                        return;
                    }
                    const message = "You have been Infected!";
                    this.endInterruptZombie();
                    this.showEnding("Game Over", message);
                }
            },
        });
        this.interruptTick = this.time.addEvent({
            delay: 120,
            loop: true,
            callback: () => {
                if (!this.interruptActive) {
                    return;
                }
                if (this.passwordCorrect === 1) {
                    this.passwordCorrect = 0;
                    this.gunDoorClosedSprite.setVisible(false);
                    this.gunDoorOpenSprite.setVisible(true);
                    this.gunZone.removeAllListeners("pointerdown");
                    this.gunZone.setVisible(true).setInteractive();
                    this.gunZone.once("pointerdown", () => {
                        this.gunZone.disableInteractive();
                        this.gunDoorOpenSprite.setVisible(false);
                        this.gunZone.setVisible(false);
                        this.gunTakenSprite.setVisible(true);
                        this.crosshair.setVisible(true);
                        this.crosshair.setPosition(
                            this.input.activePointer.worldX,
                            this.input.activePointer.worldY,
                        );
                        this.input.off(
                            "pointermove",
                            this.updateCrosshairPosition,
                        );
                        this.input.on(
                            "pointermove",
                            this.updateCrosshairPosition,
                        );
                        this.zombieZone.removeAllListeners("pointerdown");
                        this.zombieZone.setVisible(true).setInteractive();
                        this.zombieZone.once("pointerdown", () => {
                            playOneShot(this, SOUND_KEYS.shot, {
                                volume: 0.35,
                            });
                            this.zombieZone.disableInteractive();
                            this.endInterruptZombie();
                        });
                    });
                }
            },
        });
    }

    private startPlotInterrupt(saying: string) {
        if (!this.triageVisible) {
            return;
        }

        this.interruptActive = true;
        this.isPlotInterrupt = true;
        playOneShot(this, SOUND_KEYS.hey, { volume: 0.6 });

        this.dudeSprite.setTexture("desk-dude");
        this.dudeSprite.setVisible(true);
        this.plotDialogPanel.setVisible(true);
        this.plotDialogAccent.setVisible(true);
        this.dudePlotText.setText(saying).setVisible(true);
        this.plotDialogOkButton.setVisible(true);

        this.computerPanelOpen = false;
        this.filesPanelOpen = false;
        this.updatePanelVisibility();
    }

    private refreshInterruptBar() {
        const maxWidth = 700;
        const width = Math.max(6, maxWidth * this.interruptProgress);
        this.interruptBarFill.setDisplaySize(width, 30);
    }

    private endInterrupt() {
        this.interruptActive = false;
        this.isPlotInterrupt = false;
        stopSound(this, SOUND_KEYS.dudeNoise);
        this.dudeSprite.setVisible(false);
        this.interruptBarBg.setVisible(false);
        this.interruptBarFill.setVisible(false);
        this.interruptText.setVisible(false);
        this.plotDialogPanel.setVisible(false);
        this.plotDialogAccent.setVisible(false);
        this.dudePlotText.setVisible(false);
        this.plotDialogOkButton.setVisible(false);

        if (this.interruptTick) {
            this.interruptTick.remove(false);
            this.interruptTick = null;
        }

        if (this.awaitingPlotInterruptEnd) {
            this.awaitingPlotInterruptEnd = false;
            this.scheduleNextEmailArrival();
            this.startInterruptRolls();
        }

        if (this.tutorialMode && this.tutorialPhase === "awaiting-coworker") {
            this.tutorialPhase = "awaiting-zombie";
            this.time.delayedCall(900, () => {
                if (!this.tutorialMode) return;
                this.showTutorialPopup(TUTORIAL_POPUPS.zombie, () =>
                    this.startInterruptZombie(),
                );
            });
        }
    }

    private endInterruptZombie() {
        const wasActive = this.interruptActive;
        this.interruptActive = false;
        //stopSound(this, SOUND_KEYS.zombieNoise);
        this.clearZombieTimer();
        if (this.interruptTick) {
            this.interruptTick.remove(false);
            this.interruptTick = null;
        }
        this.zombieSprite.setVisible(false);
        this.gunDoorClosedSprite.setVisible(false);
        this.gunDoorOpenSprite.setVisible(false);
        this.gunDoorPanelZone.setVisible(false);
        this.gunDoorPanelZone.disableInteractive();
        this.gunZone.setVisible(false);
        this.gunZone.disableInteractive();
        this.zombieZone.setVisible(false);
        this.zombieZone.disableInteractive();
        this.gunTakenSprite.setVisible(false);
        this.crosshair.setVisible(false);
        this.panelDisplay.setVisible(false);
        this.panel.setVisible(false);
        this.button1.setVisible(false);
        this.button2.setVisible(false);
        this.button3.setVisible(false);
        this.button4.setVisible(false);
        this.button5.setVisible(false);
        this.button6.setVisible(false);
        this.button7.setVisible(false);
        this.button8.setVisible(false);
        this.button9.setVisible(false);
        this.buttonEnter.setVisible(false);
        this.buttonBackspace.setVisible(false);
        this.input.off("pointermove", this.updateCrosshairPosition);

        if (
            wasActive &&
            this.tutorialMode &&
            this.tutorialPhase === "awaiting-zombie"
        ) {
            this.tutorialPhase = "awaiting-captcha";
            this.time.delayedCall(1400, () => {
                if (!this.tutorialMode) return;
                this.showTutorialPopup(TUTORIAL_POPUPS.email3, () =>
                    this.deliverTutorialEmail(),
                );
            });
        }
    }

    private clearZombieTimer() {
        if (this.zombieCountdownTimer) {
            this.zombieCountdownTimer.remove(false);
            this.zombieCountdownTimer = null;
        }
        if (this.zombieTimerText) {
            this.zombieTimerText.destroy();
            this.zombieTimerText = null;
        }
    }

    private clearInterrupt() {
        stopSound(this, SOUND_KEYS.dudeNoise);
        if (this.interruptRollTimer) {
            this.interruptRollTimer.remove(false);
            this.interruptRollTimer = null;
        }
        if (this.interruptTick) {
            this.interruptTick.remove(false);
            this.interruptTick = null;
        }
        this.interruptActive = false;
        this.isPlotInterrupt = false;
        this.awaitingPlotInterruptEnd = false;
        this.clearZombieTimer();

        this.dudeSprite.setVisible(false);
        this.interruptBarBg.setVisible(false);
        this.interruptBarFill.setVisible(false);
        this.interruptText.setVisible(false);
        this.plotDialogPanel.setVisible(false);
        this.plotDialogAccent.setVisible(false);
        this.dudePlotText.setVisible(false);
        this.plotDialogOkButton.setVisible(false);
        this.endCaptchaInterrupt();
        this.endInterruptZombie();
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
            playOneShot(this, SOUND_KEYS.emailNoti, { volume: 0.2 });
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

        if (this.feedbackAlertTween) {
            this.feedbackAlertTween.stop();
            this.feedbackAlertTween = null;
        }

        if (this.violationNoticeTimer) {
            this.violationNoticeTimer.remove(false);
            this.violationNoticeTimer = null;
        }

        this.feedbackHoldUntilMs = 0;
        this.violationNoticeHoldUntilMs = 0;
    }

    private setStatusBar(
        message: string,
        color: string,
        options: {
            holdMs?: number;
            waitForHold?: boolean;
            alert?: boolean;
        } = {},
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

        this.setFeedbackBarAlert(options.alert === true);
        this.feedbackText.setText(message).setColor(color);
        this.feedbackHoldUntilMs =
            options.holdMs && options.holdMs > 0 ?
                this.time.now + options.holdMs
            :   0;
    }

    private setFeedbackBarAlert(alert: boolean) {
        if (this.feedbackAlertTween) {
            this.feedbackAlertTween.stop();
            this.feedbackAlertTween = null;
        }

        this.feedbackBar.setAlpha(1);

        if (alert) {
            this.feedbackBar
                .setPosition(512, 158)
                .setSize(920, 76)
                .setFillStyle(0xf4d2c8, 1)
                .setStrokeStyle(3, 0xa83328);
            this.feedbackText.setPosition(74, 128).setStyle({
                fontSize: "17px",
                wordWrap: { width: 860 },
                lineSpacing: 4,
            });
            this.feedbackAlertTween = this.tweens.add({
                targets: this.feedbackBar,
                alpha: 0.45,
                duration: 90,
                yoyo: true,
                repeat: 3,
                onComplete: () => {
                    this.feedbackBar.setAlpha(1);
                    this.feedbackAlertTween = null;
                },
            });
            return;
        }

        this.feedbackBar
            .setPosition(512, 144)
            .setSize(920, 42)
            .setFillStyle(0xf0e4c4, 0.97)
            .setStrokeStyle(2, 0x7a6030);
        this.feedbackText.setPosition(74, 130).setStyle({
            fontSize: "20px",
            wordWrap: { width: 860 },
            lineSpacing: 4,
        });
    }

    private recordViolation(email: EmailCase): DayViolation {
        const violation = {
            index: this.dayViolations.length + 1,
            from: email.from,
            domain: email.domain,
            subject: email.subject,
            correctType: email.type,
            reason: this.getMistakeReason(email),
        };

        this.dayViolations.push(violation);
        return violation;
    }

    private showViolationNotice(violation: DayViolation) {
        if (this.violationNoticeTimer) {
            this.violationNoticeTimer.remove(false);
        }

        this.showViolationLog(false);
        this.refreshViolationLogButton();
        this.violationNoticeTitle.setText(`Violation ${violation.index}`);
        this.violationNoticeFromText.setText(
            `From: ${violation.from} <${violation.domain}>\nSubject: ${violation.subject}`,
        );
        this.violationNoticeReasonText.setText(
            `Correct answer: ${this.formatEmailType(violation.correctType)}\nReason: ${violation.reason}`,
        );
        this.setViolationNoticeVisible(true);
        this.violationNoticeHoldUntilMs =
            this.time.now + this.classificationFeedbackHoldMs;

        this.tweens.add({
            targets: this.violationNoticePanel,
            alpha: 0.55,
            duration: 90,
            yoyo: true,
            repeat: 3,
            onComplete: () => {
                this.violationNoticePanel.setAlpha(1);
            },
        });

        this.violationNoticeTimer = this.time.delayedCall(
            this.classificationFeedbackHoldMs,
            () => {
                this.violationNoticeTimer = null;
                this.hideViolationNotice();
            },
        );
    }

    private hideViolationNotice() {
        this.setViolationNoticeVisible(false);
        this.violationNoticeHoldUntilMs = 0;
        this.refreshViolationLogButton();
    }

    private setViolationNoticeVisible(visible: boolean) {
        this.violationNoticeBg.setVisible(visible);
        this.violationNoticePanel.setVisible(visible);
        this.violationNoticeTitle.setVisible(visible);
        this.violationNoticeFromText.setVisible(visible);
        this.violationNoticeReasonText.setVisible(visible);
    }

    private showViolationLog(visible: boolean) {
        const shouldShow = visible && this.dayViolations.length > 0;
        this.violationLogBg.setVisible(shouldShow);
        this.violationLogPanel.setVisible(shouldShow);
        this.violationLogTitle.setVisible(shouldShow);
        this.violationLogBody.setVisible(shouldShow);
        this.violationLogCloseButton.setVisible(shouldShow);

        if (shouldShow) {
            this.violationLogBody.setText(this.formatViolationLog());
        }

        this.refreshViolationLogButton();
    }

    private refreshViolationLogButton() {
        const noticeVisible = this.violationNoticeBg.visible;
        const logVisible = this.violationLogBg.visible;
        const hasViolations = this.dayViolations.length > 0;
        const shouldShow = this.triageVisible && !noticeVisible && !logVisible;

        this.violationLogButton
            .setVisible(shouldShow)
            .setAlpha(hasViolations ? 1 : 0.45)
            .setStyle({
                backgroundColor: hasViolations ? "#7a3e36" : "#5f6359",
            });

        if (shouldShow && hasViolations) {
            this.violationLogButton.setInteractive({ useHandCursor: true });
        } else {
            this.violationLogButton.disableInteractive();
        }
    }

    private formatViolationLog() {
        return this.dayViolations
            .map((violation) => {
                const reason = this.truncateForLog(violation.reason, 82);
                return `${violation.index}. ${violation.from} <${violation.domain}> - ${this.formatEmailType(
                    violation.correctType,
                )}: ${reason}`;
            })
            .join("\n");
    }

    private truncateForLog(text: string, maxLength: number) {
        if (text.length <= maxLength) {
            return text;
        }

        return `${text.slice(0, maxLength - 3)}...`;
    }

    private formatEmailType(type: EmailType) {
        return type === "valid" ? "Valid" : "Phishing";
    }

    private scheduleFinishDayAfterStatusHold() {
        if (this.dayFinishTimer) {
            this.dayFinishTimer.remove(false);
        }

        const statusDelay = Math.min(
            800,
            Math.max(0, this.feedbackHoldUntilMs - this.time.now),
        );
        const violationDelay = Math.max(
            0,
            this.violationNoticeHoldUntilMs - this.time.now,
        );
        const delay = Math.max(statusDelay, violationDelay);
        this.dayFinishTimer = this.time.delayedCall(delay, () => {
            this.dayFinishTimer = null;
            this.finishDay();
        });
    }

    private refreshEmailPanel() {
        const inboxCount = this.inboxEmails.length;

        if (inboxCount === 0) {
            this.emailPanelTitle.setText("EMAIL MONITOR");
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
        this.emailPanelTitle.setText("EMAIL MONITOR");
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
        const hint = this.getHintForEmail(currentEmail);
        this.feedbackText.setText(`Hint: ${hint}`).setColor("#5a4a32");
        this.refreshPowerupUI();
    }

    private getHintForEmail(email: EmailCase): string {
        const v = (email.violations[0] ?? "").toLowerCase();

        if (
            v.includes(".exe") ||
            v.includes(".zip") ||
            v.includes(".pdf") ||
            (v.includes("attachment") && !v.includes("does not match"))
        ) {
            return "Check what types of attachments are allowed right now.";
        }
        if (
            v.includes("attachment does not match") ||
            v.includes("attachment")
        ) {
            return "Does the attached file actually relate to what the email says?";
        }
        if (v.includes("maps to") || v.includes("username does not match")) {
            return "Look closely at whether the sender name matches the email address.";
        }
        if (v.includes("subject and body") || v.includes("subject/body")) {
            return "Read the subject line and the body - are they about the same thing?";
        }
        if (
            v.includes("does not normally send") ||
            v.includes("topic from wrong")
        ) {
            return "Think about what topics this company normally handles.";
        }
        if (v.includes("does not work at")) {
            return "Check whether this person actually works at that company.";
        }
        if (v.includes("blocked")) {
            return "Review today's rules - there may be a restriction you're missing.";
        }
        if (v.includes("domain") || v.includes("approved")) {
            return "Look carefully at the domain in the sender's address.";
        }
        if (
            v.includes("credential") ||
            v.includes("verification") ||
            v.includes("urgent")
        ) {
            return "Be cautious of emails that pressure you to confirm or verify something.";
        }
        if (v.includes("weather") || v.includes("banned word")) {
            return "Check today's special topic restrictions in the rulebook.";
        }

        return "Review the sender, domain, attachments, and today's special rules.";
    }

    private getMistakeReason(email: EmailCase): string {
        const violation = email.violations[0] ?? "";
        const v = violation.toLowerCase();

        if (!violation) {
            return "It matched the sender, domain, topic, and attachment rules.";
        }
        if (v.includes("username does not match")) {
            return "The sender name did not match the email address username.";
        }
        if (v.includes("maps to")) {
            return "That username belongs to a different employee.";
        }
        if (v.includes(".exe")) {
            return "The attachment was an .exe file, which is always banned.";
        }
        if (v.includes(".zip")) {
            return "The attachment was a .zip file, which is always banned.";
        }
        if (v.includes(".pdf")) {
            return "PDF attachments are banned by today's rules.";
        }
        if (v.includes("attachment does not match")) {
            return "The attachment did not match the email subject or body.";
        }
        if (v.includes("subject and body")) {
            return "The subject and body were about different topics.";
        }
        if (v.includes("not an approved")) {
            return "The sender used a domain that is not approved for that company.";
        }
        if (v.includes("does not work at")) {
            return "That person does not work at the company in the address.";
        }
        if (v.includes("blocked") || v.includes("restricted")) {
            return "Today's rules say this sender or company is blocked.";
        }
        if (v.includes("topic from wrong")) {
            return "That topic belongs to a different company category today.";
        }
        if (v.includes("credential") || v.includes("verification")) {
            return "It asked for credentials or account verification.";
        }
        if (v.includes("weather") || v.includes("banned word")) {
            return "Today's rules block that subject or topic.";
        }

        const cutoff = violation.indexOf("Expected:");
        return cutoff > 0 ?
                violation.slice(0, cutoff).trim().replace(/\.$/, "")
            :   violation.replace(/\.$/, "");
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

    private shouldTriggerCaptchaForAnswer(email: EmailCase) {
        if (this.captchaTriggeredEmails.has(email)) {
            return false;
        }

        if (this.tutorialMode) {
            return this.tutorialPhase === "awaiting-captcha";
        }

        const distractionScale =
            getGameSettings().reducedDistractions ? 0.45 : 1;
        return (
            Phaser.Math.FloatBetween(0, 1) <
            this.captchaAnswerChance * distractionScale
        );
    }

    private startAnswerCaptchaIfNeeded(email: EmailCase) {
        if (!this.shouldTriggerCaptchaForAnswer(email)) {
            return false;
        }

        this.captchaTriggeredEmails.add(email);
        this.startCaptchaInterrupt(true);
        return true;
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

        if (this.startAnswerCaptchaIfNeeded(currentEmail)) {
            return;
        }

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
            playOneShot(this, SOUND_KEYS.correctDing, { volume: 0.5 });
            this.totalPoints += 1;
            this.money += 5;
            this.dayPoints += 1;
            this.setStatusBar("Correct classification: +1 point.", "#1f5c35", {
                holdMs: this.classificationFeedbackHoldMs,
            });
        } else if (this.shieldActive) {
            playOneShot(this, SOUND_KEYS.wrongBuzzer, { volume: 0.55 });
            this.shieldActive = false;
            const violation = this.recordViolation(currentEmail);
            this.showViolationNotice(violation);
            this.setStatusBar(
                `Shield absorbed violation ${violation.index}. Review the notice.`,
                "#5a4a32",
                { holdMs: this.classificationFeedbackHoldMs },
            );
        } else {
            playOneShot(this, SOUND_KEYS.wrongBuzzer, { volume: 0.45 });
            const violation = this.recordViolation(currentEmail);
            this.showViolationNotice(violation);
            this.totalPoints -= 1;
            this.dayPoints -= 1;
            this.money -= 5;
            this.setStatusBar(
                `Violation ${violation.index} recorded: -1 point.`,
                "#7a2d25",
                { holdMs: this.classificationFeedbackHoldMs },
            );
        }

        if (currentEmail.plotEmail) {
            if (choice === "valid") {
                this.plotEmailsAccepted++;
            } else {
                this.plotEmailsRejected++;
            }
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
        } else {
            this.advanceTutorialAfterClassification();
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
        const { position, total } = this.getRulebookSectionPosition(page);
        this.rulebookPageText.setText(
            `${page.title} - Page ${position}/${total}`,
        );
        this.rulebookBodyText.setText(page.body);
        this.refreshRulebookControls(page);
    }

    private getRulebookSectionPosition(page: RulebookPage) {
        if (page.companyIndex !== undefined) {
            const companyPages = this.rulebookPages.filter(
                (p) => p.companyIndex !== undefined,
            );
            return {
                position: page.companyIndex + 1,
                total: companyPages.length,
            };
        }
        if (page.title === `Day ${this.day} Alerts`) {
            return { position: 1, total: 1 };
        }
        const coreTitles = ["Core Rules", "Core Rules: Content"];
        const corePages = this.rulebookPages.filter((p) =>
            coreTitles.includes(p.title),
        );
        const position = corePages.findIndex((p) => p.title === page.title) + 1;
        return { position, total: corePages.length };
    }

    private refreshRulebookControls(page: RulebookPage) {
        const isCore = page.title === "Core Rules";
        const isContent = page.title === "Core Rules: Content";
        const isToday = page.title === `Day ${this.day} Alerts`;
        const isRoster = page.companyIndex !== undefined;

        this.rulebookCoreButton.setAlpha(isCore ? 1 : 0.72);
        this.rulebookRosterButton.setAlpha(isContent ? 1 : 0.72);
        this.rulebookTodayButton.setAlpha(isToday ? 1 : 0.72);

        this.companyRuleButtons.forEach((button, index) => {
            button
                .setVisible(this.filesPanelOpen)
                .setAlpha(page.companyIndex === index ? 1 : 0.72);
        });

        this.rulebookCompanyLabelText.setAlpha(isRoster ? 1 : 0.72);
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
        this.emailCloseXText.setVisible(showComputerPanel);
        this.rulesCloseXText.setVisible(showFilesPanel);
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
        this.rulebookCompanyLabelText.setVisible(showFilesPanel);
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

        if (this.tutorialMode) {
            this.tutorialPhase = "done";
            localStorage.setItem("tutorialCompleted", "true");
            this.startSceneAfterFade("MainMenu");
            return;
        }

        const dayPay = this.dayPoints * 5;
        this.refreshTopBar();

        this.showTriageUI(false);

        if (this.day >= MAX_DAYS) {
            this.showPlotEnding();
            return;
        }

        this.showEndDayUI(true);

        this.endDayTitle.setText("Supply Window Open");
        this.endDayPromptText.setText(
            `Day ${this.day} shift complete. Stop by shop before next round.`,
        );
        this.endDaySummary.setText(
            "END-OF-SHIFT RECEIPT\n\n" +
                `Day ${this.day} points: ${this.dayPoints}\n` +
                `Payout posted: $${dayPay}\n` +
                `Wallet balance: $${this.money}`,
        );

        this.feedbackText
            .setText(
                "Shift ended. Enter the shop to pay essentials and buy powerups.",
            )
            .setColor("#f4ecd8");
    }

    private enterShop() {
        this.startSceneAfterFade("Shop", {
            day: this.day,
            money: this.money,
            totalPoints: this.totalPoints,
            daysWithoutRent: this.daysWithoutRent,
            hintCount: this.hintCount,
            revealCount: this.revealCount,
            plotEmailsAccepted: this.plotEmailsAccepted,
            plotEmailsRejected: this.plotEmailsRejected,
        });
    }

    private startSceneAfterFade(sceneKey: string, data?: object) {
        this.cameras.main.fadeOut(250, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
            // Keep the screen black between scenes; avoids a 1-frame flash
            // where UI can reappear after the fade effect completes.
            this.cameras.main.setVisible(false);
            this.scene.start(sceneKey, data);
        });
    }

    private showPlotEnding() {
        let endingType: 1 | 2 | 3;

        if (this.plotEmailsAccepted === 7) {
            endingType = 1;
        } else if (this.plotEmailsRejected === 7) {
            endingType = 2;
        } else {
            endingType = 3;
        }

        stopSound(this, SOUND_KEYS.dudeNoise);
        stopSound(this, SOUND_KEYS.fanAudio);
        clearSavedRun();
        this.scene.start("Ending", { endingType });
    }

    private showEnding(title: string, message: string) {
        stopSound(this, SOUND_KEYS.dudeNoise);
        clearSavedRun();
        this.showTriageUI(false);
        this.showEndDayUI(false);
        this.showFinalUI(true);

        this.finalTitle.setText(title);
        this.finalSummary.setText(`${message}\n\nPress Restart to play again.`);
        this.feedbackText.setText("");
    }

    private refreshTopBar() {
        this.headerText.setText(
            this.tutorialMode ?
                "Email Inspector - Example Round"
            :   `Email Inspector - Day ${this.day}/${MAX_DAYS}`,
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
            this.showViolationLog(false);
            this.hideViolationNotice();
        }

        this.updatePanelVisibility();
        this.refreshDeskTextures();
        this.refreshViolationLogButton();

        if (!visible) {
            this.clearInterrupt();
        }
    }

    private showEndDayUI(visible: boolean) {
        this.endScreenBg.setVisible(visible);
        for (const frameObject of this.endDayShopFrame) {
            frameObject.setVisible(visible);
        }
        this.endDayTitle.setVisible(visible);
        this.endDayPromptText.setVisible(visible);
        this.endDaySummary.setVisible(visible);
        this.endDayViolationButton.setVisible(
            visible && this.dayViolations.length > 0,
        );
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
