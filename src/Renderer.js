import { ColorSprite } from './sprites/Sprite.js';

export class Renderer {
    constructor(ctx, tileSize, assetManager) {
        this.ctx = ctx;
        this.tileSize = tileSize;
        this.assetManager = assetManager;

        // Define sprites (colored rectangles for now, roads use AssetManager)
        this.sprites = {
            grass: new ColorSprite('#2d5a27'),
        };
    }

    renderGrid(grid, debug = { useSprites: true }) {
        const ctx = this.ctx;
        const ts = this.tileSize;

        const grassImg = this.assetManager.getImage('grass_tiles');
        let tileW = 0;
        let tileH = 0;

        if (grassImg) {
            tileW = grassImg.width / 3;
            tileH = grassImg.height / 3;
        }

        // Draw grass background for each tile
        for (let y = 0; y < grid.height; y++) {
            for (let x = 0; x < grid.width; x++) {
                if (grassImg && debug.useSprites) {
                    // pseudo-random deterministic variant based on position
                    const seed = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
                    const variant = Math.floor((seed - Math.floor(seed)) * 9);

                    const col = variant % 3;
                    const row = Math.floor(variant / 3);

                    ctx.drawImage(
                        grassImg,
                        col * tileW, row * tileH, tileW, tileH,
                        x * ts, y * ts, ts, ts
                    );
                } else {
                    // Fallback to solid color
                    this.sprites.grass.render(ctx, x * ts, y * ts, ts, ts);
                }

                // Draw subtle grid lines
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
                ctx.strokeRect(x * ts, y * ts, ts, ts);
            }
        }
    }

    renderRoads(grid, roadNetwork, debug = { useSprites: true }) {
        const ctx = this.ctx;
        const ts = this.tileSize;
        const roadImg = this.assetManager.getImage('road_tiles');

        // If no image, we can't draw sprites anyway
        const canDrawSprites = roadImg && debug.useSprites;

        let tileW = 0;
        let tileH = 0;

        if (roadImg) {
            tileW = roadImg.width / 3;
            tileH = roadImg.height / 2;
        }

        // Optimized 3x2 Tileset Mapping
        // Row 0: Isolated[0,0], End(S)[1,0], Straight(NS)[2,0]
        // Row 1: Corner(NE)[0,1], T-Junc(NWS)[1,1], Cross(All)[2,1]

        // Rotation is Clockwise from Base Tile Orientation
        // ... (comments elided for brevity) ...

        const PI = Math.PI;
        const HALF_PI = Math.PI / 2;

        const tileMap = {
            0: { c: 0, r: 0, rot: 0 },         // Isolated
            1: { c: 1, r: 0, rot: PI },        // N (Base S, rot 180)
            2: { c: 1, r: 0, rot: -HALF_PI },  // E (Base S, rot -90)
            3: { c: 0, r: 1, rot: 0 },         // NE (Base NE)
            4: { c: 1, r: 0, rot: 0 },         // S (Base S)
            5: { c: 2, r: 0, rot: 0 },         // NS (Base NS)
            6: { c: 0, r: 1, rot: HALF_PI },   // SE (Base NE, rot 90)
            7: { c: 1, r: 1, rot: PI },        // NES (Base NWS, rot 180 - Wait. Base is NWS (Left-Up-Down). NES is Right-Up-Down. To get Right from Left, flip? Or Rotate? Leftrot180 = Right. Up rot180 = Down. Down rot180 = Up. So NWS rot 180 = S E N = NES. Correct.)
            8: { c: 1, r: 0, rot: HALF_PI },   // W (Base S, rot 90)
            9: { c: 0, r: 1, rot: -HALF_PI },  // NW (Base NE, rot -90)
            10: { c: 2, r: 0, rot: HALF_PI },   // EW (Base NS, rot 90)
            11: { c: 1, r: 1, rot: HALF_PI },   // NEW (Base NWS (Left-Up-Down) rot 90 -> Up-Right-Left? No. Left->Up, Up->Right, Down->Left. So Up-Right-Left = N E W. Correct.)
            12: { c: 0, r: 1, rot: PI },        // SW (Base NE, rot 180)
            13: { c: 1, r: 1, rot: 0 },         // NWS (Base NWS)
            14: { c: 1, r: 1, rot: -HALF_PI },  // EWS (Base NWS rot -90 -> Left->Down, Up->Left, Down->Right. So Down-Left-Right = S W E. Correct.)
            15: { c: 2, r: 1, rot: 0 }          // All (Base Cross)
        };

        for (let y = 0; y < grid.height; y++) {
            for (let x = 0; x < grid.width; x++) {
                if (roadNetwork.hasRoad(x, y)) {
                    if (canDrawSprites) {
                        // Calculate bitmask (N=1, E=2, S=4, W=8)
                        let mask = 0;
                        if (roadNetwork.hasRoad(x, y - 1)) mask |= 1; // North
                        if (roadNetwork.hasRoad(x + 1, y)) mask |= 2; // East
                        if (roadNetwork.hasRoad(x, y + 1)) mask |= 4; // South
                        if (roadNetwork.hasRoad(x - 1, y)) mask |= 8; // West

                        const mapping = tileMap[mask] || tileMap[0];
                        this.renderRotatedTile(ctx, roadImg, x, y, ts, tileW, tileH, mapping.c, mapping.r, mapping.rot);
                    } else {
                        // Fallback: Simple gray rectangle
                        ctx.fillStyle = '#7f8c8d';
                        ctx.fillRect(x * ts, y * ts, ts, ts);

                        // Optional: Darker border
                        ctx.strokeStyle = '#555';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(x * ts, y * ts, ts, ts);
                    }
                }
            }
        }
    }

