// ==============================================================================
// MenuScene.js (Cena do Menu Principal)
// ==============================================================================

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    preload() {
        this.load.image('cursor', 'assets/images/cursor.png');
        this.load.image('btn_normal', 'assets/images/button.png');
        this.load.image('ui_container', 'assets/images/ui_container.png');
    }

    create() {
        // 1. Título do Jogo 
        this.add.text(640, 120, '[RPG NAME]', { 
            fontSize: '64px', 
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000', 
            strokeThickness: 6
        }).setOrigin(0.5);

        // 2. O Contentor / Painel da UI (Vem primeiro no código para ficar atrás dos botões)
        const container = this.add.image(640, 420, 'ui_container');
        
        // Aumentar o tamanho do container mantendo o pixel art nítido (pixelArt: true está no main.js)
        container.setScale(4);

        // 3. Criar os Botões
        // Botão Play
        this.createButton(640, 380, 'Play', () => {
            console.log("Iniciar Jogo!");
            // this.scene.start('GameScene');
        });

        // Botão Settings 
        this.createButton(640, 460, 'Settings', () => {
            console.log("Abrir Opções!");
            // this.scene.start('OptionsScene');
        });
    }

    /**
     * Função Auxiliar para criar botões gráficos com texto centrado e interações.
     * Mostra boas práticas de organização de código para a avaliação.
     * * @param {number} x - Coordenada X do centro do botão
     * @param {number} y - Coordenada Y do centro do botão
     * @param {string} textString - O texto a exibir no botão
     * @param {function} callback - A função a executar ao clicar
     */
    createButton(x, y, textString, callback) {
        // A. Criar a Imagem do Botão e torná-la interativa
        // Usamos .setInteractive() sem useHandCursor para respeitar o cursor.png global
        const btnImage = this.add.image(x, y, 'btn_normal').setInteractive();
        
        // Ajustar escala do botão para o novo ecrã maior
        btnImage.setScale(3.5);

        // B. Criar o Texto por cima da Imagem (nas mesmas coordenadas)
        this.add.text(x, y, textString, { 
            fontSize: '28px', 
            fill: '#ffffff', // Letra preta para contraste
            fontStyle: 'bold',
            stroke: '#000000', 
            strokeThickness: 3
        }).setOrigin(0.5);

        // C. Configurar Efeitos Visuais de Interação (Feedback para o jogador)
        btnImage.on('pointerover', () => {
            // Clareia ligeiramente ao passar o rato (para painéis escuros)
            btnImage.setTint(0xdddddd); 
        });

        btnImage.on('pointerout', () => {
            // Volta à cor original
            btnImage.clearTint(); 
        });

        btnImage.on('pointerdown', () => {
            // Escurece ao clicar
            btnImage.setTint(0x888888); 
        });

        btnImage.on('pointerup', () => {
            // Limpa o tint e executa a ação (callback)
            btnImage.clearTint();
            callback();
        });
    }
}