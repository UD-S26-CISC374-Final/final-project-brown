import { Boot } from "./scenes/boot";
import { GameOver } from "./scenes/game-over";
import { Level1 as MainGame } from "./scenes/level1";
import { MainMenu } from "./scenes/main-menu";
import { CANVAS, Game } from "phaser";
import { Preloader } from "./scenes/preloader";
import { Shop } from "./scenes/shop";
import { Tutorial } from "./scenes/tutorial";

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
    title: "My Untitled CISC374 Game",
    version: "0.0.1",
    type: CANVAS,
    parent: "game-container",
    backgroundColor: "#ffffff",
    scene: [Boot, Preloader, MainMenu, Tutorial, MainGame, Shop, GameOver],
    scale: {
        parent: "game-container",
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1024,
        height: 768,
    },
    physics: {
        default: "arcade",
        arcade: {
            debug: false,
            gravity: { x: 0, y: 300 },
        },
    },
    input: {
        keyboard: true,
        mouse: true,
        touch: true,
        gamepad: false,
    },
    render: {
        pixelArt: false,
        antialias: true,
    },
};

const StartGame = (parent: string) => {
    const game = new Game({ ...config, parent });
    (globalThis as { __phaserGame?: Game }).__phaserGame = game;
    return game;
};

export default StartGame;
