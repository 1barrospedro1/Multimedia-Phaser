// ==============================================================================
// Player.js (Entidade do Jogador)
// ==============================================================================

export default class Player extends Phaser.Physics.Arcade.Sprite {
    static BASE_SPEED     = 170;
    static BASE_DAMAGE    = 25;
    static BASE_FIRE_RATE = 700;
    static BASE_XP_TO_LEVEL = 200;
    static XP_PER_KILL    = 10;
    static REGEN_INTERVAL = 3000;
    static REGEN_PAUSE_AFTER_HIT = 5000;
    static DASH_SPEED     = 550;
    static DASH_DURATION  = 150;
    static DASH_COOLDOWN  = 5000;

    constructor(scene, x, y) {
        super(scene, x, y, 'player_idle');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setDepth(2);
        this.setScale(0.6);
        this.body.setSize(22, 28);
        this.body.setOffset(39, 50);
        this.setCollideWorldBounds(true);

        this.hp    = 100;
        this.maxHp = 100;
        this.dead  = false;

        // --- Stats de movimento / ataque ---
        this.speed      = Player.BASE_SPEED;
        this.damage     = Player.BASE_DAMAGE;
        this.fireRate   = Player.BASE_FIRE_RATE;
        this.regenPerSec    = 0;
        this.regenPausedUntil = 0;

        // --- Novos stats de combate ---
        this.attackSpeedBonus = 0; // bónus acumulado em ataques/seg (para cálculo correto)
        this.critChance    = 0;    // % chance de crítico
        this.critDamageBonus = 0;  // % bónus no multiplicador (base 2× + este valor)
        this.aoeRadius     = 0;    // raio de explosão em px
        this.bounceCount   = 0;    // ricochetes por seta
        this.piercing      = false;
        this.pierceCount   = 0;    // máx. inimigos que cada seta pode perfurar
        this.extraChoices  = 0;    // escolhas extra no ecrã de level-up
        this.collectedUpgrades = {}; // { id: Set<tier> } — tiers já apanhados por upgrade

        // --- Sistema de dash com cargas ---
        this.isDashing            = false;
        this.dashCharges          = 1;   // máx. cargas
        this.currentDashCharges   = 1;   // cargas disponíveis agora
        this.dashRechargeStart    = 0;
        this.dashRechargeEnd      = 0;
        this._pendingRecharges    = 0;
        this._recharging          = false;
        this.cooldownReduction    = 0;   // % redução ao cooldown do dash

        // --- XP / Nível ---
        this.xp         = 0;
        this.level      = 1;
        this.xpToLevel  = Player.BASE_XP_TO_LEVEL;

        this.play('player_idle');

        this._regenTimer = scene.time.addEvent({
            delay: Player.REGEN_INTERVAL,
            loop: true,
            callback: this._applyRegen,
            callbackScope: this
        });

        // Controlos
        this.cursors  = scene.input.keyboard.createCursorKeys();
        this.keys     = scene.input.keyboard.addKeys('W,A,S,D');
        this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    _applyRegen() {
        if (this.dead || !this.active || this.regenPerSec <= 0) return;
        if (this.scene.time.now < this.regenPausedUntil) return;

        this.hp = Math.min(this.maxHp, this.hp + this.regenPerSec);
        this.scene.events.emit('hud-changed', {
            hp: this.hp, maxHp: this.maxHp,
            score: this.scene.score, round: this.scene.round,
            xp: this.xp, xpToLevel: this.xpToLevel
        });
    }

    pauseRegen() {
        this.regenPausedUntil = this.scene.time.now + Player.REGEN_PAUSE_AFTER_HIT;
    }

    addXp(amount) {
        this.xp += amount;
        if (this.xp >= this.xpToLevel) {
            this.xp -= this.xpToLevel;
            this.level++;
            this.xpToLevel = Math.round(this.xpToLevel * 1.5);
            return true;
        }
        return false;
    }

    /** Aplica um upgrade { id, tier, value } ao jogador. */
    applyPowerUp({ id, tier, value }) {
        switch (id) {
            case 'hp':
                this.maxHp += value;
                this.hp = Math.min(this.hp + value, this.maxHp);
                break;
            case 'damage':
                this.damage += value;
                break;
            case 'attackspeed': {
                this.attackSpeedBonus += value;
                const aps = 1000 / Player.BASE_FIRE_RATE + this.attackSpeedBonus;
                this.fireRate = Math.max(100, Math.floor(1000 / aps));
                this.scene.events.emit('firerate-changed', this.fireRate);
                break;
            }
            case 'critchance':
                this.critChance = Math.min(100, this.critChance + value);
                break;
            case 'critdamage':
                this.critDamageBonus += value;
                break;
            case 'aoe':
                this.aoeRadius += value;
                break;
            case 'cdreduction':
                this.cooldownReduction = Math.min(80, this.cooldownReduction + value);
                break;
            case 'bounce':
                this.bounceCount += value;
                break;
            case 'pierce':
                this.pierceCount += value;
                this.piercing = true;
                break;
            case 'speed':
                this.speed += value;
                break;
            case 'dashes':
                this.dashCharges += value;
                this.currentDashCharges += value;
                break;
            case 'extrachoice':
                this.extraChoices += value;
                break;
        }

        if (!this.collectedUpgrades[id]) this.collectedUpgrades[id] = new Set();
        this.collectedUpgrades[id].add(tier);
    }

    static createAnims(scene) {
        const a = scene.anims;
        if (a.exists('player_idle')) return;

        a.create({ key: 'player_idle',   frames: a.generateFrameNumbers('player_idle',   { start: 0, end: 5 }), frameRate: 8,  repeat: -1 });
        a.create({ key: 'player_walk',   frames: a.generateFrameNumbers('player_walk',   { start: 0, end: 7 }), frameRate: 12, repeat: -1 });
        a.create({ key: 'player_attack', frames: a.generateFrameNumbers('player_attack', { start: 0, end: 5 }), frameRate: 15, repeat: 0  });
        a.create({ key: 'player_hurt',   frames: a.generateFrameNumbers('player_hurt',   { start: 0, end: 3 }), frameRate: 12, repeat: 0  });
        a.create({ key: 'player_death',  frames: a.generateFrameNumbers('player_death',  { start: 0, end: 3 }), frameRate: 8,  repeat: 0  });
    }

    // ------------------------------------------------------------------
    // Dash
    // ------------------------------------------------------------------

    _startDash() {
        if (this.isDashing || this.currentDashCharges <= 0) return;

        let vx = this.body.velocity.x;
        let vy = this.body.velocity.y;
        const len = Math.hypot(vx, vy);
        if (len < 1) { vx = this.flipX ? -1 : 1; vy = 0; }
        else         { vx /= len; vy /= len; }

        this.isDashing = true;
        this.currentDashCharges--;
        this._pendingRecharges++;
        // Toca um dos 3 sons de dash, escolhido aleatoriamente
        this.scene.sound.play(`dash_${Phaser.Math.Between(1, 3)}`, { volume: 0.9 });
        this.setTint(0x88ccff);
        this.setAlpha(0.65);
        this.setVelocity(vx * Player.DASH_SPEED, vy * Player.DASH_SPEED);

        this.scene.time.delayedCall(Player.DASH_DURATION, () => {
            this.isDashing = false;
            this.clearTint();
            this.setAlpha(1);
            this._processRecharge();
        });
    }

    _processRecharge() {
        if (this._recharging || this._pendingRecharges <= 0) return;

        const cd = Math.max(500, Player.DASH_COOLDOWN * (1 - this.cooldownReduction / 100));
        this.dashRechargeStart = this.scene.time.now;
        this.dashRechargeEnd   = this.dashRechargeStart + cd;
        this._recharging = true;

        this.scene.time.delayedCall(cd, () => {
            this._recharging = false;
            if (!this.active || this.dead) return;
            this._pendingRecharges--;
            this.currentDashCharges = Math.min(this.currentDashCharges + 1, this.dashCharges);
            if (this._pendingRecharges > 0) {
                this._processRecharge();
            } else {
                this.dashRechargeEnd = 0;
            }
        });
    }

    // ------------------------------------------------------------------
    // Update loop
    // ------------------------------------------------------------------

    update() {
        if (this.dead || !this.active) return;

        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) this._startDash();
        if (this.isDashing) return;

        const speed = this.speed;
        let vx = 0, vy = 0;

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
