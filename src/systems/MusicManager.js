// ==============================================================================
// MusicManager.js (Gestor de Música de Fundo)
// ==============================================================================

/**
 * Gere a música de fundo global do jogo, garantindo que apenas uma faixa toca
 * de cada vez. A faixa atual é guardada no Registry, partilhado por todas as
 * cenas, evitando sobreposições ou reinícios ao mudar de cena.
 */
export default class MusicManager {
    /**
     * Toca a faixa indicada em loop. Se já for a faixa atual, não faz nada
     * (mantém a reprodução contínua); caso contrário, para a anterior e inicia
     * a nova.
     * @param {Phaser.Scene} scene - Cena que solicita a música (acede a sound/registry)
     * @param {string} key - Chave do áudio carregado (ex.: 'menu_music')
     * @param {number} [volume=0.3] - Volume da faixa (0 a 1)
     * @returns {void}
     */
    static play(scene, key, volume = 0.3) {
        const current = scene.registry.get('music');

        if (current) {
            if (current.key === key) return; // já está a tocar esta faixa
            current.destroy();
        }

        const music = scene.sound.add(key, { loop: true, volume });
        scene.registry.set('music', music);

        if (scene.sound.locked) {
            // O browser bloqueia áudio até ao 1º gesto do utilizador.
            // Arranca a música assim que o contexto desbloquear (ex.: primeiro clique).
            scene.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
                if (scene.registry.get('music') === music) music.play();
            });
        } else {
            music.play();
        }
    }
}
