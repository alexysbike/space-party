import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import songData from '../songs/song1/data.json';

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
    energy = 100; // TODO: change this to 0
    maxEnergy = 100;
    energyBar: Phaser.GameObjects.Rectangle;
    life = 100;
    maxLife = 100;
    lifeBar: Phaser.GameObjects.Rectangle;
    spaceship: Phaser.GameObjects.Image;
    shield: Phaser.GameObjects.Rectangle;
    shieldActivated = false;
    missileCooldown = 0;
    rayCooldown = 0;
    plasmaCooldown = 0;
    
    // enemy stuff
    enemyEnergy = 0;
    enemyMaxEnergy = 100;
    enemyLife = 100;
    enemySpaceship: Phaser.GameObjects.Image;
    enemyMissileCooldown = 0;
    enemyRayCooldown = 0;
    enemyPlasmaCooldown = 0;
    enemyShield: Phaser.GameObjects.Rectangle;
    enemyShieldActivated = false;
    
    // weapons stuff
    missiles: Phaser.GameObjects.Image[] = [];
    rays: Phaser.GameObjects.Rectangle[] = [];
    plasmas: Phaser.GameObjects.Ellipse[] = [];
    missilesEnemy: Phaser.GameObjects.Image[] = [];
    raysEnemy: Phaser.GameObjects.Rectangle[] = [];
    plasmasEnemy: Phaser.GameObjects.Ellipse[] = [];

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
        
        // add energy sprite
        this.add.rectangle(50, 650, 300, 30, 0xffffff).setOrigin(0,0);
        this.energyBar = this.add.rectangle(50, 650, 0, 30, 0x0000ff).setOrigin(0,0);
        
        // add life sprite
        this.add.rectangle(50, 700, 300, 30, 0xffffff).setOrigin(0,0);
        this.lifeBar = this.add.rectangle(50, 700, 0, 30, 0xff0000).setOrigin(0,0);
        
        // add spaceship sprite
        this.spaceship = this.add.image(200, 550, 'spaceship1').setScale(0.3);
        
        // add shields sprite
        this.shield = this.add.rectangle(200, 450, 200, 30, 0x0000ff).setAlpha(0);
        this.enemyShield = this.add.rectangle(200, 200, 200, 30, 0x0000ff).setAlpha(0);
        
        // add enemy spaceship sprite
        this.enemySpaceship = this.add.image(200, 100, 'spaceship2').setScale(0.1);
        
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
    
    spawnMissile() {
        const x = 200;
        const y = 550;
        const missile = this.add.image(x, y, 'missile').setScale(0.1).setAngle(270);
        this.missiles.push(missile);
        this.energy -= 25;
        
        // simulate enemy shield
        this.spawnEnemyShield()
    }
    
    spawnRay() {
        const x = 195;
        const y = 500;
        const ray = this.add.rectangle(x, y, 10, -500, 0x0000ff).setOrigin(0,0);
        this.rays.push(ray);
        this.energy -= 35;
        
        // simulate enemy shield
        this.spawnEnemyShield()
    }
    
    spawnPlasma() {
        const x = 195;
        const y = 500;
        const plasma = this.add.ellipse(x, y, 10, 10, 0x0000ff).setOrigin(0,0);
        this.plasmas.push(plasma);
        this.energy -= 50;
        
        // simulate enemy shield
        this.spawnEnemyShield()
    }
    
    spawnMissileEnemy() {
        const x = 200;
        const y = 100
        const missile = this.add.image(x, y, 'missile').setScale(0.1).setAngle(90);
        this.missilesEnemy.push(missile);
        this.enemyEnergy -= 35;
    }

    spawnRayEnemy() {
        const x = 195;
        const y = 100;
        const ray = this.add.rectangle(x, y, 10, 500, 0x0000ff).setOrigin(0,0);
        this.raysEnemy.push(ray);
        this.enemyEnergy -= 45;
    }

    spawnPlasmaEnemy() {
        const x = 195;
        const y = 100;
        const plasma = this.add.ellipse(x, y, 10, 10, 0x0000ff).setOrigin(0,0);
        this.plasmasEnemy.push(plasma);
        this.enemyEnergy -= 60;
    }
    
    spawnEnemyShield() {
        if (Math.random() < 0.5) {
            this.enemyShieldActivated = true
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
                        this.energy += 10;
                        if (this.energy > this.maxEnergy) {
                            this.energy = this.maxEnergy;
                        }
                    }
                } else if (arrow.getData('type') === 'right') {
                    if (this.rightPressed) {
                        arrow.destroy();
                        this.arrows.splice(i, 1);
                        i--;
                        this.energy += 10;
                        if (this.energy > this.maxEnergy) {
                            this.energy = this.maxEnergy;
                        }
                    }
                } else if (arrow.getData('type') === 'up') {
                    if (this.upPressed) {
                        arrow.destroy();
                        this.arrows.splice(i, 1);
                        i--;
                        this.energy += 10;
                        if (this.energy > this.maxEnergy) {
                            this.energy = this.maxEnergy;
                        }
                    }
                } else if (arrow.getData('type') === 'down') {
                    if (this.downPressed) {
                        arrow.destroy();
                        this.arrows.splice(i, 1);
                        i--;
                        this.energy += 10;
                        if (this.energy > this.maxEnergy) {
                            this.energy = this.maxEnergy;
                        }
                    }
                }
                
            }
        }

        // updating energy bar
        this.energyBar.width = this.energy / this.maxEnergy * 300;
        
        //updating life bar
        this.lifeBar.width = this.life / this.maxLife * 300;
        
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
        
        // shield
        if (this.shieldActivated) {
            this.shield.setAlpha(0.5);
        } else {
            this.shield.setAlpha(0);
        }
        if (this.shieldActivated && this.energy > 0) {
            this.energy -= delta / 1000;
            if (this.energy < 0) {
                this.energy = 0;
            }
        }
        
        // missile movement
        for (let i = 0; i < this.missiles.length; i++) {
            const missile = this.missiles[i];
            missile.y -= 10;
            if (missile.y < (this.enemyShieldActivated ? 230 : 150)) {
                missile.destroy();
                this.missiles.splice(i, 1);
                i--;
                if (this.enemyShieldActivated) {
                    this.enemyEnergy -= 10;
                    if (this.enemyEnergy < 0) {
                        this.enemyEnergy = 0;
                        this.enemyLife -= 10;
                    }
                    this.enemyShieldActivated = false;
                } else {
                    // drop enemy enemyLife
                    this.enemyLife -= 10
                }
            }
        }
        
        // missile cooldown
        if (this.missileCooldown > 0) {
            this.missileCooldown -= delta;
        }
        
        // ray dismissal
        for (let i = 0; i < this.rays.length; i++) {
            const ray = this.rays[i];
            ray.setAlpha(ray.alpha - delta / 1000);
            // ray length by shield
            if (this.enemyShieldActivated) {
                ray.height = -290;
            } else {
                ray.height = -500;
            }
            if (ray.alpha <= 0) {
                ray.destroy();
                this.rays.splice(i, 1);
                i--;
                if (this.enemyShieldActivated) {
                    this.enemyEnergy -= 20;
                    if (this.enemyEnergy < 0) {
                        this.enemyEnergy = 0;
                        this.enemyLife -= 20;
                    }
                    this.enemyShieldActivated = false;
                } else {
                    // drop enemy enemyLife
                    this.enemyLife -= 20
                }
            }       
        }
        
        // ray cooldown
        if (this.rayCooldown > 0) {
            this.rayCooldown -= delta;
        }
        
        // plasma movement
        for (let i = 0; i < this.plasmas.length; i++) {
            const plasma = this.plasmas[i];
            plasma.y -= 5;
            if (plasma.y < (this.enemyShieldActivated ? 230 : 150)) {
                plasma.destroy()
                this.plasmas.splice(i, 1);
                i--;
                if (this.enemyShieldActivated) {
                    this.enemyEnergy -= 30;
                    if (this.enemyEnergy < 0) {
                        this.enemyEnergy = 0;
                        this.enemyLife -= 30;
                    }
                    this.enemyShieldActivated = false;
                } else {
                    // drop enemy enemyLife
                    this.enemyLife -= 30
                }
            }
        }
        
        // plasma cooldown
        if (this.plasmaCooldown > 0) {
            this.plasmaCooldown -= delta;
        }
        
        // enemy ia
        // enemy energy increase
        this.enemyEnergy += 2 * delta / 1000;
        // random number to a hit increase
        if (Math.random() < 0.007) {
            this.enemyEnergy += 10
        }
        if (this.enemyEnergy > this.enemyMaxEnergy) {
            this.enemyEnergy = this.enemyMaxEnergy;
        }

        if (this.enemyEnergy > 60 && this.enemyPlasmaCooldown <= 0) {
            this.spawnPlasmaEnemy()
            this.enemyPlasmaCooldown = 15000;
        }
        
        if (this.enemyEnergy > 45 && this.enemyRayCooldown <= 0) {
            this.spawnRayEnemy()
            this.enemyRayCooldown = 10000;
        }
        
        if (this.enemyEnergy > 35 && this.enemyMissileCooldown <= 0) {
            this.spawnMissileEnemy()
            this.enemyMissileCooldown = 5000;
        }

        // enemy shield
        if (this.enemyShieldActivated) {
            this.enemyShield.setAlpha(0.5);
        } else {
            this.enemyShield.setAlpha(0);
        }
        if (this.enemyShieldActivated && this.energy > 0) {
            this.enemyEnergy -= 2 * delta / 1000;
            if (this.enemyEnergy < 0) {
                this.enemyEnergy = 0;
            }
        }

        // enemy missile movement
        for (let i = 0; i < this.missilesEnemy.length; i++) {
            const missile = this.missilesEnemy[i];
            missile.y += 10;
            if (missile.y > (this.shieldActivated ? 400 : 470)) {
                missile.destroy();
                this.missilesEnemy.splice(i, 1);
                i--;
                if (this.shieldActivated) {
                    this.energy -= 0.6 * 10;
                    if (this.energy < 0) {
                        this.energy = 0;
                        this.life -= 0.6 * 10;
                    }
                } else {
                    // drop enemy life
                    this.life -= 10
                }
            }
        }

        // enemy missile cooldown
        if (this.enemyMissileCooldown > 0) {
            this.enemyMissileCooldown -= delta;
        }

        // enemy ray dismissal
        for (let i = 0; i < this.raysEnemy.length; i++) {
            const ray = this.raysEnemy[i];
            ray.setAlpha(ray.alpha - delta / 1000);
            // ray length by shield
            if (this.shieldActivated) {
                ray.height = 350;
            } else {
                ray.height = 500;           
            }
            if (ray.alpha <= 0) {
                ray.destroy();
                this.raysEnemy.splice(i, 1);
                i--;
                if (this.shieldActivated) {
                    this.energy -= 0.6 * 20;
                    if (this.energy < 0) {
                        this.energy = 0;
                        this.life -= 0.6 * 20;
                    }
                } else {
                    // drop enemy life
                    this.life -= 20
                }
            }
        }
        
        

        // ray cooldown
        if (this.enemyRayCooldown > 0) {
            this.enemyRayCooldown -= delta;
        }

        // enemy plasma movement
        for (let i = 0; i < this.plasmasEnemy.length; i++) {
            const plasma = this.plasmasEnemy[i];
            plasma.y += 5;
            if (plasma.y < (this.shieldActivated ? 400 : 470)) {
                plasma.destroy()
                this.plasmasEnemy.splice(i, 1);
                i--;
                if (this.shieldActivated) {
                    this.energy -= 0.6 * 30;
                    if (this.energy < 0) {
                        this.energy = 0;
                        this.life -= 0.6 * 30;
                    }
                } else {
                    // drop enemy life
                    this.life -= 30
                }
            }
        }

        // enemy plasma cooldown
        if (this.enemyPlasmaCooldown > 0) {
            this.enemyPlasmaCooldown -= delta;
        }
        
        // end game
        if (this.life <= 0 || this.enemyLife <= 0) {
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
            if (this.energy > 0) {
                this.shieldActivated = true;
            }
        })
        shieldKey?.on('up', () => {
            this.shieldActivated = false;
        })
        
        const missileKey = this.input.keyboard?.addKey("E");
        missileKey?.on('down', () => {
            if (this.energy > 30 && this.missileCooldown <= 0) {
                this.spawnMissile();
                this.missileCooldown = 2000;
            }
        })
        
        const rayKey = this.input.keyboard?.addKey("U");
        rayKey?.on('down', () => {
            if (this.energy > 35 && this.rayCooldown <= 0) {
                this.spawnRay();
                this.rayCooldown = 5000;
            }
        })
        
        const plasmaKey = this.input.keyboard?.addKey("O");
        plasmaKey?.on('down', () => {
            if (this.energy > 50 && this.plasmaCooldown <= 0) {
                this.spawnPlasma();
                this.plasmaCooldown = 7500;
            }
        })
    }

    changeScene ()
    {
        this.scene.start('GameOver');
    }
}
