import { Scene, GameObjects } from 'phaser';

export class MainMenu extends Scene
{
    background: GameObjects.Image;
    logo: GameObjects.Image;
    title: GameObjects.Text;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        // Removed missing background image and replaced with a color to avoid load errors
        this.add.rectangle(512, 384, 1024, 768, 0x028af8);

        this.logo = this.add.image(512, 300, 'logo');

        const createButton = (x: number, y: number, text: string, callback: () => void) => {
            const btn = this.add.text(x, y, text, {
                fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
                stroke: '#000000', strokeThickness: 8,
                align: 'center'
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

            btn.on('pointerdown', callback);

            // Add hover effects for feedback
            btn.on('pointerover', () => {
                btn.setScale(1.1);
                btn.setColor('#ffff00');
            });

            btn.on('pointerout', () => {
                btn.setScale(1);
                btn.setColor('#ffffff');
            });

            return btn;
        };

        createButton(512, 460, 'Singleplayer', () => {
            console.log('Singleplayer clicked');
            this.scene.start('Game', { cpu: true });
        });

        createButton(512, 540, 'Multiplayer', () => {
            console.log('Multiplayer clicked');
            this.scene.start('Game', { cpu: false });
        });

        createButton(512, 620, 'Fight Scene', () => {
            console.log('Fight Scene clicked');
            this.scene.start('Fight');
        });
    }
}
