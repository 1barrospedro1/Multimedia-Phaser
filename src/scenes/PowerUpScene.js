// ==============================================================================
// PowerUpScene.js (Ecrã de Escolha de Power-Up com Raridades)
// ==============================================================================

export default class PowerUpScene extends Phaser.Scene {

    /** Probabilidade de cada raridade aparecer (soma = 100). */
    static TIER_WEIGHTS = { common: 50, rare: 25, epic: 15, legendary: 7, mythic: 3 };

    /** Estilo visual de cada raridade. */
    static TIER_STYLES = {
        common:    { bg: 0x455a64, hover: 0x546e7a, border: 0x90a4ae, label: '#90a4ae' },
        rare:      { bg: 0x1565c0, hover: 0x1976d2, border: 0x42a5f5, label: '#42a5f5' },
        epic:      { bg: 0x6a1b9a, hover: 0x7b1fa2, border: 0xce93d8, label: '#ce93d8' },
        legendary: { bg: 0xbf360c, hover: 0xd84315, border: 0xffa726, label: '#ffa726' },
        mythic:    { bg: 0x7b0000, hover: 0x9b0000, border: 0xff1744, label: '#ff5252' },
    };

    /**
     * Catálogo de upgrades.
     * Cada entrada define quais raridades estão disponíveis e o valor correspondente.
     *
     * attackspeed: bónus em ataques/seg
     * aoe:         raio em px adicionado
     * cdreduction: % de redução ao cooldown do dash
     * dashes:      cargas extra de dash
     */
    static UPGRADES = [
        { id: 'hp',          icon: '❤️',  tiers: { rare: 20,  epic: 35,  legendary: 50,  mythic: 80  } },
        { id: 'damage',      icon: '🏹',  tiers: { common: 10, rare: 15, epic: 20,  legendary: 30,  mythic: 45  } },
        { id: 'attackspeed', icon: '⚡',  tiers: { common: 0.3, rare: 0.45, epic: 0.6, legendary: 1.0, mythic: 1.5 } },
        { id: 'critchance',  icon: '🎯',  tiers: { common: 5,  rare: 7,   epic: 10,  legendary: 15,  mythic: 25  } },
        { id: 'critdamage',  icon: '💥',  tiers: { rare: 75,  epic: 100, legendary: 150, mythic: 250 } },
        { id: 'aoe',         icon: '🔥',  tiers: { rare: 90,  epic: 45,  legendary: 60,  mythic: 90  } },
        { id: 'cdreduction', icon: '⏱️',  tiers: { rare: 10,  epic: 15,  legendary: 20,  mythic: 30  } },
        { id: 'bounce',      icon: '↩️',  tiers: { legendary: 1, mythic: 2 } },
        { id: 'pierce',      icon: '🔱',  tiers: { legendary: 1, mythic: 2 } },
        { id: 'speed',       icon: '👟',  tiers: { common: 15, rare: 20,  epic: 30,  legendary: 45,  mythic: 60  } },
        { id: 'dashes',      icon: '»»',  tiers: { epic: 2,   legendary: 3, mythic: 5 } },
        { id: 'extrachoice', icon: '🃏',  tiers: { legendary: 1, mythic: 2 } },
    ];

    constructor() {
        super('PowerUpScene');
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;

        this.sound.play('powerup_sfx', { volume: 0.6 });

        const lang   = this.registry.get('idioma');
        const textos = this.cache.json.get(lang);

        this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.82);

