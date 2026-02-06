import { BUILDING_TYPES } from './BuildingTypes.js';

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
        this.maxWalkers = 3;
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
            this.maxCoverage = 100;
            this.coverageDecayRate = 5;
        }
    }

    update(deltaTime) {
        this.spawnTimer -= deltaTime;

        // Decay coverage over time
        if (this.coverageNeeds) {
            for (const need of Object.keys(this.coverageNeeds)) {
                if (this.coverageNeeds[need] > 0) {
                    this.coverageNeeds[need] = Math.max(0, this.coverageNeeds[need] - this.coverageDecayRate * deltaTime);
                }
            }
        }
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

    // Called when a walker passes nearby or by static coverage
    receiveCoverage(coverageType) {
        if (this.coverageNeeds && coverageType in this.coverageNeeds) {
            this.coverageNeeds[coverageType] = this.maxCoverage;
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

    // Get population for houses (1-5 based on coverage)
    // Minimum 1 to solve chicken/egg problem
    getPopulation() {
        if (!this.coverageNeeds) return 0; // Service buildings have no population

        const coverage = this.getCoveragePercent();
        // Minimum 1 pop, scale up to 5 with full coverage
        return 1 + Math.floor(coverage * 4);
    }
}
