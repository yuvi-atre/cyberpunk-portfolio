import Phaser from 'phaser';
import { EventBus, GameEvents } from '../EventBus';
import { TILE_SIZE, Tile } from '../world/Tiles';
import type { ChunkManager } from '../world/ChunkManager';

const RUN_SPEED = 175;
const JUMP_VELOCITY = -480;
const SWIM_VELOCITY = -160;
const DASH_SPEED = 420;
const DASH_MS = 220;
const DASH_COOLDOWN_MS = 700;

/**
 * Kinematic player controller on Arcade Physics driving the CraftPix Punk
 * (48x48 frames, ~30px-tall body). Reads native keyboard input and
 * synthesized mobile input from the EventBus through the same abstraction,
 * so gameplay logic is hardware-agnostic. Supports run, jump, double jump,
 * dash (SHIFT) and an attack flourish when breaking blocks.
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA: Phaser.Input.Keyboard.Key;
  private keyD: Phaser.Input.Keyboard.Key;
  private keyW: Phaser.Input.Keyboard.Key;

  private uiMove: -1 | 0 | 1 = 0;
  private uiJump = false;
  private jumpHeld = false;
  private airJumpUsed = false;
  private dashUntil = 0;
  private dashReadyAt = 0;
  private attackUntil = 0;
  public inputLocked = false;
  public inCoolant = false;

  private onUiMove = (dir: -1 | 0 | 1) => (this.uiMove = dir);
  private onUiJump = (down: boolean) => (this.uiJump = down);
  private onModal = (open: boolean) => {
    this.inputLocked = open;
    if (open) this.uiMove = 0;
  };

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'punk-idle', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // the art fills ~30px of the 48px frame; feet sit on the frame's bottom
    // edge, so the body hugs the sprite bottom to keep 32px tile clearance
    this.setSize(14, 30).setOffset(17, 18);
    this.setCollideWorldBounds(true);
    this.setDepth(20);
    if (scene.game.renderer.type === Phaser.WEBGL) this.setPipeline('Light2D');

    const kb = scene.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    this.keyA = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = kb.addKey(Phaser.Input.Keyboard.KeyCodes.W);

    EventBus.on(GameEvents.UI_MOVE, this.onUiMove);
    EventBus.on(GameEvents.UI_JUMP, this.onUiJump);
    EventBus.on(GameEvents.UI_MODAL_STATE, this.onModal);
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      EventBus.off(GameEvents.UI_MOVE, this.onUiMove);
      EventBus.off(GameEvents.UI_JUMP, this.onUiJump);
      EventBus.off(GameEvents.UI_MODAL_STATE, this.onModal);
    });
  }

  /** Attack flourish shown while breaking a block. */
  playAttack(): void {
    this.attackUntil = this.scene.time.now + 340;
    this.anims.play('p-attack', true);
  }

  updatePlayer(chunks: ChunkManager): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const now = this.scene.time.now;

    // coolant check at body center — swimming softens gravity and allows float
    const tx = Math.floor(this.x / TILE_SIZE);
    const ty = Math.floor((this.y + 8) / TILE_SIZE);
    this.inCoolant = chunks.getTile(tx, ty) === Tile.COOLANT;
    body.setAllowGravity(true);
    if (this.inCoolant) {
      body.velocity.y = Math.min(body.velocity.y, 70);
    }

    if (this.inputLocked) {
      this.setVelocityX(0);
      this.anims.play('p-idle', true);
      return;
    }

    const left = this.cursors.left.isDown || this.keyA.isDown || this.uiMove === -1;
    const right = this.cursors.right.isDown || this.keyD.isDown || this.uiMove === 1;
    const jumpDown =
      this.cursors.up.isDown || this.cursors.space.isDown || this.keyW.isDown || this.uiJump;
    const jumpPressed = jumpDown && !this.jumpHeld;
    this.jumpHeld = jumpDown;

    const dashing = now < this.dashUntil;

    // dash: SHIFT while moving — a short burst that ignores steering
    if (!dashing && this.cursors.shift.isDown && now >= this.dashReadyAt && (left || right)) {
      this.dashUntil = now + DASH_MS;
      this.dashReadyAt = now + DASH_COOLDOWN_MS;
      this.setFlipX(left);
      this.anims.play('p-dash', true);
    }

    if (now < this.dashUntil) {
      this.setVelocityX(this.flipX ? -DASH_SPEED : DASH_SPEED);
      body.velocity.y = Math.min(body.velocity.y, 0);
      return;
    }

    if (left && !right) {
      this.setVelocityX(this.inCoolant ? -RUN_SPEED * 0.6 : -RUN_SPEED);
      this.setFlipX(true);
    } else if (right && !left) {
      this.setVelocityX(this.inCoolant ? RUN_SPEED * 0.6 : RUN_SPEED);
      this.setFlipX(false);
    } else {
      this.setVelocityX(0);
    }

    const grounded = body.blocked.down;
    if (grounded) this.airJumpUsed = false;

    if (this.inCoolant) {
      if (jumpDown) this.setVelocityY(SWIM_VELOCITY);
    } else if (jumpPressed) {
      if (grounded) {
        this.setVelocityY(JUMP_VELOCITY);
        this.anims.play('p-jump', true);
      } else if (!this.airJumpUsed) {
        this.airJumpUsed = true;
        this.setVelocityY(JUMP_VELOCITY * 0.88);
        this.anims.play('p-double', true);
      }
    }

    // animation priority: attack flourish > airborne > run > idle
    if (now < this.attackUntil) return;
    const current = this.anims.currentAnim?.key;
    if (!grounded && !this.inCoolant) {
      // let jump/double-jump bursts finish, then hold the fall loop
      if (current !== 'p-jump' && current !== 'p-double') {
        this.anims.play('p-fall', true);
      } else if (!this.anims.isPlaying) {
        this.anims.play('p-fall', true);
      }
    } else if (body.velocity.x !== 0) {
      this.anims.play('p-run', true);
    } else {
      this.anims.play('p-idle', true);
    }
  }
}
