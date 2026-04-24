import { Scene } from "phaser";
import backgroundDeskImage from "../objects/Background.png";
import computerImage from "../objects/Computer.png";
import computerHoverImage from "../objects/ComputerHover.png";
import computerNotificationImage from "../objects/ComputerNotification.png";
import computerNotificationHoverImage from "../objects/ComputerNotificationHover.png";
import dudeImage from "../objects/Dude.png";
import filesImage from "../objects/Files.png";
import filesHoverImage from "../objects/FilesHover.png";
import correctDingAudio from "../sounds/correctding.wav";
import dudeNoiseAudio from "../sounds/dudenoise.wav";
import emailNotiAudio from "../sounds/emailnoti.wav";
import fanAudio from "../sounds/fanaudio.wav";
import mouseClickAudio from "../sounds/mouseclick.wav";
import pageTurnAudio from "../sounds/pageturn.wav";
import textBoxImage from "../objects/TextBox.png";
import wrongBuzzerAudio from "../sounds/wrongbuzzer.wav";
import { SOUND_KEYS } from "../audio";

export class Preloader extends Scene {
    constructor() {
        super("Preloader");
    }

    init() {
        this.add.image(512, 384, "background");

        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

        const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffffff);

        this.load.on("progress", (progress: number) => {
            bar.width = 4 + 460 * progress;
        });
    }

    preload() {
        this.load.setPath("assets");

        this.load.image("logo", "logo.png");
        this.load.image("star", "star.png");
        this.load.image("phaser-logo", "phaser-logo.png");

        this.load.setPath("");

        this.load.image("desk-background", backgroundDeskImage);
        this.load.image("desk-computer", computerImage);
        this.load.image("desk-computer-hover", computerHoverImage);
        this.load.image(
            "desk-computer-notification",
            computerNotificationImage,
        );
        this.load.image(
            "desk-computer-notification-hover",
            computerNotificationHoverImage,
        );
        this.load.image("desk-dude", dudeImage);
        this.load.image("desk-files", filesImage);
        this.load.image("desk-files-hover", filesHoverImage);
        this.load.image("desk-textbox", textBoxImage);

        this.load.audio(SOUND_KEYS.fanAudio, fanAudio);
        this.load.audio(SOUND_KEYS.dudeNoise, dudeNoiseAudio);
        this.load.audio(SOUND_KEYS.correctDing, correctDingAudio);
        this.load.audio(SOUND_KEYS.wrongBuzzer, wrongBuzzerAudio);
        this.load.audio(SOUND_KEYS.pageTurn, pageTurnAudio);
        this.load.audio(SOUND_KEYS.mouseClick, mouseClickAudio);
        this.load.audio(SOUND_KEYS.emailNoti, emailNotiAudio);
    }

    create() {
        this.scene.start("MainMenu");
    }
}