    renderRotatedTile(ctx, img, gridX, gridY, ts, tileW, tileH, col, row, rotation) {
        const sx = col * tileW;
        const sy = row * tileH;

        ctx.save();
        // Move to center of tile
        ctx.translate(gridX * ts + ts / 2, gridY * ts + ts / 2);
        ctx.rotate(rotation);
        // Draw centered relative to translation
        ctx.drawImage(img, sx, sy, tileW, tileH, -ts / 2, -ts / 2, ts, ts);
        ctx.restore();
    }

    renderBuildings(buildings, debug = { useSprites: true, showOverlays: true }) {
        const ctx = this.ctx;
        const ts = this.tileSize;

        // House assets
        const houseL1 = this.assetManager.getImage('house_level_1');

        for (const building of buildings) {
            const bx = building.x * ts;
            const by = building.y * ts;
            const bw = building.width * ts;
            const bh = building.height * ts;

            // Draw selection highlight
            if (this.selectedBuilding === building) {
                ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
                ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
            }

            // Check if we can draw a sprite for this building
            let drawn = false;

            if (debug.useSprites) {
                if (building.type.id === 'house') {
                    if (building.level === 1 && houseL1) {
                        // Level 1 Tent - 4 Rotations
                        // 2x2 Grid (0=South, 1=East, 2=North, 3=West)
                        // Layout assumption in 2x2 grid (TL, TR, BL, BR):
                        // Row 0: South(0), North(2) ?? Wait, usually it is linear.
                        // Let's assume standard reading order based on my prompt list?
                        // 1. South (0), 2. North (2), 3. East (1), 4. West (3)
                        // Grid 2x2:
                        // (0,0): South (Rot 0)
                        // (1,0): North (Rot 2)
                        // (0,1): East  (Rot 1)
                        // (1,1): West  (Rot 3)

                        let col = 0;
                        let row = 0;

                        switch (building.rotation) {
                            case 0: col = 0; row = 0; break; // South
                            case 2: col = 1; row = 0; break; // North
                            case 1: col = 0; row = 1; break; // East
                            case 3: col = 1; row = 1; break; // West
                        }

                        const tileW = houseL1.width / 2;
                        const tileH = houseL1.height / 2;

                        ctx.drawImage(
                            houseL1,
                            col * tileW, row * tileH, tileW, tileH,
                            bx, by, bw, bh
                        );
                        drawn = true;
                    }
                } else if (building.type.id === 'well') {
                    const wellImg = this.assetManager.getImage('well');
                    if (wellImg) {
                        ctx.drawImage(wellImg, bx, by, bw, bh);
                        drawn = true;
                    }
                } else if (building.type.id === 'fountain') {
                    const fountainImg = this.assetManager.getImage('fountain');
                    if (fountainImg) {
                        ctx.drawImage(fountainImg, bx, by, bw, bh);
                        drawn = true;
                    }
                } else if (building.type.id === 'market') {
                    const marketImg = this.assetManager.getImage('market');
                    if (marketImg) {
                        // Market - 4 Rotations
                        // 2x2 Grid based on prompt provided to user:
                        // TL: South (0), TR: North (2)
                        // BL: West (3),  BR: East (1)

                        let col = 0;
                        let row = 0;

                        switch (building.rotation) {
                            case 0: col = 0; row = 0; break; // South
                            case 2: col = 1; row = 0; break; // North
                            case 3: col = 0; row = 1; break; // West
                            case 1: col = 1; row = 1; break; // East
                        }

                        const tileW = marketImg.width / 2;
                        const tileH = marketImg.height / 2;

                        ctx.drawImage(
                            marketImg,
                            col * tileW, row * tileH, tileW, tileH,
                            bx, by, bw, bh
                        );
                        drawn = true;
                    }
                }
            }


            if (!drawn) {
                // Determine color based on type/state
                let color = building.type.color;

                // For houses, use level-based color and apply coverage tint
                if (building.coverageNeeds) {
                    const baseColor = building.getLevelColor();
                    const coverage = building.getCoveragePercent();
                    color = this.applyFadeTint(baseColor, coverage);
                }

                // Building body
                ctx.fillStyle = color;
                ctx.fillRect(bx + 2, by + 2, bw - 4, bh - 4);

                // Building outline (darker)
                ctx.strokeStyle = this.darkenColor(color, 0.3);
                ctx.lineWidth = 2;
                ctx.strokeRect(bx + 2, by + 2, bw - 4, bh - 4);
            }

            // Door indicator (shows road access point) - only for placeholders (not sprites)
            if (building.doorX !== undefined && !drawn) {
                ctx.fillStyle = '#5a3e1b';
                const doorX = building.doorX * ts + ts / 4;
                const doorY = building.doorY * ts + ts / 4;
                ctx.fillRect(doorX, doorY, ts / 2, ts / 2);
            }

            // OVERLAYS (Bars, Icons, Etc) - Only if enabled
            if (debug.showOverlays) {
                // House-specific UI
                if (building.coverageNeeds) {
                    const levels = building.getCoverageLevels();

                    // Show walker-based coverage (food, religion) - water is shown via icon
                    const walkerLevels = { food: levels.food, religion: levels.religion };
                    this.renderWalkerCoverageBar(ctx, bx, by - 10, bw, 6, walkerLevels);

                    // Evolution bar (shows progress toward upgrade/downgrade)
                    this.renderEvolutionBar(ctx, bx, by + bh + 2, bw, 4, building.evolutionProgress);

                    // Show level number in top-left corner
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 12px sans-serif';
                    ctx.fillText(building.level, bx + 6, by + 14);

                    // Show water coverage bar (vertical) in top-right
                    const waterBarW = 6;
                    const waterBarH = 16;
                    const waterBarX = bx + bw - waterBarW - 4;
                    const waterBarY = by + 4;

                    // Bar Background
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                    ctx.fillRect(waterBarX, waterBarY, waterBarW, waterBarH);

                    // Bar Fill
                    if (levels.water > 0) {
                        ctx.fillStyle = '#4169E1'; // Blue
                        const fillH = Math.min(1, levels.water) * waterBarH;
                        ctx.fillRect(waterBarX, waterBarY + waterBarH - fillH, waterBarW, fillH);
                    }


                    // Bar Border
                    ctx.strokeStyle = '#87CEEB'; // SkyBlue border
                    ctx.lineWidth = 1;
                    ctx.strokeRect(waterBarX, waterBarY, waterBarW, waterBarH);
                }

                // Employment indicator for service buildings
                if (building.type.workersNeeded > 0) {
                    const fill = building.workers / building.type.workersNeeded;
                    this.renderEmploymentBar(ctx, bx, by - 8, bw, 4, fill, building.isStaffed());
                }
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

    renderUI(input, economy, debug) {
        const ctx = this.ctx;

        // Mode indicator (top-left)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 320, 95);

        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';
        ctx.fillText(`Mode: ${input.getModeDisplay()}`, 20, 30);
        ctx.fillText('[1] Road [2] House [3] Well', 20, 50);
        ctx.fillText('[4] Market [5] Temple [6] Fountain', 20, 65);
        ctx.fillText('LClick: Place  RClick: Remove', 20, 80);

        // Debug hints
        let debugText = '[O]verlays: ' + (debug && debug.showOverlays ? 'ON' : 'OFF');
        debugText += '  [P] Sprites: ' + (debug && debug.useSprites ? 'ON' : 'OFF');
        ctx.fillText(debugText, 20, 95);

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
