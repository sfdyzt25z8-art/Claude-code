import * as THREE from 'three';
import { DIFFICULTY_SETTINGS } from '../utils/Constants';
import { pickWeighted, distance } from '../utils/MathUtils';
import { getTrackById } from '../tracks/TrackData';
import { TrackGeometry } from '../tracks/TrackGeometry';
import { CAR_DATA, getCarById } from '../cars/CarData';
import { getCarPerformance } from '../cars/CarPerformance';
import { createVehicleState, updateVehicle, getSpeedKmh, type VehicleState } from '../physics/VehiclePhysics';
import { CollisionSystem, type CollidableVehicle, type StaticObstacleCollider } from '../physics/CollisionSystem';
import { AIController, type AIVehicleRef } from '../ai/AIController';
import { computeStandings, updateLapTracking } from '../engine/RaceVehicle';
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
import { buildCarMesh3D, CAR_WHEEL_RADIUS } from './CarMesh3D';
import { buildTrackMesh3D, type BuiltTrack3D } from './TrackMesh3D';
import type { RaceVehicle3D } from './RaceVehicle3D';
import { ChaseCamera } from './ChaseCamera';
import { Keyboard3D } from './Keyboard3D';
import { TouchControls3D } from './TouchControls3D';
import { Hud3D } from './Hud3D';
import { WORLD_SCALE } from './Scale3D';

export interface Race3DCallbacks {
  /** Race reached a real finish — caller owns dispose() + navigating to Results. */
  onFinish(result: RaceResultData): void;
  /** Player quit from the pause menu — caller owns dispose() + navigating away. */
  onQuit(): void;
}

/**
 * Owns the entire 3D driving view: Three.js renderer/scene/camera, the
 * procedural track + car meshes, input, HUD, and the per-frame simulation
 * loop (physics -> AI -> collisions -> lap tracking -> camera -> render).
 * Framework-agnostic — driven by `step()` calls from a thin Phaser bridge
 * scene rather than owning its own animation-frame loop, so it stays in sync
 * with the rest of the game's frame timing.
 */
