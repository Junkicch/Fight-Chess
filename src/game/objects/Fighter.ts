import { PieceType } from './Piece';

export interface AnimConfig {
  frameRate: number;
  repeat?: number;
  frameWidth?: number;
  frameHeight?: number;
}

export interface FighterStats {
  name: string;
  piece: PieceType;
  life: number;
  movement: number;
  assetKey: string;
  frameConfig: {
    width: number;
    height: number;
  };
  visualOffset: {
    y: number;
  };
  animations: Record<string, AnimConfig>;
}

export class Fighter {
  public readonly name: string;
  public readonly piece: PieceType;
  public life: number;
  public maxLife: number;
  public readonly movement: number;
  public readonly assetKey: string;

  constructor(stats: FighterStats) {
    this.name = stats.name;
    this.piece = stats.piece;
    this.life = stats.life;
    this.maxLife = stats.life;
    this.movement = stats.movement;
    this.assetKey = stats.assetKey;
  }

  public static create(id: string): Fighter {
    const stats = FIGHTERS_DATA[id.toUpperCase()];
    if (!stats) throw new Error(`Fighter ${id} not found`);
    return new Fighter(stats);
  }

  public takeDamage(amount: number): void {
    this.life = Math.max(0, this.life - amount);
  }

  public heal(amount: number): void {
    this.life = Math.min(this.maxLife, this.life + amount);
  }

  public isAlive(): boolean {
    return this.life > 0;
  }
}

