// =================================================
// main.js (Ponto de Entrada Principal)
// =================================================

import MenuScene     from './scenes/MenuScene.js';
import OptionsScene  from './scenes/OptionsScene.js';
import GameScene     from './scenes/GameScene.js';
import PauseScene    from './scenes/PauseScene.js';
import UIScene       from './scenes/UIScene.js';
import PowerUpScene  from './scenes/PowerUpScene.js';
import GameOverScene from './scenes/GameOverScene.js';

/**
 * Configuração Global do Motor Phaser 3
 */
const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,

    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },

    render: {
        pixelArt: true
    },

    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },

    input: {
        cursor: 'url(assets/images/cursor.png), pointer'
    },

    scene: [MenuScene, OptionsScene, GameScene, PauseScene, UIScene, PowerUpScene, GameOverScene]
};

const game = new Phaser.Game(config);
