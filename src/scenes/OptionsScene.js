// ==============================================================================
// OptionsScene.js (Cena de Definições)
// ==============================================================================

/**
 * Cena de definições (idioma e navegação de retorno).
 * Adapta o fundo consoante a cena de origem e suporta retorno ao menu ou ao menu de pausa.
 * @extends Phaser.Scene
 */
export default class OptionsScene extends Phaser.Scene {
    /**
     * Inicializa a cena com o identificador 'OptionsScene'.
     */
    constructor() {
        super('OptionsScene');
    }

    /**
     * Constrói o ecrã de opções com fundo condicional e controlos de idioma.
     * @param {object} [data] - Dados passados pela cena que abriu as opções
     * @param {string} [data.fromScene] - Identificador da cena de retorno ('MenuScene' ou 'PauseScene')
     * @returns {void}
     */
    create(data) {
        // Garante que esta cena fica por cima das cenas em sleep (ex.: PauseScene)
        this.scene.bringToTop();
        
        const sceneToReturn = data?.fromScene || 'MenuScene';

        const langAtual = this.registry.get('idioma');
        const textos = this.cache.json.get(langAtual);

        // Fundo condicional: imagem completa no menu; overlay transparente na pausa
        if (sceneToReturn === 'MenuScene') {
            const bg = this.add.image(640, 360, 'menu_bg');
            bg.setScale(1280 / bg.width);
        } else if (sceneToReturn === 'PauseScene') {
            this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.7);
        }

        const container = this.add.image(640, 420, 'ui_container');
        container.setScale(4);

        this.add.text(640, 120, textos.SETTINGS, { 
            fontFamily: 'Antiquity',
            fontSize: '64px', 
            fill: '#ffffff',
            stroke: '#000000', 
            strokeThickness: 6
        }).setOrigin(0.5);

        this.createButton(640, 380, textos.LANG_BTN, () => {
            const novoIdioma = (langAtual === 'en') ? 'pt' : 'en';
            
            // Persiste a escolha no Registry para todas as cenas
            this.registry.set('idioma', novoIdioma);
            
            // Reinicia mantendo o contexto de navegação (menu vs. pausa)
            this.scene.restart({ fromScene: sceneToReturn });
        });

        this.createButton(640, 460, this.sound.mute ? textos.UNMUTE : textos.MUTE, () => {
            // Mute/unmute global (música + efeitos)
            this.sound.mute = !this.sound.mute;
            // Reinicia para atualizar o rótulo (Silenciar/Ativar Som)
            this.scene.restart({ fromScene: sceneToReturn });
        });

        this.createButton(640, 540, textos.BACK, () => {
            if (sceneToReturn === 'PauseScene') {
                // Fecha opções e reativa o menu de pausa em sleep
                this.scene.stop();
                this.scene.wake('PauseScene');
            } else {
                this.scene.start('MenuScene');
            }
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

        btnImage.on('pointerover', () => { btnImage.setTint(0xdddddd); });
        btnImage.on('pointerout', () => { btnImage.clearTint(); });
        btnImage.on('pointerdown', () => { btnImage.setTint(0x888888); this.sound.play('click_sfx', { volume: 0.6 }); });
        btnImage.on('pointerup', () => {
            btnImage.clearTint();
            callback();
        });
    }
}
