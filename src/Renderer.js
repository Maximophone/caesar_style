import { ColorSprite } from './sprites/Sprite.js';

export class Renderer {
    constructor(ctx, tileSize) {
        this.ctx = ctx;
        this.tileSize = tileSize;

        // Define sprites (colored rectangles for now)
        this.sprites = {
            grass: new ColorSprite('#2d5a27'),
            road: new ColorSprite('#8b7355'),
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

            // Get building type color
            let color = building.type.color;

            // For houses, use level-based color and apply coverage tint
            if (building.coverageNeeds) {
                const baseColor = building.getLevelColor();
                const coverage = building.getCoveragePercent();
                color = this.applyFadeTint(baseColor, coverage);
            }

            // Building body
            ctx.fillStyle = color;
            ctx.fillRect(x + 2, y + 2, w - 4, h - 4);

            // Building outline (darker)
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

            // House-specific UI
            if (building.coverageNeeds) {
                const levels = building.getCoverageLevels();

                // Show walker-based coverage (food, religion) - water is shown via icon
                const walkerLevels = { food: levels.food, religion: levels.religion };
                this.renderWalkerCoverageBar(ctx, x, y - 10, w, 6, walkerLevels);

                // Evolution bar (shows progress toward upgrade/downgrade)
                this.renderEvolutionBar(ctx, x, y + h + 2, w, 4, building.evolutionProgress);

                // Show level number in top-left corner
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 12px sans-serif';
                ctx.fillText(building.level, x + 6, y + 14);

                // Show water status as blue droplet inside top-right corner of house
                if (levels.water > 0.5) {
                    ctx.fillStyle = '#4169E1';
                    ctx.beginPath();
                    ctx.arc(x + w - 10, y + 10, 5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#87CEEB';
                    ctx.beginPath();
                    ctx.arc(x + w - 11, y + 9, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Employment indicator for service buildings
            if (building.type.workersNeeded > 0) {
                const fill = building.workers / building.type.workersNeeded;
                this.renderEmploymentBar(ctx, x, y - 8, w, 4, fill, building.isStaffed());
            }
        }
    }

    // Apply fade from full color (100% coverage) to gray (0% coverage)
    applyFadeTint(hexColor, coverage) {
        // Parse hex color
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);

        // Gray target
        const gray = 80;

        // Lerp each channel
        const newR = Math.round(gray + (r - gray) * coverage);
        const newG = Math.round(gray + (g - gray) * coverage);
        const newB = Math.round(gray + (b - gray) * coverage);

        return `rgb(${newR},${newG},${newB})`;
    }

    darkenColor(color, amount) {
        // Handle rgb format
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
            const barColor = coverage > 0.6 ? '#27ae60' : coverage > 0.3 ? '#f1c40f' : '#c0392b';
            ctx.fillStyle = barColor;
            ctx.fillRect(x, y, width * coverage, height);
        }

        // Border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    // Render 3 separate bars for water, food, religion
    renderMultiCoverageBar(ctx, x, y, width, height, levels) {
        const coverageTypes = [
            { key: 'water', color: '#4169E1', label: 'W' },     // Blue
            { key: 'food', color: '#DAA520', label: 'F' },      // Gold
            { key: 'religion', color: '#9370DB', label: 'R' }   // Purple
        ];

        const segmentWidth = width / coverageTypes.length;
        const gap = 1;

        for (let i = 0; i < coverageTypes.length; i++) {
            const type = coverageTypes[i];
            const level = levels[type.key] || 0;
            const sx = x + i * segmentWidth + gap / 2;
            const sw = segmentWidth - gap;

            // Background (dark)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(sx, y, sw, height);

            // Fill based on level
            if (level > 0) {
                ctx.fillStyle = type.color;
                ctx.fillRect(sx, y, sw * level, height);
            }

            // Border
            ctx.strokeStyle = level > 0.5 ? type.color : 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 1;
            ctx.strokeRect(sx, y, sw, height);
        }
    }

    // Render 2 bars for walker-based coverage (food, religion only)
    renderWalkerCoverageBar(ctx, x, y, width, height, levels) {
        const coverageTypes = [
            { key: 'food', color: '#DAA520', label: 'F' },      // Gold
            { key: 'religion', color: '#9370DB', label: 'R' }   // Purple
        ];

        const segmentWidth = width / coverageTypes.length;
        const gap = 1;

        for (let i = 0; i < coverageTypes.length; i++) {
            const type = coverageTypes[i];
            const level = levels[type.key] || 0;
            const sx = x + i * segmentWidth + gap / 2;
            const sw = segmentWidth - gap;

            // Background (dark)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(sx, y, sw, height);

            // Fill based on level
            if (level > 0) {
                ctx.fillStyle = type.color;
                ctx.fillRect(sx, y, sw * level, height);
            }

            // Border
            ctx.strokeStyle = level > 0.5 ? type.color : 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 1;
            ctx.strokeRect(sx, y, sw, height);
        }
    }

    // Render employment bar for service buildings
    renderEmploymentBar(ctx, x, y, width, height, fill, isStaffed) {
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(x, y, width, height);

        // Fill (green if staffed, orange/red if understaffed)
        if (fill > 0) {
            ctx.fillStyle = isStaffed ? '#27ae60' : '#e67e22';
            ctx.fillRect(x, y, width * Math.min(1, fill), height);
        }

        // Border
        ctx.strokeStyle = isStaffed ? '#27ae60' : '#c0392b';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    // Render evolution bar (center-anchored: left = downgrade, right = upgrade)
    renderEvolutionBar(ctx, x, y, width, height, progress) {
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(x, y, width, height);

        // Center marker (where progress starts)
        const centerX = x + width / 2;

        // Fill from center based on progress (0.5 = center)
        if (progress < 0.5) {
            // Downgrade risk - fill left from center (red)
            const amount = (0.5 - progress) * 2;  // 0-1 scale
            ctx.fillStyle = '#c0392b';  // Red
            ctx.fillRect(centerX - (width / 2) * amount, y, (width / 2) * amount, height);
        } else if (progress > 0.5) {
            // Upgrade progress - fill right from center (green)
            const amount = (progress - 0.5) * 2;  // 0-1 scale
            ctx.fillStyle = '#27ae60';  // Green
            ctx.fillRect(centerX, y, (width / 2) * amount, height);
        }

        // Center line marker
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX, y);
        ctx.lineTo(centerX, y + height);
        ctx.stroke();

        // Border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
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

            // Use entity's color
            ctx.fillStyle = entity.color || '#e74c3c';
            ctx.fillRect(x, y, size, size);

            // Direction indicator (darker version of entity color)
            ctx.fillStyle = this.darkenColor(entity.color || '#e74c3c', 0.3);
            const cx = x + size / 2;
            const cy = y + size / 2;
            const dx = entity.dx * 4;
            const dy = entity.dy * 4;
            ctx.beginPath();
            ctx.arc(cx + dx, cy + dy, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    renderUI(input, economy) {
        const ctx = this.ctx;

        // Mode indicator (top-left)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 240, 75);

        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';
        ctx.fillText(`Mode: ${input.getModeDisplay()}`, 20, 30);
        ctx.fillText('[1] Road [2] House [3] Well', 20, 50);
        ctx.fillText('[4] Market [5] Temple', 20, 65);
        ctx.fillText('LClick: Place  RClick: Remove', 20, 80);

        // Economy HUD (top-right)
        if (economy) {
            const hudWidth = 150;
            const hudX = ctx.canvas.width - hudWidth - 10;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(hudX, 10, hudWidth, 70);

            ctx.font = 'bold 14px monospace';

            ctx.fillStyle = '#f1c40f'; // Gold for money
            ctx.fillText(`💰 ${economy.money}`, hudX + 10, 30);

            ctx.fillStyle = '#3498db'; // Blue for population
            ctx.fillText(`👥 ${economy.population}`, hudX + 10, 50);

            ctx.fillStyle = '#27ae60'; // Green for employed
            ctx.fillText(`🔧 ${economy.employed}/${economy.population}`, hudX + 10, 70);
        }
    }
}
