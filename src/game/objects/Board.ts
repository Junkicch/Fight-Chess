import { Scene, GameObjects } from 'phaser';
import { Piece, PieceType, PieceColor } from './Piece';

export const BOARD_CONFIG = {
    CENTER_X: 512,
    CENTER_Y: 384,
    SIZE: 720,
    MARGIN: 40,
    SQUARE_SIZE: 80,
};

export const GRID_START_X = (BOARD_CONFIG.CENTER_X - BOARD_CONFIG.SIZE / 2) + BOARD_CONFIG.MARGIN;
export const GRID_START_Y = (BOARD_CONFIG.CENTER_Y - BOARD_CONFIG.SIZE / 2) + BOARD_CONFIG.MARGIN;

export class Board {
    private scene: Scene;
    private places: GameObjects.Container[] = [];
    private highlights: GameObjects.Graphics[] = [];
    public lastMoveHighlight: GameObjects.Graphics;
    public kingCheckHighlight: GameObjects.Graphics;

    constructor(scene: Scene) {
        this.scene = scene;
        this.lastMoveHighlight = scene.add.graphics().setDepth(1);
        this.kingCheckHighlight = scene.add.graphics().setDepth(1);
        this.createGrid();
    }

    private createGrid() {
        for (let j = 0; j <= 7; j++) {
            const y = GRID_START_Y + j * BOARD_CONFIG.SQUARE_SIZE;
            for (let i = 0; i <= 7; i++) {
                const x = GRID_START_X + i * BOARD_CONFIG.SQUARE_SIZE;
                const place = this.scene.add.container(x, y);
                this.places.push(place);

                const highlight = this.scene.add.graphics();
                highlight.setVisible(false).setDepth(1);
                place.add(highlight);
                this.highlights.push(highlight);
            }
        }
    }

    public getPieceAt(j: number, i: number): Piece | null {
        if (j < 0 || j > 7 || i < 0 || i > 7) return null;
        const index = (j * 8) + i;
        const piece = this.places[index].list.find(obj => obj instanceof Piece) as Piece || null;
        if (piece && (piece.getData('key') === 'TEMP_HIDDEN' || piece.getData('isCapturedSim'))) return null;
        return piece;
    }

    public addPiece(piece: Piece, j: number, i: number, markAsMoved: boolean = true) {
        const index = (j * 8) + i;
        this.places[index].add(piece);
        piece.setPosition(0, 0);
        piece.setData('indexTile', index);
        piece.updatePosition(j, i, markAsMoved);
    }

    public removePiece(piece: Piece) {
        const index = piece.getData('indexTile');
        if (index !== undefined) {
            this.places[index].remove(piece);
        }
    }

    public clearHighlights() {
        this.highlights.forEach(h => h.setVisible(false));
    }

    public showMoveHighlight(j: number, i: number, color: number = 0x000000) {
        const index = (j * 8) + i;
        const h = this.highlights[index];
        h.clear();
        h.fillStyle(color, 0.5);
        h.fillCircle(BOARD_CONFIG.SQUARE_SIZE / 2, BOARD_CONFIG.SQUARE_SIZE / 2, 4);
        h.setVisible(true);
        h.setDepth(3);
    }

    public setPlaceDepth(j: number, i: number, depth: number) {
        const index = (j * 8) + i;
        this.places[index].setDepth(depth);
    }

    public getGridCoords(x: number, y: number): { j: number, i: number } {
        const i = Math.floor((x - GRID_START_X) / BOARD_CONFIG.SQUARE_SIZE);
        const j = Math.floor((y - GRID_START_Y) / BOARD_CONFIG.SQUARE_SIZE);
        return { j, i };
    }

    public getWorldCoords(j: number, i: number): { x: number, y: number } {
        const x = GRID_START_X + i * BOARD_CONFIG.SQUARE_SIZE;
        const y = GRID_START_Y + j * BOARD_CONFIG.SQUARE_SIZE;
        return { x, y };
    }
}
