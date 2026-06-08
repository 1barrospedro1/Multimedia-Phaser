// ==============================================================================
// GameScene.js (Cena Principal do Jogo)
// ==============================================================================

import Player from '../entities/Player.js';
import Enemy from '../entities/Enemy.js';

/**
 * Cena principal de gameplay.
 * Renderiza o mapa Tiled, cria o jogador e os inimigos, gere as colisões via
 * física Arcade, o ataque automático com setas e o estado de jogo (HP/score).
 * A tecla ESC abre o menu de pausa em overlay.
 * @extends Phaser.Scene
 */
export default class GameScene extends Phaser.Scene {
    /** Dano causado por cada seta. */
    static ARROW_DAMAGE = 15;
    /** Dano que um inimigo causa ao jogador por contacto. */
    static ENEMY_DAMAGE = 10;
    /** Intervalo (ms) entre disparos automáticos. */
    static FIRE_RATE = 700;
    /** Tempo de invulnerabilidade (ms) do jogador após levar dano. */
    static INVULN_TIME = 600;

    /**
     * Inicializa a cena com o identificador 'GameScene'.
     */
    constructor() {
        super('GameScene');
    }

    /**
     * Carrega o mapa Tiled, os tilesets e os spritesheets de jogador, inimigo e seta.
     * @returns {void}
     */
    preload() {
        // Mapa e tilesets
        this.load.tilemapTiledJSON('map', 'assets/maps/map.json');
        this.load.image('grass_tiles', 'assets/tilesets/grass_tileset.png');
        this.load.image('props_tiles', 'assets/tilesets/props_shadow_tileset.png');
        this.load.image('plants_tiles', 'assets/tilesets/plants_shadow_tileset.png');
        this.load.image('struct_tiles', 'assets/tilesets/struct_tileset.png');
        this.load.image('wall_tiles', 'assets/tilesets/wall_tileset.png');
        this.load.image('ground_tiles', 'assets/tilesets/ground_tileset.png');

        // Spritesheets do jogador (frames de 100x100)
        const f = { frameWidth: 100, frameHeight: 100 };
        this.load.spritesheet('player_idle', 'assets/sprites/player/soldier_idle.png', f);
        this.load.spritesheet('player_walk', 'assets/sprites/player/soldier_walk.png', f);
        this.load.spritesheet('player_attack', 'assets/sprites/player/soldier_attack01.png', f);
        this.load.spritesheet('player_hurt', 'assets/sprites/player/soldier_hurt.png', f);
        this.load.spritesheet('player_death', 'assets/sprites/player/soldier_death.png', f);

        // Spritesheets do inimigo (Orc)
        this.load.spritesheet('enemy_idle', 'assets/sprites/enemy/orc_idle.png', f);
        this.load.spritesheet('enemy_walk', 'assets/sprites/enemy/orc_walk.png', f);
        this.load.spritesheet('enemy_hurt', 'assets/sprites/enemy/orc_hurt.png', f);
        this.load.spritesheet('enemy_death', 'assets/sprites/enemy/orc_death.png', f);

        // Projétil
        this.load.image('arrow', 'assets/sprites/arrow.png');
    }

    /**
     * Constrói o cenário, as entidades, as colisões e o HUD; arranca o ataque
     * automático e o listener da tecla de pausa.
     * @returns {void}
     */
    create() {
        const wallLayers = this.buildMap();

        // Limites do mundo = dimensões do mapa (mapa fechado)
        this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight);

        // Animações partilhadas (registadas uma única vez)
        Player.createAnims(this);
        Enemy.createAnims(this);

        // Jogador no centro da estrutura circular de pedra (tiles col 16-18, linha 7-9)
        this.player = new Player(this, 529, 272);

        // Grupos de física
        this.enemies = this.physics.add.group();
        this.arrows = this.physics.add.group();

        // Câmara segue o jogador dentro dos limites do mapa
        this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(2);
        this.cameras.main.setBackgroundColor('#2d6a4f');

        // Colisões com as paredes do mapa
        for (const layer of wallLayers) {
            this.physics.add.collider(this.player, layer);
            this.physics.add.collider(this.enemies, layer);
        }

        // Seta atinge inimigo
        this.physics.add.overlap(this.arrows, this.enemies, this.onArrowHitEnemy, null, this);
        // Inimigo toca no jogador
        this.physics.add.overlap(this.player, this.enemies, this.onEnemyHitPlayer, null, this);

        // Estado de jogo
        this.score = 0;
        this.invulnUntil = 0;
        this.gameIsOver = false;

        // HUD numa cena própria (não afetada pelo zoom desta câmara)
        this.scene.launch('UIScene');
        this.events.once('shutdown', () => this.scene.stop('UIScene'));

        // Spawna alguns inimigos iniciais 
        for (let i = 0; i < 25; i++) this.spawnEnemy();

        // Ataque automático periódico
        this.fireTimer = this.time.addEvent({
            delay: GameScene.FIRE_RATE,
            loop: true,
            callback: this.fireAtNearestEnemy,
            callbackScope: this
        });

