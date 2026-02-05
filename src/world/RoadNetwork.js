export class RoadNetwork {
    constructor(grid) {
        this.grid = grid;
        // Set of road positions as "x,y" strings for quick lookup
        this.roads = new Set();
    }

    key(x, y) {
        return `${x},${y}`;
    }

    parseKey(key) {
        const [x, y] = key.split(',').map(Number);
        return { x, y };
    }

    addRoad(x, y) {
        this.roads.add(this.key(x, y));
    }

    removeRoad(x, y) {
        this.roads.delete(this.key(x, y));
    }

    hasRoad(x, y) {
        return this.roads.has(this.key(x, y));
    }

    // Get connected road neighbors
    getConnectedRoads(x, y) {
        const neighbors = [];
        const directions = [
            { dx: 0, dy: -1 },
            { dx: 1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
        ];

        for (const { dx, dy } of directions) {
            const nx = x + dx;
            const ny = y + dy;
            if (this.hasRoad(nx, ny)) {
                neighbors.push({ x: nx, y: ny, dx, dy });
            }
        }

        return neighbors;
    }

    // Find a random path from start position
    // Walkers wander randomly along roads
    getRandomPath(startX, startY, maxLength = 20) {
        const path = [{ x: startX, y: startY }];
        let x = startX;
        let y = startY;
        let prevX = -1;
        let prevY = -1;

        for (let i = 0; i < maxLength; i++) {
            const neighbors = this.getConnectedRoads(x, y);

            // Filter out where we came from (no immediate backtrack)
            const options = neighbors.filter(n => !(n.x === prevX && n.y === prevY));

            if (options.length === 0) {
                // Dead end - just stop here, walker will return via normal logic
                break;
            }

            // Pick random direction
            const next = options[Math.floor(Math.random() * options.length)];
            prevX = x;
            prevY = y;
            x = next.x;
            y = next.y;
            path.push({ x, y });
        }

        return path;
    }

    // A* pathfinding between two road tiles
    findPath(startX, startY, endX, endY) {
        if (!this.hasRoad(startX, startY) || !this.hasRoad(endX, endY)) {
            return null;
        }

        const startKey = this.key(startX, startY);
        const endKey = this.key(endX, endY);

        const openSet = new Set([startKey]);
        const cameFrom = new Map();

        const gScore = new Map();
        gScore.set(startKey, 0);

        const fScore = new Map();
        const h = (x, y) => Math.abs(x - endX) + Math.abs(y - endY);
        fScore.set(startKey, h(startX, startY));

        while (openSet.size > 0) {
            // Find node with lowest fScore
            let current = null;
            let lowestF = Infinity;
            for (const key of openSet) {
                const f = fScore.get(key) ?? Infinity;
                if (f < lowestF) {
                    lowestF = f;
                    current = key;
                }
            }

            if (current === endKey) {
                // Reconstruct path
                const path = [];
                let node = current;
                while (node) {
                    path.unshift(this.parseKey(node));
                    node = cameFrom.get(node);
                }
                return path;
            }

            openSet.delete(current);
            const { x, y } = this.parseKey(current);

            for (const neighbor of this.getConnectedRoads(x, y)) {
                const neighborKey = this.key(neighbor.x, neighbor.y);
                const tentativeG = (gScore.get(current) ?? Infinity) + 1;

                if (tentativeG < (gScore.get(neighborKey) ?? Infinity)) {
                    cameFrom.set(neighborKey, current);
                    gScore.set(neighborKey, tentativeG);
                    fScore.set(neighborKey, tentativeG + h(neighbor.x, neighbor.y));
                    openSet.add(neighborKey);
                }
            }
        }

        return null; // No path found
    }
}
