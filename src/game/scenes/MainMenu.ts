import { Scene, GameObjects } from 'phaser';
import { network } from '../network/NetworkManager';

export class MainMenu extends Scene
{
    background: GameObjects.Image;
    logo: GameObjects.Image;
    title: GameObjects.Text;
    statusText: GameObjects.Text;
    cancelBtn: GameObjects.Text | null = null;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
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
            this.scene.start('Game', { cpu: true });
        });

        createButton(512, 520, 'Local Multiplayer', () => {
            this.scene.start('Game', { cpu: false });
        });

        createButton(512, 600, 'Online Multiplayer', () => {
            this.startOnlineMatchmaking();
        });

        createButton(512, 680, 'Fight Scene', () => {
            this.scene.start('Fight');
        });

        this.statusText = this.add.text(512, 750, '', {
            fontFamily: 'Arial', fontSize: 18, color: '#ffffff',
        }).setOrigin(0.5);
    }

    private startOnlineMatchmaking() {
        this.statusText.setText('Connecting...');

        network.setCallbacks({
            onMatchFound: (data) => {
                this.statusText.setText('');
                if (this.cancelBtn) { this.cancelBtn.destroy(); this.cancelBtn = null; }
                this.scene.start('Game', { online: true, playerIndex: data.you, color: data.color });
            },
            onQueueStatus: () => {
                this.statusText.setText('Searching for opponent...');
                this.cancelBtn = this.add.text(512, 780, 'Cancel', {
                    fontFamily: 'Arial Black', fontSize: 20, color: '#ff4444',
                    stroke: '#000000', strokeThickness: 4,
                }).setOrigin(0.5).setInteractive({ useHandCursor: true });
                this.cancelBtn.on('pointerdown', () => {
                    network.cancelMatch();
                    this.statusText.setText('');
                    if (this.cancelBtn) { this.cancelBtn.destroy(); this.cancelBtn = null; }
                });
            },
            onOpponentMove: () => {},
            onOpponentInput: () => {},
            onOpponentFightStart: () => {},
            onFightResult: () => {},
            onOpponentDisconnected: () => {},
            onError: (msg) => {
                this.statusText.setText(`Error: ${msg}`);
            },
        });

        network.connect();
        network.findMatch();
    }
}
