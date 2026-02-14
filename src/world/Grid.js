import { RESOURCE_TYPES, TERRAIN_TYPES } from './BuildingTypes.js';

// Terrain spawning strategies
const TERRAIN_STRATEGIES = {
    cluster(grid, terrainId, config) {
        for (let i = 0; i < config.count; i++) {
            const cx = Math.floor(Math.random() * grid.width);
            const cy = Math.floor(Math.random() * grid.height);
            const radius = config.radiusMin + Math.floor(Math.random() * (config.radiusMax - config.radiusMin + 1));

            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const x = cx + dx;
                    const y = cy + dy;
                    if (grid.isInBounds(x, y)) {
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist <= radius - 0.5 || (dist <= radius + 0.5 && Math.random() > 0.5)) {
                            grid.terrain[y][x] = terrainId;
                        }
                    }
                }
            }
        }
    },

    river(grid, terrainId, config) {
        for (let i = 0; i < config.count; i++) {
            // Pick a random edge to start from
            const startEdge = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
            let cx, cy, dirX, dirY;

            if (startEdge === 0) {        // top edge, flows down
                cx = Math.floor(Math.random() * grid.width);
                cy = 0;
                dirX = 0; dirY = 1;
            } else if (startEdge === 1) { // right edge, flows left
                cx = grid.width - 1;
                cy = Math.floor(Math.random() * grid.height);
                dirX = -1; dirY = 0;
            } else if (startEdge === 2) { // bottom edge, flows up
                cx = Math.floor(Math.random() * grid.width);
                cy = grid.height - 1;
                dirX = 0; dirY = -1;
            } else {                      // left edge, flows right
                cx = 0;
                cy = Math.floor(Math.random() * grid.height);
                dirX = 1; dirY = 0;
            }

            const segmentLength = Math.floor(Math.max(grid.width, grid.height) / config.segments);

            for (let seg = 0; seg < config.segments; seg++) {
                const width = config.widthMin + Math.floor(Math.random() * (config.widthMax - config.widthMin + 1));
                // Drift perpendicular to the main direction
                const drift = Math.floor((Math.random() - 0.5) * 2 * config.drift);

                for (let step = 0; step < segmentLength; step++) {
                    // Progress along segment with gradual drift
                    const progress = step / segmentLength;
                    const perpDrift = Math.round(drift * progress);

                    const px = cx + dirX * step + (dirY !== 0 ? perpDrift : 0);
                    const py = cy + dirY * step + (dirX !== 0 ? perpDrift : 0);

                    // Paint width perpendicular to flow direction
                    const halfW = Math.floor(width / 2);
                    for (let w = -halfW; w <= halfW; w++) {
                        // If river flows vertically (dirY!=0), widen along X
                        // If river flows horizontally (dirX!=0), widen along Y
                        const wx = px + (dirY !== 0 ? w : 0);
                        const wy = py + (dirX !== 0 ? w : 0);

                        if (grid.isInBounds(wx, wy)) {
                            grid.terrain[wy][wx] = terrainId;
                        }
                    }
                }

                // Move start point for next segment
                cx = cx + dirX * segmentLength + (dirY !== 0 ? drift : 0);
                cy = cy + dirY * segmentLength + (dirX !== 0 ? drift : 0);

                // Clamp to bounds
                cx = Math.max(0, Math.min(grid.width - 1, cx));
                cy = Math.max(0, Math.min(grid.height - 1, cy));
            }
        }
    },
};

// Spawning strategy implementations
const SPAWN_STRATEGIES = {
    cluster(grid, resourceId, config) {
        const numClusters = Math.floor(grid.width * grid.height * config.density);

        for (let i = 0; i < numClusters; i++) {
            const cx = Math.floor(Math.random() * grid.width);
            const cy = Math.floor(Math.random() * grid.height);
            const radius = config.radiusMin + Math.floor(Math.random() * (config.radiusMax - config.radiusMin + 1));

            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const x = cx + dx;
                    const y = cy + dy;

                    if (grid.isInBounds(x, y)) {
                        if (grid.terrain[y][x] !== null) continue;
                        if (!config.allowOverlap && grid.resources[y][x] !== null) continue;

                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist <= radius - 0.5 || (dist <= radius + 0.5 && Math.random() > 0.5)) {
                            grid.resources[y][x] = resourceId;
                        }
                    }
                }
            }
        }
    },
};

