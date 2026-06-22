import { Scene } from 'phaser';
import { FIGHTERS_DATA, FighterStats } from './Fighter';

export class FighterSprite extends Phaser.Physics.Arcade.Sprite {
  private stats: FighterStats;
  private isAttacking: boolean = false;
  public isBlocking: boolean = false;
  public isHitstun: boolean = false;
  private lastControls: { left: boolean, right: boolean } = { left: false, right: false };

  public life: number;
  public maxLife: number;

  // Hitboxes
  public headHitbox: Phaser.GameObjects.Rectangle;
  public torsoHitbox: Phaser.GameObjects.Rectangle;
  public feetHitbox: Phaser.GameObjects.Rectangle;
  public attackBox: Phaser.GameObjects.Rectangle;
  public healthBar?: Phaser.GameObjects.Rectangle;

  constructor(scene: Scene, x: number, y: number, characterKey: string) {
    const stats = FIGHTERS_DATA[characterKey.toUpperCase()];
    super(scene, x, y, `${stats.assetKey}-idle`);

    this.stats = stats;
    this.life = stats.life;
    this.maxLife = stats.life;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 1);
    this.setCollideWorldBounds(true);

    const bodyWidth = 50;
    const bodyHeight = 110;
    const marginBottom = 10;

    this.body?.setSize(bodyWidth, bodyHeight);

    const initialOffsetX = (this.stats.frameConfig.width - bodyWidth) / 2;
    const initialOffsetY = this.stats.frameConfig.height - marginBottom - bodyHeight;
    this.body?.setOffset(initialOffsetX, initialOffsetY);

    this.setGravityY(1200);

    // Initialize Hitboxes
    this.headHitbox = this.createHitbox(40, 30, 0xff0000);
    this.torsoHitbox = this.createHitbox(150, 150, 0x00ff00);
    this.feetHitbox = this.createHitbox(150, 130, 0x0000ff);
    this.attackBox = this.createHitbox(60, 40, 0xff0000);

    // Attack box visibility
    this.attackBox.setFillStyle(0xff0000, 0.4);
    this.attackBox.setStrokeStyle(2, 0xff0000);
    this.attackBox.setVisible(false);
    (this.attackBox.body as Phaser.Physics.Arcade.Body).enable = false;

