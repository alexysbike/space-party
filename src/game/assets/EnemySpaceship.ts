import {Spaceship} from "./Spaceship.ts";

export class EnemySpaceship extends Spaceship {
    constructor(scene: Phaser.Scene) {
        super(scene, 512, 170, 'spaceship2', 0.08, 0);
        this.energy = 100;
        this.life = 200;
        this.maxEnergy = 100;
        this.maxLife = 200;
        this.missileSpeed = 5;
        this.plasmaSpeed = 2;
        this.shieldLooseFunction = (_time: number, delta: number) => {
            return 2 * delta / 1000;
        }
    }
    
    create() {
        super.create();
        this.invertSpaceship();
    }
    
    update(time: number, delta: number) {
        super.update(time, delta);

        // enemy ia
        if (time > 40000) {
            this.energy += delta / 1000;
            // random number to a hit increase
            if (Math.random() < 0.007) {
                this.energy += 10
            }
            if (this.energy > this.maxEnergy) {
                this.energy = this.maxEnergy;
            }

            if (this.energy > 60 && this.plasmaCooldown <= 0) {
                this.spawnPlasma()
                this.plasmaCooldown = 20000;
            }

            if (this.energy > 45 && this.rayCooldown <= 0) {
                this.spawnRay()
                this.rayCooldown = 15000;
            }

            if (this.energy > 35 && this.missileCooldown <= 0) {
                this.spawnMissile()
                this.missileCooldown = 8000;
            }
        }
    }
}