import { Scene } from "phaser";

interface EventSceneData {
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
  type?: number;
}

export class EventScene extends Scene {
  private day: number;
  private totalPoints: number;
  private money: number
  private daysWithoutRent: number;
  private hintCount: number
  private revealCount: number;
  private shieldActive: boolean
  private shopOutcome: "continue" | "dead" | "win";
  private outcomeMessage: string
  private plotEmailsAccepted: number;
  private plotEmailsRejected: number;
  private type: number;


  private eventsChoice: string[] = [
    "You found a lost wallet on the street. You return it to the owner and they reward you with some money.",
    "You helped an old lady cross the street. She thanks you and gives you a small gift.",
    "You got mugged on your way home. You lose some money and feel unsafe.",
    "You were going to get mugged, but your broke! The mugger felt bad and gave you 5 bucks.",
    "You found a winning lottery ticket on the ground! You win a huge amount of money!"
  ];

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

  private createButton(x: number, y: number, text: string, callback: () => void) {
    const button = this.add.text(x, y, text, {
      fontSize: "24px",
      color: "#000000",
      backgroundColor: this.brightenColor("#f4ecd8", -50),
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5);
    button.setInteractive();
    button.on('pointerdown', callback);
  }

  constructor() {
    super("EventScene");
  }

  init(data: EventSceneData) {
    this.day = data.day ?? 1;
    this.totalPoints = data.totalPoints ?? 0;
    this.money = data.money ?? 0;
    this.daysWithoutRent = data.daysWithoutRent ?? 0;
    this.hintCount = data.hintCount ?? 0;
    this.revealCount = data.revealCount ?? 0;
    this.shieldActive = data.shieldActive ?? false;
    this.shopOutcome = data.shopOutcome ?? "continue";
    this.outcomeMessage = data.outcomeMessage ?? "";
    this.plotEmailsAccepted = data.plotEmailsAccepted ?? 0;
    this.plotEmailsRejected = data.plotEmailsRejected ?? 0;
    this.type = data.type ?? Math.floor(Math.random() * 3);
  }

  create() {
    if (Math.random() < 0.001) {
      this.money += 50000;
      this.type = 4;
    } else if (this.type === 0) {
      this.money += 10;
    } else if (this.type === 1) {
      this.hintCount += 1;
    } else if (this.type === 2 && this.money === 0) {
      this.money = Math.max(0, this.money += 5);
      this.type = 3;
    } else if (this.type === 2) {
      this.money = Math.max(0, this.money - 10);
    }
    this.cameras.main.setBackgroundColor(0x000000);
    this.add.rectangle(512, 384, 1024, 768, 0x090d09, 0.72);

    this.add.text(512, 384, this.eventsChoice[this.type], {
      fontSize: "24px",
      color: "#000000",
      backgroundColor: this.brightenColor("#f4ecd8", -50),
      padding: { x: 20, y: 20 },
      wordWrap: { width: 800 },
    }).setOrigin(0.5);

    this.createButton(512, 500, "Continue", () => {
      this.scene.launch("Level1", {
        day: this.day, totalPoints: this.totalPoints, money: this.money, daysWithoutRent: this.daysWithoutRent, hintCount: this.hintCount, revealCount: this.revealCount, shieldActive: this.shieldActive, shopOutcome: this.shopOutcome,
        outcomeMessage: this.outcomeMessage, plotEmailsAccepted: this.plotEmailsAccepted, plotEmailsRejected: this.plotEmailsRejected
      });
      this.scene.stop();
    });
    this.show();
  }

  private show() {
    this.cameras.main.fadeIn(1000);
  }

  update() {
  }
}