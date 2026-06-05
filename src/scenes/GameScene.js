// ==============================================================================
// GameScene.js (Cena Principal do Jogo)
// ==============================================================================

/**
 * Cena principal de gameplay.
 * Define o ambiente visual base e gere a pausa do jogo através da tecla ESC,
 * lançando o menu de pausa em overlay sem destruir o estado da cena.
 * @extends Phaser.Scene
 */
export default class GameScene extends Phaser.Scene {
    /**
     * Inicializa a cena com o identificador 'GameScene'.
     */
    constructor() {
        super('GameScene');
    }

    /**
     * Carrega o mapa Tiled e as imagens dos tilesets.
     * @returns {void}
     */
    preload() {
        this.load.tilemapTiledJSON('map', 'assets/maps/map.json');
        this.load.image('grass_tiles', 'assets/tilesets/grass_tileset.png');
        this.load.image('props_tiles', 'assets/tilesets/props_shadow_tileset.png');
        this.load.image('plants_tiles', 'assets/tilesets/plants_shadow_tileset.png');
        this.load.image('struct_tiles', 'assets/tilesets/struct_tileset.png');
        this.load.image('wall_tiles', 'assets/tilesets/wall_tileset.png');
        this.load.image('ground_tiles', 'assets/tilesets/ground_tileset.png');
    }

    /**
     * Configura o cenário de jogo e o listener de teclado para abrir o menu de pausa.
     * @returns {void}
     */
    create() {
        const map = this.make.tilemap({ key: 'map' });
        
        // Associa os nomes originais do Tiled às imagens carregadas no preload
        const grassTs = map.addTilesetImage('grass_tileset', 'grass_tiles');
        const propsTs = map.addTilesetImage('props_shadow_tileset', 'props_tiles');
        const plantsTs = map.addTilesetImage('plants_shadow_tileset', 'plants_tiles');
        const structTs = map.addTilesetImage('TX Struct', 'struct_tiles');
        const wallTs = map.addTilesetImage('TX Tileset Wall', 'wall_tiles');
        const groundTs = map.addTilesetImage('TX Tileset Stone Ground', 'ground_tiles');
        
        const allTilesets = [grassTs, propsTs, plantsTs, structTs, wallTs, groundTs];
        
        // Cria as camadas pela mesma ordem que estão no Tiled (de baixo para cima)
        const chaoLayer = map.createLayer('chao', allTilesets, 0, 0);
        const spawnLayer = map.createLayer('spawn', allTilesets, 0, 0);
        const healsLayer = map.createLayer('heals', allTilesets, 0, 0);
        const cimaChaoLayer = map.createLayer('cima_chao', allTilesets, 0, 0);
        const objetosLayer = map.createLayer('Objetos', allTilesets, 0, 0);
        const objetos2Layer = map.createLayer('objetos2', allTilesets, 0, 0);
        
        this.cameras.main.centerOn(map.widthInPixels / 2, map.heightInPixels / 2);

        this.cameras.main.setBackgroundColor('#2d6a4f');

        this.input.keyboard.on('keydown-ESC', () => {
            // Evita abrir múltiplas instâncias do menu de pausa
            if (this.scene.manager.isActive('PauseScene')) {
                return;
            }
            // Pausa a lógica/renderização desta cena e sobrepõe o PauseScene
            this.scene.pause();
            this.scene.launch('PauseScene');
        });
    }
}