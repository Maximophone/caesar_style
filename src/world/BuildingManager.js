import { Building } from './Building.js';
import { Walker } from '../entities/Walker.js';
import { BUILDING_TYPES } from './BuildingTypes.js';

export class BuildingManager {
    constructor(grid, roadNetwork, entityManager) {
        this.grid = grid;
        this.roadNetwork = roadNetwork;
        this.entityManager = entityManager;
        this.buildings = [];
    }

    placeBuilding(x, y, type = BUILDING_TYPES.house) {
        const width = type.width;
        const height = type.height;

        // Check if area is empty
        if (!this.grid.isAreaEmpty(x, y, width, height)) {
            return null;
        }

        // Find adjacent road for door placement
        const doorPos = this.findDoorPosition(x, y, width, height);
        if (!doorPos) {
            return null; // Must be placed next to a road
        }

        // Create building
        const building = new Building(x, y, type);
        building.doorX = doorPos.x;
        building.doorY = doorPos.y;
        building.roadAccessX = doorPos.roadX;
        building.roadAccessY = doorPos.roadY;

        // Mark tiles as occupied
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                this.grid.setTile(x + dx, y + dy, {
                    type: 'building',
                    building: building
                });
            }
        }

        this.buildings.push(building);
        return building;
    }

    findDoorPosition(x, y, width, height) {
        // Check all edge tiles for adjacent roads
        const edges = [];

        // Top and bottom edges
        for (let dx = 0; dx < width; dx++) {
            edges.push({ bx: x + dx, by: y, side: 'top' });
            edges.push({ bx: x + dx, by: y + height - 1, side: 'bottom' });
        }

        // Left and right edges
        for (let dy = 0; dy < height; dy++) {
            edges.push({ bx: x, by: y + dy, side: 'left' });
            edges.push({ bx: x + width - 1, by: y + dy, side: 'right' });
        }

        for (const edge of edges) {
            const adjacentRoads = this.grid.getAdjacentRoads(edge.bx, edge.by);
            for (const road of adjacentRoads) {
                // Make sure the road is actually outside the building footprint
                if (road.x < x || road.x >= x + width || road.y < y || road.y >= y + height) {
                    return {
                        x: edge.bx,
                        y: edge.by,
                        roadX: road.x,
                        roadY: road.y
                    };
                }
            }
        }

        return null;
    }

    removeBuilding(x, y) {
        const tile = this.grid.getTile(x, y);
        if (!tile || tile.type !== 'building') return;

        const building = tile.building;

        // Clear all tiles
        for (let dy = 0; dy < building.height; dy++) {
            for (let dx = 0; dx < building.width; dx++) {
                this.grid.setTile(building.x + dx, building.y + dy, null);
            }
        }

        // Remove from list
        const index = this.buildings.indexOf(building);
        if (index !== -1) {
            this.buildings.splice(index, 1);
        }
    }

    update(deltaTime) {
        // Apply static coverage from buildings like wells
        this.applyStaticCoverage();

        for (const building of this.buildings) {
            building.update(deltaTime);

            // Spawn walker if ready (and staffed)
            if (building.shouldSpawnWalker()) {
                this.spawnWalker(building);
                building.onWalkerSpawned();
            }
        }
    }

    // Apply coverage from buildings with staticCoverage (like wells)
    // Coverage is cumulative and distance-based
    applyStaticCoverage() {
        // First, reset water coverage for all houses (it's re-calculated each frame)
        for (const building of this.buildings) {
            if (building.coverageNeeds && 'water' in building.coverageNeeds) {
                building.coverageNeeds.water = 0;
            }
        }

        // Then apply coverage from each source
        for (const building of this.buildings) {
            const staticCoverage = building.type.staticCoverage;
            if (!staticCoverage) continue;

            const { type: coverageType, distanceAmounts } = staticCoverage;
            if (!distanceAmounts) continue;

            const centerX = building.x + Math.floor(building.width / 2);
            const centerY = building.y + Math.floor(building.height / 2);

            // Find maximum distance defined
            const maxDist = Math.max(...Object.keys(distanceAmounts).map(Number));

            // Find all houses and add coverage based on distance
            for (const other of this.buildings) {
                if (!other.coverageNeeds) continue; // Only houses receive coverage

                // Calculate Manhattan distance to closest tile of house
                let minDist = Infinity;
                for (let dy = 0; dy < other.height; dy++) {
                    for (let dx = 0; dx < other.width; dx++) {
                        const houseX = other.x + dx;
                        const houseY = other.y + dy;
                        // Manhattan distance
                        const dist = Math.abs(houseX - centerX) + Math.abs(houseY - centerY);
                        minDist = Math.min(minDist, dist);
                    }
                }

                // Add coverage based on distance (cumulative)
                if (minDist <= maxDist && distanceAmounts[minDist] !== undefined) {
                    other.addCoverage(coverageType, distanceAmounts[minDist]);
                }
            }
        }
    }

    spawnWalker(building) {
        if (building.roadAccessX === undefined) return;

        // Get a random path from the building's road access
        const path = this.roadNetwork.getRandomPath(
            building.roadAccessX,
            building.roadAccessY,
            15
        );

        if (path.length > 1) {
            const walker = new Walker(
                building.roadAccessX,
                building.roadAccessY,
                path,
                building,
                building.type.coverageType,
                building.type.walkerColor || '#ff0000'
            );
            this.entityManager.addEntity(walker);
        }
    }
}
