import Player from '../entities/Player.js';
import Enemy from '../entities/Enemy.js';
import Boss from '../entities/Boss.js';
import RoundManager from '../systems/RoundManager.js';
import CombatSystem from '../systems/CombatSystem.js';
import MusicManager from '../systems/MusicManager.js';

export default class GameScene extends Phaser.Scene {

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

        this.load.spritesheet('boss_idle',  'assets/sprites/Boss/Idle.png',            { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('boss_walk',  'assets/sprites/Boss/orc1_walk_full.png',  { frameWidth: 64, frameHeight: 59 });
        this.load.spritesheet('boss_hurt',  'assets/sprites/Boss/orc1_hurt_full.png',  { frameWidth: 64, frameHeight: 63 });
        this.load.spritesheet('boss_death', 'assets/sprites/Boss/orc1_death_full.png', { frameWidth: 64, frameHeight: 64 });

        this.load.image('arrow', 'assets/sprites/arrow.png');

        this.load.image('hp_bg',    'assets/Lifebar/UI_StatusBar_Bg.png');
        this.load.image('hp_fill',  'assets/Lifebar/UI_StatusBar_Fill_HP.png');
        this.load.image('hp_heart', 'assets/Lifebar/UI_Indicator_Heart.png');
        this.load.image('xp_fill',   'assets/Lifebar/Xp bar.png');
        this.load.image('xp_icon',   'assets/Lifebar/XP ICon.png');
        this.load.image('hp_potion', 'assets/Lifebar/HP.png');

        for (let i = 1; i <= 12; i++) {
            this.load.image(`explosion_${i}`, `assets/Explosion/${i}.png`);
        }

        this.load.audio('hit_hurt',     'assets/Audios/hitHurt.ogg');
        this.load.audio('powerup_sfx',  'assets/Audios/PowerUp.ogg');
        this.load.audio('death_sfx',    'assets/Audios/GameOverDeath.ogg');
        for (let i = 1; i <= 3; i++) {
            this.load.audio(`dash_${i}`, `assets/Audios/dash_${i}.ogg`);
        }
        this.load.audio('game_music', 'assets/Audios/GameScene.ogg');
        this.load.audio('explosion_sfx', 'assets/Audios/explosion.ogg');
    }

    create() {
        MusicManager.play(this, 'game_music');

        const wallLayers = this.buildMap();

        this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight);

        Player.createAnims(this);
        Enemy.createAnims(this);
        Boss.createAnims(this);

        this.anims.create({
            key: 'explosion',
            frames: Array.from({ length: 12 }, (_, i) => ({ key: `explosion_${i + 1}` })),
            frameRate: 36,
            repeat: 0
        });

        this.player  = new Player(this, 529, 272);
        this.enemies = this.physics.add.group();
        this.arrows  = this.physics.add.group();
        this.potions = this.physics.add.staticGroup();

        this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(2);
        this.cameras.main.setBackgroundColor('#2d6a4f');

        for (const layer of wallLayers) {
            this.physics.add.collider(this.player, layer);
            this.physics.add.collider(this.enemies, layer);
        }
        this.physics.add.collider(this.enemies, this.enemies);

        this.combat = new CombatSystem(this);
        this.rounds = new RoundManager(this);

        this.physics.add.overlap(this.arrows, this.enemies,
            (arrow, enemy) => this.combat.onArrowHitEnemy(arrow, enemy));
        this.physics.add.overlap(this.player, this.enemies,
            (player, enemy) => this.combat.onEnemyHitPlayer(player, enemy));
        this.physics.add.overlap(this.player, this.potions,
            (player, potion) => this.combat.onPlayerPickupPotion(player, potion));

        this.score       = 0;
        this.invulnUntil = 0;
        this.gameIsOver  = false;

        this.scene.launch('UIScene');
        this.events.once('shutdown', () => this.scene.stop('UIScene'));

        this.round = 1;
        this.rounds.startRound();

        this._startFireTimer();

        this.events.on('firerate-changed', () => {
            this.fireTimer.remove();
            this._startFireTimer();
        });

        this.events.on('round-banner-done', () => this.rounds.spawnRoundEnemies());

        this.setupPause();
    }

    _startFireTimer() {
        this.fireTimer = this.time.addEvent({
            delay: this.player.fireRate,
            loop: true,
            callback: () => this.combat.fireAtNearestEnemy()
        });
    }

    buildMap() {
        const map = this.make.tilemap({ key: 'map' });

        const grassTs  = map.addTilesetImage('grass_tileset',           'grass_tiles');
        const propsTs  = map.addTilesetImage('props_shadow_tileset',    'props_tiles');
        const plantsTs = map.addTilesetImage('plants_shadow_tileset',   'plants_tiles');
        const structTs = map.addTilesetImage('TX Struct',               'struct_tiles');
        const wallTs   = map.addTilesetImage('TX Tileset Wall',         'wall_tiles');
        const groundTs = map.addTilesetImage('TX Tileset Stone Ground', 'ground_tiles');
        const all = [grassTs, propsTs, plantsTs, structTs, wallTs, groundTs];

        map.createLayer('chao',      all, 0, 0);
        map.createLayer('spawn',     all, 0, 0);
        map.createLayer('heals',     all, 0, 0);
        map.createLayer('cima_chao', all, 0, 0);
        const objetosLayer  = map.createLayer('Objetos',  all, 0, 0);
        const objetos2Layer = map.createLayer('objetos2', all, 0, 0);

        this.mapWidth  = map.widthInPixels;
        this.mapHeight = map.heightInPixels;

        const wallLayers = [objetosLayer, objetos2Layer];
        for (const layer of wallLayers) layer.setCollisionBetween(577, 832);
        return wallLayers;
    }

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

    _triggerLevelUp() {
        this.scene.pause();
        this.scene.launch('PowerUpScene');
    }

    gameOver() {
        this.gameIsOver = true;
        this.sound.play('death_sfx', { volume: 0.6 });
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
            this.scene.pause('UIScene');
            this.scene.launch('PauseScene');
            this.scene.bringToTop('PauseScene');
        });
    }

    update() {
        if (this.gameIsOver) return;

        this.player.update();
        for (const enemy of this.enemies.getChildren()) enemy.update();

        if (!this.roundTransitioning && this.enemies.getChildren().length === 0) {
            this.round++;
            this.rounds.startRound();
        }
    }
}
