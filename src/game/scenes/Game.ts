import { Scene } from 'phaser';

const DEBUG = false;
const PIECE = {
  PAWN: 0,
  KNIGHT: 1,
  ROOK: 2,
  BISHOP: 3,
  QUEEN: 4,
  KING: 5,
}
const COLOR = {
  BLACK: 'bpieces',
  WHITE: 'wpieces',
}

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  msg_text: Phaser.GameObjects.Text;
  board: Phaser.GameObjects.Image;
  piece: Phaser.GameObjects.Image;
  #places: Phaser.GameObjects.Container[];
  #highlights: Phaser.GameObjects.Graphics[];
  #selectedPiece: Phaser.GameObjects.Image | null = null;

  constructor() {
    super('Game');
  }

  create() {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0x0000ff);

    this.board = this.add.image(512, 384, 'board');
    this.board.setOrigin(0.5);

    this.#createPlaces();
    this.#createDragEvents();

    this.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        const targetI = Math.floor((pointer.x - 448) / 16);
        const targetJ = Math.floor((pointer.y - 320) / 16);
        const piece = this.#getPieceAt(targetJ, targetI);
        if (!piece) {
          this.#clearHighlights();
          this.#selectedPiece = null;
        }
      }
    });
  }


  #createPiece(x: number, y: number, j: number, i: number, draggable: boolean): Phaser.GameObjects.Image {
    let color: string | null = null;
    let piece: number | null = null;
    const indexTile = (j * 8) + i;

    if (j == 1) {
      color = COLOR.BLACK;
      piece = PIECE.PAWN;
    } else if (j == 6) {
      color = COLOR.WHITE;
      piece = PIECE.PAWN;
    } else if (j == 0) {
      color = COLOR.BLACK
      if (i == 0 || i == 7) {
        piece = PIECE.ROOK;
      } else if (i == 2 || i == 5) {
        piece = PIECE.BISHOP;
      } else if (i == 1 || i == 6) {
        piece = PIECE.KNIGHT;
      } else if (i == 4) {
        piece = PIECE.KING;
      } else if (i == 3) {
        piece = PIECE.QUEEN;
      }
    } else if (j == 7) {
      color = COLOR.WHITE
      if (i == 0 || i == 7) {
        piece = PIECE.ROOK;
      } else if (i == 2 || i == 5) {
        piece = PIECE.BISHOP;
      } else if (i == 1 || i == 6) {
        piece = PIECE.KNIGHT;
      } else if (i == 3) {
        piece = PIECE.QUEEN;
      } else if (i == 4) {
        piece = PIECE.KING;
      }
    }

    if (piece === null || color === null) {
      return this.add.image(x, y, 'EMPTY').setOrigin(0).setInteractive({ draggable: false }).setData({ indexTile, key: 'EMPTY' });
    } else {
      const img = this.add.image(x, y, color, piece).setOrigin(0).setInteractive({ draggable: draggable }).setData({
        x,
        y,
        j,
        i,
        indexTile,
        piece,
        color,
        key: 'PIECE'
      });
      img.on(Phaser.Input.Events.POINTER_DOWN, () => {
        this.#selectedPiece = img;
        this.#showValidMoves(img);
      });
      return img;
    }
  }

  #createPlaces(): void {
    this.#places = [];
    this.#highlights = [];
    for (let j = 0; j <= 7; j += 1) {
      const y = 320 + j * 16;
      for (let i = 0; i <= 7; i += 1) {
        const x = 448 + i * 16;
        const place = this.add.container(x, y, []);
        this.#places.push(place);

        const highlight = this.add.graphics();
        highlight.fillStyle(0x000000, 0.5);
        highlight.fillCircle(8, 8, 4);
        highlight.setVisible(false);
        highlight.setDepth(1);
        place.add(highlight);
        this.#highlights.push(highlight);

        if (j < 2 || j > 5) {
          const pieceGameObjetc = this.#createPiece(0, 0, j, i, true);
          place.add(pieceGameObjetc);
        }
      }
    }
  }

  #showValidMoves(gameObject: Phaser.GameObjects.Image): void {
    this.#clearHighlights();
    for (let j = 0; j < 8; j++) {
      for (let i = 0; i < 8; i++) {
        if (this.#isValidMove(gameObject, j, i)) {
          const index = (j * 8) + i;
          this.#highlights[index].setVisible(true);
        }
      }
    }
  }

  #clearHighlights(): void {
    this.#highlights.forEach(h => h.setVisible(false));
  }

  #createDragEvents(): void {
    this.#createDragStartEventListener();
    this.#createDragEventListener();
    this.#createDragEndEventListener();
  }

  #createDragStartEventListener(): void {
    this.input.on(
      Phaser.Input.Events.DRAG_START,
      (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image) => {
        gameObject.setData({ x: gameObject.x, y: gameObject.y });
        const indexTile = gameObject.getData('indexTile') as number;
        this.#places[indexTile].setDepth(2);
        gameObject.setAlpha(0.8);
        this.#selectedPiece = gameObject;
        this.#showValidMoves(gameObject);
      })
  }

  #createDragEventListener(): void {
    this.input.on(
      Phaser.Input.Events.DRAG,
      (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image, dragX: number, dragY: number) => {
        gameObject.setPosition(dragX, dragY);
      })
  }

  #getPieceAt(j: number, i: number): Phaser.GameObjects.Image | null {
    if (j < 0 || j > 7 || i < 0 || i > 7) return null;
    const indexTile = (j * 8) + i;
    const place = this.#places[indexTile];
    const piece = place.list.find(obj => obj instanceof Phaser.GameObjects.Image && obj.getData('key') === 'PIECE') as Phaser.GameObjects.Image;
    return piece || null;
  }

  #isValidMove(gameObject: Phaser.GameObjects.Image, targetJ: number, targetI: number): boolean {
    if (targetJ < 0 || targetJ > 7 || targetI < 0 || targetI > 7) return false;
    const pieceType = gameObject.getData('piece') as number;
    const currentJ = gameObject.getData('j') as number;
    const currentI = gameObject.getData('i') as number;
    const color = gameObject.getData('color') as string;

    const direction = color === COLOR.WHITE ? -1 : 1;
    const startRow = color === COLOR.WHITE ? 6 : 1;

    if (pieceType === PIECE.PAWN) {
      // Normal move forward
      if (targetI === currentI && targetJ === currentJ + direction) {
        return this.#getPieceAt(targetJ, targetI) === null;
      }

      // Double move from start
      if (targetI === currentI && currentJ === startRow && targetJ === currentJ + 2 * direction) {
        return this.#getPieceAt(currentJ + direction, currentI) === null &&
          this.#getPieceAt(targetJ, targetI) === null;
      }

      // Capture
      if (Math.abs(targetI - currentI) === 1 && targetJ === currentJ + direction) {
        const targetPiece = this.#getPieceAt(targetJ, targetI);
        return targetPiece !== null && targetPiece.getData('color') !== color;
      }
    }
    if (pieceType === PIECE.KING) {
      const rowDiff = Math.abs(targetJ - currentJ);
      const colDiff = Math.abs(targetI - currentI)
      //Normal move
      if (rowDiff <= 1 && colDiff <= 1 && (rowDiff > 0 || colDiff > 0)) {
        const targetPiece = this.#getPieceAt(targetJ, targetI);
        return targetPiece === null || targetPiece.getData('color') !== color;
      }
    }

    if (pieceType === PIECE.ROOK) {
      //Normal move
      if (targetI !== currentI && targetJ !== currentJ) {
        return false;
      }

      const stepI = targetI === currentI ? 0 : (targetI > currentI ? 1 : -1);
      const stepJ = targetJ === currentJ ? 0 : (targetJ > currentJ ? 1 : -1);

      let checkI = currentI + stepI;
      let checkJ = currentJ + stepJ;

      while (checkI != targetI || checkJ != targetJ) {
        if (this.#getPieceAt(checkJ, checkI) !== null) {
          return false;
        }
        checkI += stepI;
        checkJ += stepJ;
      }
      const targetPiece = this.#getPieceAt(targetJ, targetI);
      return targetPiece === null || targetPiece.getData('color') !== color;

    }

    if (pieceType === PIECE.QUEEN) {
      //Normal move
      if (targetI !== currentI && targetJ !== currentJ && Math.abs(targetI - currentI) !== Math.abs(targetJ - currentJ)) {
        return false;
      }

      const stepI = targetI === currentI ? 0 : (targetI > currentI ? 1 : -1);
      const stepJ = targetJ === currentJ ? 0 : (targetJ > currentJ ? 1 : -1);

      let checkI = currentI + stepI;
      let checkJ = currentJ + stepJ;

      while (checkI != targetI || checkJ != targetJ) {
        if (this.#getPieceAt(checkJ, checkI) !== null) {
          return false;
        }
        checkI += stepI;
        checkJ += stepJ;
      }
      const targetPiece = this.#getPieceAt(targetJ, targetI);
      return targetPiece === null || targetPiece.getData('color') !== color;

    }

    if (pieceType === PIECE.BISHOP) {
      const colDiff = Math.abs(targetI - currentI);
      const rowDiff = Math.abs(targetJ - currentJ);
      //Normal move
      if (rowDiff != colDiff || rowDiff === 0) {
        return false;
      }

      const stepI = targetI === currentI ? 0 : (targetI > currentI ? 1 : -1);
      const stepJ = targetJ === currentJ ? 0 : (targetJ > currentJ ? 1 : -1);

      let checkI = currentI + stepI;
      let checkJ = currentJ + stepJ;

      while (checkI != targetI || checkJ != targetJ) {
        if (this.#getPieceAt(checkJ, checkI) !== null) {
          return false;
        }
        checkI += stepI;
        checkJ += stepJ;
      }
      const targetPiece = this.#getPieceAt(targetJ, targetI);
      return targetPiece === null || targetPiece.getData('color') !== color;

    }

    if (pieceType === PIECE.KNIGHT) {
      const rowDiff = Math.abs(targetJ - currentJ);
      const colDiff = Math.abs(targetI - currentI);
      if ((rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2)) {
        const targetPiece = this.#getPieceAt(targetJ, targetI);
        return targetPiece === null || targetPiece.getData('color') !== color;
      }
    }
    return false;
  }

  #createDragEndEventListener(): void {
    this.input.on(
      Phaser.Input.Events.DRAG_END,
      (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image) => {
        const indexTile = gameObject.getData('indexTile') as number;
        this.#places[indexTile].setDepth(0);
        gameObject.setAlpha(1);
        this.#clearHighlights();

        const targetI = Math.floor((pointer.x - 448) / 16);
        const targetJ = Math.floor((pointer.y - 320) / 16);

        if (this.#isValidMove(gameObject, targetJ, targetI)) {
          const targetIndexTile = (targetJ * 8) + targetI;
          const targetPlace = this.#places[targetIndexTile];
          const currentPlace = this.#places[indexTile];

          const targetPiece = this.#getPieceAt(targetJ, targetI);
          if (targetPiece) {
            targetPiece.destroy();
          }

          currentPlace.remove(gameObject);
          targetPlace.add(gameObject);
          gameObject.setPosition(0, 0);
          gameObject.setData({
            j: targetJ,
            i: targetI,
            indexTile: targetIndexTile
          });
        } else {
          gameObject.setPosition(gameObject.getData('x') as number, gameObject.getData('y') as number);
        }
      })
  }

}
