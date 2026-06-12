// ==============================================================================
// Enemy.js (Entidade Inimiga - Orc)
// ==============================================================================

/**
 * Inimigo do tipo Orc que persegue continuamente o jogador.
 * Move-se em direção ao alvo via física Arcade e reage a dano até morrer.
 * @extends Phaser.Physics.Arcade.Sprite
 */
export default class Enemy extends Phaser.Physics.Arcade.Sprite {


    /** HP base de um inimigo na primeira ronda. */
    static BASE_HP = 30;
    /** Velocidade base de um inimigo na primeira ronda. */
    static BASE_SPEED = 70;

    /**
     * Cria o inimigo, regista-o na cena e ativa a física.
     * @param {Phaser.Scene} scene - Cena onde o inimigo é inserido
     * @param {number} x - Posição inicial X (em píxeis)
     * @param {number} y - Posição inicial Y (em píxeis)
     * @param {Player} target - Jogador a perseguir
     */
    constructor(scene, x, y, target, config = {}) {
        super(scene, x, y, 'enemy_idle');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setScale(0.6);
        this.body.setSize(22, 28);
        this.body.setOffset(39, 50);
        this.setCollideWorldBounds(true);

        /** Jogador perseguido. */
        this.target = target;
        /** Pontos de vida atuais. */
        this.hp = config.hp ?? Enemy.BASE_HP;
        /** Velocidade de movimento. */
        this.speed = config.speed ?? Enemy.BASE_SPEED;
        /** Indica se o inimigo está em processo de morte (ignora lógica de perseguição). */
        this.dying = false;

        this.play('enemy_walk');
    }

    /**
     * Regista as animações do inimigo no gestor global de animações.
     * Deve ser chamado uma única vez (na cena).
     * @param {Phaser.Scene} scene - Cena usada para aceder ao gestor de animações
     * @returns {void}
     */
    static createAnims(scene) {
        const a = scene.anims;
        if (a.exists('enemy_walk')) return;

        a.create({
            key: 'enemy_idle',
            frames: a.generateFrameNumbers('enemy_idle', { start: 0, end: 5 }),
            frameRate: 8,
            repeat: -1
        });
        a.create({
            key: 'enemy_walk',
            frames: a.generateFrameNumbers('enemy_walk', { start: 0, end: 7 }),
            frameRate: 10,
            repeat: -1
        });
        a.create({
            key: 'enemy_hurt',
            frames: a.generateFrameNumbers('enemy_hurt', { start: 0, end: 3 }),
            frameRate: 14,
            repeat: 0
        });
        a.create({
            key: 'enemy_death',
            frames: a.generateFrameNumbers('enemy_death', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: 0
        });
    }

    /**
     * Aplica dano ao inimigo. Ao chegar a zero, inicia a animação de morte
     * e remove-se da cena no fim da mesma.
     * @param {number} amount - Quantidade de dano a aplicar
     * @returns {void}
     */
    takeDamage(amount) {
        if (this.dying) return;
        this.hp -= amount;
        if (this.hp <= 0) {
            this.dying = true;
            this.setVelocity(0, 0);
            this.body.enable = false;
            this.play('enemy_death');
            this.once('animationcomplete-enemy_death', () => this.destroy());
        }
    }

    /**
     * Atualiza a perseguição: aponta a velocidade para o jogador e orienta o sprite.
     * Chamado a cada frame pela cena.
     * @returns {void}
     */
    update() {
        if (this.dying || !this.active || !this.target?.active) {
            return;
        }
        this.scene.physics.moveToObject(this, this.target, this.speed);
        this.setFlipX(this.target.x < this.x);
    }
}
