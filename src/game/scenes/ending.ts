import { Scene } from "phaser";
import { playOneShot, SOUND_KEYS, stopSound } from "../audio";

const INTRO_SOUND_MAP: Record<string, string> = {
    "A car arrives outside your house.": SOUND_KEYS.carStop,
    "A man steps out.": SOUND_KEYS.openClose,
    "He approaches your front door.": SOUND_KEYS.footsteps,
    "He knocks. You answer.": SOUND_KEYS.doorKnock,
};

/*
const INTRO_SOUND_VOLUME: Record<string, number> = {
    [SOUND_KEYS.carStop]: 0.25,
    [SOUND_KEYS.openClose]: 0.4,
    [SOUND_KEYS.footsteps]: 0.4,
    [SOUND_KEYS.doorKnock]: 0.4,
};
*/

const ENDING_SOUND_KEYS: Record<number, string> = {
    1: SOUND_KEYS.policeSiren,
    2: SOUND_KEYS.elevator,
    3: SOUND_KEYS.gunshot,
};
/*
const ENDING_SOUND_VOLUME: Record<string, number> = {
    [SOUND_KEYS.policeSiren]: 0.25,
    [SOUND_KEYS.elevator]: 0.4,
    [SOUND_KEYS.gunshot]: 0.5,
};
*/

export interface EndingSceneData {
    endingType: 1 | 2 | 3;
}

const INTRO_SCREENS: string[] = [
    "",
    "A car arrives outside your house.",
    "A man steps out.",
    "He approaches your front door.",
    "He knocks. You answer.",
];

const ENDING_SCREENS: Record<number, string[]> = {
    1: [
        "The man at the door used to work at Blackline.\nHe is a friend.",
        "He tells you the files you let through\nreached the right people.",
        "Blackline's servers are being seized.",
        "The infection zones are being exposed.",
        "For once, the emails mattered.",
        "You are a hero,\nbut now an enemy to many.",
    ],
    2: [
        "A Blackline representative stands at your door.",
        "He thanks you for your excellent work.",
        "Every suspicious message was contained.",
        "The leak has been prevented.",
        "Blackline continues operating\nlike nothing happened.",
        "You keep your job and stay afloat.",
        "Somewhere, the truth stays buried.",
    ],
    3: [
        "The man at the door already knows your name.",
        "He says Blackline noticed your inconsistent reports.",
        "Some dangerous emails were blocked.",
        "Some dangerous emails were allowed through.",
        "That made you unpredictable.",
        "The last employee made the same mistake.",
        "Blackline called his disappearance a transfer.",
        "The man reaches into his coat.",
        "Bang.",
    ],
};

const ENDING_IMAGE_KEYS: Record<number, string> = {
    1: "ending-1",
    2: "ending-2",
    3: "ending-3",
};

export class Ending extends Scene {
    private endingType: 1 | 2 | 3 = 1;
    private screens: string[] = [];
    private currentIndex = 0;
    private messageText!: Phaser.GameObjects.Text;
    private continueBtn!: Phaser.GameObjects.Text;
    private imagePlaceholderObjects: Phaser.GameObjects.GameObject[] = [];
    private currentSound: Phaser.Sound.BaseSound | null = null;

    constructor() {
        super("Ending");
    }

    init(data: EndingSceneData) {
        this.endingType = data.endingType;
    }

