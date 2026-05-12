import { Scene } from "phaser";
import backgroundDeskImage from "../objects/Background.png";
import computerImage from "../objects/Computer.png";
import computerHoverImage from "../objects/ComputerHover.png";
import computerNotificationImage from "../objects/ComputerNotification.png";
import computerNotificationHoverImage from "../objects/ComputerNotificationHover.png";
import coworkerImage from "../objects/Coworker.png";
import dudeImage from "../objects/Dude.png";
import filesImage from "../objects/Files.png";
import filesHoverImage from "../objects/FilesHover.png";
import correctDingAudio from "../sounds/correctding.wav";
import dudeNoiseAudio from "../sounds/dudenoise.wav";
import emailNotiAudio from "../sounds/emailnoti.wav";
import fanAudio from "../sounds/fanaudio.wav";
import heyAudio from "../sounds/hey.wav";
import menuThemeAudio from "../sounds/menutheme.wav";
import mouseClickAudio from "../sounds/mouseclick.wav";
import pageTurnAudio from "../sounds/pageturn.wav";
import textBoxImage from "../objects/TextBox.png";
import wrongBuzzerAudio from "../sounds/wrongbuzzer.wav";
import zombieImage from "../objects/Zombie.png";
import gunDoorClosed from "../objects/GunDoorClosed.png";
import gunDoorOpen from "../objects/GunDoorOpen.png";
import gunTaken from "../objects/GunTaken.png";
import crosshair from "../objects/Crosshair.png";
import carStopAudio from "../sounds/carstop.wav";
import openCloseAudio from "../sounds/openclose.wav";
import footstepsAudio from "../sounds/footsteps.wav";
import doorKnockAudio from "../sounds/doorknock.wav";
import zombieAudio from "../sounds/zombie.wav";
import shotAudio from "../sounds/shot.wav";
import policeSirenAudio from "../sounds/policesiren.wav";
import elevatorAudio from "../sounds/elevator.wav";
import gunshotAudio from "../sounds/gunshot.wav";
import { SOUND_KEYS } from "../audio";
import ending1Image from "../objects/ending1cops.png";
import ending2Image from "../objects/ending2office.png";
import ending3Image from "../objects/ending3fired.png";



export class Preloader extends Scene {
    constructor() {
        super("Preloader");
    }

    init() {
        this.cameras.main.setBackgroundColor(0x1b3022);

        this.add.rectangle(512, 384, 468, 32, 0x0d1a10).setStrokeStyle(1, 0xb5953a);

        const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xd4a830);

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
        this.load.image("desk-coworker", coworkerImage);
        this.load.image("desk-dude", dudeImage);
        this.load.image("desk-files", filesImage);
        this.load.image("desk-files-hover", filesHoverImage);
        this.load.image("desk-textbox", textBoxImage);
        this.load.image("zombie", zombieImage);
        this.load.image("gun-door-closed", gunDoorClosed);
        this.load.image("gun-door-open", gunDoorOpen);
        this.load.image("gun-taken", gunTaken);
        this.load.image("crosshair", crosshair);
        this.load.image("ending-1", ending1Image);
        this.load.image("ending-2", ending2Image);
        this.load.image("ending-3", ending3Image);

        this.load.audio(SOUND_KEYS.fanAudio, fanAudio);
        this.load.audio(SOUND_KEYS.dudeNoise, dudeNoiseAudio);
        this.load.audio(SOUND_KEYS.correctDing, correctDingAudio);
        this.load.audio(SOUND_KEYS.wrongBuzzer, wrongBuzzerAudio);
        this.load.audio(SOUND_KEYS.pageTurn, pageTurnAudio);
        this.load.audio(SOUND_KEYS.mouseClick, mouseClickAudio);
        this.load.audio(SOUND_KEYS.emailNoti, emailNotiAudio);
        this.load.audio(SOUND_KEYS.hey, heyAudio);
        this.load.audio(SOUND_KEYS.menuTheme, menuThemeAudio);
        this.load.audio(SOUND_KEYS.carStop, carStopAudio);
        this.load.audio(SOUND_KEYS.openClose, openCloseAudio);
        this.load.audio(SOUND_KEYS.footsteps, footstepsAudio);
        this.load.audio(SOUND_KEYS.doorKnock, doorKnockAudio);
        this.load.audio(SOUND_KEYS.zombie, zombieAudio);
        this.load.audio(SOUND_KEYS.shot, shotAudio);
        this.load.audio(SOUND_KEYS.policeSiren, policeSirenAudio);
        this.load.audio(SOUND_KEYS.elevator, elevatorAudio);
        this.load.audio(SOUND_KEYS.gunshot, gunshotAudio);
    }

    create() {
        this.scene.start("MainMenu");
    }
}
