# Fight-Chess

A chess-fighting hybrid game where piece captures trigger real-time 2D brawls. Built with Phaser 3, TypeScript, Vite, and Socket.IO.

## Features

- **Chess + Fighting**: Capture an opponent's piece and fight for the square in a side-scrolling brawl
- **Singleplayer**: Play against a CPU opponent for both chess (automatic moves with capture priority) and fighting (AI-controlled fighter)
- **Local Multiplayer**: Pass-and-play mode for both chess and fighting
- **Online Multiplayer**: WebSocket matchmaking via Socket.IO — play against others remotely
- **Health System**: Each fighter has a 300 HP health bar; damage varies by hit location (head 30%, torso 10%, feet 5%)
- **Blocking**: Hold back while the opponent attacks to block; otherwise backpedals normally
- **Knockback**: Hits stun the opponent briefly with knockback, preventing input during hitstun
- **Characters**: Akuma, Ken, Dudley, Makoto, Q, and Sean mapped to chess ranks (King → Akuma, Queen → Ken, etc.) with unique attack properties and animations

## Controls (Fighting)

| Action        | P1 (Keyboard) | P2 (Keyboard) |
|---------------|---------------|---------------|
| Move          | Arrow Keys    | A/D           |
| Jump          | Up Arrow      | W             |
| Crouch        | Down Arrow    | S             |
| Light Punch   | Z             | 1             |
| Medium Punch  | X             | 2             |
| Heavy Punch   | C             | 3             |
| Light Kick    | A             | 4             |
| Medium Kick   | S             | 5             |
| Heavy Kick    | D             | 6             |

## How to Run

### Client only (no online multiplayer)

```bash
npm install
npm run dev
```

The development server runs on `http://localhost:8080`.

### Full stack (client + WebSocket server)

```bash
npm install
npm run dev:full
```

This runs both the Vite dev server (`:8080`) and the Socket.IO server (`:3001`) concurrently.

### Server only

```bash
npm run server
```

## Build for Production

```bash
npm run build
```

Output goes to the `dist/` folder.

## Deploy

```bash
npm run deploy          # Deploy client to GitHub Pages
npm run deploy:full     # Build client + compile server for deployment
```

## Project Structure

| Path | Description |
|------|-------------|
| `src/game/main.ts` | Phaser game configuration and scene registry |
| `src/game/scenes/Boot.ts` | Minimal boot scene, transitions to Preloader |
| `src/game/scenes/Preloader.ts` | Asset loading with progress bar |
| `src/game/scenes/MainMenu.ts` | Menu: Singleplayer, Local Multiplayer, Online, Fight Scene |
| `src/game/scenes/Game.ts` | Chess board logic, CPU AI, turn management, capture → fight trigger |
| `src/game/scenes/Fight.ts` | Fighting game scene, CPU controls, hitbox/health, online input relay |
| `src/game/scenes/GameOver.ts` | Game over screen |
| `src/game/objects/FighterSprite.ts` | Fighter character: movement, attacks, blocking, hitstun |
| `src/game/objects/Fighter.ts` | Fighter data model (stats, animation frames per character) |
| `src/game/objects/Board.ts` | Chess board grid and coordinates |
| `src/game/objects/Piece.ts` | Chess piece data model |
| `src/game/network/NetworkManager.ts` | Socket.IO client singleton for online multiplayer |
| `server/` | Standalone Express + Socket.IO server for matchmaking and relay |

## Credits

This project was built with the [Phaser Vite TypeScript Template](https://github.com/phaserjs/template-vite-ts) and developed with assistance from [opencode](https://opencode.ai).

Fight-Chess &copy; 2026. All rights reserved.

Street Fighter 3: Third Strike is a trademark of Capcom. All character sprites and related assets are property of Capcom. This is a fan project and is not affiliated with or endorsed by Capcom.
