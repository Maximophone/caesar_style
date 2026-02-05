export class Building {
    constructor(x, y, width = 2, height = 2) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        // Door position (set by BuildingManager)
        this.doorX = undefined;
        this.doorY = undefined;
        this.roadAccessX = undefined;
        this.roadAccessY = undefined;

        // Walker spawning
        this.spawnInterval = 5; // seconds
        this.spawnTimer = 2;    // Start with a short delay
        this.maxWalkers = 3;
        this.activeWalkers = 0;

        // Service coverage
        this.coverage = 0;           // 0-100
        this.maxCoverage = 100;
        this.coverageDecayRate = 5;  // per second (~20 sec to empty)
    }

    update(deltaTime) {
        this.spawnTimer -= deltaTime;

        // Decay coverage over time
        if (this.coverage > 0) {
            this.coverage = Math.max(0, this.coverage - this.coverageDecayRate * deltaTime);
        }
    }

    shouldSpawnWalker() {
        return this.spawnTimer <= 0 && this.activeWalkers < this.maxWalkers;
    }

    onWalkerSpawned() {
        this.spawnTimer = this.spawnInterval;
        this.activeWalkers++;
    }

    onWalkerReturned() {
        this.activeWalkers = Math.max(0, this.activeWalkers - 1);
    }

    // Called when a walker passes nearby
    receiveCoverage() {
        this.coverage = this.maxCoverage;
    }

    // Get coverage as 0-1 for rendering
    getCoveragePercent() {
        return this.coverage / this.maxCoverage;
    }
}
