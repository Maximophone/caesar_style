export class Grid {
    constructor(width, height) {
        this.width = width;
        this.height = height;

        // 2D array of tiles, null = empty
        this.tiles = [];
        // 2D array of resources (e.g., 'fertility')
        this.resources = [];

        for (let y = 0; y < height; y++) {
            this.tiles[y] = [];
            this.resources[y] = [];
            for (let x = 0; x < width; x++) {
                this.tiles[y][x] = null;
                this.resources[y][x] = null;
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

        // Generate 'fertility' clusters
        const numFertilityClusters = Math.floor((this.width * this.height) / 50);

        for (let i = 0; i < numFertilityClusters; i++) {
            const cx = Math.floor(Math.random() * this.width);
            const cy = Math.floor(Math.random() * this.height);
            const radius = 2 + Math.floor(Math.random() * 3); // 2-4 radius

            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const x = cx + dx;
                    const y = cy + dy;

                    if (this.isInBounds(x, y)) {
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist <= radius - 0.5 || (dist <= radius + 0.5 && Math.random() > 0.5)) {
                            this.resources[y][x] = 'fertility';
                        }
                    }
                }
            }
        }

        // Generate 'iron_ore' clusters (much rarer, smaller pockets)
        const numIronClusters = Math.floor((this.width * this.height) / 250);

        for (let i = 0; i < numIronClusters; i++) {
            const cx = Math.floor(Math.random() * this.width);
            const cy = Math.floor(Math.random() * this.height);
            const radius = 1 + Math.floor(Math.random() * 2); // 1-2 radius

            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const x = cx + dx;
                    const y = cy + dy;

                    if (this.isInBounds(x, y) && this.resources[y][x] === null) {
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist <= radius - 0.5 || (dist <= radius + 0.5 && Math.random() > 0.5)) {
                            this.resources[y][x] = 'iron_ore';
                        }
                    }
                }
            }
        }
    }

    getResource(x, y) {
        if (!this.isInBounds(x, y)) return null;
        return this.resources[y][x];
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

    // Check if a rectangle of tiles is empty
    isAreaEmpty(x, y, width, height) {
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                if (!this.isInBounds(x + dx, y + dy)) return false;
                if (this.getTile(x + dx, y + dy) !== null) return false;
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
