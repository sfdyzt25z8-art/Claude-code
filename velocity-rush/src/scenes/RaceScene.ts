import Phaser from 'phaser';
import { SceneKeys } from './SceneKeys';
import { DEPTHS, DIFFICULTY_SETTINGS } from '../utils/Constants';
import type { WeatherType } from '../utils/Constants';
import { FONT } from '../ui/Theme';
import { Button } from '../ui/Button';
import { drawPanel } from '../ui/Panel';
import { RaceHUD } from '../ui/RaceHUD';
import { InputManager } from '../ui/InputManager';
import { buildCarVisual } from '../ui/CarPreview';
import { TEX } from '../assets/ProceduralTextures';
import { getTrackById } from '../tracks/TrackData';
import { TrackGeometry } from '../tracks/TrackGeometry';
import { TrackRenderer, type BuiltTrack } from '../tracks/TrackRenderer';
import { CAR_DATA, getCarById } from '../cars/CarData';
import { getCarPerformance } from '../cars/CarPerformance';
import { createVehicleState, updateVehicle, getSpeedKmh, type VehicleState } from '../physics/VehiclePhysics';
import { CollisionSystem, type CollidableVehicle, type StaticObstacleCollider } from '../physics/CollisionSystem';
import { AIController } from '../ai/AIController';
import { computeStandings, updateLapTracking, type RaceVehicle } from '../engine/RaceVehicle';
import type { RaceConfig, RaceResultData } from '../engine/RaceTypes';
import { upgradeManager } from '../upgrades/UpgradeManager';
import { createStockUpgradeState } from '../upgrades/UpgradeData';
import { customizationManager } from '../customization/CustomizationManager';
import { saveManager } from '../save/SaveManager';
import { settingsManager } from '../save/SettingsManager';
import { economyManager } from '../economy/EconomyManager';
import { achievementManager } from '../economy/AchievementManager';
import { getAchievement } from '../economy/AchievementData';
import { liveOpsManager } from '../economy/DailyRewards';
import { getCareerStage } from '../engine/CareerData';
import { maxPossiblePoints, pointsForPosition } from '../engine/Tournament';
import { audioManager } from '../audio/AudioManager';
import { pickWeighted, distance } from '../utils/MathUtils';

interface RaceSceneData {
  config: RaceConfig;
}

const CHECKPOINT_TIME_BONUS = 7;

export class RaceScene extends Phaser.Scene {
  private config!: RaceConfig;
  private geo!: TrackGeometry;
  private built!: BuiltTrack;
  private vehicles: RaceVehicle[] = [];
  private player!: RaceVehicle;
  private collisionSystem = new CollisionSystem();
  private hud!: RaceHUD;
  private controls!: InputManager;
  private uiCamera!: Phaser.Cameras.Scene2D.Camera;

  private raceState: 'countdown' | 'racing' | 'finished' = 'countdown';
  private countdownStep = 3;
  private paused = false;
  private pauseOverlay?: Phaser.GameObjects.Container;

  private weather: WeatherType = 'clear';
  private weatherEmitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  private fogOverlay?: Phaser.GameObjects.Rectangle;
  private ghostTimer = 0;
  private lastScreechTime = 0;

  private driftTimer = 0;
  private checkpointTimeLeft = 0;
  private eliminationTimer = 0;
  private eliminated = new Set<string>();
  private integrity = 100;
  private survivalMinSpeed = 90;

  private minimapCounter = 0;
  private raceStartMs = 0;
  private pendingStuntScore = 0;

  constructor() {
    super(SceneKeys.Race);
  }

