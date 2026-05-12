import { GameObjects, Scene } from "phaser";

import { playOneShot, SOUND_KEYS } from "../audio";

interface LevelReviewSceneData {
    day?: number;
    totalPoints?: number;
    money?: number;
    daysWithoutRent?: number;
    hintCount?: number;
    revealCount?: number;
}

export class LevelReviewScene extends Scene {
    private continueToShopButton!: GameObjects.Text;
    private toMainMenuButton!: GameObjects.Text;
    private nextEmailButton!: GameObjects.Text;
    private previousEmailButton!: GameObjects.Text;
    private day: number = 1;
    private totalPoints: number = 0;
    private money: number = 0;
    private daysWithoutRent: number = 0;
    private hintCount: number = 0;
    private revealCount: number = 0;
    private missedEmailsText!: Set<string>;
    private missedEmailsFeedback!: Set<string>;

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

