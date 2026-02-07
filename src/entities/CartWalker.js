import { GOODS_CONFIG } from '../world/BuildingTypes.js';

/**
 * CartWalker - Transports goods from producer buildings (farms) to receiver buildings (markets)
 */
export class CartWalker {
    constructor(x, y, path, originBuilding, targetBuilding, cargo) {
        // Position (sub-tile precision for smooth movement)
        this.x = x;
        this.y = y;

        // Movement direction (for rendering)
        this.dx = 0;
        this.dy = 0;

        // Path following
        this.path = path;
        this.pathIndex = 0;
        this.returning = false;
        this.delivered = false;

        // Buildings
        this.originBuilding = originBuilding;
        this.targetBuilding = targetBuilding;

        // Movement speed (tiles per second) - carts are slower than regular walkers
        this.speed = 1.5;

        // Cargo
        this.cargo = cargo;  // { type: 'food', amount: 100 }

        // Visual
        this.color = '#CD853F';  // Peru/tan color for cart
    }

    update(deltaTime, roadNetwork, entityManager, grid) {
        if (this.path.length === 0) return;

        // Handle single-node path or already at destination
        if (this.path.length === 1 && !this.returning) {
            // Already at destination
            this.deliverGoods();
            this.returning = true;
            this.onReturnHome(entityManager);
            return;
        }

        // Get current target
        const target = this.path[this.pathIndex];

        // Calculate direction
        const toX = target.x - this.x;
        const toY = target.y - this.y;
        const dist = Math.sqrt(toX * toX + toY * toY);

        if (dist < 0.05) {
            // Reached waypoint
            this.x = target.x;
            this.y = target.y;

            if (this.returning) {
                this.pathIndex--;
                if (this.pathIndex < 0) {
                    // Returned home
                    this.onReturnHome(entityManager);
                    return;
                }
            } else {
                this.pathIndex++;
                if (this.pathIndex >= this.path.length) {
                    // Reached destination - deliver goods
                    this.deliverGoods();

                    // Start returning
                    this.returning = true;
                    this.pathIndex = this.path.length - 2;
                    if (this.pathIndex < 0) {
                        this.onReturnHome(entityManager);
                        return;
                    }
                }
            }
        } else {
            // Move towards target
            const moveX = (toX / dist) * this.speed * deltaTime;
            const moveY = (toY / dist) * this.speed * deltaTime;

            // Don't overshoot
            if (Math.abs(moveX) > Math.abs(toX)) {
                this.x = target.x;
            } else {
                this.x += moveX;
            }

            if (Math.abs(moveY) > Math.abs(toY)) {
                this.y = target.y;
            } else {
                this.y += moveY;
            }

            // Update direction for rendering
            this.dx = toX / dist;
            this.dy = toY / dist;
        }
    }

    deliverGoods() {
        if (!this.targetBuilding || !this.cargo || this.delivered) return;

        const received = this.targetBuilding.receiveGoods(this.cargo.type, this.cargo.amount);

        // If market couldn't accept all, we lose the excess (for simplicity)
        // Could be enhanced later to return excess to farm
        this.cargo.amount = 0;
        this.delivered = true;
    }

    onReturnHome(entityManager) {
        if (this.originBuilding) {
            this.originBuilding.onCartWalkerReturned();
        }
        entityManager.removeEntity(this);
    }
}
