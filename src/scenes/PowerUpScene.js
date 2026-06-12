// ==============================================================================
// PowerUpScene.js (Ecrã de Escolha de Power-Up)
// ==============================================================================

/**
 * Cena de level-up que aparece em overlay sobre a GameScene pausada.
 * Apresenta 3 power-ups aleatórios (sem repetição) para o jogador escolher.
 * Ao escolher, aplica o power-up, retoma a GameScene e fecha o overlay.
 * @extends Phaser.Scene
 */
export default class PowerUpScene extends Phaser.Scene {

    /** Catálogo completo de power-ups disponíveis. */
    static POOL = [
        { id: 'speed',       tier: 'common' },
        { id: 'damage',      tier: 'common' },
        { id: 'firerate',    tier: 'common' },
        { id: 'hp',          tier: 'common' },
        { id: 'multiarrow',  tier: 'rare'   },
        { id: 'triplearrow', tier: 'rare'   },
        { id: 'regen',       tier: 'rare'   },
        { id: 'piercing',    tier: 'rare'   },
    ];

    constructor() {
        super('PowerUpScene');
    }

    /**
     * Constrói o ecrã de escolha: overlay, título e 3 botões de power-up.
     * @returns {void}
     */
    create() {
        const W = this.scale.width;
        const H = this.scale.height;

        const lang   = this.registry.get('idioma');
        const textos = this.cache.json.get(lang);

        // Overlay escuro semi-transparente
        this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.82);

        // Título "NÍVEL ACIMA!"
        this.add.text(W / 2, 80, textos.LEVEL_UP, {
            fontFamily: 'Antiquity',
            fontSize: '52px',
            fill: '#f4d03f',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Sub-título
        this.add.text(W / 2, 145, textos.CHOOSE_POWER, {
            fontFamily: 'Antiquity',
            fontSize: '26px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Escolhe 3 power-ups aleatórios sem repetição, adaptados ao estado do jogador
        const player = this.scene.get('GameScene').player;
        const options = this._pickThree(player);

        // Posições dos 3 cartões (centrados horizontalmente)
        const cardW   = 210;
        const cardH   = 240;
        const gap     = 40;
        const totalW  = 3 * cardW + 2 * gap;
        const startX  = (W - totalW) / 2 + cardW / 2;
        const cardY   = H / 2 + 30;

        options.forEach((pu, i) => {
            const cx = startX + i * (cardW + gap);
            this._createCard(cx, cardY, cardW, cardH, pu, textos);
        });
    }

    /**
     * Escolhe 3 power-ups aleatórios sem repetição do POOL, filtrando
     * variantes que já não fazem sentido para o estado atual do jogador
     * (ex.: "Tiro Triplo" só aparece depois de já se ter o "Tiro Duplo").
     * @param {Player} player - Jogador atual
     * @returns {object[]}
     * @private
     */
    _pickThree(player) {
        const pool = PowerUpScene.POOL.filter(pu => {
            if (pu.id === 'multiarrow')  return player.arrowCount < 2;
            if (pu.id === 'triplearrow') return player.arrowCount === 2;
            return true;
        });
        return Phaser.Utils.Array.Shuffle(pool).slice(0, 3);
    }

    /**
     * Cria um cartão interativo para um power-up.
     * @param {number} cx - Centro X
     * @param {number} cy - Centro Y
     * @param {number} w  - Largura do cartão
     * @param {number} h  - Altura do cartão
     * @param {object} pu - Dados do power-up { id, tier }
     * @param {object} textos - Dicionário de textos localizado
     * @private
     */
    _createCard(cx, cy, w, h, pu, textos) {
        const tierColor = pu.tier === 'rare' ? 0x8e44ad : 0x2c3e50;
        const borderColor = pu.tier === 'rare' ? 0xc39bd3 : 0x95a5a6;

        // Fundo do cartão
        const bg = this.add.rectangle(cx, cy, w, h, tierColor, 0.95)
            .setStrokeStyle(2, borderColor)
            .setInteractive({ useHandCursor: true });

        // Ícone emoji (texto grande)
        const iconMap = {
            speed:      '👟',
            damage:     '🏹',
            firerate:   '⚡',
            hp:         '❤️',
            multiarrow: '🎯',
            triplearrow: '\u{1F31F}',
            regen:      '✨',
            piercing:   '🔱',
        };

        this.add.text(cx, cy - 70, iconMap[pu.id] ?? '⭐', {
            fontSize: '48px'
        }).setOrigin(0.5);

        // Nome do power-up
        this.add.text(cx, cy - 10, textos[`PU_${pu.id.toUpperCase()}_NAME`], {
            fontFamily: 'Antiquity',
            fontSize: '19px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            wordWrap: { width: w - 20 },
            align: 'center'
        }).setOrigin(0.5);

        // Descrição do power-up
        this.add.text(cx, cy + 40, textos[`PU_${pu.id.toUpperCase()}_DESC`], {
            fontFamily: 'Antiquity',
            fontSize: '15px',
            fill: '#cccccc',
            wordWrap: { width: w - 24 },
            align: 'center'
        }).setOrigin(0.5);

        // Badge de tier
        const tierLabel = pu.tier === 'rare' ? '★ RARO' : '● COMUM';
        const tierTextColor = pu.tier === 'rare' ? '#c39bd3' : '#95a5a6';
        this.add.text(cx, cy + 95, tierLabel, {
            fontFamily: 'Antiquity',
            fontSize: '13px',
            fill: tierTextColor
        }).setOrigin(0.5);

        // Hover e clique
        bg.on('pointerover', () => bg.setFillStyle(pu.tier === 'rare' ? 0xa569bd : 0x34495e));
        bg.on('pointerout',  () => bg.setFillStyle(tierColor));
        bg.on('pointerdown', () => bg.setFillStyle(0x1a252f));
        bg.on('pointerup',   () => this._choose(pu.id));
    }

    /**
     * Aplica o power-up escolhido, retoma o jogo e fecha este overlay.
     * @param {string} id - Id do power-up selecionado
     * @private
     */
    _choose(id) {
        const gameScene = this.scene.get('GameScene');
        gameScene.player.applyPowerUp(id);
        gameScene.updateHud();

        this.scene.resume('GameScene');
        this.scene.stop();
    }
}
