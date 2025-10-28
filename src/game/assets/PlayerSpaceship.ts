import {Spaceship} from "./Spaceship.ts";

export class PlayerSpaceship extends Spaceship {
    constructor(scene: Phaser.Scene) {
        super(scene, 200, 550, 'spaceship1', 0.3, 0);
        this.energy = 100;
        this.life = 100;
        this.maxEnergy = 100;
        this.maxLife = 100;
        this.shieldDamageReduction = (damage) => damage * 0.6;
    }
    
    
}