import { Scene, GameObjects } from 'phaser';

export enum PieceType {
    PAWN = 0,
    KNIGHT = 1,
    ROOK = 2,
    BISHOP = 3,
    QUEEN = 4,
    KING = 5,
}

export enum PieceColor {
    BLACK = 'bpieces',
    WHITE = 'wpieces',
}

export class Piece extends GameObjects.Image {
    public pieceType: PieceType;
    public pieceColor: PieceColor;
    public boardJ: number;
    public boardI: number;
    public hasMoved: boolean = false;

    constructor(scene: Scene, j: number, i: number, type: PieceType, color: PieceColor) {
        super(scene, 0, 0, color, type);
        
        this.boardJ = j;
        this.boardI = i;
        this.pieceType = type;
        this.pieceColor = color;

        this.setOrigin(0);
        this.setData('key', 'PIECE'); // Mantendo compatibilidade com o código atual
        this.setData('piece', type);
        this.setData('color', color);
        
        scene.add.existing(this);
    }

    public updatePosition(j: number, i: number, markAsMoved: boolean = true) {
        this.boardJ = j;
        this.boardI = i;
        if (markAsMoved) {
            this.hasMoved = true;
            this.setData('hasMoved', true);
        }
        this.setData('j', j);
        this.setData('i', i);
    }
}