export const FIGHTERS_DATA: Record<string, FighterStats> = {
    AKUMA: {
        name: 'Akuma',
        piece: PieceType.KING,
        life: 1000,
        movement: 5,
        assetKey: 'akuma',
        frameConfig: { width: 98, height: 140 },
        visualOffset: { y: -50 },
        animations: {
            idle: { frameRate: 15, repeat: -1, frameWidth: 98, frameHeight: 140 },
            walkf: { frameRate: 15, repeat: -1, frameWidth: 133, frameHeight: 142 },
            walkb: { frameRate: 15, repeat: -1, frameWidth: 133, frameHeight: 142 },
            crouching: { frameRate: 15, frameWidth: 110, frameHeight: 137 },
            crouch: { frameRate: 15, repeat: -1, frameWidth: 108, frameHeight: 102 },
            jump: { frameRate: 15, frameWidth: 125, frameHeight: 200 },
            lp: { frameRate: 15, frameWidth: 142, frameHeight: 138 },
            mp: { frameRate: 15, frameWidth: 153, frameHeight: 136 },
            hp: { frameRate: 15, frameWidth: 182, frameHeight: 141 },
            lk: { frameRate: 15, frameWidth: 144, frameHeight: 140 },
            mk: { frameRate: 15, frameWidth: 181, frameHeight: 137 },
            hk: { frameRate: 15, frameWidth: 172, frameHeight: 140 },
            block: { frameRate: 15, repeat: -1, frameWidth: 99, frameHeight: 134 }
        }
  },
  DUDLEY: {
    name: 'Dudley',
    piece: PieceType.KNIGHT,
    life: 1000,
    movement: 3,
    assetKey: 'dudley',
    frameConfig: { width: 126, height: 136 },
    visualOffset: { y: -50 },
    animations: {
      idle: { frameRate: 15, repeat: -1, frameWidth: 126, frameHeight: 136 },
      walkf: { frameRate: 15, repeat: -1, frameWidth: 136, frameHeight: 145 },
      walkb: { frameRate: 15, repeat: -1, frameWidth: 129, frameHeight: 148 },
      crouching: { frameRate: 15, frameWidth: 122, frameHeight: 141 },
      crouch: { frameRate: 15, repeat: -1, frameWidth: 117, frameHeight: 96 },
      jump: { frameRate: 15, frameWidth: 126, frameHeight: 213 },
      lp: { frameRate: 15, frameWidth: 161, frameHeight: 133 },
      mp: { frameRate: 15, frameWidth: 175, frameHeight: 133 },
      hp: { frameRate: 15, frameWidth: 186, frameHeight: 136 },
      lk: { frameRate: 15, frameWidth: 138, frameHeight: 136 },
      mk: { frameRate: 15, frameWidth: 147, frameHeight: 158 },
      hk: { frameRate: 15, frameWidth: 148, frameHeight: 136 },
      block: { frameRate: 15, repeat: -1, frameWidth: 113, frameHeight: 134 }
    }
  },
  KEN: {
    name: 'Ken',
    piece: PieceType.QUEEN,
    life: 1000,
    movement: 6,
    assetKey: 'ken',
    frameConfig: { width: 98, height: 131 },
    visualOffset: { y: -50 },
    animations: {
      idle: { frameRate: 15, repeat: -1, frameWidth: 98, frameHeight: 131 },
      walkf: { frameRate: 15, repeat: -1, frameWidth: 131, frameHeight: 133 },
      walkb: { frameRate: 15, repeat: -1, frameWidth: 132, frameHeight: 133 },
      crouching: { frameRate: 15, frameWidth: 108, frameHeight: 129 },
      crouch: { frameRate: 15, repeat: -1, frameWidth: 107, frameHeight: 93 },
      jump: { frameRate: 15, frameWidth: 106, frameHeight: 210 },
      lp: { frameRate: 15, frameWidth: 141, frameHeight: 127 },
      mp: { frameRate: 15, frameWidth: 147, frameHeight: 126 },
      hp: { frameRate: 15, frameWidth: 150, frameHeight: 126 },
      lk: { frameRate: 15, frameWidth: 142, frameHeight: 126 },
       mk: { frameRate: 15, frameWidth: 202, frameHeight: 141 },
      hk: { frameRate: 15, frameWidth: 207, frameHeight: 141 },
      block: { frameRate: 15, repeat: -1, frameWidth: 98, frameHeight: 125 }
    }
  },
  MAKOTO: {
    name: 'Makoto',
    piece: PieceType.BISHOP,
    life: 1000,
    movement: 7,
    assetKey: 'makoto',
    frameConfig: { width: 139, height: 120 },
    visualOffset: { y: -50 },
    animations: {
      idle: { frameRate: 15, repeat: -1, frameWidth: 139, frameHeight: 120 },
      walkf: { frameRate: 15, repeat: -1, frameWidth: 161, frameHeight: 126 },
      walkb: { frameRate: 15, repeat: -1, frameWidth: 158, frameHeight: 126 },
      crouching: { frameRate: 15, frameWidth: 153, frameHeight: 95 },
      crouch: { frameRate: 15, repeat: -1, frameWidth: 153, frameHeight: 95 },
      jump: { frameRate: 15, frameWidth: 134, frameHeight: 242 },
      lp: { frameRate: 15, frameWidth: 143, frameHeight: 120 },
      mp: { frameRate: 15, frameWidth: 161, frameHeight: 120 },
      hp: { frameRate: 15, frameWidth: 164, frameHeight: 130 },
      lk: { frameRate: 15, frameWidth: 189, frameHeight: 141 },
      mk: { frameRate: 15, frameWidth: 221, frameHeight: 138 },
      hk: { frameRate: 15, frameWidth: 210, frameHeight: 120 },
      block: { frameRate: 15, repeat: -1, frameWidth: 124, frameHeight: 119 }
    }
  },
  Q: {
    name: 'Q',
    piece: PieceType.ROOK,
    life: 1000,
    movement: 2,
    assetKey: 'q',
    frameConfig: { width: 106, height: 159 },
    visualOffset: { y: -50 },
    animations: {
      idle: { frameRate: 15, repeat: -1, frameWidth: 106, frameHeight: 159 },
      walkf: { frameRate: 15, repeat: -1, frameWidth: 109, frameHeight: 160 },
      walkb: { frameRate: 15, repeat: -1, frameWidth: 109, frameHeight: 160 },
      crouching: { frameRate: 15, frameWidth: 109, frameHeight: 161 },
      crouch: { frameRate: 15, repeat: -1, frameWidth: 107, frameHeight: 109 },
      jump: { frameRate: 15, frameWidth: 133, frameHeight: 230 },
      lp: { frameRate: 15, frameWidth: 148, frameHeight: 161 },
      mp: { frameRate: 15, frameWidth: 243, frameHeight: 160 },
      hp: { frameRate: 15, frameWidth: 273, frameHeight: 160 },
      lk: { frameRate: 15, frameWidth: 150, frameHeight: 154 },
      mk: { frameRate: 15, frameWidth: 180, frameHeight: 154 },
      hk: { frameRate: 15, frameWidth: 220, frameHeight: 165 },
      block: { frameRate: 15, repeat: -1, frameWidth: 114, frameHeight: 154 }
    }
  },
  SEAN: {
    name: 'Sean',
    piece: PieceType.PAWN,
    life: 1000,
    movement: 4,
    assetKey: 'sean',
    frameConfig: { width: 98, height: 132 },
    visualOffset: { y: -50 },
    animations: {
      idle: { frameRate: 15, repeat: -1, frameWidth: 98, frameHeight: 132 },
      walkf: { frameRate: 15, repeat: -1, frameWidth: 132, frameHeight: 133 },
      walkb: { frameRate: 15, repeat: -1, frameWidth: 132, frameHeight: 134 },
      crouching: { frameRate: 15, frameWidth: 133, frameHeight: 172 },
      crouch: { frameRate: 15, repeat: -1, frameWidth: 107, frameHeight: 94 },
      jump: { frameRate: 15, frameWidth: 106, frameHeight: 206 },
      lp: { frameRate: 15, frameWidth: 141, frameHeight: 128 },
      mp: { frameRate: 15, frameWidth: 147, frameHeight: 127 },
      hp: { frameRate: 15, frameWidth: 175, frameHeight: 130 },
      lk: { frameRate: 15, frameWidth: 142, frameHeight: 126 },
      mk: { frameRate: 15, frameWidth: 181, frameHeight: 127 },
      hk: { frameRate: 15, frameWidth: 174, frameHeight: 139 },
      block: { frameRate: 15, repeat: -1, frameWidth: 98, frameHeight: 127 }
    }
  }
};
