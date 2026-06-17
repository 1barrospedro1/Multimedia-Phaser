import Enemy from '../entities/Enemy.js';
import Boss from '../entities/Boss.js';

export default class RoundManager {
    static BASE_ENEMY_COUNT      = 25;
    static ENEMIES_PER_ROUND     = 5;
    static ENEMY_HP_PER_ROUND    = 5;
    static ENEMY_SPEED_PER_ROUND = 5;
    static ENEMY_SPEED_CAP       = 150;
    static BOSS_EVERY_N_ROUNDS   = 5;

    constructor(scene) {
        this.scene = scene;
    }

    startRound() {
        const { scene } = this;
        scene.roundTransitioning = true;
        scene.updateHud();
        scene.events.emit('round-started', scene.round);
    }

    spawnRoundEnemies() {
        const { scene } = this;
        const count = RoundManager.BASE_ENEMY_COUNT + (scene.round - 1) * RoundManager.ENEMIES_PER_ROUND;
        for (let i = 0; i < count; i++) this.spawnEnemy();
        if (scene.round % RoundManager.BOSS_EVERY_N_ROUNDS === 0) this.spawnBoss();
        scene.roundTransitioning = false;
    }

    spawnEnemy() {
        const { scene } = this;
        const { x, y } = this._randomEdge();
        const enemy = new Enemy(scene, x, y, scene.player, {
            hp:    Enemy.BASE_HP    * Math.pow(1 + RoundManager.ENEMY_HP_PER_ROUND    / 100, scene.round - 1),
            speed: Math.min(
                Enemy.BASE_SPEED * Math.pow(1 + RoundManager.ENEMY_SPEED_PER_ROUND / 100, scene.round - 1),
                RoundManager.ENEMY_SPEED_CAP
            )
        });
        scene.enemies.add(enemy);
    }

    spawnBoss() {
        const { scene } = this;
        const { x, y } = this._randomEdge();
        const boss = new Boss(scene, x, y, scene.player, {
            hp:    Boss.BASE_HP    * Math.pow(1 + RoundManager.ENEMY_HP_PER_ROUND    / 100, scene.round - 1),
            speed: Math.min(
                Boss.BASE_SPEED * Math.pow(1 + RoundManager.ENEMY_SPEED_PER_ROUND / 100, scene.round - 1),
                RoundManager.ENEMY_SPEED_CAP
            )
        });
        scene.enemies.add(boss);
    }

    _randomEdge() {
        const { scene } = this;
        const margin = 40;
        const edge = Phaser.Math.Between(0, 3);
        if (edge === 0) return { x: margin,                  y: Phaser.Math.Between(0, scene.mapHeight) };
        if (edge === 1) return { x: scene.mapWidth - margin, y: Phaser.Math.Between(0, scene.mapHeight) };
        if (edge === 2) return { x: Phaser.Math.Between(0, scene.mapWidth), y: margin };
                        return { x: Phaser.Math.Between(0, scene.mapWidth), y: scene.mapHeight - margin };
    }
}
