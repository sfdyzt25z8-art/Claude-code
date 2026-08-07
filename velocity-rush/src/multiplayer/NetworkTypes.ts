/**
 * Transport-agnostic contract for online multiplayer. A real backend
 * (WebSocket relay, WebRTC mesh, dedicated server) implements this same
 * interface — every other system (RaceScene, lobby UI) is written against
 * `NetworkClient` only, so swapping `MockMultiplayerClient` for a real
 * implementation later is a one-line change in `createNetworkClient()`.
 */

export interface PlayerSnapshot {
  playerId: string;
  displayName: string;
  carId: string;
  position: { x: number; y: number };
  heading: number;
  speed: number;
  lap: number;
  progress: number; // 0-1 around current lap
  finished: boolean;
  finishTimeMs: number | null;
}

export interface RoomInfo {
  roomId: string;
  name: string;
  trackId: string;
  mode: 'quickRace' | 'elimination' | 'tournament' | 'driftBattle';
  maxPlayers: number;
  players: { playerId: string; displayName: string; ready: boolean }[];
  status: 'lobby' | 'countdown' | 'racing' | 'finished';
}

export type NetworkEventMap = {
  connected: { playerId: string };
  disconnected: { reason: string };
  'room-updated': RoomInfo;
  'race-started': { roomId: string; startTimeMs: number };
  'snapshot': { snapshots: PlayerSnapshot[] };
  'chat-message': { playerId: string; displayName: string; text: string };
  'player-joined': { playerId: string; displayName: string };
  'player-left': { playerId: string };
  'latency-updated': { pingMs: number };
};

export type NetworkEventName = keyof NetworkEventMap;
export type NetworkListener<K extends NetworkEventName> = (payload: NetworkEventMap[K]) => void;

export interface NetworkClient {
  readonly isConnected: boolean;
  readonly playerId: string | null;

  connect(displayName: string): Promise<void>;
  disconnect(): void;

  listRooms(): Promise<RoomInfo[]>;
  createRoom(name: string, trackId: string, mode: RoomInfo['mode'], maxPlayers: number): Promise<RoomInfo>;
  joinRoom(roomId: string): Promise<RoomInfo>;
  leaveRoom(): void;
  setReady(ready: boolean): void;

  sendInput(snapshot: Pick<PlayerSnapshot, 'position' | 'heading' | 'speed' | 'lap' | 'progress' | 'finished'>): void;
  sendChat(text: string): void;

  on<K extends NetworkEventName>(event: K, listener: NetworkListener<K>): () => void;
}
