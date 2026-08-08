import type { TouchState } from '../ui/TouchControls';
import { CSS_COLORS } from '../utils/Constants';

const MAX_WHEEL_ROTATION_DEG = 150; // matches TouchControls' lock-to-lock feel

/**
 * DOM/CSS on-screen controls for the 3D driving view — an F1-style steering
 * wheel (grab-anywhere-on-the-rim, twist, spring back on release) plus real
 * gas/brake pedals (press-and-depress, not round buttons) and small
 * handbrake/nitro buttons. Built from native elements + pointer events since
 * the 3D view runs outside Phaser's canvas and input system. Sized and
 * positioned with generous touch targets for tablets (iPad) as well as
 * phones.
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
    this.buildPedal('BRAKE', 128, CSS_COLORS.accentSecondary, 'throttle', -1);
    this.buildPedal('GAS', 24, CSS_COLORS.accentPrimary, 'throttle', 1);
    this.buildButton('E-BRK', '158px', '210px', 48, CSS_COLORS.accentGold, 'handbrake', 1);
    this.buildButton('NITRO', '60px', '220px', 52, '#ff5f9d', 'nitro', 1);

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
    // Flat-bottom F1-style wheel: thick rim (open at the bottom), central digital-readout hub, two paddle-ish spokes.
    wheel.innerHTML = `
      <svg viewBox="0 0 148 148" width="100%" height="100%">
        <path d="M 20 96 A 54 54 0 1 1 128 96" fill="none" stroke="${CSS_COLORS.textPrimary}" stroke-width="13" stroke-linecap="round" opacity="0.9" />
        <line x1="20" y1="96" x2="20" y2="108" stroke="${CSS_COLORS.textPrimary}" stroke-width="13" stroke-linecap="round" opacity="0.9" />
        <line x1="128" y1="96" x2="128" y2="108" stroke="${CSS_COLORS.textPrimary}" stroke-width="13" stroke-linecap="round" opacity="0.9" />
        <rect x="46" y="58" width="56" height="32" rx="6" fill="#171d42" stroke="${CSS_COLORS.accentPrimary}" stroke-width="2" />
        <rect x="70" y="10" width="8" height="18" rx="3" fill="${CSS_COLORS.accentSecondary}" />
        <line x1="74" y1="40" x2="74" y2="58" stroke="${CSS_COLORS.textPrimary}" stroke-width="9" />
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

  /** A real gas/brake pedal: a foot-pad you press, which visibly depresses and brightens — not a round button. */
  private buildPedal(label: string, right: number, color: string, field: 'throttle', onValue: number): void {
    const wrap = document.createElement('div');
    wrap.style.cssText = `position:absolute; right:${right}px; bottom:24px; width:88px; height:170px; pointer-events:auto; touch-action:none;`;
    this.root.appendChild(wrap);

    // The pivot arm below the pad, like a real pedal box — purely cosmetic.
    const arm = document.createElement('div');
    arm.style.cssText = 'position:absolute; left:50%; bottom:-10px; width:14px; height:24px; transform:translateX(-50%); background:rgba(20,22,30,0.8); border-radius:0 0 6px 6px;';
    wrap.appendChild(arm);

    const pad = document.createElement('div');
    pad.style.cssText = `
      position:absolute; inset:0; border-radius:16px;
      background: linear-gradient(180deg, ${hexToRgba(color, 0.55)}, ${hexToRgba(color, 0.25)});
      border: 2px solid rgba(255,255,255,0.35);
      box-shadow: 0 7px 0 rgba(0,0,0,0.5), inset 0 2px 8px rgba(255,255,255,0.18);
      display: flex; align-items: flex-end; justify-content: center; padding-bottom: 16px; box-sizing: border-box;
      transition: transform 0.05s ease, box-shadow 0.05s ease;
    `;
    const text = document.createElement('div');
    text.textContent = label;
    text.style.cssText = `color:${CSS_COLORS.textPrimary}; font:800 13px 'Segoe UI', Roboto, sans-serif; letter-spacing:0.05em; user-select:none;`;
    pad.appendChild(text);
    wrap.appendChild(pad);

    const setActive = (active: boolean) => {
      pad.style.transform = active ? 'translateY(9px)' : 'translateY(0)';
      pad.style.boxShadow = active
        ? '0 2px 0 rgba(0,0,0,0.5), inset 0 2px 12px rgba(255,255,255,0.3)'
        : '0 7px 0 rgba(0,0,0,0.5), inset 0 2px 8px rgba(255,255,255,0.18)';
      this.state.throttle = active ? onValue : this.state.throttle === onValue ? 0 : this.state.throttle;
    };
    wrap.addEventListener('pointerdown', (e) => {
      wrap.setPointerCapture(e.pointerId);
      setActive(true);
    });
    wrap.addEventListener('pointerup', () => setActive(false));
    wrap.addEventListener('pointercancel', () => setActive(false));
  }

  private buildButton(label: string, right: string, bottom: string, size: number, color: string, field: 'throttle' | 'handbrake' | 'nitro', onValue: number): void {
    const btn = document.createElement('div');
    btn.textContent = label;
    btn.style.cssText = `
      position: absolute; right: ${right}; bottom: ${bottom}; width: ${size}px; height: ${size}px;
      transform: translate(50%, 50%); border-radius: 50%; display: flex; align-items: center; justify-content: center;
      background: ${hexToRgba(color, 0.35)}; border: 2px solid rgba(255,255,255,0.4); color: ${CSS_COLORS.textPrimary};
      font: 700 11px 'Segoe UI', Roboto, sans-serif; letter-spacing: 0.03em; user-select: none; text-align: center;
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
