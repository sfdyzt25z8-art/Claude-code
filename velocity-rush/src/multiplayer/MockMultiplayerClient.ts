import type {
  NetworkClient, NetworkEventMap, NetworkEventName, NetworkListener, PlayerSnapshot, RoomInfo,
} from './NetworkTypes';

const BOT_NAMES = ['Nova', 'Rex', 'Ghost', 'Vega', 'Blitz', 'Kestrel', 'Onyx', 'Piston', 'Static', 'Ricochet'];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Local, in-process stand-in for a real multiplayer backend. It implements
 * the full `NetworkClient` contract — rooms, readying up, countdown, live
 * position snapshots, chat — using bot-filled rooms and a simulated race
 * loop instead of a real relay server, so the online-multiplayer UI and
 * race-sync code paths are fully exercised today. Replacing this with a
 * WebSocket/WebRTC client later requires no changes outside this file.
 */
export class MockMultiplayerClient implements NetworkClient {
  isConnected = false;
  playerId: string | null = null;
  private displayName = 'Racer';

  private rooms: RoomInfo[] = [];
  private currentRoom: RoomInfo | null = null;
  private botSnapshots = new Map<string, PlayerSnapshot>();
  private selfSnapshot: PlayerSnapshot | null = null;
  private snapshotLoop: number | null = null;
  private listeners: { [K in NetworkEventName]?: Set<NetworkListener<K>> } = {};

  constructor() {
    this.seedRooms();
  }