export class Race3DScene {
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private chaseCam!: ChaseCamera;
  private canvas!: HTMLCanvasElement;
  private geo!: TrackGeometry;
  private builtTrack!: BuiltTrack3D;
  private vehicles: RaceVehicle3D[] = [];
  private player!: RaceVehicle3D;
  private collisionSystem = new CollisionSystem();
  private keyboard!: Keyboard3D;
  private touch: TouchControls3D | null = null;
  private hud!: Hud3D;
  private pauseOverlay: HTMLDivElement | null = null;
  private onResize = () => this.handleResize();
  private onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Escape') this.togglePause();
  };

  private raceState: 'countdown' | 'racing' | 'finished' = 'countdown';
  private countdownStep = 3;
  private countdownElapsedMs = 0;
  private paused = false;
  private nowMs = 0;
  private raceStartMs = 0;
  private pendingStuntScore = 0;
  private minimapCounter = 0;
  private lastScreechTime = 0;

  private eliminated = new Set<string>();
  private driftTimer = 90;
  private checkpointTimeLeft = 0;
  private eliminationTimer = 0;
  private integrity = 100;
  private survivalMinSpeed = 90;
  private sirenLights = new Map<string, { material: THREE.MeshBasicMaterial; light: THREE.PointLight }>();

  constructor(private container: HTMLElement, private config: RaceConfig, private callbacks: Race3DCallbacks) {
    this.init();
  }

  private init(): void {
    const track = getTrackById(this.config.trackId) ?? getTrackById('sunrise_highway')!;
    this.geo = new TrackGeometry(track);
    this.raceState = 'countdown';
    this.countdownStep = 3;
    this.countdownElapsedMs = 0;
    this.paused = false;
    this.nowMs = 0;
    this.raceStartMs = 0;
    this.pendingStuntScore = 0;
    this.minimapCounter = 0;
    this.lastScreechTime = 0;
    this.eliminated = new Set();
    this.driftTimer = 90;
    this.checkpointTimeLeft = 34 + track.laps * 10;
    this.eliminationTimer = this.config.eliminationIntervalSec ?? 16;
    this.integrity = 100;
    this.survivalMinSpeed = 90;
    this.sirenLights = new Map();

    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = 'position:absolute; inset:0; width:100%; height:100%; display:block;';
    this.container.appendChild(this.canvas);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(track.palette.offTrack);

    const aspect = this.container.clientWidth / Math.max(1, this.container.clientHeight);
    this.chaseCam = new ChaseCamera(aspect);

    this.setupLighting(track);
    this.builtTrack = buildTrackMesh3D(this.geo);
    this.scene.add(this.builtTrack.group);
    this.scene.fog = new THREE.Fog(track.palette.offTrack, this.builtTrack.boundsRadius * 0.55, this.builtTrack.boundsRadius * 1.6);

    this.spawnVehicles(track);

    this.hud = new Hud3D(this.container);
    this.hud.buildMinimap(this.geo);
    this.hud.setLap(1, this.effectiveLaps());
    if (this.config.mode === 'testDrive') this.hud.setModeInfo('TEST DRIVE — Esc to return to Garage');

    this.keyboard = new Keyboard3D();
    const scheme = settingsManager.get().controlScheme;
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (scheme === 'touch' || (scheme === 'auto' && hasTouch)) this.touch = new TouchControls3D(this.container);

    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    this.handleResize();

    if (this.config.mode === 'testDrive') {
      this.raceState = 'racing';
      this.raceStartMs = this.nowMs;
      audioManager.startPlayerEngine(this.player.car.engineSound);
    } else {
      this.startCountdown();
    }
    audioManager.playMusic('race');
  }

  private setupLighting(track: NonNullable<ReturnType<typeof getTrackById>>): void {
    const night = track.timeOfDay === 'night';
    const dusk = track.timeOfDay === 'dusk';
    const skyColor = night ? 0x1a2350 : dusk ? 0xff9a5a : 0xbfe0ff;
    const groundColor = night ? 0x0a0e1f : 0x3a3a2a;
    this.scene.add(new THREE.HemisphereLight(skyColor, groundColor, night ? 0.55 : 0.9));

    const sun = new THREE.DirectionalLight(night ? 0x4a6bff : dusk ? 0xffb27a : 0xffffff, night ? 0.35 : dusk ? 0.9 : 1.15);
    sun.position.set(120, 220, 80);
    this.scene.add(sun);
    this.scene.add(new THREE.AmbientLight(0xffffff, night ? 0.25 : 0.4));
  }

  private effectiveLaps(): number {
    return this.config.lapsOverride ?? getTrackById(this.config.trackId)?.laps ?? 3;
  }

  private spawnVehicles(track: NonNullable<ReturnType<typeof getTrackById>>): void {
    const playerCar = getCarById(this.config.carId) ?? CAR_DATA[0];
    const upgrades = upgradeManager.getState(playerCar.id);
    const customization = customizationManager.getState(playerCar.id);
    const playerPerf = getCarPerformance(playerCar, upgrades);

    const startPoint = this.geo.getPointAtProgress(0);
    const tangent = this.geo.getTangentAtProgress(0);
    const heading = Math.atan2(tangent.y, tangent.x);

    this.player = this.createVehicle('player', playerCar, playerPerf, customization, true, startPoint, heading);
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
      const vehicle = this.createVehicle(`ai_${i}`, aiCar, perf, customizationManager.getState(aiCar.id), false, pos, spawnHeading, isPolice);
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
    isPolice = false,
  ): RaceVehicle3D {
    const state: VehicleState = createVehicleState(pos, heading, perf);
    const mesh = buildCarMesh3D(car, customization);
    this.scene.add(mesh.group);

    if (isPolice) {
      mesh.bodyMaterial.color.setHex(0x1a2f6e);
      const beacon = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.9), new THREE.MeshBasicMaterial({ color: 0xff2d2d }));
      beacon.position.set(-0.1, 1.08, 0);
      mesh.group.add(beacon);
      const light = new THREE.PointLight(0xff2d2d, 1.4, 6, 2);
      light.position.set(-0.1, 1.3, 0);
      mesh.group.add(light);
      this.sirenLights.set(id, { material: beacon.material as THREE.MeshBasicMaterial, light });
    }

    return {
      id,
      isPlayer,
      isPolice,
      car,
      perf,
      state,
      mesh,
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

  private startCountdown(): void {
    for (const v of this.vehicles) v.currentLapStartMs = 0;
    audioManager.startPlayerEngine(this.player.car.engineSound);
    this.hud.showCountdown('3');
    audioManager.countdown(false);
  }

  // --------------------------------------------------------------- update

  /** Advances the simulation and re-renders. Called once per Phaser frame by the bridge scene. */
  step(deltaMs: number): void {
    if (this.paused) return;
    this.nowMs += deltaMs;
    const dt = Math.min(deltaMs / 1000, 0.05);

    if (this.raceState === 'countdown') this.updateCountdown(deltaMs);

    const throttleAllowed = this.raceState === 'racing';
    for (const vehicle of this.vehicles) {
      if (vehicle.finished || this.eliminated.has(vehicle.id)) continue;
      const vInput = throttleAllowed
        ? vehicle.isPlayer
          ? this.playerInput()
          : this.computeAiInput(vehicle, dt)
        : { throttle: 0, steer: 0, handbrake: false, nitro: false };

      const { progress } = this.geo.worldToTrack(vehicle.state.position);
      const isOffTrack = this.geo.isOffTrack(vehicle.state.position) || this.isInPuddle(vehicle.state.position);
      const jump = this.geo.isInJump(progress);

      const wasAirborne = vehicle.state.airTime > 0;
      updateVehicle(vehicle.state, vehicle.perf, vInput, { isOffTrack, jump, dt });
      if (wasAirborne && vehicle.state.airTime === 0) this.onLanded(vehicle);

      this.syncMesh(vehicle);
      if (vehicle.isPolice) this.updateSiren(vehicle);

      if (throttleAllowed) {
        const completedLap = updateLapTracking(vehicle, this.geo, this.nowMs);
        if (completedLap && vehicle.lap > this.effectiveLaps() && !vehicle.finished && this.config.mode !== 'drift' && this.config.mode !== 'endless') {
          vehicle.finished = true;
          vehicle.finishTimeMs = this.nowMs;
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

    if (this.keyboard.consumeResetPressed()) this.resetPlayerToTrack();

    const scaledPos = {
      x: this.player.state.position.x * WORLD_SCALE,
      y: this.player.state.jumpHeight * WORLD_SCALE,
      z: this.player.state.position.y * WORLD_SCALE,
    };
    const speedFrac = Math.min(1.2, Math.hypot(this.player.state.velocity.x, this.player.state.velocity.y) / this.player.perf.maxSpeed);
    this.chaseCam.update(scaledPos, this.player.state.heading, speedFrac, dt, this.player.state.nitroActive);

    this.renderer.render(this.scene, this.chaseCam.camera);
  }

  private playerInput() {
    const kb = this.keyboard.getInput();
    if (!this.touch) return kb;
    return {
      throttle: clamp1(kb.throttle + this.touch.state.throttle),
      steer: clamp1(kb.steer + this.touch.state.steer),
      handbrake: kb.handbrake || this.touch.state.handbrake,
      nitro: kb.nitro || this.touch.state.nitro,
    };
  }

  private updateCountdown(deltaMs: number): void {
    this.countdownElapsedMs += deltaMs;
    if (this.countdownElapsedMs < 1000) return;
    this.countdownElapsedMs = 0;
    this.countdownStep -= 1;
    if (this.countdownStep > 0) {
      this.hud.showCountdown(`${this.countdownStep}`);
      audioManager.countdown(false);
    } else {
      this.hud.showCountdown('GO!');
      audioManager.countdown(true);
      this.raceState = 'racing';
      this.raceStartMs = this.nowMs;
      for (const v of this.vehicles) v.currentLapStartMs = this.nowMs;
      setTimeout(() => this.hud.hideCountdown(), 500);
    }
  }

  private computeAiInput(vehicle: RaceVehicle3D, dt: number) {
    if (!vehicle.ai) return { throttle: 0, steer: 0, handbrake: false, nitro: false };
    const others: AIVehicleRef[] = this.vehicles
      .filter((v) => v !== vehicle && !this.eliminated.has(v.id))
      .map((v) => ({ id: v.id, state: v.state, perf: v.perf, radius: v.radius }));
    const obstacles = this.builtTrack.obstacles.map((o) => ({ position: o.position, radius: o.radius }));
    const playerProgress = this.geo.worldToTrack(this.player.state.position).progress;
    const selfProgress = this.geo.worldToTrack(vehicle.state.position).progress;
    let gap = playerProgress - selfProgress;
    if (gap > 0.5) gap -= 1;
    if (gap < -0.5) gap += 1;
    return vehicle.ai.computeInput(
      { id: vehicle.id, state: vehicle.state, perf: vehicle.perf, radius: vehicle.radius },
      others,
      obstacles,
      dt,
      gap,
    );
  }

  private applyPoliceBehavior(vehicle: RaceVehicle3D): void {
    const d = distance(vehicle.state.position, this.player.state.position);
    if (d < 260) {
      const dx = this.player.state.position.x - vehicle.state.position.x;
      const dy = this.player.state.position.y - vehicle.state.position.y;
      const pull = 0.4 * (1 - d / 260);
      vehicle.state.heading += Math.atan2(dy, dx) > vehicle.state.heading ? pull * 0.02 : -pull * 0.02;
    }
  }

  private updateSiren(vehicle: RaceVehicle3D): void {
    const siren = this.sirenLights.get(vehicle.id);
    if (!siren) return;
    const flashOn = Math.floor(this.nowMs / 260) % 2 === 0;
    const color = flashOn ? 0xff2d2d : 0x2d6bff;
    siren.material.color.setHex(color);
    siren.light.color.setHex(color);
  }

  private isInPuddle(pos: { x: number; y: number }): boolean {
    for (const o of this.builtTrack.obstacles) {
      if (o.hard) continue; // 'puddle' is the only soft obstacle type
      if (distance(pos, o.position) < o.radius * 1.3) return true;
    }
    return false;
  }

  private syncMesh(vehicle: RaceVehicle3D): void {
    const { state, mesh } = vehicle;
    mesh.group.position.set(state.position.x * WORLD_SCALE, state.jumpHeight * WORLD_SCALE, state.position.y * WORLD_SCALE);
    mesh.group.rotation.y = -state.heading;
    const wheelAngle = (state.totalDistance * WORLD_SCALE) / CAR_WHEEL_RADIUS;
    for (const wheel of mesh.wheels) wheel.rotation.x = wheelAngle;
  }

  private onLanded(vehicle: RaceVehicle3D): void {
    const speedKmh = getSpeedKmh(vehicle.state);
    if (vehicle.isPlayer) this.pendingStuntScore += Math.round(speedKmh * 0.6);
  }

  private updatePlayerFx(vehicle: RaceVehicle3D, _dt: number): void {
    const speedFrac = Math.min(1.2, Math.hypot(vehicle.state.velocity.x, vehicle.state.velocity.y) / vehicle.perf.maxSpeed);
    audioManager.updatePlayerEngine(Math.min(1, 0.25 + speedFrac * 0.9), vehicle.state.nitroActive);

    if (vehicle.state.isDrifting) {
      audioManager.startDrift();
      audioManager.updateDrift(Math.min(1, Math.abs(vehicle.state.driftAngle) * 2));
      if (this.nowMs - this.lastScreechTime > 220) {
        this.lastScreechTime = this.nowMs;
        audioManager.screech(Math.min(1, speedFrac));
      }
    } else {
      audioManager.stopDrift();
    }
  }

  private resolveCollisions(): void {
    const collidables: CollidableVehicle[] = this.vehicles
      .filter((v) => !v.finished && !this.eliminated.has(v.id))
      .map((v) => ({ id: v.id, state: v.state, radius: v.radius, mass: v.perf.mass }));
    const vehicleEvents = this.collisionSystem.resolveVehiclePairs(collidables);

    const obstacleColliders: StaticObstacleCollider[] = this.builtTrack.obstacles.map((o) => ({ position: o.position, radius: o.radius, hard: o.hard }));
    const obstacleEvents = this.collisionSystem.resolveObstacles(collidables, obstacleColliders);

    for (const evt of [...vehicleEvents, ...obstacleEvents]) {
      const vehicle = this.vehicles.find((v) => v.id === evt.vehicleId);
      if (vehicle) vehicle.crashCount += 1;
      if (evt.vehicleId === 'player' || evt.otherId === 'player') audioManager.crash(evt.severity);
    }
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
    last.mesh.group.visible = false;
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

  // ---------------------------------------------------------------- pause

  private togglePause(): void {
    if (this.raceState !== 'racing' && !this.paused) return;
    this.paused = !this.paused;
    if (this.paused) this.showPauseOverlay();
    else this.hidePauseOverlay();
  }

  private showPauseOverlay(): void {
    audioManager.stopPlayerEngine();
    audioManager.stopDrift();
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:absolute; inset:0; z-index:40; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; font-family:\'Segoe UI\',Roboto,sans-serif;';
    const panel = document.createElement('div');
    panel.style.cssText = 'width:340px; background:rgba(15,20,48,0.95); border:1px solid rgba(255,255,255,0.1); border-radius:14px; padding:28px; text-align:center; color:#e9f3ff;';
    const title = document.createElement('div');
    title.textContent = 'PAUSED';
    title.style.cssText = 'font-size:26px; font-weight:800; margin-bottom:20px; letter-spacing:0.06em;';
    panel.appendChild(title);

    const isTestDrive = this.config.mode === 'testDrive';
    panel.appendChild(this.pauseButton('Resume', '#4facfe', () => this.togglePause()));
    panel.appendChild(this.pauseButton('Restart Race', '#171d42', () => this.restart()));
    panel.appendChild(this.pauseButton(isTestDrive ? 'Quit to Garage' : 'Quit to Menu', '#ff4d5e', () => this.callbacks.onQuit()));

    overlay.appendChild(panel);
    this.container.appendChild(overlay);
    this.pauseOverlay = overlay;
  }

  private pauseButton(label: string, color: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.style.cssText = `display:block; width:100%; padding:14px; margin-top:12px; border:none; border-radius:8px; background:${color}; color:#fff; font-size:15px; font-weight:700; cursor:pointer;`;
    btn.addEventListener('click', onClick);
    return btn;
  }

  private hidePauseOverlay(): void {
    this.pauseOverlay?.remove();
    this.pauseOverlay = null;
    if (this.raceState === 'racing') audioManager.startPlayerEngine(this.player.car.engineSound);
  }

  restart(): void {
    this.teardown();
    this.init();
  }

  // ----------------------------------------------------------------- end

  private endRace(outcome: RaceResultData['outcome']): void {
    if (this.raceState === 'finished') return;
    this.raceState = 'finished';
    audioManager.stopPlayerEngine();
    audioManager.stopDrift();
    audioManager.stopMusic();

    if (this.config.mode === 'testDrive') {
      this.callbacks.onQuit();
      return;
    }

    const active = this.vehicles.filter((v) => !this.eliminated.has(v.id));
    const standings = computeStandings(active);
    const position = outcome === 'eliminated' ? active.length : standings.indexOf(this.player) + 1;
    const totalRacers = this.vehicles.length;
    const raceTimeMs = (this.player.finishTimeMs ?? this.nowMs) - this.raceStartMs;
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

    setTimeout(() => this.callbacks.onFinish(resultData), 600);
  }

  // ------------------------------------------------------------- lifecycle

  private handleResize(): void {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(w, h);
    this.chaseCam.setAspect(w / h);
  }

  /** Tears down all THREE/DOM/listener resources, leaving `container` empty but reusable. */
  private teardown(): void {
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    this.keyboard?.destroy();
    this.touch?.destroy();
    this.touch = null;
    this.hud?.destroy();
    this.pauseOverlay?.remove();
    this.pauseOverlay = null;
    audioManager.stopPlayerEngine();
    audioManager.stopDrift();
    audioManager.stopMusic();

    this.scene?.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat?.dispose();
    });
    this.renderer?.dispose();
    this.canvas?.remove();
  }

  dispose(): void {
    this.teardown();
  }

  /** Dev/QA introspection hook — mirrors the pattern of `window.__VR_QA__` in main.ts. */
  getDebugSnapshot() {
    return {
      raceState: this.raceState,
      playerPosition: { ...this.player.state.position },
      playerHeading: this.player.state.heading,
      speedKmh: getSpeedKmh(this.player.state),
      lap: this.player.lap,
      finished: this.player.finished,
      vehicleCount: this.vehicles.length,
    };
  }
}

function clamp1(v: number): number {
  return Math.max(-1, Math.min(1, v));
}
