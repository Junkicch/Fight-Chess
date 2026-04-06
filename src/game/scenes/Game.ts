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

const BOARD_CENTER_X = 512;
const BOARD_CENTER_Y = 384;
const BOARD_SIZE = 720;
const MARGIN = 40;
const SQUARE_SIZE = 80;
const GRID_START_X = (BOARD_CENTER_X - BOARD_SIZE / 2) + MARGIN;
const GRID_START_Y = (BOARD_CENTER_Y - BOARD_SIZE / 2) + MARGIN;

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  msg_text: Phaser.GameObjects.Text;
  board: Phaser.GameObjects.Image;
  piece: Phaser.GameObjects.Image;
  #places: Phaser.GameObjects.Container[];
  #highlights: Phaser.GameObjects.Graphics[];
  #lastMoveHighlight: Phaser.GameObjects.Graphics;
  #kingCheckHighlight: Phaser.GameObjects.Graphics;
  #selectedPiece: Phaser.GameObjects.Image | null = null;
  #lastPawnDoubleMove: { j: number, i: number } | null = null;
  #currentTurn: string = COLOR.WHITE;
  #pendingMove: { piece: Phaser.GameObjects.Image, targetJ: number, targetI: number, toggleTurn: boolean } | null = null;
  #pendingPromotion: Phaser.GameObjects.Image | null = null;
  #challengeUI: Phaser.GameObjects.Container;
  #challengeResultText: Phaser.GameObjects.Text;
  #promotionUI: Phaser.GameObjects.Container;

  constructor() {
    super('Game');
  }

  create() {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0x0000ff);

    this.board = this.add.image(BOARD_CENTER_X, BOARD_CENTER_Y, 'board');
    this.board.setOrigin(0.5);

    this.#lastMoveHighlight = this.add.graphics().setDepth(1);
    this.#kingCheckHighlight = this.add.graphics().setDepth(1);

    this.msg_text = this.add.text(BOARD_CENTER_X, 16, "WHITE'S TURN", {
      fontFamily: 'Arial Black', fontSize: 18, color: '#ffffff',
      stroke: '#000000', strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5);

    this.#createPlaces();
    this.#createDragEvents();
    this.#createChallengeUI();
    this.#createPromotionUI();
    this.#updateUI();

    this.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
      if (this.#pendingMove || this.#pendingPromotion) return;
      if (pointer.leftButtonDown()) {
        const targetI = Math.floor((pointer.x - GRID_START_X) / SQUARE_SIZE);
        const targetJ = Math.floor((pointer.y - GRID_START_Y) / SQUARE_SIZE);

        if (this.#selectedPiece && this.#isValidMove(this.#selectedPiece, targetJ, targetI)) {
          this.#movePiece(this.#selectedPiece, targetJ, targetI);
          this.#clearHighlights();
          this.#selectedPiece = null;
          return;
        }

        const piece = this.#getPieceAt(targetJ, targetI);
        if (piece && piece.getData('color') === this.#currentTurn) {
          // If in check, restrict selection to the King piece for clicking
          let kingJ = -1, kingI = -1;
          for (let j = 0; j < 8; j++) {
            for (let i = 0; i < 8; i++) {
              const p = this.#getPieceAt(j, i);
              if (p && p.getData('piece') === PIECE.KING && p.getData('color') === this.#currentTurn) {
                kingJ = j; kingI = i; break;
              }
            }
          }
          const enemyColor = this.#currentTurn === COLOR.WHITE ? COLOR.BLACK : COLOR.WHITE;
          const isInCheck = kingJ !== -1 && this.#isSquareAttacked(kingJ, kingI, enemyColor);

          if (isInCheck && piece.getData('piece') !== PIECE.KING) {
            return;
          }

          this.#selectedPiece = piece;
          this.#showValidMoves(piece);
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
        hasMoved: false,
        key: 'PIECE'
      });
      return img;
    }
  }

  #createPlaces(): void {
    this.#places = [];
    this.#highlights = [];
    for (let j = 0; j <= 7; j += 1) {
      const y = GRID_START_Y + j * SQUARE_SIZE;
      for (let i = 0; i <= 7; i += 1) {
        const x = GRID_START_X + i * SQUARE_SIZE;
        const place = this.add.container(x, y, []);
        this.#places.push(place);

        const highlight = this.add.graphics();
        highlight.fillStyle(0x000000, 0.5);
        highlight.fillCircle(SQUARE_SIZE / 2, SQUARE_SIZE / 2, 4);
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
    const color = gameObject.getData('color') as string;
    for (let j = 0; j < 8; j++) {
      for (let i = 0; i < 8; i++) {
        if (this.#isValidMove(gameObject, j, i)) {
          const index = (j * 8) + i;
          const highlight = this.#highlights[index];
          const targetPiece = this.#getPieceAt(j, i);

          highlight.clear();
          if (targetPiece && targetPiece.getData('color') !== color) {
            highlight.fillStyle(0xff0000, 0.5);
          } else {
            highlight.fillStyle(0x000000, 0.5);
          }
          highlight.fillCircle(SQUARE_SIZE / 2, SQUARE_SIZE / 2, 4);
          highlight.setVisible(true);
          highlight.setDepth(3);
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
        if (this.#pendingMove || this.#pendingPromotion || gameObject.getData('color') !== this.#currentTurn) {
          return;
        }
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
        if (gameObject !== this.#selectedPiece) return;
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

  #isSquareAttacked(targetJ: number, targetI: number, attackerColor: string): boolean {
    for (let j = 0; j < 8; j++) {
      for (let i = 0; i < 8; i++) {
        const piece = this.#getPieceAt(j, i);
        if (piece && piece.getData('color') === attackerColor) {
          // Temporarily disable turn check for validation
          if (this.#isValidMove(piece, targetJ, targetI, true)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  #isCheckmate(color: string): boolean {
    const enemyColor = color === COLOR.WHITE ? COLOR.BLACK : COLOR.WHITE;

    // Find King
    let kingJ = -1, kingI = -1;
    for (let j = 0; j < 8; j++) {
      for (let i = 0; i < 8; i++) {
        const p = this.#getPieceAt(j, i);
        if (p && p.getData('piece') === PIECE.KING && p.getData('color') === color) {
          kingJ = j; kingI = i; break;
        }
      }
    }
    if (kingJ === -1) return false;

    // Must be in check
    if (!this.#isSquareAttacked(kingJ, kingI, enemyColor)) return false;

    // Check all pieces for any legal move that escapes check
    for (let j = 0; j < 8; j++) {
      for (let i = 0; i < 8; i++) {
        const p = this.#getPieceAt(j, i);
        if (p && p.getData('color') === color) {
          for (let targetJ = 0; targetJ < 8; targetJ++) {
            for (let targetI = 0; targetI < 8; targetI++) {
              if (this.#isValidMove(p, targetJ, targetI)) {
                // Simulate move
                const targetPiece = this.#getPieceAt(targetJ, targetI);
                const originalJ = p.getData('j');
                const originalI = p.getData('i');

                // Temp update data
                p.setData({ j: targetJ, i: targetI });
                if (targetPiece) targetPiece.setData('key', 'TEMP_HIDDEN'); // Hide piece

                // Find King again (it might have moved)
                let newKingJ = kingJ, newKingI = kingI;
                if (p.getData('piece') === PIECE.KING) {
                  newKingJ = targetJ; newKingI = targetI;
                }

                const stillInCheck = this.#isSquareAttacked(newKingJ, newKingI, enemyColor);

                // Revert
                p.setData({ j: originalJ, i: originalI });
                if (targetPiece) targetPiece.setData('key', 'PIECE');

                if (!stillInCheck) return false;
              }
            }
          }
        }
      }
    }
    return true;
  }

  #isValidMove(gameObject: Phaser.GameObjects.Image, targetJ: number, targetI: number, ignoreCheck: boolean = false): boolean {
    if (targetJ < 0 || targetJ > 7 || targetI < 0 || targetI > 7) return false;
    const pieceType = gameObject.getData('piece') as number;
    const currentJ = gameObject.getData('j') as number;
    const currentI = gameObject.getData('i') as number;
    const color = gameObject.getData('color') as string;

    const direction = color === COLOR.WHITE ? -1 : 1;
    const startRow = color === COLOR.WHITE ? 6 : 1;

    if (pieceType === PIECE.PAWN) {
      // Normal move forward (cannot be an attack)
      if (targetI === currentI && targetJ === currentJ + direction) {
        return !ignoreCheck && this.#getPieceAt(targetJ, targetI) === null;
      }

      // Double move from start (cannot be an attack)
      const hasMoved = gameObject.getData('hasMoved') as boolean;
      if (!hasMoved && targetI === currentI && targetJ === currentJ + 2 * direction) {
        return !ignoreCheck && this.#getPieceAt(currentJ + direction, currentI) === null &&
          this.#getPieceAt(targetJ, targetI) === null;
      }

      // Capture and En Passant
      if (Math.abs(targetI - currentI) === 1 && targetJ === currentJ + direction) {
        const targetPiece = this.#getPieceAt(targetJ, targetI);
        if (targetPiece) {
          return targetPiece.getData('color') !== color;
        }
        // Check for En Passant
        if (!ignoreCheck && this.#lastPawnDoubleMove && this.#lastPawnDoubleMove.j === currentJ && this.#lastPawnDoubleMove.i === targetI) {
          return true;
        }
        // For threat detection, a diagonal square is attacked even if empty
        if (ignoreCheck) return true;
      }
      return false;
    }
    if (pieceType === PIECE.KING) {
      const rowDiff = Math.abs(targetJ - currentJ);
      const colDiff = Math.abs(targetI - currentI)
      //Normal move
      if (rowDiff <= 1 && colDiff <= 1 && (rowDiff > 0 || colDiff > 0)) {
        const targetPiece = this.#getPieceAt(targetJ, targetI);
        return targetPiece === null || targetPiece.getData('color') !== color;
      }
      //Castiling
      const hasMoved = gameObject.getData('hasMoved') as boolean;
      if (!ignoreCheck && !hasMoved && targetJ === currentJ && currentI === 4) {
        const enemyColor = color === COLOR.WHITE ? COLOR.BLACK : COLOR.WHITE;
        if (targetI === 6) { // Kingside
          const rook = this.#getPieceAt(targetJ, 7);
          return rook?.getData('piece') === PIECE.ROOK &&
            rook?.getData('color') === color &&
            !rook?.getData('hasMoved') &&
            this.#getPieceAt(targetJ, 5) === null &&
            this.#getPieceAt(targetJ, 6) === null &&
            !this.#isSquareAttacked(currentJ, 4, enemyColor) &&
            !this.#isSquareAttacked(currentJ, 5, enemyColor) &&
            !this.#isSquareAttacked(currentJ, 6, enemyColor);
        }
        if (targetI === 2) { // Queenside
          const rook = this.#getPieceAt(targetJ, 0);
          return rook?.getData('piece') === PIECE.ROOK &&
            rook?.getData('color') === color &&
            !rook?.getData('hasMoved') &&
            this.#getPieceAt(targetJ, 1) === null &&
            this.#getPieceAt(targetJ, 2) === null &&
            this.#getPieceAt(targetJ, 3) === null &&
            !this.#isSquareAttacked(currentJ, 4, enemyColor) &&
            !this.#isSquareAttacked(currentJ, 3, enemyColor) &&
            !this.#isSquareAttacked(currentJ, 2, enemyColor);
        }
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

  #movePiece(gameObject: Phaser.GameObjects.Image, targetJ: number, targetI: number, toggleTurn: boolean = true): void {
    const targetPiece = this.#getPieceAt(targetJ, targetI);
    const currentJ = gameObject.getData('j') as number;
    const pieceType = gameObject.getData('piece') as number;

    // Check for En Passant capture as well
    const isEnPassant = pieceType === PIECE.PAWN && Math.abs(targetI - (gameObject.getData('i') as number)) === 1 && !targetPiece;

    if (targetPiece || isEnPassant) {
      this.#pendingMove = { piece: gameObject, targetJ, targetI, toggleTurn };
      this.#challengeUI.setVisible(true);
      return;
    }

    this.#executeMove(gameObject, targetJ, targetI, toggleTurn);
  }

  #executeMove(gameObject: Phaser.GameObjects.Image, targetJ: number, targetI: number, toggleTurn: boolean = true): void {
    const pieceType = gameObject.getData('piece') as number;
    const currentI = gameObject.getData('i') as number;
    const currentJ = gameObject.getData('j') as number;

    const indexTile = gameObject.getData('indexTile') as number;
    const targetIndexTile = (targetJ * 8) + targetI;
    const targetPlace = this.#places[targetIndexTile];
    const currentPlace = this.#places[indexTile];

    // Last Move Highlight
    this.#lastMoveHighlight.clear();
    this.#lastMoveHighlight.fillStyle(0xffff00, 0.3);
    this.#lastMoveHighlight.fillRect(GRID_START_X + currentI * SQUARE_SIZE, GRID_START_Y + currentJ * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
    this.#lastMoveHighlight.fillRect(GRID_START_X + targetI * SQUARE_SIZE, GRID_START_Y + targetJ * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);

    const targetPiece = this.#getPieceAt(targetJ, targetI);
    if (targetPiece) {
      if (targetPiece.getData('piece') === PIECE.KING) {
        this.scene.start('GameOver');
        return;
      }
      targetPiece.destroy();
    }

    currentPlace.remove(gameObject);
    targetPlace.add(gameObject);
    gameObject.setPosition(0, 0);
    gameObject.setData({
      j: targetJ,
      i: targetI,
      indexTile: targetIndexTile,
      hasMoved: true
    });

    // Handle En Passant capture
    if (pieceType === PIECE.PAWN && Math.abs(targetI - currentI) === 1 && !targetPiece) {
      const capturedPawn = this.#getPieceAt(currentJ, targetI);
      if (capturedPawn) {
        if (capturedPawn.getData('piece') === PIECE.KING) {
          this.scene.start('GameOver');
          return;
        }
        capturedPawn.destroy();
      }
    }

    // Update En Passant state: only if this was a double pawn move
    if (pieceType === PIECE.PAWN && Math.abs(targetJ - currentJ) === 2) {
      this.#lastPawnDoubleMove = { j: targetJ, i: targetI };
    } else {
      this.#lastPawnDoubleMove = null;
    }

    // Handle Pawn Promotion
    let isPromoting = false;
    if (pieceType === PIECE.PAWN) {
      if ((gameObject.getData('color') === COLOR.WHITE && targetJ === 0) ||
        (gameObject.getData('color') === COLOR.BLACK && targetJ === 7)) {
        this.#pendingPromotion = gameObject;
        // Update icons in UI to match pawn color and correct piece type
        this.#promotionUI.list.forEach(obj => {
          if (obj instanceof Phaser.GameObjects.Image) {
            const pieceType = obj.getData('type') as number;
            obj.setTexture(gameObject.getData('color'), pieceType);
          }
        });
        this.#promotionUI.setVisible(true);
        isPromoting = true;
      }
    }

    // Handle Castling (King moves 2 spaces horizontally)
    if (pieceType === PIECE.KING && Math.abs(targetI - currentI) === 2) {
      if (targetI === 6) { // Kingside
        const rook = this.#getPieceAt(targetJ, 7);
        if (rook) this.#executeMove(rook, targetJ, 5, false);
      } else if (targetI === 2) { // Queenside
        const rook = this.#getPieceAt(targetJ, 0);
        if (rook) this.#executeMove(rook, targetJ, 3, false);
      }
    }

    if (toggleTurn && !isPromoting) {
      this.#currentTurn = this.#currentTurn === COLOR.WHITE ? COLOR.BLACK : COLOR.WHITE;
      this.#updateUI();
    }
  }

  #updateUI(): void {
    const turnName = this.#currentTurn === COLOR.WHITE ? "WHITE" : "BLACK";
    let status = `${turnName}'S TURN`;

    // Clear highlights
    this.#kingCheckHighlight.clear();

    // Check if current king is in check
    let kingJ = -1, kingI = -1;
    for (let j = 0; j < 8; j++) {
      for (let i = 0; i < 8; i++) {
        const p = this.#getPieceAt(j, i);
        if (p && p.getData('piece') === PIECE.KING && p.getData('color') === this.#currentTurn) {
          kingJ = j;
          kingI = i;
          break;
        }
      }
    }

    const enemyColor = this.#currentTurn === COLOR.WHITE ? COLOR.BLACK : COLOR.WHITE;
    if (kingJ !== -1 && this.#isSquareAttacked(kingJ, kingI, enemyColor)) {
      if (this.#isCheckmate(this.#currentTurn)) {
        this.scene.start('GameOver');
        return;
      }
      status = `CHECK! ${turnName}'S TURN`;
      this.msg_text.setColor('#ff0000');

      // Highlight king square
      this.#kingCheckHighlight.fillStyle(0xff0000, 0.4);
      this.#kingCheckHighlight.fillRect(GRID_START_X + kingI * SQUARE_SIZE, GRID_START_Y + kingJ * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
    } else {
      this.msg_text.setColor('#ffffff');
    }

    this.msg_text.setText(status);
  }

  #createChallengeUI(): void {
    const bg = this.add.rectangle(0, 0, 240, 160, 0x333333, 0.9).setStrokeStyle(2, 0xffffff);
    const title = this.add.text(0, -50, "CAPTURE CHALLENGE", { fontSize: '16px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    const sub = this.add.text(0, -20, "Concede capture?", { fontSize: '14px', color: '#cccccc' }).setOrigin(0.5);

    this.#challengeResultText = this.add.text(0, 10, "", { fontSize: '32px', color: '#ffff00', fontStyle: 'bold' }).setOrigin(0.5);

    const concedeBtn = this.add.rectangle(-60, 50, 80, 40, 0x00aa00).setInteractive();
    const concedeTxt = this.add.text(-60, 50, "YES", { color: '#ffffff' }).setOrigin(0.5);
    concedeBtn.on('pointerdown', () => this.#resolveCapture(true));

    const fightBtn = this.add.rectangle(60, 50, 80, 40, 0xaa0000).setInteractive();
    const fightTxt = this.add.text(60, 50, "FIGHT", { color: '#ffffff' }).setOrigin(0.5);
    fightBtn.on('pointerdown', () => this.#resolveCapture(false));

    this.#challengeUI = this.add.container(512, 384, [bg, title, sub, this.#challengeResultText, concedeBtn, concedeTxt, fightBtn, fightTxt]);
    this.#challengeUI.setDepth(100).setVisible(false);
  }

  #resolveCapture(concede: boolean): void {
    if (!this.#pendingMove) return;

    const { piece: attacker, targetJ, targetI, toggleTurn } = this.#pendingMove;
    const startJ = attacker.getData('j') as number;
    const startI = attacker.getData('i') as number;

    if (concede) {
      this.#challengeUI.setVisible(false);
      this.#executeMove(attacker, targetJ, targetI, toggleTurn);
      this.#pendingMove = null;
    } else {
      const win = Math.random() < 0.5 ? 0 : 1;
      this.#challengeResultText.setText(win.toString());

      // Add a small delay so player sees the number
      this.time.delayedCall(1000, () => {
        this.#challengeUI.setVisible(false);
        this.#challengeResultText.setText("");

        if (win === 1) {
          this.#executeMove(attacker, targetJ, targetI, toggleTurn);
        } else {
          // Lose: Attacker is destroyed, but defender stays in their original square
          if (attacker.getData('piece') === PIECE.KING) {
            this.scene.start('GameOver');
            return;
          }
          attacker.destroy();

          if (toggleTurn) {
            this.#currentTurn = this.#currentTurn === COLOR.WHITE ? COLOR.BLACK : COLOR.WHITE;
            this.#updateUI();
          }
        }
        this.#pendingMove = null;
      });
    }
  }

  #createPromotionUI(): void {
    const bg = this.add.rectangle(0, 0, 300, 100, 0x333333, 0.9).setStrokeStyle(2, 0xffffff);
    const title = this.add.text(0, -35, "CHOOSE PROMOTION", { fontSize: '14px', color: '#ffffff' }).setOrigin(0.5);

    const pieces = [PIECE.QUEEN, PIECE.ROOK, PIECE.BISHOP, PIECE.KNIGHT];
    const pieceObjects: (Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image | Phaser.GameObjects.Text)[] = [bg, title];

    pieces.forEach((type, idx) => {
      const x = -90 + (idx * 60);
      const btn = this.add.rectangle(x, 15, 50, 50, 0x444444).setInteractive();
      const icon = this.add.image(x, 15, COLOR.WHITE, type).setScale(2).setData('type', type);

      btn.on('pointerdown', () => this.#resolvePromotion(type));
      pieceObjects.push(btn, icon);
    });

    this.#promotionUI = this.add.container(512, 384, pieceObjects);
    this.#promotionUI.setDepth(100).setVisible(false);
  }

  #resolvePromotion(pieceType: number): void {
    if (!this.#pendingPromotion) return;

    this.#pendingPromotion.setData('piece', pieceType);
    this.#pendingPromotion.setFrame(pieceType);
    this.#pendingPromotion = null;
    this.#promotionUI.setVisible(false);

    this.#currentTurn = this.#currentTurn === COLOR.WHITE ? COLOR.BLACK : COLOR.WHITE;
    this.#updateUI();
  }

  #createDragEndEventListener(): void {
    this.input.on(
      Phaser.Input.Events.DRAG_END,
      (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image) => {
        if (gameObject !== this.#selectedPiece) return;
        const indexTile = gameObject.getData('indexTile') as number;
        this.#places[indexTile].setDepth(0);
        gameObject.setAlpha(1);

        const targetI = Math.floor((pointer.x - GRID_START_X) / SQUARE_SIZE);
        const targetJ = Math.floor((pointer.y - GRID_START_Y) / SQUARE_SIZE);

        if (this.#isValidMove(gameObject, targetJ, targetI)) {
          this.#movePiece(gameObject, targetJ, targetI);
          this.#clearHighlights();
          this.#selectedPiece = null;
        } else {
          gameObject.setPosition(gameObject.getData('x') as number, gameObject.getData('y') as number);
        }
      })
  }

}
