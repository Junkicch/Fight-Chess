import { Scene } from 'phaser';
import { FighterSprite } from '../objects/FighterSprite';
import { FIGHTERS_DATA } from '../objects/Fighter';
import { PieceType } from '../objects/Piece';

const DEBUG = false;

export class Fight extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  bgChunLi: Phaser.GameObjects.Image;
  bgAkuma: Phaser.GameObjects.Image;
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  player1: FighterSprite;
  player2: FighterSprite;
  
  // Selection UI properties
  selectionUI: Phaser.GameObjects.Container;
  p1Selection: string | null = null;
  p2Selection: string | null = null;
  p1Indicator: Phaser.GameObjects.Text;
  p2Indicator: Phaser.GameObjects.Text;
  readyButton: Phaser.GameObjects.Rectangle;
  readyText: Phaser.GameObjects.Text;

  // Fight data from Game scene
  attackerData: any;
  defenderData: any;
  targetJ: number;
  targetI: number;
  toggleTurn: boolean;
  isManualSelection: boolean = true;
  isCPU: boolean = false;
  cpuAttacker: boolean = false;
  isFightOver: boolean = false;
  private cpuReactionDelay: number = 0;

  private p1Keys: any;
  private p2AttackKeys: any;
  private cameraTarget: Phaser.GameObjects.Zone;

  // Health bar elements
  private p1HealthBarFill: Phaser.GameObjects.Rectangle;
  private p2HealthBarFill: Phaser.GameObjects.Rectangle;

  constructor() {
    super('Fight');
  }

  init(data: any) {
    if (data && data.attacker) {
      this.attackerData = data.attacker;
      this.defenderData = data.defender || null;
      this.targetJ = data.targetJ;
      this.targetI = data.targetI;
      this.toggleTurn = data.toggleTurn;
      this.isManualSelection = false;
      this.isCPU = data.cpu === true;
      this.cpuAttacker = data.cpuAttacker === true;
    } else {
      this.isManualSelection = true;
      this.isCPU = false;
      this.cpuAttacker = false;
    }
  }

  create() {
    this.isFightOver = false;
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0x000000);

    // Akuma (Principal layer) - used to define world width
    this.bgAkuma = this.add.image(0, 284, 'akuma-bg').setScale(2).setOrigin(0, 0.5);
    const worldWidth = this.bgAkuma.displayWidth;
    const worldHeight = 768;

    // Chun-Li (Background layer) - behind Akuma
    this.bgChunLi = this.add.image(worldWidth / 2, 284, 'chun-li-bg').setScale(2).setOrigin(0.5, 0.5);
    this.bgChunLi.setDepth(-1); // Ensure it's behind

    // Definir os limites do mundo e da câmera
    if (this.physics && this.physics.world) {
      this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    }
    this.camera.setBounds(0, 0, worldWidth, worldHeight);

    // Efeito parallax
    this.bgChunLi.setScrollFactor(0.5);
    this.bgAkuma.setScrollFactor(1);

    // Ground Platform - Static body at the bottom
    const groundY = 650;
    const groundHeight = 100;
    const ground = this.add.rectangle(worldWidth / 2, groundY + groundHeight / 2, worldWidth, groundHeight, 0x555555, 1); // Visible ground
    this.physics.add.existing(ground, true);

    // Iniciar no meio do cenário
    const startX = (worldWidth / 2) - (this.camera.width / 2);
    this.camera.scrollX = startX;

    if (this.isManualSelection) {
      this.createSelectionUI(ground);
    } else {
      // Mapping pieces to fighters
      const pieceToFighter: Record<number, string> = {
          [PieceType.PAWN]: 'SEAN',
          [PieceType.KNIGHT]: 'DUDLEY',
          [PieceType.ROOK]: 'Q',
          [PieceType.BISHOP]: 'MAKOTO',
          [PieceType.QUEEN]: 'KEN',
          [PieceType.KING]: 'AKUMA'
      };

      const p1Key = pieceToFighter[this.attackerData?.pieceType ?? PieceType.PAWN];
      const p2Key = pieceToFighter[this.defenderData?.pieceType ?? PieceType.PAWN];

      this.startFight(ground, p1Key, p2Key);
    }
  }

  private createSelectionUI(ground: Phaser.GameObjects.Rectangle) {
    const bg = this.add.rectangle(0, 0, 600, 450, 0x000000, 0.9).setStrokeStyle(4, 0xffffff);
    const title = this.add.text(0, -180, "SELECT YOUR FIGHTERS", { fontSize: '28px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    
    const fighters = Object.keys(FIGHTERS_DATA);
    const fighterButtons: Phaser.GameObjects.Container[] = [];
    
    // Grid layout: 2 columns, 3 rows
    fighters.forEach((key, index) => {
        const col = index % 2;
        const row = Math.floor(index / 2);
        const x = -150 + col * 300;
        const y = -80 + row * 100;
        
        const btnBg = this.add.rectangle(0, 0, 240, 80, 0x333333);
        // Offset the hit area 400px to the right relative to the visual center
        btnBg.setInteractive(new Phaser.Geom.Rectangle(400, 0, 240, 80), Phaser.Geom.Rectangle.Contains);
        
        const name = FIGHTERS_DATA[key].name;
        const label = this.add.text(0, 0, name, { fontSize: '22px', color: '#ffffff' }).setOrigin(0.5);
        
        const container = this.add.container(x, y, [btnBg, label]);
        btnBg.on('pointerdown', () => this.handleSelection(key, btnBg));
        
        if (DEBUG) {
            this.input.enableDebug(btnBg, 0x00ff00);
        }
        
        fighterButtons.push(container);
    });

    this.p1Indicator = this.add.text(-150, 150, "P1: (None)", { fontSize: '20px', color: '#00ffff' }).setOrigin(0.5);
    this.p2Indicator = this.add.text(150, 150, "P2: (None)", { fontSize: '20px', color: '#ff00ff' }).setOrigin(0.5);
    
    this.readyButton = this.add.rectangle(0, 210, 240, 50, 0x444444);
    this.readyButton.setInteractive(new Phaser.Geom.Rectangle(400, 0, 240, 50), Phaser.Geom.Rectangle.Contains);
    this.readyText = this.add.text(0, 210, "START FIGHT", { fontSize: '24px', color: '#888888' }).setOrigin(0.5);
    
    if (DEBUG) {
        this.input.enableDebug(this.readyButton, 0x00ff00);
    }
    
    this.readyButton.on('pointerdown', () => {
        if (this.p1Selection && this.p2Selection) {
            this.selectionUI.destroy();
            this.startFight(ground, this.p1Selection, this.p2Selection);
        }
    });

    this.selectionUI = this.add.container(512, 384, [bg, title, ...fighterButtons, this.p1Indicator, this.p2Indicator, this.readyButton, this.readyText]);
    this.selectionUI.setScrollFactor(0);
    this.selectionUI.setDepth(1000);
  }

  private handleSelection(key: string, btnBg: Phaser.GameObjects.Rectangle) {
    if (!this.p1Selection) {
        this.p1Selection = key;
        this.p1Indicator.setText(`P1: ${FIGHTERS_DATA[key].name}`);
        btnBg.setStrokeStyle(4, 0x00ffff);
    } else if (!this.p2Selection) {
        if (this.p1Selection === key) return; // Prevent same character selection
        this.p2Selection = key;
        this.p2Indicator.setText(`P2: ${FIGHTERS_DATA[key].name}`);
        btnBg.setStrokeStyle(4, 0xff00ff);
        
        // Activate Ready Button
        this.readyButton.setFillStyle(0x00aa00);
        this.readyText.setColor('#ffffff');
    } else {
        // Reset selection if clicking again
        this.p1Selection = null;
        this.p2Selection = null;
        this.p1Indicator.setText("P1: (None)");
        this.p2Indicator.setText("P2: (None)");
        this.readyButton.setFillStyle(0x444444);
        this.readyText.setColor('#888888');
        
        // Clear all strokes
        this.selectionUI.list.forEach(obj => {
            if (obj instanceof Phaser.GameObjects.Container) {
                const rect = obj.getAt(0) as Phaser.GameObjects.Rectangle;
                if (rect.setStrokeStyle) rect.setStrokeStyle(0);
            }
        });
    }
  }

  private startFight(ground: Phaser.GameObjects.Rectangle, p1Key: string, p2Key: string) {
    const worldWidth = this.bgAkuma.displayWidth;
    const groundY = 650;

    if (this.cpuAttacker) {
      // CPU is attacker, human defends: P1 = defender, P2 = attacker
      [p1Key, p2Key] = [p2Key, p1Key];
    }

    // Set world bounds to ground level as a safety net
    this.physics.world.setBounds(0, 0, worldWidth, groundY);

    this.player1 = new FighterSprite(this, worldWidth / 2 - 150, groundY, p1Key);
    this.player1.setScale(2);
    this.player1.setCollideWorldBounds(true);
    this.physics.add.collider(this.player1, ground);

    this.player2 = new FighterSprite(this, worldWidth / 2 + 150, groundY, p2Key);
    this.player2.setScale(2);
    this.player2.setCollideWorldBounds(true);
    this.physics.add.collider(this.player2, ground);

    // Camera follow target (invisible zone between players)
    this.cameraTarget = this.add.zone(worldWidth / 2, groundY / 2, 1, 1);
    this.camera.startFollow(this.cameraTarget, true, 0.1, 0.1);

    // Collision detection: attackBox vs opponent hitboxes
    this.physics.add.overlap(this.player1.attackBox, this.player2.headHitbox, () => {
        this.checkHit(this.player1, this.player2, 0.3);
    });
    this.physics.add.overlap(this.player1.attackBox, this.player2.torsoHitbox, () => {
        this.checkHit(this.player1, this.player2, 0.1);
    });
    this.physics.add.overlap(this.player1.attackBox, this.player2.feetHitbox, () => {
        this.checkHit(this.player1, this.player2, 0.05);
    });
    this.physics.add.overlap(this.player2.attackBox, this.player1.headHitbox, () => {
        this.checkHit(this.player2, this.player1, 0.3);
    });
    this.physics.add.overlap(this.player2.attackBox, this.player1.torsoHitbox, () => {
        this.checkHit(this.player2, this.player1, 0.1);
    });
    this.physics.add.overlap(this.player2.attackBox, this.player1.feetHitbox, () => {
        this.checkHit(this.player2, this.player1, 0.05);
    });

    // Health bars UI (fixed to camera)
    const barWidth = 300;
    const barHeight = 40;
    const barY = 30;
    const cam = this.cameras.main;

    this.add.rectangle(30, barY, barWidth, barHeight, 0x444444)
        .setOrigin(0, 0.5).setScrollFactor(0).setDepth(100);
    this.p1HealthBarFill = this.add.rectangle(30, barY, barWidth, barHeight, 0x00ff00)
        .setOrigin(0, 0.5).setScrollFactor(0).setDepth(101);
    this.add.rectangle(30, barY, barWidth, barHeight)
        .setOrigin(0, 0.5).setScrollFactor(0).setDepth(102).setStrokeStyle(2, 0xffffff).setFillStyle();

    this.add.rectangle(cam.width - 30, barY, barWidth, barHeight, 0x444444)
        .setOrigin(1, 0.5).setScrollFactor(0).setDepth(100);
    this.p2HealthBarFill = this.add.rectangle(cam.width - 30, barY, barWidth, barHeight, 0x00ff00)
        .setOrigin(1, 0.5).setScrollFactor(0).setDepth(101);
    this.add.rectangle(cam.width - 30, barY, barWidth, barHeight)
        .setOrigin(1, 0.5).setScrollFactor(0).setDepth(102).setStrokeStyle(2, 0xffffff).setFillStyle();

    if (this.input && this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.p1Keys = this.input.keyboard.addKeys('W,A,S,D,T,Y,U,G,H,J');
      this.p2AttackKeys = this.input.keyboard.addKeys('NUMPAD_ONE,NUMPAD_TWO,NUMPAD_THREE,NUMPAD_FOUR,NUMPAD_FIVE,NUMPAD_SIX');
    }
  }

  private checkHit(attacker: FighterSprite, defender: FighterSprite, damagePct: number) {
      if (this.isFightOver) return;
      if (defender.alpha !== 1) return;

      if (!defender.isBlocking) {
          defender.takeDamage(defender.maxLife * damagePct, attacker.x);
          defender.setAlpha(0.5);
          this.time.delayedCall(500, () => defender.setAlpha(1));
          this.checkWin();
      }
  }

  private checkWin() {
      if (this.player1.life <= 0 || this.player2.life <= 0) {
          this.isFightOver = true;
          const winnerLabel = this.player1.life > 0 ? 'PLAYER 1' : 'PLAYER 2';
          const winnerSprite = this.player1.life > 0 ? this.player1 : this.player2;
          winnerSprite.setPosition(this.cameras.main.scrollX + this.cameras.main.width / 2, winnerSprite.y);
          (winnerSprite.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
          this.add.text(this.cameras.main.scrollX + this.cameras.main.width / 2, 384, `${winnerLabel} WINS!`, {
              fontSize: '64px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 8
          }).setOrigin(0.5).setScrollFactor(0);

          this.time.delayedCall(2000, () => {
              if (this.isManualSelection) {
                  this.scene.start('MainMenu');
              } else {
                  // Return to Game scene with the result
                  const gameScene = this.scene.get('Game') as any;
                  gameScene.handleFightResult({
                      winner: this.player1.life > 0
                          ? (this.cpuAttacker ? 'defender' : 'attacker')
                          : (this.cpuAttacker ? 'attacker' : 'defender'),
                      attacker: this.attackerData,
                      defender: this.defenderData,
                      targetJ: this.targetJ,
                      targetI: this.targetI,
                      toggleTurn: this.toggleTurn
                  });
                  this.scene.resume('Game');
                  this.scene.stop();
              }
          });
      }
  }

  private getCPUControls(): { left: boolean; right: boolean; up: boolean; down: boolean; lp: boolean; mp: boolean; hp: boolean; lk: boolean; mk: boolean; hk: boolean } {
    const p2 = this.player2;
    const p1 = this.player1;
    const distX = p2.x - p1.x;
    const forward = distX < 0 ? 'right' : 'left';
    const backward = distX < 0 ? 'left' : 'right';
    const rand = Math.random();

    if (p1.getIsAttacking()) {
      if (this.cpuReactionDelay < 10) {
        this.cpuReactionDelay++;
      }
    } else {
      this.cpuReactionDelay = 0;
    }

    if (Math.abs(distX) < 250) {
      if (p1.getIsAttacking() && this.cpuReactionDelay >= 10 && rand < 0.6) {
        return { left: backward === 'left', right: backward === 'right', up: false, down: false, lp: false, mp: false, hp: false, lk: false, mk: false, hk: false };
      }
      if (rand < 0.35) {
        const r2 = Math.random();
        if (r2 < 0.33) return { left: false, right: false, up: false, down: false, lp: true, mp: false, hp: false, lk: false, mk: false, hk: false };
        if (r2 < 0.66) return { left: false, right: false, up: false, down: false, lp: false, mp: false, hp: true, lk: false, mk: false, hk: false };
        return { left: false, right: false, up: false, down: false, lp: false, mp: false, hp: false, lk: false, mk: true, hk: false };
      }
      if (rand < 0.55) {
        return { left: backward === 'left', right: backward === 'right', up: false, down: false, lp: false, mp: false, hp: false, lk: false, mk: false, hk: false };
      }
      if (rand < 0.7) {
        return { left: forward === 'left', right: forward === 'right', up: false, down: false, lp: false, mp: false, hp: false, lk: false, mk: false, hk: false };
      }
      if (rand < 0.85) {
        return { left: false, right: false, up: false, down: true, lp: false, mp: false, hp: false, lk: false, mk: false, hk: false };
      }
      return { left: false, right: false, up: false, down: false, lp: false, mp: false, hp: false, lk: false, mk: false, hk: false };
    }

    return { left: forward === 'left', right: forward === 'right', up: false, down: false, lp: false, mp: false, hp: false, lk: false, mk: false, hk: false };
  }

  update() {
    if (!this.player1 || !this.player2 || this.isFightOver) return;

    // Constraint: Max distance between players (Camera width - margins)
    const cam = this.cameras.main;
    const viewMargin = 80; 
    const maxDist = cam.width - (viewMargin * 2);
    const currentDist = Math.abs(this.player1.x - this.player2.x);

    if (currentDist > maxDist) {
        const p1Body = this.player1.body as Phaser.Physics.Arcade.Body;
        const p2Body = this.player2.body as Phaser.Physics.Arcade.Body;

        const isP1MovingAway = (this.player1.x < this.player2.x) ? (p1Body.velocity.x < 0) : (p1Body.velocity.x > 0);
        const isP2MovingAway = (this.player2.x < this.player1.x) ? (p2Body.velocity.x < 0) : (p2Body.velocity.x > 0);

        if (isP1MovingAway && !isP2MovingAway) {
            // Only P1 is trying to move away, block P1 relative to P2
            this.player1.x = (this.player1.x < this.player2.x) ? (this.player2.x - maxDist) : (this.player2.x + maxDist);
        } else if (isP2MovingAway && !isP1MovingAway) {
            // Only P2 is trying to move away, block P2 relative to P1
            this.player2.x = (this.player2.x < this.player1.x) ? (this.player1.x - maxDist) : (this.player1.x + maxDist);
        } else {
            // Both moving away or other cases: split the difference
            const over = (currentDist - maxDist) / 2;
            if (this.player1.x < this.player2.x) {
                this.player1.x += over;
                this.player2.x -= over;
            } else {
                this.player2.x += over;
                this.player1.x -= over;
            }
        }
    }

    // Update camera target to be between players AFTER constraints
    const midX = (this.player1.x + this.player2.x) / 2;
    if (this.cameraTarget) {
        this.cameraTarget.x = midX;
    }

    // Still ensure they don't leave world bounds
    const minWorldX = viewMargin;
    const maxWorldX = this.bgAkuma.displayWidth - viewMargin;
    [this.player1, this.player2].forEach(p => {
        if (p.x < minWorldX) p.x = minWorldX;
        if (p.x > maxWorldX) p.x = maxWorldX;
    });

    // Update health bars
    if (this.player1 && this.player2) {
        this.p1HealthBarFill.setSize(300 * (this.player1.life / this.player1.maxLife), 40);
        this.p2HealthBarFill.setSize(300 * (this.player2.life / this.player2.maxLife), 40);
    }

    if (this.player1 && this.p1Keys) {
        this.player1.handleInput({
            left: this.p1Keys.A.isDown,
            right: this.p1Keys.D.isDown,
            up: this.p1Keys.W.isDown,
            down: this.p1Keys.S.isDown,
            lp: this.p1Keys.T.isDown,
            mp: this.p1Keys.Y.isDown,
            hp: this.p1Keys.U.isDown,
            lk: this.p1Keys.G.isDown,
            mk: this.p1Keys.H.isDown,
            hk: this.p1Keys.J.isDown
        }, this.player2.x, this.player2.getIsAttacking());
    }

    if (this.player2 && (this.isCPU || (this.cursors && this.p2AttackKeys))) {
        const controls = this.isCPU ? this.getCPUControls() : {
            left: this.cursors.left.isDown,
            right: this.cursors.right.isDown,
            up: this.cursors.up.isDown,
            down: this.cursors.down.isDown,
            lp: this.p2AttackKeys.NUMPAD_FOUR.isDown,
            mp: this.p2AttackKeys.NUMPAD_FIVE.isDown,
            hp: this.p2AttackKeys.NUMPAD_SIX.isDown,
            lk: this.p2AttackKeys.NUMPAD_ONE.isDown,
            mk: this.p2AttackKeys.NUMPAD_TWO.isDown,
            hk: this.p2AttackKeys.NUMPAD_THREE.isDown
        };
        this.player2.handleInput(controls, this.player1.x, this.player1.getIsAttacking());
    }
  }
}
