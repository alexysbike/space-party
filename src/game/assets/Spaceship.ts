export class Spaceship {
    x: number;
    y: number;
    scale: number;
    angle: number;
    texture: string;
    spaceship: Phaser.GameObjects.Image;
    scene: Phaser.Scene;
    energy: number = 100;
    maxEnergy: number = 100;
    life: number = 100;
    maxLife: number = 100;
    energyBarWhite: Phaser.GameObjects.Rectangle;
    energyBar: Phaser.GameObjects.Rectangle;
    lifeBarWhite: Phaser.GameObjects.Rectangle;
    lifeBar: Phaser.GameObjects.Rectangle;
    shield: Phaser.GameObjects.Rectangle;
    shieldActivated = false;
    shieldLooseFunction: (time: number, delta: number, metadata?: any) => number;
    shieldDamageReduction: (damage: number, metadata?: any) => number;
    missileCooldown = 0;
    rayCooldown = 0;
    plasmaCooldown = 0;
    
    // Weapon stuff
    missileAngle = 270;
    missiles: Phaser.GameObjects.Image[] = [];
    missileSpeed = 7;
    rays: Phaser.GameObjects.Rectangle[] = [];
    plasmas: Phaser.GameObjects.Ellipse[] = [];
    plasmaSpeed = 4;
    
    // Collision stuff
    isMissileImpact: (missile: Phaser.GameObjects.Image) => boolean 
        = () => false
    onMissileImpact: () => void = () => {};
    isRayImpact: (ray: Phaser.GameObjects.Rectangle) => number | boolean 
        = () => false
    onRayImpact: () => void = () => {};
    isPlasmaImpact: (plasma: Phaser.GameObjects.Ellipse) => boolean 
    onPlasmaImpact: () => void = () => {};
    
    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, scale: number, angle: number) {
        this.x = x;
        this.y = y;
        this.scale = scale;
        this.angle = angle;
        this.texture = texture;
        this.scene = scene;
        this.shieldLooseFunction = (_time: number, delta: number) => {
            return delta / 1000;
        }
        this.shieldDamageReduction = () => {
            return 0;
        }
    }
    
    create() {
        // add spaceship sprite
        this.spaceship = this.scene.add.image(this.x, this.y, this.texture).setScale(this.scale).setAngle(this.angle);

        // add energy sprite
        this.energyBarWhite = this.scene.add.rectangle(this.x - 150, this.y + 50, 300, 30, 0xffffff).setOrigin(0,0);
        this.energyBar = this.scene.add.rectangle(this.x - 150, this.y + 50, 0, 30, 0x0000ff).setOrigin(0,0);

        // add life sprite
        this.lifeBarWhite = this.scene.add.rectangle(this.x - 150, this.y +  100, 300, 30, 0xffffff).setOrigin(0,0);
        this.lifeBar = this.scene.add.rectangle(this.x - 150, this.y +  100, 0, 30, 0xff0000).setOrigin(0,0);

        // add shields sprite
        this.shield = this.scene.add.rectangle(this.x, this.y - 100, 200, 30, 0x0000ff).setAlpha(0);
    }
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    update(_time: number, delta: number) {
        // updating energy bar
        this.energyBar.width = this.energy / this.maxEnergy * 300;

        //updating life bar
        this.lifeBar.width = (this.life / this.maxLife) * 300;

        // shield
        if (this.shieldActivated) {
            this.shield.setAlpha(0.5);
        } else {
            this.shield.setAlpha(0);
        }
        if (this.shieldActivated && this.energy > 0) {
            this.energy -= this.shieldLooseFunction(_time, delta);
            if (this.energy < 0) {
                this.energy = 0;
            }
        }

        // missile cooldown
        if (this.missileCooldown > 0) {
            this.missileCooldown -= delta;
        }

        // ray cooldown
        if (this.rayCooldown > 0) {
            this.rayCooldown -= delta;
        }
        
        // plasma cooldown
        if (this.plasmaCooldown > 0) {
            this.plasmaCooldown -= delta;
        }

        // missile movement
        for (let i = 0; i < this.missiles.length; i++) {
            const missile = this.missiles[i];
            missile.y -= this.missileSpeed;
            if (this.isMissileImpact(missile)) {
                missile.destroy();
                this.missiles.splice(i, 1);
                i--;
                this.onMissileImpact()
            }
        }

        // ray dismissal
        for (let i = 0; i < this.rays.length; i++) {
            const ray = this.rays[i];
            ray.setAlpha(ray.alpha - delta / 1000);
            // ray length by shield
            const collisionHeight = this.isRayImpact(ray);
            if (collisionHeight) {
                ray.height = collisionHeight as number;
            }
            if (ray.alpha <= 0) {
                ray.destroy();
                this.rays.splice(i, 1);
                i--;
                this.onRayImpact()
            }
        }

        // plasma movement
        for (let i = 0; i < this.plasmas.length; i++) {
            const plasma = this.plasmas[i];
            plasma.y -= this.plasmaSpeed;
            if (this.isPlasmaImpact(plasma)) {
                plasma.destroy()
                this.plasmas.splice(i, 1);
                i--;
                this.onPlasmaImpact()
            }
        }
    }
    
    invertSpaceship() {
       this.shield.y = this.y + 100
        this.missileSpeed *= -1;
        this.plasmaSpeed *= -1;
        this.missileAngle = this.missileAngle === 270 ? 90 : 270;
        this.lifeBarWhite.y = this.y - 100
        this.lifeBar.y = this.y - 100
        this.energyBarWhite.y = this.y - 150
        this.energyBar.y = this.y - 150
    }

    spawnShield() {
        this.shieldActivated = true
    }
    
    disableShield() {
        this.shieldActivated = false
    }
    
    modifyEnergy(quantity: number, afterCB?: () => void) {
        this.energy += quantity;
        if (this.energy > this.maxEnergy) {
            this.energy = this.maxEnergy;
        } else if (this.energy < 0) {
            this.energy = 0;
        }
        if (afterCB) { afterCB();}
    }
    
    modifyLife(quantity: number, afterCB?: () => void) {
        if (quantity < 0) {
            if (this.shieldActivated) {
                const energy = quantity - this.shieldLooseFunction(0, 0);
                this.modifyEnergy(energy < 0 ? 0 : energy);
                if (this.energy < 0) {
                    // drop enemy enemyLife
                    this.life += quantity;
                }
                this.shieldActivated = false;
            } else {
                // drop enemy enemyLife
                this.life += quantity;
            }
        } else {
            this.life += quantity;
        }
        if (this.life > this.maxLife) {
            this.life = this.maxLife;
        } else if (this.life < 0) {
            this.life = 0;
        }
        if (afterCB) { afterCB();}
    }

    spawnMissile(afterCB?: () => void) {
        const x = this.x;
        const y = this.y;
        const missile = this.scene.add.image(x, y, 'missile').setScale(0.1).setAngle(this.missileAngle);
        this.missiles.push(missile);
        this.modifyEnergy(-25)
        this.missileCooldown = 2000;
        
        if (afterCB) { afterCB();}
    }

    spawnRay(afterCB?: () => void) {
        const x = this.x - 5;
        const y = this.y - 50;
        const ray = this.scene.add.rectangle(x, y, 10, -500, 0x0000ff).setOrigin(0,0);
        this.rays.push(ray);
        this.modifyEnergy(-35)
        this.rayCooldown = 5000;
        if (afterCB) { afterCB();}
    }

    spawnPlasma(afterCB?: () => void) {
        const x = this.x - 5;
        const y = this.y - 50;
        const plasma = this.scene.add.ellipse(x, y, 10, 10, 0x0000ff).setOrigin(0,0);
        this.plasmas.push(plasma);
        this.modifyEnergy(-50)
        this.plasmaCooldown = 7500;
        if (afterCB) { afterCB();}
    }
}