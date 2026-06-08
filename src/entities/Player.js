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
    /** Velocidade de movimento em píxeis por segundo. */
    static SPEED = 170;

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
        // Hitbox reduzida face ao frame de 100x100 (que tem muito espaço transparente)
        this.body.setSize(22, 28);
        this.body.setOffset(39, 50);
        this.setCollideWorldBounds(true);

        /** Pontos de vida atuais. */
        this.hp = 100;
        /** Pontos de vida máximos. */
        this.maxHp = 100;
        /** Indica se o jogador morreu (trava os controlos sem desativar o sprite). */
        this.dead = false;

        this.play('player_idle');

        // Controlos: setas + WASD
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.keys = scene.input.keyboard.addKeys('W,A,S,D');
    }

    /**
     * Regista as animações do jogador no gestor global de animações.
     * Deve ser chamado uma única vez (na cena), pois as animações são partilhadas.
     * @param {Phaser.Scene} scene - Cena usada para aceder ao gestor de animações
     * @returns {void}
     */
    static createAnims(scene) {
        const a = scene.anims;
        if (a.exists('player_idle')) return;

        a.create({
            key: 'player_idle',
            frames: a.generateFrameNumbers('player_idle', { start: 0, end: 5 }),
            frameRate: 8,
            repeat: -1
        });
        a.create({
            key: 'player_walk',
            frames: a.generateFrameNumbers('player_walk', { start: 0, end: 7 }),
            frameRate: 12,
            repeat: -1
        });
        a.create({
            key: 'player_attack',
            frames: a.generateFrameNumbers('player_attack', { start: 0, end: 5 }),
            frameRate: 15,
            repeat: 0
        });
        a.create({
            key: 'player_hurt',
            frames: a.generateFrameNumbers('player_hurt', { start: 0, end: 3 }),
            frameRate: 12,
            repeat: 0
        });
        a.create({
            key: 'player_death',
            frames: a.generateFrameNumbers('player_death', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: 0
        });
    }

    /**
     * Lê o input e atualiza velocidade, animação e orientação.
     * Chamado a cada frame pela cena (no update).
     * @returns {void}
     */
    update() {
        if (this.dead || !this.active) return;

        const speed = Player.SPEED;
        let vx = 0;
        let vy = 0;

        if (this.cursors.left.isDown || this.keys.A.isDown) vx -= 1;
        if (this.cursors.right.isDown || this.keys.D.isDown) vx += 1;
        if (this.cursors.up.isDown || this.keys.W.isDown) vy -= 1;
        if (this.cursors.down.isDown || this.keys.S.isDown) vy += 1;

        // Normaliza a diagonal para não andar mais depressa na diagonal
        const len = Math.hypot(vx, vy);
        if (len > 0) {
            this.setVelocity((vx / len) * speed, (vy / len) * speed);
            // Vira o sprite para o lado do movimento horizontal
            if (vx !== 0) this.setFlipX(vx < 0);
            if (this.anims.currentAnim?.key !== 'player_walk') this.play('player_walk', true);
        } else {
            this.setVelocity(0, 0);
            if (this.anims.currentAnim?.key !== 'player_idle') this.play('player_idle', true);
        }
    }
}
