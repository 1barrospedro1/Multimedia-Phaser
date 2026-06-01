// ==============================================================================
// GameScene.js (Cena Principal do Jogo)
// ==============================================================================

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#2d6a4f');

        this.input.keyboard.on('keydown-ESC', () => {
            if (this.scene.manager.isActive('PauseScene')) {
                return;
            }
            this.scene.pause();
            this.scene.launch('PauseScene');
        });
    }
}
