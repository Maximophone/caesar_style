export class Grid {
    constructor(width, height) {
        this.width = width;
        this.height = height;

        // 2D array of tiles, null = empty
        this.tiles = [];
        for (let y = 0; y < height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < width; x++) {
                this.tiles[y][x] = null;
            }
        }
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
