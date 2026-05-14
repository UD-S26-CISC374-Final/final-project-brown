import { Scene } from "phaser";

///import { playOneShot, SOUND_KEYS } from "../audio";
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

    private computerPanelBg!: Phaser.GameObjects.Rectangle;
    private emailPanelTitle!: Phaser.GameObjects.Text;
    private fromText!: Phaser.GameObjects.Text;
    private subjectText!: Phaser.GameObjects.Text;
    private domainText!: Phaser.GameObjects.Text;
    private contentLabelText!: Phaser.GameObjects.Text;
    private contentText!: Phaser.GameObjects.Text;
    private attachmentText!: Phaser.GameObjects.Text;
    private emailSwitchText!: Phaser.GameObjects.Text;
    private previousEmailButton!: Phaser.GameObjects.Text;
    private nextEmailButton!: Phaser.GameObjects.Text;
    private currentEmailIndex = 0;




    constructor() {
        super("LevelReviewScene");
    }

    init(data: LevelReviewSceneData) {
        this.day = data.day ?? 1;
        this.totalPoints = data.totalPoints ?? 0;
        this.money = data.money ?? 0;
        this.daysWithoutRent = data.daysWithoutRent ?? 0;
        this.hintCount = data.hintCount ?? 0;
        this.revealCount = data.revealCount ?? 0;
    }
}

