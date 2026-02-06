import { BUILDING_TYPES, getBuildingTypeByKey } from './world/BuildingTypes.js';

export class Input {
    constructor(canvas, tileSize, game) {
        this.canvas = canvas;
        this.tileSize = tileSize;
        this.game = game;

        // Current placement mode
        this.mode = 'road'; // 'road' or 'building'
        this.selectedBuildingType = BUILDING_TYPES.house;

        // Mouse state
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseDown = false;

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));

        // Keyboard events
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
    }

    screenToTile(screenX, screenY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((screenX - rect.left) / this.tileSize);
        const y = Math.floor((screenY - rect.top) / this.tileSize);
        return { x, y };
    }

    onMouseDown(e) {
        this.isMouseDown = true;
        const { x, y } = this.screenToTile(e.clientX, e.clientY);
        this.game.onTileClick(x, y, e.button);
    }

    onMouseUp(e) {
        this.isMouseDown = false;
    }

    onMouseMove(e) {
        const { x, y } = this.screenToTile(e.clientX, e.clientY);
        this.mouseX = x;
        this.mouseY = y;

        // Drag to place roads
        if (this.isMouseDown && this.mode === 'road') {
            this.game.onTileClick(x, y, 0);
        }
    }

    onKeyDown(e) {
        if (e.key === '1') {
            this.mode = 'road';
            return;
        }

        // Debug controls
        if (e.key.toLowerCase() === 'o') {
            this.game.toggleOverlays();
            return;
        }
        if (e.key.toLowerCase() === 'p') {
            this.game.toggleSprites();
            return;
        }

        // Check for building type keys
        const buildingType = getBuildingTypeByKey(e.key);
        if (buildingType) {
            this.mode = 'building';
            this.selectedBuildingType = buildingType;
        }
    }

    getModeDisplay() {
        if (this.mode === 'road') {
            return 'ROAD';
        }
        return this.selectedBuildingType.name.toUpperCase();
    }
}