  create(data: RaceSceneData): void {
    this.config = data.config;
    this.raceState = 'countdown';
    this.paused = false;
    this.eliminated.clear();
    this.pauseOverlay = undefined;
    this.weatherEmitters = [];
    this.fogOverlay = undefined;
    this.ghostTimer = 0;
    this.lastScreechTime = 0;
    this.minimapCounter = 0;
    this.pendingStuntScore = 0;
    this.raceStartMs = 0;

    const track = getTrackById(this.config.trackId) ?? getTrackById('sunrise_highway')!;
    this.geo = new TrackGeometry(track);
    const renderer = new TrackRenderer(this, this.geo);
    this.built = renderer.build();

    this.physics.world.setBounds(this.built.bounds.x, this.built.bounds.y, this.built.bounds.width, this.built.bounds.height);
    this.cameras.main.setBounds(this.built.bounds.x, this.built.bounds.y, this.built.bounds.width, this.built.bounds.height);
    this.cameras.main.setZoom(1.05);
    this.cameras.main.setBackgroundColor(track.palette.offTrack);

    this.pickWeather(track);
    this.setupEnvironment(track);
    this.spawnVehicles(track);
    this.setupCamera();
    this.setupUiCamera();

    this.hud = new RaceHUD(this);
    this.hud.buildMinimap(this.geo);
    this.hud.setLap(1, this.effectiveLaps());
    if (this.config.mode === 'testDrive') this.hud.setModeInfo('TEST DRIVE — Esc to return to Garage');

    this.controls = new InputManager(this);

    this.driftTimer = 90;
    this.checkpointTimeLeft = 34 + track.laps * 10;
    this.eliminationTimer = this.config.eliminationIntervalSec ?? 16;
    this.integrity = 100;
    this.survivalMinSpeed = 90;

    this.setupPauseKey();
    if (this.config.mode === 'testDrive') {
      this.raceState = 'racing';
      this.raceStartMs = this.time.now;
      audioManager.startPlayerEngine(this.player.car.engineSound);
    } else {
      this.startCountdown();
    }

    audioManager.playMusic('race');

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
  }

  // ---------------------------------------------------------------- setup

  private effectiveLaps(): number {
    return this.config.lapsOverride ?? getTrackById(this.config.trackId)?.laps ?? 3;
  }

  private pickWeather(track: ReturnType<typeof getTrackById>): void {
    if (!track) return;
    this.weather = pickWeighted(Math.random, track.weatherOptions.map((w) => ({ item: w.weather, weight: w.weight })));
  }

  private setupEnvironment(track: NonNullable<ReturnType<typeof getTrackById>>): void {
    const settings = settingsManager.get();

    if (track.timeOfDay === 'night' && settings.dynamicLighting) {
      this.lights.enable().setAmbientColor(0x2a2f52);
      this.built.roadImage.setPipeline('Light2D');
      this.built.decorationLayer.list.forEach((obj) => (obj as Phaser.GameObjects.Image).setPipeline?.('Light2D'));
      this.built.obstacles.forEach((o) => o.sprite.setPipeline('Light2D'));
    } else if (track.timeOfDay === 'dusk') {
      const overlay = this.add.rectangle(this.built.bounds.centerX, this.built.bounds.centerY, this.built.bounds.width, this.built.bounds.height, 0xff7a3c, 0.1);
      overlay.setDepth(DEPTHS.lighting);
    }

    if (!settings.particlesEnabled) return;

    if (this.weather === 'rain') {
      const emitter = this.add.particles(0, 0, TEX.raindrop, {
        x: { min: 0, max: this.cameras.main.width },
        y: -20,
        lifespan: 900,
        speedY: { min: 700, max: 950 },
        speedX: { min: -40, max: -10 },
        scale: { start: 1, end: 1 },
        quantity: 3,
        frequency: 18,
        alpha: { start: 0.7, end: 0.3 },
      });
      emitter.setScrollFactor(0).setDepth(DEPTHS.weather);
      this.weatherEmitters.push(emitter);
    } else if (this.weather === 'snow') {
      const emitter = this.add.particles(0, 0, TEX.snowflake, {
        x: { min: 0, max: this.cameras.main.width },
        y: -20,
        lifespan: 3200,
        speedY: { min: 60, max: 140 },
        speedX: { min: -30, max: 30 },
        scale: { start: 0.8, end: 0.5 },
        quantity: 1,
        frequency: 40,
        alpha: { start: 0.9, end: 0.4 },
      });
      emitter.setScrollFactor(0).setDepth(DEPTHS.weather);
      this.weatherEmitters.push(emitter);
    } else if (this.weather === 'sandstorm') {
      const emitter = this.add.particles(0, 0, TEX.particleDot, {
        x: -20,
        y: { min: 0, max: this.cameras.main.height },
        lifespan: 900,
        speedX: { min: 500, max: 800 },
        speedY: { min: -30, max: 30 },
        scale: { start: 0.6, end: 0.2 },
        tint: 0xd9a35a,
        quantity: 3,
        frequency: 20,
        alpha: { start: 0.5, end: 0 },
      });
      emitter.setScrollFactor(0).setDepth(DEPTHS.weather);
      this.weatherEmitters.push(emitter);
    }

    if (this.weather === 'fog' || this.weather === 'sandstorm') {
      this.fogOverlay = this.add.rectangle(this.cameras.main.width / 2, this.cameras.main.height / 2, this.cameras.main.width, this.cameras.main.height, track.palette.fogColor, this.weather === 'fog' ? 0.28 : 0.16);
      this.fogOverlay.setScrollFactor(0).setDepth(DEPTHS.weather + 1);
    }

    audioManager.setAmbience(this.weather);
  }

