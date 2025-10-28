import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import songData from '../songs/song1/data.json';
import {Spaceship} from "../assets/Spaceship.ts";
import {PlayerSpaceship} from "../assets/PlayerSpaceship.ts";
import {EnemySpaceship} from "../assets/EnemySpaceship.ts";

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    gameText: Phaser.GameObjects.Text;
    arrowLeft: Phaser.GameObjects.Image;
    arrowUp: Phaser.GameObjects.Image;
    arrowDown: Phaser.GameObjects.Image;
    arrowRight: Phaser.GameObjects.Image;
    arrows: Phaser.GameObjects.Image[] = [];
    leftPressed: boolean = false;
    rightPressed: boolean = false;
    upPressed: boolean = false;
    downPressed: boolean = false;
    
    // song stuff
    songDuration = 0;
    songData = songData;
    song: Phaser.Sound.BaseSound;
    songPlaying = false;
    songCurrentIndex = 0
    music: Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound;
    musicData: Array<{type: string, time: number}> = [];
    
    // spaceship stuff
    spaceship: Spaceship;
    
    // enemy stuff
    enemySpaceship: Spaceship;
    
    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x00ff00);

        this.background = this.add.image(512, 384, 'background');
        this.background.setAlpha(0.5);

        // add arrows sprites
        this.arrowLeft = this.add.image(500, 700, 'arrowEmpty').setScale(0.3).setAngle(180);
        this.arrowUp = this.add.image(650, 700, 'arrowEmpty').setScale(0.3).setAngle(270);
        this.arrowDown = this.add.image(800, 700, 'arrowEmpty').setScale(0.3).setAngle(90);
        this.arrowRight = this.add.image(950, 700, 'arrowEmpty').setScale(0.3);
        
        // add spaceship
        this.spaceship = new PlayerSpaceship(this); 
        this.spaceship.create();
        
        // add enemy spaceship sprite
        this.enemySpaceship = new EnemySpaceship(this);
        this.enemySpaceship.create()
        
        // input
        this.setInputs()
        
        this.startSong()
        
        EventBus.emit('current-scene-ready', this);
    }
    
    spawnArrow(type: 'left' | 'right' | 'up' | 'down') {
        let angle = 0;
        let x = 512;
        if (type === 'left') {
            angle = 180;
            x = 500
        } else if (type === 'right') {
            angle = 0;
            x = 950;
        } else if (type === 'up') {
            angle = 270;
            x = 650;
        } else if (type === 'down') {
            angle = 90;
            x = 800;       
        }
        const arrow = this.add.image(x, 0, 'arrow', 64).setScale(0.3).setAngle(angle);
        arrow.setData('type', type);
        this.arrows.push(arrow);
    }
    
    spawnEnemyShield() {
        if (Math.random() < 0.5) {
            this.enemySpaceship.spawnShield()
        }
    }
    
    startSong() {
        this.songPlaying = true;
        this.songDuration = 0;
        this.songData = songData;
        this.music = this.sound.add('song1');
        this.music.play();
    }
    
    update(time: number, delta: number) {
        super.update(time, delta);
        
        this.spaceship.update(time, delta);
        this.enemySpaceship.update(time, delta);
        
        // movimiento de las flechas
        for (let i = 0; i < this.arrows.length; i++) {
            const arrow = this.arrows[i];
            arrow.y += 10;
        }
        
        // eliminación de las flechas que se salen de la pantalla
        for (let i = 0; i < this.arrows.length; i++) {
            const arrow = this.arrows[i];
            if (arrow.y > 1000) {
                arrow.destroy();
                this.arrows.splice(i, 1);
                i--;
            }       
        }
        
        // recolección de energía
        for (let i = 0; i < this.arrows.length; i++) {
            const arrow = this.arrows[i];
            if (arrow.y > 680 && arrow.y < 710) {
                if (arrow.getData('type') === 'left') {
                    if (this.leftPressed) {
                        arrow.destroy();
                        this.arrows.splice(i, 1);
                        i--;
                        this.spaceship.modifyEnergy(10);
                    }
                } else if (arrow.getData('type') === 'right') {
                    if (this.rightPressed) {
                        arrow.destroy();
                        this.arrows.splice(i, 1);
                        i--;
                        this.spaceship.modifyEnergy(10);
                    }
                } else if (arrow.getData('type') === 'up') {
                    if (this.upPressed) {
                        arrow.destroy();
                        this.arrows.splice(i, 1);
                        i--;
                        this.spaceship.modifyEnergy(10);
                    }
                } else if (arrow.getData('type') === 'down') {
                    if (this.downPressed) {
                        arrow.destroy();
                        this.arrows.splice(i, 1);
                        i--;
                        this.spaceship.modifyEnergy(10);
                    }
                }
                
            }
        }
        
        // song playing
        if (this.songPlaying) {
            this.songDuration += delta;
            const data = this.songData[this.songCurrentIndex];
            if (data) {
                if (this.songDuration >= data.time) {
                    this.spawnArrow(data.type as 'left' | 'right' | 'up' | 'down');
                    this.songCurrentIndex++;
                }
            }
        }
        
        // missile logic
        this.spaceship.isMissileImpact = (missile: Phaser.GameObjects.Image) => missile.y < (this.enemySpaceship.shieldActivated ? 230 : 150)
        this.spaceship.onMissileImpact = () => {
            this.enemySpaceship.modifyLife(-10, () => this.enemySpaceship.disableShield());
        }
        
        // ray logic
        this.spaceship.isRayImpact = () => {
            if (this.enemySpaceship.shieldActivated) {
                return -290
            }
            return -500;
        }
        this.spaceship.onRayImpact = () => {
            this.enemySpaceship.modifyLife(-20, () => this.enemySpaceship.disableShield())
        }
        
        // plasma logic
        this.spaceship.isPlasmaImpact = (plasma) => {
            return plasma.y < (this.enemySpaceship.shieldActivated ? 230 : 150)
        }
        this.spaceship.onPlasmaImpact = () => {
            this.enemySpaceship.modifyLife(-30, () => this.enemySpaceship.disableShield());
        }

        // enemy missile logic
        this.enemySpaceship.isMissileImpact = (missile: Phaser.GameObjects.Image) => missile.y > (this.spaceship.shieldActivated ? 400 : 470)
        this.enemySpaceship.onMissileImpact = () => {
            this.spaceship.modifyLife(-10);
        }

        // enemy ray logic
        this.enemySpaceship.isRayImpact = () => {
            if (this.spaceship.shieldActivated) {
                return 350;
            }
            return 500;
        }
        this.enemySpaceship.onRayImpact = () => {
            this.spaceship.modifyLife(-15)
        }

        // enemy plasma logic
        this.enemySpaceship.isPlasmaImpact = (plasma) => {
            return plasma.y < (this.spaceship.shieldActivated ? 400 : 470)
        }
        this.enemySpaceship.onPlasmaImpact = () => {
            this.spaceship.modifyLife(-30)
        }
        
        // end game
        if (this.spaceship.life <= 0 || this.enemySpaceship.life <= 0) {
            this.changeScene();
            this.music.stop();
            this.songPlaying = false;
        }
    }
    
    setInputs() {
        const leftKey = this.input.keyboard?.addKey("A");
        leftKey?.on('down', () => {
            this.musicData.push({type: 'left', time: this.songDuration - 1200});
            console.log('this.musicData', this.musicData);
            this.leftPressed = true;
            this.arrowLeft.setTexture('arrow');
        })
        leftKey?.on('up', () => {
            this.leftPressed = false;
            this.arrowLeft.setTexture('arrowEmpty');
        })

        const rightKey = this.input.keyboard?.addKey("D");
        rightKey?.on('down', () => {
            this.musicData.push({type: 'right', time: this.songDuration - 1200});
            console.log('this.musicData', this.musicData);
            this.rightPressed = true;
            this.arrowRight.setTexture('arrow');
        })
        rightKey?.on('up', () => {
            this.rightPressed = false;
            this.arrowRight.setTexture('arrowEmpty');
        })

        const upKey = this.input.keyboard?.addKey("W");
        upKey?.on('down', () => {
            this.musicData.push({type: 'up', time: this.songDuration - 1200});
            console.log('this.musicData', this.musicData);
            this.upPressed = true;
            this.arrowUp.setTexture('arrow');
        })
        upKey?.on('up', () => {
            this.upPressed = false;
            this.arrowUp.setTexture('arrowEmpty');
        })

        const downKey = this.input.keyboard?.addKey("S");
        downKey?.on('down', () => {
            this.musicData.push({type: 'down', time: this.songDuration - 1200});
            console.log('this.musicData', this.musicData);
            this.downPressed = true;
            this.arrowDown.setTexture('arrow');
        })
        downKey?.on('up', () => {
            this.downPressed = false;
            this.arrowDown.setTexture('arrowEmpty');
        })

        const leftKeySecond = this.input.keyboard?.addKey("J");
        leftKeySecond?.on('down', () => {
            this.leftPressed = true;
            this.arrowLeft.setTexture('arrow');
        })
        leftKeySecond?.on('up', () => {
            this.leftPressed = false;
            this.arrowLeft.setTexture('arrowEmpty');
        })

        const rightKeySecond = this.input.keyboard?.addKey("L");
        rightKeySecond?.on('down', () => {
            this.rightPressed = true;
            this.arrowRight.setTexture('arrow');
        })
        rightKeySecond?.on('up', () => {
            this.rightPressed = false;
            this.arrowRight.setTexture('arrowEmpty');
        })

        const upKeySecond = this.input.keyboard?.addKey("I");
        upKeySecond?.on('down', () => {
            this.upPressed = true;
            this.arrowUp.setTexture('arrow');
        })
        upKeySecond?.on('up', () => {
            this.upPressed = false;
            this.arrowUp.setTexture('arrowEmpty');
        })

        const downKeySecond = this.input.keyboard?.addKey("K");
        downKeySecond?.on('down', () => {
            this.downPressed = true;
            this.arrowDown.setTexture('arrow');
        })
        downKeySecond?.on('up', () => {
            this.downPressed = false;
            this.arrowDown.setTexture('arrowEmpty');
        })
        
        const shieldKey = this.input.keyboard?.addKey("Q");
        shieldKey?.on('down', () => {
            if (this.spaceship.energy > 0) {
                this.spaceship.spawnShield();
            }
        })
        shieldKey?.on('up', () => {
            this.spaceship.disableShield();
        })
        
        const weaponKey = this.input.keyboard?.addKey("E");
        weaponKey?.on('down', () => {
            if (this.spaceship.energy > 50 && this.spaceship.plasmaCooldown <= 0 && this.spaceship.allWeaponsCooldown <= 0) {
                this.spaceship.spawnPlasma(() => this.spawnEnemyShield());
            }
            if (this.spaceship.energy > 40 && this.spaceship.missileCooldown <= 0 && this.spaceship.allWeaponsCooldown <= 0) {
                this.spaceship.spawnRay(() => this.spawnEnemyShield());
            }
            if (this.spaceship.energy > 30 && this.spaceship.missileCooldown <= 0 && this.spaceship.allWeaponsCooldown <= 0) {
                this.spaceship.spawnMissile(() => this.spawnEnemyShield());
            }
        })
        
        const shield2Key = this.input.keyboard?.addKey("U");
        shield2Key?.on('down', () => {
            if (this.spaceship.energy > 0) {
                this.spaceship.spawnShield();
            }
        })
        shield2Key?.on('up', () => {
            this.spaceship.disableShield();
        })
        
        const weapon2Key = this.input.keyboard?.addKey("O");
        weapon2Key?.on('down', () => {
            if (this.spaceship.energy > 50 && this.spaceship.plasmaCooldown <= 0 && this.spaceship.allWeaponsCooldown <= 0) {
                this.spaceship.spawnPlasma(() => this.spawnEnemyShield());
            }
            if (this.spaceship.energy > 40 && this.spaceship.missileCooldown <= 0 && this.spaceship.allWeaponsCooldown <= 0) {
                this.spaceship.spawnRay(() => this.spawnEnemyShield());
            }
            if (this.spaceship.energy > 30 && this.spaceship.missileCooldown <= 0 && this.spaceship.allWeaponsCooldown <= 0) {
                this.spaceship.spawnMissile(() => this.spawnEnemyShield());
            }
        })
    }

    changeScene ()
    {
        this.scene.start('GameOver');
    }
}
