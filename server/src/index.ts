import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import path from 'path';

const PORT = Number(process.env.PORT) || 3001;
const isProduction = process.env.NODE_ENV === 'production';

const app = express();

// In production, serve the built client files
if (isProduction) {
  app.use(express.static(path.join(__dirname, '../../dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../../dist/index.html'));
  });
} else {
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
}

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// Matchmaking queue
const queue: Socket[] = [];

// Room -> { players: [socketId, socketId] }
const rooms = new Map<string, { players: [string, string]; gameState: string }>();

io.on('connection', (socket: Socket) => {
  console.log(`[connect] ${socket.id}`);

  socket.on('find_match', () => {
    console.log(`[find_match] ${socket.id}`);

    if (queue.length > 0) {
      // Pair with queued player
      const opponent = queue.shift()!;
      const roomId = `room_${socket.id}_${opponent.id}`;

      socket.join(roomId);
      opponent.join(roomId);

      rooms.set(roomId, { players: [socket.id, opponent.id], gameState: 'chess' });

      // Notify both players
      io.to(roomId).emit('match_found', {
        roomId,
        you: 0,
        opponent: 1,
        color: 'WHITE', // socket is WHITE
      });
      io.to(opponent.id).emit('match_found', {
        roomId,
        you: 1,
        opponent: 0,
        color: 'BLACK', // opponent is BLACK
      });

      console.log(`[match] ${roomId}: ${socket.id} (W) vs ${opponent.id} (B)`);
    } else {
      queue.push(socket);
      socket.emit('queue_status', { position: 1 });
      console.log(`[queue] ${socket.id} waiting`);
    }
  });

  socket.on('cancel_match', () => {
    const idx = queue.indexOf(socket);
    if (idx !== -1) queue.splice(idx, 1);
  });

  socket.on('chess_move', (data: { fromJ: number; fromI: number; toJ: number; toI: number; promotion?: number }) => {
    // Relay to opponent in the same room
    const room = findRoom(socket.id);
    if (room) {
      socket.to(room).emit('opponent_move', data);
    }
  });

  socket.on('fight_input', (data: { left: boolean; right: boolean; up: boolean; down: boolean; lp: boolean; mp: boolean; hp: boolean; lk: boolean; mk: boolean; hk: boolean }) => {
    const room = findRoom(socket.id);
    if (room) {
      socket.to(room).emit('opponent_input', data);
    }
  });

  socket.on('fight_start', (data: any) => {
    const room = findRoom(socket.id);
    if (room) {
      socket.to(room).emit('opponent_fight_start', data);
    }
  });

  socket.on('fight_over', (data: { winner: string }) => {
    const room = findRoom(socket.id);
    if (room) {
      io.to(room).emit('fight_result', data);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[disconnect] ${socket.id}`);
    const idx = queue.indexOf(socket);
    if (idx !== -1) queue.splice(idx, 1);

    const room = findRoom(socket.id);
    if (room) {
      socket.to(room).emit('opponent_disconnected');
      io.socketsLeave(room);
      rooms.delete(room);
    }
  });
});

function findRoom(socketId: string): string | null {
  for (const [roomId, data] of rooms) {
    if (data.players.includes(socketId)) return roomId;
  }
  return null;
}

httpServer.listen(PORT, () => {
  console.log(`[server] running on port ${PORT}`);
});
