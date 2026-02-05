import { ColorSprite } from './sprites/Sprite.js';

export class Renderer {
    constructor(ctx, tileSize) {
        this.ctx = ctx;
        this.tileSize = tileSize;

        // Define sprites (colored rectangles for now)
        this.sprites = {
            grass: new ColorSprite('#2d5a27'),
            road: new ColorSprite('#8b7355'),
            walker: new ColorSprite('#e74c3c'),
        };
    }

    renderGrid(grid) {
        const ctx = this.ctx;
        const ts = this.tileSize;

        // Draw grass background for each tile
        for (let y = 0; y < grid.height; y++) {
            for (let x = 0; x < grid.width; x++) {
                this.sprites.grass.render(ctx, x * ts, y * ts, ts, ts);

                // Draw subtle grid lines
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
                ctx.strokeRect(x * ts, y * ts, ts, ts);
            }
        }
    }

    renderRoads(grid) {
        const ctx = this.ctx;
        const ts = this.tileSize;

        for (let y = 0; y < grid.height; y++) {
            for (let x = 0; x < grid.width; x++) {
                const tile = grid.getTile(x, y);
                if (tile && tile.type === 'road') {
                    this.sprites.road.render(ctx, x * ts + 2, y * ts + 2, ts - 4, ts - 4);
                }
            }
        }
    }

    renderBuildings(buildings) {
        const ctx = this.ctx;
        const ts = this.tileSize;

        for (const building of buildings) {
            const x = building.x * ts;
            const y = building.y * ts;
            const w = building.width * ts;
            const h = building.height * ts;

            // Get coverage-based color (green -> yellow -> red)
            const coverage = building.getCoveragePercent();
            const color = this.getCoverageColor(coverage);

            // Building body with coverage color
            ctx.fillStyle = color;
            ctx.fillRect(x + 2, y + 2, w - 4, h - 4);

            // Building outline (darker version)
            ctx.strokeStyle = this.darkenColor(color, 0.3);
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);

            // Door indicator (shows road access point)
            if (building.doorX !== undefined) {
                ctx.fillStyle = '#5a3e1b';
                const doorX = building.doorX * ts + ts / 4;
                const doorY = building.doorY * ts + ts / 4;
                ctx.fillRect(doorX, doorY, ts / 2, ts / 2);
            }

            // Coverage bar above building
            this.renderCoverageBar(ctx, x, y - 8, w, 4, coverage);
        }
    }

    getCoverageColor(coverage) {
        // Lerp from red (0%) -> yellow (50%) -> green (100%)
        if (coverage <= 0) {
            return '#c0392b'; // Red
        } else if (coverage < 0.5) {
            // Red to yellow
            const t = coverage * 2;
            const r = Math.round(192 + (241 - 192) * t);
            const g = Math.round(57 + (196 - 57) * t);
            const b = Math.round(43 + (15 - 43) * t);
            return `rgb(${r},${g},${b})`;
        } else {
            // Yellow to green
            const t = (coverage - 0.5) * 2;
            const r = Math.round(241 + (39 - 241) * t);
            const g = Math.round(196 + (174 - 196) * t);
            const b = Math.round(15 + (96 - 15) * t);
            return `rgb(${r},${g},${b})`;
        }
    }

    darkenColor(color, amount) {
        // Simple darkening for outline
        if (color.startsWith('rgb')) {
            const match = color.match(/rgb\((\d+),(\d+),(\d+)\)/);
            if (match) {
                const r = Math.round(parseInt(match[1]) * (1 - amount));
                const g = Math.round(parseInt(match[2]) * (1 - amount));
                const b = Math.round(parseInt(match[3]) * (1 - amount));
                return `rgb(${r},${g},${b})`;
            }
        }
        return '#5a3e1b';
    }

    renderCoverageBar(ctx, x, y, width, height, coverage) {
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, width, height);

        // Fill
        if (coverage > 0) {
            ctx.fillStyle = this.getCoverageColor(coverage);
            ctx.fillRect(x, y, width * coverage, height);
        }

        // Border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    renderEntities(entities) {
        const ctx = this.ctx;
        const ts = this.tileSize;

        for (const entity of entities) {
            // Entities use sub-tile positions for smooth movement
            const x = entity.x * ts + ts / 4;
            const y = entity.y * ts + ts / 4;
            const size = ts / 2;

            this.sprites.walker.render(ctx, x, y, size, size);

            // Direction indicator
            ctx.fillStyle = '#c0392b';
            const cx = x + size / 2;
            const cy = y + size / 2;
            const dx = entity.dx * 4;
            const dy = entity.dy * 4;
            ctx.beginPath();
            ctx.arc(cx + dx, cy + dy, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    renderUI(input) {
        const ctx = this.ctx;

        // Mode indicator
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 180, 60);

        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';
        ctx.fillText(`Mode: ${input.mode.toUpperCase()}`, 20, 30);
        ctx.fillText('[1] Road  [2] Building', 20, 50);
        ctx.fillText('LClick: Place  RClick: Remove', 20, 65);
    }
}
