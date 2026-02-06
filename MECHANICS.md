# Caesar Style - Game Mechanics Documentation

This document provides a comprehensive overview of all game mechanics in Caesar Style.

---

## Table of Contents

1. [Controls](#controls)
2. [Economy](#economy)
3. [Buildings](#buildings)
4. [Coverage Systems](#coverage-systems)
5. [House Evolution](#house-evolution)
6. [Walkers](#walkers)
7. [Debug Controls](#debug-controls)

---

## Controls

| Key | Action |
|-----|--------|
| `1` | Select Road placement mode |
| `2` | Select House |
| `3` | Select Well |
| `4` | Select Market |
| `5` | Select Temple |
| `6` | Select Fountain |
| `7` | Select Small Garden |
| `8` | Select Large Garden |
| `O` | Toggle overlay visibility |
| `P` | Toggle sprite rendering |
| **Left Click** | Place selected item |
| **Right Click** | Remove item |

---

## Economy

- **Denarii (Dn)**: The primary currency used to construct buildings and roads.
- Buildings cost Denarii to place. If you don't have enough funds, placement will fail.
- Population generates income over time.

---

## Buildings

All buildings require road access **except** for Gardens.

### Residential

| Building | Size | Cost | Population | Description |
|----------|------|------|------------|-------------|
| House | 2x2 | 30 Dn | 5–40 | Evolves through 4 levels based on service coverage. |

### Water Supply

| Building | Size | Cost | Coverage Type | Range |
|----------|------|------|---------------|-------|
| Well | 1x1 | 50 Dn | Water | 3 tiles (60/40/20) |
| Fountain | 1x1 | 200 Dn | Water | 5 tiles (90/70/50/30/10) |

- **Static Coverage**: Provides water automatically to nearby houses without walkers.
- Coverage value decreases with distance (Manhattan distance).

### Food Supply

| Building | Size | Cost | Workers | Walkers |
|----------|------|------|---------|---------|
| Market | 2x2 | 40 Dn | 5 | 1 |

- **Walker-based Coverage**: Spawns a walker that provides food coverage to houses it passes.
- Requires workers to function.

### Religion

| Building | Size | Cost | Workers | Walkers |
|----------|------|------|---------|---------|
| Temple | 3x3 | 200 Dn | 8 | 2 |

- **Walker-based Coverage**: Spawns priests that provide religion coverage to houses they pass.
- Requires workers to function.

### Desirability (Gardens)

| Building | Size | Cost | Road Required | Range |
|----------|------|------|---------------|-------|
| Small Garden | 1x1 | 10 Dn | No | 3 tiles (30/20/10) |
| Large Garden | 2x2 | 30 Dn | No | 5 tiles (50/40/30/20/10) |

- **Static Coverage**: Provides desirability automatically to nearby houses.
- Gardens can be placed anywhere on the map (no road access needed).

### Infrastructure

| Item | Size | Cost |
|------|------|------|
| Road | 1x1 | 5 Dn |

- Roads are required for building placement (except Gardens).
- Roads connect buildings and allow walkers to travel.

---

## Coverage Systems

Houses have multiple coverage needs that must be met for them to evolve:

| Coverage Type | Source | Delivery Method |
|---------------|--------|-----------------|
| Water | Well, Fountain | Static (distance-based) |
| Food | Market | Walker |
| Religion | Temple | Walker |
| Desirability | Small/Large Garden | Static (distance-based) |

### Static Coverage

- Applied automatically each frame based on proximity to the source building.
- Value is cumulative if multiple sources overlap (capped at 100).
- Measured in Manhattan distance from the building.

### Walker Coverage

- Delivered when a walker passes near a house.
- Sets coverage to maximum (100) instantly.
- Decays over time if no walker visits.

---

## House Evolution

Houses evolve through 4 levels based on coverage satisfaction:

| Level | Name | Population | Requirements |
|-------|------|------------|--------------|
| 1 | Tent | 5 | Water ≥ 10% |
| 2 | Shack | 10 | Water ≥ 40% |
| 3 | House | 20 | Water ≥ 60%, Food ≥ 20% |
| 4 | Villa | 40 | Water ≥ 80%, Food ≥ 60%, Desirability ≥ 40% |

### Evolution Mechanics

1. **Evolution Progress Bar**: Shows progress toward upgrade or downgrade.
2. **Meeting Requirements**: If requirements are met, the progress bar slowly fills.
3. **Exceeding Requirements**: If coverage exceeds the upgrade threshold, progress accelerates.
4. **Not Meeting Requirements**: If requirements are not met, progress bar decreases.
5. **Level Change**: When the bar reaches 100%, the house upgrades. At 0%, it downgrades.

---

## Walkers

Walkers are spawned by service buildings to deliver coverage to houses.

### Walker Behavior

1. **Spawning**: Buildings spawn walkers if they are staffed and the spawn timer has elapsed.
2. **Pathing**: Walkers follow roads randomly.
3. **Coverage**: Houses near a walker receive full coverage of that walker's type.
4. **Return**: Walkers eventually return to their origin building.

### Walker Requirements

| Building | Workers Needed | Max Walkers |
|----------|----------------|-------------|
| Market | 5 | 1 |
| Temple | 8 | 2 |

---

## Debug Controls

| Key | Function |
|-----|----------|
| `O` | Toggle overlays (coverage bars, evolution bars, level indicators) |
| `P` | Toggle sprite rendering (switch between sprites and colored placeholders) |

### HUD Indicators

- **Water Bar (Blue)**: Vertical bar in house top-right corner.
- **Food Bar (Gold, F)**: Horizontal bar above house.
- **Religion Bar (Purple, R)**: Horizontal bar above house.
- **Desirability Bar (Green, D)**: Horizontal bar above house.
- **Evolution Bar**: Below house, shows upgrade/downgrade progress.
- **Level Number**: Top-left corner of house.
- **Employment Bar**: Above service buildings, shows staffing level.

---

## Tips for Success

1. **Water First**: Ensure all houses have water access before building other services.
2. **Road Networks**: Plan efficient road networks for walker coverage.
3. **Gardens for Villas**: Place gardens near Level 3 houses to enable Villa evolution.
4. **Worker Supply**: Ensure enough population to staff service buildings.
5. **Coverage Overlap**: Place multiple water sources to maximize coverage in dense areas.

---

*Last updated: February 2026*