  private seedRooms(): void {
    const tracks = ['city_circuit', 'neon_district', 'desert_dunes', 'sunset_beach'];
    this.rooms = Array.from({ length: 4 }).map((_, i) => ({
      roomId: randomId(),
      name: `${['Midnight', 'Rookie', 'Pro', 'Casual'][i]} Lobby`,
      trackId: tracks[i % tracks.length],
      mode: (['quickRace', 'elimination', 'driftBattle', 'quickRace'] as const)[i % 4],
      maxPlayers: 8,
      players: Array.from({ length: 1 + Math.floor(Math.random() * 4) }).map(() => ({
        playerId: randomId(),
        displayName: BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)],
        ready: Math.random() > 0.4,
      })),
      status: 'lobby',
    }));
  }

  async connect(displayName: string): Promise<void> {
    await delay(280 + Math.random() * 200);
    this.displayName = displayName || 'Racer';
    this.playerId = `local-${randomId()}`;
    this.isConnected = true;
    this.emit('connected', { playerId: this.playerId });
  }

  disconnect(): void {
    this.isConnected = false;
    this.leaveRoom();
    this.playerId = null;
    this.emit('disconnected', { reason: 'client requested disconnect' });
  }

  async listRooms(): Promise<RoomInfo[]> {
    await delay(150 + Math.random() * 150);
    return this.rooms.map((r) => ({ ...r, players: [...r.players] }));
  }

  async createRoom(name: string, trackId: string, mode: RoomInfo['mode'], maxPlayers: number): Promise<RoomInfo> {
    await delay(200);
    if (!this.playerId) throw new Error('Not connected');
    const room: RoomInfo = {
      roomId: randomId(),
      name,
      trackId,
      mode,
      maxPlayers,
      players: [{ playerId: this.playerId, displayName: this.displayName, ready: false }],
      status: 'lobby',
    };
    this.rooms.unshift(room);
    this.currentRoom = room;
    this.emit('room-updated', room);
    return room;
  }

  async joinRoom(roomId: string): Promise<RoomInfo> {
    await delay(220);
    if (!this.playerId) throw new Error('Not connected');
    const room = this.rooms.find((r) => r.roomId === roomId);
    if (!room) throw new Error('Room not found');
    if (!room.players.some((p) => p.playerId === this.playerId)) {
      room.players.push({ playerId: this.playerId, displayName: this.displayName, ready: false });
    }
    // Fill remaining slots with bots so a race can actually start solo.
    while (room.players.length < Math.min(room.maxPlayers, 6)) {
      room.players.push({
        playerId: randomId(),
        displayName: BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)],
        ready: true,
      });
    }
    this.currentRoom = room;
    this.emit('room-updated', { ...room });
    return room;
  }

  leaveRoom(): void {
    if (!this.currentRoom) return;
    this.currentRoom.players = this.currentRoom.players.filter((p) => p.playerId !== this.playerId);
    this.stopSnapshotLoop();
    this.currentRoom = null;
  }

  setReady(ready: boolean): void {
    if (!this.currentRoom || !this.playerId) return;
    const me = this.currentRoom.players.find((p) => p.playerId === this.playerId);
    if (me) me.ready = ready;
    this.emit('room-updated', { ...this.currentRoom });

    if (ready && this.currentRoom.players.every((p) => p.ready)) {
      this.currentRoom.status = 'countdown';
      this.emit('room-updated', { ...this.currentRoom });
      window.setTimeout(() => this.beginRace(), 1500);
    }
  }

  private beginRace(): void {
    if (!this.currentRoom) return;
    this.currentRoom.status = 'racing';
    const startTimeMs = Date.now();
    this.botSnapshots.clear();
    for (const p of this.currentRoom.players) {
      if (p.playerId === this.playerId) continue;
      this.botSnapshots.set(p.playerId, {
        playerId: p.playerId, displayName: p.displayName, carId: 'nomad_runner',
        position: { x: 0, y: 0 }, heading: 0, speed: 0, lap: 1, progress: 0, finished: false, finishTimeMs: null,
      });
    }
    this.emit('race-started', { roomId: this.currentRoom.roomId, startTimeMs });
    this.startSnapshotLoop();
  }

  private startSnapshotLoop(): void {
    this.stopSnapshotLoop();
    this.snapshotLoop = window.setInterval(() => {
      // Simulate bot progress so remote-player ghosts move plausibly.
      for (const bot of this.botSnapshots.values()) {
        if (bot.finished) continue;
        bot.progress += 0.004 + Math.random() * 0.01;
        bot.speed = 220 + Math.random() * 260;
        if (bot.progress >= 1) {
          bot.progress = 0;
          bot.lap += 1;
          if (bot.lap > 3) {
            bot.finished = true;
            bot.finishTimeMs = Date.now();
          }
        }
      }
      const snapshots = [...this.botSnapshots.values()];
      if (this.selfSnapshot) snapshots.push(this.selfSnapshot);
      this.emit('snapshot', { snapshots });
      this.emit('latency-updated', { pingMs: Math.round(20 + Math.random() * 60) });
    }, 100);
  }

  private stopSnapshotLoop(): void {
    if (this.snapshotLoop !== null) {
      window.clearInterval(this.snapshotLoop);
      this.snapshotLoop = null;
    }
  }

  sendInput(snapshot: Pick<PlayerSnapshot, 'position' | 'heading' | 'speed' | 'lap' | 'progress' | 'finished'>): void {
    if (!this.playerId) return;
    this.selfSnapshot = {
      playerId: this.playerId,
      displayName: this.displayName,
      carId: 'nomad_runner',
      finishTimeMs: null,
      ...snapshot,
    };
  }

  sendChat(text: string): void {
    if (!this.playerId) return;
    this.emit('chat-message', { playerId: this.playerId, displayName: this.displayName, text });
  }

  on<K extends NetworkEventName>(event: K, listener: NetworkListener<K>): () => void {
    const bucket = (this.listeners as Record<string, Set<NetworkListener<K>>>);
    if (!bucket[event]) bucket[event] = new Set();
    bucket[event].add(listener);
    return () => bucket[event]?.delete(listener);
  }

  private emit<K extends NetworkEventName>(event: K, payload: NetworkEventMap[K]): void {
    const bucket = (this.listeners as Record<string, Set<NetworkListener<K>>>);
    bucket[event]?.forEach((l) => l(payload));
  }
}

/** Factory boundary: swap this for a real backend-backed client without touching callers. */
export function createNetworkClient(): NetworkClient {
  return new MockMultiplayerClient();
}
