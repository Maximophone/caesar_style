import { BUILDING_TYPES, HOUSE_LEVELS, GOODS_CONFIG, TAX_COOLDOWN } from './BuildingTypes.js';

export class Building {
    constructor(x, y, type = BUILDING_TYPES.house) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = type.width;
        this.height = type.height;

        // Door position (set by BuildingManager)
        this.doorX = undefined;
        this.doorY = undefined;
        this.roadAccessX = undefined;
        this.roadAccessY = undefined;

        // Unified walker slots (one per config entry)
        this.walkerSlots = (type.walkers || []).map(config => ({
            config,
            spawnTimer: 2,     // Start with a short delay
            activeCount: 0,
        }));

        // Building upgrade level (for buildings with walkers, not houses)
        this.buildingLevel = 1;

        // Employment (for service buildings that need workers)
        this.workers = 0;

        // Service coverage - houses have multiple needs
        if (type.coverageNeeds) {
            // House: needs multiple coverage types
            this.coverageNeeds = {};
            for (const need of type.coverageNeeds) {
                this.coverageNeeds[need] = 0;
            }
            // Add desirability if not already present
            if (!('desirability' in this.coverageNeeds)) {
                this.coverageNeeds.desirability = 0;
            }
            this.maxCoverage = 100;
            this.coverageDecayRate = 5;

            this.tier = 1; // For employment tiers
            // Orientation: 0=South(Front), 1=East(Right), 2=North(Back), 3=West(Left)
            this.rotation = 0;

            // House evolution
            this.level = 1;  // Start as Tent
            this.evolutionProgress = 0.5;  // Start in the middle

            // Tax cooldown
            this.taxCooldown = 0;
        }

