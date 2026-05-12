import { Scene } from "phaser";

import {
    ensureLoopingSound,
    playOneShot,
    SOUND_KEYS,
    stopSound,
} from "../audio";

const W = 1024;
const H = 768;

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
            title: "The Coworker",
            accent: "DISTRACTION EVENT",
            body:
                "A coworker from the next desk wanders over during the shift and starts talking your ear off. When he appears, your panels close and the distraction meter starts falling.\n\n" +
                "Press Space repeatedly to ignore the conversation and get back to the inbox. If you freeze, the shift keeps moving while you lose control of the desk.",
        },
        {
            title: "The CAPTCHA",
            accent: "EMAIL CHECK",
            body:
                "Sometimes clicking Valid or Phishing on an email stops you with a human verification check before the answer is submitted.\n\n" +
                "Read the distorted 6-character code, type it on your keyboard, then press Enter before time runs out. Backspace fixes mistakes.\n\n" +
                "Pass the check, then click your answer again. The same email will not trigger CAPTCHA twice. If time runs out during a real shift, you lose points and money.",
        },
        {
            title: "The Zombie",
            accent: "DISTRACTION EVENT",
            body:
                "Sometimes a zombie breaks through the door during your shift. A 20-second countdown begins immediately.\n\n" +
                "1. Note the password shown at the top of the screen.\n" +
                "2. Click the gun cabinet on the wall to open the keypad.\n" +
                "3. Enter the 4-digit password and press Enter.\n" +
                "4. Grab the gun, then click the zombie to shoot it.\n\n" +
                "If time runs out, you are infected and the shift ends.",
        },
        {
            title: "The Dude",
            accent: "VISITOR EVENT",
            body:
                "Every so often a stranger drops by your desk. He doesn't work for Blackline. He never gives his real name.\n\n" +
                "He talks fast about the last analyst, about names that shouldn't be in the inbox, and about which emails to let through even when the rulebook says otherwise. Listen carefully — his hints point to the lore buried inside the email stream.\n\n" +
                "He won't stop you from working, but the choices you make on flagged plot emails decide which ending you get.",
        },
        {
            title: "The Shop",
            accent: "BETWEEN SHIFTS",
            body:
                "After each shift, you can enter the shop before the next day begins.\n\n" +
                "To stay afloat, you must buy food and utilities every day, and you must pay rent at least once every other day. Day 1 is covered for you, but after that the essentials cost $3 each.\n\n" +
                "The shop also sells powerups: Hint ($5) reveals a clue about the selected email, Shield ($10) blocks one mistake on the next shift, and Eliminate ($15) removes one wrong answer on the selected email.",
        },
    ];

    private pageIndex = 0;

    private titleText!: Phaser.GameObjects.Text;
    private accentText!: Phaser.GameObjects.Text;
    private bodyText!: Phaser.GameObjects.Text;
    private pageText!: Phaser.GameObjects.Text;
    private statusText!: Phaser.GameObjects.Text;
    private previousButton!: Phaser.GameObjects.Text;
    private nextButton!: Phaser.GameObjects.Text;
    private beginButton!: Phaser.GameObjects.Text;
    private mainMenuButton!: Phaser.GameObjects.Text;

    constructor() {
        super("Tutorial");
    }

    create() {
        ensureLoopingSound(this, SOUND_KEYS.menuTheme, { volume: 0.075 });

        // --- Background ---
        if (this.textures.exists("desk-background")) {
            this.add
                .image(W / 2, H / 2, "desk-background")
                .setDisplaySize(W, H)
                .setDepth(0);
        } else {
            this.cameras.main.setBackgroundColor(0x1a2018);
        }
        this.add.rectangle(W / 2, H / 2, W, H, 0x090d09, 0.72).setDepth(1);

        // --- Top header bar ---
        this.add.rectangle(W / 2, 58, W, 116, 0x1b3022, 0.97).setDepth(2);
        this.add.rectangle(W / 2, 121, W, 3, 0xd4a830, 1).setDepth(2);

        this.accentText = this.add
            .text(72, 34, "", {
                fontFamily: "Dotemp-8bit",
                fontSize: "17px",
                color: "#d4a830",
            })
            .setDepth(4);

        this.titleText = this.add
            .text(72, 62, "", {
                fontFamily: "Dotemp-8bit",
                fontSize: "40px",
                color: "#f2e8d0",
                stroke: "#0d180d",
                strokeThickness: 2,
            })
            .setDepth(4);

        this.pageText = this.add
            .text(W - 72, 76, "", {
                fontFamily: "Dotemp-8bit",
                fontSize: "18px",
                color: "#b5953a",
                align: "right",
            })
            .setOrigin(1, 0.5)
            .setDepth(4);

        // --- Main content card ---
        const cardX = W / 2;
        const cardY = 440;
        const cardW = 920;
        const cardH = 540;

        this.add
            .rectangle(cardX + 6, cardY + 6, cardW, cardH, 0x000000, 0.4)
            .setDepth(2);
        this.add
            .rectangle(cardX, cardY, cardW, cardH, 0xf0e4c4, 0.97)
            .setStrokeStyle(3, 0x7a6030)
            .setDepth(3);
        this.add
            .rectangle(cardX, cardY, cardW - 16, cardH - 16, 0x000000, 0)
            .setStrokeStyle(1, 0xb5953a)
            .setDepth(3);

        // Ruled lines
        const gfx = this.add.graphics().setDepth(3);
        gfx.lineStyle(1, 0xc8a96e, 0.3);
        const lineTop = cardY - cardH / 2 + 22;
        for (let i = 0; i < 14; i++) {
            gfx.moveTo(cardX - cardW / 2 + 28, lineTop + i * 34);
            gfx.lineTo(cardX + cardW / 2 - 28, lineTop + i * 34);
        }
        gfx.strokePath();

        // Red margin line
        gfx.lineStyle(1, 0xc06050, 0.4);
        gfx.moveTo(cardX - cardW / 2 + 68, lineTop);
        gfx.lineTo(cardX - cardW / 2 + 68, cardY + cardH / 2 - 16);
        gfx.strokePath();

        // --- Body text ---
        this.bodyText = this.add
            .text(90, 202, "", {
                fontFamily: "Dotemp-8bit",
                fontSize: "22px",
                color: "#2c271f",
                wordWrap: { width: 840 },
                lineSpacing: 10,
            })
            .setDepth(5);

        this.statusText = this.add
            .text(W / 2, 623, "", {
                fontFamily: "Dotemp-8bit",
                fontSize: "20px",
                color: "#5a4a32",
                align: "center",
                wordWrap: { width: 820 },
            })
            .setOrigin(0.5)
            .setDepth(5);

        // --- Buttons ---
        this.previousButton = this.createButton(196, 710, "< Back", () =>
            this.showPreviousPage(),
        );
        this.nextButton = this.createButton(828, 710, "Next >", () =>
            this.showNextPage(),
        );
        this.beginButton = this.createButton(
            W / 2,
            710,
            "Begin Example Round",
            () => {
                stopSound(this, SOUND_KEYS.menuTheme);
                this.startSceneAfterFade("Level1", { tutorialMode: true });
            },
            260,
        );
        this.mainMenuButton = this.createButton(196, 710, "Main Menu", () => {
            this.scene.start("MainMenu");
        });

        this.showPage(0);
    }

    private createButton(
        x: number,
        y: number,
        label: string,
        callback: () => void,
        width = 178,
        silent = false,
    ) {
        const button = this.add
            .text(x, y, label, {
                fontFamily: "Dotemp-8bit",
                fontSize: "22px",
                color: "#f0e8d4",
                stroke: "#1a2a1a",
                strokeThickness: 1,
                backgroundColor: "#3a5c42",
                padding: { left: 18, right: 18, top: 10, bottom: 10 },
                align: "center",
                fixedWidth: width,
            })
            .setOrigin(0.5)
            .setDepth(6)
            .setInteractive({ useHandCursor: true })
            .on("pointerover", () => {
                button.setStyle({ backgroundColor: "#4e7a56" });
                button.setScale(1.05);
            })
            .on("pointerout", () => {
                button.setStyle({ backgroundColor: "#3a5c42" });
                button.setScale(1);
            })
            .on("pointerdown", () => {
                if (!silent)
                    playOneShot(this, SOUND_KEYS.mouseClick, { volume: 0.45 });
                callback();
            });
        return button;
    }

    private startSceneAfterFade(sceneKey: string, data?: object) {
        this.cameras.main.fadeOut(250, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
            this.scene.start(sceneKey, data);
        });
    }

    private showPage(index: number) {
        this.pageIndex = Phaser.Math.Clamp(index, 0, this.pages.length - 1);

        const page = this.pages[this.pageIndex];
        this.accentText.setText(page.accent);
        this.titleText.setText(page.title);
        this.bodyText.setText(page.body);
        this.pageText.setText(`${this.pageIndex + 1} / ${this.pages.length}`);

        const isLast = this.pageIndex === this.pages.length - 1;
        const isFirst = this.pageIndex === 0;

        this.statusText.setText(
            isLast ?
                "When you're ready, begin the example round to practice a short shift."
            :   "",
        );

        this.previousButton.setVisible(!isFirst);
        this.mainMenuButton.setVisible(isFirst);
        this.nextButton.setVisible(!isLast);
        this.beginButton.setVisible(isLast);
    }

    private showPreviousPage() {
        this.showPage(this.pageIndex - 1);
    }
    private showNextPage() {
        this.showPage(this.pageIndex + 1);
    }
}
