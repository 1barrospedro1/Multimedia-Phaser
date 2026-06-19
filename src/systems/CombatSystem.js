import Player from '../entities/Player.js';

export default class CombatSystem {
    static ENEMY_DAMAGE = 10;
    static INVULN_TIME  = 600;

    constructor(scene) {
        this.scene = scene;
        this._lastHitSound = 0;
        this._lastExplosionSound = 0;
    }

    fireAtNearestEnemy() {
        const { scene } = this;
        if (!scene.player.active) return;

        let nearest = null;
        let bestDist = Infinity;
        for (const e of scene.enemies.getChildren()) {
            if (e.dying || !e.active) continue;
            const d = Phaser.Math.Distance.Between(scene.player.x, scene.player.y, e.x, e.y);
            if (d < bestDist) { bestDist = d; nearest = e; }
        }
        if (!nearest) return;

        const baseAngle = Phaser.Math.Angle.Between(scene.player.x, scene.player.y, nearest.x, nearest.y);
        const count = scene.player.arrowCount;

        const spread = Phaser.Math.DegToRad(15);
        const offsets = count === 1 ? [0]
                      : count === 2 ? [-spread / 2, spread / 2]
                      :               [-spread, 0, spread];

        for (const offset of offsets) {
            const angle = baseAngle + offset;
            const arrow = scene.arrows.create(scene.player.x, scene.player.y, 'arrow');
            arrow.setScale(0.7);
            arrow.setRotation(angle);
            arrow.piercing    = scene.player.piercing;
            arrow.pierceMax   = scene.player.pierceCount;
            arrow._hitEnemies = new Set();
            scene.physics.velocityFromRotation(angle, 380, arrow.body.velocity);
            scene.time.delayedCall(1500, () => arrow.active && arrow.destroy());
        }

        scene.player.setFlipX(nearest.x < scene.player.x);
    }

    onArrowHitEnemy(arrow, enemy) {
        const { scene } = this;
        if (!arrow.active || enemy.dying) return;

        const player = scene.player;

        if (arrow.piercing) {
            if (arrow._hitEnemies.has(enemy)) return;
            arrow._hitEnemies.add(enemy);
        }

        let dmg = player.damage;
        let isCrit = false;
        if (player.critChance > 0 && Math.random() * 100 < player.critChance) {
            isCrit = true;
            dmg = Math.floor(dmg * (2 + player.critDamageBonus / 100));
        }

        this._dealDamage(enemy, dmg, isCrit);

        const now = scene.time.now;
        if (now - this._lastHitSound > 100) {
            scene.sound.play('hit_hurt');
            this._lastHitSound = now;
        }

        if (player.aoeRadius > 0) {
            const size = player.aoeRadius;
            const aoeGfx = scene.add.sprite(enemy.x, enemy.y, 'explosion_1')
                .setDisplaySize(size, size)
                .setDepth(1);
            aoeGfx.play('explosion');
            aoeGfx.once('animationcomplete', () => aoeGfx.destroy());
            if (now - this._lastExplosionSound > 80) {
                scene.sound.play('explosion_sfx', { volume: 0.8 });
                this._lastExplosionSound = now;
            }
            for (const other of scene.enemies.getChildren()) {
                if (other === enemy || other.dying || !other.active) continue;
                const d = Phaser.Math.Distance.Between(enemy.x, enemy.y, other.x, other.y);
                if (d <= player.aoeRadius) {
                    this._dealDamage(other, Math.max(1, Math.floor(dmg * 0.5)), false);
                }
            }
        }

        if (arrow.piercing) {
            if (arrow._hitEnemies.size >= arrow.pierceMax) arrow.destroy();
            return;
        }

        if (player.bounceCount > 0 && (arrow._bounces || 0) < player.bounceCount) {
            let nextTarget = null;
            let nearestDist = Infinity;
            for (const e of scene.enemies.getChildren()) {
                if (e === enemy || e.dying || !e.active) continue;
                if (arrow._bouncedFrom?.has(e)) continue;
                const d = Phaser.Math.Distance.Between(enemy.x, enemy.y, e.x, e.y);
                if (d < nearestDist) { nearestDist = d; nextTarget = e; }
            }
            if (nextTarget) {
                arrow._bounces = (arrow._bounces || 0) + 1;
                (arrow._bouncedFrom = arrow._bouncedFrom || new Set()).add(enemy);
                const angle = Phaser.Math.Angle.Between(arrow.x, arrow.y, nextTarget.x, nextTarget.y);
                arrow.setRotation(angle);
                scene.physics.velocityFromRotation(angle, 380, arrow.body.velocity);
                return;
            }
        }

        arrow.destroy();
    }

    _dealDamage(enemy, dmg, isCrit) {
        const { scene } = this;
        if (enemy.dying || !enemy.active) return;

        enemy.takeDamage(dmg);

        if (isCrit) {
            const t = scene.add.text(enemy.x, enemy.y - 20, 'CRIT!', {
                fontFamily: 'Antiquity', fontSize: '16px',
                fill: '#ffdd00', stroke: '#000000', strokeThickness: 3
            }).setDepth(10);
            scene.tweens.add({ targets: t, y: enemy.y - 55, alpha: 0, duration: 650, onComplete: () => t.destroy() });
        }

        if (enemy.dying) {
            scene.score += 10;
            const leveledUp = scene.player.addXp(Player.XP_PER_KILL);
            if (leveledUp) scene._triggerLevelUp();
            scene.updateHud();

            if (Math.random() < 0.005) {
                const potion = scene.potions.create(enemy.x, enemy.y, 'hp_potion').setScale(0.15).refreshBody();
                potion.pickupAt = scene.time.now + 500;
            }
        }
    }

    onPlayerPickupPotion(player, potion) {
        if (this.scene.time.now < potion.pickupAt) return;
        if (player.hp >= player.maxHp) return;
        potion.destroy();
        player.hp = Math.min(player.maxHp, player.hp + 50);
        this.scene.updateHud();
    }

    onEnemyHitPlayer(player, enemy) {
        const { scene } = this;
        if (enemy.dying || scene.time.now < scene.invulnUntil || player.isDashing) return;

        scene.invulnUntil = scene.time.now + CombatSystem.INVULN_TIME;
        player.hp -= CombatSystem.ENEMY_DAMAGE;
        player.pauseRegen();
        scene.updateHud();

        player.setTint(0xff4444);
        scene.time.delayedCall(CombatSystem.INVULN_TIME, () => player.active && player.clearTint());

        if (player.hp <= 0) scene.gameOver();
    }
}
