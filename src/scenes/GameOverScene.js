// ==============================================================================
// GameOverScene.js (Menu de Derrota em Overlay)
// ==============================================================================

/**
 * Menu de derrota executado em overlay sobre a GameScene parada.
 * Mostra a pontuação final e permite jogar novamente ou regressar ao menu.
 * @extends Phaser.Scene
 */
export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    init(data) {
        this.finalScore = data.score ?? 0;
        this.finalRound = data.round ?? 1;
    }

    create() {
        const lang   = this.registry.get('idioma');
        const textos = this.cache.json.get(lang);

        this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.82);

        const container = this.add.image(640, 410, 'ui_container');
        container.setScale(4);

        this.add.text(640, 130, textos.GAME_OVER, {
            fontFamily: 'Antiquity',
            fontSize: '72px',
            fill: '#ff4444',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5);

        this.add.text(640, 290, `${textos.SCORE}: ${this.finalScore}`, {
            fontFamily: 'Antiquity',
            fontSize: '32px',
            fill: '#f4d03f',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(640, 340, `${textos.ROUND}: ${this.finalRound}`, {
            fontFamily: 'Antiquity',
            fontSize: '24px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.createButton(640, 440, textos.PLAY_AGAIN, () => {
            this.scene.stop('GameOverScene');
            this.scene.stop('GameScene');
            this.scene.start('GameScene');
        });

        this.createButton(640, 530, textos.MAIN_MENU, () => {
            this.scene.stop('GameOverScene');
            this.scene.stop('GameScene');
            this.scene.start('MenuScene');
        });
    }

    createButton(x, y, textString, callback) {
        const btnImage = this.add.image(x, y, 'btn_normal').setInteractive();
        btnImage.setScale(0.5);

        this.add.text(x, y, textString, {
            fontFamily: 'Antiquity',
            fontSize: '18px',
            fill: '#000000',
        }).setOrigin(0.5);

        btnImage.on('pointerover',  () => btnImage.setTint(0xdddddd));
        btnImage.on('pointerout',   () => btnImage.clearTint());
        btnImage.on('pointerdown',  () => btnImage.setTint(0x888888));
        btnImage.on('pointerup',    () => { btnImage.clearTint(); callback(); });
    }
}
