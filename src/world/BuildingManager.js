import { Building } from './Building.js';
import { Walker } from '../entities/Walker.js';
import { CartWalker } from '../entities/CartWalker.js';
import { BUILDING_TYPES, GOODS_CONFIG } from './BuildingTypes.js';

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
        const needsRoad = type.needsRoadAccess !== false;
        let doorPos = null;

        if (needsRoad) {
            doorPos = this.findDoorPosition(x, y, width, height);
            if (!doorPos) {
                return null; // Must be placed next to a road
            }
        }

        // Create building
        const building = new Building(x, y, type);

        if (doorPos) {
            building.doorX = doorPos.x;
            building.doorY = doorPos.y;
            building.roadAccessX = doorPos.roadX;
            building.roadAccessY = doorPos.roadY;

            // Determine rotation based on side
            if (doorPos.side === 'top') building.rotation = 2;      // North
            else if (doorPos.side === 'right') building.rotation = 1; // East
            else if (doorPos.side === 'bottom') building.rotation = 0; // South
            else if (doorPos.side === 'left') building.rotation = 3;  // West
        } else {
            // Default rotation for buildings without road access
            building.rotation = 0;
        }


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
                    let side = 'top';
                    if (road.y < y) side = 'top';
                    else if (road.y >= y + height) side = 'bottom';
                    else if (road.x < x) side = 'left';
                    else if (road.x >= x + width) side = 'right';

                    return {
                        x: edge.bx,
                        y: edge.by,
                        roadX: road.x,
                        roadY: road.y,
                        side: side
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
            building.update(deltaTime, this.grid);

            // Check each walker slot for readiness
            for (let i = 0; i < building.walkerSlots.length; i++) {
                if (building.isWalkerSlotReady(i)) {
                    this.spawnWalkerFromSlot(building, i);
                }
            }
        }
    }

    // Apply coverage from buildings with staticCoverage (like wells)
    // Coverage is cumulative and distance-based
    applyStaticCoverage() {
        // First, reset water and desirability coverage for all houses (re-calculated each frame)
        for (const building of this.buildings) {
            if (building.coverageNeeds) {
                if ('water' in building.coverageNeeds) building.coverageNeeds.water = 0;
                if ('desirability' in building.coverageNeeds) building.coverageNeeds.desirability = 0;
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

    // Unified walker spawning from a slot
    spawnWalkerFromSlot(building, slotIndex) {
        if (building.roadAccessX === undefined) return;

        const slot = building.walkerSlots[slotIndex];
        const config = slot.config;

        if (config.type === 'service') {
            this.spawnServiceWalker(building, slotIndex, config);
        } else if (config.type === 'cart') {
            this.spawnCartWalker(building, slotIndex, config);
        }
    }

    // Spawn a service walker (random patrol, coverage emitting)
    spawnServiceWalker(building, slotIndex, config) {
        const pathLength = config.pathLength || 15;
        const path = this.roadNetwork.getRandomPath(
            building.roadAccessX,
            building.roadAccessY,
            pathLength
        );

        if (path.length > 1) {
            // Load cargo if this building distributes goods
            let cargo = null;
            if (building.type.goods?.distributes && building.hasGoodsToDistribute()) {
                cargo = building.takeGoodsForDistributor();
            }

            const walker = new Walker(
                building.roadAccessX,
                building.roadAccessY,
                path,
                building,
                slotIndex,
                config.coverageType,
                building.type.color,
                cargo
            );
            this.entityManager.addEntity(walker);
            building.onWalkerSpawned(slotIndex);
        }
    }

    // Spawn a cart walker (A* targeted delivery)
    spawnCartWalker(building, slotIndex, config) {
        // Determine what goods to emit
        const emits = building.type.goods?.emits;
        if (!emits || emits.length === 0) return;

        // Find the good type we have enough of
        const goodType = emits.find(g => (building.storage?.[g] || 0) >= GOODS_CONFIG.CART_CAPACITY);
        if (!goodType) return;

        // Find best target building
        const target = this.findAcceptingBuilding(goodType, building);
        if (!target) return;

        // Get path to target building
        const path = this.roadNetwork.findPath(
            building.roadAccessX,
            building.roadAccessY,
            target.roadAccessX,
            target.roadAccessY
        );

        if (path && path.length >= 1) {
            const cargo = building.takeGoodsForCart();

            if (cargo.amount > 0) {
                const cartWalker = new CartWalker(
                    building.roadAccessX,
                    building.roadAccessY,
                    path,
                    building,
                    target,
                    cargo,
                    slotIndex,
                    building.type.color
                );
                this.entityManager.addEntity(cartWalker);
                building.onWalkerSpawned(slotIndex);
            }
        }
    }

    // Find the most empty building that accepts a given good type
    findAcceptingBuilding(goodType, fromBuilding) {
        let best = null;
        let lowestFillPercent = Infinity;

        for (const building of this.buildings) {
            if (building === fromBuilding) continue;
            if (!building.type.goods?.receives?.includes(goodType)) continue;
            if (building.roadAccessX === undefined) continue;

            // Don't deliver to buildings that also emit the same good (prevents loops)
            if (building.type.goods?.emits?.includes(goodType)) continue;

            // Check if building has space for goods
            const current = building.storage?.[goodType] || 0;
            const max = building.getMaxStorage(goodType);
            if (current >= max) continue;  // Full, skip

            // Calculate fill percentage (lower = more empty = better)
            const fillPercent = max > 0 ? current / max : 1;

            if (fillPercent < lowestFillPercent) {
                lowestFillPercent = fillPercent;
                best = building;
            }
        }

        return best;
    }

}