    this.createAnimations();
    this.play(`${this.stats.assetKey}-idle`);
  }

  private createHitbox(width: number, height: number, color: number): Phaser.GameObjects.Rectangle {
    const rect = this.scene.add.rectangle(0, 0, width, height, color, 0);

    if (this.scene.physics.config.debug) {
      rect.setStrokeStyle(2, color);
    }

    this.scene.physics.add.existing(rect);
    const body = rect.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);

    return rect;
  }

  private syncHitboxes(targetHeight: number, bodyBottomY: number) {
    const centerX = this.x;

    // Head: Top 30% original size, moved 110px up (+10 from previous)
    const headH = targetHeight * 0.3;
    const headW = 40;
    const headY = bodyBottomY - targetHeight + (targetHeight * 0.3) / 2 - 110;
    this.headHitbox.setPosition(centerX, headY);
    this.headHitbox.setSize(headW, headH);
    (this.headHitbox.body as Phaser.Physics.Arcade.Body).setSize(headW, headH);

    // Torso: Middle 50% reduced to 2x size, moved 80px up (+10 from previous)
    const torsoH = (targetHeight * 0.5) * 2;
    const torsoW = 150;
    const torsoY = bodyBottomY - (targetHeight * 0.2) - (targetHeight * 0.5) / 2 - 80;
    this.torsoHitbox.setPosition(centerX, torsoY);
    this.torsoHitbox.setSize(torsoW, torsoH);
    (this.torsoHitbox.body as Phaser.Physics.Arcade.Body).setSize(torsoW, torsoH);

    // Feet: Expanded size but bottom lifted by 35px total (30 + 5) to fit ground
    const feetH = (targetHeight * 0.2) * 2 + 65;
    const feetW = 150;
    const feetY = bodyBottomY - feetH / 2 - 5;
    this.feetHitbox.setPosition(centerX, feetY);
    this.feetHitbox.setSize(feetW, feetH);
    (this.feetHitbox.body as Phaser.Physics.Arcade.Body).setSize(feetW, feetH);
  }

  public takeDamage(amount: number, attackerX: number) {
    this.life = Math.max(0, this.life - amount);
    this.scene.cameras.main.shake(100, 0.01);

    this.isHitstun = true;
    const pushDir = this.x < attackerX ? -1 : 1;
    this.setVelocityX(pushDir * 200);
    this.scene.time.delayedCall(200, () => {
      this.isHitstun = false;
      if (this.body) this.setVelocityX(0);
    });

    // Flash red
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => this.clearTint());
  }

  public getIsAttacking(): boolean {
    return this.isAttacking;
  }

  private createAnimations() {
    const name = this.stats.assetKey;
    const charAnims = this.stats.animations;

    const addAnim = (key: string) => {
      const animKey = `${name}-${key}`;
      const config = charAnims[key] || { frameRate: 15, repeat: 0 };

      if (!this.scene.anims.exists(animKey) && this.scene.textures.exists(animKey)) {
        this.scene.anims.create({
          key: animKey,
          frames: this.scene.anims.generateFrameNumbers(animKey, { start: 0 }),
          frameRate: config.frameRate,
          repeat: config.repeat ?? 0
        });
      }
    };

    addAnim('idle');
    addAnim('walkf');
    addAnim('walkb');
    addAnim('crouching');
    addAnim('crouch');
    addAnim('jump');
    addAnim('lp');
    addAnim('mp');
    addAnim('hp');
    addAnim('lk');
    addAnim('mk');
    addAnim('hk');
    addAnim('block');

    this.on('animationcomplete', (anim: Phaser.Animations.Animation) => {
      if (anim.key.includes('lp') || anim.key.includes('mp') || anim.key.includes('hp') ||
        anim.key.includes('lk') || anim.key.includes('mk') || anim.key.includes('hk')) {
        this.isAttacking = false;
      }

      if (anim.key === `${this.stats.assetKey}-crouching`) {
        this.play(`${this.stats.assetKey}-crouch`);
      }
    });
  }

  public isWalkingBackward(): boolean {
    if (this.flipX) {
      return this.lastControls.right;
    } else {
      return this.lastControls.left;
    }
  }

  public block() {
    if (this.isBlocking) return;
    this.isBlocking = true;
    this.isAttacking = false;

    this.setVelocityX(this.flipX ? 150 : -150);
    this.play(`${this.stats.assetKey}-block`, true);

    this.setTint(0x00ffff);
  }

  public stopBlocking() {
    if (!this.isBlocking) return;
    this.isBlocking = false;
    this.clearTint();
  }

  public handleInput(controls: { left: boolean, right: boolean, up: boolean, down: boolean, lp: boolean, mp: boolean, hp: boolean, lk: boolean, mk: boolean, hk: boolean }, opponentX: number, opponentAttacking: boolean = false) {
    this.lastControls = { left: controls.left, right: controls.right };

    if (this.isHitstun) return;

    this.setVelocityX(0);

    if (this.isAttacking) return;

    const onGround = this.body?.touching.down || this.body?.blocked.down;

    const pressingBack = this.flipX ? controls.right : controls.left;
    if (pressingBack && opponentAttacking && onGround) {
      this.block();
    } else if (this.isBlocking) {
      this.stopBlocking();
    }

    if (this.isBlocking) return;

    const speed = 200;

    if (controls.lp) { this.attack('lp'); return; }
    if (controls.mp) { this.attack('mp'); return; }
    if (controls.hp) { this.attack('hp'); return; }
    if (controls.lk) { this.attack('lk'); return; }
    if (controls.mk) { this.attack('mk'); return; }
    if (controls.hk) { this.attack('hk'); return; }

    if (controls.up && onGround) {
      this.setVelocityY(-600);
      this.play(`${this.stats.assetKey}-jump`, true);
      return;
    }

    if (controls.down && onGround) {
      const currentAnim = this.anims.currentAnim?.key;
      if (currentAnim !== `${this.stats.assetKey}-crouch` && currentAnim !== `${this.stats.assetKey}-crouching`) {
        this.play(`${this.stats.assetKey}-crouching`);
      }
      return;
    }

    if (controls.left) {
      this.setVelocityX(-speed);
      if (onGround) {
        const moveAnim = this.flipX ? 'walkf' : 'walkb';
        this.play(`${this.stats.assetKey}-${moveAnim}`, true);
      }
    } else if (controls.right) {
      this.setVelocityX(speed);
      if (onGround) {
        const moveAnim = this.flipX ? 'walkb' : 'walkf';
        this.play(`${this.stats.assetKey}-${moveAnim}`, true);
      }
    } else {
      if (onGround) {
        this.play(`${this.stats.assetKey}-idle`, true);
      }
    }

    this.updateFacing(opponentX);
  }

  private attack(type: string) {
    const animKey = `${this.stats.assetKey}-${type}`;
    if (this.scene.anims.exists(animKey)) {
      this.isAttacking = true;
      this.play(animKey);
    }
  }

  public updateFacing(opponentX: number) {
    if (this.isAttacking) return;

    if (this.x < opponentX) {
      this.setFlipX(false);
    } else {
      this.setFlipX(true);
    }
  }

  protected preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

    if (this.body && this.frame) {
      const bodyWidth = 50;
      const marginBottom = 10;
      const currentAnim = this.anims.currentAnim;
      const currentKey = currentAnim?.key || '';
      const onGround = this.body.touching.down || this.body.blocked.down;

      let targetBodyHeight = 110;
      if (currentKey.includes('crouch')) {
        targetBodyHeight = 60;
      }

      if (this.body.height !== targetBodyHeight) {
        this.body.setSize(bodyWidth, targetBodyHeight);
      }

      let jumpVisualLift = 0;
      if (currentKey.includes('jump') && currentAnim && !onGround) {
        const frameIndex = this.anims.currentFrame?.index || 0;
        const totalFrames = currentAnim.frames.length;
        const progress = frameIndex / totalFrames;
        jumpVisualLift = Math.sin(progress * Math.PI) * 100;
      }

      const frameWidth = this.frame.realWidth || 1;
      const frameHeight = this.frame.realHeight || 1;
      const offsetX = (frameWidth - bodyWidth) / 2;

      const targetBottom = frameHeight - marginBottom - jumpVisualLift;
      const offsetY = targetBottom - targetBodyHeight;

      if (!isNaN(offsetX) && !isNaN(offsetY)) {
        this.body.setOffset(offsetX, offsetY);
      }

      const bodyBottomY = this.y - marginBottom - jumpVisualLift;
      this.syncHitboxes(targetBodyHeight, bodyBottomY);

      // Dynamic Attack Box Logic
      let attackType = '';
      if (currentKey.endsWith('-lp')) attackType = 'lp';
      else if (currentKey.endsWith('-mp')) attackType = 'mp';
      else if (currentKey.endsWith('-hp')) attackType = 'hp';
      else if (currentKey.endsWith('-lk')) attackType = 'lk';
      else if (currentKey.endsWith('-mk')) attackType = 'mk';
      else if (currentKey.endsWith('-hk')) attackType = 'hk';

      if (this.isAttacking && attackType) {
        let baseWidth = 50;
        let baseHeight = 30;
        let isPunch = true;

        if (attackType === 'lp') { baseWidth = 60; baseHeight = 30; isPunch = true; }
        else if (attackType === 'mp') { baseWidth = 80; baseHeight = 35; isPunch = true; }
        else if (attackType === 'hp') { baseWidth = 60; baseHeight = 40; isPunch = true; }
        else if (attackType === 'lk') { baseWidth = 65; baseHeight = 30; isPunch = false; }
        else if (attackType === 'mk') { baseWidth = 85; baseHeight = 35; isPunch = false; }
        else if (attackType === 'hk') { baseWidth = 65; baseHeight = 45; isPunch = false; }

        const frameIndex = this.anims.currentFrame ? this.anims.currentFrame.index : 0;
        const totalFrames = currentAnim ? currentAnim.frames.length : 1;
        const progress = frameIndex / (totalFrames - 1 || 1);
        const extensionFactor = Math.sin(progress * Math.PI);

        if (extensionFactor > 0.2) {
          const adjustedWidth = baseWidth - (attackType === 'mk' && this.stats.assetKey === 'dudley' ? 50 : 0) - (attackType === 'lp' && this.stats.assetKey === 'dudley' ? 20 : 0) - (attackType === 'mp' && this.stats.assetKey === 'sean' ? 20 : 0);
          const width = adjustedWidth * (0.4 + 0.6 * extensionFactor) * this.scale;
          const height = baseHeight * this.scale;

          const attackX = this.x + (this.flipX ? -1 : 1) * ((bodyWidth * this.scale / 2) + (width / 2) - 10);
          const attackY = bodyBottomY - (isPunch ? targetBodyHeight * 0.75 + 70 : targetBodyHeight * 0.35) - (attackType === 'mk' && this.stats.assetKey === 'akuma' ? 50 : 0) - (attackType === 'hk' && this.stats.assetKey === 'akuma' ? 120 : 0) - (attackType === 'mk' && this.stats.assetKey === 'ken' ? 120 : 0) - (attackType === 'hk' && this.stats.assetKey === 'ken' ? 70 : 0) - (attackType === 'lk' && this.stats.assetKey === 'dudley' ? 140 : 0) - ((attackType === 'hk') && this.stats.assetKey === 'dudley' ? 120 : 0) - (attackType === 'mk' && this.stats.assetKey === 'dudley' ? 170 : 0) - (attackType === 'lk' && this.stats.assetKey === 'makoto' ? 100 : 0) - (attackType === 'mk' && this.stats.assetKey === 'makoto' ? 150 : 0) - (attackType === 'hk' && this.stats.assetKey === 'makoto' ? 70 : 0) - (attackType === 'hk' && this.stats.assetKey === 'q' ? 70 : 0) - (attackType === 'mk' && this.stats.assetKey === 'q' ? 70 : 0) - (attackType === 'hk' && this.stats.assetKey === 'sean' ? 120 : 0);

          this.attackBox.setPosition(attackX, attackY);
          this.attackBox.setSize(width, height);
          this.attackBox.setVisible(true);

          const attackBody = this.attackBox.body as Phaser.Physics.Arcade.Body;
          attackBody.enable = true;
          attackBody.setSize(width, height);
        } else {
          this.attackBox.setVisible(false);
          (this.attackBox.body as Phaser.Physics.Arcade.Body).enable = false;
        }
      } else {
        this.attackBox.setVisible(false);
        if (this.attackBox.body) {
          (this.attackBox.body as Phaser.Physics.Arcade.Body).enable = false;
        }
      }
    }
  }

  destroy(fromScene?: boolean): void {
    if (this.headHitbox) this.headHitbox.destroy();
    if (this.torsoHitbox) this.torsoHitbox.destroy();
    if (this.feetHitbox) this.feetHitbox.destroy();
    if (this.attackBox) this.attackBox.destroy();
    if (this.healthBar) this.healthBar.destroy();
    super.destroy(fromScene);
  }
}
