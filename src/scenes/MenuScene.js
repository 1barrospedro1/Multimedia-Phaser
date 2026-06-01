// ==============================================================================
// MenuScene.js (Cena do Menu Principal)
// ==============================================================================

/**
 * Cena do menu principal do jogo.
 * Responsável pelo carregamento inicial de assets, seleção de idioma via Registry
 * e navegação para o jogo, opções ou encerramento da aplicação.
 * @extends Phaser.Scene
 */
export default class MenuScene extends Phaser.Scene {
    /**
     * Inicializa a cena com o identificador 'MenuScene'.
     */
    constructor() {
        super('MenuScene');
    }

    /**
     * Carrega os recursos gráficos e os ficheiros JSON de tradução
     * necessários nesta e nas restantes cenas do projeto.
     * @returns {void}
     */
    preload() {
        this.load.image('cursor', 'assets/images/cursor.png');
        this.load.image('ui_container', 'assets/images/ui_container.png');
        this.load.image('menu_bg', 'assets/images/menu_background.jpg');
        this.load.image('btn_normal', 'assets/images/scroll_button.png');
        
        // Ficheiros de idioma (en/pt) para o sistema de localização
        this.load.json('en', 'assets/lang/en.json');
        this.load.json('pt', 'assets/lang/pt.json');
    }

    /**
     * Constrói a interface do menu: fundo, título, painel de botões
     * e ligações às restantes cenas através do Scene Manager.
     * @returns {void}
     */
    create() {
        // Inicializa o idioma no Registry global (persiste entre cenas)
        if (!this.registry.has('idioma')) {
            this.registry.set('idioma', 'en'); 
        }

        const langAtual = this.registry.get('idioma');
        const textos = this.cache.json.get(langAtual);

        const bg = this.add.image(640, 360, 'menu_bg');
        bg.setScale(1280 / bg.width); // Escala proporcional para cobrir o ecrã 1280x720
        
        this.add.text(640, 120, textos.TITLE, { 
            fontFamily: 'Antiquity',
            fontSize: '64px', 
            fill: '#ffffff',
            stroke: '#000000', 
            strokeThickness: 6
        }).setOrigin(0.5);

        const container = this.add.image(640, 420, 'ui_container');
        container.setScale(4);

        this.createButton(640, 380, textos.PLAY, () => {
            console.log("Iniciar Jogo!");
            // Transição: substitui o menu pela cena de jogo
            this.scene.start('GameScene');
        });

        this.createButton(640, 460, textos.SETTINGS, () => {
            console.log("Abrir Opções!");
            // Transição com contexto de origem para o botão "Voltar" nas opções
            this.scene.start('OptionsScene', { fromScene: 'MenuScene' });
        });

        this.createButton(640, 540, textos.QUIT, () => {
            console.log("Sair do Jogo!");
            // Encerra a instância Phaser e liberta recursos do canvas
            this.game.destroy(true);
        });
    }

    /**
     * Cria um botão interativo composto por imagem e texto,
     * com feedback visual de hover e clique.
     * @param {number} x - Coordenada X do centro do botão
     * @param {number} y - Coordenada Y do centro do botão
     * @param {string} textString - Texto localizado a exibir no botão
     * @param {function} callback - Função executada ao libertar o clique
     * @returns {void}
     */
    createButton(x, y, textString, callback) {
        const btnImage = this.add.image(x, y, 'btn_normal').setInteractive();
        
        btnImage.setScale(0.5);

        this.add.text(x, y, textString, { 
            fontFamily: 'Antiquity', 
            fontSize: '24px', 
            fill: '#000000', 
        }).setOrigin(0.5);

        // Feedback visual: realce ao passar o rato e ao premir
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
