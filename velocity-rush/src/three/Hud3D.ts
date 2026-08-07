import { CSS_COLORS } from '../utils/Constants';
import type { TrackGeometry } from '../tracks/TrackGeometry';
import type { RaceVehicle3D } from './RaceVehicle3D';

/**
 * DOM/CSS HUD for the 3D driving view — same data as `RaceHUD` (speed,
 * position, lap, nitro, drift score, mode info, minimap), rendered as
 * absolutely-positioned HTML + a small 2D canvas instead of Phaser text
 * objects, since the 3D view runs outside Phaser entirely.
 */
export class Hud3D {
  private root: HTMLDivElement;
  private speedEl: HTMLDivElement;
  private positionEl: HTMLDivElement;
  private lapEl: HTMLDivElement;
  private modeInfoEl: HTMLDivElement;
  private driftEl: HTMLDivElement;
  private nitroFill: HTMLDivElement;
  private countdownEl: HTMLDivElement;
  private minimapCanvas: HTMLCanvasElement;
  private minimapCtx: CanvasRenderingContext2D;
  private minimapScale = 1;
  private minimapWorldCenter = { x: 0, y: 0 };
  private minimapSize = 168;

  constructor(private parent: HTMLElement) {
    this.root = document.createElement('div');
    this.root.style.cssText = 'position:absolute; inset:0; pointer-events:none; z-index:15; font-family: \'Segoe UI\', Roboto, system-ui, sans-serif; color:' + CSS_COLORS.textPrimary + ';';
    parent.appendChild(this.root);

    const speedPanel = this.panel('left:20px; bottom:20px; width:190px; height:84px; display:flex; flex-direction:column; justify-content:center; padding-left:16px;');
    this.speedEl = document.createElement('div');
    this.speedEl.style.cssText = 'font-size:38px; font-weight:800; line-height:1;';
    this.speedEl.textContent = '0';
    const speedLabel = document.createElement('div');
    speedLabel.style.cssText = `font-size:12px; color:${CSS_COLORS.textMuted}; letter-spacing:0.08em; margin-top:2px;`;
    speedLabel.textContent = 'KM/H';
    speedPanel.append(this.speedEl, speedLabel);

    const nitroLabel = document.createElement('div');
    nitroLabel.style.cssText = `position:absolute; left:220px; bottom:96px; font-size:11px; letter-spacing:0.08em; color:${CSS_COLORS.textMuted};`;
    nitroLabel.textContent = 'NITRO';
    const nitroBar = document.createElement('div');
    nitroBar.style.cssText = 'position:absolute; left:220px; bottom:80px; width:110px; height:12px; border-radius:6px; background:rgba(255,255,255,0.12); overflow:hidden;';
    this.nitroFill = document.createElement('div');
    this.nitroFill.style.cssText = `width:100%; height:100%; background:#ff5f9d; transition: width 0.08s linear;`;
    nitroBar.appendChild(this.nitroFill);
    this.root.append(nitroLabel, nitroBar);

    const topCenter = document.createElement('div');
    topCenter.style.cssText = 'position:absolute; left:50%; top:16px; transform:translateX(-50%); text-align:center;';
    this.positionEl = document.createElement('div');
    this.positionEl.style.cssText = 'font-size:26px; font-weight:800;';
    this.positionEl.textContent = '1 / 1';
    this.lapEl = document.createElement('div');
    this.lapEl.style.cssText = `font-size:13px; color:${CSS_COLORS.textMuted}; margin-top:2px;`;
    this.lapEl.textContent = 'LAP 1 / 3';
    this.modeInfoEl = document.createElement('div');
    this.modeInfoEl.style.cssText = `font-size:13px; color:${CSS_COLORS.accentGold}; margin-top:2px;`;
    this.driftEl = document.createElement('div');
    this.driftEl.style.cssText = 'font-size:18px; font-weight:700; color:#7fdcff; margin-top:2px; display:none;';
    topCenter.append(this.positionEl, this.lapEl, this.modeInfoEl, this.driftEl);
    this.root.appendChild(topCenter);

    this.countdownEl = document.createElement('div');
    this.countdownEl.style.cssText = 'position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); font-size:88px; font-weight:800; text-shadow:0 4px 24px rgba(0,0,0,0.6); opacity:0; transition: opacity 0.3s;';
    this.root.appendChild(this.countdownEl);

    const mmWrap = this.panel(`right:20px; top:20px; width:${this.minimapSize}px; height:${this.minimapSize}px; border-radius:50%; overflow:hidden;`);
    this.minimapCanvas = document.createElement('canvas');
    this.minimapCanvas.width = this.minimapSize;
    this.minimapCanvas.height = this.minimapSize;
    this.minimapCanvas.style.cssText = 'width:100%; height:100%;';
    mmWrap.appendChild(this.minimapCanvas);
    this.minimapCtx = this.minimapCanvas.getContext('2d')!;
  }

