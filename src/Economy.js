// Economy configuration - all tuneable values in one place
export const ECONOMY_CONFIG = {
    startingMoney: 500,
    taxRate: 0.5,           // coins per person per second
    taxInterval: 1,         // seconds between tax collection
};

export class Economy {
    constructor() {
        this.money = ECONOMY_CONFIG.startingMoney;
        this.population = 0;
        this.employed = 0;
        this.taxTimer = 0;
    }

    get laborPool() {
        return Math.max(0, this.population - this.employed);
    }

    update(deltaTime, buildings) {
        // Recalculate population from houses
        this.recalculatePopulation(buildings);

        // Assign workers to buildings
        this.assignWorkers(buildings);

        // Automatic tax collection removed - now uses Tax Collector walkers
    }

    recalculatePopulation(buildings) {
        let total = 0;
        for (const building of buildings) {
            if (building.getPopulation) {
                total += building.getPopulation();
            }
        }
        this.population = total;
    }

    assignWorkers(buildings) {
        // Reset all worker counts
        for (const building of buildings) {
            building.workers = 0;
        }

        // Get buildings that need workers, sorted by cost (cheaper = higher priority)
        const needsWorkers = buildings
            .filter(b => b.type.workersNeeded > 0)
            .sort((a, b) => a.type.cost - b.type.cost);

        // Assign workers from the labor pool
        let available = this.population;
        let totalEmployed = 0;

        for (const building of needsWorkers) {
            const needed = building.type.workersNeeded;
            const assigned = Math.min(needed, available);
            building.workers = assigned;
            available -= assigned;
            totalEmployed += assigned;
        }

        this.employed = totalEmployed;
    }

    // Called by Tax Collector walker when passing a house
    collectTax(amount) {
        if (amount > 0) {
            this.earn(amount);
            return true;
        }
        return false;
    }

    canAfford(cost) {
        return this.money >= cost;
    }

    spend(cost) {
        if (this.canAfford(cost)) {
            this.money -= cost;
            return true;
        }
        return false;
    }

    earn(amount) {
        this.money += amount;
    }
}
