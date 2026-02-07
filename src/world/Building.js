import { BUILDING_TYPES, HOUSE_LEVELS, GOODS_CONFIG } from './BuildingTypes.js';

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

        // Walker spawning (only for service buildings)
        this.spawnInterval = 5; // seconds
        this.spawnTimer = 2;    // Start with a short delay
        this.maxWalkers = type.maxWalkers || 1;  // From config, default 1
        this.activeWalkers = 0;

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

            // House food storage - capacity scales with population
            this.foodStorage = 0;
        }

        // Storage for goods (farms, markets)
        if (type.maxStorage) {
            this.storage = {};
            this.maxStorage = type.maxStorage;

            // Initialize storage for produced goods
            if (type.produces) {
                this.storage[type.produces] = 0;
            }
            // Initialize storage for accepted goods
            if (type.acceptsGoods) {
                for (const good of type.acceptsGoods) {
                    this.storage[good] = 0;
                }
            }
        }

        // Cart walker spawning (for producers like farms)
        this.cartSpawnTimer = 3;  // Start with a short delay
        this.cartSpawnInterval = 8;
        this.activeCartWalkers = 0;
    }

    update(deltaTime) {
        this.spawnTimer -= deltaTime;
        this.cartSpawnTimer -= deltaTime;

        // Produce goods if this is a producer building
        this.produceGoods(deltaTime);

        // House-specific updates
        if (this.coverageNeeds) {
            // Consume food from storage
            this.consumeFood(deltaTime);

            // Update food coverage based on storage fullness
            this.updateFoodCoverage();

            // Decay non-food, non-static coverage over time
            for (const need of Object.keys(this.coverageNeeds)) {
                // Water and Desirability use static coverage (reset each frame by BuildingManager)
                // Food is now based on foodStorage, not decay
                if (need === 'water' || need === 'desirability' || need === 'food') continue;

                if (this.coverageNeeds[need] > 0) {
                    this.coverageNeeds[need] = Math.max(0, this.coverageNeeds[need] - this.coverageDecayRate * deltaTime);
                }
            }

            // Update house evolution
            this.updateEvolution(deltaTime);
        }
    }

    // Consume food from house storage
    consumeFood(deltaTime) {
        if (this.foodStorage === undefined) return;

        const population = this.getPopulation();
        if (population <= 0) return;

        // Consume food: rate * population * time
        const consumption = GOODS_CONFIG.HOUSE_FOOD_CONSUMPTION_RATE * population * deltaTime;
        this.foodStorage = Math.max(0, this.foodStorage - consumption);
    }

    // Update food coverage based on storage fullness
    updateFoodCoverage() {
        if (this.foodStorage === undefined || !this.coverageNeeds) return;

        const capacity = this.getFoodCapacity();
        if (capacity <= 0) {
            this.coverageNeeds.food = 0;
            return;
        }

        // Food coverage = percentage of capacity filled
        this.coverageNeeds.food = (this.foodStorage / capacity) * this.maxCoverage;
    }

    // Get food storage capacity (scales with population)
    getFoodCapacity() {
        const population = this.getPopulation();
        return population * GOODS_CONFIG.HOUSE_FOOD_PER_INHABITANT;
    }

    // Receive food delivery from distributor walker
    receiveFoodDelivery(amount) {
        if (this.foodStorage === undefined) return 0;

        const capacity = this.getFoodCapacity();
        const space = capacity - this.foodStorage;
        const received = Math.min(amount, space);

        this.foodStorage += received;
        return received;  // Return amount actually received
    }

    // House evolution mechanic
    updateEvolution(deltaTime) {
        const levelConfig = HOUSE_LEVELS[this.level];
        if (!levelConfig) return;

        const levels = this.getCoverageLevels();
        const evolutionSpeed = 0.05;  // Progress per second

        // Check if we meet requirements for current level
        const meetsCurrentRequirements = this.meetsLevelRequirements(this.level, levels);

        if (!meetsCurrentRequirements) {
            // Not meeting requirements - evolution bar drops
            this.evolutionProgress -= evolutionSpeed * deltaTime;
        } else {
            // Meeting requirements - check if we're exceeding (upgrade progress)
            // ONLY count surplus if we can actually upgrade (next level exists and requirements met)
            const canUpgrade = this.level < 4 && this.meetsLevelRequirements(this.level + 1, levels);

            if (canUpgrade) {
                const surplus = this.calculateSurplus(this.level, levels);
                if (surplus > 0) {
                    // Doing better than needed AND can upgrade - bar fills
                    this.evolutionProgress += evolutionSpeed * surplus * deltaTime;
                }
            }
            // If we can't upgrade (missing next level's requirements), bar stays stable
        }

        // Handle level changes
        if (this.evolutionProgress >= 1.0 && this.level < 4) {
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

    // Check if building has enough workers to function
    isStaffed() {
        const needed = this.type.workersNeeded || 0;
        return this.workers >= needed;
    }

    shouldSpawnWalker() {
        return this.type.spawnsWalker &&
            this.isStaffed() &&
            this.spawnTimer <= 0 &&
            this.activeWalkers < this.maxWalkers;
    }

    onWalkerSpawned() {
        this.spawnTimer = this.spawnInterval;
        this.activeWalkers++;
    }

    onWalkerReturned() {
        this.activeWalkers = Math.max(0, this.activeWalkers - 1);
    }

    // Called when a walker passes nearby - sets to full
    receiveCoverage(coverageType) {
        if (this.coverageNeeds && coverageType in this.coverageNeeds) {
            this.coverageNeeds[coverageType] = this.maxCoverage;
        }
    }

    // Called by static coverage sources - adds amount (cumulative, capped at max)
    addCoverage(coverageType, amount) {
        if (this.coverageNeeds && coverageType in this.coverageNeeds) {
            this.coverageNeeds[coverageType] = Math.min(
                this.maxCoverage,
                this.coverageNeeds[coverageType] + amount
            );
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
        if (waterLevel < 0.5) return 0;

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

    // Produce goods (for farms) - called each frame
    produceGoods(deltaTime) {
        if (!this.type.produces || !this.storage) return;
        if (!this.isStaffed()) return;

        const goodType = this.type.produces;
        const rate = this.type.productionRate || 1;
        const amount = rate * deltaTime;

        // Add to storage, capped at max
        this.storage[goodType] = Math.min(
            this.maxStorage,
            (this.storage[goodType] || 0) + amount
        );
    }

    // Check if this building should spawn a cart walker
    shouldSpawnCartWalker() {
        if (!this.type.produces || !this.storage) return false;
        if (!this.isStaffed()) return false;
        if (this.cartSpawnTimer > 0) return false;
        if (this.activeCartWalkers > 0) return false;  // Only one cart at a time

        const goodType = this.type.produces;
        return (this.storage[goodType] || 0) >= GOODS_CONFIG.CART_CAPACITY;
    }

    // Take goods from storage for cart walker
    takeGoodsForCart() {
        if (!this.type.produces || !this.storage) return { type: null, amount: 0 };

        const goodType = this.type.produces;
        const available = this.storage[goodType] || 0;
        const amount = Math.min(available, GOODS_CONFIG.CART_CAPACITY);

        this.storage[goodType] -= amount;
        return { type: goodType, amount };
    }

    onCartWalkerSpawned() {
        this.cartSpawnTimer = this.cartSpawnInterval;
        this.activeCartWalkers++;
    }

    onCartWalkerReturned() {
        this.activeCartWalkers = Math.max(0, this.activeCartWalkers - 1);
    }

    // Receive goods from a cart walker (for markets)
    receiveGoods(goodType, amount) {
        if (!this.storage) return 0;
        if (!this.type.acceptsGoods?.includes(goodType)) return 0;

        const current = this.storage[goodType] || 0;
        const space = this.maxStorage - current;
        const received = Math.min(amount, space);

        this.storage[goodType] = current + received;
        return received;  // Return amount actually received
    }

    // Check if market has goods to distribute
    hasGoodsToDistribute() {
        if (!this.storage || !this.type.acceptsGoods) return false;

        for (const goodType of this.type.acceptsGoods) {
            if ((this.storage[goodType] || 0) > 0) return true;
        }
        return false;
    }

    // Take goods from market for distributor walker
    takeGoodsForDistributor() {
        if (!this.storage || !this.type.acceptsGoods) return { type: null, amount: 0 };

        // Take food (the primary good for markets)
        const goodType = 'food';
        const available = this.storage[goodType] || 0;
        const amount = Math.min(available, GOODS_CONFIG.DISTRIBUTOR_CAPACITY);

        this.storage[goodType] -= amount;
        return { type: goodType, amount };
    }

    // Return leftover goods from distributor walker
    returnGoods(goodType, amount) {
        if (!this.storage) return;
        this.storage[goodType] = (this.storage[goodType] || 0) + amount;
    }

    // Get storage percentage for rendering
    getStoragePercent(goodType) {
        if (!this.storage || !this.maxStorage) return 0;
        return (this.storage[goodType] || 0) / this.maxStorage;
    }
}
