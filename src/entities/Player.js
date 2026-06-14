// ==============================================================================
// Player.js (Entidade do Jogador)
// ==============================================================================

/**
 * Jogador controlado pelo utilizador.
 * Arqueiro com movimento livre em 8 direções (WASD/setas) e ataque automático
 * gerido pela cena. Estende um sprite com física Arcade para colisões e velocidade.
 * @extends Phaser.Physics.Arcade.Sprite
 */
export default class Player extends Phaser.Physics.Arcade.Sprite {
    /** Velocidade de movimento base em píxeis por segundo. */
    static BASE_SPEED = 170;
    /** Dano base por seta. */
    static BASE_DAMAGE = 15;
    /** Intervalo base (ms) entre disparos. */
    static BASE_FIRE_RATE = 700;
    /** XP necessário para o primeiro nível, aumenta 100 por nível. */
    static BASE_XP_TO_LEVEL = 200;
    /** XP ganho por orc morto. */
    static XP_PER_KILL = 10;
    /** Intervalo (ms) entre ticks de regeneração de HP. */
    static REGEN_INTERVAL = 3000;
    /** Tempo (ms) que a regeneração fica em pausa após o jogador levar dano. */
    static REGEN_PAUSE_AFTER_HIT = 5000;

    /**
     * Cria o jogador, regista-o na cena e ativa a física.
     * @param {Phaser.Scene} scene - Cena onde o jogador é inserido
     * @param {number} x - Posição inicial X (em píxeis)
     * @param {number} y - Posição inicial Y (em píxeis)
     */
    constructor(scene, x, y) {
        super(scene, x, y, 'player_idle');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setScale(0.6);
        this.body.setSize(22, 28);
        this.body.setOffset(39, 50);
        this.setCollideWorldBounds(true);

        /** Pontos de vida atuais. */
        this.hp = 100;
        /** Pontos de vida máximos. */
        this.maxHp = 100;
        /** Indica se o jogador morreu. */
        this.dead = false;

        // --- Stats dinâmicas ---
        /** Velocidade atual de movimento. */
        this.speed = Player.BASE_SPEED;
        /** Dano atual por seta. */
        this.damage = Player.BASE_DAMAGE;
        /** Intervalo atual (ms) entre disparos. */
        this.fireRate = Player.BASE_FIRE_RATE;
        /** Número de setas disparadas por tiro. */
        this.arrowCount = 1;
        /** Se as setas atravessam inimigos. */
        this.piercing = false;
        /** HP regenerado por segundo (0 = sem regen). */
        this.regenPerSec = 0;
        /** Timestamp (scene.time.now) até ao qual a regeneração fica em pausa. */
        this.regenPausedUntil = 0;
        /** Nº de vezes que cada power-up já foi escolhido (para diminishing returns). */
        this.powerUpCounts = {};

        // --- Sistema de XP / Nível ---
        /** XP atual. */
        this.xp = 0;
        /** Nível atual. */
        this.level = 1;
        /** XP necessário para o próximo nível. */
        this.xpToLevel = Player.BASE_XP_TO_LEVEL;

        this.play('player_idle');

        // Regen timer (só ativo se regenPerSec > 0)
        this._regenTimer = scene.time.addEvent({
            delay: Player.REGEN_INTERVAL,
            loop: true,
            callback: this._applyRegen,
            callbackScope: this
        });

        // Controlos: setas + WASD
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.keys = scene.input.keyboard.addKeys('W,A,S,D');
    }

    /**
     * Aplica regeneração de HP (se ativa e não estiver em pausa por dano recente).
     * @private
     */
    _applyRegen() {
        if (this.dead || !this.active || this.regenPerSec <= 0) return;
        if (this.scene.time.now < this.regenPausedUntil) return;

        this.hp = Math.min(this.maxHp, this.hp + this.regenPerSec);
        this.scene.events.emit('hud-changed', {
            hp: this.hp, maxHp: this.maxHp,
            score: this.scene.score, round: this.scene.round,
            xp: this.xp, xpToLevel: this.xpToLevel,
            speed: this.speed, damage: this.damage, fireRate: this.fireRate
        });
    }

