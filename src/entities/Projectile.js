import { TOWER_CONFIG } from '../world/BuildingTypes.js';

export class Projectile {
    constructor(x, y, target, damage) {
        this.x = x;
        this.y = y;
        this.dx = 0;
        this.dy = 0;

        this.target = target;
        this.damage = damage;
        this.speed = TOWER_CONFIG.PROJECTILE_SPEED;
        this.color = '#FFA500';  // Orange

        this.isProjectile = true;
    }

    update(deltaTime, roadNetwork, entityManager, grid, economy, buildings) {
        // If target is dead or removed, despawn
        if (!this.target || this.target.hp <= 0) {
            entityManager.removeEntity(this);
            return;
        }

        // Move toward target
        const toX = this.target.x - this.x;
        const toY = this.target.y - this.y;
        const dist = Math.sqrt(toX * toX + toY * toY);

        if (dist < 0.3) {
            // Hit!
            this.target.hp -= this.damage;
            entityManager.removeEntity(this);
            return;
        }

        // Move
        const dirX = toX / dist;
        const dirY = toY / dist;
        const step = this.speed * deltaTime;

        this.x += dirX * step;
        this.y += dirY * step;
        this.dx = dirX;
        this.dy = dirY;
    }
}
