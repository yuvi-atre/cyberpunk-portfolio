import Phaser from 'phaser';
import { EventBus, GameEvents } from '../EventBus';

const RUN_SPEED = 175;
const JUMP_VELOCITY = -480;
const DASH_SPEED = 420;
const DASH_MS = 220;
const DASH_COOLDOWN_MS = 700;
const SHOOT_COOLDOWN_MS = 260;

/** Shoulder pivot offset from the sprite center (body faces right). */
const SHOULDER_X = -7;
const SHOULDER_Y = 0;
/** Muzzle offset from the shoulder pivot in unrotated arm-texture space. */
const MUZZLE_DX = 23;
const MUZZLE_DY = -2.5;

/**
 * Kinematic player controller on Arcade Physics driving the CraftPix Biker
 * gun rig: an armless body sheet from the guns pack plus a separate arm+gun
 * sprite pivoted at the shoulder that aims at the pointer (flipY keeps the
 * pistol upright when aiming left). Reads native keyboard input and
 * synthesized mobile input from the EventBus through the same abstraction.
 * Supports run, jump, double jump, dash (SHIFT) and shooting (CLICK).
 * Firing itself is delegated to the scene: the player owns the rig and the
 * trigger, the scene owns the hitscan laser and its consequences.
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA: Phaser.Input.Keyboard.Key;
  private keyD: Phaser.Input.Keyboard.Key;
  private keyW: Phaser.Input.Keyboard.Key;

  private arm: Phaser.GameObjects.Sprite;
  private fire: (mx: number, my: number, angle: number) => void;
  private aimAngle = 0;
  private recoil = 0;
  private shootReadyAt = 0;

  private uiMove: -1 | 0 | 1 = 0;
  private uiJump = false;
  private jumpHeld = false;
  private airJumpUsed = false;
  private dashUntil = 0;
  private dashReadyAt = 0;
  public inputLocked = false;

  private onUiMove = (dir: -1 | 0 | 1) => (this.uiMove = dir);
  private onUiJump = (down: boolean) => (this.uiJump = down);
  private onUiShoot = () => this.shootForward();
  private onModal = (open: boolean) => {
    this.inputLocked = open;
    if (open) this.uiMove = 0;
  };

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    fire: (mx: number, my: number, angle: number) => void
  ) {
    super(scene, x, y, 'biker-idle', 0);
    this.fire = fire;
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // the art fills ~30px of the 48px frame; feet sit on the frame's bottom
    // edge, so the body hugs the sprite bottom to keep 32px tile clearance
    this.setSize(14, 30).setOffset(17, 18);
    this.setCollideWorldBounds(true);
    this.setDepth(20);

    this.arm = scene.add.sprite(x, y, 'arm-gun');
    this.arm.setOrigin(14 / 48, 16 / 32); // shoulder pixel of the composite
    this.arm.setDepth(21);

    if (scene.game.renderer.type === Phaser.WEBGL) {
      this.setPipeline('Light2D');
      this.arm.setPipeline('Light2D');
    }

    const kb = scene.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    this.keyA = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = kb.addKey(Phaser.Input.Keyboard.KeyCodes.W);

    EventBus.on(GameEvents.UI_MOVE, this.onUiMove);
    EventBus.on(GameEvents.UI_JUMP, this.onUiJump);
    EventBus.on(GameEvents.UI_SHOOT, this.onUiShoot);
    EventBus.on(GameEvents.UI_MODAL_STATE, this.onModal);
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      EventBus.off(GameEvents.UI_MOVE, this.onUiMove);
      EventBus.off(GameEvents.UI_JUMP, this.onUiJump);
      EventBus.off(GameEvents.UI_SHOOT, this.onUiShoot);
      EventBus.off(GameEvents.UI_MODAL_STATE, this.onModal);
      this.arm.destroy();
    });
  }

  /** World position of the shoulder pivot. */
  private shoulder(): { x: number; y: number } {
    return {
      x: this.x + (this.flipX ? -SHOULDER_X : SHOULDER_X),
      y: this.y + SHOULDER_Y,
    };
  }

  /** Fire toward an arbitrary world point (mouse / touch aim). */
  shootAt(wx: number, wy: number): void {
    if (this.inputLocked) return;
    const now = this.scene.time.now;
    if (now < this.shootReadyAt) return;
    this.shootReadyAt = now + SHOOT_COOLDOWN_MS;

    const s = this.shoulder();
    const angle = Math.atan2(wy - s.y, wx - s.x);
    this.aimAngle = angle;
    this.recoil = 0.14;

    const flipY = Math.abs(angle) > Math.PI / 2;
    const mdy = flipY ? -MUZZLE_DY : MUZZLE_DY;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const mx = s.x + MUZZLE_DX * cos - mdy * sin;
    const my = s.y + MUZZLE_DX * sin + mdy * cos;

    // muzzle flash sprite + a transient light pop; the scene draws the beam
    const flash = this.scene.add
      .sprite(mx, my, 'muzzle-flash')
      .setRotation(angle)
      .setDepth(22);
    flash.play('muzzle-pop');
    flash.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => flash.destroy());
    if (this.scene.game.renderer.type === Phaser.WEBGL) {
      const light = this.scene.lights.addLight(mx, my, 110, 0x7df9ff, 1.1);
      this.scene.time.delayedCall(70, () => this.scene.lights.removeLight(light));
    }

    this.fire(mx, my, angle);
  }

  /** Mobile shoot button: fire level in the facing direction. */
  private shootForward(): void {
    const s = this.shoulder();
    this.shootAt(s.x + (this.flipX ? -100 : 100), s.y);
  }

  updatePlayer(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const now = this.scene.time.now;

    if (this.inputLocked) {
      this.setVelocityX(0);
      this.anims.play('p-idle', true);
      this.updateArm(now, true);
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
      this.updateArm(now, false);
      return;
    }

    if (left && !right) {
      this.setVelocityX(-RUN_SPEED);
      this.setFlipX(true);
    } else if (right && !left) {
      this.setVelocityX(RUN_SPEED);
      this.setFlipX(false);
    } else {
      this.setVelocityX(0);
    }

    const grounded = body.blocked.down;
    if (grounded) this.airJumpUsed = false;

    if (jumpPressed) {
      if (grounded) {
        this.setVelocityY(JUMP_VELOCITY);
        this.anims.play('p-jump', true);
      } else if (!this.airJumpUsed) {
        this.airJumpUsed = true;
        this.setVelocityY(JUMP_VELOCITY * 0.88);
        this.anims.play('p-double', true);
      }
    }

    // animation priority: airborne > run > idle
    const current = this.anims.currentAnim?.key;
    if (!grounded) {
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

    this.updateArm(now, false);
  }

  /** Aim the arm at the pointer; hide it during armed-body animations. */
  private updateArm(now: number, idle: boolean): void {
    // dash/double-jump sheets come from the melee pack and include arms
    const current = this.anims.currentAnim?.key;
    const armed = current === 'p-dash' || current === 'p-double';
    this.arm.setVisible(!armed);
    if (armed) return;

    const s = this.shoulder();
    if (!idle) {
      const cam = this.scene.cameras.main;
      const p = this.scene.input.activePointer.positionToCamera(cam) as Phaser.Math.Vector2;
      this.aimAngle = Math.atan2(p.y - s.y, p.x - s.x);
    }
    void now;
    this.recoil = Math.max(0, this.recoil - 0.012);
    const flipY = Math.abs(this.aimAngle) > Math.PI / 2;
    // standing still: square the body up with the aim direction
    if (!idle && (this.body as Phaser.Physics.Arcade.Body).velocity.x === 0) {
      this.setFlipX(flipY);
    }
    const kick = flipY ? this.recoil : -this.recoil;
    this.arm.setFlipY(flipY);
    this.arm.setPosition(s.x, s.y);
    this.arm.setRotation(this.aimAngle + kick);
  }
}
