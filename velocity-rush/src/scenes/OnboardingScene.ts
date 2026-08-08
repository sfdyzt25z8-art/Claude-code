import Phaser from 'phaser';
import { SceneKeys } from './SceneKeys';
import { saveManager } from '../save/SaveManager';
import { CSS_COLORS } from '../utils/Constants';
import type { SaveData } from '../save/SaveSchema';

type Gender = SaveData['profile']['gender'];

/**
 * First-launch driver setup — asks for a name and gender before the main
 * menu. Phaser has no native text input, so (like the 3D driving view) this
 * hides the Phaser canvas and builds a plain DOM overlay for the form,
 * restoring the canvas once the profile is saved.
 */
export class OnboardingScene extends Phaser.Scene {
  private overlay?: HTMLDivElement;

  constructor() {
    super(SceneKeys.Onboarding);
  }

  create(): void {
    const canvas = this.sys.game.canvas;
    canvas.style.visibility = 'hidden';
    const parent = canvas.parentElement ?? document.body;

    const overlay = document.createElement('div');
    overlay.style.cssText = `position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:radial-gradient(circle at 50% 30%, #12183a 0%, #05070f 70%); font-family:'Segoe UI',Roboto,system-ui,sans-serif; color:${CSS_COLORS.textPrimary};`;
    parent.appendChild(overlay);
    this.overlay = overlay;

    const card = document.createElement('div');
    card.style.cssText = 'width:min(92vw,420px); padding:32px; box-sizing:border-box;';
    overlay.appendChild(card);

    const title = document.createElement('div');
    title.textContent = 'WELCOME TO VELOCITY RUSH';
    title.style.cssText = 'font-size:22px; font-weight:800; letter-spacing:0.05em; margin-bottom:6px; text-align:center; background:linear-gradient(90deg,#ff5f6d,#ffc371,#7fdcff,#4facfe); -webkit-background-clip:text; background-clip:text; color:transparent;';
    card.appendChild(title);

    const subtitle = document.createElement('div');
    subtitle.textContent = "Set up your driver profile before you hit the grid.";
    subtitle.style.cssText = `font-size:14px; color:${CSS_COLORS.textMuted}; margin-bottom:26px; text-align:center;`;
    card.appendChild(subtitle);

    const nameLabel = document.createElement('div');
    nameLabel.textContent = 'DRIVER NAME';
    nameLabel.style.cssText = 'font-size:12px; letter-spacing:0.08em; color:#8fa0c8; margin-bottom:6px;';
    card.appendChild(nameLabel);

    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 18;
    input.placeholder = 'Enter your name';
    input.autocomplete = 'off';
    input.style.cssText = `width:100%; box-sizing:border-box; padding:12px 14px; font-size:16px; border-radius:8px; border:1px solid rgba(255,255,255,0.2); background:rgba(255,255,255,0.06); color:${CSS_COLORS.textPrimary}; margin-bottom:22px;`;
    card.appendChild(input);

    const genderLabel = document.createElement('div');
    genderLabel.textContent = 'GENDER';
    genderLabel.style.cssText = 'font-size:12px; letter-spacing:0.08em; color:#8fa0c8; margin-bottom:8px;';
    card.appendChild(genderLabel);

    const genderRow = document.createElement('div');
    genderRow.style.cssText = 'display:flex; gap:10px; margin-bottom:28px;';
    card.appendChild(genderRow);

    let selectedGender: Gender = 'unspecified';
    const genderOptions: [string, Gender][] = [['Male', 'male'], ['Female', 'female'], ["Prefer not to say", 'unspecified']];
    const genderButtons: HTMLButtonElement[] = [];
    const setGenderButtonStyle = (btn: HTMLButtonElement, active: boolean) => {
      btn.style.background = active ? CSS_COLORS.accentPrimary : 'rgba(255,255,255,0.06)';
      btn.style.borderColor = active ? CSS_COLORS.accentPrimary : 'rgba(255,255,255,0.2)';
      btn.style.color = active ? '#05070f' : CSS_COLORS.textPrimary;
    };
    genderOptions.forEach(([label, value]) => {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.style.cssText = 'flex:1; padding:10px 6px; font-size:13px; font-weight:600; border-radius:8px; border:1px solid rgba(255,255,255,0.2); cursor:pointer;';
      btn.addEventListener('click', () => {
        selectedGender = value;
        genderButtons.forEach((b) => setGenderButtonStyle(b, false));
        setGenderButtonStyle(btn, true);
      });
      genderButtons.push(btn);
      genderRow.appendChild(btn);
    });
    setGenderButtonStyle(genderButtons[2], true);

    const startBtn = document.createElement('button');
    startBtn.textContent = 'START RACING';
    startBtn.style.cssText = `width:100%; padding:14px; font-size:16px; font-weight:800; letter-spacing:0.04em; border:none; border-radius:8px; background:${CSS_COLORS.accentPrimary}; color:#05070f; cursor:pointer;`;
    card.appendChild(startBtn);

    const submit = () => {
      const name = input.value.trim().slice(0, 18) || 'Racer';
      saveManager.mutate((d) => {
        d.profile.name = name;
        d.profile.gender = selectedGender;
        d.profile.onboarded = true;
      });
      this.scene.start(SceneKeys.MainMenu);
    };
    startBtn.addEventListener('click', submit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submit();
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.teardown());
    setTimeout(() => input.focus(), 50);
  }

  private teardown(): void {
    this.overlay?.remove();
    this.overlay = undefined;
    this.sys.game.canvas.style.visibility = 'visible';
  }
}
