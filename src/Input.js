export class Input {
    constructor(canvas, tileSize, game) {
        this.canvas = canvas;
        this.tileSize = tileSize;
        this.game = game;

        // Mouse state
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseDown = false;
        this.mouseButton = null;

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
        this.mouseButton = e.button;
        const { x, y } = this.screenToTile(e.clientX, e.clientY);
        this.game.onTileClick(x, y, e.button);
    }

    onMouseUp(e) {
        this.isMouseDown = false;
        this.mouseButton = null;
    }

    onMouseMove(e) {
        const { x, y } = this.screenToTile(e.clientX, e.clientY);
        this.mouseX = x;
        this.mouseY = y;

        // Handle drag interactions
        if (this.isMouseDown) {
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

        // Pass key to building menu
        const handled = this.game.buildingMenu.handleKeyPress(e.key);
        if (handled) {
            e.preventDefault();
        }
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
}