  private panel(css: string): HTMLDivElement {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute; background:rgba(10,14,32,0.55); border:1px solid rgba(255,255,255,0.08); ${css}`;
    this.root.appendChild(el);
    return el;
  }

  setSpeed(kmh: number): void {
    this.speedEl.textContent = `${Math.max(0, Math.round(kmh))}`;
  }

  setPosition(pos: number, total: number): void {
    this.positionEl.textContent = `${ordinal(pos)} / ${total}`;
  }

  setLap(lap: number, totalLaps: number): void {
    this.lapEl.textContent = `LAP ${Math.min(lap, totalLaps)} / ${totalLaps}`;
  }

  setModeInfo(text: string): void {
    this.modeInfoEl.textContent = text;
  }

  setNitro(fraction: number): void {
    this.nitroFill.style.width = `${Math.max(0, Math.min(1, fraction)) * 100}%`;
  }

  setDriftScore(score: number | null): void {
    if (score === null) {
      this.driftEl.style.display = 'none';
      return;
    }
    this.driftEl.style.display = '';
    this.driftEl.textContent = `DRIFT +${Math.round(score)}`;
  }

  showCountdown(text: string): void {
    this.countdownEl.textContent = text;
    this.countdownEl.style.opacity = '1';
  }

  hideCountdown(): void {
    this.countdownEl.style.opacity = '0';
  }

  buildMinimap(geo: TrackGeometry): void {
    const ctx = this.minimapCtx;
    const size = this.minimapSize;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of geo.densePoints) {
      minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
    }
    const scale = (size * 0.42) / Math.max(maxX - minX, maxY - minY, 1);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    geo.densePoints.forEach((p, i) => {
      const x = size / 2 + (p.x - cx) * scale;
      const y = size / 2 + (p.y - cy) * scale;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();

    this.minimapScale = scale;
    this.minimapWorldCenter = { x: cx, y: cy };
    this.trackPoints = geo.densePoints;
  }

  private trackPoints: { x: number; y: number }[] = [];

  updateMinimapDots(vehicles: RaceVehicle3D[]): void {
    if (this.trackPoints.length === 0) return;
    const ctx = this.minimapCtx;
    const size = this.minimapSize;
    this.buildMinimapBase();
    for (const v of vehicles) {
      const x = size / 2 + (v.state.position.x - this.minimapWorldCenter.x) * this.minimapScale;
      const y = size / 2 + (v.state.position.y - this.minimapWorldCenter.y) * this.minimapScale;
      ctx.fillStyle = v.isPlayer ? CSS_COLORS.accentPrimary : v.isPolice ? '#ff4d5e' : CSS_COLORS.accentGold;
      ctx.beginPath();
      ctx.arc(x, y, v.isPlayer ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private buildMinimapBase(): void {
    const ctx = this.minimapCtx;
    const size = this.minimapSize;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    this.trackPoints.forEach((p, i) => {
      const x = size / 2 + (p.x - this.minimapWorldCenter.x) * this.minimapScale;
      const y = size / 2 + (p.y - this.minimapWorldCenter.y) * this.minimapScale;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
  }

  destroy(): void {
    this.root.remove();
  }
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
