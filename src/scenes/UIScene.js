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
    /** Largura da barra de cooldown do dash (píxeis). */
    static DASH_BAR_W = 80;
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
        const S    = 0.6;   // escala da barra (ajusta aqui para maior/menor)
        const barX = PADDING;
        const hpY  = Math.ceil(57 * S / 2) + 4; // garante que o topo não é cortado

        // Fundo da barra (moldura dourada, 395x57)
        this.add.image(barX, hpY, 'hp_bg')
            .setOrigin(0, 0.5)
            .setScale(S)
            .setScrollFactor(0);

        // Preenchimento (319x39) — inset de 38px escalado, origem à esquerda
        this._hpFill = this.add.image(barX + 57 * S, hpY, 'hp_fill')
            .setOrigin(0, 0.5)
            .setScale(S)
            .setScrollFactor(0);

        // Coração na ponta esquerda
        const heartScale = 0.6;
        this.add.image(barX + 30 * S, hpY, 'hp_heart')
            .setOrigin(0.5, 0.5)
            .setScale(heartScale)
            .setScrollFactor(0);

        this._hpFillW = 319; // dimensões em coordenadas de textura (sem escala)
        this._hpFillH = 39;
        this._hpCropW = 319;
        this._hpTween = null;

        // Texto HP à direita da barra escalada
        this._hpText = this.add.text(barX + 395 * S + 10, hpY, '', style).setOrigin(0, 0.5);

        // Round ao centro
        this._roundText = this.add.text(W / 2, hpY, '', style).setOrigin(0.5);

        // Score à direita
        this._scoreText = this.add.text(W - PADDING, hpY, '', style).setOrigin(1, 0.5);

        // ── Barra de XP: logo abaixo da barra de HP ──
        const xpY = hpY + 57 * S;

        this.add.image(barX, xpY, 'hp_bg')
            .setOrigin(0, 0.5)
            .setScale(S)
            .setScrollFactor(0);

        this._xpFill = this.add.image(barX + 57 * S, xpY, 'xp_fill')
            .setOrigin(0, 0.5)
            .setDisplaySize(Math.round(319 * S), Math.round(39 * S))
            .setScrollFactor(0);
        this._xpFill.postFX.addColorMatrix().brightness(1.5);

        this.add.image(barX + 30 * S, xpY, 'xp_icon')
            .setOrigin(0.5, 0.5)
            .setDisplaySize(60, 32)
            .setScrollFactor(0);

        this._xpFillW = this._xpFill.width;
        this._xpFillH = this._xpFill.height;
        this._xpCropW = 0;

        this._xpText = this.add.text(barX + 395 * S + 10, xpY, '', style).setOrigin(0, 0.5);

        // ── Dash cooldown (canto inferior direito) ──────────────────────────
        const { DASH_BAR_W } = UIScene;
        const dashBarX = W - PADDING - DASH_BAR_W;
        const dashBarY = H - BOTTOM_H / 2;

        this.add.rectangle(dashBarX, dashBarY, DASH_BAR_W, BAR_H, 0x1a1a2e, 0.9)
            .setOrigin(0, 0.5)
            .setStrokeStyle(2, 0x555555);

        this._dashFill = this.add.rectangle(dashBarX + 2, dashBarY, DASH_BAR_W - 4, BAR_H - 4, 0x44cc88)
            .setOrigin(0, 0.5);

        this._dashLabel = this.add.text(dashBarX + DASH_BAR_W / 2, dashBarY, '»» 1/1', {
            fontFamily: 'Antiquity',
            fontSize: '13px',
            fill: '#000000',
            stroke: '#ffffff',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(1);

        this._W = W;
        this._H = H;

        // ── Subscrever eventos da GameScene ──────────────────────────────────
        const game = this.scene.get('GameScene');
        this._game = game;

        // Estado inicial (a GameScene já criou o jogador quando lança esta cena)
        this.refresh({
            hp: game.player.hp, maxHp: game.player.maxHp,
            score: game.score, round: game.round,
            xp: game.player.xp, xpToLevel: game.player.xpToLevel
        });

        game.events.on('hud-changed', this.refresh, this);
        game.events.on('game-over', this.showGameOver, this);
        game.events.on('round-started', this.showRoundBanner, this);

        // Liberta os listeners quando a GameScene termina (evita fugas/erros)
        game.events.once('shutdown', () => {
            game.events.off('hud-changed', this.refresh, this);
            game.events.off('game-over', this.showGameOver, this);
            game.events.off('round-started', this.showRoundBanner, this);
        });

        // Mostra já o banner da 1ª ronda: o 'round-started' emitido durante o
        // create() da GameScene ocorre antes desta cena estar pronta para o ouvir
        this.showRoundBanner(game.round);
    }

    /**
     * Mostra um banner animado com o número da ronda no centro do ecrã.
     * @param {number} round - Número da ronda que está a começar
     * @returns {void}
     */
    showRoundBanner(round) {
        const W = this._W;
        const H = this._H;

        const lang   = this.registry.get('idioma');
        const textos = this.cache.json.get(lang);
        const label  = `${textos.ROUND} ${round}`;

        const text = this.add.text(W / 2, -60, label, {
            fontFamily: 'Antiquity',
            fontSize: '38px',
            fill: '#f4d03f',
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5);

        const centerY = H / 2;

        // 1. Entra pelo topo até ao centro
        this.tweens.add({
            targets: text,
            y: centerY,
            duration: 400,
            ease: 'Back.Out',
            onComplete: () => {
                // 2. Fica parado 1.5s e depois sai pelo topo
                this.time.delayedCall(1500, () => {
                    this.tweens.add({
                        targets: text,
                        y: -60,
                        duration: 350,
                        ease: 'Back.In',
                        onComplete: () => {
                            text.destroy();
                            this._game.events.emit('round-banner-done');
                        }
                    });
                });
            }
        });
    }

    /**
     * Mostra a mensagem de Game Over centrada no ecrã.
     * @returns {void}
     */
    showGameOver() {
        this.scene.launch('GameOverScene', {
            score: this._game.score,
            round: this._game.round
        });
        this.scene.bringToTop('GameOverScene');
    }

    /**
     * Atualiza o indicador de cargas de dash a cada frame.
     * @returns {void}
     */
    update() {
        const player = this._game?.player;
        if (!player?.active) return;

        const { currentDashCharges, dashCharges, dashRechargeStart, dashRechargeEnd } = player;
        const now = this.time.now;

        let ratio, color;
        if (currentDashCharges >= dashCharges) {
            ratio = 1;
            color = 0x44cc88; // verde = cheio
        } else {
            const total   = dashRechargeEnd - dashRechargeStart;
            const elapsed = now - dashRechargeStart;
            ratio = total > 0 ? Math.max(0, Math.min(1, elapsed / total)) : 0;
            color = 0x4488ff; // azul = a recarregar
        }

        this._dashFill.setSize((UIScene.DASH_BAR_W - 4) * ratio, UIScene.BAR_H - 4);
        this._dashFill.setFillStyle(color);
        this._dashLabel.setText(`»» ${currentDashCharges}/${dashCharges}`);
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
    updateHealthBar(hp, maxHp) {
        const ratio      = Math.max(0, Math.min(hp / maxHp, 1));
        const targetCrop = Math.round(this._hpFillW * ratio);

        if (this._hpTween) this._hpTween.stop();

        const counter = { crop: this._hpCropW };
        this._hpTween = this.tweens.add({
            targets:  counter,
            crop:     targetCrop,
            duration: 250,
            ease:     'Linear',
            onUpdate: () => {
                this._hpFill.setCrop(0, 0, counter.crop, this._hpFillH);
                this._hpCropW = counter.crop;
            },
            onComplete: () => {
                this._hpFill.setCrop(0, 0, targetCrop, this._hpFillH);
                this._hpCropW = targetCrop;
            }
        });
    }

    refresh({ hp, maxHp, score, round, xp, xpToLevel }) {
        const { BAR_W, BAR_H } = UIScene;

        this.updateHealthBar(hp, maxHp);
        this._hpText.setText(`${Math.max(0, hp)}/${maxHp}`);

        // Round e Score
        this._roundText.setText(`Round: ${round}`);
        this._scoreText.setText(`Score: ${score}`);

        // Barra de XP
        const xpRatio  = xpToLevel ? Math.min(xp / xpToLevel, 1) : 0;
        const xpCrop   = Math.round(this._xpFillW * xpRatio);
        this._xpFill.setCrop(0, 0, xpCrop, this._xpFillH);
        this._xpCropW  = xpCrop;
        this._xpText.setText(`${xp}/${xpToLevel}`);
    }
}