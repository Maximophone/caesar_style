import { GOODS_CONFIG } from '../world/BuildingTypes.js';

export class Walker {
    constructor(x, y, path, originBuilding, slotIndex, coverageType = null, color = '#ff0000', cargo = null) {
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

        // Origin building (to return to)
        this.originBuilding = originBuilding;
        this.slotIndex = slotIndex;

        // Movement speed (tiles per second)
        this.speed = 2;

        // Coverage emission
        this.coverageRadius = 1;
        this.coverageType = coverageType;  // water, food, religion, or null
        this.color = color;

        // Cargo for goods-based distribution (for market walkers)
        this.cargo = cargo;  // { type: 'food', amount: 100 } or null
    }

    update(deltaTime, roadNetwork, entityManager, grid, economy) {
        if (this.path.length === 0) return;

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

            // Emit coverage to nearby buildings
            this.emitCoverage(grid, economy);

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
                    // End of outbound path, start returning
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

    emitCoverage(grid, economy) {
        if (!grid || !this.coverageType) return;


        const nearbyBuildings = grid.getBuildingsNear(this.x, this.y, this.coverageRadius);

        for (const building of nearbyBuildings) {
            // Only provide coverage to houses (buildings with coverageNeeds)
            if (!building.coverageNeeds) continue;

            // For food distributors with cargo, deliver food to house storage
            if (this.coverageType === 'food' && this.cargo && this.cargo.type === 'food') {
                // Calculate food to deliver: per-inhabitant rate
                const population = building.getPopulation();
                const toDeliver = population * GOODS_CONFIG.HOUSE_FOOD_DELIVERY_PER_POP;

                if (this.cargo.amount >= toDeliver && toDeliver > 0 && building.storage) {
                    // Deliver food to house storage (capped by capacity)
                    const capacity = building.getMaxStorage('food');
                    const current = building.storage.food || 0;
                    const space = capacity - current;
                    const received = Math.min(toDeliver, space);
                    building.storage.food = current + received;
                    this.cargo.amount -= received;
                }
                // If out of cargo or house is full, skip
            } else if (this.coverageType === 'tax') {
                // Collect tax
                if (building.payTax && economy) {
                    const taxCollected = building.payTax();
                    if (taxCollected > 0) {
                        economy.collectTax(taxCollected);
                        // Optional: Show floating text or effect
                    }
                }
                // Also provide generic coverage (maybe tax office provides some comfort?)
                building.receiveCoverage(this.coverageType);
            } else {
                // Normal coverage (religion, etc.) - no goods required
                building.receiveCoverage(this.coverageType);
            }
        }
    }

    onReturnHome(entityManager) {
        if (this.originBuilding) {
            // Return leftover cargo back to origin building
            if (this.cargo && this.cargo.amount > 0) {
                this.originBuilding.returnGoods(this.cargo.type, this.cargo.amount);
            }
            this.originBuilding.onWalkerReturned(this.slotIndex);
        }
        entityManager.removeEntity(this);
    }
}

