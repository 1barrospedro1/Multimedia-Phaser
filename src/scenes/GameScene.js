// ==============================================================================
// GameScene.js (Cena Principal do Jogo)
// ==============================================================================

/**
 * Cena principal de gameplay.
 * Define o ambiente visual base e gere a pausa do jogo através da tecla ESC,
 * lançando o menu de pausa em overlay sem destruir o estado da cena.
 * @extends Phaser.Scene
 */
export default class GameScene extends Phaser.Scene {
    /**
     * Inicializa a cena com o identificador 'GameScene'.
     */
    constructor() {
        super('GameScene');
    }

    /**
     * Configura o cenário de jogo e o listener de teclado para abrir o menu de pausa.
     * @returns {void}
     */
    create() {
        this.cameras.main.setBackgroundColor('#2d6a4f');

        this.input.keyboard.on('keydown-ESC', () => {
            // Evita abrir múltiplas instâncias do menu de pausa
            if (this.scene.manager.isActive('PauseScene')) {
                return;
            }
            // Pausa a lógica/renderização desta cena e sobrepõe o PauseScene
            this.scene.pause();
            this.scene.launch('PauseScene');
        });
    }
}