export class Grid {
    constructor(width, height) {
        this.width = width;
        this.height = height;

        // 2D array of tiles, null = empty
        this.tiles = [];
        // 2D array of terrain (e.g., 'water'), null = land
        this.terrain = [];
        // 2D array of resources (e.g., 'fertility')
        this.resources = [];

        for (let y = 0; y < height; y++) {
            this.tiles[y] = [];
            this.terrain[y] = [];
            this.resources[y] = [];
            for (let x = 0; x < width; x++) {
                this.tiles[y][x] = null;
                this.terrain[y][x] = null;
                this.resources[y][x] = null;
            }
        }
    }

    generateTerrain() {
        // Clear existing terrain
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.terrain[y][x] = null;
            }
        }

        // Generate each terrain type from config
        for (const [terrainId, config] of Object.entries(TERRAIN_TYPES)) {
            // spawn can be a single config or an array of configs
            const spawnConfigs = Array.isArray(config.spawn) ? config.spawn : [config.spawn];

            for (const spawnConfig of spawnConfigs) {
                const strategy = TERRAIN_STRATEGIES[spawnConfig.strategy];
                if (strategy) {
                    strategy(this, terrainId, spawnConfig);
                }
            }
        }
    }

    generateResources() {
        // Clear existing
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.resources[y][x] = null;
            }
        }

        // Generate each resource type from config
        for (const [resourceId, config] of Object.entries(RESOURCE_TYPES)) {
            const strategy = SPAWN_STRATEGIES[config.spawn.strategy];
            if (strategy) {
                strategy(this, resourceId, config.spawn);
            }
        }
    }

    getResource(x, y) {
        if (!this.isInBounds(x, y)) return null;
        return this.resources[y][x];
    }

    getTerrain(x, y) {
        if (!this.isInBounds(x, y)) return null;
        return this.terrain[y][x];
    }

    isInBounds(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    getTile(x, y) {
        if (!this.isInBounds(x, y)) return null;
        return this.tiles[y][x];
    }

    setTile(x, y, tile) {
        if (!this.isInBounds(x, y)) return false;
        this.tiles[y][x] = tile;
        return true;
    }

    // Check if a rectangle of tiles is empty (no buildings/roads and correct terrain)
    // If requiredTerrain is set, ALL tiles must have that terrain type.
    // If requiredTerrain is null (default), ALL tiles must have NO terrain.
    isAreaEmpty(x, y, width, height, requiredTerrain = null) {
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                if (!this.isInBounds(x + dx, y + dy)) return false;
                if (this.getTile(x + dx, y + dy) !== null) return false;
                const terrain = this.terrain[y + dy][x + dx];
                if (requiredTerrain) {
                    if (terrain !== requiredTerrain) return false;
                } else {
                    if (terrain !== null) return false;
                }
            }
        }
        return true;
    }

    // Get all adjacent tiles (4-directional)
    getNeighbors(x, y) {
        const neighbors = [];
        const directions = [
            { dx: 0, dy: -1 }, // up
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: 1 },  // down
            { dx: -1, dy: 0 }, // left
        ];

        for (const { dx, dy } of directions) {
            const nx = x + dx;
            const ny = y + dy;
            if (this.isInBounds(nx, ny)) {
                neighbors.push({ x: nx, y: ny, tile: this.getTile(nx, ny) });
            }
        }

        return neighbors;
    }

    // Find adjacent road tiles
    getAdjacentRoads(x, y) {
        return this.getNeighbors(x, y).filter(n => n.tile && n.tile.type === 'road');
    }

    // Find buildings within radius of a position
    getBuildingsNear(x, y, radius = 1) {
        const buildings = new Set();
        const intX = Math.floor(x);
        const intY = Math.floor(y);

        // Check all tiles in the radius
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const tile = this.getTile(intX + dx, intY + dy);
                if (tile && tile.type === 'building' && tile.building) {
                    buildings.add(tile.building);
                }
            }
        }

        return Array.from(buildings);
    }
}
