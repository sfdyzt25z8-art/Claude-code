import Phaser from 'phaser';
import { SceneKeys } from './SceneKeys';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/Constants';
import { FONT } from '../ui/Theme';
import { Button } from '../ui/Button';
import { drawPanel } from '../ui/Panel';
import { ScrollList } from '../ui/ScrollList';
import { addSceneChrome } from '../ui/SceneChrome';
import { createNetworkClient } from '../multiplayer/MockMultiplayerClient';
import type { NetworkClient, RoomInfo } from '../multiplayer/NetworkTypes';
import type { RaceMode } from '../engine/RaceTypes';
import { saveManager } from '../save/SaveManager';
import { getTrackById } from '../tracks/TrackData';
import { audioManager } from '../audio/AudioManager';
import { settingsManager } from '../save/SettingsManager';

const QUICK_CHAT = ['GG!', 'Good luck!', 'Nice one!', '😂', 'Close race!'];
const ROOM_MODE_TO_RACE_MODE: Record<RoomInfo['mode'], RaceMode> = {
  quickRace: 'quickRace', elimination: 'elimination', tournament: 'tournament', driftBattle: 'drift',
};

export class MultiplayerScene extends Phaser.Scene {
  private client: NetworkClient = createNetworkClient();
  private status = 'Connecting…';
  private rooms: RoomInfo[] = [];
  private currentRoom: RoomInfo | null = null;
  private chatLog: string[] = [];
  private body: Phaser.GameObjects.GameObject[] = [];
  private unsubscribers: (() => void)[] = [];

  constructor() {
    super(SceneKeys.Multiplayer);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.bgDark);
    addSceneChrome(this, 'Multiplayer', () => this.leaveAndExit());
    this.client = createNetworkClient();
    this.currentRoom = null;
    this.chatLog = [];

    this.unsubscribers = [
      this.client.on('room-updated', (room) => {
        this.currentRoom = room;
        this.render();
      }),
      this.client.on('race-started', () => this.launchRace()),
      this.client.on('chat-message', (msg) => {
        this.chatLog.push(`${msg.displayName}: ${msg.text}`);
        if (this.chatLog.length > 6) this.chatLog.shift();
        this.render();
      }),
    ];

    this.status = 'Connecting…';
    this.render();
    void this.client.connect(saveManager.getState().profile.name || 'Racer').then(async () => {
      this.status = 'Connected';
      this.rooms = await this.client.listRooms();
      this.render();
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unsubscribers.forEach((u) => u()));
  }

  private render(): void {
    this.body.forEach((o) => o.destroy());
    this.body = [];

    if (!this.currentRoom) this.renderLobbyList();
    else this.renderRoom(this.currentRoom);
  }

  private add_(o: Phaser.GameObjects.GameObject): void {
    this.body.push(o);
  }

  private renderLobbyList(): void {
    this.add_(this.add.text(GAME_WIDTH / 2, 96, this.status, FONT.small).setOrigin(0.5));

    const list = new ScrollList(this, 60, 120, GAME_WIDTH - 120, GAME_HEIGHT - 220);
    this.add_(list);
    let y = 0;
    for (const room of this.rooms) {
      const panel = drawPanel(this, 0, y, GAME_WIDTH - 200, 90, { alpha: 0.55 });
      list.content.add(panel);
      const track = getTrackById(room.trackId);
      list.content.add(this.add.text(20, y + 14, room.name, FONT.h3));
      list.content.add(this.add.text(20, y + 46, `${track?.name ?? 'Random'} · ${room.mode} · ${room.players.length}/${room.maxPlayers} players`, FONT.small));
      const joinBtn = new Button(this, GAME_WIDTH - 340, y + 45, 'Join', () => this.joinRoom(room.roomId), { width: 160, height: 50 });
      list.content.add(joinBtn);
      y += 100;
    }
    list.setContentHeight(y);

    const createBtn = new Button(this, GAME_WIDTH / 2, GAME_HEIGHT - 60, 'Create Quick Room', () => this.createRoom(), { width: 320, height: 54 });
    this.add_(createBtn);
  }

  private async joinRoom(roomId: string): Promise<void> {
    audioManager.uiConfirm();
    this.currentRoom = await this.client.joinRoom(roomId);
    this.render();
  }

  private async createRoom(): Promise<void> {
    audioManager.uiConfirm();
    const trackId = saveManager.getState().selectedTrackId;
    this.currentRoom = await this.client.createRoom(`${saveManager.getState().profile.name}'s Room`, trackId, 'quickRace', 8);
    this.render();
  }

  private renderRoom(room: RoomInfo): void {
    this.add_(this.add.text(GAME_WIDTH / 2, 100, room.name, FONT.h2).setOrigin(0.5));
    const track = getTrackById(room.trackId);
    this.add_(this.add.text(GAME_WIDTH / 2, 136, `${track?.name ?? 'Random'} · ${room.mode} · ${room.status.toUpperCase()}`, FONT.small).setOrigin(0.5));

    const panel = drawPanel(this, 60, 170, GAME_WIDTH - 120, 260, { alpha: 0.55 });
    this.add_(panel);
    room.players.forEach((p, i) => {
      const y = 190 + i * 32;
      this.add_(this.add.text(90, y, p.displayName, FONT.body));
      this.add_(this.add.text(GAME_WIDTH - 200, y, p.ready ? '✓ Ready' : 'Not Ready', { ...FONT.body, color: p.ready ? '#38ef7d' : '#8fa0c8' }));
    });

    const me = room.players.find((p) => p.playerId === this.client.playerId);
    const readyBtn = new Button(this, GAME_WIDTH / 2 - 170, GAME_HEIGHT - 130, me?.ready ? 'Cancel Ready' : 'Ready Up', () => {
      this.client.setReady(!me?.ready);
    }, { width: 260, height: 52, disabled: room.status !== 'lobby', variant: me?.ready ? 'secondary' : 'primary' });
    this.add_(readyBtn);

    const leaveBtn = new Button(this, GAME_WIDTH / 2 + 170, GAME_HEIGHT - 130, 'Leave Room', () => {
      this.client.leaveRoom();
      this.currentRoom = null;
      this.render();
    }, { width: 260, height: 52, variant: 'danger' });
    this.add_(leaveBtn);

    if (room.status === 'countdown') {
      this.add_(this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 170, 'Race starting…', { ...FONT.h3, color: '#ffc371' }).setOrigin(0.5));
    }

    const chatY = GAME_HEIGHT - 90;
    this.chatLog.forEach((line, i) => {
      this.add_(this.add.text(60, chatY - (this.chatLog.length - i) * 20, line, FONT.small));
    });
    QUICK_CHAT.forEach((msg, i) => {
      const btn = new Button(this, GAME_WIDTH - 560 + i * 115, chatY + 20, msg, () => this.client.sendChat(msg), { width: 106, height: 34, variant: 'ghost', textStyle: { ...FONT.small, fontSize: '13px' } });
      this.add_(btn);
    });
  }

  private launchRace(): void {
    if (!this.currentRoom) return;
    const room = this.currentRoom;
    const mode = ROOM_MODE_TO_RACE_MODE[room.mode];
    this.scene.start(SceneKeys.Race3D, {
      config: {
        mode,
        trackId: room.trackId,
        carId: saveManager.getState().garage.selectedCarId,
        difficulty: settingsManager.get().defaultDifficulty,
        opponentCount: Math.max(1, room.players.length - 1),
      },
    });
  }

  private leaveAndExit(): void {
    this.client.leaveRoom();
    this.client.disconnect();
    this.scene.start(SceneKeys.MainMenu);
  }
}
