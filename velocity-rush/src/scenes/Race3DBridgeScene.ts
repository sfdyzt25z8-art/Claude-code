import Phaser from 'phaser';
import { SceneKeys } from './SceneKeys';
import type { RaceConfig, RaceResultData } from '../engine/RaceTypes';
import { Race3DScene } from '../three/Race3DScene';

interface Race3DBridgeData {
  config: RaceConfig;
}

/**
 * Thin Phaser scene that hands the driving view off to Three.js. Phaser
 * keeps owning every menu; this scene's only job is to hide Phaser's canvas,
 * mount a Three.js canvas + DOM HUD in its place, step the 3D simulation
 * once per Phaser frame, and restore Phaser when the race ends — at which
 * point Results/rewards/save all proceed exactly as the 2D view leaves them.
 */
export class Race3DBridgeScene extends Phaser.Scene {
  private container?: HTMLDivElement;
  private race3d?: Race3DScene;

  constructor() {
    super(SceneKeys.Race3D);
  }

  create(data: Race3DBridgeData): void {
    const canvas = this.sys.game.canvas;
    canvas.style.visibility = 'hidden';

    const parent = canvas.parentElement ?? document.body;
    this.container = document.createElement('div');
    this.container.style.cssText = 'position:absolute; inset:0; width:100%; height:100%;';
    parent.appendChild(this.container);

    this.race3d = new Race3DScene(this.container, data.config, {
      onFinish: (result: RaceResultData) => this.leave(() => this.scene.start(SceneKeys.Results, { result })),
      onQuit: () => this.leave(() => this.scene.start(SceneKeys.MainMenu)),
    });

    if (import.meta.env.DEV) (window as unknown as { __VR_QA_3D__?: Race3DScene }).__VR_QA_3D__ = this.race3d;

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.teardown());
  }

  update(_time: number, delta: number): void {
    this.race3d?.step(delta);
  }

  private leave(next: () => void): void {
    this.teardown();
    next();
  }

  private teardown(): void {
    this.race3d?.dispose();
    this.race3d = undefined;
    if (import.meta.env.DEV) delete (window as unknown as { __VR_QA_3D__?: Race3DScene }).__VR_QA_3D__;
    this.container?.remove();
    this.container = undefined;
    this.sys.game.canvas.style.visibility = 'visible';
  }
}
