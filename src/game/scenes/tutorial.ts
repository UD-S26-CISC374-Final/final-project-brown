import { Scene } from "phaser";

interface TutorialPage {
    title: string;
    body: string;
    accent: string;
}

export class Tutorial extends Scene {
    private readonly pages: TutorialPage[] = [
        {
            title: "Night Shift, 1997",
            accent: "CASE FILE 00",
            body:
                "You work the graveyard desk at Blackline Security, a noir-style cybersecurity company where every monitor hums and every rain-soaked email could be bait.\n\n" +
                "The official job is simple: inspect company mail and keep the network clean. The unofficial job is stranger. Someone is hiding a secret inside the inbox stream, and the only way to get closer is to survive the shifts.",
        },
        {
            title: "The Rulebook",
            accent: "FILES PANEL",
            body:
                "Click the files on the desk to open the rulebook.\n\n" +
                "Core Rules explain what every safe email needs: a real sender, a correct username, an approved company domain, a topic that fits the company, matching subject/body/files, and no banned attachments.\n\n" +
                "Company pages list approved domains, employees, and expected topics. Daily Alerts add temporary dangers for the current shift, including subject-header words that are banned after a data issue. Some banned words apply to every company, while others only apply to named companies.",
        },
        {
            title: "The Inbox",
            accent: "COMPUTER PANEL",
            body:
                "Click the computer when mail arrives. Read the sender name, email address, subject, body, and attachments.\n\n" +
                "Choose Valid only when every rule checks out. Choose Phishing if anything is wrong: mismatched identity, wrong domain, strange topic, banned subject word, suspicious wording, or a forbidden file like .exe or .zip.\n\n" +
                "Correct calls earn points. Mistakes cost points.",
        },
        {
            title: "The Dude",
            accent: "DISTRACTION EVENT",
            body:
                "Sometimes the office dude barges into your focus. When he appears, your panels close and the distraction meter starts falling.\n\n" +
                "Press Space repeatedly to ignore the conversation and get back to the inbox. If you freeze, the shift keeps moving while you lose control of the desk.",
        },
    ];

    private pageIndex = 0;
    private practiceSolved = false;

    private titleText!: Phaser.GameObjects.Text;
    private accentText!: Phaser.GameObjects.Text;
    private bodyText!: Phaser.GameObjects.Text;
    private pageText!: Phaser.GameObjects.Text;
    private statusText!: Phaser.GameObjects.Text;
    private previousButton!: Phaser.GameObjects.Text;
    private nextButton!: Phaser.GameObjects.Text;
    private beginButton!: Phaser.GameObjects.Text;
    private practiceGroup: Phaser.GameObjects.GameObject[] = [];

    constructor() {
        super("Tutorial");
    }

    create() {
        this.cameras.main.setBackgroundColor(0x20251f);

        if (this.textures.exists("desk-background")) {
            this.add
                .image(512, 384, "desk-background")
                .setDisplaySize(1024, 768)
                .setAlpha(0.34)
                .setDepth(-4);
        }

        this.add.rectangle(512, 58, 1024, 116, 0x26362c, 0.96).setDepth(1);
        this.add.rectangle(512, 121, 1024, 6, 0xb5a36a, 0.9).setDepth(1);
        this.add.rectangle(512, 438, 920, 540, 0xefe4c7, 0.97)
            .setStrokeStyle(3, 0x5d5747)
            .setDepth(2);

        this.accentText = this.add
            .text(74, 40, "", {
                fontFamily: "Pix32",
                fontSize: "18px",
                color: "#e2d39e",
            })
            .setDepth(3);

        this.titleText = this.add
            .text(74, 70, "", {
                fontFamily: "Pix32",
                fontSize: "40px",
                color: "#f4ecd8",
                stroke: "#111510",
                strokeThickness: 2,
            })
            .setDepth(3);

        this.pageText = this.add
            .text(874, 76, "", {
                fontFamily: "Pix32",
                fontSize: "18px",
                color: "#f4ecd8",
            })
            .setDepth(3);

        this.bodyText = this.add
            .text(92, 182, "", {
                fontFamily: "Pix32",
                fontSize: "24px",
                color: "#2c271f",
                wordWrap: { width: 840 },
                lineSpacing: 10,
            })
            .setDepth(3);

        this.statusText = this.add
            .text(512, 626, "", {
                fontFamily: "Pix32",
                fontSize: "20px",
                color: "#5a4a32",
                align: "center",
                wordWrap: { width: 820 },
            })
            .setOrigin(0.5)
            .setDepth(4);

        this.previousButton = this.createButton(196, 704, "< Back", () => {
            this.showPreviousPage();
        });
        this.nextButton = this.createButton(828, 704, "Next >", () => {
            this.showNextPage();
        });
        this.beginButton = this.createButton(512, 704, "Begin Shift", () => {
            this.scene.start("Level1");
        });

        this.showPage(0);
    }

