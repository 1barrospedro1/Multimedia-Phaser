// ==============================================================================
// OptionsScene.js (Cena de Definições)
// ==============================================================================

export default class OptionsScene extends Phaser.Scene {
    constructor() {
        super('OptionsScene');
    }

    create() {
        // 1. Ir buscar o idioma atual
        const langAtual = this.registry.get('idioma');
        const textos = this.cache.json.get(langAtual);

        // 2. Fundo e Contentor 
        const bg = this.add.image(640, 360, 'menu_bg');
        bg.setScale(1280 / bg.width); 
        
        const container = this.add.image(640, 420, 'ui_container');
        container.setScale(4);

        // 3. Título deste Ecrã
        this.add.text(640, 120, textos.SETTINGS, { 
            fontFamily: 'Antiquity',
            fontSize: '64px', 
            fill: '#ffffff',
            stroke: '#000000', 
            strokeThickness: 6
        }).setOrigin(0.5);

        // 4. Botão de Mudar Idioma
        this.createButton(640, 380, textos.LANG_BTN, () => {
            // LÓGICA DE MUDAR IDIOMA: Se for 'en' muda para 'pt', senão muda para 'en'
            const novoIdioma = (langAtual === 'en') ? 'pt' : 'en';
            
            // Guarda a nova escolha no registo global
            this.registry.set('idioma', novoIdioma);
            
            // Reinicia esta cena para os textos atualizarem instantaneamente
            this.scene.restart();
        });

        // 5. Botão Voltar ao Menu Principal
        this.createButton(640, 460, textos.BACK, () => {
            this.scene.start('MenuScene');
        });
    }

    // A mesma função auxiliar para criar botões, mantendo o aspeto igual
    createButton(x, y, textString, callback) {
        const btnImage = this.add.image(x, y, 'btn_normal').setInteractive();
        btnImage.setScale(0.5);

        this.add.text(x, y, textString, { 
            fontFamily: 'Antiquity', 
            fontSize: '24px', 
            fill: '#000000', 
        }).setOrigin(0.5);

        btnImage.on('pointerover', () => { btnImage.setTint(0xdddddd); });
        btnImage.on('pointerout', () => { btnImage.clearTint(); });
        btnImage.on('pointerdown', () => { btnImage.setTint(0x888888); });
        btnImage.on('pointerup', () => {
            btnImage.clearTint();
            callback();
        });
    }
}