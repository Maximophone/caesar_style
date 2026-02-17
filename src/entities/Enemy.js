import { ENEMY_CONFIG } from '../world/BuildingTypes.js';

export class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.dx = 0;
        this.dy = 0;

        this.hp = ENEMY_CONFIG.HP;
        this.maxHp = ENEMY_CONFIG.HP;
        this.speed = ENEMY_CONFIG.SPEED;
        this.color = ENEMY_CONFIG.COLOR;

        this.targetBuilding = null;
        this.isEnemy = true;

        // BFS path: array of {x, y} tile positions to follow
        this.path = [];
        this.pathIndex = 0;
        this.pathRecalcTimer = 0;

        // Attack cooldown (discrete hits, not continuous)
        this.attackCooldown = 0;

        // Track how long we've been unable to reach target (for wall fallback)
        this.pathBlockedTimer = 0;
        this.stuckTimer = 0;
    }

    update(deltaTime, roadNetwork, entityManager, grid, economy, buildings) {
        // Die if HP depleted
        if (this.hp <= 0) {
            entityManager.removeEntity(this);
            return;
        }

        // Tick attack cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }

        // Find or re-acquire target
        if (!this.targetBuilding || this.targetBuilding.collapsed) {
            this.targetBuilding = this.findTarget(buildings);
            this.pathBlockedTimer = 0;
            this.path = [];
        }

        // No buildings left — despawn
        if (!this.targetBuilding) {
            entityManager.removeEntity(this);
            return;
        }

        // Calculate distance to nearest edge tile of target building
        const distToBuilding = this.distanceToBuildingEdge(this.targetBuilding);

        // Use a slightly larger range check than BFS goal range to account for
        // float position drift (enemy stops at ~tile center but not exactly)
        if (distToBuilding <= ENEMY_CONFIG.ATTACK_RANGE + 0.5) {
            // Face the building
            const cx = this.targetBuilding.x + this.targetBuilding.width / 2;
            const cy = this.targetBuilding.y + this.targetBuilding.height / 2;
            const toX = cx - this.x;
            const toY = cy - this.y;
            const d = Math.sqrt(toX * toX + toY * toY);
            if (d > 0) {
                this.dx = toX / d;
                this.dy = toY / d;
            }

            // Deliver a hit when cooldown is ready
            if (this.attackCooldown <= 0) {
                this.targetBuilding.takeDamage(ENEMY_CONFIG.ATTACK_DAMAGE);
                this.attackCooldown = ENEMY_CONFIG.ATTACK_COOLDOWN;
            }

            this.pathBlockedTimer = 0;
            this.path = [];
        } else {
            // Move toward target building using BFS path
            this.pathRecalcTimer -= deltaTime;
            if (this.path.length === 0 || this.pathRecalcTimer <= 0) {
                this.recalculatePath(grid);
                this.pathRecalcTimer = 1.5;
            }

            const moved = this.followPath(deltaTime, grid);

            if (!moved) {
                this.stuckTimer += deltaTime;
                this.pathBlockedTimer += deltaTime;
            } else {
                this.stuckTimer = 0;
                this.pathBlockedTimer = 0;
            }

            // If blocked for too long and targeting a non-wall building,
            // switch to attacking the nearest wall
            if (this.pathBlockedTimer > 5 && !this.targetBuilding.type.isWall) {
                const nearestWall = this.findNearestWall(buildings);
                if (nearestWall) {
                    this.targetBuilding = nearestWall;
                    this.pathBlockedTimer = 0;
                    this.path = [];
                }
            }

            // If stuck for way too long, despawn
            if (this.stuckTimer > 15) {
                this.hp = 0;
            }
        }
    }

    recalculatePath(grid) {
        const startX = Math.round(this.x);
        const startY = Math.round(this.y);
        const target = this.targetBuilding;

        // BFS from enemy position to any tile within attack range of the target building
        const goalTiles = new Set();
        for (let dy = -1; dy <= target.height; dy++) {
            for (let dx = -1; dx <= target.width; dx++) {
                const gx = target.x + dx;
                const gy = target.y + dy;
                if (grid.isInBounds(gx, gy) && this.isWalkable(gx, gy, grid)) {
                    const dist = this.distanceToBuildingEdgeStatic(target, gx, gy);
                    if (dist <= ENEMY_CONFIG.ATTACK_RANGE) {
                        goalTiles.add(gy * grid.width + gx);
                    }
                }
            }
        }

        if (goalTiles.size === 0) {
            this.path = [];
            return;
        }

        // BFS with 8-directional movement
        // Cardinal directions first, then diagonals
        const cardinalDirs = [
            { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 },
        ];
        const diagonalDirs = [
            { dx: 1, dy: -1 }, { dx: 1, dy: 1 }, { dx: -1, dy: 1 }, { dx: -1, dy: -1 },
        ];

        const visited = new Uint8Array(grid.width * grid.height);
        const cameFrom = new Int32Array(grid.width * grid.height).fill(-1);
        const queue = [startY * grid.width + startX];
        visited[startY * grid.width + startX] = 1;

        let foundKey = -1;
        const maxIterations = 8000;
        let iterations = 0;

        while (queue.length > 0 && iterations < maxIterations) {
            const current = queue.shift();
            iterations++;

            if (goalTiles.has(current)) {
                foundKey = current;
                break;
            }

            const cx = current % grid.width;
            const cy = (current - cx) / grid.width;

            // Cardinal moves
            for (const dir of cardinalDirs) {
                const nx = cx + dir.dx;
                const ny = cy + dir.dy;
                if (!grid.isInBounds(nx, ny)) continue;
                const nKey = ny * grid.width + nx;
                if (visited[nKey]) continue;
                if (!this.isWalkable(nx, ny, grid)) continue;

                visited[nKey] = 1;
                cameFrom[nKey] = current;
                queue.push(nKey);
            }

            // Diagonal moves — only allow if both adjacent cardinal tiles are walkable
            // This prevents corner-cutting through wall gaps
            for (const dir of diagonalDirs) {
                const nx = cx + dir.dx;
                const ny = cy + dir.dy;
                if (!grid.isInBounds(nx, ny)) continue;
                const nKey = ny * grid.width + nx;
                if (visited[nKey]) continue;
                if (!this.isWalkable(nx, ny, grid)) continue;
                // Check both cardinal neighbors to prevent corner-cutting
                if (!this.isWalkable(cx + dir.dx, cy, grid)) continue;
                if (!this.isWalkable(cx, cy + dir.dy, grid)) continue;

                visited[nKey] = 1;
                cameFrom[nKey] = current;
                queue.push(nKey);
            }
        }

        if (foundKey === -1) {
            this.path = [];
            return;
        }

        // Reconstruct path
        const rawPath = [];
        let cur = foundKey;
        while (cur !== -1 && cur !== startY * grid.width + startX) {
            const px = cur % grid.width;
            const py = (cur - px) / grid.width;
            rawPath.push({ x: px, y: py });
            cur = cameFrom[cur];
        }
        rawPath.reverse();

        this.path = rawPath;
        this.pathIndex = 0;
    }

    distanceToBuildingEdgeStatic(building, px, py) {
        const clampedX = Math.max(building.x, Math.min(px, building.x + building.width - 1));
        const clampedY = Math.max(building.y, Math.min(py, building.y + building.height - 1));
        const dx = px - clampedX;
        const dy = py - clampedY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    followPath(deltaTime, grid) {
        if (this.path.length === 0 || this.pathIndex >= this.path.length) {
            return false;
        }

        const target = this.path[this.pathIndex];
        const toX = target.x - this.x;
        const toY = target.y - this.y;
        const dist = Math.sqrt(toX * toX + toY * toY);

        if (dist < 0.15) {
            this.pathIndex++;
            if (this.pathIndex >= this.path.length) {
                return true;
            }
            return true;
        }

        const dirX = toX / dist;
        const dirY = toY / dist;
        const step = this.speed * deltaTime;

        const newX = this.x + dirX * step;
        const newY = this.y + dirY * step;

        const tileX = Math.round(newX);
        const tileY = Math.round(newY);
        const curTileX = Math.round(this.x);
        const curTileY = Math.round(this.y);

        // Check walkability of target tile
        if (!this.isWalkable(tileX, tileY, grid)) {
            this.path = [];
            this.pathRecalcTimer = 0;
            return false;
        }

        // If moving diagonally, also check both cardinal neighbors
        // to prevent corner-cutting through wall gaps
        if (tileX !== curTileX && tileY !== curTileY) {
            if (!this.isWalkable(tileX, curTileY, grid) || !this.isWalkable(curTileX, tileY, grid)) {
                this.path = [];
                this.pathRecalcTimer = 0;
                return false;
            }
        }

        this.x = newX;
        this.y = newY;
        this.dx = dirX;
        this.dy = dirY;
        return true;
    }

    findTarget(buildings) {
        const nonWall = this.findNearestBuilding(buildings, false);
        if (nonWall) return nonWall;
        return this.findNearestBuilding(buildings, true);
    }

    findNearestBuilding(buildings, wallsOnly = false) {
        if (!buildings || buildings.length === 0) return null;

        let best = null;
        let bestDist = Infinity;

        for (const building of buildings) {
            if (building.collapsed) continue;

            const isWall = building.type.isWall === true;
            if (wallsOnly && !isWall) continue;
            if (!wallsOnly && isWall) continue;

            const dist = this.distanceToBuildingEdge(building);
            if (dist < bestDist) {
                bestDist = dist;
                best = building;
            }
        }

        return best;
    }

    findNearestWall(buildings) {
        return this.findNearestBuilding(buildings, true);
    }

    distanceToBuildingEdge(building) {
        return this.distanceToBuildingEdgeStatic(building, this.x, this.y);
    }

    isWalkable(tileX, tileY, grid) {
        if (!grid.isInBounds(tileX, tileY)) return false;
        if (grid.getTerrain(tileX, tileY) === 'water') return false;
        const tile = grid.getTile(tileX, tileY);
        if (tile && tile.type === 'building' && tile.building &&
            tile.building.type.isWall && !tile.building.collapsed) {
            return false;
        }
        return true;
    }
}
