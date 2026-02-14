export class Input {
    constructor(canvas, tileSize, game) {
        this.canvas = canvas;
        this.tileSize = tileSize;
        this.game = game;

        // Mouse state
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseDown = false;
        // Store raw client coordinates for re-calculating tile under mouse during scroll
        this.lastMouseClientX = 0;
        this.lastMouseClientY = 0;
        this.mouseButton = null;
        // Keyboard state
        this.keys = {};

        // New game confirmation (double-press N within 2s)
        this.newGamePending = false;
        this.newGameTimer = null;

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
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
    }

    screenToTile(screenX, screenY) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseCanvasX = screenX - rect.left;

        // SIDEBAR CHECK: If mouse is in sidebar area, return invalid tile
        if (mouseCanvasX >= 800) {
            return { x: -1, y: -1, inSidebar: true };
        }

        const camX = this.game.camera ? this.game.camera.x : 0;
        const camY = this.game.camera ? this.game.camera.y : 0;

        const x = Math.floor((mouseCanvasX + camX) / this.tileSize);
        const y = Math.floor((screenY - rect.top + camY) / this.tileSize);
        return { x, y, inSidebar: false };
    }

    isInSidebar(screenX) {
        const rect = this.canvas.getBoundingClientRect();
        return (screenX - rect.left) >= 800;
    }

    onMouseDown(e) {
        this.isMouseDown = true;
        this.mouseButton = e.button;

        // Middle mouse drag start
        if (e.button === 1) {
            e.preventDefault(); // Prevent default scroll
            this.lastDragX = e.clientX;
            this.lastDragY = e.clientY;
            return;
        }

        if (this.isInSidebar(e.clientX)) {
            // Sidebar interaction (maybe in future handled here, but Menu handles keys for now)
            return;
        }

        const { x, y, inSidebar } = this.screenToTile(e.clientX, e.clientY);
        if (!inSidebar) {
            this.game.onTileClick(x, y, e.button);
        }
    }

    onMouseUp(e) {
        this.isMouseDown = false;
        this.mouseButton = null;
    }

    onMouseMove(e) {
        this.lastMouseClientX = e.clientX;
        this.lastMouseClientY = e.clientY;

        // Middle mouse drag
        if (this.isMouseDown && this.mouseButton === 1) {
            const dx = e.clientX - this.lastDragX;
            const dy = e.clientY - this.lastDragY;

            // Update camera position directly
            // Dragging left moves camera right (world moves left)
            this.game.camera.x -= dx;
            this.game.camera.y -= dy;

            // Update last pos
            this.lastDragX = e.clientX;
            this.lastDragY = e.clientY;

            // Clamp camera
            const maxX = (this.game.gridWidth * this.game.tileSize) - this.game.canvas.width;
            const maxY = (this.game.gridHeight * this.game.tileSize) - this.game.canvas.height;
            this.game.camera.x = Math.max(0, Math.min(this.game.camera.x, Math.max(0, maxX)));
            this.game.camera.y = Math.max(0, Math.min(this.game.camera.y, Math.max(0, maxY)));

            return;
        }

        const { x, y, inSidebar } = this.screenToTile(e.clientX, e.clientY);
        this.mouseX = x;
        this.mouseY = y;

        // Handle drag interactions (Left/Right click) - only if in map area
        if (this.isMouseDown && !inSidebar) {
            if (this.mouseButton === 2) {
                // Right click drag -> Delete
                this.game.onTileClick(x, y, 2);
            } else if (this.mouseButton === 0) {
                // Left click drag -> Place road (if in road mode)
                const menu = this.game.buildingMenu;
                if (menu.placementMode === 'road') {
                    this.game.onTileClick(x, y, 0);
                }
            }
        }
    }

    onKeyDown(e) {
        this.keys[e.key] = true;

        // Debug controls
        if (e.key.toLowerCase() === 'o') {
            this.game.toggleOverlays();
            return;
        }
        if (e.key.toLowerCase() === 'p') {
            this.game.toggleSprites();
            return;
        }

        // Cheat: Press C for cash
        if (e.key.toLowerCase() === 'c') {
            this.game.economy.earn(500);
            return;
        }

        // Save game: F5
        if (e.key === 'F5') {
            e.preventDefault(); // Prevent browser refresh
            this.game.saveGame();
            return;
        }

        // Load game: F9
        if (e.key === 'F9') {
            e.preventDefault();
            this.game.loadGame();
            return;
        }

        // New game: N (double-press to confirm)
        if (e.key.toLowerCase() === 'n') {
            if (this.newGamePending) {
                // Second press — confirmed
                clearTimeout(this.newGameTimer);
                this.newGamePending = false;
                this.game.newGame();
            } else {
                // First press — arm confirmation
                this.newGamePending = true;
                this.game.showFlash('⚠️ Press N again to start new game', 2);
                this.newGameTimer = setTimeout(() => {
                    this.newGamePending = false;
                }, 2000);
            }
            return;
        }

        // Pass key to building menu
        const handled = this.game.buildingMenu.handleKeyPress(e.key);
        if (handled) {
            e.preventDefault();
        }
    }

    onKeyUp(e) {
        this.keys[e.key] = false;
    }

    // Get current mode from building menu
    get mode() {
        return this.game.buildingMenu.placementMode || 'none';
    }

    // Get selected building from menu
    get selectedBuildingType() {
        return this.game.buildingMenu.selectedBuilding;
    }

    getModeDisplay() {
        return this.game.buildingMenu.getSelectionText();
    }

    getHoveredBuilding(grid) {
        // Always recalculate based on current camera position
        const { x, y } = this.screenToTile(this.lastMouseClientX, this.lastMouseClientY);
        const tile = grid.getTile(x, y);
        if (tile && tile.type === 'building' && tile.building) {
            return tile.building;
        }
        return null;
    }
}
