import { Building } from './world/Building.js';
import { BUILDING_TYPES } from './world/BuildingTypes.js';

const SAVE_KEY = 'caesar_style_save';
const SAVE_VERSION = 1;

export class SaveManager {

    /**
     * Serialize the full game state into a plain object.
     */
    static serialize(game) {
        return {
            version: SAVE_VERSION,
            timestamp: Date.now(),

            // Grid resources (sparse: only non-null entries)
            grid: {
                width: game.grid.width,
                height: game.grid.height,
                resources: SaveManager._serializeResources(game.grid),
            },

            // Roads as array of "x,y" strings
            roads: Array.from(game.roadNetwork.roads),

            // Buildings
            buildings: game.buildingManager.buildings.map(b => b.toJSON()),

            // Economy (only money — pop/employment are recalculated)
            economy: {
                money: game.economy.money,
            },

            // Camera
            camera: { x: game.camera.x, y: game.camera.y },
        };
    }

    /**
     * Deserialize saved data and rebuild all game state in-place.
     */
    static deserialize(game, data) {
        if (!data || data.version !== SAVE_VERSION) {
            console.warn('Save data version mismatch or missing');
            return false;
        }

        // --- Clear current state ---
        game.entityManager.entities = [];
        game.entityManager.toRemove = [];
        game.buildingManager.buildings = [];

        // --- Grid ---
        const gd = data.grid;
        // Re-create grid arrays
        for (let y = 0; y < gd.height; y++) {
            game.grid.tiles[y] = [];
            game.grid.resources[y] = [];
            for (let x = 0; x < gd.width; x++) {
                game.grid.tiles[y][x] = null;
                game.grid.resources[y][x] = null;
            }
        }
        // Restore resources from sparse list
        for (const entry of gd.resources) {
            game.grid.resources[entry.y][entry.x] = entry.type;
        }

        // --- Roads ---
        game.roadNetwork.roads = new Set(data.roads);
        // Also set grid tiles for roads
        for (const key of data.roads) {
            const [x, y] = key.split(',').map(Number);
            game.grid.setTile(x, y, { type: 'road' });
        }

        // --- Buildings ---
        for (const bd of data.buildings) {
            const type = BUILDING_TYPES[bd.typeId];
            if (!type) {
                console.warn(`Unknown building type: ${bd.typeId}, skipping`);
                continue;
            }

            const building = Building.fromSaveData(bd, type);
            game.buildingManager.buildings.push(building);

            // Set grid tiles for this building
            for (let dy = 0; dy < building.height; dy++) {
                for (let dx = 0; dx < building.width; dx++) {
                    game.grid.setTile(building.x + dx, building.y + dy, {
                        type: 'building',
                        building: building,
                    });
                }
            }
        }

        // --- Economy ---
        game.economy.money = data.economy.money;
        // Recalculate pop/employment from restored buildings
        game.economy.recalculatePopulation(game.buildingManager.buildings);
        game.economy.assignWorkers(game.buildingManager.buildings);

        // --- Camera ---
        if (data.camera) {
            game.camera.x = data.camera.x;
            game.camera.y = data.camera.y;
        }

        return true;
    }

    /**
     * Save game state to localStorage.
     */
    static save(game) {
        try {
            const data = SaveManager.serialize(game);
            localStorage.setItem(SAVE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Failed to save game:', e);
            return false;
        }
    }

    /**
     * Load game state from localStorage.
     */
    static load(game) {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return false;

            const data = JSON.parse(raw);
            return SaveManager.deserialize(game, data);
        } catch (e) {
            console.error('Failed to load game:', e);
            return false;
        }
    }

    /**
     * Check if a save exists in localStorage.
     */
    static hasSave() {
        return localStorage.getItem(SAVE_KEY) !== null;
    }

    // ------ Private helpers ------

    static _serializeResources(grid) {
        const entries = [];
        for (let y = 0; y < grid.height; y++) {
            for (let x = 0; x < grid.width; x++) {
                const r = grid.resources[y][x];
                if (r !== null) {
                    entries.push({ x, y, type: r });
                }
            }
        }
        return entries;
    }
}
