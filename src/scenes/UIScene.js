// ==============================================================================
// UIScene.js (HUD em Overlay)
// ==============================================================================

/**
 * Cena de interface (HUD) executada em paralelo com a GameScene.
 * Por correr numa cena própria, a sua câmara não é afetada pelo zoom da
 * GameScene, garantindo que o HUD fica fixo no ecrã.
 *
 * HUD minimalista, com apenas duas barras:
 * - Painel superior: barra de HP (cor dinâmica) + valor, Round ao centro, Score à direita.
 * - Painel inferior: barra de XP (roxa) + valor.
 *
 * As stats (SPD/DMG/RATE) não são mostradas aqui — só aparecem na PowerUpScene.
 * @extends Phaser.Scene
 */
export default class UIScene extends Phaser.Scene {
    /** Largura das barras de HP/XP (píxeis). */
    static BAR_W = 280;
    /** Altura das barras de HP/XP (píxeis). */
    static BAR_H = 22;
    /** Margem entre as barras e os bordos do ecrã (píxeis). */
    static PADDING = 20;
    /** Altura do painel superior (píxeis). */
    static TOP_H = 50;
    /** Altura do painel inferior (píxeis). */
    static BOTTOM_H = 44;

    /**
     * Inicializa a cena com o identificador 'UIScene'.
     */
    constructor() {
        super('UIScene');
    }

    /**
     * Cria os painéis e barras do HUD e subscreve os eventos de atualização da GameScene.
     * @returns {void}
     */
    create() {
        const W = this.scale.width;
        const H = this.scale.height;
        const { BAR_W, BAR_H, PADDING, TOP_H, BOTTOM_H } = UIScene;

        const style = {
            fontFamily: 'Antiquity',
            fontSize: '22px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        };

        // ── Painel superior: HP (esquerda), Round (centro), Score (direita) ──
        const hpY = TOP_H / 2;

        // Fundo (track) da barra de HP
        this.add.rectangle(PADDING, hpY, BAR_W, BAR_H, 0x1a1a2e, 0.9)
            .setOrigin(0, 0.5)
            .setStrokeStyle(2, 0x555555);

        // Preenchimento da barra de HP (cor muda conforme a vida)
        this._hpFill = this.add.rectangle(PADDING + 2, hpY, BAR_W - 4, BAR_H - 4, 0x2ecc71)
            .setOrigin(0, 0.5);

        // Valor "100/100" ao lado da barra de HP
        this._hpText = this.add.text(PADDING + BAR_W + 12, hpY, '', style).setOrigin(0, 0.5);

        // Round ao centro
        this._roundText = this.add.text(W / 2, hpY, '', style).setOrigin(0.5);

        // Score à direita
        this._scoreText = this.add.text(W - PADDING, hpY, '', style).setOrigin(1, 0.5);

        // ── Painel inferior: barra de XP ─────────────────────────────────────
        const xpY = H - BOTTOM_H / 2;

        // Fundo (track) da barra de XP
        this.add.rectangle(PADDING, xpY, BAR_W, BAR_H, 0x1a1a2e, 0.9)
            .setOrigin(0, 0.5)
            .setStrokeStyle(2, 0x555555);

        // Preenchimento da barra de XP (roxo, começa vazio)
        this._xpFill = this.add.rectangle(PADDING + 2, xpY, 0, BAR_H - 4, 0x8e44ad)
            .setOrigin(0, 0.5);

        // Valor "0/200" ao lado da barra de XP
        this._xpText = this.add.text(PADDING + BAR_W + 12, xpY, '', style).setOrigin(0, 0.5);

        this._W = W;
        this._H = H;

        // ── Subscrever eventos da GameScene ──────────────────────────────────
        const game = this.scene.get('GameScene');

        // Estado inicial (a GameScene já criou o jogador quando lança esta cena)
        this.refresh({
            hp: game.player.hp, maxHp: game.player.maxHp,
            score: game.score, round: game.round,
            xp: game.player.xp, xpToLevel: game.player.xpToLevel
        });

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
        this.add.text(this._W / 2, this._H / 2, 'GAME OVER', {
            fontFamily: 'Antiquity',
            fontSize: '72px',
            fill: '#ff4444',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5);
    }

    /**
     * Atualiza a barra de HP, o Round, o Score e a barra de XP.
     * @param {object} state - Estado atual do jogo
     * @param {number} state.hp - Vida atual do jogador
     * @param {number} state.maxHp - Vida máxima do jogador
     * @param {number} state.score - Pontuação atual
     * @param {number} state.round - Ronda atual
     * @param {number} state.xp - XP atual
     * @param {number} state.xpToLevel - XP necessário para o próximo nível
     * @returns {void}
     */
    refresh({ hp, maxHp, score, round, xp, xpToLevel }) {
        const { BAR_W, BAR_H } = UIScene;

        // Barra de HP: largura proporcional + cor conforme o nível de vida
        const hpRatio = Math.max(0, Math.min(hp / maxHp, 1));
        this._hpFill.setSize((BAR_W - 4) * hpRatio, BAR_H - 4);
        this._hpFill.setFillStyle(
            hpRatio > 0.5 ? 0x2ecc71 : hpRatio > 0.25 ? 0xf1c40f : 0xe74c3c
        );
        this._hpText.setText(`${Math.max(0, hp)}/${maxHp}`);

        // Round e Score
        this._roundText.setText(`Round: ${round}`);
        this._scoreText.setText(`Score: ${score}`);

        // Barra de XP
        const xpRatio = xpToLevel ? Math.min(xp / xpToLevel, 1) : 0;
        this._xpFill.setSize((BAR_W - 4) * xpRatio, BAR_H - 4);
        this._xpText.setText(`${xp}/${xpToLevel}`);
    }
}