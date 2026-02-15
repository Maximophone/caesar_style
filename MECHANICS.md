# Caesar Style - Game Mechanics Documentation

A city-building strategy game inspired by classic Caesar III, built with vanilla JavaScript and HTML5 Canvas. Manage an economy, build production chains, evolve housing, and grow your city from tents to palaces.

---

## Table of Contents

1. [Controls](#controls)
2. [Map & Terrain](#map--terrain)
3. [Economy](#economy)
4. [Buildings](#buildings)
5. [Production Chains](#production-chains)
6. [Coverage Systems](#coverage-systems)
7. [House Evolution](#house-evolution)
8. [Desirability](#desirability)
9. [Walkers](#walkers)
10. [Building Upgrades](#building-upgrades)
11. [Save & Load](#save--load)
12. [Debug Controls & Cheats](#debug-controls--cheats)
13. [HUD & Overlays](#hud--overlays)
14. [Tips for Success](#tips-for-success)

---

## Controls

### Keyboard

| Key | Action |
|-----|--------|
| `1` | **Roads** category (1: Road, 2: Bridge) |
| `2` | **Residential** category (1: House) |
| `3` | **Water** category (1: Well, 2: Fountain) |
| `4` | **Food** category (1: Farm, 2: Fishing Wharf, 3: Granary, 4: Market) |
| `5` | **Religion** category (1: Temple) |
| `6` | **Beauty** category (1: Small Garden, 2: Large Garden) |
| `7` | **Administration** category (1: Tax Office) |
| `8` | **Industry** category (1: Mine, 2: Forge, 3: Clay Pit, 4: Potter, 5: Lumber Camp, 6: Carpenter, 7: Warehouse, 8: Bazaar) |
| `ESC` | Cancel selection / Back to category list |
| `Arrow Keys` | Pan camera (300 px/s, normalized diagonal) |
| `U` (hold) | Enter upgrade mode (click a building to upgrade it) |
| `F5` | Save game |
| `F9` | Load game |
| `N` | New game (press twice within 2 seconds to confirm) |

### Mouse

| Action | Effect |
|--------|--------|
| **Left Click** | Place selected building/road/bridge |
| **Left Drag** | Continuous road/bridge placement (road/bridge mode only) |
| **Right Click** | Remove building/road/bridge |
| **Right Drag** | Continuous removal |
| **Middle Drag** | Pan camera |
| **Hover** | Shows detailed storage panel on buildings with goods |

---

## Map & Terrain

- **Grid size**: 100 x 100 tiles at 24 px per tile (2400 x 2400 px world).
- **Viewport**: 800 px map area + 200 px sidebar = 1000 x 600 px canvas.

### Terrain Types

| Terrain | Description | Effect |
|---------|-------------|--------|
| **Water** | Lakes (cluster spawns) and rivers (flowing with drift) | Impassable; prevents building. Bridges can be placed on water. |

### Resource Deposits

Resources are generated procedurally in clusters. Buildings that require a specific resource must be placed on top of it.

| Resource | Color Overlay | Required By | Cluster Density |
|----------|--------------|-------------|-----------------|
| **Fertile Land** | Golden/translucent | Farm | 1/150 tiles, radius 2-4 |
| **Iron Ore** | Slate gray | Mine | 1/250 tiles, radius 1-2 |
| **Clay Deposits** | Brown | Clay Pit | 1/200 tiles, radius 1-3 |
| **Forest** | Dark green | Lumber Camp | 1/180 tiles, radius 2-4 |

- Fertility clusters may overlap other resources; all others are exclusive.
- Resource deposits are **not consumed** — they provide a permanent production bonus.

---

## Economy

### Currency

- **Denarii (Dn)** is the sole currency.
- **Starting money**: 500 Dn.

### Income: Tax Collection

Taxes are **not** collected automatically. A **Tax Office** must spawn **Tax Collector** walkers, who collect taxes from houses they pass.

- **Formula**: `Population x Tax Multiplier` per collection.
- **Cooldown**: Each house has a **10-second cooldown** after paying tax before it can pay again.

| House Level | Tax Multiplier |
|-------------|----------------|
| Tent (L1) | x1 |
| Shack (L2) | x1 |
| Stone House (L3) | x2 |
| Villa (L4) | x3 |
| Palace (L5) | x5 |

### Population & Labor

- **Population** = sum of all house inhabitants (determined by house level and water access).
- A house with **no water** (below 10% water coverage) has **0 population**.
- **Workers** are assigned automatically each frame from the population pool.
- **Priority**: buildings are sorted by cost (cheaper buildings get workers first).
- Each building has a base worker requirement. Upgraded buildings may need additional workers.
- **Labor pool** = Population - Employed.

---

## Buildings

All buildings require **road access** unless otherwise noted. A building must be placed with at least one edge tile adjacent to a road.

Buildings auto-orient based on which side the road is on (South, East, North, West).

### Infrastructure

| Item | Size | Cost | Notes |
|------|------|------|-------|
| Road | 1x1 | 5 Dn | Required for building placement and walker travel |
| Bridge | 1x1 | 30 Dn | Placed on water tiles; joins the road network |

### Residential

| Building | Size | Cost | Description |
|----------|------|------|-------------|
| House | 2x2 | 30 Dn | Evolves through 5 levels (Tent → Shack → Stone House → Villa → Palace). See [House Evolution](#house-evolution). |

- Houses store goods: food (5/pop), fish (5/pop), utensils (2/pop), pottery (2/pop), furniture (2/pop).
- Storage capacity scales dynamically with population.

### Water Supply

| Building | Size | Cost | Type | Coverage Range |
|----------|------|------|------|----------------|
| Well | 1x1 | 20 Dn | Static | 6 tiles: 60/50/40/30/20/20 |
| Fountain | 1x1 | 60 Dn | Static | 10 tiles: 90/70/60/50/40/30/20/20/20/20 |

- **Static coverage**: Recalculated every frame based on Manhattan distance from building center to closest house tile.
- Coverage from multiple sources is **cumulative** (capped at 100).
- Well has **negative desirability** (-5/-3/-1 at 1/2/3 tiles).
- Fountain has **positive desirability** (+15/+12/+10/+7/+4/+2 at 1-6 tiles).

### Food Production & Distribution

| Building | Size | Cost | Workers | Storage | Role |
|----------|------|------|---------|---------|------|
| Farm | 5x5 | 120 Dn | 3 | 200 food | Produces food (10/s base rate) |
| Fishing Wharf | 4x4 | 80 Dn | 2 | 150 fish | Produces fish (8/s base rate) |
| Granary | 4x4 | 100 Dn | 2 | 800 food, 400 fish | Intermediate storage hub |
| Market | 3x3 | 60 Dn | 2 | 400 food, 400 fish | Distributes food & fish to houses |

#### Farm

- **Requires**: Fertile Land resource underneath.
- **Efficiency** = % of farm tiles covering fertile land (0-100%).
- Actual production = base rate x efficiency.
- Spawns a **Cart Walker** when storage reaches 100 units (cart capacity).
- Cart delivers to the **most empty** Granary or Market.

#### Fishing Wharf

- **Requires**: Water terrain (all tiles must be on water).
- Produces fish at 8 units/sec when staffed.
- Spawns a Cart Walker when storage reaches 100 units.

#### Granary

- Receives food and fish from producer Cart Walkers.
- Spawns its own Cart Walkers to redistribute to Markets when Markets need supplies.
- **Delivery priority**: 1 (low) — receives deliveries when higher-priority buildings (Markets at priority 10) are above 50% full.

#### Market

- Receives food and fish.
- Spawns **two Distributor Walkers**: one for food, one for fish.
- Each distributor carries up to 100 units and delivers goods to houses it passes.
- Delivery per house = 1 unit per inhabitant per walker pass.
- Leftover goods return to the Market when the walker comes home.
- **Delivery priority**: 10 (high) — Markets get deliveries first until above 50% full.

### Religion

| Building | Size | Cost | Workers | Walker |
|----------|------|------|---------|--------|
| Temple | 4x4 | 200 Dn | 4 | 1 priest (religion coverage) |

- Spawns a priest walker every 5 seconds (when staffed).
- Provides **positive desirability** (+20 to +1, up to 8 tiles).

### Beauty (Gardens)

| Building | Size | Cost | Road Required | Desirability Range |
|----------|------|------|---------------|-------------------|
| Small Garden | 1x1 | 10 Dn | **No** | +30/+22/+15/+8/+3 (1-5 tiles) |
| Large Garden | 2x2 | 30 Dn | **No** | +50/+42/+34/+26/+18/+10/+4 (1-7 tiles) |

- Gardens are the **only buildings** that don't require road access.
- They provide **static desirability** coverage.

### Administration

| Building | Size | Cost | Workers | Walker |
|----------|------|------|---------|--------|
| Tax Office | 3x3 | 100 Dn | 2 | 1 tax collector |

- Tax Collector walker spawns every 5 seconds.
- Collects taxes from houses along its path (see [Economy > Tax Collection](#income-tax-collection)).

### Industry

#### Raw Material Producers

| Building | Size | Cost | Workers | Requires | Produces | Storage |
|----------|------|------|---------|----------|----------|---------|
| Mine | 3x3 | 150 Dn | 5 | Iron Ore | Iron (6/s) | 200 iron |
| Clay Pit | 5x5 | 100 Dn | 3 | Clay Deposits | Clay (8/s) | 150 clay |
| Lumber Camp | 5x5 | 100 Dn | 3 | Forest | Timber (8/s) | 150 timber |

- Production rate scales with resource coverage (like farms).
- Each spawns a Cart Walker every 8 seconds when storage reaches 100 units.

#### Manufacturers (Refiners)

| Building | Size | Cost | Workers | Input | Output | Rate | Storage |
|----------|------|------|---------|-------|--------|------|---------|
| Forge | 4x4 | 120 Dn | 3 | Iron | Utensils | 10/s | 100 iron + 100 utensils |
| Potter | 3x2 | 100 Dn | 3 | Clay | Pottery | 8/s | 100 clay + 100 pottery |
| Carpenter | 3x3 | 120 Dn | 3 | Timber | Furniture | 6/s | 100 timber + 100 furniture |

- **Conversion ratio**: 1:1 (1 unit input consumed per 1 unit output produced).
- Production is **limited by available input** — if input storage is empty, production halts.
- **Delivery priority**: 10 (high) — receives raw materials first until above 50% full.

#### Storage & Distribution

| Building | Size | Cost | Workers | Accepts | Storage |
|----------|------|------|---------|---------|---------|
| Warehouse | 4x3 | 100 Dn | 4 | Iron, Utensils, Clay, Pottery, Timber, Furniture | 400 each |
| Bazaar | 4x3 | 80 Dn | 3 | Utensils, Pottery, Furniture | 200 each |

- **Warehouse**: Intermediate bulk storage. Spawns Cart Walkers to redistribute goods to manufacturers or Bazaars. Delivery priority 1 (low buffer).
- **Bazaar**: Endpoint distributor for crafted goods. Spawns **three Distributor Walkers** (one each for utensils, pottery, furniture). Each walker delivers goods to houses. Delivery priority 10 (high).

---

## Production Chains

### Food Pipeline

```
Farm (fertile land) ──Cart──→ Granary ──Cart──→ Market ──Distributor──→ Houses
                                                  ↑
Fishing Wharf (water) ──Cart──→ Granary ──Cart──→ Market ──Distributor──→ Houses
```

Farms and Fishing Wharfs can also deliver directly to Markets (Markets have higher delivery priority). Granaries serve as overflow buffers.

### Iron → Utensils Pipeline

```
Mine (iron ore) ──Cart──→ Forge ──Cart──→ Warehouse ──Cart──→ Bazaar ──Distributor──→ Houses
```

### Clay → Pottery Pipeline

```
Clay Pit (clay) ──Cart──→ Potter ──Cart──→ Warehouse ──Cart──→ Bazaar ──Distributor──→ Houses
```

### Timber → Furniture Pipeline

```
Lumber Camp (forest) ──Cart──→ Carpenter ──Cart──→ Warehouse ──Cart──→ Bazaar ──Distributor──→ Houses
```

### Delivery Priority System

Buildings have a `deliveryPriority` value that determines which buildings receive goods first:

- **Priority 10** (high): Markets, Forges, Potters, Carpenters, Bazaars — these are production/distribution endpoints.
- **Priority 1** (low): Granaries, Warehouses — these are storage buffers.
- Once a high-priority building exceeds its **fill threshold** (50%), its effective priority drops to 0, allowing lower-priority storage buildings to receive deliveries.
- Among same-priority buildings, the **emptiest** one is chosen.
- Cart walkers avoid delivering between "peer" buildings (e.g., warehouse to warehouse) to prevent loops.

---

## Coverage Systems

Houses have multiple coverage needs that must be met for them to evolve. Coverage is measured as a percentage (0-100).

### Coverage Types

| Coverage | Source | Delivery Method | Decay |
|----------|--------|-----------------|-------|
| Water | Well, Fountain | Static (recalculated each frame) | No decay (recalculated) |
| Food | Market distributor | Goods-based (storage fullness) | No decay (consumed over time) |
| Fish | Market distributor | Goods-based (storage fullness) | No decay (consumed over time) |
| Religion | Temple | Walker (sets to 100 on pass) | 5/sec decay |
| Utensils | Bazaar distributor | Goods-based (storage fullness) | No decay (consumed over time) |
| Pottery | Bazaar distributor | Goods-based (storage fullness) | No decay (consumed over time) |
| Furniture | Bazaar distributor | Goods-based (storage fullness) | No decay (consumed over time) |
| Desirability | Gardens, buildings | Static (recalculated each frame) | No decay (recalculated) |

### Static Coverage (Water, Desirability)

- Reset to 0 each frame, then recalculated from all source buildings.
- Based on **Manhattan distance** from source building center to the closest tile of the receiving house.
- Coverage amounts are defined per-distance in the building type config.
- Multiple sources **stack** (cumulative), capped at 100.

### Walker-Based Coverage (Religion)

- When a walker passes within **1 tile** of a house, the house receives **100% coverage** instantly.
- Religion coverage **decays** at 5 units/second if no walker visits.

### Goods-Based Coverage (Food, Fish, Utensils, Pottery, Furniture)

- Coverage % = (current storage / max storage) x 100.
- Max storage per good scales with house population (e.g., 5 food capacity per inhabitant).
- Houses **consume goods over time** based on level (see table below).
- If a house runs out of goods, coverage drops to 0.

#### House Consumption Rates (units/inhabitant/second)

| Good | L1 Tent | L2 Shack | L3 Stone House | L4 Villa | L5 Palace |
|------|---------|----------|----------------|----------|-----------|
| Food | — | 0.05 | 0.08 | 0.10 | 0.12 |
| Fish | — | — | 0.05 | 0.10 | 0.15 |
| Pottery | — | — | 0.01 | 0.03 | 0.08 |
| Utensils | — | — | — | 0.02 | 0.05 |
| Furniture | — | — | — | — | 0.08 |

---

## House Evolution

Houses evolve through **5 levels** based on coverage satisfaction.

### House Levels

| Level | Name | Population | Requirements |
|-------|------|------------|--------------|
| 1 | Tent | 1 | Water ≥ 10% |
| 2 | Shack | 2 | Water ≥ 40%, Food ≥ 10% |
| 3 | Stone House | 4 | Water ≥ 60%, Food ≥ 20%, Religion ≥ 10%, Pottery ≥ 10%, Fish ≥ 10% |
| 4 | Villa | 6 | Water ≥ 80%, Food ≥ 40%, Religion ≥ 30%, Utensils ≥ 10%, Pottery ≥ 20%, Fish ≥ 40%, Desirability ≥ 40% |
| 5 | Palace | 10 | Water ≥ 90%, Food ≥ 60%, Religion ≥ 60%, Utensils ≥ 50%, Pottery ≥ 40%, Furniture ≥ 40%, Fish ≥ 60%, Desirability ≥ 60% |

### Evolution Bar Mechanics

Each house has an **evolution progress bar** (0.0 to 1.0, starting at 0.5):

1. **Not meeting current level requirements**: Bar **decreases** at a base rate of 0.05/sec.
2. **Meeting requirements but not exceeding**: Bar stays **stable** (no movement).
3. **Exceeding requirements**: Bar **increases**. The speed scales with how much coverage exceeds the maintenance threshold relative to the upgrade threshold.
4. **Bar reaches 1.0**: House attempts to **upgrade**. It checks if next-level requirements are met — if yes, it upgrades and resets to 0.5. If not, bar caps at 1.0.
5. **Bar reaches 0.0**: House **downgrades** one level and resets to 0.5.
6. **At max level (Palace)**: The bar can still fill when exceeding requirements (visual feedback), but no upgrade occurs.

### Upgrade Threshold

Each level defines an `upgradeThreshold` (how far above base requirements you need to be for the bar to fill at full speed):

| Level | Upgrade Threshold |
|-------|-------------------|
| L1 Tent | 0.4 (40%) |
| L2 Shack | 0.8 (80%) |
| L3 Stone House | 0.8 (80%) |
| L4 Villa | 0.8 (80%) |
| L5 Palace | 0.9 (90%) |

The **surplus** calculation determines bar fill speed: for each required coverage, surplus = (current - requirement) / (upgradeThreshold - requirement). The minimum surplus across all requirements is used (bottleneck-limited).

---

## Desirability

Desirability is a coverage type that affects house evolution. It's provided (or reduced) by nearby buildings.

### How Desirability Works

- Recalculated every frame from all buildings.
- Based on **Manhattan distance** from building center to closest house tile.
- Can be **positive** (gardens, temples, villas) or **negative** (farms, mines, markets).
- Values from multiple sources **stack** (capped at 0-100 for houses).

### Desirability by Building Type

**Positive Desirability:**

| Building | Distance Values |
|----------|----------------|
| Small Garden | +30/+22/+15/+8/+3 (1-5 tiles) |
| Large Garden | +50/+42/+34/+26/+18/+10/+4 (1-7 tiles) |
| Fountain | +15/+12/+10/+7/+4/+2 (1-6 tiles) |
| Temple | +20/+18/+15/+12/+8/+5/+3/+1 (1-8 tiles) |
| Villa (L4) | +15/+12/+10/+7/+4/+2 (1-6 tiles) |
| Palace (L5) | +25/+22/+18/+14/+10/+7/+4/+2 (1-8 tiles) |

**Negative Desirability:**

| Building | Distance Values |
|----------|----------------|
| Tent (L1) | -10/-8/-5/-2 (1-4 tiles) |
| Shack (L2) | -5/-3/-1 (1-3 tiles) |
| Well | -5/-3/-1 (1-3 tiles) |
| Farm | -10/-8/-6/-4/-2/-1 (1-6 tiles) |
| Mine | -30/-25/-20/-15/-10/-6/-3/-1 (1-8 tiles) |
| Granary | -10/-7/-4/-2/-1 (1-5 tiles) |
| Warehouse | -10/-7/-4/-2/-1 (1-5 tiles) |
| Forge | -20/-16/-12/-8/-5/-3/-1 (1-7 tiles) |
| Clay Pit | -10/-8/-6/-4/-2/-1 (1-6 tiles) |
| Potter | -10/-7/-4/-2/-1 (1-5 tiles) |
| Lumber Camp | -10/-8/-6/-4/-2/-1 (1-6 tiles) |
| Market | -5/-3/-2/-1 (1-4 tiles) |
| Bazaar | -5/-3/-2/-1 (1-4 tiles) |
| Tax Office | -5/-3/-2/-1 (1-4 tiles) |
| Fishing Wharf | -5/-3/-2/-1 (1-4 tiles) |
| Carpenter | -5/-3/-2/-1 (1-4 tiles) |

---

## Walkers

There are two walker types: **Service Walkers** and **Cart Walkers**.

### Service Walkers

Service walkers roam the road network randomly, providing coverage or distributing goods to houses they pass.

| Source | Coverage Type | Spawn Interval | Behavior |
|--------|--------------|----------------|----------|
| Temple | Religion | 5s | Random roam, sets religion to 100% |
| Tax Office | Tax | 5s | Random roam, collects taxes |
| Market | Food | 5s | Random roam, delivers food to houses |
| Market | Fish | 5s | Random roam, delivers fish to houses |
| Bazaar | Utensils | 5s | Random roam, delivers utensils to houses |
| Bazaar | Pottery | 5s | Random roam, delivers pottery to houses |
| Bazaar | Furniture | 5s | Random roam, delivers furniture to houses |

**Service Walker Behavior:**
1. Spawn at the building's road access point.
2. Walk randomly along roads (avoid backtracking to previous tile).
3. At each tile, emit coverage or deliver goods to all houses within **1 tile radius**.
4. After **40 steps** (default max), begin returning home via **A* pathfinding**.
5. On return, leftover cargo is returned to the origin building.
6. If the walker reaches a dead end or loses road access, it despawns.

**Goods Distribution:**
- Market/Bazaar distributors carry up to **100 units** of their assigned good.
- At each house, they deliver **1 unit per inhabitant** (capped by house storage space).
- This deducts from the walker's cargo.

### Cart Walkers

Cart walkers follow a direct A* path between a producer and a receiver building.

| Source | Cargo | Cart Capacity | Speed |
|--------|-------|--------------|-------|
| Farm | Food | 100 | 1.5 tiles/s |
| Fishing Wharf | Fish | 100 | 1.5 tiles/s |
| Granary | Food or Fish | 100 | 1.5 tiles/s |
| Mine | Iron | 100 | 1.5 tiles/s |
| Clay Pit | Clay | 100 | 1.5 tiles/s |
| Lumber Camp | Timber | 100 | 1.5 tiles/s |
| Forge | Utensils | 100 | 1.5 tiles/s |
| Potter | Pottery | 100 | 1.5 tiles/s |
| Carpenter | Furniture | 100 | 1.5 tiles/s |
| Warehouse | Any stored good | 100 | 1.5 tiles/s |

**Cart Walker Behavior:**
1. Spawns when the origin building has ≥100 units of a good to emit (spawn interval: 8s).
2. Finds the best target using the [delivery priority system](#delivery-priority-system).
3. Follows an **A* shortest path** to the target building's road access tile.
4. Delivers all cargo at the destination (excess is lost if target is full).
5. Returns home along the same path (reversed).
6. On return, notifies the origin building the walker slot is free.

### Walker Spawning Requirements

A walker slot is ready to spawn when **all** of these are true:
- The building is **staffed** (has at least base workers needed).
- The slot's **spawn timer** has elapsed.
- The slot's **active count** < effective max walkers for that slot.
- For **cart walkers**: the building has ≥100 units of a good to emit.
- For **service distributors**: the building has goods to distribute.

---

## Building Upgrades

Non-house buildings with walker slots can be **upgraded** to spawn additional walkers.

### How Upgrades Work

- Hold **U** and click a building to upgrade it.
- **Cost** = `floor(base building cost x 0.75) x current level`.
- Each upgrade level unlocks **+1 max walker per slot** (requires extra workers to support).
- Extra workers needed per level: +1 per walker slot (so a building with 2 walker slots needs +2 workers per upgrade level).
- Worker-supported level: `1 + floor(extra workers beyond base / number of walker slots)`.
- Actual effective max walkers = `min(building upgrade level, worker-supported level)`.
- Houses cannot be upgraded this way (they evolve through the coverage system).

---

## Save & Load

- **F5**: Save game to browser localStorage.
- **F9**: Load game from browser localStorage.
- **N** (double-press): Start a new game (resets everything).

The save includes: grid state, all buildings (with coverage, level, storage, evolution progress, walker slot timers), road network, economy, and camera position. Active walkers are **not** saved (they respawn naturally).

---

## Debug Controls & Cheats

| Key | Function |
|-----|----------|
| `O` | Toggle overlay visibility (coverage bars, evolution bars, level indicators, storage bars) |
| `P` | Toggle sprite rendering (switch between pixel art sprites and colored placeholders) |
| `C` | **Cheat**: Add 500 Dn to treasury |

---

## HUD & Overlays

### Sidebar HUD

- **Money**: Gold text showing current Denarii.
- **Population**: Blue text showing total inhabitants.
- **Employment**: Green text showing employed/total ratio.
- **Building Menu**: Category/building selection with costs.
- **Hints**: Control reference at the bottom.

### House Overlays (when overlays enabled)

- **Level Number** (top-left): Current house level (1-5).
- **Coverage Dots** (center): Three colored squares for Water (blue), Religion (purple), Desirability (green) — opacity reflects coverage level.
- **Evolution Bar** (bottom): Center-anchored bar. Green fills right = upgrade progress. Red fills left = downgrade risk. White center line = stable point.
- **Tax Cooldown Bar** (above evolution bar): Gold bar showing time until house can be taxed again.

### Service Building Overlays

- **Employment Bar** (top): Green when fully staffed, orange when understaffed.
- **Building Level** (top-left): Shows "L2", "L3" etc. for upgraded buildings.
- **Storage Bar** (bottom): Shows total goods stored vs. capacity.

### Hover Detail Panel

When hovering any building with storage, a **detail panel** appears showing each good type with:
- Emoji icon for the good.
- Color-coded fill bar.
- Numeric amount.

---

## Tips for Success

1. **Water first**: Ensure every house has adequate water coverage before building other services. No water = no population.
2. **Plan road networks**: Walkers roam randomly, so dense, well-connected road grids maximize coverage. Avoid long dead-end roads.
3. **Separate industrial and residential areas**: Mines, farms, and workshops have negative desirability. Keep them away from houses you want to evolve.
4. **Gardens for evolution**: Place gardens near houses aiming for Villa (L4) or Palace (L5) — desirability is essential.
5. **Balance production chains**: Each level adds new goods requirements. Build the full chain (producer → refiner → warehouse → distributor) before houses need those goods.
6. **Watch your labor pool**: Every production building needs workers. Growing population through house evolution is essential to staff new buildings.
7. **Tax Office early**: You need income to expand. Build a Tax Office as soon as you have a few houses.
8. **Use Granaries and Warehouses as buffers**: They prevent food rot and goods loss by absorbing production spikes.
9. **Upgrade key buildings**: Upgrading temples or markets spawns extra walkers for better coverage.
10. **High-level houses boost neighbors**: Villas and Palaces emit positive desirability, helping nearby houses evolve too.

---

*Last updated: February 2026*