        this.add.text(W / 2, 75, textos.LEVEL_UP, {
            fontFamily: 'Antiquity', fontSize: '52px',
            fill: '#f4d03f', stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(W / 2, 138, textos.CHOOSE_POWER, {
            fontFamily: 'Antiquity', fontSize: '26px',
            fill: '#ffffff', stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5);

        const player  = this.scene.get('GameScene').player;
        const count   = Math.min(3 + player.extraChoices, 5);
        const options = this._pickCards(count, player);

        const cardW  = 200;
        const cardH  = 250;
        const gap    = 30;
        const totalW = count * cardW + (count - 1) * gap;
        const startX = (W - totalW) / 2 + cardW / 2;
        const cardY  = H / 2 + 40;

        options.forEach((card, i) => {
            this._createCard(startX + i * (cardW + gap), cardY, cardW, cardH, card, textos);
        });
    }

    // ------------------------------------------------------------------
    // Seleção ponderada
    // ------------------------------------------------------------------

    _pickTier() {
        const entries = Object.entries(PowerUpScene.TIER_WEIGHTS);
        const total   = entries.reduce((s, [, w]) => s + w, 0);
        let rand = Math.random() * total;
        for (const [tier, w] of entries) {
            rand -= w;
            if (rand <= 0) return tier;
        }
        return 'common';
    }

    _pickCards(count, player) {
        const result    = [];
        const usedIds   = new Set();
        const usedTiers = new Set();

        for (let i = 0; i < count; i++) {
            let card = null;
            let attempts = 0;

            while (!card && attempts < 60) {
                attempts++;
                const tier = this._pickTier();
                if (usedTiers.has(tier)) continue;

                const available = PowerUpScene.UPGRADES.filter(u =>
                    u.tiers[tier] !== undefined &&
                    !usedIds.has(u.id) &&
                    this._isValid(u.id, player)
                );
                if (available.length === 0) continue;

                const upgrade = Phaser.Utils.Array.GetRandom(available);
                card = { id: upgrade.id, icon: upgrade.icon, tier, value: upgrade.tiers[tier] };
            }

            if (card) {
                result.push(card);
                usedIds.add(card.id);
                usedTiers.add(card.tier);
            }
        }

        return result;
    }

    _isValid(id, player) {
        if (id === 'extrachoice' && player.extraChoices >= 3) return false;
        if (id === 'pierce' && player.pierceCount >= 5)       return false;
        return true;
    }

    // ------------------------------------------------------------------
    // Criação de cartões
    // ------------------------------------------------------------------

    _createCard(cx, cy, w, h, card, textos) {
        const style   = PowerUpScene.TIER_STYLES[card.tier];
        const nameKey = `PU_${card.id.toUpperCase()}_NAME`;
        const descKey = `PU_${card.id.toUpperCase()}_DESC`;
        const label   = textos[nameKey] ?? card.id;
        const rawDesc = textos[descKey] ?? '';
        const desc    = rawDesc.replace('{v}', this._formatValue(card));

        // Fundo interativo
        const bg = this.add.rectangle(cx, cy, w, h, style.bg, 0.95)
            .setStrokeStyle(2, style.border)
            .setInteractive({ useHandCursor: true });

        // Ícone
        this.add.text(cx, cy - 78, card.icon, { fontSize: '44px' }).setOrigin(0.5);

        // Nome
        this.add.text(cx, cy - 18, label, {
            fontFamily: 'Antiquity', fontSize: '18px',
            fill: '#ffffff', stroke: '#000000', strokeThickness: 3,
            wordWrap: { width: w - 20 }, align: 'center'
        }).setOrigin(0.5);

        // Descrição
        this.add.text(cx, cy + 38, desc, {
            fontFamily: 'Antiquity', fontSize: '14px',
            fill: '#dddddd', wordWrap: { width: w - 24 }, align: 'center'
        }).setOrigin(0.5);

        // Badge de raridade
        const tierNames = {
            common: '● COMUM', rare: '★ RARO', epic: '✦ ÉPICO',
            legendary: '♦ LENDÁRIO', mythic: '✵ MÍTICO'
        };
        this.add.text(cx, cy + 100, tierNames[card.tier] ?? card.tier, {
            fontFamily: 'Antiquity', fontSize: '12px', fill: style.label
        }).setOrigin(0.5);

        // Interatividade
        bg.on('pointerover',  () => bg.setFillStyle(style.hover));
        bg.on('pointerout',   () => bg.setFillStyle(style.bg));
        bg.on('pointerdown',  () => { bg.setFillStyle(0x1a252f); this.sound.play('click_sfx', { volume: 0.6 }); });
        bg.on('pointerup',    () => this._choose(card));
    }

    _formatValue(card) {
        if (card.id === 'attackspeed') return card.value.toFixed(2);
        if (card.id === 'cdreduction') return `${card.value}`;
        if (card.id === 'critchance')  return `${card.value}`;
        if (card.id === 'critdamage')  return `${card.value}`;
        return card.value;
    }

    // ------------------------------------------------------------------
    // Escolha
    // ------------------------------------------------------------------

    _choose(card) {
        const gameScene = this.scene.get('GameScene');
        gameScene.player.applyPowerUp(card);
        gameScene.updateHud();

        this.scene.resume('GameScene');
        this.scene.stop();
    }
}
