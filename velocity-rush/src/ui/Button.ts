import Phaser from 'phaser';
import { COLORS } from '../utils/Constants';
import { FONT } from './Theme';
import { audioManager } from '../audio/AudioManager';

export interface ButtonOptions {
  width?: number;
  height?: number;
  fill?: number;
  hoverFill?: number;
  textStyle?: Phaser.Types.GameObjects.Text.TextStyle;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

const VARIANT_FILL: Record<NonNullable<ButtonOptions['variant']>, number> = {
  primary: COLORS.accentPrimary,
  secondary: COLORS.bgPanelLight,
  danger: COLORS.danger,
  ghost: COLORS.bgPanel,
};

/**
 * A reusable, theme-consistent button: rounded rect background + label,
 * with hover/press feedback and click SFX. Works identically for mouse,
 * touch, and (via scene-level focus navigation) gamepad-driven menus.
 */
export class Button extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private opts: Required<Pick<ButtonOptions, 'width' | 'height' | 'variant'>>;
  private disabled: boolean;

  constructor(scene: Phaser.Scene, x: number, y: number, text: string, onClick: () => void, options: ButtonOptions = {}) {
    super(scene, x, y);
    this.opts = {
      width: options.width ?? 220,
      height: options.height ?? 56,
      variant: options.variant ?? 'primary',
    };
    this.disabled = options.disabled ?? false;

    this.bg = scene.add.graphics();
    this.label = scene.add.text(0, 0, text, options.textStyle ?? FONT.button).setOrigin(0.5);
    this.add([this.bg, this.label]);
    this.redraw(false);

    this.setSize(this.opts.width, this.opts.height);
    this.setInteractive({ useHandCursor: true });

    this.on('pointerover', () => !this.disabled && this.redraw(true));
    this.on('pointerout', () => this.redraw(false));
    this.on('pointerdown', () => {
      if (this.disabled) return;
      this.setScale(0.96);
      audioManager.uiClick();
    });
    this.on('pointerup', () => {
      if (this.disabled) return;
      this.setScale(1);
      onClick();
    });

    scene.add.existing(this);
  }

  private redraw(hover: boolean): void {
    const { width, height, variant } = this.opts;
    const base = VARIANT_FILL[variant];
    this.bg.clear();
    this.bg.fillStyle(base, this.disabled ? 0.35 : hover ? 1 : 0.88);
    this.bg.fillRoundedRect(-width / 2, -height / 2, width, height, height / 2.6);
    if (!this.disabled) {
      this.bg.lineStyle(2, 0xffffff, hover ? 0.5 : 0.18);
      this.bg.strokeRoundedRect(-width / 2, -height / 2, width, height, height / 2.6);
    }
    this.label.setAlpha(this.disabled ? 0.5 : 1);
  }

  setText(text: string): this {
    this.label.setText(text);
    return this;
  }

  setDisabled(disabled: boolean): this {
    this.disabled = disabled;
    this.disableInteractive();
    if (!disabled) this.setInteractive({ useHandCursor: true });
    this.redraw(false);
    return this;
  }
}
