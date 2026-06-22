import { Scene } from 'phaser';
import { FIGHTERS_DATA } from '../objects/Fighter';

export class Preloader extends Scene {
  constructor() {
    super('Preloader');
  }

  init() {
    //  We loaded this image in our Boot Scene, so we can display it here
    this.add.image(512, 384, 'background');

    //  A simple progress bar. This is the outline of the bar.
    this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

    //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
    const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffffff);

    //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
    this.load.on('progress', (progress: number) => {

      //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
      bar.width = 4 + (460 * progress);

    });
  }

  preload() {
    //  Load the assets for the game - Replace with your own assets
    this.load.setPath('assets');

    this.load.image('logo', 'logo.png');

    this.load.image('board', 'board.png');

    this.load.image('chun-li-bg', 'fight_scenes/background/chun-li-bg-layer2.png');
    this.load.image('akuma-bg', 'fight_scenes/background/akuma-bg-layer1.png');

    // Dynamic loading of all fighters stance
    Object.values(FIGHTERS_DATA).forEach(fighter => {
        const loadS = (key: string, file: string) => {
            const animConfig = fighter.animations[key];
            const width = animConfig?.frameWidth || fighter.frameConfig.width;
            const height = animConfig?.frameHeight || fighter.frameConfig.height;

            const fullPath = `fight_scenes/${fighter.name}/${file}.png`;
            this.load.spritesheet(`${fighter.assetKey}-${key}`, fullPath, {
                frameWidth: width,
                frameHeight: height
            });
        };

        loadS('idle', 'Stance');
        loadS('walkf', 'WalkF');
        loadS('walkb', 'WalkB');
        loadS('crouching', 'Crouching');
        loadS('crouch', 'Crouch');
        loadS('jump', 'Jump');
        loadS('lp', 'LP');
        loadS('mp', 'MP');
        loadS('hp', 'HP');
        loadS('lk', 'LK');
        loadS('mk', 'MK');
        loadS('hk', 'HK');
        loadS('block', 'BlockM');
    });

    this.load.spritesheet('bpieces', 'bpieces.png', { frameWidth: 80, frameHeight: 80 });

    this.load.spritesheet('wpieces', 'wpieces.png', { frameWidth: 80, frameHeight: 80 });
  }

  create() {
    //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
    //  For example, you can define global animations here, so we can use them in other scenes.

    //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
    this.scene.start('MainMenu');
  }
}
