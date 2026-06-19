# [HordeBreaker] - TP2 Phaser 3

## Group Members
* **Pedro Barros** - Number: 33248 
* **Diogo Moreira** - Number: 33409 

## Project Setup
* **Phaser Version:** v3.90.0
* **Inclusion Method:** npm
* **GitHub Pages:** https://1barrospedro1.github.io/Multimedia-Phaser/

## Game Description
* **Genre:** Top-down survival shooter (*Vampire Survivors* inspired), with infinite hordes of enemies and bosses.
* **Objective:** Survive successive waves of enemies, level up, and pick upgrades. Endless game — the goal is the highest score / round reached.
* **Rules:** Enemies chase the player and the player auto-fires at the nearest enemy. Each kill grants XP and score and on level-up the player chooses one upgrade card. A boss spawns every 5 rounds. Difficulty scales each round.
* **Implemented Features:**
  - **8-directional movement** with a **dash** (`Space`) that uses limited charges
    and recharges on a cooldown.
  - **Auto-aim combat:** the player automatically fires arrows at the nearest enemy.
  - **Wave-based rounds:** enemies scale in health and speed each round, and a
    **boss** spawns every 5 rounds.
  - **XP & leveling:** defeating enemies grants XP; filling the XP bar pauses the
    game and opens a **power-up screen** where you pick one of several cards.
  - **Rarity system:** power-up cards come in 5 tiers (common, rare, epic,
    legendary, mythic) with weighted drop rates and tier progression.
  - **Power-up types:** max HP, damage, attack speed, crit chance, crit damage,
    area-damage explosion on hit (AoE), piercing arrows, ricochet/bounce, extra
    dash charges, dash cooldown reduction, movement speed, and an extra level-up
    choice (adds more cards to pick from).
  - **HP potions** occasionally dropped by defeated enemies, which restore health
    when picked up.
  - **Tiled tilemap level** with collision layers, a camera that follows the
    player, and zoom.
  - **HUD** showing HP, XP, current round, score, and dash charges.
  - **Pause menu** (`ESC`) and an **Options menu**.
  - **3 languages** — Portuguese, English, and French — switchable from the
    Options menu (also accessible while paused); all UI text is translated via a
    separate JSON file per language.
  - **Audio toggle:** mute/unmute all sound from the Options menu.
  - **Game Over screen** showing final score and round, with options to play
    again or return to the main menu.
  - **Audio:** background music (distinct per scene) plus sound effects for hits,
    dashes, explosions, power-ups, UI clicks, and death.
  - **Animated sprites** (idle/walk/death) and visual effects: explosion
    particles, floating crit text, screen tweens, and round-start banners.
  
## Controls
| Action | Key / Input |
|---|---|
| Move | `W` `A` `S` `D` or Arrow Keys |
| Dash | `Space` |
| Pause | `ESC` |
| Navigate menus / Select upgrade | Mouse (left-click) |
 

## How to Run
1. Clone the repository.
2. Open the terminal in the project's root folder.
3. Run `npm install` to install dependencies.
4. Run `npm start` to launch the local server.
5. Open the provided localhost link in your browser.
(Or through github pages [link](https://1barrospedro1.github.io/Multimedia-Phaser/))


## Multimedia Aspects 
- Images: PNG (sprites, tilesets, UI) and JPG (menu background).
- Spritesheets: PNG (player/orc/boss 100×100 per frame).
- Audio: compressed OGG (background music per scene + sound effects).
- Font: custom TTF (Antiquity) - [Asset](https://ninjikin.itch.io/font-antiquity-script).
- Map: Tiled (JSON), 40×25 tiles of 32px.
- Total asset size: within the recommended <10 MB limit
- Origin/creation: [Font+ (Antiquity Print)](https://ninjikin.itch.io/font-antiquity-script), [Pixel Art Top Down - Basic](https://cainos.itch.io/pixel-art-top-down-basic), [Tiny RPG Character Asset Pack](https://zerie.itch.io/tiny-rpg-character-asset-pack), [Pixel HUD UI: Fantasy RPG Kit](https://indigolay.itch.io/pixel-hud-ui), [Pixel Explosion](https://nyknck.itch.io/explosion), [pixabay](https://pixabay.com), [sfxr](https://sfxr.me/) and generated/modified with AI.
- Justification: 

## Languages
- PT / EN / FR, selectable from the Options menu (and from pause).
