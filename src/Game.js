import { Renderer } from './Renderer.js';
import { Grid } from './world/Grid.js';
import { Input } from './Input.js';
import { RoadNetwork } from './world/RoadNetwork.js';
import { EntityManager } from './entities/EntityManager.js';
import { BuildingManager } from './world/BuildingManager.js';
import { Economy } from './Economy.js';
import { ROAD_COST } from './world/BuildingTypes.js';
import { AssetManager } from './AssetManager.js';
import { BuildingMenu } from './ui/BuildingMenu.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Game settings
        this.tileSize = 24;
        this.gridWidth = 32;
        this.gridHeight = 24;

        // Set canvas size
        this.canvas.width = this.gridWidth * this.tileSize;
        this.canvas.height = this.gridHeight * this.tileSize;

        // Initialize systems
        this.assetManager = new AssetManager();
        this.grid = new Grid(this.gridWidth, this.gridHeight);
        this.roadNetwork = new RoadNetwork(this.grid);
        this.entityManager = new EntityManager();
        this.buildingManager = new BuildingManager(this.grid, this.roadNetwork, this.entityManager);
        this.economy = new Economy();
        this.renderer = new Renderer(this.ctx, this.tileSize, this.assetManager); // Pass assetManager to renderer
        this.input = new Input(this.canvas, this.tileSize, this);
        this.buildingMenu = new BuildingMenu();

        // Timing
        this.lastTime = 0;
        this.running = false;

        // Debug controls
        this.debug = {
            showOverlays: true,
            useSprites: true
        };
    }

    toggleOverlays() {
        this.debug.showOverlays = !this.debug.showOverlays;
        console.log('Overlays:', this.debug.showOverlays);
    }

    toggleSprites() {
        this.debug.useSprites = !this.debug.useSprites;
        console.log('Sprites:', this.debug.useSprites);
    }

    async init() {
        // Cache buster for new file - Updated for new grass tiles
        const t = Date.now();
        await this.assetManager.loadImages({
            'road_tiles': `assets/road_tiles_optimized.png?t=${t}`,
            'grass_tiles': `assets/grass_tiles.png?t=${t}`,
            // 4-tile spritesheets (rotational buildings)
            'house_level_1': `assets/house_level_1.png?t=${t}`,
            'house_level_2': `assets/house_level_2.png?t=${t}`,
            'house_level_3': `assets/house_level_3.png?t=${t}`,
            'house_level_4': `assets/house_level_4.png?t=${t}`,
            'market': `assets/market.png?t=${t}`,
            'temple': `assets/temple.png?t=${t}`,
            // Single-direction sprites (using _south suffix)
            'well_south': `assets/well_south.png?t=${t}`,
            'fountain_south': `assets/fountain_south.png?t=${t}`,
            'garden_small_south': `assets/garden_small_south.png?t=${t}`,
            'garden_large_south': `assets/garden_large_south.png?t=${t}`,
            'farm_south': `assets/farm_south.png?t=${t}`
        });

        // Apply transparency at runtime as requested by user to keep source image editable
        // Target Raspberry: R=189 G=9 B=115
        this.assetManager.applyFuzzyTransparency('road_tiles', 189, 9, 115, 40);

        // Auto-detect corner color for buildings (magenta/pink variations)
        this.assetManager.applyTransparencyFromCorner('house_level_1', 40);
        this.assetManager.applyTransparencyFromCorner('house_level_2', 40);
        this.assetManager.applyTransparencyFromCorner('house_level_3', 40);
        this.assetManager.applyTransparencyFromCorner('house_level_4', 40);
        this.assetManager.applyTransparencyFromCorner('market', 40);
        this.assetManager.applyTransparencyFromCorner('temple', 40);
        this.assetManager.applyTransparencyFromCorner('well_south', 40);
        this.assetManager.applyTransparencyFromCorner('fountain_south', 40);
        this.assetManager.applyTransparencyFromCorner('garden_small_south', 40);
        this.assetManager.applyTransparencyFromCorner('garden_large_south', 40);
        this.assetManager.applyTransparencyFromCorner('farm_south', 40);

        // Try to load optional directional sprites for buildings
        // These won't fail if they don't exist
        await this.loadOptionalDirectionalSprites();

        console.log('Assets loaded');
    }

    /**
     * Attempt to load directional sprites for buildings.
     * Files are optional - missing files are silently ignored.
     */
    async loadOptionalDirectionalSprites() {
        const t = Date.now();
        const directions = ['south', 'north', 'east', 'west'];
        const baseNames = [
            'house_level_1', 'house_level_2', 'house_level_3', 'house_level_4',
            'well', 'fountain', 'market', 'temple', 'farm', 'warehouse',
            'garden_small', 'garden_large', 'tax_office'
        ];

        const loadPromises = [];
        for (const baseName of baseNames) {
            for (const dir of directions) {
                const key = `${baseName}_${dir}`;
                const src = `assets/${key}.png?t=${t}`;
                loadPromises.push(
                    this.assetManager.tryLoadImage(key, src).then(loaded => {
                        if (loaded) {
                            // Apply transparency to the loaded sprite
                            this.assetManager.applyTransparencyFromCorner(key, 40);
                            console.log(`Loaded directional sprite: ${key}`);
                        }
                    })
                );
            }
        }
        await Promise.all(loadPromises);
    }

    start() {
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.loop(time));
    }

    stop() {
        this.running = false;
    }

    loop(currentTime) {
        if (!this.running) return;

        const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame((time) => this.loop(time));
    }

    update(deltaTime) {
        this.buildingManager.update(deltaTime);
        this.entityManager.update(deltaTime, this.roadNetwork, this.grid, this.economy);
        this.economy.update(deltaTime, this.buildingManager.buildings);
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#16213e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Render grid
        this.renderer.renderGrid(this.grid, this.debug);

        // Render roads
        this.renderer.renderRoads(this.grid, this.roadNetwork, this.debug);

        // Render buildings
        this.renderer.renderBuildings(this.buildingManager.buildings, this.debug);

        // Render entities
        this.renderer.renderEntities(this.entityManager.entities);

        // Render UI hints
        this.renderer.renderUI(this.input, this.economy, this.debug, this.buildingMenu);
    }

    // Called by Input when a tile is clicked
    onTileClick(x, y, button) {
        if (button === 0) { // Left click
            if (this.input.mode === 'road') {
                this.placeRoad(x, y);
            } else if (this.input.mode === 'building') {
                this.placeBuilding(x, y);
            }
        } else if (button === 2) { // Right click
            this.removeTile(x, y);
        }
    }

    placeRoad(x, y) {
        if (this.grid.getTile(x, y) === null) {
            if (!this.economy.canAfford(ROAD_COST)) return;

            this.economy.spend(ROAD_COST);
            this.grid.setTile(x, y, { type: 'road' });
            this.roadNetwork.addRoad(x, y);
        }
    }

    placeBuilding(x, y) {
        const type = this.input.selectedBuildingType;
        if (!this.economy.canAfford(type.cost)) return;

        const building = this.buildingManager.placeBuilding(x, y, type);
        if (building) {
            this.economy.spend(type.cost);
        }
    }

    removeTile(x, y) {
        const tile = this.grid.getTile(x, y);
        if (tile) {
            if (tile.type === 'road') {
                this.roadNetwork.removeRoad(x, y);
            } else if (tile.type === 'building') {
                this.buildingManager.removeBuilding(x, y);
            }
            this.grid.setTile(x, y, null);
        }
    }
}
