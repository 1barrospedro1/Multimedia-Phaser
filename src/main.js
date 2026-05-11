// Configuração básica do Phaser
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade', // Requisito do guião: usar Física Arcade
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// Inicializar o jogo
const game = new Phaser.Game(config);

function preload() {
    // Carregar os assets vai acontecer aqui
    console.log("Preload ativo!");
}

function create() {
    // Criar os elementos na tela vai acontecer aqui
    this.add.text(20, 20, 'O Phaser está a funcionar!', { fontSize: '32px', fill: '#fff' });
}

function update() {
    // A lógica de atualização contínua do jogo acontece aqui
}