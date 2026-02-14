import { ColorSprite } from './sprites/Sprite.js';
import { TAX_COOLDOWN, GOODS_META } from './world/BuildingTypes.js';

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

                // Draw resources
                if (grid.resources && grid.resources[y][x] === 'fertility') {
                    ctx.fillStyle = 'rgba(218, 165, 32, 0.3)'; // Goldenrod semi-transparent
                    ctx.fillRect(x * ts, y * ts, ts, ts);
                } else if (grid.resources && grid.resources[y][x] === 'iron_ore') {
                    ctx.fillStyle = 'rgba(112, 128, 144, 0.35)'; // Slate gray semi-transparent
                    ctx.fillRect(x * ts, y * ts, ts, ts);
                }
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

    renderBuildings(buildings, debug = { useSprites: true, showOverlays: true }, hoveredBuilding = null) {
        const ctx = this.ctx;
        const ts = this.tileSize;

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
                // Map rotation to direction string
                const rotationToDirection = ['south', 'east', 'north', 'west'];
                const direction = rotationToDirection[building.rotation] || 'south';

                // Determine base sprite name based on building type
                let baseName = null;
                if (building.type.id === 'house') {
                    baseName = `house_level_${building.level}`;
                } else if (building.type.id === 'well') {
                    baseName = 'well';
                } else if (building.type.id === 'fountain') {
                    baseName = 'fountain';
                } else if (building.type.id === 'market') {
                    baseName = 'market';
                } else if (building.type.id === 'temple') {
                    baseName = 'temple';
                } else if (building.type.id === 'small_garden') {
                    baseName = 'garden_small';
                } else if (building.type.id === 'large_garden') {
                    baseName = 'garden_large';
                } else if (building.type.id === 'farm') {
                    baseName = 'farm';
                } else if (building.type.id === 'warehouse') {
                    baseName = 'warehouse';
                } else if (building.type.id === 'tax_office') {
                    baseName = 'tax_office';
                } else if (building.type.id === 'mine') {
                    baseName = 'mine';
                } else if (building.type.id === 'workshop') {
                    baseName = 'workshop';
                }

                if (baseName) {
                    const spriteData = this.assetManager.getBuildingSprite(baseName, direction);

                    if (spriteData) {
                        if (spriteData.isSheet) {
                            let col = 0;
                            let row = 0;

                            switch (building.rotation) {
                                case 0: col = 0; row = 0; break; // South (TL)
                                case 2: col = 1; row = 0; break; // North (TR)
                                case 1: col = 0; row = 1; break; // East (BL)
                                case 3: col = 1; row = 1; break; // West (BR)
                            }

                            const tileW = spriteData.image.width / 2;
                            const tileH = spriteData.image.height / 2;

                            ctx.drawImage(
                                spriteData.image,
                                col * tileW, row * tileH, tileW, tileH,
                                bx, by, bw, bh
                            );
                        } else {
                            ctx.drawImage(spriteData.image, bx, by, bw, bh);
                        }
                        drawn = true;
                    }
                }
            }

            if (!drawn) {
                let color = building.type.color;

                if (building.coverageNeeds) {
                    const baseColor = building.getLevelColor();
                    const coverage = building.getCoveragePercent();
                    color = this.applyFadeTint(baseColor, coverage);
                }

                ctx.fillStyle = color;
                ctx.fillRect(bx + 2, by + 2, bw - 4, bh - 4);

                ctx.strokeStyle = this.darkenColor(color, 0.3);
                ctx.lineWidth = 2;
                ctx.strokeRect(bx + 2, by + 2, bw - 4, bh - 4);
            }

            // Door indicator (not sprites only)
            if (building.doorX !== undefined && !drawn) {
                ctx.fillStyle = '#5a3e1b';
                const doorX = building.doorX * ts + ts / 4;
                const doorY = building.doorY * ts + ts / 4;
                ctx.fillRect(doorX, doorY, ts / 2, ts / 2);
            }

            // === OVERLAYS (within building bounds) ===
            if (debug.showOverlays) {
                if (building.coverageNeeds) {
                    // --- HOUSE OVERLAY ---
                    const levels = building.getCoverageLevels();

                    // Level number top-left
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 12px sans-serif';
                    ctx.fillText(building.level, bx + 6, by + 14);

                    // Coverage dots inside building (row of colored squares)
                    const dotTypes = [
                        { key: 'water', color: '#4169E1' },
                        { key: 'religion', color: '#9370DB' },
                        { key: 'desirability', color: '#2ecc71' },
                    ];
                    const dotSize = 6;
                    const dotGap = 2;
                    const totalDotsW = dotTypes.length * dotSize + (dotTypes.length - 1) * dotGap;
                    const dotsX = bx + (bw - totalDotsW) / 2;
                    const dotsY = by + 18;

                    for (let i = 0; i < dotTypes.length; i++) {
                        const dt = dotTypes[i];
                        const level = levels[dt.key] || 0;
                        const dx = dotsX + i * (dotSize + dotGap);

                        // Dim background
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                        ctx.fillRect(dx, dotsY, dotSize, dotSize);

                        // Colored fill (opacity maps to level)
                        if (level > 0) {
                            ctx.globalAlpha = 0.3 + 0.7 * Math.min(1, level);
                            ctx.fillStyle = dt.color;
                            ctx.fillRect(dx, dotsY, dotSize, dotSize);
                            ctx.globalAlpha = 1;
                        }
                    }

                    // Evolution bar at bottom inside edge
                    this.renderEvolutionBar(ctx, bx + 2, by + bh - 6, bw - 4, 4, building.evolutionProgress);

                    // Tax cooldown bar just above evolution bar
                    if (building.taxCooldown > 0) {
                        const taxBarH = 3;
                        const taxBarY = by + bh - 10;
                        const taxPct = building.taxCooldown / TAX_COOLDOWN;

                        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                        ctx.fillRect(bx + 2, taxBarY, bw - 4, taxBarH);
                        ctx.fillStyle = '#FFD700';
                        ctx.fillRect(bx + 2, taxBarY, (bw - 4) * taxPct, taxBarH);
                    }

                } else {
                    // --- SERVICE/PRODUCTION BUILDING OVERLAY ---

                    // Employment bar at top inside edge
                    if (building.type.workersNeeded > 0) {
                        const fill = building.workers / building.type.workersNeeded;
                        this.renderEmploymentBar(ctx, bx + 2, by + 2, bw - 4, 4, fill, building.isStaffed());
                    }

                    // Overall storage bar at bottom inside edge
                    if (building.storage && building.type.goods?.storage) {
                        const storageEntries = Object.entries(building.type.goods.storage);
                        let totalStored = 0;
                        let totalCapacity = 0;
                        for (const [goodType, capacity] of storageEntries) {
                            totalStored += building.storage[goodType] || 0;
                            totalCapacity += capacity;
                        }
                        if (totalCapacity > 0) {
                            this.renderStorageIndicator(ctx, bx + 2, by + bh - 8, bw - 4, 6, totalStored, totalCapacity, '#DAA520');
                        }
                    }
                }
            }
        }

        // === HOVER DETAIL (second pass, drawn on top of everything) ===
        if (debug.showOverlays && hoveredBuilding) {
            const bx = hoveredBuilding.x * ts;
            const by = hoveredBuilding.y * ts;
            const bw = hoveredBuilding.width * ts;
            const bh = hoveredBuilding.height * ts;
            this.renderHoverDetail(ctx, hoveredBuilding, bx, by, bw, bh);
        }
    }

    renderHoverDetail(ctx, building, bx, by, bw, bh) {
        if (!building.type.goods?.storage) return;

        const goodTypes = Object.keys(building.type.goods.storage);
        if (goodTypes.length === 0) return;

        const barW = 60;
        const barH = 10;
        const emojiW = 14;
        const rowH = barH + 3;
        const panelH = goodTypes.length * rowH + 6;
        const panelW = emojiW + barW + 8;

        // Position: prefer right side, fall back to left
        let px = bx + bw + 4;
        const canvasW = ctx.canvas.width;
        if (px + panelW > canvasW) {
            px = bx - panelW - 4;
        }
        let py = by;

        // Panel background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(px, py, panelW, panelH);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(px, py, panelW, panelH);

        // Draw each good row
        for (let i = 0; i < goodTypes.length; i++) {
            const goodType = goodTypes[i];
            const meta = GOODS_META[goodType] || { emoji: '📦', color: '#888' };
            const current = building.storage[goodType] || 0;
            const max = building.getMaxStorage(goodType);

            const rowY = py + 3 + i * rowH;

            // Emoji
            ctx.font = '10px sans-serif';
            ctx.fillStyle = '#fff';
            ctx.fillText(meta.emoji, px + 3, rowY + barH - 1);

            // Bar
            const barX = px + emojiW + 2;
            this.renderStorageIndicator(ctx, barX, rowY, barW, barH, current, max, meta.color);
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
            { key: 'religion', color: '#9370DB', label: 'R' },   // Purple
            { key: 'desirability', color: '#2ecc71', label: 'D' } // Emerald Green
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

    // Render storage indicator bar with number inside
    renderStorageIndicator(ctx, x, y, width, height, current, max, color = '#DAA520') {
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(x, y, width, height);

        // Fill based on storage level
        const fill = Math.min(1, max > 0 ? current / max : 0);
        if (fill > 0) {
            ctx.fillStyle = color;
            ctx.fillRect(x, y, width * fill, height);
        }

        // Border
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);

        // Text showing amount
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText(`${Math.floor(current)}`, x + 2, y + height - 2);
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

            // Cargo indicator for walkers carrying goods
            if (entity.cargo && entity.cargo.amount > 0) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(x - 2, y - 12, size + 4, 10);

                const goodColor = GOODS_META[entity.cargo.type]?.color || '#FFFFFF';

                ctx.fillStyle = goodColor;
                ctx.font = 'bold 8px sans-serif';
                ctx.fillText(`${Math.floor(entity.cargo.amount)}`, x, y - 4);
            }
        }
    }

    renderUI(input, economy, debug, buildingMenu) {
        const ctx = this.ctx;
        const menuData = buildingMenu ? buildingMenu.getDisplayData() : null;

        // --- Prepare lines to render ---
        const lines = [];
        const selectionText = buildingMenu ? buildingMenu.getSelectionText() : 'Loading...';
        lines.push({ text: `Selected: ${selectionText}`, color: '#fff', font: 'bold 14px monospace' });

        if (menuData) {
            if (menuData.mode === 'categories') {
                lines.push({ text: 'Categories:', color: '#f1c40f', font: '14px monospace' });
                for (const cat of menuData.items) {
                    lines.push({ text: ` [${cat.key}] ${cat.name}`, color: '#fff', font: '13px monospace' });
                }
            } else {
                lines.push({ text: `${menuData.categoryName}:`, color: '#f1c40f', font: '14px monospace' });
                for (const item of menuData.items) {
                    const marker = item.selected ? '>' : ' ';
                    lines.push({
                        text: `${marker}[${item.key}] ${item.name} (${item.cost} Dn)`,
                        color: item.selected ? '#f1c40f' : '#fff',
                        font: '13px monospace'
                    });
                }
                lines.push({ text: ' [ESC] Back', color: '#aaa', font: '12px monospace' });
            }
        }

        // Action hints
        lines.push({ text: '', height: 5 }); // Spacer
        lines.push({ text: 'LClick: Place | RClick: Remove', color: '#888', font: '12px monospace' });

        // Debug & System hints
        let debugText = '[O]verlays: ' + (debug && debug.showOverlays ? 'ON' : 'OFF');
        debugText += ' | [P] Sprites: ' + (debug && debug.useSprites ? 'ON' : 'OFF');
        lines.push({ text: debugText, color: '#888', font: '12px monospace' });
        lines.push({ text: '[F5] Save | [F9] Load | [N] New', color: '#888', font: '12px monospace' });

        // --- Calculate dimensions ---
        const padding = 15;
        const lineSpacing = 4;
        let maxWidth = 250; // Minimum width
        let totalHeight = padding * 2;

        ctx.save();
        for (const line of lines) {
            if (line.text === '') {
                totalHeight += line.height || 10;
                continue;
            }
            ctx.font = line.font;
            const metrics = ctx.measureText(line.text);
            maxWidth = Math.max(maxWidth, metrics.width + padding * 2);

            // Extract font size for height estimation (e.g., "14px monospace" -> 14)
            const fontSize = parseInt(line.font) || 14;
            totalHeight += fontSize + lineSpacing;
        }
        ctx.restore();

        // --- Render Background ---
        const menuX = 10;
        const menuY = 10;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(menuX, menuY, maxWidth, totalHeight);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(menuX, menuY, maxWidth, totalHeight);

        // --- Render Text ---
        let currentY = menuY + padding;
        for (const line of lines) {
            if (line.text === '') {
                currentY += line.height || 10;
                continue;
            }
            const fontSize = parseInt(line.font) || 14;
            ctx.font = line.font;
            ctx.fillStyle = line.color;
            ctx.fillText(line.text, menuX + padding, currentY + fontSize);
            currentY += fontSize + lineSpacing;
        }

        // --- Economy HUD (top-right) ---
        if (economy) {
            const hudWidth = 160;
            const hudX = ctx.canvas.width - hudWidth - 10;
            const hudY = 10;
            const hudH = 75;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.fillRect(hudX, hudY, hudWidth, hudH);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.strokeRect(hudX, hudY, hudWidth, hudH);

            ctx.font = 'bold 14px monospace';
            ctx.fillStyle = '#f1c40f'; // Gold for money
            ctx.fillText(`💰 ${economy.money}`, hudX + 12, hudY + 25);

            ctx.fillStyle = '#3498db'; // Blue for population
            ctx.fillText(`👥 ${economy.population}`, hudX + 12, hudY + 45);

            ctx.fillStyle = '#27ae60'; // Green for employed
            ctx.fillText(`🔧 ${economy.employed}/${economy.population}`, hudX + 12, hudY + 65);
        }
    }

    renderFlashMessage(message, timer) {
        const ctx = this.ctx;
        const alpha = Math.min(1, timer); // Fade out during last second

        ctx.save();
        ctx.globalAlpha = alpha;

        const textWidth = ctx.measureText(message).width;
        const boxW = Math.max(textWidth + 40, 200);
        const boxH = 40;
        const boxX = (ctx.canvas.width - boxW) / 2;
        const boxY = ctx.canvas.height - 80;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // Text
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(message, ctx.canvas.width / 2, boxY + 26);
        ctx.textAlign = 'start'; // Reset

        ctx.restore();
    }

    renderPlacementPreview(input, grid, buildingManager, economy) {
        if (input.mode === 'none') return;

        const { x, y } = input.screenToTile(input.lastMouseClientX, input.lastMouseClientY);
        const ts = this.tileSize;
        const ctx = this.ctx;

        let isValid = true;
        let width = 1;
        let height = 1;
        let type = null;

        if (input.mode === 'building') {
            type = input.selectedBuildingType;
            if (type) {
                width = type.width;
                height = type.height;

                // Check empty area
                if (!grid.isAreaEmpty(x, y, width, height)) isValid = false;

                // Check road access
                if (isValid && type.needsRoadAccess !== false) {
                    if (!buildingManager.findDoorPosition(x, y, width, height)) isValid = false;
                }

                // Check economy
                if (isValid && !economy.canAfford(type.cost)) isValid = false;
            }
        } else if (input.mode === 'road') {
            const ROAD_COST = 5; // Should ideally come from BuildingTypes.js
            if (grid.getTile(x, y) !== null) isValid = false;
            if (isValid && !economy.canAfford(ROAD_COST)) isValid = false;
        }

        // Draw footprint highlight
        ctx.save();
        ctx.fillStyle = isValid ? 'rgba(46, 204, 113, 0.4)' : 'rgba(231, 76, 60, 0.4)';
        ctx.fillRect(x * ts, y * ts, width * ts, height * ts);
        ctx.strokeStyle = isValid ? 'rgba(46, 204, 113, 0.8)' : 'rgba(231, 76, 60, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x * ts, y * ts, width * ts, height * ts);

        // If building mode, draw building "ghost"
        if (input.mode === 'building' && type) {
            ctx.globalAlpha = 0.5;
            // Draw a simplified ghost using type color
            ctx.fillStyle = type.color;
            ctx.fillRect(x * ts + 2, y * ts + 2, width * ts - 4, height * ts - 4);
        }
        ctx.restore();
    }
}
