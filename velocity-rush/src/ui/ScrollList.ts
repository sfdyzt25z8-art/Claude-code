import Phaser from 'phaser';

/**
 * A vertically scrollable viewport. Add children to `.content` at whatever
 * y-offsets you like; call `setContentHeight()` once layout is known. Supports
 * mouse wheel, click-drag, and touch-drag scrolling.
 */
export class ScrollList extends Phaser.GameObjects.Container {
  readonly content: Phaser.GameObjects.Container;
  private viewportW: number;
  private viewportH: number;
  private contentHeight = 0;
  private scrollY = 0;
  private dragStartY = 0;
  private scrollStartY = 0;
  private dragging = false;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    super(scene, x, y);
    this.viewportW = width;
    this.viewportH = height;

    const hitZone = scene.add.zone(0, 0, width, height).setOrigin(0, 0).setInteractive({ draggable: true });
    this.content = scene.add.container(0, 0);

    const maskShape = scene.make.graphics({ x, y }).fillRect(0, 0, width, height);
    const mask = maskShape.createGeometryMask();
    this.content.setMask(mask);

    this.add([hitZone, this.content]);

    hitZone.on('dragstart', (pointer: Phaser.Input.Pointer) => {
      this.dragging = true;
      this.dragStartY = pointer.y;
      this.scrollStartY = this.scrollY;
    });
    hitZone.on('drag', (pointer: Phaser.Input.Pointer) => {
      if (!this.dragging) return;
      const delta = pointer.y - this.dragStartY;
      this.setScroll(this.scrollStartY + delta);
    });
    hitZone.on('dragend', () => {
      this.dragging = false;
    });
    hitZone.on('wheel', (_p: unknown, _dx: number, dy: number) => {
      this.setScroll(this.scrollY - dy * 0.6);
    });

    scene.add.existing(this);
    this.once(Phaser.GameObjects.Events.DESTROY, () => maskShape.destroy());
  }

  setContentHeight(height: number): void {
    this.contentHeight = height;
    this.setScroll(this.scrollY);
  }

  private setScroll(y: number): void {
    const minScroll = Math.min(0, this.viewportH - this.contentHeight);
    this.scrollY = Phaser.Math.Clamp(y, minScroll, 0);
    this.content.y = this.scrollY;
  }

  scrollToTop(): void {
    this.setScroll(0);
  }
}