/*   create() {
       this.cameras.main.setBackgroundColor(0x74736d);

       this.computerPanelBg = this.add.rectangle(512, 384, 900, 700, 0x211d17)
           .setStrokeStyle(4, 0xf8f0dc)
           .setDepth(15)
           .setVisible(this.missedEmailsArray.length > 0);

       this.emailPanelTitle = this.add.text(512, 150, "Missed Emails", {
           fontFamily: "Pix32",
           fontSize: 36,
           color: "#f8f0dc",
           stroke: "#211d17",
           strokeThickness: 2,
           backgroundColor: "#44624c",
           padding: { left: 20, right: 20, top: 10, bottom: 10 },
           align: "center",
       })
           .setOrigin(0.5)
           .setDepth(16)
           .setVisible(this.missedEmailsArray.length > 0);

       this.emailSwitchText = this.add.text(512, 650, "Use ← → to switch between missed emails", {
           fontFamily: "Pix32",
           fontSize: 20,
           color: "#f8f0dc",
           stroke: "#211d17",
           strokeThickness: 1,
           backgroundColor: "#44624c",
           padding: { left: 15, right: 15, top: 8, bottom: 8 },
           align: "center",
       })
           .setOrigin(0.5)
           .setDepth(16)
           .setVisible(this.missedEmailsArray.length > 0);

       this.previousEmailButton = this.add.text(300, 384, "← Previous", {
           fontFamily: "Pix32",
           fontSize: 24,
           color: "#f8f0dc",
           stroke: "#211d17",
           strokeThickness: 1,
           backgroundColor: "#44624c",
           padding: { left: 20, right: 20, top: 10, bottom: 10 },
           align: "center",
       })
           .setOrigin(0.5)
           .setDepth(16)
           .setInteractive({ useHandCursor: true })
           .on("pointerover", () => {
               this.previousEmailButton.setStyle({ backgroundColor: "#53755b" });
               this.previousEmailButton.setScale(1.03);
           })
           .on("pointerout", () => {
               this.previousEmailButton.setStyle({ backgroundColor: "#44624c" });
               this.previousEmailButton.setScale(1);
           })
           .on("pointerdown", () => {
               playOneShot(this, SOUND_KEYS.mouseClick, { volume: 0.45 });
               this.showPreviousEmail();
           })
           .setVisible(this.missedEmailsArray.length > 0);


       this.nextEmailButton = this.add.text(724, 384, "Next →", {
           fontFamily: "Pix32",
           fontSize: 24,
           color: "#f8f0dc",
           stroke: "#211d17",
           strokeThickness: 1,
           backgroundColor: "#44624c",
           padding: { left: 20, right: 20, top: 10, bottom: 10 },
           align: "center",
       })
           .setOrigin(0.5)
           .setDepth(16)
           .setInteractive({ useHandCursor: true })
           .on("pointerover", () => {
               this.nextEmailButton.setStyle({ backgroundColor: "#53755b" });
               this.nextEmailButton.setScale(1.03);
           })
           .on("pointerout", () => {
               this.nextEmailButton.setStyle({ backgroundColor: "#44624c" });
               this.nextEmailButton.setScale(1);
           })
           .on("pointerdown", () => {
               playOneShot(this, SOUND_KEYS.mouseClick, { volume: 0.45 });
               this.showNextEmail();
           })
           .setVisible(this.missedEmailsArray.length > 0);

       this.fromText = this.add.text(200, 250, "", {
           fontFamily: "Pix32",
           fontSize: 24,
           color: "#f8f0dc",
           stroke: "#211d17",
           strokeThickness: 1,
           backgroundColor: "#44624c",
           padding: { left: 15, right: 15, top: 8, bottom: 8 },
           align: "left",
       })
           .setOrigin(0, 0)
           .setDepth(16)
           .setVisible(this.missedEmailsArray.length > 0);


       this.subjectText = this.add.text(200, 290, "", {
           fontFamily: "Pix32",
           fontSize: 24,
           color: "#f8f0dc",
           stroke: "#211d17",
           strokeThickness: 1,
           backgroundColor: "#44624c",
           padding: { left: 15, right: 15, top: 8, bottom: 8 },
           align: "left",
       })
           .setOrigin(0, 0)
           .setDepth(16)
           .setVisible(this.missedEmailsArray.length > 0);


       this.domainText = this.add.text(200, 330, "", {
           fontFamily: "Pix32",
           fontSize: 24,
           color: "#f8f0dc",
           stroke: "#211d17",
           strokeThickness: 1,
           backgroundColor: "#44624c",
           padding: { left: 15, right: 15, top: 8, bottom: 8 },
           align: "left",
       })
           .setOrigin(0, 0)
           .setDepth(16)
           .setVisible(this.missedEmailsArray.length > 0);


       this.contentLabelText = this.add.text(200, 370, "Content:", {
           fontFamily: "Pix32",
           fontSize: 24,
           color: "#f8f0dc",
           stroke: "#211d17",
           strokeThickness: 1,
           backgroundColor: "#44624c",

           padding: { left: 15, right: 15, top: 8, bottom: 8 },
           align: "left",
       })
           .setOrigin(0, 0)
           .setDepth(16)
           .setVisible(this.missedEmailsArray.length > 0);

       this.contentText = this.add.text(200, 410, "", {
           fontFamily: "Pix32",
           fontSize: 20,
           color: "#f8f0dc",
           stroke: "#211d17",
           strokeThickness: 1,
           backgroundColor: "#44624c",
           padding: { left: 15, right: 15, top: 8, bottom: 8 },
           align: "left",
           wordWrap: { width: 600 },
       })
           .setOrigin(0, 0)
           .setDepth(16)
           .setVisible(this.missedEmailsArray.length > 0);



       this.attachmentText = this.add.text(200, 550, "", {
           fontFamily: "Pix32",
           fontSize: 20,
           color: "#f8f0dc",
           stroke: "#211d17",
           strokeThickness: 1,
           backgroundColor: "#44624c",
           padding: { left: 15, right: 15, top: 8, bottom: 8 },
           align: "left",
       })
           .setOrigin(0, 0)
           .setDepth(16)
           .setVisible(this.missedEmailsArray.length > 0);

       this.attachmentText = this.add.text(200, 550, "", {
           fontFamily: "Pix32",
           fontSize: 20,
           color: "#f8f0dc",
           stroke: "#211d17",
           strokeThickness: 1,
           backgroundColor: "#44624c",
           padding: { left: 15, right: 15, top: 8, bottom: 8 },
           align: "left",
       })
           .setOrigin(0, 0)
           .setDepth(16)
           .setVisible(this.missedEmailsArray.length > 0);

       
       this.add.rectangle(512, 384, 900, 700, 0x1b3022, 1)
           .setStrokeStyle(2, 0xb5953c)
           .setDepth(15)
           .setVisible(this.missedEmailsArray.length === 0);
       this.add.rectangle(512, 384, 880, 680, 0xd4a830, 0.9)
           .setDepth(15)
           .setVisible(this.missedEmailsArray.length === 0);
       this.add.rectangle(512, 384, 860, 660, 0xf8f0dc, 0.7)
           .setStrokeStyle(1, 0xd0bd84)
           .setDepth(15)
           .setVisible(this.missedEmailsArray.length === 0);
       this.add.rectangle(512, 384, 840, 640, 0x44624c, 0.5)
           .setDepth(15)
           .setVisible(this.missedEmailsArray.length === 0);


       const mainMenuButton = this.add
           .text(100, 100, "Main Menu", {
               fontFamily: "Pix32",
               fontSize: 32,
               color: "#f8f0dc",
               stroke: "#211d17",
               strokeThickness: 1,
               backgroundColor: "#44624c",
               padding: { left: 30, right: 30, top: 12, bottom: 12 },
               align: "center",
           })
           .setOrigin(0.5)
           .setDepth(100)
           .setInteractive({ useHandCursor: true })
           .on("pointerover", () => {
               mainMenuButton.setStyle({ backgroundColor: "#53755b" });
               mainMenuButton.setScale(1.03);
           })
           .on("pointerout", () => {
               mainMenuButton.setStyle({ backgroundColor: "#44624c" });
               mainMenuButton.setScale(1);
           })
           .on("pointerdown", () => {
               playOneShot(this, SOUND_KEYS.mouseClick, { volume: 0.45 });
               this.scene.start("MainMenu");
           });

       const continueToShopButton = this.add
           .text(200, 200, "Continue to Shop", {
               fontFamily: "Pix32",
               fontSize: 32,
               color: "#f8f0dc",
               stroke: "#211d17",
               strokeThickness: 1,
               backgroundColor: "#44624c",
               padding: { left: 30, right: 30, top: 12, bottom: 12 },
               align: "center",
           })
           .setOrigin(0.5)
           .setDepth(100)
           .setInteractive({ useHandCursor: true })
           .on("pointerover", () => {
               continueToShopButton.setStyle({ backgroundColor: "#53755b" });
               continueToShopButton.setScale(1.03);
           })
           .on("pointerout", () => {
               continueToShopButton.setStyle({ backgroundColor: "#44624c" });
               continueToShopButton.setScale(1);
           })
           .on("pointerdown", () => {
               playOneShot(this, SOUND_KEYS.mouseClick, { volume: 0.45 });
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
           });
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
           button.setScale(1.05);
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

   private refreshEmailPanel() {
       const count = this.missedEmailsArray.length;

       if (count === 0) return;

       if (this.selectedEmailIndex < 0 || this.selectedEmailIndex >= count) {
           this.selectedEmailIndex = 0;
       }

       const current = this.missedEmailsArray[this.selectedEmailIndex];
       this.emailSwitchText.setText(`Showing ${this.selectedEmailIndex + 1}/${count}`);
       this.fromText.setText(`From: ${current.from}`);
       this.domainText.setText(`Domain: ${current.domain}`);
       this.subjectText.setText(`Subject: ${current.subject}`);
       this.contentText.setText(current.body);
       this.attachmentText.setText(
           `Attachments: ${current.attachments.length > 0 ? current.attachments.join(", ") : "none"}`,
       );
   }

   private showPreviousEmail() {
       if (this.missedEmailsArray.length <= 1) return;

       this.selectedEmailIndex =
           (this.selectedEmailIndex - 1 + this.missedEmailsArray.length) % this.missedEmailsArray.length;

       this.refreshEmailPanel();
   }

   private showNextEmail() {
       if (this.missedEmailsArray.length <= 1) return;

       this.selectedEmailIndex = (this.selectedEmailIndex + 1) % this.missedEmailsArray.length;

       this.refreshEmailPanel();
   }

   private hideEmailPanel() {
       this.computerPanelBg.setVisible(false);
       this.emailPanelTitle.setVisible(false);
       this.emailCloseXText.setVisible(false);
       this.emailSwitchText.setVisible(false);
       this.previousEmailButton.setVisible(false);
       this.nextEmailButton.setVisible(false);
       this.fromText.setVisible(false);
       this.domainText.setVisible(false);
       this.subjectText.setVisible(false);
       this.contentLabelText.setVisible(false);
       this.contentText.setVisible(false);
       this.attachmentText.setVisible(false);
   }
}*/

