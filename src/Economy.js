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
        this.taxTimer = 0;
    }

    update(deltaTime, buildings) {
        // Recalculate population from houses
        this.recalculatePopulation(buildings);

        // Collect taxes periodically
        this.taxTimer += deltaTime;
        if (this.taxTimer >= ECONOMY_CONFIG.taxInterval) {
            this.taxTimer -= ECONOMY_CONFIG.taxInterval;
            this.collectTaxes();
        }
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

    collectTaxes() {
        const taxIncome = Math.floor(this.population * ECONOMY_CONFIG.taxRate);
        if (taxIncome > 0) {
            this.earn(taxIncome);
        }
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
