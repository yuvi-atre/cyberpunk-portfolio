import Phaser from 'phaser';
import { EventBus, GameEvents } from '../EventBus';
import { TILE_SIZE, Tile } from '../world/Tiles';
import type { ChunkManager } from '../world/ChunkManager';

const RUN_SPEED = 130;
const JUMP_VELOCITY = -330;
const SWIM_VELOCITY = -120;

/**
 * Kinematic player controller on Arcade Physics. Reads native keyboard
 * input and synthesized mobile input from the EventBus through the same
 * abstraction, so gameplay logic is hardware-agnostic.
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA: Phaser.Input.Keyboard.Key;
  private keyD: Phaser.Input.Keyboard.Key;
  private keyW: Phaser.Input.Keyboard.Key;

  private uiMove: -1 | 0 | 1 = 0;
  private uiJump = false;
  public inputLocked = false;
  public inWater = false;

  private onUiMove = (dir: -1 | 0 | 1) => (this.uiMove = dir);
  private onUiJump = (down: boolean) => (this.uiJump = down);
  private onModal = (open: boolean) => {
    this.inputLocked = open;
    if (open) this.uiMove = 0;
  };

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setSize(10, 22).setOffset(3, 2);
    this.setCollideWorldBounds(true);
    this.setDepth(20);
    if (scene.game.renderer.type === Phaser.WEBGL) this.setPipeline('Light2D');

    const kb = scene.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    this.keyA = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = kb.addKey(Phaser.Input.Keyboard.KeyCodes.W);

    if (!scene.anims.exists('player-walk')) {
      scene.anims.create({
        key: 'player-walk',
        frames: [1, 2, 3, 2].map((f) => ({ key: 'player', frame: f })),
        frameRate: 8,
        repeat: -1,
      });
      scene.anims.create({
        key: 'player-idle',
        frames: [{ key: 'player', frame: 0 }],
      });
    }

    EventBus.on(GameEvents.UI_MOVE, this.onUiMove);
    EventBus.on(GameEvents.UI_JUMP, this.onUiJump);
    EventBus.on(GameEvents.UI_MODAL_STATE, this.onModal);
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      EventBus.off(GameEvents.UI_MOVE, this.onUiMove);
      EventBus.off(GameEvents.UI_JUMP, this.onUiJump);
      EventBus.off(GameEvents.UI_MODAL_STATE, this.onModal);
    });
  }

  updatePlayer(chunks: ChunkManager): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    // water check at body center — swimming softens gravity and allows float
    const tx = Math.floor(this.x / TILE_SIZE);
    const ty = Math.floor(this.y / TILE_SIZE);
    this.inWater = chunks.getTile(tx, ty) === Tile.WATER;
    body.setAllowGravity(true);
    if (this.inWater) {
      body.velocity.y = Math.min(body.velocity.y, 60);
    }

    if (this.inputLocked) {
      this.setVelocityX(0);
      this.anims.play('player-idle', true);
      return;
    }

    const left = this.cursors.left.isDown || this.keyA.isDown || this.uiMove === -1;
    const right = this.cursors.right.isDown || this.keyD.isDown || this.uiMove === 1;
    const jump =
      this.cursors.up.isDown || this.cursors.space.isDown || this.keyW.isDown || this.uiJump;

    if (left && !right) {
      this.setVelocityX(this.inWater ? -RUN_SPEED * 0.6 : -RUN_SPEED);
      this.setFlipX(true);
    } else if (right && !left) {
      this.setVelocityX(this.inWater ? RUN_SPEED * 0.6 : RUN_SPEED);
      this.setFlipX(false);
    } else {
      this.setVelocityX(0);
    }

    if (jump) {
      if (this.inWater) {
        this.setVelocityY(SWIM_VELOCITY);
      } else if (body.blocked.down) {
        this.setVelocityY(JUMP_VELOCITY);
      }
    }

    if (body.velocity.x !== 0 && (body.blocked.down || this.inWater)) {
      this.anims.play('player-walk', true);
    } else {
      this.anims.play('player-idle', true);
    }
  }
}
