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

        // ── Overlay escurecido com fade-in ──
        const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.82).setAlpha(0);
        this.tweens.add({ targets: overlay, alpha: 1, duration: 400, ease: 'Sine.out' });

        // ── Painel de madeira: "pop" a entrar ──
        const container = this.add.image(640, 410, 'ui_container').setScale(0);
        this.tweens.add({ targets: container, scale: 4, duration: 500, ease: 'Back.out', delay: 150 });

        // ── Título GAME OVER: fade + scale a entrar ──
        const title = this.add.text(640, 135, textos.GAME_OVER, {
            fontFamily: 'Antiquity',
            fontSize: '72px',
            fill: '#ff4444',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5).setScale(0.6).setAlpha(0);
        this.tweens.add({ targets: title, scale: 1, alpha: 1, duration: 450, ease: 'Back.out', delay: 200 });

        // ── Conteúdo do painel (score, ronda, botões): fade-in depois do painel ──
        const content = [];

        content.push(this.add.text(640, 346, `${textos.SCORE}: ${this.finalScore}`, {
            fontFamily: 'Antiquity',
            fontSize: '34px',
            fill: '#f4d03f',
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5));

        content.push(this.add.text(640, 388, `${textos.ROUND}: ${this.finalRound}`, {
            fontFamily: 'Antiquity',
            fontSize: '28px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5));

        content.push(...this.createButton(640, 448, textos.PLAY_AGAIN, () => {
            this.scene.stop('GameOverScene');
            this.scene.stop('GameScene');
            this.scene.start('GameScene');
        }));

        content.push(...this.createButton(640, 535, textos.MAIN_MENU, () => {
            this.scene.stop('GameOverScene');
            this.scene.stop('GameScene');
            this.scene.start('MenuScene');
        }));

        content.forEach(obj => obj.setAlpha(0));
        this.tweens.add({ targets: content, alpha: 1, duration: 350, ease: 'Sine.out', delay: 450 });
    }

    /**
     * Cria um botão interativo (imagem + texto) com feedback de hover/clique.
     * @returns {Phaser.GameObjects.GameObject[]} Objetos criados, para animação de entrada
     */
    createButton(x, y, textString, callback) {
        const btnImage = this.add.image(x, y, 'btn_normal').setInteractive();
        btnImage.setScale(0.5);

        const label = this.add.text(x, y, textString, {
            fontFamily: 'Antiquity',
            fontSize: '18px',
            fill: '#000000',
        }).setOrigin(0.5);

        btnImage.on('pointerover',  () => btnImage.setTint(0xdddddd));
        btnImage.on('pointerout',   () => btnImage.clearTint());
        btnImage.on('pointerdown',  () => { btnImage.setTint(0x888888); this.sound.play('click_sfx', { volume: 0.6 }); });
        btnImage.on('pointerup',    () => { btnImage.clearTint(); callback(); });

        return [btnImage, label];
    }
}