        // Storage for goods (from type.goods config)
        const goods = type.goods;
        if (goods && goods.storage) {
            this.storage = {};
            // Initialize all storage slots from config
            for (const [goodType, capacity] of Object.entries(goods.storage)) {
                this.storage[goodType] = 0;
            }
        }
    }

    update(deltaTime, grid) {
        // Tick walker slot timers
        for (const slot of this.walkerSlots) {
            slot.spawnTimer -= deltaTime;
        }

        // Produce goods if this is a producer building
        this.produceGoods(deltaTime, grid);

        // House-specific updates
        if (this.coverageNeeds) {
            // Consume goods from storage
            this.consumeGoods(deltaTime);

            // Update goods-based coverage (e.g. food coverage from food storage)
            this.updateGoodsCoverage();

            // Decay non-food, non-static coverage over time
            for (const need of Object.keys(this.coverageNeeds)) {
                // Water, Desirability, and Goods-based coverage use static levels or storage, not decay
                if (['water', 'desirability', 'food', 'fish', 'pottery', 'utensils', 'furniture'].includes(need)) continue;

                if (this.coverageNeeds[need] > 0) {
                    this.coverageNeeds[need] = Math.max(0, this.coverageNeeds[need] - this.coverageDecayRate * deltaTime);
                }
            }

            // Update house evolution
            this.updateEvolution(deltaTime);

            // Update tax cooldown
            if (this.taxCooldown > 0) {
                this.taxCooldown -= deltaTime;
            }
        }
    }

    // Pay tax to collector
    payTax() {
        if (!this.coverageNeeds) return 0; // Only houses pay tax (for now)
        if (this.taxCooldown > 0) return 0;

        const population = this.getPopulation();
        if (population <= 0) return 0;

        // Get multiplier from house level
        const levelConfig = HOUSE_LEVELS[this.level];
        const multiplier = levelConfig ? (levelConfig.taxMultiplier || 1) : 1;

        // coin per person * multiplier
        const taxAmount = population * multiplier;

        // Reset cooldown (prevent multi-collection per walker pass or multiple walkers spammed)
        // 20 seconds cooldown
        this.taxCooldown = TAX_COOLDOWN;

        return taxAmount;
    }

    // Consume goods based on type.goods.consumes config OR per-level config
    consumeGoods(deltaTime) {
        const levelConfig = HOUSE_LEVELS[this.level];
        const consumes = (levelConfig && levelConfig.consumes) || this.type.goods?.consumes;
        if (!consumes || !this.storage) return;

        const population = this.getPopulation ? this.getPopulation() : 0;
        if (population <= 0) return;

        for (const [goodType, ratePerPop] of Object.entries(consumes)) {
            const consumption = ratePerPop * population * deltaTime;
            this.storage[goodType] = Math.max(0, (this.storage[goodType] || 0) - consumption);
        }
    }

    // Update coverage needs based on goods storage fullness
    updateGoodsCoverage() {
        if (!this.coverageNeeds || !this.storage) return;

        // Update coverage for all goods in storage that correspond to a coverage need
        for (const [goodType, amount] of Object.entries(this.storage)) {
            if (!(goodType in this.coverageNeeds)) continue;

            const capacity = this.getMaxStorage(goodType);
            if (capacity <= 0) {
                this.coverageNeeds[goodType] = 0;
                continue;
            }

            this.coverageNeeds[goodType] = (amount / capacity) * this.maxCoverage;
        }
    }

    // House evolution mechanic
    updateEvolution(deltaTime) {
        const levelConfig = HOUSE_LEVELS[this.level];
        if (!levelConfig) return;

        const levels = this.getCoverageLevels();
        const evolutionSpeed = 0.05;  // Progress per second
        const maxLevel = HOUSE_LEVELS.length - 1;

        // Check if we meet requirements for current level
        const meetsCurrentRequirements = this.meetsLevelRequirements(this.level, levels);

        if (!meetsCurrentRequirements) {
            // Not meeting requirements - evolution bar drops
            this.evolutionProgress -= evolutionSpeed * deltaTime;
        } else {
            // Meeting requirements - check if we're exceeding (upgrade progress)
            // Evolution bar fills if we are exceeding current requirements, regardless of whether a next level exists
            const surplus = this.calculateSurplus(this.level, levels);
            if (surplus > 0) {
                // Doing better than needed - bar fills
                this.evolutionProgress += evolutionSpeed * surplus * deltaTime;
            }
            // If we are exactly at requirements, bar stays stable
        }

        // Handle level changes
        if (this.evolutionProgress >= 1.0 && this.level < maxLevel) {
            // Check if we actually meet next level requirements before upgrading
            if (this.meetsLevelRequirements(this.level + 1, levels)) {
                // Upgrade!
                this.level++;
                this.evolutionProgress = 0.5;  // Reset to middle at new level
            } else {
                // Can't upgrade - cap at 1.0
                this.evolutionProgress = 1.0;
            }
        } else if (this.evolutionProgress <= 0.0 && this.level > 1) {
            // Downgrade!
            this.level--;
            this.evolutionProgress = 0.5;  // Reset to middle at lower level
        }

        // Clamp between 0 and 1
        this.evolutionProgress = Math.max(0, Math.min(1, this.evolutionProgress));
    }

    // Check if house meets requirements for a given level
    meetsLevelRequirements(level, coverageLevels) {
        const config = HOUSE_LEVELS[level];
        if (!config) return false;

        for (const [serviceType, threshold] of Object.entries(config.requirements)) {
            const current = coverageLevels[serviceType] || 0;
            if (current < threshold) {
                return false;  // Missing a required service
            }
        }
        return true;
    }

    // Calculate how much we exceed requirements (for upgrade progress)
    calculateSurplus(level, coverageLevels) {
        const config = HOUSE_LEVELS[level];
        if (!config || !config.upgradeThreshold) return 0;

        // For upgrade, all required services must be above upgradeThreshold
        let minSurplus = Infinity;
        for (const [serviceType, threshold] of Object.entries(config.requirements)) {
            const current = coverageLevels[serviceType] || 0;
            const upgradeTarget = config.upgradeThreshold;
            const surplus = (current - threshold) / (upgradeTarget - threshold);
            minSurplus = Math.min(minSurplus, surplus);
        }

        return minSurplus === Infinity ? 0 : Math.max(0, minSurplus);
    }

    // Check if building has enough workers to function at base level
    isStaffed() {
        const base = this.type.workersNeeded || 0;
        return this.workers >= base;
    }

    // Get effective workers needed for FULL capacity (accounts for building upgrades)
    getEffectiveWorkersNeeded() {
        const base = this.type.workersNeeded || 0;
        if (this.walkerSlots.length === 0) return base;
        // Each upgrade level adds 1 extra walker per slot = that many extra workers
        const extraWalkers = (this.buildingLevel - 1) * this.walkerSlots.length;
        return base + extraWalkers;
    }

    // Get effective max walkers for a given slot, based on building level AND current workers
    // Base workers support 1 walker/slot. Each extra (walkerSlots.length) workers unlocks +1/slot.
    getEffectiveWalkerMax(slotIndex) {
        const slot = this.walkerSlots[slotIndex];
        if (!slot) return 0;

        const base = this.type.workersNeeded || 0;
        const numSlots = this.walkerSlots.length;
        // How many extra workers beyond base do we have?
        const extraWorkers = Math.max(0, this.workers - base);
        // Each set of numSlots extra workers unlocks +1 walker per slot
        const workerSupportedLevel = 1 + Math.floor(extraWorkers / numSlots);
        // Cap by the building's upgrade level
        return Math.min(this.buildingLevel, workerSupportedLevel);
    }

    // Check if this building can be upgraded
    canUpgrade() {
        return this.walkerSlots.length > 0 && !this.coverageNeeds;
    }

    // Get cost to upgrade to the next level
    getUpgradeCost() {
        const baseCost = this.type.upgradeCost || Math.floor(this.type.cost * 0.75);
        return baseCost * this.buildingLevel;
    }

    // Check if a walker slot is ready to spawn
    isWalkerSlotReady(slotIndex) {
        const slot = this.walkerSlots[slotIndex];
        if (!slot) return false;

        const { config } = slot;

        // Must be staffed
        if (!this.isStaffed()) return false;

        // Timer must have elapsed
        if (slot.spawnTimer > 0) return false;

        // Must not exceed max active (based on building upgrade level)
        if (slot.activeCount >= this.getEffectiveWalkerMax(slotIndex)) return false;

        // Cart walkers need goods to emit
        if (config.type === 'cart') {
            if (!this.hasGoodsToEmit()) return false;
        }

        // Service walkers with distributes need goods to distribute
        if (config.type === 'service' && this.type.goods?.distributes) {
            if (!this.hasGoodsToDistribute()) return false;
        }

        return true;
    }

    onWalkerSpawned(slotIndex) {
        const slot = this.walkerSlots[slotIndex];
        if (!slot) return;
        slot.spawnTimer = slot.config.spawnInterval;
        slot.activeCount++;
    }

    onWalkerReturned(slotIndex) {
        const slot = this.walkerSlots[slotIndex];
        if (!slot) return;
        slot.activeCount = Math.max(0, slot.activeCount - 1);
    }

    // Called when a walker passes nearby - sets to full
    receiveCoverage(coverageType) {
        if (this.coverageNeeds && coverageType in this.coverageNeeds) {
            this.coverageNeeds[coverageType] = this.maxCoverage;
        }
    }

    // Called by static coverage sources - adds amount (cumulative, clamped to [0, max])
    addCoverage(coverageType, amount) {
        if (this.coverageNeeds && coverageType in this.coverageNeeds) {
            this.coverageNeeds[coverageType] = Math.max(0, Math.min(
                this.maxCoverage,
                this.coverageNeeds[coverageType] + amount
            ));
        }
    }

    // Get average coverage as 0-1 for rendering (houses only)
    getCoveragePercent() {
        if (!this.coverageNeeds) return 1; // Service buildings always show full

        const values = Object.values(this.coverageNeeds);
        if (values.length === 0) return 1;

        const sum = values.reduce((a, b) => a + b, 0);
        return sum / (values.length * this.maxCoverage);
    }

    // Get individual coverage levels for detailed display
    getCoverageLevels() {
        if (!this.coverageNeeds) return null;

        const levels = {};
        for (const [type, value] of Object.entries(this.coverageNeeds)) {
            levels[type] = value / this.maxCoverage;
        }
        return levels;
    }

    // Get population based on house level
    getPopulation() {
        if (!this.coverageNeeds) return 0; // Service buildings have no population

        // Must have water to have any population
        const waterLevel = this.coverageNeeds.water / this.maxCoverage;

        const minWater = HOUSE_LEVELS[1].requirements.water;
        if (waterLevel < minWater) return 0;

        // Population based on house level
        const config = HOUSE_LEVELS[this.level];
        return config ? config.population : 1;
    }

    // Get house level name for display
    getLevelName() {
        const config = HOUSE_LEVELS[this.level];
        return config ? config.name : 'Tent';
    }

    // Get house color based on level
    getLevelColor() {
        const config = HOUSE_LEVELS[this.level];
        return config ? config.color : this.type.color;
    }

    // ===== GOODS PRODUCTION & STORAGE =====

    // Get max storage for a good type from config
    getMaxStorage(goodType) {
        const base = this.type.goods?.storage?.[goodType] || 0;
        if (this.type.goods?.dynamicCapacity) {
            const population = this.getPopulation ? this.getPopulation() : 0;
            return base * population;
        }
        return base;
    }

    // Produce goods (for farms) - called each frame
    produceGoods(deltaTime, grid) {
        const produces = this.type.goods?.produces;
        if (!produces || !this.storage) return;
        if (!this.isStaffed()) return;

        // Calculate efficiency based on resource coverage
        let efficiency = 1.0;
        if (this.type.requiredResource && grid) {
            let matchedTiles = 0;
            const totalTiles = this.width * this.height;

            for (let dy = 0; dy < this.height; dy++) {
                for (let dx = 0; dx < this.width; dx++) {
                    const resource = grid.getResource(this.x + dx, this.y + dy);
                    if (resource === this.type.requiredResource) {
                        matchedTiles++;
                    }
                }
            }

            efficiency = matchedTiles / totalTiles;
        }

        // Produce each good type
        for (const [goodType, rate] of Object.entries(produces)) {
            let amount = rate * efficiency * deltaTime;

            // Limit amount by available storage space
            const maxStorage = this.getMaxStorage(goodType);
            const currentStorage = this.storage[goodType] || 0;
            const spaceAvailable = maxStorage - currentStorage;
            if (amount > spaceAvailable) {
                amount = Math.max(0, spaceAvailable);
            }

            // Manufacturing: Check and consume production costs (inputs)
            const costs = this.type.goods?.productionCost;
            if (costs && amount > 0) {
                // First pass: limit amount based on available inputs
                for (const [inputGood, costPerUnit] of Object.entries(costs)) {
                    const inputNeeded = amount * costPerUnit;
                    const storedInput = this.storage[inputGood] || 0;
                    if (storedInput < inputNeeded) {
                        amount = storedInput / costPerUnit;
                    }
                }

                // Second pass: consume inputs
                for (const [inputGood, costPerUnit] of Object.entries(costs)) {
                    const inputConsumed = amount * costPerUnit;
                    this.storage[inputGood] = Math.max(0, (this.storage[inputGood] || 0) - inputConsumed);
                }
            }

            if (amount > 0) {
                this.storage[goodType] = Math.min(
                    maxStorage,
                    (this.storage[goodType] || 0) + amount
                );
            }
        }
    }

    // Check if building has goods to emit via cart walkers
    hasGoodsToEmit() {
        const emits = this.type.goods?.emits;
        if (!emits || !this.storage) return false;

        for (const goodType of emits) {
            if ((this.storage[goodType] || 0) >= GOODS_CONFIG.CART_CAPACITY) return true;
        }
        return false;
    }

    // Take goods from storage for cart walker
    takeGoodsForCart() {
        const emits = this.type.goods?.emits;
        if (!emits || !this.storage) return { type: null, amount: 0 };

        // Find the first emittable good with enough stock
        for (const goodType of emits) {
            const available = this.storage[goodType] || 0;
            if (available >= GOODS_CONFIG.CART_CAPACITY) {
                const amount = Math.min(available, GOODS_CONFIG.CART_CAPACITY);
                this.storage[goodType] -= amount;
                return { type: goodType, amount };
            }
        }

        return { type: null, amount: 0 };
    }

    // Receive goods from a cart walker
    receiveGoods(goodType, amount) {
        if (!this.storage) return 0;
        if (!this.type.goods?.receives?.includes(goodType)) return 0;

        const current = this.storage[goodType] || 0;
        const maxStorage = this.getMaxStorage(goodType);
        const space = maxStorage - current;
        const received = Math.min(amount, space);

        this.storage[goodType] = current + received;
        return received;
    }

    // Check if building has goods to distribute via service walkers
    hasGoodsToDistribute(specificGood = null) {
        const distributes = this.type.goods?.distributes;
        if (!distributes || !this.storage) return false;

        if (specificGood) {
            return distributes.includes(specificGood) && (this.storage[specificGood] || 0) > 0;
        }

        for (const goodType of distributes) {
            if ((this.storage[goodType] || 0) > 0) return true;
        }
        return false;
    }

    // Take goods for distributor (service) walker
    takeGoodsForDistributor(specificGood = null) {
        const distributes = this.type.goods?.distributes;
        if (!distributes || !this.storage) return { type: null, amount: 0 };

        // If specific good requested (e.g. market walker for utensils), try to take that
        if (specificGood) {
            if (distributes.includes(specificGood)) {
                const available = this.storage[specificGood] || 0;
                if (available > 0) {
                    const amount = Math.min(available, GOODS_CONFIG.DISTRIBUTOR_CAPACITY);
                    this.storage[specificGood] -= amount;
                    return { type: specificGood, amount };
                }
            }
            return { type: null, amount: 0 };
        }

        // Take the first distributable good
        for (const goodType of distributes) {
            const available = this.storage[goodType] || 0;
            if (available > 0) {
                const amount = Math.min(available, GOODS_CONFIG.DISTRIBUTOR_CAPACITY);
                this.storage[goodType] -= amount;
                return { type: goodType, amount };
            }
        }

        return { type: null, amount: 0 };
    }

    // Return leftover goods from distributor walker
    returnGoods(goodType, amount) {
        if (!this.storage) return;
        this.storage[goodType] = (this.storage[goodType] || 0) + amount;
    }

    // Get storage percentage for rendering
    getStoragePercent(goodType) {
        const maxStorage = this.getMaxStorage(goodType);
        if (!this.storage || maxStorage <= 0) return 0;
        return (this.storage[goodType] || 0) / maxStorage;
    }

    // ===== SAVE / LOAD =====

    /** Serialize this building to a plain object for saving. */
    toJSON() {
        const data = {
            x: this.x,
            y: this.y,
            typeId: this.type.id,
            doorX: this.doorX,
            doorY: this.doorY,
            roadAccessX: this.roadAccessX,
            roadAccessY: this.roadAccessY,
            rotation: this.rotation || 0,
            buildingLevel: this.buildingLevel,
        };

        // Walker slot timers (drop activeCount — walkers are transient)
        data.walkerSlots = this.walkerSlots.map(s => ({
            spawnTimer: s.spawnTimer,
        }));

        // House-specific state
        if (this.coverageNeeds) {
            data.coverageNeeds = { ...this.coverageNeeds };
            data.level = this.level;
            data.evolutionProgress = this.evolutionProgress;
            data.taxCooldown = this.taxCooldown;
        }

        // Storage
        if (this.storage) {
            data.storage = { ...this.storage };
        }

        return data;
    }

    /**
     * Create a Building from saved data.
     * @param {object} data - Plain object from toJSON()
     * @param {object} type - The BUILDING_TYPES entry matching data.typeId
     */
    static fromSaveData(data, type) {
        const b = new Building(data.x, data.y, type);

        b.doorX = data.doorX;
        b.doorY = data.doorY;
        b.roadAccessX = data.roadAccessX;
        b.roadAccessY = data.roadAccessY;
        b.rotation = data.rotation || 0;
        b.buildingLevel = data.buildingLevel || 1;

        // Restore walker slot timers (activeCount starts at 0 — no active walkers)
        if (data.walkerSlots) {
            for (let i = 0; i < b.walkerSlots.length && i < data.walkerSlots.length; i++) {
                b.walkerSlots[i].spawnTimer = data.walkerSlots[i].spawnTimer;
            }
        }

        // House-specific state
        if (data.coverageNeeds) {
            b.coverageNeeds = { ...data.coverageNeeds };
            b.level = data.level;
            b.evolutionProgress = data.evolutionProgress;
            b.taxCooldown = data.taxCooldown || 0;
        }

        // Storage
        if (data.storage) {
            b.storage = { ...data.storage };
        }

        return b;
    }
}
