// ==============================================================================
// PauseScene.js (Menu de Pausa em Overlay)
// ==============================================================================

export default class PauseScene extends Phaser.Scene {
    constructor() {
        super('PauseScene');
    }

    create() {
        // --- SISTEMA DE IDIOMA ---
        const langAtual = this.registry.get('idioma');
        const textos = this.cache.json.get(langAtual);
        // -------------------------

        this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.7);

        const container = this.add.image(640, 420, 'ui_container');
        container.setScale(4);

        this.add.text(640, 120, textos.PAUSED, {
            fontFamily: 'Antiquity',
            fontSize: '64px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        const resumeGame = () => {
            this.scene.resume('GameScene');
            this.scene.stop();
        };

        this.input.keyboard.on('keydown-ESC', resumeGame);

        this.createButton(640, 380, textos.RESUME, resumeGame);

        this.createButton(640, 460, textos.SETTINGS, () => {
            this.scene.launch('OptionsScene', { fromScene: 'PauseScene' });
            this.scene.sleep();
        });

        this.createButton(640, 540, textos.MAIN_MENU, () => {
            this.scene.stop('PauseScene');
            this.scene.stop('GameScene');
            this.scene.start('MenuScene');
        });
    }

    createButton(x, y, textString, callback) {
        const btnImage = this.add.image(x, y, 'btn_normal').setInteractive();
        btnImage.setScale(0.5);

        this.add.text(x, y, textString, {
            fontFamily: 'Antiquity',
            fontSize: '24px',
            fill: '#000000',
        }).setOrigin(0.5);

        btnImage.on('pointerover', () => {
            btnImage.setTint(0xdddddd);
        });

        btnImage.on('pointerout', () => {
            btnImage.clearTint();
        });

        btnImage.on('pointerdown', () => {
            btnImage.setTint(0x888888);
        });

        btnImage.on('pointerup', () => {
            btnImage.clearTint();
            callback();
        });
    }
}
