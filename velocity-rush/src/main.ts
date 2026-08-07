import Phaser from 'phaser';
import { createGameConfig } from './engine/GameConfig';
import './save/SaveManager';
import './save/SettingsManager';

const fallback = document.getElementById('boot-fallback');

const game = new Phaser.Game(createGameConfig('app'));
if (import.meta.env.DEV) (window as unknown as { __VR_QA__: Phaser.Game }).__VR_QA__ = game;

game.events.once(Phaser.Core.Events.READY, () => {
  fallback?.remove();
});

// Keep the canvas crisp across orientation/resize changes on mobile.
// (PWA service worker registration is injected automatically by vite-plugin-pwa.)
window.addEventListener('resize', () => {
  game.scale.refresh();
});