  private setupCamera(): void {
    this.cameras.main.startFollow(this.player.visual.container, true, 0.12, 0.12);
  }

  /**
   * A second camera dedicated to screen-fixed UI (HUD, touch controls, pause
   * overlay). Those elements use scrollFactor(0) to stay put while the main
   * camera scrolls/zooms with the car — which renders correctly, but Phaser's
   * input hit-testing does not correctly account for scrollFactor once a
   * camera has non-zero scroll, silently making every HUD/overlay button
   * unclickable. This camera never scrolls or zooms, so hit-testing on it is
   * always screen-accurate; it renders everything except the world objects
   * (listed below), while the main camera is told to ignore the UI objects
   * themselves (see RaceHUD.offMainCamera / TouchControls / pause overlay).
   */
  private setupUiCamera(): void {
    this.uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height);
    const worldObjects: Phaser.GameObjects.GameObject[] = [
      this.built.roadImage,
      ...this.built.obstacles.map((o) => o.sprite),
      ...this.vehicles.map((v) => v.visual.container),
      ...this.weatherEmitters,
    ];
    if (this.fogOverlay) worldObjects.push(this.fogOverlay);
    this.uiCamera.ignore(worldObjects);
    this.uiCamera.ignore(this.built.decorationLayer);
  }

  private spawnVehicles(track: NonNullable<ReturnType<typeof getTrackById>>): void {
    const playerCar = getCarById(this.config.carId) ?? CAR_DATA[0];
    const upgrades = upgradeManager.getState(playerCar.id);
    const customization = customizationManager.getState(playerCar.id);
    const playerPerf = getCarPerformance(playerCar, upgrades);

    const startPoint = this.geo.getPointAtProgress(0);
    const tangent = this.geo.getTangentAtProgress(0);
    const heading = Math.atan2(tangent.y, tangent.x);

    this.player = this.createVehicle('player', playerCar, playerPerf, customization, true, startPoint, heading, 0);
    this.vehicles = [this.player];

    const opponentCount = this.config.opponentCount;
    const policeCount = this.config.mode === 'policeChase' ? Math.min(2, opponentCount) : 0;
    const usedCarIds = new Set([playerCar.id]);

    for (let i = 0; i < opponentCount; i++) {
      const pool = CAR_DATA.filter((c) => !usedCarIds.has(c.id));
      const aiCar = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : CAR_DATA[Math.floor(Math.random() * CAR_DATA.length)];
      usedCarIds.add(aiCar.id);
      const perf = getCarPerformance(aiCar, createStockUpgradeState());
      const row = Math.floor(i / 2) + 1;
      const side = i % 2 === 0 ? 1 : -1;
      const behindProgress = -0.006 * row;
      const spawnPoint = this.geo.getPointAtProgress(behindProgress);
      const normal = this.geo.getNormalAtProgress(behindProgress);
      const lateral = side * (track.baseWidth * 0.22);
      const pos = { x: spawnPoint.x + normal.x * lateral, y: spawnPoint.y + normal.y * lateral };
      const spawnTangent = this.geo.getTangentAtProgress(behindProgress);
      const spawnHeading = Math.atan2(spawnTangent.y, spawnTangent.x);

      const isPolice = i < policeCount;
      const vehicle = this.createVehicle(`ai_${i}`, aiCar, perf, customizationManager.getState(aiCar.id), false, pos, spawnHeading, i, isPolice);
      vehicle.ai = new AIController(this.geo, this.config.difficulty, Math.random);
      this.vehicles.push(vehicle);
    }
  }

  private createVehicle(
    id: string,
    car: (typeof CAR_DATA)[number],
    perf: ReturnType<typeof getCarPerformance>,
    customization: ReturnType<typeof customizationManager.getState>,
    isPlayer: boolean,
    pos: { x: number; y: number },
    heading: number,
    laneIndex: number,
    isPolice = false,
  ): RaceVehicle {
    const state: VehicleState = createVehicleState(pos, heading, perf);
    const visual = buildCarVisual(this, car, customization, true);
    visual.container.setDepth(DEPTHS.vehicles + laneIndex);
    visual.container.setScale(1);
    if (isPolice) {
      visual.body.setTint(0x1a2f6e);
      visual.neon.setTint(0xff2d2d).setAlpha(0.7);
    }

    return {
      id,
      isPlayer,
      isPolice,
      car,
      perf,
      state,
      visual,
      radius: 20,
      lap: 1,
      checkpointsPassed: new Set(),
      lastCheckpointIndex: 0,
      lastProgress: 0,
      finished: false,
      finishTimeMs: null,
      lapTimes: [],
      currentLapStartMs: 0,
      bestLapTimeMs: null,
      crashCount: 0,
      totalRaceProgress: 0,
    };
  }

  private escKey?: Phaser.Input.Keyboard.Key;

  private setupPauseKey(): void {
    this.escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  }

  private startCountdown(): void {
    this.countdownStep = 3;
    for (const v of this.vehicles) v.currentLapStartMs = 0;
    audioManager.startPlayerEngine(this.player.car.engineSound);
    this.hud.showCountdown('3');
    audioManager.countdown(false);
    this.time.addEvent({
      delay: 1000,
      repeat: 3,
      callback: () => {
        this.countdownStep -= 1;
        if (this.countdownStep > 0) {
          this.hud.showCountdown(`${this.countdownStep}`);
          audioManager.countdown(false);
        } else {
          this.hud.showCountdown('GO!');
          audioManager.countdown(true);
          this.raceState = 'racing';
          const now = this.time.now;
          this.raceStartMs = now;
          for (const v of this.vehicles) v.currentLapStartMs = now;
          this.time.delayedCall(500, () => this.hud.hideCountdown());
        }
      },
    });
  }

  // --------------------------------------------------------------- update

  update(_time: number, deltaMs: number): void {
    if (this.paused) return;
    const dt = Math.min(deltaMs / 1000, 0.05);

    const throttleAllowed = this.raceState === 'racing';

    for (const vehicle of this.vehicles) {
      if (vehicle.finished || this.eliminated.has(vehicle.id)) continue;
      const vInput = throttleAllowed
        ? vehicle.isPlayer
          ? this.controls.getInput()
          : this.computeAiInput(vehicle, dt)
        : { throttle: 0, steer: 0, handbrake: false, nitro: false };

      const { progress } = this.geo.worldToTrack(vehicle.state.position);
      const isOffTrack = this.geo.isOffTrack(vehicle.state.position) || this.isInPuddle(vehicle.state.position);
      const jump = this.geo.isInJump(progress);

      const wasAirborne = vehicle.state.airTime > 0;
      updateVehicle(vehicle.state, vehicle.perf, vInput, { isOffTrack, jump, dt });
      if (wasAirborne && vehicle.state.airTime === 0) {
        this.onLanded(vehicle);
      }

      this.syncVisual(vehicle);

      if (throttleAllowed && this.raceState === 'racing') {
        const completedLap = updateLapTracking(vehicle, this.geo, this.time.now);
        if (completedLap && vehicle.lap > this.effectiveLaps() && !vehicle.finished && this.config.mode !== 'drift' && this.config.mode !== 'endless') {
          vehicle.finished = true;
          vehicle.finishTimeMs = this.time.now;
        }
      }

      if (vehicle.isPlayer) this.updatePlayerFx(vehicle, dt);
      if (vehicle.isPolice && this.raceState === 'racing') this.applyPoliceBehavior(vehicle);
    }

    if (this.raceState === 'racing') {
      this.resolveCollisions();
      this.updateModeSpecific(dt);
      this.updateHud();
      this.checkRaceEnd();
    }

    if (this.escKey && Phaser.Input.Keyboard.JustDown(this.escKey)) this.togglePause();
    if (this.controls.consumeResetPressed()) this.resetPlayerToTrack();
  }

  private computeAiInput(vehicle: RaceVehicle, _dt: number) {
    if (!vehicle.ai) return { throttle: 0, steer: 0, handbrake: false, nitro: false };
    const others: import('../ai/AIController').AIVehicleRef[] = this.vehicles
      .filter((v) => v !== vehicle && !this.eliminated.has(v.id))
      .map((v) => ({ id: v.id, state: v.state, perf: v.perf, radius: v.radius }));
    const obstacles = this.built.obstacles.map((o) => ({ position: { x: o.sprite.x, y: o.sprite.y }, radius: o.def.radius }));
    const playerProgress = this.geo.worldToTrack(this.player.state.position).progress;
    const selfProgress = this.geo.worldToTrack(vehicle.state.position).progress;
    let gap = playerProgress - selfProgress;
    if (gap > 0.5) gap -= 1;
    if (gap < -0.5) gap += 1;
    return vehicle.ai.computeInput(
      { id: vehicle.id, state: vehicle.state, perf: vehicle.perf, radius: vehicle.radius },
      others,
      obstacles,
      _dt,
      gap,
    );
  }

  private applyPoliceBehavior(vehicle: RaceVehicle): void {
    const d = distance(vehicle.state.position, this.player.state.position);
    if (d < 260) {
      const dx = this.player.state.position.x - vehicle.state.position.x;
      const dy = this.player.state.position.y - vehicle.state.position.y;
      const pull = 0.4 * (1 - d / 260);
      vehicle.state.heading += Math.atan2(dy, dx) > vehicle.state.heading ? pull * 0.02 : -pull * 0.02;
    }
  }

  private isInPuddle(pos: { x: number; y: number }): boolean {
    for (const o of this.built.obstacles) {
      if (o.def.type !== 'puddle') continue;
      if (distance(pos, { x: o.sprite.x, y: o.sprite.y }) < o.def.radius * 1.3) return true;
    }
    return false;
  }

  private syncVisual(vehicle: RaceVehicle): void {
    const { state, visual } = vehicle;
    visual.container.setPosition(state.position.x, state.position.y - state.jumpHeight);
    visual.container.setRotation(state.heading);
    const jumpScale = 1 + state.jumpHeight / 260;
    const squash = 1 + state.suspension * 0.18;
    visual.container.setScale(jumpScale, jumpScale * squash);
    if (vehicle.isPolice) {
      const flashOn = Math.floor(this.time.now / 260) % 2 === 0;
      visual.neon.setTint(flashOn ? 0xff2d2d : 0x2d6bff);
    }
  }

  private onLanded(vehicle: RaceVehicle): void {
    const speedKmh = getSpeedKmh(vehicle.state);
    const stunt = Math.round(speedKmh * 0.6);
    if (vehicle.isPlayer) this.pendingStuntScore += stunt;
  }

  private updatePlayerFx(vehicle: RaceVehicle, dt: number): void {
    const speedFrac = Math.min(1.2, Math.hypot(vehicle.state.velocity.x, vehicle.state.velocity.y) / vehicle.perf.maxSpeed);
    audioManager.updatePlayerEngine(Math.min(1, 0.25 + speedFrac * 0.9), vehicle.state.nitroActive);

    if (vehicle.state.isDrifting) {
      audioManager.startDrift();
      audioManager.updateDrift(Math.min(1, Math.abs(vehicle.state.driftAngle) * 2));
      if (this.time.now - this.lastScreechTime > 220) {
        this.lastScreechTime = this.time.now;
        audioManager.screech(Math.min(1, speedFrac));
      }
    } else {
      audioManager.stopDrift();
    }

    if (settingsManager.get().motionBlur && (vehicle.state.nitroActive || speedFrac > 0.82)) {
      this.ghostTimer -= dt;
      if (this.ghostTimer <= 0) {
        this.ghostTimer = 0.045;
        this.spawnGhost(vehicle);
      }
    }
  }

  private spawnGhost(vehicle: RaceVehicle): void {
    const ghost = this.add.image(vehicle.visual.container.x, vehicle.visual.container.y, TEX.carBody);
    ghost.setRotation(vehicle.visual.container.rotation);
    ghost.setTint(vehicle.car.colorPrimary);
    ghost.setAlpha(0.28);
    ghost.setScale(vehicle.visual.container.scaleX, vehicle.visual.container.scaleY);
    ghost.setDepth(DEPTHS.vehicleFx);
    this.uiCamera.ignore(ghost); // world-space effect — only the scrolling main camera should draw it
    this.tweens.add({ targets: ghost, alpha: 0, duration: 220, onComplete: () => ghost.destroy() });
  }

  private resolveCollisions(): void {
    const collidables: CollidableVehicle[] = this.vehicles
      .filter((v) => !v.finished && !this.eliminated.has(v.id))
      .map((v) => ({ id: v.id, state: v.state, radius: v.radius, mass: v.perf.mass }));
    const vehicleEvents = this.collisionSystem.resolveVehiclePairs(collidables);

    const obstacleColliders: StaticObstacleCollider[] = this.built.obstacles
      .filter((o) => o.def.type !== 'puddle')
      .map((o) => ({ position: { x: o.sprite.x, y: o.sprite.y }, radius: o.def.radius, hard: true }));
    const obstacleEvents = this.collisionSystem.resolveObstacles(collidables, obstacleColliders);

    for (const evt of [...vehicleEvents, ...obstacleEvents]) {
      const vehicle = this.vehicles.find((v) => v.id === evt.vehicleId);
      if (vehicle) vehicle.crashCount += 1;
      if (evt.vehicleId === 'player' || evt.otherId === 'player') {
        audioManager.crash(evt.severity);
        if (settingsManager.get().accessibility.screenShake) this.cameras.main.shake(120, 0.004 * evt.severity);
      }
    }
  }

  private updateModeSpecific(dt: number): void {
    if (this.config.mode === 'drift') {
      this.driftTimer -= dt;
      this.hud.setModeInfo(`Time left: ${Math.max(0, Math.ceil(this.driftTimer))}s`);
      this.hud.setDriftScore(this.player.state.driftScoreAccum);
    } else if (this.config.mode === 'checkpoint') {
      this.checkpointTimeLeft -= dt;
      this.hud.setModeInfo(`Time left: ${Math.max(0, Math.ceil(this.checkpointTimeLeft))}s`);
    } else if (this.config.mode === 'elimination') {
      this.eliminationTimer -= dt;
      this.hud.setModeInfo(`Next elimination: ${Math.max(0, Math.ceil(this.eliminationTimer))}s`);
      if (this.eliminationTimer <= 0) {
        this.eliminationTimer = this.config.eliminationIntervalSec ?? 16;
        this.runElimination();
      }
    } else if (this.config.mode === 'endless') {
      this.survivalMinSpeed += dt * 1.4;
      const playerSpeed = getSpeedKmh(this.player.state);
      this.hud.setModeInfo(`Distance: ${Math.round(this.player.state.totalDistance / 10)}m  ·  Integrity: ${Math.round(this.integrity)}%`);
      if (playerSpeed < this.survivalMinSpeed * 0.35) {
        this.integrity -= dt * 6;
      }
    } else if (this.config.mode === 'policeChase') {
      this.hud.setModeInfo('Lose the police — reach the finish line!');
    }
  }

  private runElimination(): void {
    const active = this.vehicles.filter((v) => !v.finished && !this.eliminated.has(v.id));
    const standings = computeStandings(active);
    const last = standings[standings.length - 1];
    if (!last) return;
    if (last.isPlayer) {
      this.endRace('eliminated');
      return;
    }
    this.eliminated.add(last.id);
    this.tweens.add({ targets: last.visual.container, alpha: 0, duration: 400 });
  }

  private updateHud(): void {
    this.hud.setSpeed(getSpeedKmh(this.player.state));
    this.hud.setNitro(this.player.state.nitroFuel / this.player.state.nitroCapacity);
    if (this.config.mode !== 'drift' && this.config.mode !== 'endless') {
      this.hud.setLap(this.player.lap, this.effectiveLaps());
    }
    const active = this.vehicles.filter((v) => !this.eliminated.has(v.id));
    const standings = computeStandings(active);
    const rank = standings.indexOf(this.player) + 1;
    this.hud.setPosition(rank, active.length);

    this.minimapCounter += 1;
    if (this.minimapCounter % 4 === 0) this.hud.updateMinimapDots(active);
  }

  private checkRaceEnd(): void {
    if (this.config.mode === 'drift' && this.driftTimer <= 0) {
      this.endRace('finished');
      return;
    }
    if (this.config.mode === 'checkpoint') {
      if (this.checkpointTimeLeft <= 0) {
        this.endRace('dnf');
        return;
      }
      if (this.player.finished) {
        this.endRace('finished');
        return;
      }
    }
    if (this.config.mode === 'endless') {
      if (this.integrity <= 0) {
        this.endRace('dnf');
        return;
      }
      return;
    }
    if (this.player.finished) {
      this.endRace('finished');
    }
  }

  private resetPlayerToTrack(): void {
    const { progress } = this.geo.worldToTrack(this.player.state.position);
    const centerPoint = this.geo.getPointAtProgress(progress);
    const tangent = this.geo.getTangentAtProgress(progress);
    this.player.state.position = { x: centerPoint.x, y: centerPoint.y };
    this.player.state.velocity = { x: 0, y: 0 };
    this.player.state.heading = Math.atan2(tangent.y, tangent.x);
  }

  private togglePause(): void {
    if (this.raceState !== 'racing' && !this.paused) return;
    this.paused = !this.paused;
    if (this.paused) this.showPauseOverlay();
    else this.hidePauseOverlay();
  }

  private showPauseOverlay(): void {
    const cam = this.cameras.main;
    const cx = cam.width / 2;
    const cy = cam.height / 2;
    const container = this.add.container(0, 0).setScrollFactor(0).setDepth(DEPTHS.modal);
    const dim = this.add.rectangle(cx, cy, cam.width, cam.height, 0x000000, 0.6);
    const panel = drawPanel(this, cx - 180, cy - 160, 360, 320, { alpha: 0.95 });
    const title = this.add.text(cx, cy - 120, 'PAUSED', FONT.h2).setOrigin(0.5);
    const resume = new Button(this, cx, cy - 50, 'Resume', () => this.togglePause(), { width: 260, height: 50 });
    const restart = new Button(this, cx, cy + 10, 'Restart Race', () => {
      this.togglePause();
      this.scene.restart({ config: this.config });
    }, { width: 260, height: 50, variant: 'secondary' });
    const isTestDrive = this.config.mode === 'testDrive';
    const quit = new Button(this, cx, cy + 70, isTestDrive ? 'Quit to Garage' : 'Quit to Menu', () => {
      this.togglePause();
      this.scene.start(isTestDrive ? SceneKeys.Garage : SceneKeys.MainMenu);
    }, { width: 260, height: 50, variant: 'danger' });
    container.add([dim, panel, title, resume, restart, quit]);
    this.cameras.main.ignore(container); // see setupUiCamera() — keeps it on the non-scrolled UI camera
    this.pauseOverlay = container;
  }

  private hidePauseOverlay(): void {
    this.pauseOverlay?.destroy();
    this.pauseOverlay = undefined;
  }

  // ----------------------------------------------------------------- end

  private endRace(outcome: RaceResultData['outcome']): void {
    if (this.raceState === 'finished') return;
    this.raceState = 'finished';
    audioManager.stopPlayerEngine();
    audioManager.stopDrift();
    audioManager.stopMusic();

    if (this.config.mode === 'testDrive') {
      this.scene.start(SceneKeys.Garage);
      return;
    }

    const active = this.vehicles.filter((v) => !this.eliminated.has(v.id));
    const standings = computeStandings(active);
    const position = outcome === 'eliminated' ? active.length : standings.indexOf(this.player) + 1;
    const totalRacers = this.vehicles.length;
    const raceTimeMs = (this.player.finishTimeMs ?? this.time.now) - this.raceStartMs;
    const driftScore = Math.round(this.player.state.driftScoreAccum);
    const cleanDriving = this.player.crashCount === 0;

    const difficultyMultiplier = DIFFICULTY_SETTINGS[this.config.difficulty].rewardMultiplier;
    const reward = economyManager.computeRaceReward({
      position,
      racerCount: totalRacers,
      driftScore,
      cleanDriving,
      raceTimeSeconds: raceTimeMs / 1000,
      targetTimeSeconds: (getTrackById(this.config.trackId)?.targetLapTime ?? 0) * this.effectiveLaps(),
      stuntScore: this.pendingStuntScore,
      difficultyMultiplier,
      mode: this.config.mode as never,
    });

    liveOpsManager.recordEvent('finishRace', 1);
    if (position === 1 && outcome === 'finished') liveOpsManager.recordEvent('win', 1);
    if (cleanDriving) liveOpsManager.recordEvent('cleanRace', 1);
    if (driftScore > 0) liveOpsManager.recordEvent('driftMeters', Math.round(driftScore / 10));
    if (this.pendingStuntScore > 0) liveOpsManager.recordEvent('stunt', this.pendingStuntScore);

    let careerStagePassed: boolean | undefined;
    if (this.config.careerStageId) {
      const stage = getCareerStage(this.config.careerStageId);
      if (stage && outcome === 'finished' && position <= stage.requiredPosition) {
        careerStagePassed = true;
        saveManager.mutate((d) => {
          if (!d.careerProgress.completedStageIds.includes(stage.id)) d.careerProgress.completedStageIds.push(stage.id);
        });
      } else {
        careerStagePassed = false;
      }
    }

    if (outcome === 'finished' && this.player.bestLapTimeMs) {
      saveManager.mutate((d) => {
        const record = d.lapRecords[this.config.trackId] ?? { bestLapTime: null, bestTotalTime: null };
        if (record.bestLapTime === null || this.player.bestLapTimeMs! < record.bestLapTime) record.bestLapTime = this.player.bestLapTimeMs;
        if (record.bestTotalTime === null || raceTimeMs < record.bestTotalTime) record.bestTotalTime = raceTimeMs;
        d.lapRecords[this.config.trackId] = record;
      });
    }

    saveManager.mutate((d) => {
      d.statistics.mileageMeters += Math.round(this.player.state.totalDistance / 10);
    });

    let tournamentResult: RaceResultData['tournament'];
    if (this.config.tournament) {
      const t = this.config.tournament;
      const pointsThisRound = outcome === 'finished' ? pointsForPosition(position) : 0;
      const totalPoints = t.pointsSoFar + pointsThisRound;
      const isFinalRound = t.round >= t.totalRounds;
      let bonusCoins = 0;
      let bonusTrophies = 0;
      if (isFinalRound) {
        const maxPoints = maxPossiblePoints(t.totalRounds);
        bonusCoins = totalPoints * 120;
        bonusTrophies = totalPoints >= maxPoints * 0.8 ? 5 : totalPoints >= maxPoints * 0.5 ? 2 : 0;
        if (bonusCoins > 0) economyManager.addCoins(bonusCoins);
        if (bonusTrophies > 0) economyManager.addTrophies(bonusTrophies);
      }
      tournamentResult = { round: t.round, totalRounds: t.totalRounds, pointsThisRound, totalPoints, isFinalRound, bonusCoins, bonusTrophies };
    }

    const newAchievements = achievementManager.checkAll();
    const achievementBonusCoins = newAchievements.reduce((sum, id) => sum + (getAchievement(id)?.rewardCoins ?? 0), 0);
    const rewardBreakdown = achievementBonusCoins > 0
      ? [...reward.breakdown, { label: `${newAchievements.length} achievement unlocked`, coins: achievementBonusCoins, xp: 0 }]
      : reward.breakdown;

    const resultData: RaceResultData = {
      config: this.config,
      outcome,
      position,
      totalRacers,
      raceTimeMs,
      lapTimes: this.player.lapTimes,
      bestLapMs: this.player.bestLapTimeMs,
      driftScore,
      stuntScore: this.pendingStuntScore,
      distanceMeters: Math.round(this.player.state.totalDistance / 10),
      cleanDriving,
      coinsEarned: reward.coins + achievementBonusCoins,
      xpEarned: reward.xp,
      trophiesEarned: reward.trophies,
      rewardBreakdown,
      careerStagePassed,
      newAchievements,
      tournament: tournamentResult,
    };

    this.time.delayedCall(600, () => this.scene.start(SceneKeys.Results, { result: resultData }));
  }

  private cleanup(): void {
    this.weatherEmitters.forEach((e) => e.destroy());
    this.fogOverlay?.destroy();
    this.controls?.destroy();
    this.hud?.destroy();
    audioManager.stopPlayerEngine();
    audioManager.stopDrift();
  }
}
