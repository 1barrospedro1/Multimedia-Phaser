// ==============================================================================
// PauseScene.js (Menu de Pausa em Overlay)
// ==============================================================================

/**
 * Menu de pausa executado em overlay sobre a GameScene pausada.
 * Permite retomar o jogo, aceder às opções (com sleep/wake) ou regressar ao menu principal.
 * @extends Phaser.Scene
 */
export default class PauseScene extends Phaser.Scene {
    /**
     * Inicializa a cena com o identificador 'PauseScene'.
     */
    constructor() {
        super('PauseScene');
    }

    /**
     * Constrói o overlay de pausa: escurecimento do ecrã, painel UI e navegação.
     * @returns {void}
     */
    create() {
        const langAtual = this.registry.get('idioma');
        const textos = this.cache.json.get(langAtual);

        // Overlay semi-transparente para manter o jogo visível ao fundo
        this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.7);

        const container = this.add.image(640, 420, 'ui_container');
        container.setScale(4);

        // Título após o contentor para renderizar por cima do painel de madeira
        this.add.text(640, 120, textos.PAUSED, {
            fontFamily: 'Antiquity',
            fontSize: '64px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        const resumeGame = () => {
            // Retoma a GameScene e encerra este overlay de pausa
            this.scene.resume('GameScene');
            this.scene.stop();
        };

        // ESC no menu de pausa equivale ao botão Continuar
        this.input.keyboard.on('keydown-ESC', resumeGame);

        this.createButton(640, 380, textos.RESUME, resumeGame);

        this.createButton(640, 460, textos.SETTINGS, () => {
            // Lança opções em overlay; sleep preserva o estado desta cena
            this.scene.launch('OptionsScene', { fromScene: 'PauseScene' });
            this.scene.sleep();
        });

        this.createButton(640, 540, textos.MAIN_MENU, () => {
            // Termina jogo e pausa antes de regressar ao menu principal
            this.scene.stop('PauseScene');
            this.scene.stop('GameScene');
            this.scene.start('MenuScene');
        });

        // Ao regressar das opções, reconstrói a UI com o idioma atualizado
        this.events.on('wake', () => {
            this.scene.restart();
        });
    }

    /**
     * Cria um botão interativo composto por imagem e texto,
     * com feedback visual de hover e clique.
     * @param {number} x - Coordenada X do centro do botão
     * @param {number} y - Coordenada Y do centro do botão
     * @param {string} textString - Texto localizado a exibir no botão
     * @param {function} callback - Função executada ao libertar o clique
     * @returns {void}
     */
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
