import { io, Socket } from 'socket.io-client';

export interface InputState {
  left: boolean; right: boolean; up: boolean; down: boolean;
  lp: boolean; mp: boolean; hp: boolean;
  lk: boolean; mk: boolean; hk: boolean;
}

export interface ChessMove {
  fromJ: number; fromI: number;
  toJ: number; toI: number;
  promotion?: number;
}

// Change this to your Render server URL after deployment
const PRODUCTION_SERVER_URL = 'https://fight-chess-server.onrender.com';

export type NetworkCallback = {
  onMatchFound: (data: { roomId: string; you: number; opponent: number; color: string }) => void;
  onQueueStatus: (data: { position: number }) => void;
  onOpponentMove: (data: ChessMove) => void;
  onOpponentInput: (data: InputState) => void;
  onOpponentFightStart: (data: any) => void;
  onFightResult: (data: { winner: string }) => void;
  onOpponentDisconnected: () => void;
  onError: (msg: string) => void;
};

export class NetworkManager {
  private socket: Socket | null = null;
  private callbacks: NetworkCallback | null = null;
  public connected: boolean = false;
  public inRoom: boolean = false;
  public playerIndex: number = 0;

  connect(serverUrl?: string) {
    if (this.socket?.connected) return;

    if (!serverUrl) {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      serverUrl = isLocalhost ? 'http://localhost:3001' : PRODUCTION_SERVER_URL;
    }

    this.socket = io(serverUrl);

    this.socket.on('connect', () => {
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      this.inRoom = false;
      this.callbacks?.onError('Disconnected from server');
    });

    this.socket.on('match_found', (data) => {
      this.inRoom = true;
      this.playerIndex = data.you;
      this.callbacks?.onMatchFound(data);
    });

    this.socket.on('queue_status', (data) => {
      this.callbacks?.onQueueStatus(data);
    });

    this.socket.on('opponent_move', (data) => {
      this.callbacks?.onOpponentMove(data);
    });

    this.socket.on('opponent_input', (data) => {
      this.callbacks?.onOpponentInput(data);
    });

    this.socket.on('opponent_fight_start', (data) => {
      this.callbacks?.onOpponentFightStart(data);
    });

    this.socket.on('fight_result', (data) => {
      this.callbacks?.onFightResult(data);
    });

    this.socket.on('opponent_disconnected', () => {
      this.callbacks?.onOpponentDisconnected();
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.connected = false;
    this.inRoom = false;
  }

  setCallbacks(cb: NetworkCallback) {
    this.callbacks = cb;
  }

  findMatch() {
    this.socket?.emit('find_match');
  }

  cancelMatch() {
    this.socket?.emit('cancel_match');
  }

  sendChessMove(move: ChessMove) {
    this.socket?.emit('chess_move', move);
  }

  sendFightInput(input: InputState) {
    this.socket?.emit('fight_input', input);
  }

  sendFightStart(data: any) {
    this.socket?.emit('fight_start', data);
  }

  sendFightOver(winner: string) {
    this.socket?.emit('fight_over', { winner });
  }
}

export const network = new NetworkManager();
