import { Scene } from "phaser";

import { playOneShot, SOUND_KEYS, stopSound } from "../audio";

const BRIEFING_SCREENS: string[] = [
    "You work the night desk at Blackline Security.\n\nYour job is to inspect incoming company email before it reaches the network.",
    "Phishing messages will try to slip through.\n\nSome will look almost normal, but one wrong detail can be enough to mark them as dangerous.",
    "Use the rulebook before you answer.\n\nCheck the company pages carefully: approved domains, employee names, expected topics, and daily alerts all matter.",
];

export class IntroBriefing extends Scene {
    private currentIndex = 0;
    private messageText!: Phaser.GameObjects.Text;
    private continueBtn!: Phaser.GameObjects.Text;

    constructor() {
        super("IntroBriefing");
    }

    create() {
        stopSound(this, SOUND_KEYS.menuTheme);
        this.cameras.main.setBackgroundColor(0x000000);
        this.currentIndex = 0;

        this.messageText = this.add
            .text(512, 340, "", {
                fontFamily: "Dotemp-8bit",
                fontSize: "30px",
                color: "#f4ecd8",
                align: "center",
                wordWrap: { width: 760 },
                lineSpacing: 14,
            })
            .setOrigin(0.5)
            .setAlpha(0);

        this.continueBtn = this.add
            .text(512, 660, "Continue", {
                fontFamily: "Dotemp-8bit",
                fontSize: "24px",
                color: "#f8f0dc",
                stroke: "#211d17",
                strokeThickness: 1,
                backgroundColor: "#44624c",
                padding: { left: 30, right: 30, top: 12, bottom: 12 },
            })
            .setOrigin(0.5)
            .setAlpha(0);

        this.continueBtn.on("pointerover", () => {
            this.continueBtn.setStyle({ backgroundColor: "#53755b" });
        });
        this.continueBtn.on("pointerout", () => {
            this.continueBtn.setStyle({ backgroundColor: "#44624c" });
        });
        this.continueBtn.on("pointerdown", () => {
            playOneShot(this, SOUND_KEYS.mouseClick, { volume: 0.45 });
            this.continueBtn.disableInteractive();
            this.cameras.main.fadeOut(400, 0, 0, 0);
        });

        this.cameras.main.on("camerafadeoutcomplete", this.onFadeOutComplete);
        this.showScreen(0);
    }

    private readonly onFadeOutComplete = () => {
        this.currentIndex++;
        if (this.currentIndex >= BRIEFING_SCREENS.length) {
            this.cameras.main.off(
                "camerafadeoutcomplete",
                this.onFadeOutComplete,
            );
            this.scene.start("Level1", { tutorialMode: true });
            return;
        }

        this.showScreen(this.currentIndex);
    };

    private showScreen(index: number) {
        this.messageText.setText(BRIEFING_SCREENS[index] ?? "").setAlpha(0);
        this.continueBtn
            .setText(
                index === BRIEFING_SCREENS.length - 1 ? "Begin" : "Continue",
            )
            .setAlpha(0);

        this.cameras.main.fadeIn(600, 0, 0, 0);
        this.cameras.main.once("camerafadeincomplete", () => {
            this.tweens.add({
                targets: [this.messageText, this.continueBtn],
                alpha: 1,
                duration: 400,
                onComplete: () => {
                    this.continueBtn.setInteractive({ useHandCursor: true });
                },
            });
        });
    }
}
