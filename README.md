# Fight-Chess

A chess-fighting hybrid game where piece captures trigger real-time 2D battles. Built with Phaser 3, TypeScript, and Vite.

## Features

- **Chess + Fighting**: Capture an opponent's piece and fight for the square in a side-scrolling brawl
- **Singleplayer**: Play against a CPU opponent for both chess (automatic moves with capture priority) and fighting (AI-controlled fighter)
- **Multiplayer**: Local two-player mode for both chess and fighting
- **Health System**: Each fighter has a 300 HP health bar; damage varies by hit location (head 30%, torso 10%, feet 5%)
- **Blocking**: Hold back while the opponent attacks to block; otherwise backpedals normally
- **Knockback**: Hits stun the opponent briefly with knockback, preventing input during hitstun
- **Characters**: Akuma, Ken, Dudley, and Sean with unique attack properties and animations

## Controls (Fighting)

| Action | P1 (Keyboard) | P2 (Keyboard) |
|--------|---------------|---------------|
| Move | Arrow Keys | A/D |
| Jump | Up Arrow | W |
| Crouch | Down Arrow | S |
| Light Punch | Z | 1 |
| Medium Punch | X | 2 |
| Heavy Punch | C | 3 |
| Light Kick | A | 4 |
| Medium Kick | S | 5 |
| Heavy Kick | D | 6 |

## How to Run

```bash
npm install
npm run dev
```

The development server runs on `http://localhost:8080`.

## Build for Production

```bash
npm run build
```

Output goes to the `dist/` folder.

## Project Structure

| Path | Description |
|------|-------------|
| `src/game/scenes/MainMenu.ts` | Main menu: Singleplayer, Multiplayer, Fight Scene |
| `src/game/scenes/Game.ts` | Chess board logic, CPU AI, turn management |
| `src/game/scenes/Fight.ts` | Fighting game scene, CPU controls, hitbox/health |
| `src/game/objects/FighterSprite.ts` | Fighter character: movement, attacks, blocking, hitstun |
| `src/game/objects/Fighter.ts` | Fighter data (life, animation frames per character) |
| `src/game/objects/Board.ts` | Chess board grid and coordinates |
| `src/game/objects/Piece.ts` | Chess piece data model |

## Credits

This project was built with the [Phaser Vite TypeScript Template](https://github.com/phaserjs/template-vite-ts) and developed with assistance from [opencode](https://opencode.ai).

Fight-Chess &copy; 2026. All rights reserved.

Street Fighter 3: Third Strike is a trademark of Capcom. All character sprites and related assets are property of Capcom. This is a fan project and is not affiliated with or endorsed by Capcom.
