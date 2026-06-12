// ==============================================================================
// GameScene.js (Cena Principal do Jogo)
// ==============================================================================

import Player from '../entities/Player.js';
import Enemy from '../entities/Enemy.js';

/**
 * Cena principal de gameplay.
 * Gere o mapa, o jogador, os inimigos, colisões, ataque automático,
 * sistema de XP/nível e transição para o PowerUpScene.
 * @extends Phaser.Scene
 */
export default class GameScene extends Phaser.Scene {
    /** Dano causado por cada seta (lido dinamicamente do player). */
    static ARROW_DAMAGE_BASE = 15;
    /** Dano que um inimigo causa ao jogador por contacto. */
    static ENEMY_DAMAGE = 10;
    /** Tempo de invulnerabilidade (ms) do jogador após levar dano. */
    static INVULN_TIME = 600;
    /** Número de inimigos spawnados na primeira ronda. */
    static BASE_ENEMY_COUNT = 25;
    /** Inimigos adicionais por cada ronda além da primeira. */
    static ENEMIES_PER_ROUND = 5;
    /** Aumento de HP dos inimigos por ronda. */
    static ENEMY_HP_PER_ROUND = 5;
    /** Aumento de velocidade dos inimigos por ronda. */
    static ENEMY_SPEED_PER_ROUND = 5;
    /** Velocidade máxima que um inimigo pode atingir, independentemente da ronda. */
    static ENEMY_SPEED_CAP = 150;

    constructor() {
        super('GameScene');
    }

    preload() {
        this.load.tilemapTiledJSON('map', 'assets/maps/map.json');
        this.load.image('grass_tiles',  'assets/tilesets/grass_tileset.png');
        this.load.image('props_tiles',  'assets/tilesets/props_shadow_tileset.png');
        this.load.image('plants_tiles', 'assets/tilesets/plants_shadow_tileset.png');
        this.load.image('struct_tiles', 'assets/tilesets/struct_tileset.png');
        this.load.image('wall_tiles',   'assets/tilesets/wall_tileset.png');
        this.load.image('ground_tiles', 'assets/tilesets/ground_tileset.png');

        const f = { frameWidth: 100, frameHeight: 100 };
        this.load.spritesheet('player_idle',   'assets/sprites/player/soldier_idle.png',     f);
        this.load.spritesheet('player_walk',   'assets/sprites/player/soldier_walk.png',     f);
        this.load.spritesheet('player_attack', 'assets/sprites/player/soldier_attack01.png', f);
        this.load.spritesheet('player_hurt',   'assets/sprites/player/soldier_hurt.png',     f);
        this.load.spritesheet('player_death',  'assets/sprites/player/soldier_death.png',    f);

        this.load.spritesheet('enemy_idle',  'assets/sprites/enemy/orc_idle.png',  f);
        this.load.spritesheet('enemy_walk',  'assets/sprites/enemy/orc_walk.png',  f);
        this.load.spritesheet('enemy_hurt',  'assets/sprites/enemy/orc_hurt.png',  f);
        this.load.spritesheet('enemy_death', 'assets/sprites/enemy/orc_death.png', f);

        this.load.image('arrow', 'assets/sprites/arrow.png');

        this.load.audio('hit_hurt', 'assets/Audios/hitHurt.wav');
    }

    create() {
        const wallLayers = this.buildMap();

        this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight);

        Player.createAnims(this);
        Enemy.createAnims(this);

        this.player = new Player(this, 529, 272);

        this.enemies = this.physics.add.group();
        this.arrows  = this.physics.add.group();

        this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(2);
        this.cameras.main.setBackgroundColor('#2d6a4f');

        for (const layer of wallLayers) {
            this.physics.add.collider(this.player, layer);
            this.physics.add.collider(this.enemies, layer);
        }

        // Inimigos colidem entre si para não se amontoarem todos no mesmo sítio
        this.physics.add.collider(this.enemies, this.enemies);

        // Seta perfurante: usa overlap diferente (não destrói a seta de imediato)
        this.physics.add.overlap(this.arrows, this.enemies, this.onArrowHitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.onEnemyHitPlayer, null, this);