    /**
     * Pausa a regeneração de HP durante REGEN_PAUSE_AFTER_HIT ms.
     * Chamado quando o jogador leva dano.
     */
    pauseRegen() {
        this.regenPausedUntil = this.scene.time.now + Player.REGEN_PAUSE_AFTER_HIT;
    }

    /**
     * Adiciona XP ao jogador. Se atingir o limiar, despoleta level up.
     * @param {number} amount - XP a adicionar
     * @returns {boolean} true se subiu de nível
     */
    addXp(amount) {
        this.xp += amount;
        if (this.xp >= this.xpToLevel) {
            this.xp -= this.xpToLevel;
            this.level++;
            this.xpToLevel = Math.round(this.xpToLevel * 1.5); // cada nível precisa de 50% mais XP
            return true; // level up!
        }
        return false;
    }

    /**
     * Aplica um power-up ao jogador pelo seu id.
     * @param {string} id - Identificador do power-up
     */
    applyPowerUp(id) {
        // Diminishing returns: cada escolha repetida do mesmo power-up vale 70% da anterior
        const count = this.powerUpCounts[id] ?? 0;
        this.powerUpCounts[id] = count + 1;
        const factor = Math.pow(0.7, count);

        switch (id) {
            case 'speed':
                this.speed += Math.round(20 * factor);
                break;
            case 'damage':
                this.damage += Math.round(10 * factor);
                break;
            case 'firerate':
                this.fireRate = Math.max(200, Math.floor(this.fireRate * 0.85));
                // Reinicia o timer na GameScene com o novo intervalo
                this.scene.events.emit('firerate-changed', this.fireRate);
                break;
            case 'hp':
                this.maxHp += Math.round(25 * factor);
                this.hp = this.maxHp;
                break;
            case 'multiarrow':
            case 'triplearrow':
                this.arrowCount = Math.min(this.arrowCount + 1, 3);
                break;
            case 'regen':
                this.regenPerSec += Math.round(2 * factor);
                break;
            case 'piercing':
                this.piercing = true;
                break;
        }
    }

    /**
     * Regista as animações do jogador no gestor global de animações.
     * @param {Phaser.Scene} scene
     */
    static createAnims(scene) {
        const a = scene.anims;
        if (a.exists('player_idle')) return;

        a.create({ key: 'player_idle', frames: a.generateFrameNumbers('player_idle', { start: 0, end: 5 }), frameRate: 8, repeat: -1 });
        a.create({ key: 'player_walk', frames: a.generateFrameNumbers('player_walk', { start: 0, end: 7 }), frameRate: 12, repeat: -1 });
        a.create({ key: 'player_attack', frames: a.generateFrameNumbers('player_attack', { start: 0, end: 5 }), frameRate: 15, repeat: 0 });
        a.create({ key: 'player_hurt', frames: a.generateFrameNumbers('player_hurt', { start: 0, end: 3 }), frameRate: 12, repeat: 0 });
        a.create({ key: 'player_death', frames: a.generateFrameNumbers('player_death', { start: 0, end: 3 }), frameRate: 8, repeat: 0 });
    }

    /**
     * Lê o input e atualiza velocidade, animação e orientação.
     * @returns {void}
     */
    update() {
        if (this.dead || !this.active) return;

        const speed = this.speed;
        let vx = 0;
        let vy = 0;

        if (this.cursors.left.isDown  || this.keys.A.isDown) vx -= 1;
        if (this.cursors.right.isDown || this.keys.D.isDown) vx += 1;
        if (this.cursors.up.isDown    || this.keys.W.isDown) vy -= 1;
        if (this.cursors.down.isDown  || this.keys.S.isDown) vy += 1;

        const len = Math.hypot(vx, vy);
        if (len > 0) {
            this.setVelocity((vx / len) * speed, (vy / len) * speed);
            if (vx !== 0) this.setFlipX(vx < 0);
            if (this.anims.currentAnim?.key !== 'player_walk') this.play('player_walk', true);
        } else {
            this.setVelocity(0, 0);
            if (this.anims.currentAnim?.key !== 'player_idle') this.play('player_idle', true);
        }
    }
}
