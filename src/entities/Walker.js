export class Walker {
    constructor(x, y, path, originBuilding, coverageType = null, color = '#ff0000') {
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

        // Movement speed (tiles per second)
        this.speed = 2;

        // Coverage emission
        this.coverageRadius = 1;
        this.coverageType = coverageType;  // water, food, religion, or null
        this.color = color;
    }

    update(deltaTime, roadNetwork, entityManager, grid) {
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
            this.emitCoverage(grid);

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

    emitCoverage(grid) {
        if (!grid || !this.coverageType) return;

        const nearbyBuildings = grid.getBuildingsNear(this.x, this.y, this.coverageRadius);
        for (const building of nearbyBuildings) {
            building.receiveCoverage(this.coverageType);
        }
    }

    onReturnHome(entityManager) {
        if (this.originBuilding) {
            this.originBuilding.onWalkerReturned();
        }
        entityManager.removeEntity(this);
    }
}
