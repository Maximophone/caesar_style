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
import { SaveManager } from './SaveManager.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Game settings
        this.tileSize = 24;
        this.gridWidth = 60; // Increased map size
        this.gridHeight = 60;

        // Set canvas size (Viewport)
        this.canvas.width = 800;
        this.canvas.height = 600;

        // Initialize systems
        this.assetManager = new AssetManager();
        this.grid = new Grid(this.gridWidth, this.gridHeight);
        this.grid.generateResources();
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

        // Camera
        this.camera = { x: 0, y: 0 };
        this.cameraSpeed = 300; // pixels per second

        // Debug controls
        this.debug = {
            showOverlays: true,
            useSprites: true
        };

        // Flash message (for save/load feedback)
        this.flashMessage = null;
        this.flashTimer = 0;
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
        this.handleCameraMovement(deltaTime);
        this.buildingManager.update(deltaTime);
        this.entityManager.update(deltaTime, this.roadNetwork, this.grid, this.economy);
        this.economy.update(deltaTime, this.buildingManager.buildings);

        // Flash message timer
        if (this.flashTimer > 0) {
            this.flashTimer -= deltaTime;
            if (this.flashTimer <= 0) {
                this.flashMessage = null;
            }
        }
    }

    handleCameraMovement(deltaTime) {
        let dx = 0;
        let dy = 0;

        // Arrow keys
        if (this.input.keys['ArrowLeft']) dx -= 1;
        if (this.input.keys['ArrowRight']) dx += 1;
        if (this.input.keys['ArrowUp']) dy -= 1;
        if (this.input.keys['ArrowDown']) dy += 1;

        // Apply movement
        if (dx !== 0 || dy !== 0) {
            // Normalize diagonal movement
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;

            this.camera.x += dx * this.cameraSpeed * deltaTime;
            this.camera.y += dy * this.cameraSpeed * deltaTime;
        }

        // Clamp camera to map bounds
        // Allow scrolling a bit past the edge (e.g., half screen) for better visibility
        const maxX = (this.gridWidth * this.tileSize) - this.canvas.width;
        const maxY = (this.gridHeight * this.tileSize) - this.canvas.height;

        // Ensure we don't scroll into negative (if map is smaller than canvas)
        this.camera.x = Math.max(0, Math.min(this.camera.x, Math.max(0, maxX)));
        this.camera.y = Math.max(0, Math.min(this.camera.y, Math.max(0, maxY)));
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#16213e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        // Apply camera translation
        this.ctx.translate(-Math.floor(this.camera.x), -Math.floor(this.camera.y));

        // Render grid
        this.renderer.renderGrid(this.grid, this.debug);

        // Render roads
        this.renderer.renderRoads(this.grid, this.roadNetwork, this.debug);

        // Render buildings
        const hoveredBuilding = this.input.getHoveredBuilding(this.grid);
        this.renderer.renderBuildings(this.buildingManager.buildings, this.debug, hoveredBuilding);

        // Render entities
        this.renderer.renderEntities(this.entityManager.entities);

        this.ctx.restore();

        // Render UI hints (fixed on screen)
        this.renderer.renderUI(this.input, this.economy, this.debug, this.buildingMenu);

        // Render flash message
        if (this.flashMessage && this.flashTimer > 0) {
            this.renderer.renderFlashMessage(this.flashMessage, this.flashTimer);
        }
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

    // ===== SAVE / LOAD =====

    showFlash(message, duration = 2) {
        this.flashMessage = message;
        this.flashTimer = duration;
    }

    saveGame() {
        const ok = SaveManager.save(this);
        this.showFlash(ok ? '💾 Game Saved!' : '❌ Save Failed!');
    }

    loadGame() {
        const ok = SaveManager.load(this);
        this.showFlash(ok ? '📂 Game Loaded!' : '❌ No Save Found');
    }

    newGame() {
        // Clear everything
        this.entityManager.entities = [];
        this.entityManager.toRemove = [];
        this.buildingManager.buildings = [];

        // Fresh grid
        this.grid = new Grid(this.gridWidth, this.gridHeight);
        this.grid.generateResources();
        this.roadNetwork = new RoadNetwork(this.grid);
        this.buildingManager.grid = this.grid;
        this.buildingManager.roadNetwork = this.roadNetwork;

        // Fresh economy
        this.economy = new Economy();

        // Reset camera
        this.camera = { x: 0, y: 0 };

        this.showFlash('🏗️ New Game Started!');
    }
}