    private createButton(
        x: number,
        y: number,
        label: string,
        callback: () => void,
        width = 178,
    ) {
        const button = this.add
            .text(x, y, label, {
                fontFamily: "Pix32",
                fontSize: "22px",
                color: "#f8f0dc",
                backgroundColor: "#44624c",
                padding: { left: 18, right: 18, top: 10, bottom: 10 },
                align: "center",
                fixedWidth: width,
            })
            .setOrigin(0.5)
            .setDepth(6)
            .setInteractive({ useHandCursor: true })
            .on("pointerover", () => {
                button.setStyle({ backgroundColor: "#53755b" });
            })
            .on("pointerout", () => {
                button.setStyle({ backgroundColor: "#44624c" });
            })
            .on("pointerdown", callback);

        return button;
    }

    private showPage(index: number) {
        this.pageIndex = Phaser.Math.Clamp(index, 0, this.pages.length);
        this.clearPractice();

        if (this.pageIndex >= this.pages.length) {
            this.showPractice();
            return;
        }

        const page = this.pages[this.pageIndex];
        this.accentText.setText(page.accent);
        this.titleText.setText(page.title);
        this.bodyText.setText(page.body);
        this.pageText.setText(`${this.pageIndex + 1}/${this.pages.length + 1}`);
        this.statusText.setText("");

        this.previousButton.setVisible(this.pageIndex > 0);
        this.nextButton.setVisible(true).setText("Next >");
        this.beginButton.setVisible(false);
    }

    private showPreviousPage() {
        this.showPage(this.pageIndex - 1);
    }

    private showNextPage() {
        this.showPage(this.pageIndex + 1);
    }

    private clearPractice() {
        for (const item of this.practiceGroup) {
            item.destroy();
        }

        this.practiceGroup = [];
    }

    private showPractice() {
        this.accentText.setText("PRACTICE CASE");
        this.titleText.setText("Make One Call");
        this.pageText.setText(`${this.pages.length + 1}/${this.pages.length + 1}`);
        this.bodyText.setText(
            "Use the rulebook clue and classify the sample email before your first real shift.",
        );
        this.statusText.setText("Is this email valid or phishing?");
        this.previousButton.setVisible(true);
        this.nextButton.setVisible(false);
        this.beginButton.setVisible(this.practiceSolved);

        const rulebook = this.add
            .text(92, 256, "RULEBOOK EXCERPT\n\nRedForge expected topics:\n- MFA, VPN, and account security\n- Incident response, SOC, and escalation\n- Firewalls, endpoint security, and threat hunting", {
                fontFamily: "Pix32",
                fontSize: "18px",
                color: "#2c271f",
                backgroundColor: "#e2d39e",
                padding: { left: 14, right: 14, top: 12, bottom: 12 },
                wordWrap: { width: 380 },
            })
            .setDepth(4);

        const email = this.add
            .text(548, 256, "EMAIL\n\nFrom: John Smith\nAddress: john@redforge.com\nSubject: Payroll Adjustment Needed\nAttachments: none\n\nBody:\nPlease review the payroll change form before Friday.", {
                fontFamily: "Pix32",
                fontSize: "18px",
                color: "#2c271f",
                backgroundColor: "#f6edda",
                padding: { left: 14, right: 14, top: 12, bottom: 12 },
                wordWrap: { width: 374 },
            })
            .setDepth(4);

        const validButton = this.createButton(396, 560, "Valid", () => {
            this.answerPractice(false);
        }, 164);
        const phishingButton = this.createButton(628, 560, "Phishing", () => {
            this.answerPractice(true);
        }, 164);

        this.practiceGroup.push(rulebook, email, validButton, phishingButton);
    }

    private answerPractice(correct: boolean) {
        if (correct) {
            this.practiceSolved = true;
            this.statusText
                .setText(
                    "Correct. The sender and domain are real, but payroll is not a RedForge topic. That makes it phishing.",
                )
                .setColor("#1f5c35");
            this.beginButton.setVisible(true);
            return;
        }

        this.statusText
            .setText(
                "Not quite. A clean domain is not enough. RedForge does security work, not payroll, so this topic breaks the rulebook.",
            )
            .setColor("#7a2d25");
    }
}
