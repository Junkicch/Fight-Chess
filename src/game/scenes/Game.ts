import { Scene } from 'phaser';
import { Piece, PieceType, PieceColor } from '../objects/Piece';
import { Board, BOARD_CONFIG } from '../objects/Board';

const DEBUG = false;

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  msg_text: Phaser.GameObjects.Text;
  boardImage: Phaser.GameObjects.Image;
  #board: Board;
  #selectedPiece: Piece | null = null;
  #lastPawnDoubleMove: { j: number, i: number } | null = null;
  #currentTurn: PieceColor = PieceColor.WHITE;
  #pendingMove: { piece: Piece, targetJ: number, targetI: number, toggleTurn: boolean } | null = null;
  #pendingPromotion: Piece | null = null;
  #challengeUI: Phaser.GameObjects.Container;
  #challengeResultText: Phaser.GameObjects.Text;
  #promotionUI: Phaser.GameObjects.Container;

  constructor() {
    super('Game');
  }

  create() {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0x0000ff);

    this.boardImage = this.add.image(BOARD_CONFIG.CENTER_X, BOARD_CONFIG.CENTER_Y, 'board');
    this.boardImage.setOrigin(0.5);

    this.#board = new Board(this);

    this.msg_text = this.add.text(BOARD_CONFIG.CENTER_X, 16, "WHITE'S TURN", {
      fontFamily: 'Arial Black', fontSize: 18, color: '#ffffff',
      stroke: '#000000', strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5);

    this.#setupInitialBoard();
    this.#createDragEvents();
    this.#createChallengeUI();
    this.#createPromotionUI();
    this.#updateUI();

    this.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
      if (this.#pendingMove || this.#pendingPromotion) return;
      if (pointer.leftButtonDown()) {
        const { j: targetJ, i: targetI } = this.#board.getGridCoords(pointer.x, pointer.y);

        if (this.#selectedPiece && this.#isValidMove(this.#selectedPiece, targetJ, targetI)) {
          this.#movePiece(this.#selectedPiece, targetJ, targetI);
          this.#board.clearHighlights();
          this.#selectedPiece = null;
          return;
        }

        const piece = this.#board.getPieceAt(targetJ, targetI);
        if (piece && piece.pieceColor === this.#currentTurn) {
          // If in check, restrict selection to the King piece for clicking
          let kingJ = -1, kingI = -1;
          for (let j = 0; j < 8; j++) {
            for (let i = 0; i < 8; i++) {
              const p = this.#board.getPieceAt(j, i);
              if (p && p.pieceType === PieceType.KING && p.pieceColor === this.#currentTurn) {
                kingJ = j; kingI = i; break;
              }
            }
          }
          const enemyColor = this.#currentTurn === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;
          const isInCheck = kingJ !== -1 && this.#isSquareAttacked(kingJ, kingI, enemyColor);

          if (isInCheck && piece.pieceType !== PieceType.KING) {
            return;
          }

          this.#selectedPiece = piece;
          this.#showValidMoves(piece);
        }
      }
    });
  }

  #createPiece(j: number, i: number, draggable: boolean): Piece | null {
    let color: PieceColor | null = null;
    let piece: PieceType | null = null;

    if (j == 1) {
      color = PieceColor.BLACK;
      piece = PieceType.PAWN;
    } else if (j == 6) {
      color = PieceColor.WHITE;
      piece = PieceType.PAWN;
    } else if (j == 0) {
      color = PieceColor.BLACK
      if (i == 0 || i == 7) piece = PieceType.ROOK;
      else if (i == 1 || i == 6) piece = PieceType.KNIGHT;
      else if (i == 2 || i == 5) piece = PieceType.BISHOP;
      else if (i == 3) piece = PieceType.QUEEN;
      else if (i == 4) piece = PieceType.KING;
    } else if (j == 7) {
      color = PieceColor.WHITE
      if (i == 0 || i == 7) piece = PieceType.ROOK;
      else if (i == 1 || i == 6) piece = PieceType.KNIGHT;
      else if (i == 2 || i == 5) piece = PieceType.BISHOP;
      else if (i == 3) piece = PieceType.QUEEN;
      else if (i == 4) piece = PieceType.KING;
    }

    if (piece !== null && color !== null) {
      const p = new Piece(this, j, i, piece, color);
      p.setInteractive({ draggable: draggable });
      return p;
    }
    return null;
  }

  #setupInitialBoard(): void {
    for (let j = 0; j <= 7; j++) {
      for (let i = 0; i <= 7; i++) {
        if (j < 2 || j > 5) {
          const piece = this.#createPiece(j, i, true);
          if (piece) this.#board.addPiece(piece, j, i, false);
        }
      }
    }
  }

  #showValidMoves(piece: Piece): void {
    this.#board.clearHighlights();
    const color = piece.pieceColor;
    for (let j = 0; j < 8; j++) {
      for (let i = 0; i < 8; i++) {
        if (this.#isValidMove(piece, j, i)) {
          const targetPiece = this.#board.getPieceAt(j, i);
          const highlightColor = (targetPiece && targetPiece.pieceColor !== color) ? 0xff0000 : 0x000000;
          this.#board.showMoveHighlight(j, i, highlightColor);
        }
      }
    }
  }

  #createDragEvents(): void {
    this.#createDragStartEventListener();
    this.#createDragEventListener();
    this.#createDragEndEventListener();
  }

  #createDragStartEventListener(): void {
    this.input.on(Phaser.Input.Events.DRAG_START, (pointer: Phaser.Input.Pointer, gameObject: Piece) => {
      if (this.#pendingMove || this.#pendingPromotion || gameObject.pieceColor !== this.#currentTurn) return;
      gameObject.setData({ x: gameObject.x, y: gameObject.y });
      this.#board.setPlaceDepth(gameObject.boardJ, gameObject.boardI, 2);
      gameObject.setAlpha(0.8);
      this.#selectedPiece = gameObject;
      this.#showValidMoves(gameObject);
    });
  }

  #createDragEventListener(): void {
    this.input.on(Phaser.Input.Events.DRAG, (pointer: Phaser.Input.Pointer, gameObject: Piece, dragX: number, dragY: number) => {
      if (gameObject !== this.#selectedPiece) return;
      gameObject.setPosition(dragX, dragY);
    });
  }

  #createDragEndEventListener(): void {
    this.input.on(Phaser.Input.Events.DRAG_END, (pointer: Phaser.Input.Pointer, gameObject: Piece) => {
      if (gameObject !== this.#selectedPiece) return;
      this.#board.setPlaceDepth(gameObject.boardJ, gameObject.boardI, 0);
      gameObject.setAlpha(1);

      const { j: targetJ, i: targetI } = this.#board.getGridCoords(pointer.x, pointer.y);

      if (this.#isValidMove(gameObject, targetJ, targetI)) {
        this.#movePiece(gameObject, targetJ, targetI);
        this.#board.clearHighlights();
        this.#selectedPiece = null;
      } else {
        gameObject.setPosition(gameObject.getData('x') as number, gameObject.getData('y') as number);
      }
    });
  }

  #isSquareAttacked(targetJ: number, targetI: number, attackerColor: PieceColor): boolean {
    for (let j = 0; j < 8; j++) {
      for (let i = 0; i < 8; i++) {
        const piece = this.#board.getPieceAt(j, i);
        if (piece && piece.pieceColor === attackerColor) {
          if (this.#isValidMove(piece, targetJ, targetI, true)) return true;
        }
      }
    }
    return false;
  }

  #isCheckmate(color: PieceColor): boolean {
    const enemyColor = color === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;
    let kingJ = -1, kingI = -1;
    for (let j = 0; j < 8; j++) {
      for (let i = 0; i < 8; i++) {
        const p = this.#board.getPieceAt(j, i);
        if (p && p.pieceType === PieceType.KING && p.pieceColor === color) {
          kingJ = j; kingI = i; break;
        }
      }
    }
    if (kingJ === -1 || !this.#isSquareAttacked(kingJ, kingI, enemyColor)) return false;

    for (let j = 0; j < 8; j++) {
      for (let i = 0; i < 8; i++) {
        const p = this.#board.getPieceAt(j, i);
        if (p && p.pieceColor === color) {
          for (let tj = 0; tj < 8; tj++) {
            for (let ti = 0; ti < 8; ti++) {
              if (this.#isValidMove(p, tj, ti)) {
                const targetPiece = this.#board.getPieceAt(tj, ti);
                const oj = p.boardJ, oi = p.boardI;
                
                // Simulação
                p.boardJ = tj; p.boardI = ti;
                if (targetPiece) targetPiece.setData('isCapturedSim', true);
                
                let kj = kingJ, ki = kingI;
                if (p.pieceType === PieceType.KING) { kj = tj; ki = ti; }
                
                const stillInCheck = this.#isSquareAttacked(kj, ki, enemyColor);
                
                // Reverter
                p.boardJ = oj; p.boardI = oi;
                if (targetPiece) targetPiece.setData('isCapturedSim', false);
                
                if (!stillInCheck) return false;
              }
            }
          }
        }
      }
    }
    return true;
  }

  #isValidMove(piece: Piece, targetJ: number, targetI: number, ignoreCheck: boolean = false): boolean {
    if (targetJ < 0 || targetJ > 7 || targetI < 0 || targetI > 7) return false;
    const pieceType = piece.pieceType, currentJ = piece.boardJ, currentI = piece.boardI, color = piece.pieceColor;
    const direction = color === PieceColor.WHITE ? -1 : 1;

    if (pieceType === PieceType.PAWN) {
      if (targetI === currentI && targetJ === currentJ + direction) return !ignoreCheck && this.#board.getPieceAt(targetJ, targetI) === null;
      if (!piece.hasMoved && targetI === currentI && targetJ === currentJ + 2 * direction) {
        return !ignoreCheck && this.#board.getPieceAt(currentJ + direction, currentI) === null && this.#board.getPieceAt(targetJ, targetI) === null;
      }
      if (Math.abs(targetI - currentI) === 1 && targetJ === currentJ + direction) {
        const targetPiece = this.#board.getPieceAt(targetJ, targetI);
        if (targetPiece) return targetPiece.pieceColor !== color;
        if (!ignoreCheck && this.#lastPawnDoubleMove && this.#lastPawnDoubleMove.j === currentJ && this.#lastPawnDoubleMove.i === targetI) return true;
        if (ignoreCheck) return true;
      }
      return false;
    }

    if (pieceType === PieceType.KING) {
      const rowDiff = Math.abs(targetJ - currentJ), colDiff = Math.abs(targetI - currentI);
      if (rowDiff <= 1 && colDiff <= 1 && (rowDiff > 0 || colDiff > 0)) {
        const tp = this.#board.getPieceAt(targetJ, targetI);
        return tp === null || tp.pieceColor !== color;
      }
      if (!ignoreCheck && !piece.hasMoved && targetJ === currentJ && currentI === 4) {
        const enemyColor = color === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;
        if (targetI === 6) {
          const rook = this.#board.getPieceAt(targetJ, 7);
          return rook?.pieceType === PieceType.ROOK && !rook.hasMoved && this.#board.getPieceAt(targetJ, 5) === null && this.#board.getPieceAt(targetJ, 6) === null && !this.#isSquareAttacked(currentJ, 4, enemyColor) && !this.#isSquareAttacked(currentJ, 5, enemyColor) && !this.#isSquareAttacked(currentJ, 6, enemyColor);
        }
        if (targetI === 2) {
          const rook = this.#board.getPieceAt(targetJ, 0);
          return rook?.pieceType === PieceType.ROOK && !rook.hasMoved && this.#board.getPieceAt(targetJ, 1) === null && this.#board.getPieceAt(targetJ, 2) === null && this.#board.getPieceAt(targetJ, 3) === null && !this.#isSquareAttacked(currentJ, 4, enemyColor) && !this.#isSquareAttacked(currentJ, 3, enemyColor) && !this.#isSquareAttacked(currentJ, 2, enemyColor);
        }
      }
    }

    if (pieceType === PieceType.ROOK || pieceType === PieceType.QUEEN || pieceType === PieceType.BISHOP) {
      const isRookMove = (targetI === currentI || targetJ === currentJ);
      const isBishopMove = (Math.abs(targetI - currentI) === Math.abs(targetJ - currentJ));
      if (pieceType === PieceType.ROOK && !isRookMove) return false;
      if (pieceType === PieceType.BISHOP && !isBishopMove) return false;
      if (pieceType === PieceType.QUEEN && !isRookMove && !isBishopMove) return false;

      const stepI = targetI === currentI ? 0 : (targetI > currentI ? 1 : -1);
      const stepJ = targetJ === currentJ ? 0 : (targetJ > currentJ ? 1 : -1);
      let ci = currentI + stepI, cj = currentJ + stepJ;
      while (ci != targetI || cj != targetJ) {
        if (this.#board.getPieceAt(cj, ci) !== null) return false;
        ci += stepI; cj += stepJ;
      }
      const tp = this.#board.getPieceAt(targetJ, targetI);
      return tp === null || tp.pieceColor !== color;
    }

    if (pieceType === PieceType.KNIGHT) {
      const rd = Math.abs(targetJ - currentJ), cd = Math.abs(targetI - currentI);
      if ((rd === 2 && cd === 1) || (rd === 1 && cd === 2)) {
        const tp = this.#board.getPieceAt(targetJ, targetI);
        return tp === null || tp.pieceColor !== color;
      }
    }
    return false;
  }

  #movePiece(piece: Piece, targetJ: number, targetI: number, toggleTurn: boolean = true): void {
    const targetPiece = this.#board.getPieceAt(targetJ, targetI);
    const isEnPassant = piece.pieceType === PieceType.PAWN && Math.abs(targetI - piece.boardI) === 1 && !targetPiece;
    if (targetPiece || isEnPassant) {
      this.#pendingMove = { piece, targetJ, targetI, toggleTurn };
      this.#challengeUI.setVisible(true);
      return;
    }
    this.#executeMove(piece, targetJ, targetI, toggleTurn);
  }

  #executeMove(piece: Piece, targetJ: number, targetI: number, toggleTurn: boolean = true): void {
    const pieceType = piece.pieceType, ci = piece.boardI, cj = piece.boardJ;
    this.#board.lastMoveHighlight.clear().fillStyle(0xffff00, 0.3);
    const startW = this.#board.getWorldCoords(cj, ci), targetW = this.#board.getWorldCoords(targetJ, targetI);
    this.#board.lastMoveHighlight.fillRect(startW.x, startW.y, BOARD_CONFIG.SQUARE_SIZE, BOARD_CONFIG.SQUARE_SIZE);
    this.#board.lastMoveHighlight.fillRect(targetW.x, targetW.y, BOARD_CONFIG.SQUARE_SIZE, BOARD_CONFIG.SQUARE_SIZE);

    const targetPiece = this.#board.getPieceAt(targetJ, targetI);
    if (targetPiece) {
      if (targetPiece.pieceType === PieceType.KING) { this.scene.start('GameOver'); return; }
      targetPiece.destroy();
    }

    this.#board.removePiece(piece);
    this.#board.addPiece(piece, targetJ, targetI);

    if (pieceType === PieceType.PAWN && Math.abs(targetI - ci) === 1 && !targetPiece) {
      const capturedPawn = this.#board.getPieceAt(cj, targetI);
      if (capturedPawn) {
        if (capturedPawn.pieceType === PieceType.KING) { this.scene.start('GameOver'); return; }
        capturedPawn.destroy();
      }
    }

    this.#lastPawnDoubleMove = (pieceType === PieceType.PAWN && Math.abs(targetJ - cj) === 2) ? { j: targetJ, i: targetI } : null;

    let isPromoting = false;
    if (pieceType === PieceType.PAWN && ((piece.pieceColor === PieceColor.WHITE && targetJ === 0) || (piece.pieceColor === PieceColor.BLACK && targetJ === 7))) {
      this.#pendingPromotion = piece;
      this.#promotionUI.list.forEach(obj => { if (obj instanceof Phaser.GameObjects.Image) obj.setTexture(piece.pieceColor, obj.getData('type')); });
      this.#promotionUI.setVisible(true);
      isPromoting = true;
    }

    if (pieceType === PieceType.KING && Math.abs(targetI - ci) === 2) {
      if (targetI === 6) { const r = this.#board.getPieceAt(targetJ, 7); if (r) this.#executeMove(r, targetJ, 5, false); }
      else if (targetI === 2) { const r = this.#board.getPieceAt(targetJ, 0); if (r) this.#executeMove(r, targetJ, 3, false); }
    }

    if (toggleTurn && !isPromoting) {
      this.#currentTurn = this.#currentTurn === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;
      this.#updateUI();
    }
  }

  #updateUI(): void {
    const turnName = this.#currentTurn === PieceColor.WHITE ? "WHITE" : "BLACK";
    this.#board.kingCheckHighlight.clear();
    let kj = -1, ki = -1;
    for (let j = 0; j < 8; j++) {
      for (let i = 0; i < 8; i++) {
        const p = this.#board.getPieceAt(j, i);
        if (p && p.pieceType === PieceType.KING && p.pieceColor === this.#currentTurn) { kj = j; ki = i; break; }
      }
    }
    const enemyColor = this.#currentTurn === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;
    if (kj !== -1 && this.#isSquareAttacked(kj, ki, enemyColor)) {
      if (this.#isCheckmate(this.#currentTurn)) { this.scene.start('GameOver'); return; }
      this.msg_text.setColor('#ff0000').setText(`CHECK! ${turnName}'S TURN`);
      const world = this.#board.getWorldCoords(kj, ki);
      this.#board.kingCheckHighlight.fillStyle(0xff0000, 0.4).fillRect(world.x, world.y, BOARD_CONFIG.SQUARE_SIZE, BOARD_CONFIG.SQUARE_SIZE);
    } else {
      this.msg_text.setColor('#ffffff').setText(`${turnName}'S TURN`);
    }
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
    this.#challengeUI = this.add.container(512, 384, [bg, title, sub, this.#challengeResultText, concedeBtn, concedeTxt, fightBtn, fightTxt]).setDepth(100).setVisible(false);
  }

  #resolveCapture(concede: boolean): void {
    if (!this.#pendingMove) return;
    const { piece: attacker, targetJ, targetI, toggleTurn } = this.#pendingMove;
    if (concede) { this.#challengeUI.setVisible(false); this.#executeMove(attacker, targetJ, targetI, toggleTurn); this.#pendingMove = null; }
    else {
      const win = Math.random() < 0.5 ? 0 : 1;
      this.#challengeResultText.setText(win.toString());
      this.time.delayedCall(1000, () => {
        this.#challengeUI.setVisible(false); this.#challengeResultText.setText("");
        if (win === 1) this.#executeMove(attacker, targetJ, targetI, toggleTurn);
        else {
          if (attacker.pieceType === PieceType.KING) { this.scene.start('GameOver'); return; }
          attacker.destroy();
          if (toggleTurn) { this.#currentTurn = this.#currentTurn === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE; this.#updateUI(); }
        }
        this.#pendingMove = null;
      });
    }
  }

  #createPromotionUI(): void {
    const bg = this.add.rectangle(0, 0, 300, 100, 0x333333, 0.9).setStrokeStyle(2, 0xffffff);
    const title = this.add.text(0, -35, "CHOOSE PROMOTION", { fontSize: '14px', color: '#ffffff' }).setOrigin(0.5);
    const pieces = [PieceType.QUEEN, PieceType.ROOK, PieceType.BISHOP, PieceType.KNIGHT];
    const pieceObjects: (Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image | Phaser.GameObjects.Text)[] = [bg, title];
    pieces.forEach((type, idx) => {
      const x = -90 + (idx * 60);
      const btn = this.add.rectangle(x, 15, 50, 50, 0x444444).setInteractive();
      const icon = this.add.image(x, 15, PieceColor.WHITE, type).setScale(2).setData('type', type);
      btn.on('pointerdown', () => this.#resolvePromotion(type));
      pieceObjects.push(btn, icon);
    });
    this.#promotionUI = this.add.container(512, 384, pieceObjects).setDepth(100).setVisible(false);
  }

  #resolvePromotion(pieceType: PieceType): void {
    if (!this.#pendingPromotion) return;
    this.#pendingPromotion.pieceType = pieceType;
    this.#pendingPromotion.setFrame(pieceType);
    this.#pendingPromotion.setData('piece', pieceType);
    this.#pendingPromotion = null;
    this.#promotionUI.setVisible(false);
    this.#currentTurn = this.#currentTurn === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;
    this.#updateUI();
  }
}
