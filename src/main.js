// =================================================
// main.js (Ponto de Entrada Principal)
// =================================================

// Importação das Cenas do Jogo (Modularização do projeto)
import MenuScene from './scenes/MenuScene.js';
import OptionsScene from './scenes/OptionsScene.js';
import GameScene from './scenes/GameScene.js';
import PauseScene from './scenes/PauseScene.js';
import UIScene from './scenes/UIScene.js';

/**
 * Configuração Global do Motor Phaser 3
 */
const config = {
    // Phaser.AUTO escolhe automaticamente entre WebGL ou Canvas dependendo do suporte do browser
    type: Phaser.AUTO,
    
    // Resolução HD padrão em formato 16:9
    width: 1280,
    height: 720,

    // Configuração de Redimensionamento e Centragem Automática no Browser
    scale: {
        mode: Phaser.Scale.FIT, // Ajusta o jogo ao ecrã mantendo a proporção (aspect ratio)
        autoCenter: Phaser.Scale.CENTER_BOTH // Centra o canvas horizontal e verticalmente
    },
    
    // Definições de Renderização
    render: {
        pixelArt: true 
    },

    // Configuração do Sistema de Física (Requisito obrigatório do guião)
    physics: {
        default: 'arcade', // Utilização do sistema de física Arcade
        arcade: {
            // Gravidade definida a 0 visto tratar-se de um RPG com perspetiva Top-Down
            gravity: { y: 0 }, 
            // Ativar como 'true' durante o desenvolvimento para visualizar as caixas de colisão (hitboxes)
            debug: false 
        }
    },

    // Configuração global do input (rato/cursor)
    input: {
        cursor: 'url(assets/images/cursor.png), pointer'
    },
    
    /**
     * Registo de Cenas do Jogo
     * O Phaser carrega e inicializa automaticamente a primeira cena desta lista.
     * À medida que novas cenas forem criadas (GameScene, GameOverScene), basta adicioná-las a este Array.
     */
    scene: [MenuScene, OptionsScene, GameScene, PauseScene, UIScene]
};

// Inicialização da instância global do jogo com as configurações definidas
const game = new Phaser.Game(config);