        this.setupPause();
    }

    /**
     * Cria o tilemap e as suas camadas, define as camadas com colisão de parede
     * e guarda as dimensões do mapa em píxeis.
     * @returns {Phaser.Tilemaps.TilemapLayer[]} Camadas que contêm paredes (com colisão ativa)
     */
    buildMap() {
        const map = this.make.tilemap({ key: 'map' });

        const grassTs = map.addTilesetImage('grass_tileset', 'grass_tiles');
        const propsTs = map.addTilesetImage('props_shadow_tileset', 'props_tiles');
        const plantsTs = map.addTilesetImage('plants_shadow_tileset', 'plants_tiles');
        const structTs = map.addTilesetImage('TX Struct', 'struct_tiles');
        const wallTs = map.addTilesetImage('TX Tileset Wall', 'wall_tiles');
        const groundTs = map.addTilesetImage('TX Tileset Stone Ground', 'ground_tiles');
        const allTilesets = [grassTs, propsTs, plantsTs, structTs, wallTs, groundTs];

        map.createLayer('chao', allTilesets, 0, 0);
        map.createLayer('spawn', allTilesets, 0, 0);
        map.createLayer('heals', allTilesets, 0, 0);
        map.createLayer('cima_chao', allTilesets, 0, 0);
        const objetosLayer = map.createLayer('Objetos', allTilesets, 0, 0);
        const objetos2Layer = map.createLayer('objetos2', allTilesets, 0, 0);

        this.mapWidth = map.widthInPixels;
        this.mapHeight = map.heightInPixels;

        // Os tiles do "TX Tileset Wall" (gids 577–832) são sólidos
        const wallLayers = [objetosLayer, objetos2Layer];
        for (const layer of wallLayers) {
            layer.setCollisionBetween(577, 832);
        }
        return wallLayers;
    }

    /**
     * Notifica a UIScene do estado atual (vida e pontuação) através de um evento.
     * @returns {void}
     */
    updateHud() {
        this.events.emit('hud-changed', {
            hp: this.player.hp,
            maxHp: this.player.maxHp,
            score: this.score
        });
    }

    /**
     * Cria um inimigo numa posição aleatória junto a uma das bordas do mapa.
     * @returns {void}
     */
    spawnEnemy() {
        const margin = 40;
        const edge = Phaser.Math.Between(0, 3);
        let x, y;
        if (edge === 0) { x = margin; y = Phaser.Math.Between(0, this.mapHeight); }
        else if (edge === 1) { x = this.mapWidth - margin; y = Phaser.Math.Between(0, this.mapHeight); }
        else if (edge === 2) { x = Phaser.Math.Between(0, this.mapWidth); y = margin; }
        else { x = Phaser.Math.Between(0, this.mapWidth); y = this.mapHeight - margin; }

        const enemy = new Enemy(this, x, y, this.player);
        this.enemies.add(enemy);
    }

    /**
     * Dispara uma seta na direção do inimigo vivo mais próximo do jogador.
     * Não faz nada se não existirem inimigos ou se o jogador estiver morto.
     * @returns {void}
     */
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

        const arrow = this.arrows.create(this.player.x, this.player.y, 'arrow');
        arrow.setScale(0.7);
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, nearest.x, nearest.y);
        arrow.setRotation(angle);
        this.physics.velocityFromRotation(angle, 380, arrow.body.velocity);

        // A seta vira o jogador para o alvo e toca a animação de ataque
        this.player.setFlipX(nearest.x < this.player.x);

        // Remove a seta após um tempo de vida, caso não acerte
        this.time.delayedCall(1500, () => arrow.active && arrow.destroy());
    }

    /**
     * Callback de overlap entre seta e inimigo: aplica dano e remove a seta.
     * @param {Phaser.GameObjects.GameObject} arrow - Seta que atingiu
     * @param {Enemy} enemy - Inimigo atingido
     * @returns {void}
     */
    onArrowHitEnemy(arrow, enemy) {
        if (enemy.dying) return;
        arrow.destroy();
        enemy.takeDamage(GameScene.ARROW_DAMAGE);
        if (enemy.dying) {
            this.score += 10;
            this.updateHud();
        }
    }

    /**
     * Callback de overlap entre inimigo e jogador: aplica dano com período de
     * invulnerabilidade e despoleta Game Over quando a vida chega a zero.
     * @param {Player} player - O jogador
     * @param {Enemy} enemy - Inimigo em contacto
     * @returns {void}
     */
    onEnemyHitPlayer(player, enemy) {
        if (enemy.dying || this.time.now < this.invulnUntil) return;

        this.invulnUntil = this.time.now + GameScene.INVULN_TIME;
        player.hp -= GameScene.ENEMY_DAMAGE;
        this.updateHud();

        // Feedback visual de dano
        player.setTint(0xff4444);
        this.time.delayedCall(GameScene.INVULN_TIME, () => player.active && player.clearTint());

        if (player.hp <= 0) this.gameOver();
    }

    /**
     * Termina o jogo: para o jogador, toca a animação de morte e mostra mensagem.
     * (A cena de Game Over dedicada será criada no futuro)
     * @returns {void}
     */
    gameOver() {
        this.gameIsOver = true;
        this.player.dead = true;
        this.player.setVelocity(0, 0);
        this.player.body.enable = false;
        this.player.clearTint();
        this.player.play('player_death');
        this.fireTimer.remove();

        // Congela os inimigos para deixar ver a animação de morte do jogador
        for (const enemy of this.enemies.getChildren()) {
            enemy.setVelocity(0, 0);
            if (!enemy.dying) enemy.play('enemy_idle', true);
        }

        // O texto é mostrado pela UIScene (sem zoom) para ficar do tamanho correto
        this.events.emit('game-over');
    }

    /**
     * Regista o listener de teclado para abrir o menu de pausa em overlay (ESC).
     * @returns {void}
     */
    setupPause() {
        this.input.keyboard.on('keydown-ESC', () => {
            if (this.scene.manager.isActive('PauseScene')) return;
            this.scene.pause();
            this.scene.launch('PauseScene');
        });
    }

    /**
     * Loop principal: atualiza o jogador e a perseguição de cada inimigo.
     * @returns {void}
     */
    update() {
        if (this.gameIsOver) return;

        this.player.update();
        for (const enemy of this.enemies.getChildren()) {
            enemy.update();
        }
    }
}