    create() {
        stopSound(this, SOUND_KEYS.fanAudio);
        stopSound(this, SOUND_KEYS.menuTheme);
        stopSound(this, SOUND_KEYS.dudeNoise);

        this.cameras.main.setBackgroundColor(0x000000);

        this.screens = [...INTRO_SCREENS, ...ENDING_SCREENS[this.endingType]];
        this.currentIndex = 0;

        this.messageText = this.add
            .text(512, 340, "", {
                fontFamily: "Pix32",
                fontSize: "30px",
                color: "#f4ecd8",
                align: "center",
                wordWrap: { width: 720 },
                lineSpacing: 14,
            })
            .setOrigin(0.5)
            .setAlpha(0);

        this.continueBtn = this.add
            .text(512, 680, "Continue", {
                fontFamily: "Pix32",
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
        if (this.currentIndex >= this.screens.length) {
            this.cameras.main.off(
                "camerafadeoutcomplete",
                this.onFadeOutComplete,
            );
            this.showMenuButtons();
        } else {
            this.showScreen(this.currentIndex);
        }
    };

    private showScreen(index: number) {
        if (this.currentSound?.isPlaying) {
            this.currentSound.stop();
        }
        this.currentSound = null;

        for (const obj of this.imagePlaceholderObjects) obj.destroy();
        this.imagePlaceholderObjects = [];

        const text = this.screens[index] ?? "";
        const isFirst = index === 0;
        const isLast = index === this.screens.length - 1;
        const soundKey = isLast
            ? ENDING_SOUND_KEYS[this.endingType]
            : (INTRO_SOUND_MAP[text] ?? null);

        this.messageText
            .setY(isLast ? 460 : 340)
            .setText(text)
            .setAlpha(0);
        this.continueBtn
            .setText(isFirst ? "Next" : "Continue")
            .setPosition(512, isFirst ? 384 : 660)
            .setAlpha(0);

        const tweenTargets: Phaser.GameObjects.GameObject[] = [
            this.messageText,
            this.continueBtn,
        ];

        if (isLast) {
            const endingImage = this.add
                .image(512, 215, ENDING_IMAGE_KEYS[this.endingType])
                .setDisplaySize(600, 320)
                .setAlpha(0);
            this.imagePlaceholderObjects = [endingImage];
            tweenTargets.push(endingImage);
        }

        this.cameras.main.fadeIn(600, 0, 0, 0);
        this.cameras.main.once("camerafadeincomplete", () => {
            this.tweens.add({
                targets: tweenTargets,
                alpha: 1,
                duration: 400,
                onComplete: () => {
                    if (soundKey) {
                        const volume = 0.25;
                        this.currentSound = this.sound.add(soundKey, { volume });
                        this.currentSound.once("complete", () => {
                            this.currentSound = null;
                            this.continueBtn.setInteractive({ useHandCursor: true });
                        });
                        this.currentSound.play();
                    } else {
                        this.continueBtn.setInteractive({ useHandCursor: true });
                    }
                },
            });
        });
    }

    private showMenuButtons() {
        this.messageText.destroy();
        this.continueBtn.destroy();
        for (const obj of this.imagePlaceholderObjects) obj.destroy();
        this.imagePlaceholderObjects = [];

        const endingNames: Record<number, string> = {
            1: "Hero",
            2: "Company",
            3: "Removal",
        };
        const endingName = endingNames[this.endingType];

        const endLabel = this.add
            .text(512, 220, "— End —", {
                fontFamily: "Pix32",
                fontSize: "28px",
                color: "#b5a36a",
                align: "center",
            })
            .setOrigin(0.5)
            .setAlpha(0);

        const achievedLabel = this.add
            .text(512, 300, `${endingName} Ending Achieved`, {
                fontFamily: "Pix32",
                fontSize: "22px",
                color: "#d4c9a8",
                align: "center",
            })
            .setOrigin(0.5)
            .setAlpha(0);

        const restartBtn = this.createButton(
            512,
            410,
            "Restart Game",
            "#44624c",
            () => {
                this.scene.start("Level1", { day: 1 });
            },
        );
        const menuBtn = this.createButton(
            512,
            490,
            "Main Menu",
            "#5a4a32",
            () => {
                this.scene.start("MainMenu");
            },
        );
        const selectBtn = this.createButton(
            512,
            570,
            "Select Level",
            "#5a4a32",
            () => {
                this.scene.start("LevelSelect");
            },
        );

        for (const obj of [restartBtn, menuBtn, selectBtn]) {
            obj.setAlpha(0);
        }

        this.cameras.main.fadeIn(600, 0, 0, 0);
        this.cameras.main.once("camerafadeincomplete", () => {
            this.tweens.add({
                targets: [
                    endLabel,
                    achievedLabel,
                    restartBtn,
                    menuBtn,
                    selectBtn,
                ],
                alpha: 1,
                duration: 400,
            });
        });
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
                fontFamily: "Pix32",
                fontSize: "26px",
                color: "#f8f0dc",
                stroke: "#211d17",
                strokeThickness: 1,
                backgroundColor,
                fixedWidth: 320,
                align: "center",
                padding: { left: 8, right: 8, top: 12, bottom: 12 },
            })
            .setOrigin(0.5)
            .setDepth(4)
            .setInteractive({ useHandCursor: true });

        const hoverBg = this.brightenColor(backgroundColor, 20);
        button.on("pointerdown", () => {
            playOneShot(this, SOUND_KEYS.mouseClick, { volume: 0.45 });
            onClick();
        });
        button.on("pointerover", () => {
            button.setStyle({ backgroundColor: hoverBg });
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
        return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    }
}
