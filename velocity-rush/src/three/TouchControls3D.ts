import type { TouchState } from '../ui/TouchControls';
import { CSS_COLORS } from '../utils/Constants';

const MAX_WHEEL_ROTATION_DEG = 150; // matches TouchControls' lock-to-lock feel

/**
 * DOM/CSS on-screen controls for the 3D driving view — visually matches the
 * Phaser touch steering wheel (grab-anywhere-on-the-rim, twist, spring back
 * on release) plus gas/brake/handbrake/nitro buttons, but built from native
 * elements + pointer events since the 3D view runs outside Phaser's canvas
 * and input system.
 */
export class TouchControls3D {
  readonly state: TouchState = { throttle: 0, steer: 0, handbrake: false, nitro: false };
  private root: HTMLDivElement;
  private wheel: HTMLDivElement;
  private wheelCenter = { x: 0, y: 0 };
  private wheelPointerId: number | null = null;
  private grabAngleDeg = 0;
  private grabRotationDeg = 0;
  private currentRotationDeg = 0;
  private springFrame: number | null = null;

  constructor(private parent: HTMLElement) {
    this.root = document.createElement('div');
    this.root.style.cssText = 'position:absolute; inset:0; pointer-events:none; z-index:20; touch-action:none;';
    parent.appendChild(this.root);

    this.wheel = this.buildWheel();
    this.buildButton('GAS', '10%', '16%', 64, CSS_COLORS.accentPrimary, 'throttle', 1);
    this.buildButton('BRAKE', '10%', '38%', 54, CSS_COLORS.accentSecondary, 'throttle', -1);
    this.buildButton('E-BRAKE', '32%', '8%', 50, CSS_COLORS.accentGold, 'handbrake', 1);
    this.buildButton('NITRO', '32%', '30%', 58, '#ff5f9d', 'nitro', 1);

    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);
  }

  private buildWheel(): HTMLDivElement {
    const base = document.createElement('div');
    base.style.cssText = `
      position: absolute; left: 20px; bottom: 20px; width: 164px; height: 164px;
      border-radius: 50%; background: rgba(0,0,0,0.32); pointer-events: auto; touch-action: none;
    `;
    const wheel = document.createElement('div');
    wheel.style.cssText = 'position:absolute; inset:8px; border-radius:50%; will-change: transform;';
    wheel.innerHTML = `
      <svg viewBox="0 0 148 148" width="100%" height="100%">
        <circle cx="74" cy="74" r="62" fill="none" stroke="${CSS_COLORS.textPrimary}" stroke-width="12" opacity="0.85" />
        <circle cx="74" cy="74" r="24" fill="#171d42" stroke="${CSS_COLORS.textPrimary}" stroke-width="3" />
        <rect x="70" y="10" width="8" height="20" rx="3" fill="${CSS_COLORS.accentSecondary}" />
        <line x1="74" y1="40" x2="74" y2="60" stroke="${CSS_COLORS.textPrimary}" stroke-width="10" />
        <line x1="30" y1="98" x2="55" y2="82" stroke="${CSS_COLORS.textPrimary}" stroke-width="10" />
        <line x1="118" y1="98" x2="93" y2="82" stroke="${CSS_COLORS.textPrimary}" stroke-width="10" />
      </svg>
    `;
    base.appendChild(wheel);
    this.root.appendChild(base);

    const updateCenter = () => {
      const r = base.getBoundingClientRect();
      this.wheelCenter = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    };
    updateCenter();
    window.addEventListener('resize', updateCenter);

    base.addEventListener('pointerdown', (e) => {
      if (this.wheelPointerId !== null) return;
      updateCenter();
      base.setPointerCapture(e.pointerId);
      this.wheelPointerId = e.pointerId;
      if (this.springFrame !== null) cancelAnimationFrame(this.springFrame);
      this.grabAngleDeg = this.angleToDeg(e.clientX, e.clientY);
      this.grabRotationDeg = this.currentRotationDeg;
    });

    return wheel;
  }

  private angleToDeg(x: number, y: number): number {
    return (Math.atan2(y - this.wheelCenter.y, x - this.wheelCenter.x) * 180) / Math.PI;
  }

  private onPointerMove = (e: PointerEvent): void => {
    if (this.wheelPointerId !== e.pointerId) return;
    let delta = this.angleToDeg(e.clientX, e.clientY) - this.grabAngleDeg;
    while (delta > 180) delta -= 360;
    while (delta < -180) delta += 360;
    const rotation = clamp(this.grabRotationDeg + delta, -MAX_WHEEL_ROTATION_DEG, MAX_WHEEL_ROTATION_DEG);
    this.setRotation(rotation);
    this.state.steer = clamp(rotation / MAX_WHEEL_ROTATION_DEG, -1, 1);
  };

  private onPointerUp = (e: PointerEvent): void => {
    if (this.wheelPointerId !== e.pointerId) return;
    this.wheelPointerId = null;
    this.state.steer = 0;
    this.springBack();
  };

  private setRotation(deg: number): void {
    this.currentRotationDeg = deg;
    this.wheel.style.transform = `rotate(${deg}deg)`;
  }

  private springBack(): void {
    const step = () => {
      const next = this.currentRotationDeg * 0.78;
      if (Math.abs(next) < 0.5) {
        this.setRotation(0);
        this.springFrame = null;
        return;
      }
      this.setRotation(next);
      this.springFrame = requestAnimationFrame(step);
    };
    if (this.springFrame !== null) cancelAnimationFrame(this.springFrame);
    this.springFrame = requestAnimationFrame(step);
  }

  private buildButton(label: string, right: string, bottom: string, size: number, color: string, field: 'throttle' | 'handbrake' | 'nitro', onValue: number): void {
    const btn = document.createElement('div');
    btn.textContent = label;
    btn.style.cssText = `
      position: absolute; right: ${right}; bottom: ${bottom}; width: ${size}px; height: ${size}px;
      transform: translate(50%, 50%); border-radius: 50%; display: flex; align-items: center; justify-content: center;
      background: ${hexToRgba(color, 0.35)}; border: 2px solid rgba(255,255,255,0.4); color: ${CSS_COLORS.textPrimary};
      font: 700 12px 'Segoe UI', Roboto, sans-serif; letter-spacing: 0.03em; user-select: none;
      pointer-events: auto; touch-action: none;
    `;
    this.root.appendChild(btn);

    const setActive = (active: boolean) => {
      btn.style.background = hexToRgba(color, active ? 0.8 : 0.35);
      if (field === 'handbrake') this.state.handbrake = active;
      else if (field === 'nitro') this.state.nitro = active;
      else this.state.throttle = active ? onValue : this.state.throttle === onValue ? 0 : this.state.throttle;
    };
    btn.addEventListener('pointerdown', (e) => {
      btn.setPointerCapture(e.pointerId);
      setActive(true);
    });
    btn.addEventListener('pointerup', () => setActive(false));
    btn.addEventListener('pointercancel', () => setActive(false));
  }

  setVisible(visible: boolean): void {
    this.root.style.display = visible ? '' : 'none';
  }

  destroy(): void {
    if (this.springFrame !== null) cancelAnimationFrame(this.springFrame);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
    this.root.remove();
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
