// ==============================================================================
// UIScene.js (HUD em Overlay)
// ==============================================================================

/**
 * Cena de interface (HUD) executada em paralelo com a GameScene.
 * Por correr numa cena própria, a sua câmara não é afetada pelo zoom da
 * GameScene, garantindo que vida e pontuação ficam fixos no ecrã.
 * Os valores são atualizados via eventos emitidos pela GameScene.
 * @extends Phaser.Scene
 */
export default class UIScene extends Phaser.Scene {
    /**
     * Inicializa a cena com o identificador 'UIScene'.
     */
    constructor() {
        super('UIScene');
    }

    /**
     * Cria os textos do HUD e subscreve os eventos de atualização da GameScene.
     * Lê o estado inicial diretamente da GameScene para não depender da ordem de arranque.
     * @returns {void}
     */
    create() {
        const style = {
            fontFamily: 'Antiquity',
            fontSize: '22px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        };
        this.hpText = this.add.text(16, 14, '', style);
        this.scoreText = this.add.text(16, 44, '', style);

        const game = this.scene.get('GameScene');

        // Estado inicial (a GameScene já criou o jogador quando lança esta cena)
        this.refresh({ hp: game.player.hp, maxHp: game.player.maxHp, score: game.score });

        // Atualizações subsequentes
        game.events.on('hud-changed', this.refresh, this);
        game.events.on('game-over', this.showGameOver, this);

        // Liberta os listeners quando a GameScene termina (evita fugas/erros)
        game.events.once('shutdown', () => {
            game.events.off('hud-changed', this.refresh, this);
            game.events.off('game-over', this.showGameOver, this);
        });
    }

    /**
     * Mostra a mensagem de Game Over centrada no ecrã.
     * @returns {void}
     */
    showGameOver() {
        this.add.text(this.scale.width / 2, this.scale.height / 2, 'GAME OVER', {
            fontFamily: 'Antiquity',
            fontSize: '72px',
            fill: '#ff4444',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5);
    }

    /**
     * Atualiza os textos do HUD com o estado recebido.
     * @param {object} state - Estado atual do jogo
     * @param {number} state.hp - Vida atual do jogador
     * @param {number} state.maxHp - Vida máxima do jogador
     * @param {number} state.score - Pontuação atual
     * @returns {void}
     */
    refresh({ hp, maxHp, score }) {
        this.hpText.setText(`HP: ${Math.max(0, hp)}/${maxHp}`);
        this.scoreText.setText(`Score: ${score}`);
    }
}