        this.score      = 0;
        this.invulnUntil = 0;
        this.gameIsOver  = false;

        this.scene.launch('UIScene');
        this.events.once('shutdown', () => this.scene.stop('UIScene'));

        this.round = 1;
        this.startRound();

        // Fire timer usa o fireRate do player
        this._startFireTimer();

        // Listener para quando o player muda o fireRate via power-up
        this.events.on('firerate-changed', (newRate) => {
            this.fireTimer.remove();
            this._startFireTimer();
        });

        // Só spawna os inimigos da ronda depois do banner desaparecer
        this.events.on('round-banner-done', this.spawnRoundEnemies, this);

        this.setupPause();
    }

    /**
     * Cria/reinicia o timer de disparo com o fireRate atual do player.
     * @private
     */
    _startFireTimer() {
        this.fireTimer = this.time.addEvent({
            delay: this.player.fireRate,
            loop: true,
            callback: this.fireAtNearestEnemy,
            callbackScope: this
        });
    }

    buildMap() {
        const map = this.make.tilemap({ key: 'map' });

        const grassTs  = map.addTilesetImage('grass_tileset',             'grass_tiles');
        const propsTs  = map.addTilesetImage('props_shadow_tileset',      'props_tiles');
        const plantsTs = map.addTilesetImage('plants_shadow_tileset',     'plants_tiles');
        const structTs = map.addTilesetImage('TX Struct',                 'struct_tiles');
        const wallTs   = map.addTilesetImage('TX Tileset Wall',           'wall_tiles');
        const groundTs = map.addTilesetImage('TX Tileset Stone Ground',   'ground_tiles');
        const allTilesets = [grassTs, propsTs, plantsTs, structTs, wallTs, groundTs];

        map.createLayer('chao',       allTilesets, 0, 0);
        map.createLayer('spawn',      allTilesets, 0, 0);
        map.createLayer('heals',      allTilesets, 0, 0);
        map.createLayer('cima_chao',  allTilesets, 0, 0);
        const objetosLayer  = map.createLayer('Objetos',  allTilesets, 0, 0);
        const objetos2Layer = map.createLayer('objetos2', allTilesets, 0, 0);

        this.mapWidth  = map.widthInPixels;
        this.mapHeight = map.heightInPixels;

        const wallLayers = [objetosLayer, objetos2Layer];
        for (const layer of wallLayers) {
            layer.setCollisionBetween(577, 832);
        }
        return wallLayers;
    }

    /**
     * Notifica a UIScene com o estado completo do HUD.
     */
    updateHud() {
        this.events.emit('hud-changed', {
            hp:        this.player.hp,
            maxHp:     this.player.maxHp,
            score:     this.score,
            round:     this.round,
            xp:        this.player.xp,
            xpToLevel: this.player.xpToLevel,
            speed:     this.player.speed,
            damage:    this.player.damage,
            fireRate:  this.player.fireRate
        });
    }

    spawnEnemy() {
        const margin = 40;
        const edge = Phaser.Math.Between(0, 3);
        let x, y;
        if      (edge === 0) { x = margin;                   y = Phaser.Math.Between(0, this.mapHeight); }
        else if (edge === 1) { x = this.mapWidth - margin;   y = Phaser.Math.Between(0, this.mapHeight); }
        else if (edge === 2) { x = Phaser.Math.Between(0, this.mapWidth); y = margin; }
        else                 { x = Phaser.Math.Between(0, this.mapWidth); y = this.mapHeight - margin; }

        const enemy = new Enemy(this, x, y, this.player, {
            hp:    Enemy.BASE_HP * Math.pow(1 + GameScene.ENEMY_HP_PER_ROUND / 100, this.round - 1),
            speed: Math.min(
                Enemy.BASE_SPEED * Math.pow(1 + GameScene.ENEMY_SPEED_PER_ROUND / 100, this.round - 1),
                GameScene.ENEMY_SPEED_CAP
            )
        });
        this.enemies.add(enemy);
    }

    startRound() {
        this.roundTransitioning = true;
        this.updateHud();
        this.events.emit('round-started', this.round);
    }

    /**
     * Spawna os inimigos da ronda atual. Chamado quando o banner da ronda termina.
     */
    spawnRoundEnemies() {
        const enemyCount = GameScene.BASE_ENEMY_COUNT + (this.round - 1) * GameScene.ENEMIES_PER_ROUND;
        for (let i = 0; i < enemyCount; i++) {
            this.spawnEnemy();
        }
        this.roundTransitioning = false;
    }

    fireAtNearestEnemy() {
        if (!this.player.active) return;

        let nearest = null;
        let bestDist = Infinity;
        for (const e of this.enemies.getChildren()) {
            if (e.dying || !e.active) continue;
            const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y);
            if (d < bestDist) { bestDist = d; nearest = e; }
        }
        if (!nearest) return;

        const baseAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, nearest.x, nearest.y);
        const count = this.player.arrowCount;

        // Leque de setas: spread de 15° entre cada seta
        const spread = Phaser.Math.DegToRad(15);
        const offsets = [];
        if (count === 1) {
            offsets.push(0);
        } else if (count === 2) {
            offsets.push(-spread / 2, spread / 2);
        } else {
            offsets.push(-spread, 0, spread);
        }

        for (const offset of offsets) {
            const angle = baseAngle + offset;
            const arrow = this.arrows.create(this.player.x, this.player.y, 'arrow');
            arrow.setScale(0.7);
            arrow.setRotation(angle);
            arrow.piercing = this.player.piercing;
            arrow._hitEnemies = new Set(); // para piercing: regista inimigos já atingidos
            this.physics.velocityFromRotation(angle, 380, arrow.body.velocity);
            this.time.delayedCall(1500, () => arrow.active && arrow.destroy());
        }

        this.player.setFlipX(nearest.x < this.player.x);
    }

    onArrowHitEnemy(arrow, enemy) {
        if (enemy.dying) return;

        // Piercing: evita acertar no mesmo inimigo duas vezes
        if (arrow.piercing) {
            if (arrow._hitEnemies.has(enemy)) return;
            arrow._hitEnemies.add(enemy);
        } else {
            arrow.destroy();
        }

        enemy.takeDamage(this.player.damage);
        this.sound.play('hit_hurt');

        if (enemy.dying) {
            this.score += 10;

            // Adiciona XP e verifica level up
            const leveledUp = this.player.addXp(Player.XP_PER_KILL);
            if (leveledUp) {
                this._triggerLevelUp();
            }

            this.updateHud();
        }
    }

    /**
     * Para o jogo e abre o ecrã de escolha de power-up.
     * @private
     */
    _triggerLevelUp() {
        this.scene.pause();
        this.scene.launch('PowerUpScene');
    }

    onEnemyHitPlayer(player, enemy) {
        if (enemy.dying || this.time.now < this.invulnUntil) return;

        this.invulnUntil = this.time.now + GameScene.INVULN_TIME;
        player.hp -= GameScene.ENEMY_DAMAGE;
        this.updateHud();

        player.setTint(0xff4444);
        this.time.delayedCall(GameScene.INVULN_TIME, () => player.active && player.clearTint());

        if (player.hp <= 0) this.gameOver();
    }

    gameOver() {
        this.gameIsOver = true;
        this.player.dead = true;
        this.player.setVelocity(0, 0);
        this.player.body.enable = false;
        this.player.clearTint();
        this.player.play('player_death');
        this.fireTimer.remove();

        for (const enemy of this.enemies.getChildren()) {
            enemy.setVelocity(0, 0);
            if (!enemy.dying) enemy.play('enemy_idle', true);
        }

        this.events.emit('game-over');
    }

    setupPause() {
        this.input.keyboard.on('keydown-ESC', () => {
            if (this.scene.manager.isActive('PauseScene')) return;
            this.scene.pause();
            this.scene.launch('PauseScene');
        });
    }

    update() {
        if (this.gameIsOver) return;

        this.player.update();
        for (const enemy of this.enemies.getChildren()) {
            enemy.update();
        }

        if (!this.roundTransitioning && this.enemies.getChildren().length === 0) {
            this.round++;
            this.startRound();
        }
    }

    
}
