import Phaser from 'phaser';
import type { Experience, Project, Sign, Skill } from '../services/PortfolioService';

/**
 * The sole intermediary broker between the React DOM layer and the Phaser
 * game loop. Neither side may hold a direct reference to the other's
 * internals — all cross-boundary communication flows through these events.
 */
export const EventBus = new Phaser.Events.EventEmitter();

/** Phaser -> React */
export interface GameToUIEvents {
  'scene-ready': void;
  'dialogue-open': Experience;
  'project-open': Project;
  'sign-open': Sign;
  'chest-open': void;
  'skill-collected': Skill;
  'interact-hint': string | null;
  'player-depth': number;
}

/** React -> Phaser */
export interface UIToGameEvents {
  'ui-move': -1 | 0 | 1;
  'ui-jump': boolean;
  'ui-interact': void;
  'ui-modal-state': boolean;
}

export const GameEvents = {
  SCENE_READY: 'scene-ready',
  DIALOGUE_OPEN: 'dialogue-open',
  PROJECT_OPEN: 'project-open',
  SIGN_OPEN: 'sign-open',
  CHEST_OPEN: 'chest-open',
  SKILL_COLLECTED: 'skill-collected',
  INTERACT_HINT: 'interact-hint',
  PLAYER_DEPTH: 'player-depth',
  UI_MOVE: 'ui-move',
  UI_JUMP: 'ui-jump',
  UI_INTERACT: 'ui-interact',
  UI_MODAL_STATE: 'ui-modal-state',
} as const;
