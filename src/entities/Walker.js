import { GOODS_CONFIG, GOODS_META, HEALTH_CONFIG } from '../world/BuildingTypes.js';

export class Walker {
    constructor(x, y, maxSteps, originBuilding, slotIndex, coverageType = null, color = '#ff0000', cargo = null) {
        // Position (sub-tile precision for smooth movement)
        this.x = x;
        this.y = y;

        // Movement direction (for rendering)
        this.dx = 0;
        this.dy = 0;

        // Roaming logic
        this.maxSteps = maxSteps || 20;
        this.stepsTaken = 0;
        this.returning = false;

        // Current movement target (next tile center)
        this.targetX = x;
        this.targetY = y;

        // Previous position to avoid immediate backtracking
        this.lastX = x;
        this.lastY = y;

        // Path specifically for returning home
        this.returnPath = null;
        this.returnPathIndex = 0;

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
        // Calculate distance to current target tile center
        const toX = this.targetX - this.x;
        const toY = this.targetY - this.y;
        const dist = Math.sqrt(toX * toX + toY * toY);

        if (dist < 0.05) {
            // Reached target tile center
            this.x = this.targetX;
            this.y = this.targetY;

            // Emit coverage
            this.emitCoverage(grid, economy, deltaTime);

            // Decide next move
            if (this.returning) {
                this.handleReturnMovement(entityManager);
            } else {
                this.handleRoamingMovement(roadNetwork, entityManager);
            }
        } else {
            // Move towards target
            const moveX = (toX / dist) * this.speed * deltaTime;
            const moveY = (toY / dist) * this.speed * deltaTime;

            // Don't overshoot
            if (Math.abs(moveX) > Math.abs(toX)) this.x = this.targetX;
            else this.x += moveX;

            if (Math.abs(moveY) > Math.abs(toY)) this.y = this.targetY;
            else this.y += moveY;

            // Update direction for rendering
            this.dx = toX / dist;
            this.dy = toY / dist;
        }
    }

    handleRoamingMovement(roadNetwork, entityManager) {
        this.stepsTaken++;

        // Check if we should return home
        if (this.stepsTaken >= this.maxSteps) {
            this.startReturning(roadNetwork, entityManager);
            return;
        }

        // Find available roads
        const currentTileX = Math.round(this.x);
        const currentTileY = Math.round(this.y);
        const neighbors = roadNetwork.getConnectedRoads(currentTileX, currentTileY);

        // Filter valid moves
        // 1. Must be a road (getConnectedRoads handles this)
        // 2. Try to avoid going back to the tile we just came from
        let options = neighbors.filter(n => !(n.x === Math.round(this.lastX) && n.y === Math.round(this.lastY)));

        // If dead end (only option is back), use all neighbors (forces turning back)
        if (options.length === 0) {
            options = neighbors;
        }

        // If stranded (no roads at all??), despawn
        if (options.length === 0) {
            this.onReturnHome(entityManager);
            return;
        }

        // Pick random next tile
        const next = options[Math.floor(Math.random() * options.length)];

        // Set new target
        this.lastX = this.x;
        this.lastY = this.y;
        this.targetX = next.x;
        this.targetY = next.y;
    }

    startReturning(roadNetwork, entityManager) {
        this.returning = true;

        // Calculate path back to origin
        if (this.originBuilding && this.originBuilding.roadAccessX !== undefined) {
            this.returnPath = roadNetwork.findPath(
                Math.round(this.x),
                Math.round(this.y),
                this.originBuilding.roadAccessX,
                this.originBuilding.roadAccessY
            );

            if (this.returnPath && this.returnPath.length > 1) {
                this.returnPathIndex = 1; // Start at 1 (0 is current tile)

                // Set first target
                const next = this.returnPath[this.returnPathIndex];
                this.targetX = next.x;
                this.targetY = next.y;
            } else {
                // Determine we are already there or cant find path
                this.onReturnHome(entityManager);
            }
        } else {
            // Origin gone?
            this.onReturnHome(entityManager);
        }
    }

    handleReturnMovement(entityManager) {
        this.returnPathIndex++;

        if (this.returnPath && this.returnPathIndex < this.returnPath.length) {
            const next = this.returnPath[this.returnPathIndex];
            this.targetX = next.x;
            this.targetY = next.y;
        } else {
            // Reached home
            this.onReturnHome(entityManager);
        }
    }

    emitCoverage(grid, economy, deltaTime = 0) {
        if (!grid || !this.coverageType) return;

        const nearbyBuildings = grid.getBuildingsNear(this.x, this.y, this.coverageRadius);

        // Engineer coverage affects ALL buildings (not just houses)
        if (this.coverageType === 'engineer') {
            for (const building of nearbyBuildings) {
                building.resetCollapseRisk();
                // Engineers also heal damaged buildings
                if (building.hp < building.maxHp && deltaTime > 0) {
                    building.healHp(HEALTH_CONFIG.ENGINEER_HEAL_RATE * deltaTime);
                }
            }
            return;
        }

        for (const building of nearbyBuildings) {
            // Only provide coverage to houses (buildings with coverageNeeds)
            if (!building.coverageNeeds) continue;

            // For distributors with cargo matching coverage type (which is a Good), deliver to house
            if (this.coverageType && GOODS_META[this.coverageType] && this.cargo && this.cargo.type === this.coverageType) {
                // Calculate goods to deliver: per-inhabitant rate
                const population = building.getPopulation();
                const toDeliver = population * GOODS_CONFIG.HOUSE_GOOD_DELIVERY_PER_POP;

                if (this.cargo.amount >= toDeliver && toDeliver > 0 && building.storage) {
                    // Deliver goods to house storage (capped by capacity)
                    const capacity = building.getMaxStorage(this.coverageType);
                    const current = building.storage[this.coverageType] || 0;
                    const space = capacity - current;
                    const received = Math.min(toDeliver, space);
                    building.storage[this.coverageType] = current + received;
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

