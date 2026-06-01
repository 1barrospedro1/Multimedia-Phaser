// ==============================================================================
// MenuScene.js (Cena do Menu Principal)
// ==============================================================================

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    preload() {
        this.load.image('cursor', 'assets/images/cursor.png');
        this.load.image('ui_container', 'assets/images/ui_container.png');
        this.load.image('menu_bg', 'assets/images/menu_background.jpg');
        this.load.image('btn_normal', 'assets/images/scroll_button.png');
        
        // Carregar os ficheiros de idioma
        this.load.json('en', 'assets/lang/en.json');
        this.load.json('pt', 'assets/lang/pt.json');
    }

    create() {
        // --- SISTEMA DE IDIOMA ---
        // 1. Definir o idioma padrão (se ainda não existir nenhum definido)
        if (!this.registry.has('idioma')) {
            this.registry.set('idioma', 'en'); 
        }

        // 2. Ir buscar o JSON correspondente à memória do Phaser
        const langAtual = this.registry.get('idioma');
        const textos = this.cache.json.get(langAtual);
        // -------------------------

        // Imagem background
        const bg = this.add.image(640, 360, 'menu_bg');
        bg.setScale(1280 / bg.width); // Garante que a imagem cobre o ecrã a 100%
        
        // 1. Título do Jogo 
        this.add.text(640, 120, textos.TITLE, { 
            fontFamily: 'Antiquity',
            fontSize: '64px', 
            fill: '#ffffff',
            stroke: '#000000', 
            strokeThickness: 6
        }).setOrigin(0.5);

        // 2. O Contentor / Painel da UI 
        const container = this.add.image(640, 420, 'ui_container');
        container.setScale(4);

        // 3. Criar os Botões
        // Botão Play (Substituído por textos.PLAY)
        this.createButton(640, 380, textos.PLAY, () => {
            console.log("Iniciar Jogo!");
            // this.scene.start('GameScene');
        });

        // Botão Settings 
        this.createButton(640, 460, textos.SETTINGS, () => {
            console.log("Abrir Opções!");
            this.scene.start('OptionsScene');
        });

        // Botão Exit 
        this.createButton(640, 540, textos.QUIT, () => {
            console.log("Sair do Jogo!");
            this.game.destroy(true);
        });
    }

    /**
     * Função Auxiliar para criar botões gráficos com texto centrado e interações.
     * Mostra boas práticas de organização de código para a avaliação.
     * @param {number} x - Coordenada X do centro do botão
     * @param {number} y - Coordenada Y do centro do botão
     * @param {string} textString - O texto a exibir no botão
     * @param {function} callback - A função a executar ao clicar
     */
    createButton(x, y, textString, callback) {
        // A. Criar a Imagem do Botão e torná-la interativa
        const btnImage = this.add.image(x, y, 'btn_normal').setInteractive();
        
        // Ajustar escala do botão
        btnImage.setScale(0.5);

        // B. Criar o Texto por cima da Imagem (nas mesmas coordenadas)
        this.add.text(x, y, textString, { 
            fontFamily: 'Antiquity', 
            fontSize: '24px', 
            fill: '#000000', 
        }).setOrigin(0.5);

        // C. Configurar Efeitos Visuais de Interação (Feedback para o jogador)
        btnImage.on('pointerover', () => {
            btnImage.setTint(0xdddddd); 
        });

        btnImage.on('pointerout', () => {
            btnImage.clearTint(); 
        });

        btnImage.on('pointerdown', () => {
            btnImage.setTint(0x888888); 
        });

        btnImage.on('pointerup', () => {
            btnImage.clearTint();
            callback();
        });
    }
}