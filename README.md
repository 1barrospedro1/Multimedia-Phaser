# [HordBreaker] - TP2 Phaser 3

## Group Members
* **Pedro Barros** - Number: 33248 
* **Diogo Moreira** - Number: 33409 

## Project Setup
* **Phaser Version:** v3.90.0
* **Inclusion Method:** npm
* **GitHub Pages:** https://1barrospedro1.github.io/Multimedia-Phaser/

## Game Description
* **Genre:** Top-down survival shooter (no estilo de *Vampire Survivors*), com rondas de inimigos e um boss fight.
* **Objetivo:** Sobreviver ao máximo de rondas possível. Em cada ronda aparecem inimigos cada vez mais fortes; ao derrotá-los ganhamos XP, que é usado para fazer upgrades.
* **Regras:** O jogador ataca automaticamente os inimigos mais próximos. O contacto com um inimigo dá dano ao jogador. A cada ronda os inimigos ficam mais fortes, e a cada 5 rondas aparece um boss. O jogo acaba quando o jogador fica com HP a 0.
* **Implemented Features:**
  - Movimentação em 8 direções, com dash (`Espaço`, cargas limitadas e cooldown).
  - Auto-aim: o jogador ataca automaticamente os inimigos mais próximos.
  - Rondas de inimigos, com escalonamento de vida e velocidade, mais um boss que aparece de 5 em 5 rondas.
  - Sistema de XP: ao derrotar inimigos é garantido XP; ao completar a barra, o jogo é pausado e abre-se uma cena de power-ups, com opções de diferentes raridades.
  - Power-ups de vários tipos: dano, velocidade de ataque, chance de crítico, dano de crítico, explosão ao acertar no inimigo (dano em área), ataque perfurante, ricochete, dash extra, redução de cooldown, velocidade de movimento, HP máximo.
  - Poções de HP, dropadas pelos inimigos.
  - Nível em tilemap criado no Tiled, com câmara a seguir o jogador e zoom.
  - HUD a mostrar HP, XP, ronda e pontuação.
  - Menu de Pausa (ESC) e menu de opções.
  - Alteração de linguagem com 3 línguas: Português, Inglês e Francês *(confirmar: ficheiro fr.json e lógica de troca para 3 idiomas já implementados no código?)*.
  - Ecrã de Game Over com pontuação e ronda, com possibilidade de jogar novamente ou voltar ao Menu.
  - Efeitos sonoros.
## Controls
| Action | Key / Input |
|---|---|
| Move | `W` `A` `S` `D` or Arrow Keys |
| Dash | `Space` |
| Pause | `ESC` |
 

## How to Run
1. Clone the repository.
2. Open the terminal in the project's root folder.
3. Run `npm install` to install dependencies.
4. Run `npm start` to launch the local server.
5. Open the provided localhost link in your browser.


## Multimedia Aspects 


### Assets and Formats
* **Images/Sprites: **
* **Audio:** 

### Justification
