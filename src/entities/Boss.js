// ==============================================================================
// Boss.js (Entidade Inimiga - Boss Orc)
// ==============================================================================

/**
 * Inimigo Boss (Orc maior e mais resistente) que persegue continuamente o jogador.
 * Move-se em direção ao alvo via física Arcade e reage a dano até morrer.
 * @extends Phaser.Physics.Arcade.Sprite
 */
export default class Boss extends Phaser.Physics.Arcade.Sprite {

    /** HP base do boss na primeira aparição. */
    static BASE_HP = 600;
    /** Velocidade base do boss na primeira aparição. */
    static BASE_SPEED = 50;

    /**
     * Cria o boss, regista-o na cena e ativa a física.
     * @param {Phaser.Scene} scene - Cena onde o boss é inserido
     * @param {number} x - Posição inicial X (em píxeis)
     * @param {number} y - Posição inicial Y (em píxeis)
     * @param {Player} target - Jogador a perseguir
     * @param {object} [config] - Configuração opcional (hp, speed)
     */
    constructor(scene, x, y, target, config = {}) {
        super(scene, x, y, 'boss_idle');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setDepth(2);
        this.setScale(1.3);
        this.body.setSize(28, 36);
        this.body.setOffset(36, 40);
        this.setCollideWorldBounds(true);

        /** Jogador perseguido. */
        this.target = target;
        /** Pontos de vida atuais. */
        this.hp = config.hp ?? Boss.BASE_HP;
        /** Velocidade de movimento. */
        this.speed = config.speed ?? Boss.BASE_SPEED;
        /** Indica se o boss está em processo de morte (ignora lógica de perseguição). */
        this.dying = false;

        this.play('boss_walk');
    }

    /**
     * Regista as animações do boss no gestor global de animações.
     * Deve ser chamado uma única vez (na cena).
     * @param {Phaser.Scene} scene - Cena usada para aceder ao gestor de animações
     * @returns {void}
     */
    static createAnims(scene) {
        const a = scene.anims;
        if (a.exists('boss_walk')) return;

        a.create({
            key: 'boss_idle',
            frames: a.generateFrameNumbers('boss_idle', { start: 0, end: 3 }),
            frameRate: 6,
            repeat: -1
        });
        a.create({
            key: 'boss_walk',
            frames: a.generateFrameNumbers('boss_walk', { start: 0, end: 5 }),
            frameRate: 10,
            repeat: -1
        });
        a.create({
            key: 'boss_hurt',
            frames: a.generateFrameNumbers('boss_hurt', { start: 0, end: 5 }),
            frameRate: 14,
            repeat: 0
        });
        a.create({
            key: 'boss_death',
            frames: a.generateFrameNumbers('boss_death', { start: 0, end: 7 }),
            frameRate: 10,
            repeat: 0
        });
    }

    /**
     * Aplica dano ao boss. Ao chegar a zero, inicia a animação de morte
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
            this.play('boss_death');
            this.once('animationcomplete-boss_death', () => this.destroy());
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
